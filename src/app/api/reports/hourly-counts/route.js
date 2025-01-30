import { NextResponse } from 'next/server';
import mongoDbService from '../../../../../services/mongoDbService';
import logger from '../../../../../logger';

export async function POST(request) {
  try {
    if (!mongoDbService.collection) {
      await mongoDbService.connect('main-data', 'records');
    }

    const utcOffset = 7; // UTC+7 for Jakarta/Bangkok

    // Get a sample record to check actual timestamps
    const sampleRecord = await mongoDbService.collection.findOne({}, { sort: { Timestamp: 1 } });
    if (sampleRecord) {
      const localTime = new Date(sampleRecord.Timestamp);
      logger.info(`Sample record timestamp: ${sampleRecord.Timestamp}`);
      logger.info(`Local hour: ${localTime.getHours()}`);
    }

    const pipeline = [
      {
        $addFields: {
          // Convert timestamp to local time for grouping
          localTimestamp: {
            $dateAdd: {
              startDate: '$Timestamp',
              unit: 'hour',
              amount: utcOffset,
            },
          },
        },
      },
      {
        $group: {
          _id: {
            hour: { $hour: '$localTimestamp' },
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

    // Log the raw results with actual local time
    rawResults.forEach((result) => {
      const localFirstTime = new Date(result.firstRecord);
      const localLastTime = new Date(result.lastRecord);
      logger.info(
        `Hour ${result.hour}: OK=${result.okCount}, NG=${result.ngCount}, Total=${result.total}`,
      );
      logger.info(`Time range: ${localFirstTime} to ${localLastTime}`);
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
        recordCount: rawResults.length,
        rawResults: rawResults.map((r) => ({
          hour: r.hour,
          total: r.total,
          timeRange: {
            start: r.firstRecord,
            end: r.lastRecord,
          },
        })),
        sampleData: sampleRecord,
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
