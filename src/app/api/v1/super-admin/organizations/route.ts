import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getAuthContext, checkPermissions } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const auth = getAuthContext(req);
    const perm = checkPermissions(auth, ['SUPER_ADMIN', 'ADMIN']);
    if (!perm.isAllowed) {
      return NextResponse.json({ success: false, message: perm.message }, { status: perm.statusCode });
    }

    const { db } = await connectToDatabase();
    const { searchParams } = new URL(req.url);

    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '20', 10)));
    const search = searchParams.get('search')?.trim() || '';
    const statusFilter = searchParams.get('status')?.trim() || 'All';

    let query: any = {};
    if (statusFilter !== 'All') {
      query.status = statusFilter;
    }
    if (search) {
      const regex = new RegExp(search, 'i');
      query.$or = [
        { 'organization.name': regex },
        { 'organization.code': regex },
        { 'organization.industry': regex },
        { organizationId: regex },
      ];
    }

    const totalCount = await db.collection('organization_settings').countDocuments(query);
    const orgDocs = await db
      .collection('organization_settings')
      .find(query)
      .sort({ createdAt: -1, updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();

    // Map each organization with employee count and user count from database
    const orgsWithCounts = await Promise.all(
      orgDocs.map(async (doc) => {
        const orgId = doc.organizationId || doc._id.toString();
        const [empCount, userCount] = await Promise.all([
          db.collection('employees').countDocuments({ organizationId: orgId }),
          db.collection('users').countDocuments({ organizationId: orgId }),
        ]);

        const orgDetails = doc.organization || {};
        return {
          id: doc._id.toString(),
          organizationId: orgId,
          name: orgDetails.name || doc.name || 'Enterprise Organization',
          legalName: orgDetails.legalName || orgDetails.name || 'Enterprise HRMS Ltd.',
          code: orgDetails.code || 'ORG-001',
          industry: orgDetails.industry || 'Technology & HR SaaS',
          email: orgDetails.contactEmail || orgDetails.email || 'admin@organization.com',
          phone: orgDetails.contactPhone || orgDetails.phone || '+91 22 1000 2000',
          city: orgDetails.city || 'Mumbai',
          state: orgDetails.state || 'Maharashtra',
          country: orgDetails.country || 'India',
          timezone: orgDetails.timezone || 'Asia/Kolkata (IST +05:30)',
          currency: orgDetails.currency || 'INR (₹)',
          status: doc.status || 'Active',
          employeeCount: empCount,
          userCount: userCount,
          createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          updatedAt: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : new Date().toISOString(),
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        organizations: orgsWithCounts,
        pagination: {
          total: totalCount,
          page,
          limit,
          totalPages: Math.ceil(totalCount / limit) || 1,
        },
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || 'Failed to fetch organizations' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = getAuthContext(req);
    const perm = checkPermissions(auth, ['SUPER_ADMIN']);
    if (!perm.isAllowed) {
      return NextResponse.json({ success: false, message: perm.message }, { status: perm.statusCode });
    }

    const body = await req.json();
    const { name, legalName, code, industry, email, phone, city, state, country, timezone, currency } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ success: false, message: 'Organization name is required.' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const now = new Date();

    const orgCode = (code || name.substring(0, 4)).toUpperCase().trim();
    const newOrgId = `org-${Date.now()}`;

    // Check duplicate code
    const existing = await db.collection('organization_settings').findOne({
      $or: [{ 'organization.code': orgCode }, { organizationId: newOrgId }],
    });

    if (existing) {
      return NextResponse.json({ success: false, message: `Organization code "${orgCode}" already exists.` }, { status: 400 });
    }

    const newOrgDoc = {
      organizationId: newOrgId,
      name: name.trim(),
      status: 'Active',
      organization: {
        name: name.trim(),
        legalName: legalName?.trim() || name.trim(),
        code: orgCode,
        industry: industry?.trim() || 'Software & Enterprise Services',
        email: email?.trim() || '',
        phone: phone?.trim() || '',
        city: city?.trim() || 'Mumbai',
        state: state?.trim() || 'Maharashtra',
        country: country?.trim() || 'India',
        timezone: timezone || 'Asia/Kolkata (IST +05:30)',
        currency: currency || 'INR (₹)',
      },
      createdAt: now,
      updatedAt: now,
    };

    const res = await db.collection('organization_settings').insertOne(newOrgDoc as any);

    await logAuditEvent(req, 'CREATE_ORGANIZATION', { details: { organizationId: newOrgId, name, code: orgCode } });

    return NextResponse.json({
      success: true,
      message: `Organization "${name}" created successfully with Code ${orgCode}.`,
      data: { ...newOrgDoc, id: res.insertedId.toString() },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || 'Failed to create organization' }, { status: 500 });
  }
}
