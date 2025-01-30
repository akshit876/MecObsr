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
      return NextResponse.json(
        {
          error: 'Database connection failed',
          details: connError.message,
        },
        { status: 500 },
      );
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

    const pipeline = [
      {
        $match: {
          Timestamp: {
            $gte: today6AM,
            $lt: next6AM,
          },
        },
      },
      {
        $addFields: {
          localHour: { $hour: '$Timestamp' },
          adjustedHour: {
            $cond: {
              if: { $lt: [{ $hour: '$Timestamp' }, 6] },
              then: { $add: [{ $hour: '$Timestamp' }, 24] },
              else: { $hour: '$Timestamp' },
            },
          },
        },
      },
      {
        $group: {
          _id: {
            hour: '$localHour',
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

    const rawResults = await mongoDbService.collection.aggregate(pipeline).toArray();
    logger.info('Raw aggregation results:', rawResults);

    // Create a map for the results
    const resultsMap = new Map(rawResults.map((r) => [r.hour, r]));

    // Create the full 24-hour array starting from 6 AM
    const hourlyData = Array.from({ length: 24 }, (_, index) => {
      const hour = (index + 6) % 24; // Convert index to hour (6 AM to 5 AM)
      const data = resultsMap.get(hour) || {
        hour,
        okCount: 0,
        ngCount: 0,
        total: 0,
      };
      return data;
    });

    logger.info('Processed hourly data:', hourlyData);

    return NextResponse.json({
      hourlyData,
      debug: {
        timeRange: {
          start: today6AM,
          end: next6AM,
        },
        recordCount: rawResults.length,
      },
    });
  } catch (error) {
    logger.error('Error in hourly-counts API:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch hourly counts',
        details: error.message,
      },
      { status: 500 },
    );
  }
}
