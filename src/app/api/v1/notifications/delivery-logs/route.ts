import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext, checkPermissions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const auth = getAuthContext(req);
    const perm = checkPermissions(auth, ['SUPER_ADMIN', 'ADMIN', 'HR']);
    if (!perm.isAllowed) {
      return NextResponse.json({ success: false, message: perm.message }, { status: perm.statusCode });
    }

    const { db } = await connectToDatabase();

    const logs = await db
      .collection('notification_delivery_logs')
      .find({ organizationId: auth.organizationId })
      .sort({ attemptedAt: -1 })
      .limit(50)
      .toArray();

    const formatted = logs.map((l) => ({
      id: String(l._id),
      notificationId: l.notificationId,
      channel: l.channel,
      provider: l.provider || l.channel,
      status: l.status,
      providerMessageId: l.providerMessageId || null,
      errorMessage: l.errorMessage || null,
      attemptedAt: l.attemptedAt,
    }));

    return NextResponse.json({
      success: true,
      logs: formatted,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
