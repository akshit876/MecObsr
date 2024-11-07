import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import mongoose from 'mongoose';
import UserSessionLog from '../../../../db/models/UserSessionLog';

export async function POST(request) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userAgent } = await request.json();

    // Get user from the database
    const mainDataDB = mongoose.connection.useDb('laserU');
    const user = await mainDataDB.collection('users').findOne({ email: session.user.email });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Create session log
    const sessionLog = await UserSessionLog.create({
      userId: user._id,
      email: user.email,
      role: user.role,
      loginTime: new Date(),
      userAgent,
      ipAddress:
        request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'Unknown',
      status: 'active',
    });

    return NextResponse.json({ success: true, sessionLog });
  } catch (error) {
    console.error('Error logging session:', error);
    return NextResponse.json({ error: 'Failed to log session' }, { status: 500 });
  }
}
