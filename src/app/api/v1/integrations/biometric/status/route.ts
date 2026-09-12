import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext, checkPermissions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET(req: NextRequest) {
  try {
    const auth = getAuthContext(req);
    const perm = checkPermissions(auth, ['SUPER_ADMIN', 'ADMIN', 'HR']);
    if (!perm.isAllowed) {
      return NextResponse.json({ success: false, message: perm.message }, { status: perm.statusCode });
    }

    const { db } = await connectToDatabase();

    const lastLog = await db
      .collection('biometric_sync_logs')
      .find({ organizationId: auth.organizationId })
      .sort({ syncedAt: -1 })
      .limit(1)
      .next();

    if (!lastLog) {
      return NextResponse.json({
        success: true,
        hasSynced: false,
        message: 'No synchronization performed yet',
        metrics: {
          lastSyncAt: null,
          importedCount: 0,
          skippedCount: 0,
          duplicatesCount: 0,
          unmatchedCount: 0,
          unmatchedDeviceUsers: [],
        },
      });
    }

    return NextResponse.json({
      success: true,
      hasSynced: true,
      metrics: {
        lastSyncAt: lastLog.syncedAt,
        status: lastLog.status,
        importedCount: lastLog.importedCount || 0,
        skippedCount: lastLog.skippedCount || 0,
        duplicatesCount: lastLog.duplicatesCount || 0,
        unmatchedCount: lastLog.unmatchedCount || 0,
        unmatchedDeviceUsers: lastLog.unmatchedDeviceUsers || [],
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
