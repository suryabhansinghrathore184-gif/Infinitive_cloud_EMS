import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext, checkPermissions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { logAuditEvent } from '@/lib/audit';
import { testGridFSConnection } from '@/lib/integrations/gridfs';
import { testWhatsAppConnection } from '@/lib/integrations/whatsapp';
import { testBiometricConnection } from '@/lib/integrations/biometric';
import { testMicrosoftConnection } from '@/lib/integrations/microsoft';
import { decryptSecret, isEncryptionConfigured } from '@/lib/integrations/encryption';

export async function POST(
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
    const nowISO = new Date().toISOString();
    const { db } = await connectToDatabase();

    const configDoc = await db.collection('integrations').findOne({
      organizationId: auth.organizationId,
      provider,
    });

    let testResult: any = null;

    if (provider === 'gridfs') {
      testResult = await testGridFSConnection();
    } else if (provider === 'whatsapp') {
      let rawToken = configDoc?.accessToken || '';
      if (rawToken && isEncryptionConfigured()) {
        try {
          rawToken = decryptSecret(rawToken);
        } catch {}
      }
      testResult = await testWhatsAppConnection({
        provider: 'whatsapp',
        phoneNumberId: configDoc?.phoneNumberId,
        businessAccountId: configDoc?.businessAccountId,
        accessToken: rawToken,
        graphVersion: configDoc?.graphVersion,
        apiBaseUrl: configDoc?.apiBaseUrl,
      });
    } else if (provider === 'biometric') {
      let rawKey = configDoc?.apiKey || '';
      if (rawKey && isEncryptionConfigured()) {
        try {
          rawKey = decryptSecret(rawKey);
        } catch {}
      }
      testResult = await testBiometricConnection({
        provider: configDoc?.provider || 'ZKTeco',
        deviceName: configDoc?.deviceName || 'ZKTeco Gateway',
        deviceId: configDoc?.deviceId || 'DEV-ZKT-01',
        connectorUrl: configDoc?.connectorUrl || '',
        apiKey: rawKey,
        syncMode: configDoc?.syncMode || 'Manual',
      });
    } else if (provider === 'microsoft') {
      let rawToken = configDoc?.accessToken || '';
      if (rawToken && isEncryptionConfigured()) {
        try {
          rawToken = decryptSecret(rawToken);
        } catch {}
      }
      testResult = await testMicrosoftConnection({
        tenantId: configDoc?.tenantId,
        clientId: configDoc?.clientId,
        accessToken: rawToken,
        accountEmail: configDoc?.accountEmail,
        tenantName: configDoc?.tenantName,
      });
    } else {
      return NextResponse.json({ success: false, message: 'Invalid integration provider' }, { status: 400 });
    }

    const newStatus = testResult.status || 'CONNECTION_FAILED';
    const updateDoc: Record<string, any> = {
      status: newStatus,
      lastTestedAt: nowISO,
      lastError: newStatus === 'CONNECTION_FAILED' ? testResult.message : null,
      updatedAt: nowISO,
    };
    if (newStatus === 'CONNECTED') {
      updateDoc.lastSuccessAt = nowISO;
    }

    await db.collection('integrations').updateOne(
      { organizationId: auth.organizationId, provider },
      { $set: updateDoc },
      { upsert: true }
    );

    // Audit Event
    await logAuditEvent(req, 'TEST_INTEGRATION', {
      details: {
        provider,
        status: newStatus,
        message: testResult.message,
      },
    });

    return NextResponse.json({
      success: newStatus === 'CONNECTED',
      provider,
      status: newStatus,
      result: testResult,
    });
  } catch (err: any) {
    console.error(`Error testing ${params.provider} connection:`, err);
    return NextResponse.json({ success: false, message: err.message || 'Connection test execution failed' }, { status: 500 });
  }
}
