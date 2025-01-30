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

    // First, let's verify we have data in the time range
    const sampleCount = await mongoDbService.collection.countDocuments({
      Timestamp: {
        $gte: startDateTime,
        $lt: endDateTime,
      },
    });

    logger.info(`Found ${sampleCount} records in the time range`);

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

    // Log raw aggregation results
    logger.info(`Raw aggregation results: ${JSON.stringify(hourlyData)}`);

    // Create a full 24-hour array with zeros for missing hours
    const fullHourlyData = Array.from({ length: 24 }, (_, i) => {
      const hour = i;
      const existingData = hourlyData.find((data) => data.hour === hour) || {
        hour,
        okCount: 0,
        ngCount: 0,
        total: 0,
      };
      return existingData;
    });

    logger.info(`Returning data with ${fullHourlyData.length} hours`);

    return NextResponse.json({
      hourlyData: fullHourlyData,
      debug: {
        timeRange: {
          start: startDateTime,
          end: endDateTime,
        },
        recordCount: sampleCount,
      },
    });
  } catch (error) {
    logger.error('Error fetching hourly counts:', error);
    return NextResponse.json({ error: 'Failed to fetch hourly counts' }, { status: 500 });
  }
}
