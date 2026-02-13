import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    
    let user = null;
    if (session.user.email) {
      user = await User.findOne({ email: session.user.email });
    } else if ((session.user as any).id) {
      user = await User.findById((session.user as any).id);
    }
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      mfaEnabled: user.mfaEnabled || false,
      hasSecret: !!user.mfaSecret,
    });
  } catch (error: any) {
    console.error('MFA status error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
