import { NextResponse } from 'next/server';
import mongoDbService from '../../../../../services/mongoDbService';
import logger from '../../../../../logger';

export async function POST(request) {
  try {
    // First, ensure MongoDB is connected
    try {
      if (!mongoDbService.collection) {
        logger.info('Connecting to MongoDB...');
        await mongoDbService.connect('main-data', 'records');
      }
      
      if (!mongoDbService.collection) {
        throw new Error('Failed to establish MongoDB connection');
      }
    } catch (connError) {
      logger.error('MongoDB connection error:', connError);
      return NextResponse.json({ 
        error: 'Database connection failed', 
        details: connError.message 
      }, { status: 500 });
    }

    // Get current date at midnight
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Get today's 6 AM
    const today6AM = new Date(today);
    today6AM.setHours(6, 0, 0, 0);

    // If current time is before 6 AM, adjust to previous day's 6 AM
    if (now.getHours() < 6) {
      today6AM.setDate(today6AM.getDate() - 1);
    }

    // Get next 6 AM
    const next6AM = new Date(today6AM);
    next6AM.setDate(next6AM.getDate() + 1);

    logger.info(`Querying from ${today6AM.toISOString()} to ${next6AM.toISOString()}`);

    // Verify collection access
    const testCount = await mongoDbService.collection.countDocuments({});
    logger.info(`Total documents in collection: ${testCount}`);

    const pipeline = [
      {
        $match: {
          Timestamp: {
            $gte: today6AM,
            $lt: next6AM,
          }
        }
      },
      {
        $project: {
          hour: { $hour: "$Timestamp" },
          Result: 1
        }
      },
      {
        $group: {
          _id: {
            hour: "$hour",
            result: "$Result"
          },
          count: { $sum: 1 }
        }
      }
    ];

    const rawResults = await mongoDbService.collection.aggregate(pipeline).toArray();
    logger.info('Raw results:', rawResults);

    // Initialize all hours with zero counts
    const hourlyData = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      okCount: 0,
      ngCount: 0,
      total: 0
    }));

    // Update counts from actual results
    rawResults.forEach(result => {
      const hour = result._id.hour;
      const hourData = hourlyData[hour];
      
      if (result._id.result === 'OK') {
        hourData.okCount = result.count;
      } else if (result._id.result === 'NG') {
        hourData.ngCount = result.count;
      }
      hourData.total = hourData.okCount + hourData.ngCount;
    });

    // Sort by display order (6 AM to 5 AM next day)
    hourlyData.sort((a, b) => {
      const hourA = a.hour < 6 ? a.hour + 24 : a.hour;
      const hourB = b.hour < 6 ? b.hour + 24 : b.hour;
      return hourA - hourB;
    });

    return NextResponse.json({ 
      hourlyData,
      debug: {
        timeRange: {
          start: today6AM,
          end: next6AM
        },
        recordCount: rawResults.length,
        totalDocuments: testCount
      }
    });

  } catch (error) {
    logger.error('Error in hourly-counts API:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch hourly counts',
        details: error.message 
      }, 
      { status: 500 }
    );
  }
}
