import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext, checkPermissions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { logAuditEvent } from '@/lib/audit';

export async function POST(
  req: NextRequest,
  { params }: { params: { provider: string } }
) {
  try {
    const auth = getAuthContext(req);
    const perm = checkPermissions(auth, ['SUPER_ADMIN', 'ADMIN']);
    if (!perm.isAllowed) {
      return NextResponse.json({ success: false, message: perm.message }, { status: perm.statusCode });
    }

    const provider = params.provider.toLowerCase();
    const nowISO = new Date().toISOString();
    const { db } = await connectToDatabase();

    await db.collection('integrations').updateOne(
      { organizationId: auth.organizationId, provider },
      { $set: { enabled: false, status: 'DISABLED', updatedAt: nowISO } },
      { upsert: true }
    );

    await logAuditEvent(req, 'DISABLE_INTEGRATION', { details: { provider } });

    return NextResponse.json({
      success: true,
      message: `${provider.toUpperCase()} integration disabled. Configuration retained securely.`,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
