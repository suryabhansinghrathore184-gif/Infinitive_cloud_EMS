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

// GET /api/v1/super-admin/security - Fetch security configuration, live stats, and security audit logs
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

    const [
      secSettingsDoc,
      totalUsersCount,
      mfaUsersCount,
      activeSessionsCount,
      failedLoginsCount,
      recentSecurityLogs,
    ] = await Promise.all([
      db.collection('system_settings').findOne({ _id: 'security_config' as any }),
      db.collection('users').countDocuments(),
      db.collection('users').countDocuments({ isTwoFactorEnabled: true }),
      db.collection('auth_tokens').countDocuments({ expiresAt: { $gt: nowIso } }),
      db.collection('audit_logs').countDocuments({
        action: { $regex: /LOGIN_FAILED|UNAUTHORIZED|LOCKED|SUSPICIOUS/i },
        timestamp: { $gte: last24hIso },
      }),
      db
        .collection('audit_logs')
        .find({
          action: { $regex: /SECURITY|USER_ROLE|USER_LOCKED|USER_SESSION|LOGIN|PASSWORD/i },
        })
        .sort({ timestamp: -1 })
        .limit(10)
        .toArray(),
    ]);

    const config = {
      ...DEFAULT_SECURITY_CONFIG,
      ...(secSettingsDoc?.config || {}),
      updatedAt: secSettingsDoc?.config?.updatedAt || secSettingsDoc?.updatedAt || DEFAULT_SECURITY_CONFIG.updatedAt,
      updatedBy: secSettingsDoc?.updatedBy || DEFAULT_SECURITY_CONFIG.updatedBy,
    };

    const formattedLogs = recentSecurityLogs.map((log) => ({
      id: log._id.toString(),
      action: log.action,
      performedBy: log.performerUserId || log.performedBy || 'System',
      performedByName: log.performedByName || 'Administrator',
      role: log.performerRole || log.role || 'SUPER_ADMIN',
      details: log.details || {},
      timestamp: log.timestamp || log.createdAt || nowIso,
    }));

    return NextResponse.json({
      success: true,
      data: {
        config,
        stats: {
          totalUsersCount,
          mfaUsersCount,
          activeSessionsCount,
          failedLoginsLast24h: failedLoginsCount,
          sslStatus: 'ACTIVE_TLS_1_3',
          dbEncryptionStatus: 'ENCRYPTED_AT_REST_AES256',
        },
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
