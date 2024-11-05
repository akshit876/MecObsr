import { NextResponse } from 'next/server';
import mongoose from 'mongoose';

// Make sure there are no spaces before 'export'
export const GET = async () => {
  try {
    // Check if we're already connected
    if (mongoose.connection.readyState !== 1) {
      // If not connected, connect to MongoDB
      await mongoose.connect(process.env.MONGODB_URI);
    }

    console.log('MongoDB connection state:', mongoose.connection.readyState);

    const mainDataDB = mongoose.connection.useDb('main-data');
    console.log('Attempting to query config collection...');

    const currentConfig = await mainDataDB.collection('config').findOne(
      {}, // empty query to get any document
      { sort: { _id: -1 } }, // get the latest document
    );

    console.log('Query result:', currentConfig);

    if (!currentConfig) {
      console.log('No configuration found');
      return NextResponse.json({ message: 'No configuration found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      currentPartNumber: currentConfig.currentPartNumber,
      currentModelNumber: currentConfig.currentModelConfig.modelNumber,
    });
  } catch (error) {
    console.error('Detailed error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch current part number',
        details: error.message,
      },
      { status: 500 },
    );
  }
};
