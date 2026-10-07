import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { connectDB } from '@/lib/mongodb';
import PasswordReset from '@/models/PasswordReset';
import { setEntraUserPassword } from '@/lib/m365';

const MIN_PASSWORD_LENGTH = 8;

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json();

    if (!token || typeof token !== 'string') {
      return NextResponse.json({ error: 'Reset token is required' }, { status: 400 });
    }
    if (!password || typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
      return NextResponse.json(
        { error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` },
        { status: 400 }
      );
    }

    await connectDB();
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const reset = await PasswordReset.findOne({ tokenHash, expiresAt: { $gt: new Date() } });

    if (!reset) {
      return NextResponse.json(
        { error: 'This reset link is invalid or has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    // The token is only used up once the password is actually changed, so a
    // password Entra ID rejects (e.g. too simple) can be retried with the
    // same link.
    const graphError = await setEntraUserPassword(reset.entraUserId, password);
    if (graphError) {
      const complexity = /complex/i.test(graphError);
      return NextResponse.json(
        {
          error: complexity
            ? 'That password does not meet the requirements. Use at least 8 characters with a mix of upper and lower case letters, numbers and symbols.'
            : 'Your password could not be changed. Please try again later.',
        },
        { status: complexity ? 400 : 502 }
      );
    }

    // Also invalidates any other outstanding links for the same account.
    await PasswordReset.deleteMany({ entraUserId: reset.entraUserId });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Password reset confirm error:', error);
    return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 });
  }
}
