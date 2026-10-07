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
      return NextResponse.json({ error: 'Reset token is required', code: 'invalid_token' }, { status: 400 });
    }
    if (!password || typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
      return NextResponse.json(
        { error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters`, code: 'password_too_short' },
        { status: 400 }
      );
    }

    await connectDB();
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const reset = await PasswordReset.findOne({ tokenHash, expiresAt: { $gt: new Date() } });

    if (!reset) {
      return NextResponse.json(
        { error: 'This reset link is invalid or has expired', code: 'invalid_token' },
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
        complexity
          ? { error: 'Password does not meet the complexity requirements', code: 'password_complexity' }
          : { error: 'Password could not be changed', code: 'reset_failed' },
        { status: complexity ? 400 : 502 }
      );
    }

    // Also invalidates any other outstanding links for the same account.
    await PasswordReset.deleteMany({ entraUserId: reset.entraUserId });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Password reset confirm error:', error);
    return NextResponse.json({ error: 'Failed to reset password', code: 'reset_failed' }, { status: 500 });
  }
}
