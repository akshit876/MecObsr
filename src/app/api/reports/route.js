// File: app/api/reports/route.js
import { NextResponse } from 'next/server';
import mongoDbService from '../../../../services/mongoDbService';
import logger from '../../../../logger';

export async function POST(request) {
  try {
    const { startDate, endDate } = await request.json();

    // Connect to MongoDB if not already connected
    if (!mongoDbService.collection) {
      await mongoDbService.connect('main-data', 'records');
    }

    // Fetch data from MongoDB using the service
    const data = await mongoDbService.getRecordsByDateRange(startDate, endDate);

    if (data.length === 0) {
      logger.info('No data found for the specified date range.');
      return NextResponse.json(
        { message: 'No data found for the specified date range.' },
        { status: 404 },
      );
    }

    logger.info(`Fetched JSON report for date range: ${startDate} to ${endDate}`);
    return NextResponse.json(data);
  } catch (error) {
    logger.error('Error fetching report:', error);
    return NextResponse.json({ error: 'Failed to fetch report' }, { status: 500 });
  }
}

// New GET endpoint for fetching records with optional limit
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit');
    const limitNumber = limit ? parseInt(limit, 10) : 5000; // Default to 5000, but allow override

    // Connect to MongoDB if not already connected
    if (!mongoDbService.collection) {
      await mongoDbService.connect('main-data', 'records');
    }

    // Fetch data from MongoDB, sorted in descending order by Timestamp
    const data = await mongoDbService.collection
      .find({})
      .sort({ Timestamp: -1 })
      .limit(limitNumber)
      .toArray();

    if (data.length === 0) {
      logger.info('No data found in MongoDB collection.');
      return NextResponse.json({ data: [] });
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

    logger.info(`Fetched ${transformedData.length} records for UI display`);
    return NextResponse.json({ data: transformedData, count: transformedData.length });
  } catch (error) {
    logger.error('Error fetching records:', error);
    return NextResponse.json({ error: 'Failed to fetch records' }, { status: 500 });
  }
}
