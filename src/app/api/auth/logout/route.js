import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import UserSessionLog from '../../../../db/models/UserSessionLog';

export async function POST() {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Update the latest active session for this user
    await UserSessionLog.findOneAndUpdate(
      {
        email: session.user.email,
        status: 'active',
      },
      {
        $set: {
          status: 'completed',
          logoutTime: new Date(),
        },
      },
      {
        sort: { loginTime: -1 },
      },
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error logging logout:', error);
    return NextResponse.json({ error: 'Failed to log logout' }, { status: 500 });
  }
}
