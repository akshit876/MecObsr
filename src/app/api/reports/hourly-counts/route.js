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

    // Get today's 6 AM
    const today6AM = new Date();
    today6AM.setHours(6, 0, 0, 0);

    // Get tomorrow's 6 AM
    const tomorrow6AM = new Date(today6AM);
    tomorrow6AM.setDate(tomorrow6AM.getDate() + 1);

    logger.info(`Querying from ${today6AM.toISOString()} to ${tomorrow6AM.toISOString()}`);

    const pipeline = [
      {
        $match: {
          Timestamp: {
            $gte: today6AM,
            $lt: tomorrow6AM,
          },
        },
      },
      {
        $project: {
          hour: { $hour: '$Timestamp' },
          Result: 1,
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
          results: {
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
                    input: '$results',
                    as: 'r',
                    cond: { $eq: ['$$r.result', 'OK'] },
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
                    input: '$results',
                    as: 'r',
                    cond: { $eq: ['$$r.result', 'NG'] },
                  },
                },
                as: 'filtered',
                in: '$$filtered.count',
              },
            },
          },
        },
      },
      {
        $addFields: {
          total: { $add: ['$okCount', '$ngCount'] },
        },
      },
    ];

    let hourlyData = await mongoDbService.collection.aggregate(pipeline).toArray();

    // Create a full 24-hour array starting from 6 AM
    const fullHourlyData = Array.from({ length: 24 }, (_, i) => {
      const hour = (i + 6) % 24; // Start from 6 AM
      const existingData = hourlyData.find((data) => data.hour === hour) || {
        hour,
        okCount: 0,
        ngCount: 0,
        total: 0,
      };
      return existingData;
    });

    return NextResponse.json({
      hourlyData: fullHourlyData,
      debug: {
        timeRange: {
          start: today6AM,
          end: tomorrow6AM,
        },
        recordCount: await mongoDbService.collection.countDocuments({
          Timestamp: {
            $gte: today6AM,
            $lt: tomorrow6AM,
          },
        }),
      },
    });
  } catch (error) {
    logger.error('Error fetching hourly counts:', error);
    return NextResponse.json({ error: 'Failed to fetch hourly counts' }, { status: 500 });
  }
}
