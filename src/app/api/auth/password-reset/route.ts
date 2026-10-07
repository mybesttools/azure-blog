import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import { sendMail } from '@/lib/mail';

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour
const RESEND_COOLDOWN_MS = 60 * 1000; // 1 minute between emails per account

// Always answers the same way, whether or not the account exists, so this
// endpoint can't be used to find out which email addresses have an account.
const GENERIC_RESPONSE = {
  message: 'If an account with that email exists, a password reset link has been sent to it.',
};

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    await connectDB();
    const user = await User.findOne({ email: email.trim().toLowerCase() });

    // Entra ID accounts have no local password to reset - their password is
    // managed by Microsoft.
    if (!user || user.type !== 'local') {
      return NextResponse.json(GENERIC_RESPONSE);
    }

    if (
      user.passwordResetRequestedAt &&
      Date.now() - user.passwordResetRequestedAt.getTime() < RESEND_COOLDOWN_MS
    ) {
      return NextResponse.json(GENERIC_RESPONSE);
    }

    const token = crypto.randomBytes(32).toString('hex');
    user.passwordResetTokenHash = crypto.createHash('sha256').update(token).digest('hex');
    user.passwordResetExpires = new Date(Date.now() + TOKEN_TTL_MS);
    user.passwordResetRequestedAt = new Date();
    await user.save();

    // Never derive the link from the request's Host header - an attacker could
    // spoof it and have the real token emailed inside a link to their own site.
    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL || '').replace(/\/$/, '');
    const resetUrl = `${siteUrl}/reset-password/confirm?token=${token}`;

    // Not awaited, so the response time doesn't reveal whether an email was sent.
    sendMail({
      to: user.email,
      subject: 'Reset your MyBestTools password',
      text: [
        `Hi ${user.name},`,
        '',
        'Someone (hopefully you) asked to reset the password for your MyBestTools account.',
        'Use this link to choose a new password. It expires in 1 hour and can only be used once:',
        '',
        resetUrl,
        '',
        "If you didn't ask for this, you can ignore this email - your password won't change.",
      ].join('\n'),
    }).catch((error) => console.error('[password-reset] failed to send email:', error));

    return NextResponse.json(GENERIC_RESPONSE);
  } catch (error) {
    console.error('Password reset request error:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
