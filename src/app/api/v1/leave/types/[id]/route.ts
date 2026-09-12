import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getAuthContext, checkPermissions } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = getAuthContext(req);
    const perm = checkPermissions(auth, ['SUPER_ADMIN', 'ADMIN']);
    if (!perm.isAllowed) {
      return NextResponse.json({ success: false, message: perm.message }, { status: perm.statusCode });
    }

    const leaveTypeId = params.id;
    const body = await req.json();
    const { name, allowanceDays, isPaid, description, active } = body;

    const { db } = await connectToDatabase();
    const orgId = auth.organizationId;
    const now = new Date();

    const existing = await db.collection('leave_types').findOne({
      organizationId: orgId,
      $or: [{ id: leaveTypeId }, { code: leaveTypeId }],
    });

    if (!existing) {
      return NextResponse.json({ success: false, message: 'Leave type not found.' }, { status: 404 });
    }

    const updateFields: any = { updatedAt: now };
    if (typeof name === 'string' && name.trim()) updateFields.name = name.trim();
    if (typeof allowanceDays === 'number' && allowanceDays >= 0) updateFields.allowanceDays = allowanceDays;
    if (typeof isPaid === 'boolean') updateFields.isPaid = isPaid;
    if (typeof description === 'string') updateFields.description = description.trim();
    if (typeof active === 'boolean') updateFields.active = active;

    await db.collection('leave_types').updateOne(
      { organizationId: orgId, _id: existing._id },
      { $set: updateFields }
    );

    await logAuditEvent(req, 'UPDATE_LEAVE_TYPE', { details: { leaveTypeId, updateFields } });

    return NextResponse.json({
      success: true,
      message: 'Leave type updated successfully.',
      data: { ...existing, ...updateFields },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || 'Failed to update leave type' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = getAuthContext(req);
    const perm = checkPermissions(auth, ['SUPER_ADMIN', 'ADMIN']);
    if (!perm.isAllowed) {
      return NextResponse.json({ success: false, message: perm.message }, { status: perm.statusCode });
    }

    const leaveTypeId = params.id;
    const { db } = await connectToDatabase();
    const orgId = auth.organizationId;

    const existing = await db.collection('leave_types').findOne({
      organizationId: orgId,
      $or: [{ id: leaveTypeId }, { code: leaveTypeId }],
    });

    if (!existing) {
      return NextResponse.json({ success: false, message: 'Leave type not found.' }, { status: 404 });
    }

    // Check if leave requests currently use this leave type
    const usedInLeavesCount = await db.collection('leaves').countDocuments({
      organizationId: orgId,
      $or: [{ leaveType: existing.name }, { leaveType: existing.code }],
    });

    if (usedInLeavesCount > 0) {
      // Soft-delete / deactivate instead of hard delete
      await db.collection('leave_types').updateOne(
        { organizationId: orgId, _id: existing._id },
        { $set: { active: false, updatedAt: new Date() } }
      );

      await logAuditEvent(req, 'DEACTIVATE_LEAVE_TYPE', { details: { leaveTypeId, reason: 'Used in existing leave records' } });

      return NextResponse.json({
        success: true,
        message: `Leave type "${existing.name}" is used in ${usedInLeavesCount} leave request(s). It has been deactivated instead of deleted.`,
      });
    }

    await db.collection('leave_types').deleteOne({ organizationId: orgId, _id: existing._id });

    await logAuditEvent(req, 'DELETE_LEAVE_TYPE', { details: { leaveTypeId } });

    return NextResponse.json({
      success: true,
      message: `Leave type "${existing.name}" deleted successfully.`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || 'Failed to delete leave type' }, { status: 500 });
  }
}
