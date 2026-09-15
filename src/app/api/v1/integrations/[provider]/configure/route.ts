import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext, checkPermissions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { logAuditEvent } from '@/lib/audit';
import { encryptSecret, isEncryptionConfigured } from '@/lib/integrations/encryption';

export async function POST(
  req: NextRequest,
  { params }: { params: { provider: string } }
) {
  try {
    const auth = getAuthContext(req);
    const perm = checkPermissions(auth, ['SUPER_ADMIN']);
    if (!perm.isAllowed) {
      return NextResponse.json({ success: false, message: perm.message }, { status: perm.statusCode });
    }

    const provider = params.provider.toLowerCase();
    const body = await req.json();
    const nowISO = new Date().toISOString();
    const { db } = await connectToDatabase();

    const existingDoc = await db.collection('integrations').findOne({
      organizationId: auth.organizationId,
      provider,
    });

    const updateFields: Record<string, any> = {
      organizationId: auth.organizationId,
      provider,
      updatedAt: nowISO,
      updatedBy: auth.email || auth.userId,
      enabled: body.enabled !== false,
    };

    // Check if new secrets are being provided and ensure encryption is configured
    const hasNewSecret =
      (body.accessToken && !body.accessToken.includes('••••')) ||
      (body.webhookVerifyToken && !body.webhookVerifyToken.includes('••••')) ||
      (body.apiKey && !body.apiKey.includes('••••')) ||
      (body.clientSecret && !body.clientSecret.includes('••••'));

    if (hasNewSecret && !isEncryptionConfigured()) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Server encryption key (INTEGRATION_ENCRYPTION_KEY or ENCRYPTION_KEY) is missing or invalid. Refusing to store secrets in plaintext.',
        },
        { status: 500 }
      );
    }

    // Encrypt sensitive secret fields if provided and not masked ("••••••••")
    if (provider === 'whatsapp') {
      if (body.phoneNumberId !== undefined) updateFields.phoneNumberId = body.phoneNumberId;
      if (body.businessAccountId !== undefined) updateFields.businessAccountId = body.businessAccountId;
      if (body.apiBaseUrl !== undefined) updateFields.apiBaseUrl = body.apiBaseUrl;
      if (body.graphVersion !== undefined) updateFields.graphVersion = body.graphVersion;

      if (body.accessToken && !body.accessToken.includes('••••')) {
        updateFields.accessToken = encryptSecret(body.accessToken);
      }
      if (body.webhookVerifyToken && !body.webhookVerifyToken.includes('••••')) {
        updateFields.webhookVerifyToken = encryptSecret(body.webhookVerifyToken);
      }
    } else if (provider === 'biometric') {
      if (body.providerName !== undefined) updateFields.provider = body.providerName;
      if (body.deviceName !== undefined) updateFields.deviceName = body.deviceName;
      if (body.deviceId !== undefined) updateFields.deviceId = body.deviceId;
      if (body.connectorUrl !== undefined) updateFields.connectorUrl = body.connectorUrl;
      if (body.syncMode !== undefined) updateFields.syncMode = body.syncMode;
      if (body.syncIntervalMinutes !== undefined) updateFields.syncIntervalMinutes = body.syncIntervalMinutes;
      if (body.employeeMappings !== undefined) updateFields.employeeMappings = body.employeeMappings;

      if (body.apiKey && !body.apiKey.includes('••••')) {
        updateFields.apiKey = encryptSecret(body.apiKey);
      }
    } else if (provider === 'microsoft') {
      if (body.tenantId !== undefined) updateFields.tenantId = body.tenantId;
      if (body.clientId !== undefined) updateFields.clientId = body.clientId;
      if (body.accountEmail !== undefined) updateFields.accountEmail = body.accountEmail;
      if (body.tenantName !== undefined) updateFields.tenantName = body.tenantName;

      if (body.clientSecret && !body.clientSecret.includes('••••')) {
        updateFields.clientSecret = encryptSecret(body.clientSecret);
      }
    }

    // Set initial status to CONFIGURATION_REQUIRED or keep existing
    updateFields.status = existingDoc?.status || 'CONFIGURATION_REQUIRED';

    await db.collection('integrations').updateOne(
      { organizationId: auth.organizationId, provider },
      { $set: updateFields },
      { upsert: true }
    );

    // Audit Event
    await logAuditEvent(req, 'CONFIGURE_INTEGRATION', {
      details: {
        provider,
        enabled: updateFields.enabled,
        fieldsUpdated: Object.keys(updateFields).filter((k) => !['accessToken', 'apiKey', 'clientSecret'].includes(k)),
      },
    });

    return NextResponse.json({
      success: true,
      message: `Configuration saved for ${provider.toUpperCase()} integration! Click 'Test Connection' to verify.`,
    });
  } catch (err: any) {
    console.error(`Error configuring ${params.provider} integration:`, err);
    return NextResponse.json({ success: false, message: err.message || 'Failed to save integration configuration' }, { status: 500 });
  }
}
