import { NextResponse } from 'next/server';
import mongoDbService from '../../../../../services/mongoDbService';
import logger from '../../../../../logger';

export async function POST(request) {
  try {
    const { startDate } = await request.json();

    // Create date objects for 6 AM of start date and next day
    const startDateTime = new Date(startDate);
    startDateTime.setHours(6, 0, 0, 0);
    
    const endDateTime = new Date(startDate);
    endDateTime.setDate(endDateTime.getDate() + 1);  // Add one day
    endDateTime.setHours(6, 0, 0, 0);

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
            $lt: endDateTime
          }
        }
      },
      {
        $group: {
          _id: '$Result',
          count: { $sum: 1 }
        }
      }
    ];

    const counts = await mongoDbService.collection.aggregate(pipeline).toArray();
    
    // Transform the results
    const okCount = counts.find(item => item._id === 'OK')?.count || 0;
    const ngCount = counts.find(item => item._id === 'NG')?.count || 0;

    logger.info(`Fetched counts from ${startDateTime.toISOString()} to ${endDateTime.toISOString()}. OK: ${okCount}, NG: ${ngCount}`);
    return NextResponse.json({ okCount, ngCount });

  } catch (error) {
    logger.error('Error fetching counts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch counts' },
      { status: 500 }
    );
  }
}