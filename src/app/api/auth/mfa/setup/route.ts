import { NextResponse } from 'next/server';
import { TOTP, generateSecret, NobleCryptoPlugin, ScureBase32Plugin } from 'otplib';
import QRCode from 'qrcode';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import { getSession } from '@/lib/auth';

export async function POST() {
  try {
    const session = await getSession();
    console.log('Session:', JSON.stringify(session, null, 2));
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    
    // Try to find user by email or ID
    let user = null;
    if (session.user.email) {
      console.log('Looking up user by email:', session.user.email);
      user = await User.findOne({ email: session.user.email });
      console.log('Found by email:', user ? 'YES' : 'NO');
    }
    
    if (!user && (session.user as any).id) {
      console.log('Looking up user by ID:', (session.user as any).id);
      user = await User.findById((session.user as any).id);
      console.log('Found by ID:', user ? 'YES' : 'NO');
    }
    
    if (!user) {
      // List all users to debug
      const allUsers = await User.find({}, { email: 1, _id: 1 }).limit(5);
      console.error('User not found. Session user:', session.user);
      console.error('Available users in DB:', allUsers);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Generate secret
    const secret = generateSecret();
    console.log('Generated secret:', { secret, length: secret?.length });
    
    // Generate OTP auth URL using TOTP instance with icon
    const totp = new TOTP({ 
      secret,
      crypto: new NobleCryptoPlugin(),
      base32: new ScureBase32Plugin(),
    });
    const otpauth = totp.toURI({
      label: user.email,
      issuer: 'Azure Blog',
      secret,
      image: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/favicon/android-chrome-192x192.png`,
    });

    // Generate QR code
    const qrCode = await QRCode.toDataURL(otpauth);

    // Store secret using raw MongoDB driver to bypass Mongoose
    console.log('Updating user with secret...');
    const db = (await connectDB()).connection.db;
    const updateResult = await db.collection('users').updateOne(
      { _id: user._id },
      { 
        $set: {
          mfaSecret: secret,
          mfaEnabled: false,
        }
      }
    );
    
    console.log('Update result:', updateResult);
    
    // Verify update worked using raw MongoDB
    const verifyUser = await db.collection('users').findOne({ _id: user._id });
    console.log('After update:', { 
      hasSecret: !!verifyUser?.mfaSecret, 
      secretLength: verifyUser?.mfaSecret?.length,
      secretMatch: verifyUser?.mfaSecret === secret,
      actualSecret: verifyUser?.mfaSecret?.substring(0, 10) + '...'
    });

    return NextResponse.json({
      secret,
      qrCode,
      message: 'Scan QR code with Google Authenticator and verify with a code'
    });
  } catch (error: any) {
    console.error('MFA setup error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
