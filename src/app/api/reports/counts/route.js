import { NextResponse } from 'next/server';
import mongoDbService from '../../../../../services/mongoDbService';
import logger from '../../../../../logger';

export async function POST(request) {
  try {
    const { startDate } = await request.json();

    // Create date object for current time
    const currentDate = new Date(startDate);
    const currentHour = currentDate.getHours();

    // If current time is before 6 AM, use previous day's 6 AM as start
    const startDateTime = new Date(startDate);
    if (currentHour < 6) {
      startDateTime.setDate(startDateTime.getDate() - 1);
    }
    startDateTime.setHours(6, 0, 0, 0);
    
    // End time is always start date + 1 day at 6 AM
    const endDateTime = new Date(startDateTime);
    endDateTime.setDate(endDateTime.getDate() + 1);
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

@echo off

REM Start the Node.js server in silent mode
cd /d "D:\lsr-be"
powershell -WindowStyle Hidden -Command "Start-Process cmd -ArgumentList '/c npm run start' -NoNewWindow"

REM Wait for Node.js server to initialize
timeout /t 3 /nobreak >nul

REM Start the Next.js app in silent mode
cd /d "D:\Laser-UI"
powershell -WindowStyle Hidden -Command "Start-Process cmd -ArgumentList '/c npm run start' -NoNewWindow"

REM Wait for Next.js app to initialize
timeout /t 5 /nobreak >nul

REM Open Chrome in incognito mode at localhost:3000
start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" --incognito http://localhost:3000

pause
