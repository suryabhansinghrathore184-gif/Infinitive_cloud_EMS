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
      {
        $set: {
          status: 'NOT_CONFIGURED',
          enabled: false,
          accessToken: null,
          refreshToken: null,
          clientSecret: null,
          apiKey: null,
          authSecret: null,
          updatedAt: nowISO,
        },
      }
    );

    await logAuditEvent(req, 'DISCONNECT_INTEGRATION', { details: { provider } });

    return NextResponse.json({
      success: true,
      message: `${provider.toUpperCase()} integration disconnected and secrets revoked.`,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
