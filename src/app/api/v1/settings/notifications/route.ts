import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getAuthContext, checkPermissions } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';

export const dynamic = 'force-dynamic';

// GET /api/v1/settings/notifications - Fetch notification settings & channel health
export async function GET(req: NextRequest) {
  try {
    const auth = getAuthContext(req);
    const perm = checkPermissions(auth);
    if (!perm.isAllowed) {
      return NextResponse.json(
        { success: false, message: perm.message },
        { status: perm.statusCode }
      );
    }

    const { db } = await connectToDatabase();
    const orgId = auth.organizationId;

    const integrations = await db.collection('integrations').find({
      $or: [{ organizationId: orgId }, { organizationId: 'org-default' }, { organizationId: { $exists: false } }],
    }).toArray();

    const whatsappIntegration = integrations.find((i) => i.provider === 'whatsapp');
    const emailIntegration = integrations.find((i) => i.provider === 'email' || i.provider === 'smtp');
    const smsIntegration = integrations.find((i) => i.provider === 'sms');

    const channelHealth = {
      IN_APP: { status: 'CONNECTED', label: 'In-App Notifications', configurable: true },
      EMAIL: {
        status: emailIntegration?.status === 'CONNECTED' ? 'CONNECTED' : 'NOT_CONFIGURED',
        label: 'Email / SMTP Gateway',
        configurable: emailIntegration?.status === 'CONNECTED',
      },
      WHATSAPP: {
        status: whatsappIntegration?.status === 'CONNECTED' ? 'CONNECTED' : 'NOT_CONFIGURED',
        label: 'WhatsApp Business API',
        configurable: whatsappIntegration?.status === 'CONNECTED',
      },
      SMS: {
        status: smsIntegration?.status === 'CONNECTED' ? 'CONNECTED' : 'NOT_CONFIGURED',
        label: 'SMS Gateway',
        configurable: smsIntegration?.status === 'CONNECTED',
      },
    };

    const [prefsDoc, orgDoc] = await Promise.all([
      db.collection('notification_preferences').findOne({ organizationId: orgId }),
      db.collection('organization_settings').findOne({ organizationId: orgId }),
    ]);

    const retentionDays = orgDoc?.notifications?.retentionDays || '90';
    const preferences = prefsDoc?.events || [];

    return NextResponse.json({
      success: true,
      data: {
        organizationId: orgId,
        retentionDays,
        channelHealth,
        preferences,
      },
    });
  } catch (error: any) {
    console.error('Error in GET /api/v1/settings/notifications:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch notification settings.' },
      { status: 500 }
    );
  }
}

// PATCH /api/v1/settings/notifications - Update notification settings with channel validation
export async function PATCH(req: NextRequest) {
  try {
    const auth = getAuthContext(req);
    const perm = checkPermissions(auth, ['SUPER_ADMIN', 'ADMIN']);
    if (!perm.isAllowed) {
      return NextResponse.json(
        { success: false, message: perm.message },
        { status: perm.statusCode }
      );
    }

    const body = await req.json();
    const { retentionDays, preferences } = body;

    const { db } = await connectToDatabase();
    const orgId = auth.organizationId;
    const now = new Date();

    const integrations = await db.collection('integrations').find({
      $or: [{ organizationId: orgId }, { organizationId: 'org-default' }, { organizationId: { $exists: false } }],
    }).toArray();

    const isWhatsAppHealthy = integrations.some((i) => i.provider === 'whatsapp' && i.status === 'CONNECTED');
    const isEmailHealthy = integrations.some((i) => (i.provider === 'email' || i.provider === 'smtp') && i.status === 'CONNECTED');
    const isSmsHealthy = integrations.some((i) => i.provider === 'sms' && i.status === 'CONNECTED');

    if (Array.isArray(preferences)) {
      for (const pref of preferences) {
        if (pref.channels?.includes('WHATSAPP') && !isWhatsAppHealthy) {
          return NextResponse.json(
            {
              success: false,
              message: `Cannot enable WhatsApp channel for "${pref.eventName || pref.eventKey}" because WhatsApp Integration is not connected. Please configure WhatsApp under /admin/integrations first.`,
            },
            { status: 400 }
          );
        }
        if (pref.channels?.includes('EMAIL') && !isEmailHealthy) {
          return NextResponse.json(
            {
              success: false,
              message: `Cannot enable Email channel for "${pref.eventName || pref.eventKey}" because Email/SMTP Integration is not connected. Please configure Email under /admin/integrations first.`,
            },
            { status: 400 }
          );
        }
        if (pref.channels?.includes('SMS') && !isSmsHealthy) {
          return NextResponse.json(
            {
              success: false,
              message: `Cannot enable SMS channel for "${pref.eventName || pref.eventKey}" because SMS Gateway is not connected. Please configure SMS under /admin/integrations first.`,
            },
            { status: 400 }
          );
        }
      }

      await db.collection('notification_preferences').updateOne(
        { organizationId: orgId },
        {
          $set: {
            organizationId: orgId,
            events: preferences,
            updatedAt: now,
          },
        },
        { upsert: true }
      );
    }

    if (retentionDays) {
      await db.collection('organization_settings').updateOne(
        { organizationId: orgId },
        {
          $set: {
            'notifications.retentionDays': String(retentionDays),
            updatedAt: now,
          },
        },
        { upsert: true }
      );
    }

    await logAuditEvent(req, 'UPDATE_NOTIFICATION_SETTINGS', {
      details: { organizationId: orgId, retentionDays, updatedEventsCount: Array.isArray(preferences) ? preferences.length : 0 },
    });

    return NextResponse.json({
      success: true,
      message: 'Notification settings & channel preferences updated successfully.',
    });
  } catch (error: any) {
    console.error('Error in PATCH /api/v1/settings/notifications:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update notification settings.' },
      { status: 500 }
    );
  }
}
