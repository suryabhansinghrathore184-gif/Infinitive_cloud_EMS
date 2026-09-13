import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { hashToken } from '@/lib/cryptoAuth';
import { logAuditEvent } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, email, otp, otpCode } = body;
    const inputOtp = (otp || otpCode || '').trim();
    const cleanEmail = email ? email.trim().toLowerCase() : null;

    const { db } = await connectToDatabase();
    const now = new Date();

    // Case 1: OTP-based Email Verification
    if (cleanEmail && inputOtp) {
      const otpDoc = await db.collection('auth_otp_tokens').findOne({
        email: cleanEmail,
        expiresAt: { $gt: now },
      });

      if (!otpDoc) {
        return NextResponse.json(
          { success: false, message: 'Invalid or expired verification code. Please request a new code.' },
          { status: 400 }
        );
      }

      if ((otpDoc.attempts || 0) >= 5) {
        await db.collection('auth_otp_tokens').deleteOne({ _id: otpDoc._id });
        return NextResponse.json(
          { success: false, message: 'Too many failed verification attempts. Please request a new verification code.' },
          { status: 429 }
        );
      }

      const hashedInput = hashToken(inputOtp);
      if (otpDoc.otpHash !== hashedInput) {
        await db.collection('auth_otp_tokens').updateOne(
          { _id: otpDoc._id },
          { $inc: { attempts: 1 } }
        );
        await logAuditEvent(req, 'OTP_VERIFICATION_FAILED', { details: { email: cleanEmail, purpose: 'EMAIL_VERIFICATION' } });
        return NextResponse.json(
          { success: false, message: 'Invalid verification code entered. Please check and try again.' },
          { status: 400 }
        );
      }

      // Mark email verified in users & employees collections
      await db.collection('users').updateOne(
        { email: cleanEmail },
        { $set: { emailVerified: true, emailVerificationStatus: 'VERIFIED', updatedAt: now } }
      );
      await db.collection('employees').updateOne(
        { email: cleanEmail },
        { $set: { emailVerified: true, emailVerificationStatus: 'VERIFIED', updatedAt: now } }
      );

      // Invalidate OTP token
      await db.collection('auth_otp_tokens').deleteOne({ _id: otpDoc._id });

      await logAuditEvent(req, 'EMAIL_VERIFIED', { details: { email: cleanEmail, method: 'OTP' } });

      return NextResponse.json({
        success: true,
        message: 'Your email address has been verified successfully. You may now log in.',
      });
    }

    // Case 2: Token-based Email Verification
    if (token) {
      const tokenHash = hashToken(token);
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

      // Mark email verified in users & employees collections
      await db.collection('users').updateOne(
        { email: tokenDoc.email },
        { $set: { emailVerified: true, emailVerificationStatus: 'VERIFIED', updatedAt: now } }
      );
      await db.collection('employees').updateOne(
        { email: tokenDoc.email },
        { $set: { emailVerified: true, emailVerificationStatus: 'VERIFIED', updatedAt: now } }
      );

      // Mark token as used
      await db.collection('auth_tokens').updateOne(
        { _id: tokenDoc._id },
        { $set: { used: true, usedAt: now } }
      );

      await logAuditEvent(req, 'EMAIL_VERIFIED', { details: { email: tokenDoc.email, method: 'TOKEN' } });

      return NextResponse.json({
        success: true,
        message: 'Your email address has been verified successfully. You may now log in.',
      });
    }

    return NextResponse.json(
      { success: false, message: 'Email and verification code or token are required.' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Error in POST /api/v1/auth/verify-email:', error);
    return NextResponse.json(
      { success: false, message: 'Email verification failed due to a server error.' },
      { status: 500 }
    );
  }
}
