import { MongoClient } from 'mongodb';
import logger from '../logger.js';
// import logger from "./logger.js";

class MongoDBService {
  constructor() {
    this.client = null;
    this.db = null;
    this.collection = null;
  }

  async connect(dbName, collectionName) {
    try {
      const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
      this.client = new MongoClient(uri);
      await this.client.connect();
      this.db = this.client.db(dbName);
      this.collection = this.db.collection(collectionName);
      logger.info(`Connected successfully to MongoDB database: ${dbName}`);
    } catch (error) {
      console.error({ error });
      logger.error('MongoDB connection error:', error);
      throw error;
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.close();
      logger.info('Disconnected from MongoDB');
    }
  }

  async insertRecord(data) {
    try {
      const result = await this.collection.insertOne(data);
      logger.info(`Inserted record with ID: ${result.insertedId}`);
      return result.insertedId;
    } catch (error) {
      logger.error('Error inserting record:', error);
      throw error;
    }
  }

  async getLatestSerialNumber() {
    try {
      const latestRecord = await this.collection.find().sort({ Timestamp: -1 }).limit(1).toArray();
      if (latestRecord.length > 0) {
        return parseInt(latestRecord[0].SerialNumber, 10);
      }
      return 0;
    } catch (error) {
      logger.error('Error getting latest serial number:', error);
      throw error;
    }
  }

  async getRecordsByDateRange(startDate, endDate) {
    try {
      // Create end of day timestamp for the endDate
      const endOfDay = new Date(endDate);
      endOfDay.setHours(23, 59, 59, 999);

      return await this.collection
        .find({
          Timestamp: { $gte: new Date(startDate), $lte: endOfDay },
        })
        .toArray();
    } catch (error) {
      logger.error('Error getting records by date range:', error);
      throw error;
    }
  }

  async getRecordsByShift(shift, date) {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      return await this.collection
        .find({
          Shift: shift,
          Timestamp: { $gte: startOfDay, $lte: endOfDay },
        })
        .toArray();
    } catch (error) {
      logger.error('Error getting records by shift:', error);
      throw error;
    }
  }

  async updateRecord(id, updateData) {
    try {
      const result = await this.collection.updateOne({ _id: id }, { $set: updateData });
      logger.info(`Updated ${result.modifiedCount} record(s)`);
      return result.modifiedCount;
    } catch (error) {
      logger.error('Error updating record:', error);
      throw error;
    }
  }

  // Helper function to safely emit socket events
  safeEmit(socket, event, data) {
    try {
      // Check if socket exists and is connected
      if (!socket) {
        logger.warn('Cannot emit event: socket is null or undefined');
        return false;
      }

      // Check if socket is connected (socket.io has connected property)
      if (socket.connected === false && socket.disconnected === true) {
        logger.warn(`Cannot emit event '${event}': socket is disconnected`);
        return false;
      }

      // Emit the event
      socket.emit(event, data);
      return true;
    } catch (error) {
      logger.error(`Error emitting socket event '${event}':`, error.message);
      return false;
    }
  }

  async sendMongoDbDataToClient(socket, dbName, collectionName) {
    try {
      // Validate socket before proceeding
      if (!socket) {
        logger.error('sendMongoDbDataToClient called without a valid socket');
        return;
      }

      // Check if we're connected to the database, if not, try to connect
      if (!this.collection) {
        logger.info('MongoDB connection not established. Attempting to connect...');
        if (!dbName || !collectionName) {
          throw new Error('Database name and collection name are required for connection');
        }
        await this.connect(dbName, collectionName);
      }

      // Calculate current day range (starting from 6 AM)
      const now = new Date();
      const startOfDay = new Date(now);
      startOfDay.setHours(6, 0, 0, 0); // Start counting from 6 AM

      // If current time is before 6 AM, consider it part of previous day
      if (now.getHours() < 6) {
        startOfDay.setDate(startOfDay.getDate() - 1);
      }

      // End of current production day (6 AM next day)
      const endOfDay = new Date(startOfDay);
      endOfDay.setDate(endOfDay.getDate() + 1);

      // First, try to get current day records
      const currentDayData = await this.collection
        .find({
          Timestamp: {
            $gte: startOfDay,
            $lt: endOfDay,
          },
        })
        .sort({ Timestamp: -1 })
        .toArray();

      let data;

      // If current day has fewer than 100 records, get recent records to fill the display
      if (currentDayData.length < 100) {
        logger.info(
          `Current day has only ${currentDayData.length} records. Fetching recent records to fill display.`,
        );
        data = await this.collection.find({}).sort({ Timestamp: -1 }).limit(5000).toArray();
      } else {
        // Use current day data if we have enough records
        data = currentDayData;
        logger.info(`Found ${currentDayData.length} records for current production day.`);
      }

      if (data.length === 0) {
        logger.info('No data found in MongoDB collection.');
        socket.emit('mongodb-data', { data: [] });
        return;
      }

      // Transform the data
      const transformedData = data.map((item) => ({
        Timestamp: item?.Timestamp,
        SerialNumber: item?.SerialNumber,
        MarkingData: item?.MarkingData,
        ScannerData: item?.ScannerData,
        ModelNumber: item?.ModelNumber,
        Result: item?.Result,
        User: item?.User,
        Shift: item?.Shift,
        Date: item?.Date,
      }));

      // console.log({ transformedData });

      // Send the data to the client with additional metadata
      socket.emit('csv-data', {
        data: transformedData,
        currentDayRecords: currentDayData.length,
        isCurrentDayOnly: currentDayData.length >= 100,
        productionDayStart: startOfDay.toISOString(),
      });
      logger.info(
        `Emitted MongoDB data to client: ${socket.id} (${transformedData.length} total records, ${currentDayData.length} current day records)`,
      );
    } catch (error) {
      console.error({ error });
      logger.error('Error in sendMongoDbDataToClient: ', error.message);
      socket.emit('error', { message: 'Error fetching data from database' });
    }
  }

  async savePartNumber(partNo) {
    try {
      // Delete the existing document in the collection to ensure only one record exists
      await this.collection.deleteMany({}); // Clears the entire collection

      // Insert the new part number
      const result = await this.collection.insertOne({
        partNo,
        createdAt: new Date(),
      });

      logger.info(`Inserted new part number with ID: ${result.insertedId}`);
      return result.insertedId;
    } catch (error) {
      logger.error('Error saving part number:', error);
      throw error;
    }
  }
}

export default new MongoDBService();
