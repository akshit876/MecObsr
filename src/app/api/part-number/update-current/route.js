import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import mongoose from 'mongoose';
import { authOptions } from '../../auth/[...nextauth]/route';

export async function POST(request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'operator') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { partNumber, selectedBy, selectedAt } = await request.json();

    if (!partNumber) {
      return NextResponse.json(
        { error: 'Part number is required' },
        { status: 400 }
      );
    }

    // Connect to main-data database
    const mainDataDB = mongoose.connection.useDb('main-data');
    
    // Update the config
    const result = await mainDataDB
      .collection('config')
      .findOneAndUpdate(
        {}, // empty filter to match first document
        { 
          $set: { 
            currentPartNumber: partNumber,
            selectedBy,
            selectedAt,
            updatedAt: new Date().toISOString()
          } 
        },
        { 
          upsert: true,
          returnDocument: 'after'
        }
      );

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error updating current part number:', error);
    return NextResponse.json(
      { error: 'Failed to update current part number' },
      { status: 500 }
    );
  }
} 