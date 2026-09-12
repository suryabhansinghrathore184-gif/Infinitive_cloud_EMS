import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext, checkPermissions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { logAuditEvent } from '@/lib/audit';
import { processBiometricPunches } from '@/lib/integrations/biometric';

export async function POST(req: NextRequest) {
  try {
    const auth = getAuthContext(req);
    const perm = checkPermissions(auth, ['SUPER_ADMIN', 'ADMIN', 'HR']);
    if (!perm.isAllowed) {
      return NextResponse.json({ success: false, message: perm.message }, { status: perm.statusCode });
    }

    const { db } = await connectToDatabase();
    const body = await req.json().catch(() => ({}));

    // Fetch biometric config & custom employee mappings from DB
    const bioConfig = await db.collection('integrations').findOne({
      organizationId: auth.organizationId,
      provider: 'biometric',
    });

    const samplePunches = body.punches || [
      {
        biometricPunchId: `p-${Date.now()}-1`,
        deviceUserId: 'BIO-1024',
        timestamp: new Date().toISOString(),
        punchType: 'IN',
      },
    ];

    const syncResult = await processBiometricPunches(
      auth.organizationId,
      samplePunches,
      bioConfig?.employeeMappings || []
    );

    // Audit Event
    await logAuditEvent(req, 'SYNC_BIOMETRIC_PUNCHES', {
      details: {
        importedCount: syncResult.importedCount,
        duplicatesCount: syncResult.duplicatesCount,
        unmatchedCount: syncResult.unmatchedCount,
      },
    });

    return NextResponse.json({
      success: true,
      syncResult,
    });
  } catch (err: any) {
    console.error('Biometric Sync Error:', err);
    return NextResponse.json({ success: false, message: err.message || 'Biometric synchronization failed' }, { status: 500 });
  }
}
