import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext, checkPermissions } from '@/lib/auth';
import { getNotificationPreferences, updateNotificationPreference } from '@/lib/notifications/notificationPreferences';
import { logAuditEvent } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const auth = getAuthContext(req);
    const perm = checkPermissions(auth);
    if (!perm.isAllowed) {
      return NextResponse.json({ success: false, message: perm.message }, { status: perm.statusCode });
    }

    const preferences = await getNotificationPreferences(auth.organizationId);

    return NextResponse.json({
      success: true,
      preferences,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = getAuthContext(req);
    const perm = checkPermissions(auth, ['SUPER_ADMIN', 'ADMIN', 'HR']);
    if (!perm.isAllowed) {
      return NextResponse.json({ success: false, message: perm.message }, { status: perm.statusCode });
    }

    const body = await req.json();
    const eventType = body.eventType;

    if (!eventType) {
      return NextResponse.json({ success: false, message: 'eventType is required' }, { status: 400 });
    }

    await updateNotificationPreference(auth.organizationId, {
      eventType,
      category: body.category,
      inApp: body.inApp !== false,
      email: Boolean(body.email),
      whatsapp: Boolean(body.whatsapp),
      sms: Boolean(body.sms),
      push: Boolean(body.push),
      enabled: body.enabled !== false,
    });

    await logAuditEvent(req, 'UPDATE_NOTIFICATION_PREFERENCE', {
      details: { eventType, preferences: body },
    });

    return NextResponse.json({
      success: true,
      message: `Updated notification preferences for ${eventType}`,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
