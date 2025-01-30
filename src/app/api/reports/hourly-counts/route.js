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

    // Aggregate counts from MongoDB for the specific hour
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
          _id: {
            hour: { $hour: '$Timestamp' },
            result: '$Result',
          },
          count: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: '$_id.hour',
          counts: {
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
            $reduce: {
              input: {
                $filter: {
                  input: '$counts',
                  as: 'count',
                  cond: { $eq: ['$$count.result', 'OK'] },
                },
              },
              initialValue: 0,
              in: { $add: ['$$value', '$$this.count'] },
            },
          },
          ngCount: {
            $reduce: {
              input: {
                $filter: {
                  input: '$counts',
                  as: 'count',
                  cond: { $eq: ['$$count.result', 'NG'] },
                },
              },
              initialValue: 0,
              in: { $add: ['$$value', '$$this.count'] },
            },
          },
        },
      },
      {
        $sort: { hour: 1 },
      },
    ];

    const hourlyData = await mongoDbService.collection.aggregate(pipeline).toArray();

    logger.info(`Hourly data fetched successfully: ${JSON.stringify(hourlyData)}`);

    return NextResponse.json({ hourlyData });
  } catch (error) {
    logger.error('Error fetching hourly counts:', error);
    return NextResponse.json({ error: 'Failed to fetch hourly counts' }, { status: 500 });
  }
}
