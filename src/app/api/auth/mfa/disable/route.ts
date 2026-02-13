import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import { getSession } from '@/lib/auth';

export async function POST() {
  try {
    const session = await getSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const user = await User.findOne({ email: session.user.email });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Disable MFA
    user.mfaEnabled = false;
    user.mfaSecret = undefined;
    await user.save();

    return NextResponse.json({
      success: true,
      message: 'MFA disabled successfully'
    });
  } catch (error: any) {
    console.error('MFA disable error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
