import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { connectDB } from '@/lib/mongodb';
import PasswordReset from '@/models/PasswordReset';
import { getEntraUser } from '@/lib/m365';
import { sendMail } from '@/lib/mail';
import type { Lang } from '@/app/ghiffa/i18n';
import { RESET_EMAIL } from '@/app/reset-password/i18n';

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour
const RESEND_COOLDOWN_MS = 60 * 1000; // 1 minute between emails per account

// Rejects anything that isn't shaped like a user principal name before it's
// passed on to Graph, where it ends up in the URL path (/users/{id}).
const UPN_PATTERN = /^[A-Za-z0-9._%+'-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

// Always answers the same way, whether or not the account exists, so this
// endpoint can't be used to find out which usernames have an account. The
// page shows its own translated text rather than this message.
const GENERIC_RESPONSE = {
  message: 'If that account exists and has an email address configured, a password reset link has been sent to it.',
};

async function sendResetLink(username: string, lang: Lang) {
  const user = await getEntraUser(username);
  if (!user || !user.accountEnabled || !user.mail) {
    return;
  }

  await connectDB();
  const recent = await PasswordReset.findOne({
    userPrincipalName: user.userPrincipalName.toLowerCase(),
    createdAt: { $gt: new Date(Date.now() - RESEND_COOLDOWN_MS) },
  });
  if (recent) {
    return;
  }

  const token = crypto.randomBytes(32).toString('hex');
  await PasswordReset.create({
    tokenHash: crypto.createHash('sha256').update(token).digest('hex'),
    entraUserId: user.id,
    userPrincipalName: user.userPrincipalName.toLowerCase(),
    expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
  });

  // Never derive the link from the request's Host header - an attacker could
  // spoof it and have the real token emailed inside a link to their own site.
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL || '').replace(/\/$/, '');
  const resetUrl = `${siteUrl}/reset-password/confirm?token=${token}&lang=${lang}`;

  const { subject, text } = RESET_EMAIL[lang](user.displayName || user.userPrincipalName, user.userPrincipalName, resetUrl);
  await sendMail({ to: user.mail, subject, text });
}

export async function POST(req: NextRequest) {
  try {
    const { username, lang: requestedLang } = await req.json();
    // Same default as the Ghiffa page the language choice is shared with.
    const lang: Lang = requestedLang === 'en' || requestedLang === 'de' ? requestedLang : 'pl';

    if (!username || typeof username !== 'string') {
      return NextResponse.json({ error: 'Username is required', code: 'username_required' }, { status: 400 });
    }

    const normalized = username.trim().toLowerCase();
    if (UPN_PATTERN.test(normalized)) {
      // Not awaited, so the response time doesn't reveal whether the account
      // exists or an email was sent.
      sendResetLink(normalized, lang).catch((error) => console.error('[password-reset] request failed:', error));
    }

    return NextResponse.json(GENERIC_RESPONSE);
  } catch (error) {
    console.error('Password reset request error:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
