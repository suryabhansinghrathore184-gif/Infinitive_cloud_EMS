import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext, checkPermissions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { logAuditEvent } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const auth = getAuthContext(req);
    const perm = checkPermissions(auth);
    if (!perm.isAllowed) {
      return NextResponse.json({ success: false, message: perm.message }, { status: perm.statusCode });
    }

    const { db } = await connectToDatabase();

    const policyDoc = await db.collection('notification_retention').findOne({
      organizationId: auth.organizationId,
    });

    return NextResponse.json({
      success: true,
      retentionDays: policyDoc?.retentionDays || 90,
      configured: Boolean(policyDoc),
      updatedAt: policyDoc?.updatedAt || null,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = getAuthContext(req);
    const perm = checkPermissions(auth, ['SUPER_ADMIN', 'ADMIN']);
    if (!perm.isAllowed) {
      return NextResponse.json({ success: false, message: perm.message }, { status: perm.statusCode });
    }

    const body = await req.json();
    const retentionDays = Number(body.retentionDays);

    if (![7, 30, 60, 90, 180, 365].includes(retentionDays)) {
      return NextResponse.json({ success: false, message: 'Invalid retentionDays value. Allowed: 7, 30, 60, 90, 180, 365.' }, { status: 400 });
    }

    const nowISO = new Date().toISOString();
    const { db } = await connectToDatabase();

    await db.collection('notification_retention').updateOne(
      { organizationId: auth.organizationId },
      {
        $set: {
          organizationId: auth.organizationId,
          retentionDays,
          updatedAt: nowISO,
          updatedBy: auth.userId,
        },
      },
      { upsert: true }
    );

    await logAuditEvent(req, 'UPDATE_NOTIFICATION_RETENTION', {
      details: { retentionDays },
    });

    return NextResponse.json({
      success: true,
      message: `Notification retention policy set to ${retentionDays} Days`,
      retentionDays,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
