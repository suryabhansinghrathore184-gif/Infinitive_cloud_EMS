import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { getAuthContext, checkPermissions } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const auth = getAuthContext(req);
    const perm = checkPermissions(auth, ['SUPER_ADMIN']);
    if (!perm.isAllowed) {
      return NextResponse.json({ success: false, message: perm.message }, { status: perm.statusCode });
    }

    const host = process.env.SMTP_HOST || 'smtp.gmail.com';
    const port = parseInt(process.env.SMTP_PORT || '587', 10);
    const user = process.env.GMAIL_USER || process.env.SMTP_USER || '';
    const pass = process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS || '';

    const isConfigured = Boolean(user && pass);

    if (!isConfigured) {
      await logAuditEvent(req, 'SMTP_TESTED', {
        details: { testedBy: auth.email, status: 'NOT_CONFIGURED', host, port },
      });

      return NextResponse.json({
        success: true,
        data: {
          provider: 'Gmail SMTP',
          host,
          port,
          tls: port === 465 ? 'SSL/TLS' : 'STARTTLS',
          status: 'Not Configured',
          message: 'SMTP credentials (GMAIL_USER / GMAIL_APP_PASSWORD) are not present in environment.',
        },
      });
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
      connectionTimeout: 5000,
    });

    let isVerified = false;
    let errorDetail = '';

    try {
      isVerified = await transporter.verify();
    } catch (err: any) {
      isVerified = false;
      errorDetail = err.message || 'SMTP authentication failed';
    }

    const statusLabel = isVerified ? 'Connected' : 'Connection Failed';

    await logAuditEvent(req, 'SMTP_TESTED', {
      details: { testedBy: auth.email, status: statusLabel, host, port },
    });

    return NextResponse.json({
      success: true,
      data: {
        provider: 'Gmail SMTP',
        host,
        port,
        tls: port === 465 ? 'SSL/TLS' : 'STARTTLS',
        status: statusLabel,
        message: isVerified
          ? 'Gmail SMTP server relay connection verified successfully.'
          : `SMTP verification failed: ${errorDetail}`,
      },
    });
  } catch (error: any) {
    console.error('Error in POST /api/v1/super-admin/settings/test-smtp:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'SMTP connection test failed' },
      { status: 500 }
    );
  }
}
