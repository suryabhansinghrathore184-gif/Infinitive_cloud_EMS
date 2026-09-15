import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getAuthContext, checkPermissions } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';

export const dynamic = 'force-dynamic';

const DEFAULT_SYSTEM_CONFIG = {
  systemName: 'Employee Management System (EMS)',
  maintenanceMode: false,
  allowSelfSignup: true,
  defaultOrganizationCode: 'ICS-HQ',
  defaultTimezone: 'Asia/Kolkata',
  supportEmail: 'support@ems-hrms.com',
  smtpHost: process.env.SMTP_HOST || 'smtp.gmail.com',
  smtpPort: parseInt(process.env.SMTP_PORT || '587', 10),
  smtpConfigured: Boolean(process.env.SMTP_HOST || process.env.GMAIL_USER),
  storageBackend: 'MongoDB GridFS',
  dataRetentionDays: 90,
  currency: 'INR (₹)',
  dateFormat: 'DD/MM/YYYY',
  language: 'English (US)',
  updatedAt: new Date().toISOString(),
};

export async function GET(req: NextRequest) {
  try {
    const auth = getAuthContext(req);
    const perm = checkPermissions(auth, ['SUPER_ADMIN']);
    if (!perm.isAllowed) {
      return NextResponse.json({ success: false, message: perm.message }, { status: perm.statusCode });
    }

    const { db } = await connectToDatabase();

    // 1. Fetch system_settings document (safe one-time initialization if empty)
    let globalDoc = await db.collection('system_settings').findOne({ _id: 'global_app_config' as any });

    if (!globalDoc) {
      await db.collection('system_settings').updateOne(
        { _id: 'global_app_config' as any },
        {
          $setOnInsert: {
            config: DEFAULT_SYSTEM_CONFIG,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
        { upsert: true }
      );
      globalDoc = await db.collection('system_settings').findOne({ _id: 'global_app_config' as any });
    }

    const docConfig = globalDoc?.config || {};
    const config = {
      ...DEFAULT_SYSTEM_CONFIG,
      ...docConfig,
      smtpConfigured: Boolean(process.env.SMTP_HOST || process.env.GMAIL_USER || docConfig.smtpConfigured),
    };

    return NextResponse.json({
      success: true,
      data: config,
    });
  } catch (error: any) {
    console.error('Error in GET /api/v1/super-admin/settings:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch global system settings' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = getAuthContext(req);
    const perm = checkPermissions(auth, ['SUPER_ADMIN']);
    if (!perm.isAllowed) {
      return NextResponse.json({ success: false, message: perm.message }, { status: perm.statusCode });
    }

    const body = await req.json();
    const { db } = await connectToDatabase();
    const now = new Date();

    const existingDoc = await db.collection('system_settings').findOne({ _id: 'global_app_config' as any });
    const currentConfig = existingDoc?.config || DEFAULT_SYSTEM_CONFIG;

    const updatedConfig = {
      ...currentConfig,
      ...body,
      updatedAt: now.toISOString(),
    };

    // Remove any sensitive keys if accidentally sent in body
    delete (updatedConfig as any).password;
    delete (updatedConfig as any).passwordHash;
    delete (updatedConfig as any).gmailAppPassword;
    delete (updatedConfig as any).smtpPassword;
    delete (updatedConfig as any).mongoUri;

    await db.collection('system_settings').updateOne(
      { _id: 'global_app_config' as any },
      {
        $set: {
          config: updatedConfig,
          updatedBy: auth.email || auth.userId,
          updatedAt: now,
        },
      },
      { upsert: true }
    );

    // Audit logging for maintenance mode changes
    if (typeof body.maintenanceMode === 'boolean' && body.maintenanceMode !== currentConfig.maintenanceMode) {
      await logAuditEvent(req, 'MAINTENANCE_MODE_CHANGED', {
        details: { enabled: body.maintenanceMode, updatedBy: auth.email },
      });
    }

    // Audit logging for self registration changes
    if (typeof body.allowSelfSignup === 'boolean' && body.allowSelfSignup !== currentConfig.allowSelfSignup) {
      await logAuditEvent(req, 'SELF_REGISTRATION_CHANGED', {
        details: { allowed: body.allowSelfSignup, updatedBy: auth.email },
      });
    }

    await logAuditEvent(req, 'SYSTEM_SETTINGS_UPDATED', {
      details: { updatedBy: auth.email, changes: body },
    });

    return NextResponse.json({
      success: true,
      message: 'Global system settings updated successfully.',
      data: updatedConfig,
    });
  } catch (error: any) {
    console.error('Error in PATCH /api/v1/super-admin/settings:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update system settings' },
      { status: 500 }
    );
  }
}
