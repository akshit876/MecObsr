import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import ShiftConfig from '@/models/ShiftConfig';

export async function GET() {
  try {
    await connectDB();
    const config = await ShiftConfig.findOne().sort({ updatedAt: -1 });
    return NextResponse.json(config || { shifts: [] });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    
    // Calculate total hours
    const totalHours = body.shifts.reduce((sum, shift) => sum + shift.duration, 0);
    if (totalHours !== 24) {
      return NextResponse.json(
        { error: 'Total shift duration must equal 24 hours' },
        { status: 400 }
      );
    }

    await connectDB();
    const config = new ShiftConfig({
      shifts: body.shifts,
      totalHours
    });
    await config.save();

    return NextResponse.json(config);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 