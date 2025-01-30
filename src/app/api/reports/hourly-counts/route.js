import { NextResponse } from 'next/server';
import mongoDbService from '../../../../../services/mongoDbService';
import logger from '../../../../../logger';

export async function POST(request) {
  try {
    const { startDate, endDate } = await request.json();

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
          originalHour: { $hour: '$Timestamp' },
        },
      },
      {
        $group: {
          _id: {
            hour: '$originalHour',
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

    logger.info('Raw aggregation results:', hourlyData);

    // Create a full 24-hour array starting from 6 AM
    const fullHourlyData = Array.from({ length: 24 }, (_, i) => {
      const hour = (i + 6) % 24;
      const existingData = hourlyData.find((data) => data.hour === hour) || {
        hour,
        okCount: 0,
        ngCount: 0,
        total: 0,
      };
      return {
        ...existingData,
        hour: hour, // Ensure hour is set correctly
      };
    });

    // Sort by the display order (6 AM to 5 AM next day)
    fullHourlyData.sort((a, b) => {
      const hourA = a.hour < 6 ? a.hour + 24 : a.hour;
      const hourB = b.hour < 6 ? b.hour + 24 : b.hour;
      return hourA - hourB;
    });

    return NextResponse.json({
      hourlyData: fullHourlyData,
      debug: {
        timeRange: {
          start: today6AM,
          end: next6AM,
        },
        recordCount: await mongoDbService.collection.countDocuments({
          Timestamp: {
            $gte: today6AM,
            $lt: next6AM,
          },
        }),
      },
    });
  } catch (error) {
    logger.error('Error fetching hourly counts:', error);
    return NextResponse.json({ error: 'Failed to fetch hourly counts' }, { status: 500 });
  }
}
