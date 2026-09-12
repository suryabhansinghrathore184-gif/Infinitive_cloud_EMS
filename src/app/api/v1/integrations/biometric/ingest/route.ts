import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { processBiometricPunches } from '@/lib/integrations/biometric';
import { decryptSecret, isEncryptionConfigured } from '@/lib/integrations/encryption';

export async function POST(req: NextRequest) {
  try {
    const apiKeyHeader = req.headers.get('x-biometric-key') || req.headers.get('x-api-key');
    const orgIdHeader = req.headers.get('x-organization-id') || 'org-default';

    if (!apiKeyHeader) {
      return NextResponse.json({ success: false, message: 'Unauthorized. Missing x-biometric-key header.' }, { status: 401 });
    }

    const { db } = await connectToDatabase();

    // Find biometric integration config for organization
    const configDoc = await db.collection('integrations').findOne({
      organizationId: orgIdHeader,
      provider: 'biometric',
    });

    if (!configDoc || configDoc.enabled === false) {
      return NextResponse.json({ success: false, message: 'Biometric integration is disabled or not configured for this organization.' }, { status: 403 });
    }

    let storedKey = configDoc.apiKey || process.env.BIOMETRIC_API_KEY || '';
    if (storedKey && isEncryptionConfigured()) {
      try {
        storedKey = decryptSecret(storedKey);
      } catch {}
    }

    if (apiKeyHeader !== storedKey) {
      return NextResponse.json({ success: false, message: 'Unauthorized. Invalid API Key.' }, { status: 403 });
    }

    const body = await req.json();
    const punches = Array.isArray(body) ? body : body.punches || [];

    const syncResult = await processBiometricPunches(
      orgIdHeader,
      punches,
      configDoc.employeeMappings || []
    );

    return NextResponse.json({
      success: true,
      message: 'Biometric punches ingested and processed successfully',
      syncResult,
    });
  } catch (err: any) {
    console.error('Biometric Ingest Error:', err);
    return NextResponse.json({ success: false, message: err.message || 'Ingest failed' }, { status: 500 });
  }
}
