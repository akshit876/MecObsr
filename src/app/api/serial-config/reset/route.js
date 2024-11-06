import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import mongoose from 'mongoose';

export async function POST() {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const mainDataDB = mongoose.connection.useDb('main-data');
    const config = await mainDataDB.collection('serial_config').findOne({});

    if (!config) {
      return NextResponse.json({ error: 'No configuration found' }, { status: 404 });
    }

    const result = await mainDataDB.collection('serial_config').findOneAndUpdate(
      {},
      {
        $set: {
          currentValue: config.resetValue,
          lastReset: new Date().toISOString(),
          resetBy: session.user.email,
        },
      },
      { returnDocument: 'after' }
    );

    // Log the reset
    await mainDataDB.collection('serial_config_logs').insertOne({
      type: 'reset',
      previousValue: config.currentValue,
      newValue: config.resetValue,
      resetAt: new Date().toISOString(),
      resetBy: session.user.email,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error resetting serial number:', error);
    return NextResponse.json({ error: 'Failed to reset serial number' }, { status: 500 });
  }
} 