import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getAuthContext, checkPermissions } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const auth = getAuthContext(req);
    const perm = checkPermissions(auth, ['SUPER_ADMIN']);
    if (!perm.isAllowed) {
      return NextResponse.json({ success: false, message: perm.message }, { status: perm.statusCode });
    }

    const { db } = await connectToDatabase();

    const globalDoc = await db.collection('system_settings').findOne({ _id: 'global_app_config' as any });

    const defaultConfig = {
      systemName: 'Employee Management System (EMS)',
      maintenanceMode: false,
      allowSelfSignup: true,
      defaultOrganizationCode: 'DEFAULT',
      defaultTimezone: 'Asia/Kolkata',
      supportEmail: 'support@ems-hrms.com',
      smtpHost: 'smtp.gmail.com',
      smtpPort: 587,
      smtpConfigured: Boolean(process.env.SMTP_HOST || process.env.GMAIL_USER),
      storageBackend: 'MongoDB GridFS',
      dataRetentionDays: 365,
      currency: 'INR (₹)',
      dateFormat: 'DD/MM/YYYY',
      language: 'English (US)',
      updatedAt: new Date().toISOString(),
    };

    const config = {
      ...defaultConfig,
      ...(globalDoc?.config || {}),
      smtpConfigured: Boolean(process.env.SMTP_HOST || process.env.GMAIL_USER || globalDoc?.config?.smtpConfigured),
    };

    return NextResponse.json({
      success: true,
      data: config,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || 'Failed to fetch global system settings' }, { status: 500 });
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
    const currentConfig = existingDoc?.config || {};

    const updatedConfig = {
      ...currentConfig,
      ...body,
      updatedAt: now.toISOString(),
    };

    await db.collection('system_settings').updateOne(
      { _id: 'global_app_config' as any },
      {
        $set: {
          config: updatedConfig,
          updatedBy: auth.email || auth.userId,
        },
      },
      { upsert: true }
    );

    // Audit logging for specific system control updates
    if (typeof body.maintenanceMode === 'boolean' && body.maintenanceMode !== currentConfig.maintenanceMode) {
      await logAuditEvent(req, 'MAINTENANCE_MODE_CHANGED', {
        details: { enabled: body.maintenanceMode, updatedBy: auth.email },
      });
    }

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
    return NextResponse.json({ success: false, message: error.message || 'Failed to update system settings' }, { status: 500 });
  }
}
