import { NextRequest, NextResponse } from 'next/server';
import { TOTP, NobleCryptoPlugin, ScureBase32Plugin } from 'otplib';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import { getSession } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    console.log('Verify - Session:', JSON.stringify(session, null, 2));
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { token } = await request.json();
    
    if (!token) {
      return NextResponse.json({ error: 'Token required' }, { status: 400 });
    }

    await connectDB();
    
    // Try to find user by email or ID (same as setup)
    let user = null;
    if (session.user.email) {
      console.log('Looking up user by email:', session.user.email);
      user = await User.findOne({ email: session.user.email });
    }
    
    if (!user && (session.user as any).id) {
      console.log('Looking up user by ID:', (session.user as any).id);
      user = await User.findById((session.user as any).id);
    }
    
    console.log('User found:', !!user, 'Has mfaSecret:', !!user?.mfaSecret, 'Secret length:', user?.mfaSecret?.length);
    
    if (!user || !user.mfaSecret) {
      return NextResponse.json({ error: 'MFA not set up' }, { status: 400 });
    }

    // Verify token
    const totp = new TOTP({ 
      secret: user.mfaSecret,
      crypto: new NobleCryptoPlugin(),
      base32: new ScureBase32Plugin(),
    });
    const isValid = await totp.verify({
      token,
    });
    
    console.log('Verifying MFA token:', { token, secretLength: user.mfaSecret?.length, isValid });

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid code' }, { status: 400 });
    }

    // Enable MFA
    user.mfaEnabled = true;
    await user.save();

    return NextResponse.json({
      success: true,
      message: 'MFA enabled successfully'
    });
  } catch (error: any) {
    console.error('MFA verify error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
