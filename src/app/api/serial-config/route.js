import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import mongoose from 'mongoose';

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const mainDataDB = mongoose.connection.useDb('main-data');
    const config = await mainDataDB.collection('serial_config').findOne({});

    return NextResponse.json(config || {
      initialValue: '0',
      currentValue: '0',
      resetValue: '0',
      resetInterval: 'daily',
    });
  } catch (error) {
    console.error('Error fetching serial config:', error);
    return NextResponse.json({ error: 'Failed to fetch configuration' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const config = await request.json();
    const mainDataDB = mongoose.connection.useDb('main-data');

    const result = await mainDataDB.collection('serial_config').findOneAndUpdate(
      {},
      {
        $set: {
          ...config,
          updatedAt: new Date().toISOString(),
          updatedBy: session.user.email,
        },
      },
      {
        upsert: true,
        returnDocument: 'after',
      }
    );

    // Log the configuration change
    await mainDataDB.collection('serial_config_logs').insertOne({
      ...config,
      updatedAt: new Date().toISOString(),
      updatedBy: session.user.email,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error updating serial config:', error);
    return NextResponse.json({ error: 'Failed to update configuration' }, { status: 500 });
  }
} 