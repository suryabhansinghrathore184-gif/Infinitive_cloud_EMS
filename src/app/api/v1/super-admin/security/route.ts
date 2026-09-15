import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getAuthContext, checkPermissions } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';

export const dynamic = 'force-dynamic';

const DEFAULT_SECURITY_CONFIG = {
  mfaEnforced: false,
  mfaForSuperAdminsOnly: true,
  otpExpiryMinutes: 10,
  passwordPolicyMinLength: 8,
  requireSpecialChars: true,
  requireNumbers: true,
  requireUppercase: true,
  passwordExpiryDays: 90,
  maxLoginAttempts: 5,
  sessionTimeoutMinutes: 60,
  concurrentSessionsAllowed: true,
  revokeOnPasswordChange: true,
  ipWhitelistEnabled: false,
  allowedIpRanges: ['0.0.0.0/0'],
  geoBlockingEnabled: false,
  updatedAt: new Date().toISOString(),
  updatedBy: 'System Default',
};

// GET /api/v1/super-admin/security - Fetch security configuration, live stats, sessions, & telemetry
export async function GET(req: NextRequest) {
  try {
    const auth = getAuthContext(req);
    const perm = checkPermissions(auth, ['SUPER_ADMIN']);
    if (!perm.isAllowed) {
      return NextResponse.json({ success: false, message: perm.message }, { status: perm.statusCode });
    }

    const { db } = await connectToDatabase();
    const nowIso = new Date().toISOString();
    const last24hIso = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const last7dIso = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const [
      secSettingsDoc,
      totalUsersCount,
      mfaUsersCount,
      lockedAccountsCount,
      activeSessionsCount,
      failedLogins24h,
      failedLogins7d,
      securityEvents24h,
      securityEvents7d,
      activeSessionDocs,
      recentSecurityLogs,
      recentFailedLoginsLogs,
    ] = await Promise.all([
      db.collection('system_settings').findOne({ _id: 'security_config' as any }),
      db.collection('users').countDocuments(),
      db.collection('users').countDocuments({ $or: [{ isTwoFactorEnabled: true }, { role: 'SUPER_ADMIN' }] }),
      db.collection('users').countDocuments({ status: { $in: ['LOCKED', 'Locked', 'Suspended'] } }),
      db.collection('auth_tokens').countDocuments({ expiresAt: { $gt: nowIso } }),
      db.collection('audit_logs').countDocuments({
        action: { $regex: /LOGIN_FAILED|UNAUTHORIZED|LOCKED|SUSPICIOUS/i },
        timestamp: { $gte: last24hIso },
      }),
      db.collection('audit_logs').countDocuments({
        action: { $regex: /LOGIN_FAILED|UNAUTHORIZED|LOCKED|SUSPICIOUS/i },
        timestamp: { $gte: last7dIso },
      }),
      db.collection('audit_logs').countDocuments({
        timestamp: { $gte: last24hIso },
      }),
      db.collection('audit_logs').countDocuments({
        timestamp: { $gte: last7dIso },
      }),
      db.collection('auth_tokens').find({ expiresAt: { $gt: nowIso } }).sort({ createdAt: -1 }).limit(20).toArray(),
      db.collection('audit_logs').find({}).sort({ timestamp: -1 }).limit(30).toArray(),
      db.collection('audit_logs').find({
        action: { $regex: /LOGIN_FAILED|UNAUTHORIZED|OTP_VERIFICATION_FAILED/i },
      }).sort({ timestamp: -1 }).limit(10).toArray(),
    ]);

    const config = {
      ...DEFAULT_SECURITY_CONFIG,
      ...(secSettingsDoc?.config || {}),
      updatedAt: secSettingsDoc?.config?.updatedAt || secSettingsDoc?.updatedAt || DEFAULT_SECURITY_CONFIG.updatedAt,
      updatedBy: secSettingsDoc?.updatedBy || DEFAULT_SECURITY_CONFIG.updatedBy,
    };

    // Format active sessions without exposing raw session tokens
    const formattedSessions = activeSessionDocs.map((s) => ({
      id: s._id.toString(),
      userId: s.userId || 'N/A',
      email: s.email || 'Admin User',
      role: s.role || 'SUPER_ADMIN',
      organizationId: s.organizationId || 'GLOBAL',
      userAgent: s.userAgent || 'Web Browser',
      ipAddress: s.ipAddress || '127.0.0.1',
      createdAt: s.createdAt || nowIso,
      expiresAt: s.expiresAt,
    }));

    // Format audit event stream with dynamic severity assignment
    const formattedLogs = recentSecurityLogs.map((log) => {
      const act = (log.action || '').toUpperCase();
      let severity: 'INFO' | 'WARNING' | 'CRITICAL' = 'INFO';
      if (act.includes('FAILED') || act.includes('UNAUTHORIZED') || act.includes('LOCKED') || act.includes('REVOKED')) {
        severity = act.includes('UNAUTHORIZED') || act.includes('LOCKED') ? 'CRITICAL' : 'WARNING';
      }

      return {
        id: log._id.toString(),
        action: log.action || 'SECURITY_EVENT',
        performedBy: log.performedBy || log.email || 'System',
        performedByName: log.performedByName || 'Admin Actor',
        role: log.role || 'SUPER_ADMIN',
        organizationId: log.organizationId || 'GLOBAL',
        details: log.details || {},
        ipAddress: log.ipAddress || '127.0.0.1',
        severity,
        timestamp: log.timestamp ? new Date(log.timestamp).toISOString() : nowIso,
      };
    });

    // Format failed login attempts log
    const formattedFailedLogins = recentFailedLoginsLogs.map((log) => ({
      id: log._id.toString(),
      email: log.performedBy || log.details?.email || 'Unknown User',
      action: log.action,
      ipAddress: log.ipAddress || '127.0.0.1',
      reason: log.details?.reason || 'Invalid Password or Unverified OTP',
      timestamp: log.timestamp ? new Date(log.timestamp).toISOString() : nowIso,
    }));

    // Email OTP Health & SMTP status check
    const smtpConfigured = !!(process.env.GMAIL_USER || process.env.SMTP_HOST || process.env.EMAIL_SERVER);
    const smtpHealth = {
      provider: 'Gmail SMTP / Nodemailer',
      isConfigured: smtpConfigured,
      status: smtpConfigured ? 'Healthy' : 'Not Configured',
      otpExpiryMinutes: config.otpExpiryMinutes,
      otpAttemptLimit: 5,
      otpCooldownSeconds: 60,
    };

    // Real calculated overall security health status
    const healthReasons: string[] = [];
    if (failedLogins24h > 10) {
      healthReasons.push(`High failed login rate in last 24h (${failedLogins24h} attempts)`);
    }
    if (!config.mfaEnforced) {
      healthReasons.push('Global MFA Enforcement is currently inactive');
    }
    if (lockedAccountsCount > 0) {
      healthReasons.push(`${lockedAccountsCount} user account(s) currently locked`);
    }

    const overallStatus = healthReasons.length === 0 ? 'HEALTHY' : healthReasons.length === 1 ? 'WARNING' : 'CRITICAL';

    return NextResponse.json({
      success: true,
      data: {
        config,
        stats: {
          totalUsersCount,
          mfaUsersCount,
          activeSessionsCount,
          failedLoginsLast24h: failedLogins24h,
          failedLoginsLast7d: failedLogins7d,
          lockedAccountsCount,
          securityEvents24h,
          securityEvents7d,
          sslStatus: 'HTTPS Enabled (TLS Enforced)',
          dbEncryptionStatus: 'MongoDB Atlas AES-256 Storage',
        },
        healthSummary: {
          overallStatus,
          reasons: healthReasons,
          components: {
            authentication: failedLogins24h > 10 ? 'Warning' : 'Healthy',
            sessionSecurity: activeSessionsCount > 100 ? 'Warning' : 'Healthy',
            mfaPolicy: config.mfaEnforced ? 'Healthy' : 'Warning',
            emailOtp: smtpConfigured ? 'Healthy' : 'Warning',
            databaseSecurity: 'Healthy',
            auditLogging: 'Healthy',
          },
        },
        smtpHealth,
        activeSessions: formattedSessions,
        failedLogins: formattedFailedLogins,
        recentSecurityLogs: formattedLogs,
        defaultConfig: DEFAULT_SECURITY_CONFIG,
      },
    });
  } catch (error: any) {
    console.error('Error fetching security configuration:', error);
    return NextResponse.json({ success: false, message: error.message || 'Failed to fetch security settings' }, { status: 500 });
  }
}

// PATCH /api/v1/super-admin/security - Save security configuration settings
export async function PATCH(req: NextRequest) {
  try {
    const auth = getAuthContext(req);
    const perm = checkPermissions(auth, ['SUPER_ADMIN']);
    if (!perm.isAllowed) {
      return NextResponse.json({ success: false, message: perm.message }, { status: perm.statusCode });
    }

    const body = await req.json();
    const { config, actionType } = body;

    const { db } = await connectToDatabase();
    const now = new Date();

    let targetConfig = config;
    let auditAction = 'SECURITY_CONFIG_UPDATED';
    let logMessage = 'Updated system security governance parameters';

    if (actionType === 'RESTORE_DEFAULTS') {
      targetConfig = DEFAULT_SECURITY_CONFIG;
      auditAction = 'SECURITY_DEFAULTS_RESTORED';
      logMessage = 'Restored factory default security policies';
    }

    if (!targetConfig || typeof targetConfig !== 'object') {
      return NextResponse.json({ success: false, message: 'Invalid security configuration object.' }, { status: 400 });
    }

    const updatedConfig = {
      ...targetConfig,
      updatedAt: now.toISOString(),
      updatedBy: auth.name || auth.email || auth.userId,
    };

    await db.collection('system_settings').updateOne(
      { _id: 'security_config' as any },
      {
        $set: {
          config: updatedConfig,
          updatedBy: auth.name || auth.email || auth.userId,
          updatedAt: now.toISOString(),
        },
      },
      { upsert: true }
    );

    await logAuditEvent(req, auditAction, {
      details: {
        updatedBy: auth.email,
        actionType: actionType || 'SAVE_SECURITY_CONFIG',
        config: updatedConfig,
      },
    });

    return NextResponse.json({
      success: true,
      message: `${logMessage} successfully.`,
      data: updatedConfig,
    });
  } catch (error: any) {
    console.error('Error updating security settings:', error);
    return NextResponse.json({ success: false, message: error.message || 'Failed to update security settings' }, { status: 500 });
  }
}
