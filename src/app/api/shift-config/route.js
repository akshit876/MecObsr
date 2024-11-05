import { NextResponse } from 'next/server';
import dbConnect from '@/db/config/dbConnect';
import ShiftConfig from '../../../db/models/ShiftConfig';

dbConnect();

export async function GET() {
  try {
    const config = await ShiftConfig.findOne().sort({ updatedAt: -1 });
    
    // If no configuration exists, return default shifts
    if (!config) {
      return NextResponse.json({
        shifts: [
          { shiftId: '1', name: 'A', startTime: '', endTime: '', duration: 0 },
          { shiftId: '2', name: 'B', startTime: '', endTime: '', duration: 0 },
          { shiftId: '3', name: 'C', startTime: '', endTime: '', duration: 0 },
        ]
      });
    }

    // If configuration exists, ensure it has the correct format
    const formattedShifts = config.shifts.map(shift => ({
      shiftId: shift.shiftId || shift._id.toString(),
      name: shift.name || '',
      startTime: shift.startTime || '',
      endTime: shift.endTime || '',
      duration: shift.duration || 0
    }));

    return NextResponse.json({
      shifts: formattedShifts,
      totalHours: config.totalHours,
      updatedAt: config.updatedAt
    });

  } catch (error) {
    console.error('GET Shift Config Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch shift configuration',
        details: error.message 
      }, 
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();

    // Validate the request body
    if (!body.shifts || !Array.isArray(body.shifts)) {
      return NextResponse.json(
        { error: 'Invalid request format' },
        { status: 400 }
      );
    }

    // Calculate total hours
    const totalHours = body.shifts.reduce((sum, shift) => sum + shift.duration, 0);
    if (Math.abs(totalHours - 24) > 0.01) {
      return NextResponse.json(
        { error: 'Total shift duration must equal 24 hours' },
        { status: 400 }
      );
    }

    // Find existing config or create new one using findOneAndUpdate
    const updatedConfig = await ShiftConfig.findOneAndUpdate(
      {}, // empty filter to match any document
      {
        shifts: body.shifts.map(shift => ({
          shiftId: shift.shiftId,
          name: shift.name,
          startTime: shift.startTime,
          endTime: shift.endTime,
          duration: shift.duration
        })),
        totalHours
      },
      {
        new: true, // return the updated document
        upsert: true, // create if doesn't exist
        setDefaultsOnInsert: true // apply schema defaults if creating new doc
      }
    );

    return NextResponse.json({
      shifts: updatedConfig.shifts,
      totalHours: updatedConfig.totalHours,
      updatedAt: updatedConfig.updatedAt
    });

  } catch (error) {
    console.error('POST Shift Config Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to save shift configuration',
        details: error.message 
      }, 
      { status: 500 }
    );
  }
} 