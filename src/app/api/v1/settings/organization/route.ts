import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getAuthContext, checkPermissions } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';

export const dynamic = 'force-dynamic';

const DEFAULT_ORG_SETTINGS = {
  name: 'Infinitive Cloud Solutions',
  legalName: 'Infinitive Cloud Solutions Private Limited',
  code: 'ICS-HQ',
  industry: 'Information Technology & Software',
  companyEmail: 'contact@infinitivecloud.com',
  phone: '+91 80000 12345',
  website: 'https://infinitivecloud.com',
  address: 'Tech Park, Phase 2, Ring Road',
  city: 'Bangalore',
  state: 'Karnataka',
  country: 'India',
  postalCode: '560100',
  timezone: 'Asia/Kolkata',
  currency: 'INR',
  dateFormat: 'DD/MM/YYYY',
  logoUrl: '',
  logoFileId: null,
};

// GET /api/v1/settings/organization - Fetch organization settings
export async function GET(req: NextRequest) {
  try {
    const auth = getAuthContext(req);
    const perm = checkPermissions(auth);
    if (!perm.isAllowed) {
      return NextResponse.json(
        { success: false, message: perm.message },
        { status: perm.statusCode }
      );
    }

    const { db } = await connectToDatabase();
    const orgId = auth.organizationId;

    let orgDoc: any = await db.collection('organization_settings').findOne({ organizationId: orgId });

    if (!orgDoc) {
      orgDoc = {
        organizationId: orgId,
        organization: DEFAULT_ORG_SETTINGS,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await db.collection('organization_settings').insertOne(orgDoc as any);
    }

    return NextResponse.json({
      success: true,
      data: {
        organizationId: orgId,
        ...DEFAULT_ORG_SETTINGS,
        ...(orgDoc?.organization || {}),
      },
    });
  } catch (error: any) {
    console.error('Error in GET /api/v1/settings/organization:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch organization settings.' },
      { status: 500 }
    );
  }
}

// PATCH /api/v1/settings/organization - Update organization settings
export async function PATCH(req: NextRequest) {
  try {
    const auth = getAuthContext(req);
    const perm = checkPermissions(auth, ['SUPER_ADMIN', 'ADMIN']);
    if (!perm.isAllowed) {
      return NextResponse.json(
        { success: false, message: perm.message },
        { status: perm.statusCode }
      );
    }

    const body = await req.json();
    const {
      name,
      legalName,
      code,
      industry,
      companyEmail,
      phone,
      website,
      address,
      city,
      state,
      country,
      postalCode,
      timezone,
      currency,
      dateFormat,
    } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json(
        { success: false, message: 'Organization name is required.' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    const orgId = auth.organizationId;
    const now = new Date();

    const existingDoc: any = await db.collection('organization_settings').findOne({ organizationId: orgId });

    const updatedOrg = {
      ...(existingDoc?.organization || DEFAULT_ORG_SETTINGS),
      name: name.trim(),
      legalName: legalName ? String(legalName).trim() : name.trim(),
      code: code ? String(code).trim() : 'ORG',
      industry: industry ? String(industry).trim() : 'Software',
      companyEmail: companyEmail ? String(companyEmail).trim() : '',
      phone: phone ? String(phone).trim() : '',
      website: website ? String(website).trim() : '',
      address: address ? String(address).trim() : '',
      city: city ? String(city).trim() : '',
      state: state ? String(state).trim() : '',
      country: country ? String(country).trim() : '',
      postalCode: postalCode ? String(postalCode).trim() : '',
      timezone: timezone ? String(timezone).trim() : 'Asia/Kolkata',
      currency: currency ? String(currency).trim() : 'INR',
      dateFormat: dateFormat ? String(dateFormat).trim() : 'DD/MM/YYYY',
      updatedAt: now,
    };

    await db.collection('organization_settings').updateOne(
      { organizationId: orgId },
      {
        $set: {
          organizationId: orgId,
          organization: updatedOrg,
          updatedAt: now,
        },
      },
      { upsert: true }
    );

    await logAuditEvent(req, 'UPDATE_ORGANIZATION_SETTINGS', {
      details: { organizationId: orgId, updates: updatedOrg },
    });

    return NextResponse.json({
      success: true,
      message: 'Organization settings updated successfully.',
      data: updatedOrg,
    });
  } catch (error: any) {
    console.error('Error in PATCH /api/v1/settings/organization:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update organization settings.' },
      { status: 500 }
    );
  }
}
