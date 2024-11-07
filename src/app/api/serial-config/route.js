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
    const config = await mainDataDB.collection('serialNoconfig').findOne({});

    return NextResponse.json(
      config || {
        initialValue: '0',
        currentValue: '0',
        resetValue: '0',
        resetInterval: 'daily',
      },
    );
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

    // First check if a config exists
    const existingConfig = await mainDataDB.collection('serialNoconfig').findOne({});

    let result;
    if (existingConfig) {
      // Update existing config - remove _id from the update data
      const updateData = { ...config };
      delete updateData._id; // Remove _id if it exists in the input

      const updateResult = await mainDataDB.collection('serialNoconfig').findOneAndUpdate(
        { _id: existingConfig._id },
        {
          $set: {
            ...updateData,
            updatedAt: new Date().toISOString(),
            updatedBy: session.user.email,
          },
        },
        {
          returnDocument: 'after',
        },
      );

      // Safely handle the update result
      if (updateResult && updateResult.value) {
        result = {
          success: true,
          data: {
            ...updateResult.value,
            _id: updateResult.value._id
              ? updateResult.value._id.toString()
              : existingConfig._id.toString(),
          },
        };
      } else {
        // If update didn't return a value, use existing config
        result = {
          success: true,
          data: {
            ...existingConfig,
            ...updateData,
            _id: existingConfig._id.toString(),
            updatedAt: new Date().toISOString(),
            updatedBy: session.user.email,
          },
        };
      }
    } else {
      // Insert new config
      const insertResult = await mainDataDB.collection('serialNoconfig').insertOne({
        ...config,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        updatedBy: session.user.email,
      });

      result = {
        success: true,
        data: {
          ...config,
          _id: insertResult.insertedId.toString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          updatedBy: session.user.email,
        },
      };
    }

    // Log the configuration change - with a clean log object
    const logData = {
      configId: result.data._id,
      initialValue: config.initialValue,
      currentValue: config.currentValue,
      resetValue: config.resetValue,
      resetInterval: config.resetInterval,
      updatedAt: new Date().toISOString(),
      updatedBy: session.user.email,
    };

    await mainDataDB.collection('serial_config_logs').insertOne(logData);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error updating serial config:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update configuration',
        details: error.message,
      },
      { status: 500 },
    );
  }
}
