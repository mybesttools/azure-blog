import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    // Use raw MongoDB driver to avoid any model caching issues
    const db = (await connectDB()).connection.db;

    const escapedEmail = normalizedEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const user = await db.collection('users').findOne({
      email: { $regex: `^${escapedEmail}$`, $options: 'i' },
    });

    if (!user) {
      // Don't reveal if user exists or not
      return NextResponse.json({ mfaRequired: false });
    }

    const mfaRequired = !!(user.mfaEnabled && user.mfaSecret);

    return NextResponse.json({ mfaRequired });
  } catch (error) {
    console.error('Check MFA required error:', error);
    return NextResponse.json(
      { error: 'Failed to check MFA status' },
      { status: 500 }
    );
  }
}
