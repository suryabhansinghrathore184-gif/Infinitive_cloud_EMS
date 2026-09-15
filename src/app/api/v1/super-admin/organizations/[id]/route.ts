import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getAuthContext, checkPermissions } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';
import { ObjectId } from 'mongodb';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = getAuthContext(req);
    const perm = checkPermissions(auth, ['SUPER_ADMIN']);
    if (!perm.isAllowed) {
      return NextResponse.json({ success: false, message: perm.message }, { status: perm.statusCode });
    }

    const { db } = await connectToDatabase();
    const orgId = params.id;

    let query: any = {};
    if (ObjectId.isValid(orgId)) {
      query.$or = [{ _id: new ObjectId(orgId) }, { organizationId: orgId }];
    } else {
      query.organizationId = orgId;
    }

    const doc = await db.collection('organization_settings').findOne(query);
    if (!doc) {
      return NextResponse.json({ success: false, message: 'Organization not found.' }, { status: 404 });
    }

    const effectiveOrgId = doc.organizationId || doc._id.toString();
    const [empCount, activeEmpCount, userCount, depts, locs] = await Promise.all([
      db.collection('employees').countDocuments({ organizationId: effectiveOrgId }),
      db.collection('employees').countDocuments({ organizationId: effectiveOrgId, status: 'Active' }),
      db.collection('users').countDocuments({ organizationId: effectiveOrgId }),
      db.collection('departments').find({ organizationId: effectiveOrgId }).toArray(),
      db.collection('locations').find({ organizationId: effectiveOrgId }).toArray(),
    ]);

    await logAuditEvent(req, 'ORGANIZATION_VIEWED', { details: { organizationId: effectiveOrgId, name: doc.name } });

    return NextResponse.json({
      success: true,
      data: {
        id: doc._id.toString(),
        organizationId: effectiveOrgId,
        name: doc.organization?.name || doc.name || 'Organization',
        status: doc.status || 'Active',
        details: doc.organization || {},
        employeeCount: empCount,
        activeEmployeeCount: activeEmpCount,
        inactiveEmployeeCount: Math.max(0, empCount - activeEmpCount),
        userCount: userCount,
        departments: depts,
        locations: locs,
        createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : new Date().toISOString(),
        updatedAt: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : new Date().toISOString(),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || 'Failed to fetch organization details' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = getAuthContext(req);
    const perm = checkPermissions(auth, ['SUPER_ADMIN']);
    if (!perm.isAllowed) {
      return NextResponse.json({ success: false, message: perm.message }, { status: perm.statusCode });
    }

    const targetId = params.id;
    const body = await req.json();
    const { status, name, industry, email, phone, city, state, country, timezone, currency } = body;

    const { db } = await connectToDatabase();
    const now = new Date();

    let query: any = {};
    if (ObjectId.isValid(targetId)) {
      query.$or = [{ _id: new ObjectId(targetId) }, { organizationId: targetId }];
    } else {
      query.organizationId = targetId;
    }

    const existing = await db.collection('organization_settings').findOne(query);
    if (!existing) {
      return NextResponse.json({ success: false, message: 'Organization not found.' }, { status: 404 });
    }

    const updateFields: any = { updatedAt: now };
    if (status) updateFields.status = status;
    if (name) updateFields.name = name.trim();

    const orgSubObj = existing.organization || {};
    if (name) orgSubObj.name = name.trim();
    if (industry) orgSubObj.industry = industry.trim();
    if (email) orgSubObj.email = email.trim();
    if (phone) orgSubObj.phone = phone.trim();
    if (city) orgSubObj.city = city.trim();
    if (state) orgSubObj.state = state.trim();
    if (country) orgSubObj.country = country.trim();
    if (timezone) orgSubObj.timezone = timezone;
    if (currency) orgSubObj.currency = currency;

    updateFields.organization = orgSubObj;

    await db.collection('organization_settings').updateOne(
      { _id: existing._id },
      { $set: updateFields }
    );

    // Audit logs for status change & updates
    if (status && status !== existing.status) {
      const actionType = status === 'Active' ? 'ORGANIZATION_ACTIVATED' : 'ORGANIZATION_DEACTIVATED';
      await logAuditEvent(req, actionType, { details: { targetId, previousStatus: existing.status, newStatus: status } });
    } else {
      await logAuditEvent(req, 'ORGANIZATION_UPDATED', { details: { targetId, updateFields } });
    }

    return NextResponse.json({
      success: true,
      message: status ? `Organization status updated to ${status}.` : 'Organization updated successfully.',
      data: { ...existing, ...updateFields },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || 'Failed to update organization' }, { status: 500 });
  }
}
