import { NextResponse } from 'next/server';
import mongoDbService from '../../../../../services/mongoDbService';
import logger from '../../../../../logger';

export async function POST(request) {
  try {
    const { startDate, endDate } = await request.json();

    // Convert strings to Date objects
    const startDateTime = new Date(startDate);
    const endDateTime = new Date(endDate);

    logger.info(
      `Fetching hourly data from ${startDateTime.toISOString()} to ${endDateTime.toISOString()}`,
    );

    // Connect to MongoDB if not already connected
    if (!mongoDbService.collection) {
      await mongoDbService.connect('main-data', 'records');
    }

    // First, let's log some sample data to verify
    const sampleData = await mongoDbService.collection
      .find({
        Timestamp: {
          $gte: startDateTime,
          $lt: endDateTime,
        },
      })
      .limit(5)
      .toArray();

    logger.info(`Sample data: ${JSON.stringify(sampleData)}`);

    // Aggregate counts from MongoDB with simpler pipeline
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
        $addFields: {
          hour: { $hour: '$Timestamp' },
        },
      },
      {
        $group: {
          _id: {
            hour: '$hour',
            result: '$Result',
          },
          count: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: '$_id.hour',
          data: {
            $push: {
              result: '$_id.result',
              count: '$count',
            },
          },
        },
      },
      {
        $project: {
          hour: '$_id',
          okCount: {
            $sum: {
              $map: {
                input: {
                  $filter: {
                    input: '$data',
                    as: 'item',
                    cond: { $eq: ['$$item.result', 'OK'] },
                  },
                },
                as: 'filtered',
                in: '$$filtered.count',
              },
            },
          },
          ngCount: {
            $sum: {
              $map: {
                input: {
                  $filter: {
                    input: '$data',
                    as: 'item',
                    cond: { $eq: ['$$item.result', 'NG'] },
                  },
                },
                as: 'filtered',
                in: '$$filtered.count',
              },
            },
          },
        },
      },
    ];

    const hourlyData = await mongoDbService.collection.aggregate(pipeline).toArray();

    // Log the results for debugging
    logger.info(`Pipeline results: ${JSON.stringify(hourlyData)}`);

    // If no data found, return empty array with proper structure
    if (!hourlyData.length) {
      logger.info('No data found for the specified time range');
      return NextResponse.json({ hourlyData: [] });
    }

    return NextResponse.json({ hourlyData });
  } catch (error) {
    logger.error('Error fetching hourly counts:', error);
    return NextResponse.json({ error: 'Failed to fetch hourly counts' }, { status: 500 });
  }
}
