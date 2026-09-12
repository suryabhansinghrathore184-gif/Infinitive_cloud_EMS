import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { generateSecureToken, hashToken } from '@/lib/cryptoAuth';
import { createNotification } from '@/lib/notifications/notificationService';
import { logAuditEvent } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { success: false, message: 'Valid email address is required.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const { db } = await connectToDatabase();

    const user = await db.collection('users').findOne({ email: cleanEmail });

    if (user && !user.emailVerified) {
      const token = generateSecureToken(32);
      const tokenHash = hashToken(token);
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours

      await db.collection('auth_tokens').updateMany(
        { email: cleanEmail, type: 'EMAIL_VERIFICATION', used: false },
        { $set: { used: true } }
      );

      await db.collection('auth_tokens').insertOne({
        type: 'EMAIL_VERIFICATION',
        userId: user.id || user._id.toString(),
        email: cleanEmail,
        tokenHash,
        used: false,
        createdAt: now,
        expiresAt,
      });

      const origin = req.headers.get('origin') || 'http://localhost:3000';
      const verifyUrl = `${origin}/verify-email?token=${token}`;

      try {
        await createNotification({
          organizationId: user.organizationId || 'org-default',
          recipientType: 'EMPLOYEE',
          recipientId: user.employeeId || cleanEmail,
          eventType: 'email_verification',
          category: 'SECURITY',
          title: 'Verify Your Email Address',
          message: `Please verify your email address by clicking: ${verifyUrl}`,
          actionUrl: verifyUrl,
          priority: 'NORMAL',
          recipientEmail: cleanEmail,
        });
      } catch (err) {
        console.warn('Notification error:', err);
      }

      await logAuditEvent(req, 'EMAIL_VERIFICATION_RESENT', { details: { email: cleanEmail } });
    }

    return NextResponse.json({
      success: true,
      message: 'If an unverified account exists for this email, a verification link has been sent.',
    });
  } catch (error: any) {
    console.error('Error in POST /api/v1/auth/resend-verification:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to process request.' },
      { status: 500 }
    );
  }
}
