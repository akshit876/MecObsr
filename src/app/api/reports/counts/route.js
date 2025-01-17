import { NextResponse } from 'next/server';
import mongoDbService from '../../../../../services/mongoDbService';
import logger from '../../../../../logger';

export async function POST(request) {
  try {
    const { startDate } = await request.json();

    // Create date object for current time
    const currentDate = new Date(startDate);
    const currentHour = currentDate.getHours();
    logger.info(`Current hour: ${currentHour}`);

    // If current time is before 6 AM OR it's midnight (hour 0), use previous day's 6 AM as start
    const startDateTime = new Date(startDate);
    if (currentHour < 6 || currentHour === 0) {
      // Added explicit check for midnight
      startDateTime.setDate(startDateTime.getDate() - 1);
      logger.info('Adjusted to previous day due to time before 6 AM or midnight');
    }
    startDateTime.setHours(6, 0, 0, 0);

    // End time is always start date + 1 day at 6 AM
    const endDateTime = new Date(startDateTime);
    endDateTime.setDate(endDateTime.getDate() + 1);
    endDateTime.setHours(6, 0, 0, 0);

    logger.info(`Query time range: ${startDateTime.toISOString()} to ${endDateTime.toISOString()}`);

    // Connect to MongoDB if not already connected
    if (!mongoDbService.collection) {
      await mongoDbService.connect('main-data', 'records');
    }

    // Aggregate counts from MongoDB
    const pipeline = [
      {
        $match: {
          Timestamp: {
            $gte: startDateTime,
            $lt: endDateTime,
          },
        },
      },
      {
        $group: {
          _id: '$Result',
          count: { $sum: 1 },
        },
      },
    ];

    const counts = await mongoDbService.collection.aggregate(pipeline).toArray();

    // Transform the results
    const okCount = counts.find((item) => item._id === 'OK')?.count || 0;
    const ngCount = counts.find((item) => item._id === 'NG')?.count || 0;

    logger.info(
      `Fetched counts from ${startDateTime.toISOString()} to ${endDateTime.toISOString()}. OK: ${okCount}, NG: ${ngCount}`,
    );
    return NextResponse.json({ okCount, ngCount });
  } catch (error) {
    logger.error('Error fetching counts:', error);
    return NextResponse.json({ error: 'Failed to fetch counts' }, { status: 500 });
  }
}
