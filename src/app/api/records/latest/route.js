import { NextResponse } from 'next/server';
import dbConnect from '@/db/config/dbConnect';
import mongoose from 'mongoose';

export async function GET() {
  try {
    await dbConnect('main-data');
    
    const recordsCollection = mongoose.connection.db.collection('records');
    
    const latestRecord = await recordsCollection
      .findOne(
        {}, 
        {
          sort: { timestamp: -1 },
          projection: { serialNumber: 1, timestamp: 1, _id: 0 }
        }
      );

    if (!latestRecord) {
      return NextResponse.json(
        { message: 'No records found' }, 
        { status: 404 }
      );
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
