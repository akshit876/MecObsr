import { NextResponse } from 'next/server';
import mongoDbService from '../../../../../services/mongoDbService';
import logger from '../../../../../logger';

export async function POST(request) {
  try {
    // First, ensure MongoDB is connected
    if (!mongoDbService.collection) {
      logger.info('Connecting to MongoDB...');
      await mongoDbService.connect('main-data', 'records');
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

    // First get a sample to verify the actual time of records
    const sample = await mongoDbService.collection
      .find({
        Timestamp: {
          $gte: today6AM,
          $lt: next6AM,
        },
      })
      .sort({ Timestamp: 1 })
      .limit(1)
      .toArray();

    if (sample.length > 0) {
      logger.info(
        `Sample record timestamp: ${sample[0].Timestamp}, Hour: ${new Date(sample[0].Timestamp).getHours()}`,
      );
    }

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
          recordHour: { $hour: '$Timestamp' },
        },
      },
      {
        $group: {
          _id: {
            hour: '$recordHour',
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
      {
        $sort: { hour: 1 },
      },
    ];

    const rawResults = await mongoDbService.collection.aggregate(pipeline).toArray();

    // Log the raw results for debugging
    rawResults.forEach((result) => {
      logger.info(
        `Hour ${result.hour}: OK=${result.okCount}, NG=${result.ngCount}, Total=${result.total}`,
      );
      logger.info(`First record: ${result.firstRecord}, Last record: ${result.lastRecord}`);
    });

    // Initialize the 24-hour array with zeros
    const hourlyData = Array.from({ length: 24 }, (_, index) => {
      const hour = (index + 6) % 24; // Start from 6 AM
      const result = rawResults.find((r) => r.hour === hour);

      if (result) {
        logger.info(`Found data for hour ${hour}: OK=${result.okCount}, NG=${result.ngCount}`);
      }

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
          start: today6AM,
          end: next6AM,
        },
        recordCount: rawResults.length,
        sampleData: sample[0] || null,
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
