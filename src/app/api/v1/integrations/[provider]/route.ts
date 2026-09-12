import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext, checkPermissions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { maskSecret } from '@/lib/integrations/encryption';

export async function GET(
  req: NextRequest,
  { params }: { params: { provider: string } }
) {
  try {
    const auth = getAuthContext(req);
    const perm = checkPermissions(auth, ['SUPER_ADMIN', 'ADMIN', 'HR']);
    if (!perm.isAllowed) {
      return NextResponse.json({ success: false, message: perm.message }, { status: perm.statusCode });
    }

    const provider = params.provider.toLowerCase();
    const { db } = await connectToDatabase();

    const configDoc = await db.collection('integrations').findOne({
      organizationId: auth.organizationId,
      provider,
    });

    if (!configDoc) {
      return NextResponse.json({
        success: true,
        provider,
        status: 'NOT_CONFIGURED',
        config: null,
      });
    }

    // Mask secrets before returning
    const safeConfig = { ...configDoc };
    delete safeConfig.clientSecret;
    delete safeConfig.accessToken;
    delete safeConfig.refreshToken;
    delete safeConfig.apiKey;
    delete safeConfig.authSecret;

    if (configDoc.accessToken) safeConfig.accessToken = maskSecret(configDoc.accessToken);
    if (configDoc.apiKey) safeConfig.apiKey = maskSecret(configDoc.apiKey);
    if (configDoc.webhookVerifyToken) safeConfig.webhookVerifyToken = maskSecret(configDoc.webhookVerifyToken);

    return NextResponse.json({
      success: true,
      provider,
      status: configDoc.status || 'NOT_CONFIGURED',
      config: safeConfig,
      lastTestedAt: configDoc.lastTestedAt,
      lastSuccessAt: configDoc.lastSuccessAt,
      enabled: configDoc.enabled !== false,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
