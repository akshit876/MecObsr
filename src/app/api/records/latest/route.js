import { connectToDatabase } from '@/lib/mongodb';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const { db } = await connectToDatabase();
    
    // Get the latest record sorted by timestamp
    const latestRecord = await db
      .collection('records')
      .findOne(
        {}, // empty filter to match all documents
        { 
          sort: { timestamp: -1 },
          projection: { serialNumber: 1, timestamp: 1 } 
        }
      );

    if (!latestRecord) {
      return NextResponse.json({ message: 'No records found' }, { status: 404 });
    }

    return NextResponse.json(latestRecord);
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch latest record' },
      { status: 500 }
    );
  }
} 