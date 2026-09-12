import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { hashToken, generateSecureToken, generateNumericOTP } from '@/lib/cryptoAuth';
import { createNotification } from '@/lib/notifications/notificationService';
import { logAuditEvent } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { twoFactorToken } = body;

    if (!twoFactorToken) {
      return NextResponse.json(
        { success: false, message: 'Verification token is required.' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    const existingDoc = await db.collection('auth_tokens').findOne({
      twoFactorToken,
      type: '2FA_OTP',
    });

    if (!existingDoc) {
      return NextResponse.json(
        { success: false, message: 'Invalid 2FA session. Please log in again.' },
        { status: 400 }
      );
    }

    const newOtp = generateNumericOTP(6);
    const hashedOtp = hashToken(newOtp);
    const newTwoFactorToken = `2fa-tok-${Date.now()}-${generateSecureToken(16)}`;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 10 * 60 * 1000);

    await db.collection('auth_tokens').deleteOne({ _id: existingDoc._id });

    await db.collection('auth_tokens').insertOne({
      type: '2FA_OTP',
      userId: existingDoc.userId,
      email: existingDoc.email,
      twoFactorToken: newTwoFactorToken,
      hashedOtp,
      expiresAt,
      createdAt: now,
    });

    try {
      await createNotification({
        organizationId: 'org-default',
        recipientType: 'EMPLOYEE',
        recipientId: existingDoc.email,
        eventType: '2fa_otp',
        category: 'SECURITY',
        title: 'EMS Security Code',
        message: `Your new 2FA authentication code is: ${newOtp}. Code expires in 10 minutes.`,
        priority: 'HIGH',
        recipientEmail: existingDoc.email,
      });
    } catch (notifErr) {
      console.warn('Could not send OTP email:', notifErr);
    }

    await logAuditEvent(req, 'OTP_RESENT', { details: { email: existingDoc.email } });

    return NextResponse.json({
      success: true,
      message: 'A new 2FA verification code has been dispatched to your email.',
      twoFactorToken: newTwoFactorToken,
    });
  } catch (error: any) {
    console.error('Error in POST /api/v1/auth/resend-otp:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to resend verification code.' },
      { status: 500 }
    );
  }
}
