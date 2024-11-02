import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import mongoose from 'mongoose';
// import { authOptions } from '@/lib/auth';

export async function POST(request) {
  try {
    // Get session without strict checking
    const session = await getServerSession();
    console.log('session', session);

    // More permissive session check
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized - Please login' }, { status: 401 });
    }

    const { partNumber, selectedBy, selectedAt } = await request.json();

    if (!partNumber) {
      return NextResponse.json({ error: 'Part number is required' }, { status: 400 });
    }

    // Connect to main-data database
    const mainDataDB = mongoose.connection.useDb('main-data');

    // Update the config
    const result = await mainDataDB.collection('config').findOneAndUpdate(
      {},
      {
        $set: {
          currentPartNumber: partNumber,
          partNo: partNumber,
          selectedBy,
          selectedAt,
          updatedAt: new Date().toISOString(),
        },
      },
      {
        upsert: true,
        returnDocument: 'after',
      },
    );

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error updating current part number:', error);
    return NextResponse.json({ error: 'Failed to update current part number' }, { status: 500 });
  }
} 