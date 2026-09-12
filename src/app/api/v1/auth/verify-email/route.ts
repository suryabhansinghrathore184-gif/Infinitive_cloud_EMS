import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { hashToken } from '@/lib/cryptoAuth';
import { logAuditEvent } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Verification token is required.' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    const tokenHash = hashToken(token);
    const now = new Date();

    const tokenDoc = await db.collection('auth_tokens').findOne({
      tokenHash,
      type: 'EMAIL_VERIFICATION',
      used: false,
      expiresAt: { $gt: now },
    });

    if (!tokenDoc) {
      return NextResponse.json(
        { success: false, message: 'Invalid or expired email verification link.' },
        { status: 400 }
      );
    }

    // Mark email verified in users collection
    await db.collection('users').updateOne(
      { email: tokenDoc.email },
      { $set: { emailVerified: true, updatedAt: now } }
    );

    // Mark token as used
    await db.collection('auth_tokens').updateOne(
      { _id: tokenDoc._id },
      { $set: { used: true, usedAt: now } }
    );

    await logAuditEvent(req, 'EMAIL_VERIFIED', { details: { email: tokenDoc.email } });

    return NextResponse.json({
      success: true,
      message: 'Your email address has been verified successfully. You may now log in.',
    });
  } catch (error: any) {
    console.error('Error in POST /api/v1/auth/verify-email:', error);
    return NextResponse.json(
      { success: false, message: 'Email verification failed.' },
      { status: 500 }
    );
  }
}
