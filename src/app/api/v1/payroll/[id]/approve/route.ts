import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getAuthContext, checkPermissions } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';
import { ObjectId } from 'mongodb';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = getAuthContext(req);
    const perm = checkPermissions(auth, ['SUPER_ADMIN', 'ADMIN', 'HR']);
    if (!perm.isAllowed) {
      return NextResponse.json({ success: false, message: perm.message }, { status: perm.statusCode });
    }

    const { id } = params;
    const body = await req.json().catch(() => ({}));
    const newStatus = body.status || 'APPROVED'; // APPROVED, PAID, REJECTED, CANCELLED
    const rejectionReason = body.rejectionReason;

    const { db } = await connectToDatabase();
    const orgId = auth.organizationId;

    let query: any = { organizationId: orgId };
    if (ObjectId.isValid(id)) {
      query._id = new ObjectId(id);
    } else {
      query.employeeId = id;
    }

    const existing = await db.collection('payroll_records').findOne(query);
    if (!existing) {
      return NextResponse.json({ success: false, message: 'Payroll record not found.' }, { status: 404 });
    }

    const now = new Date();
    const updatePayload: any = {
      status: newStatus,
      updatedAt: now,
    };

    if (newStatus === 'APPROVED' || newStatus === 'PAID') {
      updatePayload.approvedBy = auth.email || auth.userId;
      updatePayload.approvedAt = now;
    } else if (newStatus === 'REJECTED') {
      updatePayload.rejectionReason = rejectionReason || 'Payroll record rejected by administrator.';
    }

    await db.collection('payroll_records').updateOne(query, { $set: updatePayload });

    await logAuditEvent(req, `PAYROLL_STATUS_${newStatus}`, {
      employeeId: existing.employeeId,
      details: {
        oldStatus: existing.status,
        newStatus,
      },
    });

    const updated = await db.collection('payroll_records').findOne(query);

    return NextResponse.json({
      success: true,
      message: `Payroll status updated to ${newStatus}.`,
      data: updated,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || 'Failed to update payroll status' }, { status: 500 });
  }
}
