import { NextResponse } from 'next/server';
import mongoDbService from '../../../../services/mongoDbService';
import logger from '../../../../logger';

export async function GET() {
  try {
    // Connect to the "configs" collection
    if (!mongoDbService.collection) {
      await mongoDbService.connect('main-data', 'config');
    }

    // Fetch the latest part number (since there's only one)
    const partNumberData = await mongoDbService.collection.findOne({});
    if (!partNumberData) {
      return NextResponse.json({ partNo: null }); // No part number saved
    }

    return NextResponse.json({ partNo: partNumberData.partNo });
  } catch (error) {
    logger.error('Error fetching part number:', error);
    return NextResponse.json({ error: 'Failed to fetch part number.' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { partNo } = await request.json(); // Get partNo from request body

    // Validate the part number
    if (!partNo) {
      return NextResponse.json({ error: 'Part number is required.' }, { status: 400 });
    }

    // Connect to MongoDB if not already connected to the configs collection
    if (!mongoDbService.collection) {
      await mongoDbService.connect('main-data', 'config');
    }

    // Save part number in the configs collection
    await mongoDbService.savePartNumber(partNo);

    logger.info(`Part number ${partNo} saved successfully.`);
    return NextResponse.json({ message: 'Part number saved successfully.' });
  } catch (error) {
    console.error(error);
    logger.error('Error saving part number:', error.message);
    return NextResponse.json({ error: 'Failed to save part number.' }, { status: 500 });
  }
}
