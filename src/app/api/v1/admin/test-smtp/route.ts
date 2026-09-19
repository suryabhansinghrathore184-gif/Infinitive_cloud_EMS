import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext, checkPermissions } from '@/lib/auth';
import { verifyMailerConfig, validateGmailConfig } from '@/lib/mailer';
import { logAuditEvent } from '@/lib/audit';

export const dynamic = 'force-dynamic';

async function handleSmtpDiagnostic(req: NextRequest) {
  try {
    // 1. RBAC Authentication Check: Only ADMIN, HR, and SUPER_ADMIN allowed
    const auth = getAuthContext(req);
    const perm = checkPermissions(auth, ['ADMIN', 'HR', 'SUPER_ADMIN']);
    if (!perm.isAllowed) {
      return NextResponse.json(
        {
          success: false,
          status: 'UNAUTHORIZED',
          message: perm.message || 'Access denied. SMTP diagnostic requires ADMIN, HR, or SUPER_ADMIN permission.',
          provider: 'Gmail_SMTP',
        },
        { status: perm.statusCode || 403 }
      );
    }

    // 2. Validate environment variables
    const config = validateGmailConfig();
    if (!config.valid) {
      await logAuditEvent(req, 'SMTP_DIAGNOSTIC_FAILED', {
        details: { testedBy: auth.email, reason: 'MISSING_ENV_VARS', missing: config.missing },
      });
      return NextResponse.json(
        {
          success: false,
          status: 'UNHEALTHY',
          message: `Gmail SMTP configuration missing environment variables: ${config.missing.join(', ')}`,
          provider: 'Gmail_SMTP',
        },
        { status: 500 }
      );
    }

    // 3. Verify SMTP Transporter Connectivity
    const verification = await verifyMailerConfig();

    if (!verification.success) {
      // Sanitize any potential raw credentials or connection strings in error message
      const sanitizedError = (verification.error || 'SMTP connection verification failed')
        .replace(/pass=.*?(?=\s|;|$)/gi, 'pass=***')
        .replace(/user=.*?(?=\s|;|$)/gi, 'user=***');

      await logAuditEvent(req, 'SMTP_DIAGNOSTIC_FAILED', {
        details: { testedBy: auth.email, reason: sanitizedError },
      });

      return NextResponse.json(
        {
          success: false,
          status: 'UNHEALTHY',
          message: `Gmail SMTP verification failed: ${sanitizedError}`,
          provider: 'Gmail_SMTP',
        },
        { status: 502 }
      );
    }

    await logAuditEvent(req, 'SMTP_DIAGNOSTIC_SUCCESS', {
      details: { testedBy: auth.email, provider: 'Gmail_SMTP' },
    });

    // 4. Return exact expected success payload
    return NextResponse.json({
      success: true,
      status: 'HEALTHY',
      message: 'Gmail SMTP transporter connected and verified successfully',
      provider: 'Gmail_SMTP',
    });
  } catch (error: any) {
    console.error('[SMTP Diagnostic API] Exception:', error?.message || error);
    return NextResponse.json(
      {
        success: false,
        status: 'UNHEALTHY',
        message: 'Internal server error while executing Gmail SMTP diagnostic.',
        provider: 'Gmail_SMTP',
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  return handleSmtpDiagnostic(req);
}

export async function POST(req: NextRequest) {
  return handleSmtpDiagnostic(req);
}
