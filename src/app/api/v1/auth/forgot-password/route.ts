import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { generateSecureToken, hashToken } from '@/lib/cryptoAuth';
import { sendOtpEmail } from '@/lib/email';
import { createNotification } from '@/lib/notifications/notificationService';
import { logAuditEvent } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { success: false, message: 'Please enter a valid email address.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const { db } = await connectToDatabase();

    const user = await db.collection('users').findOne({ email: cleanEmail });

    if (user) {
      const resetToken = generateSecureToken(32);
      const tokenHash = hashToken(resetToken);
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour expiration

      // Invalidate existing active tokens for this user
      await db.collection('password_reset_tokens').updateMany(
        { email: cleanEmail, used: false },
        { $set: { used: true, invalidatedAt: now } }
      );

      // Save token document
      await db.collection('password_reset_tokens').insertOne({
        userId: user.id || user._id.toString(),
        email: cleanEmail,
        tokenHash,
        used: false,
        createdAt: now,
        expiresAt,
      });

      // Dispatch reset instructions email
      const origin = req.headers.get('origin') || req.headers.get('referer') || 'http://localhost:3000';
      const resetUrl = `${origin}/reset-password?token=${resetToken}`;

      try {
        await sendOtpEmail({
          to: cleanEmail,
          otp: resetToken,
          purpose: 'PASSWORD_RESET',
          userName: user.name,
          organizationName: user.organizationId,
        });

        await createNotification({
          organizationId: user.organizationId || 'org-default',
          recipientType: 'EMPLOYEE',
          recipientId: user.employeeId || user.email,
          eventType: 'password_reset',
          category: 'SECURITY',
          title: 'Password Reset Request',
          message: `Click the link below to reset your EMS password:\n${resetUrl}`,
          actionUrl: resetUrl,
          priority: 'HIGH',
          recipientEmail: cleanEmail,
        });
      } catch (notifErr) {
        console.warn('Could not dispatch password reset email/notification:', notifErr);
      }

      await logAuditEvent(req, 'PASSWORD_RESET_REQUESTED', { details: { email: cleanEmail } });
    }

    // Generic response to prevent account enumeration
    return NextResponse.json({
      success: true,
      message: 'If an account exists for this email, password reset instructions have been sent.',
    });
  } catch (error: any) {
    console.error('Error in POST /api/v1/auth/forgot-password:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to process password reset request.' },
      { status: 500 }
    );
  }
}
