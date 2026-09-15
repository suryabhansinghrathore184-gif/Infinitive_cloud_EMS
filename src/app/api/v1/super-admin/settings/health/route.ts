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

    // 1. Ping Database Connection
    let isDbConnected = false;
    try {
      const pingRes = await db.command({ ping: 1 });
      isDbConnected = Boolean(pingRes && pingRes.ok === 1);
    } catch {
      isDbConnected = false;
    }

    // 2. Obtain database name
    const dbName = db.databaseName || 'ems_database';

    // 3. Inspect GridFS Collections
    const photosCount = await db.collection('photos.files').countDocuments().catch(() => 0);
    const documentsCount = await db.collection('documents.files').countDocuments().catch(() => 0);

    const healthData = {
      dbName,
      mongoStatus: isDbConnected ? 'Connected' : 'Failed',
      gridfsStatus: isDbConnected ? 'Healthy' : 'Failed',
      photosBucketStatus: isDbConnected ? 'Healthy' : 'Failed',
      documentsBucketStatus: isDbConnected ? 'Healthy' : 'Failed',
      totalPhotos: photosCount,
      totalDocuments: documentsCount,
      lastCheckedAt: new Date().toISOString(),
    };

    await logAuditEvent(req, 'DATABASE_HEALTH_CHECKED', {
      details: { checkedBy: auth.email, status: isDbConnected ? 'HEALTHY' : 'FAILED', dbName },
    });

    return NextResponse.json({
      success: true,
      data: healthData,
    });
  } catch (error: any) {
    console.error('Error in GET /api/v1/super-admin/settings/health:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Database & GridFS health check failed' },
      { status: 500 }
    );
  }
}
