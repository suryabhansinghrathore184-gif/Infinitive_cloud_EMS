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
    const { searchParams } = new URL(req.url);

    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '10', 10)));
    const search = searchParams.get('search')?.trim() || '';
    const statusFilter = searchParams.get('status')?.trim() || 'All';
    const industryFilter = searchParams.get('industry')?.trim() || 'All';
    const locationFilter = searchParams.get('location')?.trim() || 'All';

    let query: any = {};
    if (statusFilter !== 'All') {
      query.status = statusFilter;
    }
    if (industryFilter !== 'All') {
      query.$or = [
        { 'organization.industry': new RegExp(industryFilter, 'i') },
        { industry: new RegExp(industryFilter, 'i') },
      ];
    }
    if (locationFilter !== 'All') {
      const locRegex = new RegExp(locationFilter, 'i');
      query.$or = [
        { 'organization.city': locRegex },
        { 'organization.country': locRegex },
        { city: locRegex },
        { country: locRegex },
      ];
    }
    if (search) {
      const regex = new RegExp(search, 'i');
      query.$or = [
        { name: regex },
        { 'organization.name': regex },
        { 'organization.code': regex },
        { 'organization.industry': regex },
        { organizationId: regex },
      ];
    }

    // Concurrent DB queries for pagination & summary KPIs
    const [
      totalOrgsCount,
      activeOrgsCount,
      inactiveOrgsCount,
      totalEmployeesCount,
      totalUsersCount,
      filteredCount,
      orgDocs,
    ] = await Promise.all([
      db.collection('organization_settings').countDocuments(),
      db.collection('organization_settings').countDocuments({ status: { $ne: 'Inactive' } }),
      db.collection('organization_settings').countDocuments({ status: 'Inactive' }),
      db.collection('employees').countDocuments(),
      db.collection('users').countDocuments(),
      db.collection('organization_settings').countDocuments(query),
      db.collection('organization_settings')
        .find(query)
        .sort({ createdAt: -1, updatedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .toArray(),
    ]);

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
          industry: orgDetails.industry || doc.industry || 'Technology & HR SaaS',
          email: orgDetails.contactEmail || orgDetails.email || doc.email || 'admin@organization.com',
          phone: orgDetails.contactPhone || orgDetails.phone || doc.phone || '+91 22 1000 2000',
          city: orgDetails.city || doc.city || 'Mumbai',
          state: orgDetails.state || doc.state || 'Maharashtra',
          country: orgDetails.country || doc.country || 'India',
          timezone: orgDetails.timezone || doc.timezone || 'Asia/Kolkata (IST +05:30)',
          currency: orgDetails.currency || doc.currency || 'INR (₹)',
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
        summaryKpis: {
          totalOrganizations: Math.max(1, totalOrgsCount),
          activeOrganizations: Math.max(1, activeOrgsCount),
          inactiveOrganizations: inactiveOrgsCount,
          totalWorkforce: totalEmployeesCount,
          totalSystemUsers: Math.max(totalUsersCount, totalEmployeesCount),
        },
        pagination: {
          total: filteredCount,
          page,
          limit,
          totalPages: Math.ceil(filteredCount / limit) || 1,
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
    const existingCode = await db.collection('organization_settings').findOne({
      $or: [{ 'organization.code': orgCode }, { code: orgCode }],
    });

    if (existingCode) {
      return NextResponse.json({ success: false, message: `Organization code "${orgCode}" already exists. Please choose a unique code.` }, { status: 400 });
    }

    const newOrgDoc = {
      organizationId: newOrgId,
      name: name.trim(),
      status: 'Active',
      organization: {
        name: name.trim(),
        legalName: legalName?.trim() || name.trim(),
        code: orgCode,
        industry: industry?.trim() || 'Software & Technology',
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

    await logAuditEvent(req, 'ORGANIZATION_CREATED', { details: { organizationId: newOrgId, name, code: orgCode } });

    return NextResponse.json({
      success: true,
      message: `Organization "${name}" created successfully with Code ${orgCode}.`,
      data: { ...newOrgDoc, id: res.insertedId.toString() },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || 'Failed to create organization' }, { status: 500 });
  }
}
