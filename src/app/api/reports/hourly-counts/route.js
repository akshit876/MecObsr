import { NextResponse } from 'next/server';
import mongoDbService from '../../../../../services/mongoDbService';
import logger from '../../../../../logger';

export async function POST(request) {
  try {
    if (!mongoDbService.collection) {
      await mongoDbService.connect('main-data', 'records');
    }

    // Get current date at midnight in local time (UTC+7)
    const now = new Date();
    const utcOffset = 7; // UTC+7 for Jakarta/Bangkok

    // Adjust the timestamps for local time
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    // Get today's 6 AM in local time
    const today6AM = new Date(today);
    today6AM.setHours(6, 0, 0, 0);

    // Convert to UTC for MongoDB query
    const today6AMUTC = new Date(today6AM.getTime() - utcOffset * 60 * 60 * 1000);

    // Get next 6 AM
    const next6AM = new Date(today6AM);
    next6AM.setDate(next6AM.getDate() + 1);
    const next6AMUTC = new Date(next6AM.getTime() - utcOffset * 60 * 60 * 1000);

    logger.info(`Querying from ${today6AMUTC.toISOString()} to ${next6AMUTC.toISOString()}`);

    const pipeline = [
      {
        $match: {
          Timestamp: {
            $gte: today6AMUTC,
            $lt: next6AMUTC,
          },
        },
      },
      {
        $addFields: {
          // Convert UTC hour to local hour
          localHour: {
            $add: [
              { $hour: '$Timestamp' },
              utcOffset,
              {
                $cond: {
                  if: {
                    $lt: [{ $add: [{ $hour: '$Timestamp' }, utcOffset] }, 24],
                  },
                  then: 0,
                  else: -24,
                },
              },
            ],
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
          firstRecord: { $first: '$Timestamp' },
          lastRecord: { $last: '$Timestamp' },
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
          firstRecord: { $first: '$firstRecord' },
          lastRecord: { $last: '$lastRecord' },
        },
      },
      {
        $project: {
          hour: '$_id',
          firstRecord: 1,
          lastRecord: 1,
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

    // Log the raw results with local time
    rawResults.forEach((result) => {
      const localFirstTime = new Date(result.firstRecord.getTime() + utcOffset * 60 * 60 * 1000);
      const localLastTime = new Date(result.lastRecord.getTime() + utcOffset * 60 * 60 * 1000);
      logger.info(
        `Local Hour ${result.hour}: OK=${result.okCount}, NG=${result.ngCount}, Total=${result.total}`,
      );
      logger.info(`Local time range: ${localFirstTime} to ${localLastTime}`);
    });

    // Initialize the 24-hour array with zeros
    const hourlyData = Array.from({ length: 24 }, (_, index) => {
      const hour = (index + 6) % 24; // Start from 6 AM
      const result = rawResults.find((r) => r.hour === hour);

      return {
        hour,
        okCount: result?.okCount || 0,
        ngCount: result?.ngCount || 0,
        total: result?.total || 0,
        timeRange: result
          ? {
              start: result.firstRecord,
              end: result.lastRecord,
            }
          : null,
      };
    });

    return NextResponse.json({
      hourlyData,
      debug: {
        timeRange: {
          start: today6AMUTC,
          end: next6AMUTC,
          localStart: today6AM,
          localEnd: next6AM,
        },
        recordCount: rawResults.length,
        rawResults: rawResults.map((r) => ({
          hour: r.hour,
          total: r.total,
          timeRange: {
            start: r.firstRecord,
            end: r.lastRecord,
          },
        })),
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
