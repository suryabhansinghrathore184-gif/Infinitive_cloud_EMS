import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getAuthContext, checkPermissions } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';

export const dynamic = 'force-dynamic';

const DEFAULT_LEAVE_POLICIES = {
  approvalWorkflow: 'TWO_TIER',
  maxCarryForwardDays: 30,
  allowEncashment: true,
  halfDayAllowed: true,
  attachmentRequiredDays: 3,
  noticePeriodDays: 2,
  leaveTypes: [
    { id: 'casual', name: 'Casual Leave', code: 'CL', allowanceDays: 12, paid: true, carryForwardAllowed: false },
    { id: 'sick', name: 'Sick Leave', code: 'SL', allowanceDays: 10, paid: true, carryForwardAllowed: false },
    { id: 'earned', name: 'Earned Leave', code: 'EL', allowanceDays: 15, paid: true, carryForwardAllowed: true },
    { id: 'unpaid', name: 'Unpaid Leave / LOP', code: 'LOP', allowanceDays: 30, paid: false, carryForwardAllowed: false },
  ],
};

// GET /api/v1/settings/leave - Fetch leave policies
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

    if (!orgDoc || !orgDoc.leave) {
      await db.collection('organization_settings').updateOne(
        { organizationId: orgId },
        { $set: { leave: DEFAULT_LEAVE_POLICIES, updatedAt: new Date() } },
        { upsert: true }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        organizationId: orgId,
        ...DEFAULT_LEAVE_POLICIES,
        ...(orgDoc?.leave || {}),
      },
    });
  } catch (error: any) {
    console.error('Error in GET /api/v1/settings/leave:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch leave policies.' },
      { status: 500 }
    );
  }
}

// PATCH /api/v1/settings/leave - Update leave policies
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
      approvalWorkflow,
      maxCarryForwardDays,
      allowEncashment,
      halfDayAllowed,
      attachmentRequiredDays,
      noticePeriodDays,
      leaveTypes,
    } = body;

    const carryForwardLimit = Number(maxCarryForwardDays);
    if (isNaN(carryForwardLimit) || carryForwardLimit < 0 || carryForwardLimit > 365) {
      return NextResponse.json(
        { success: false, message: 'Max carry forward limit must be between 0 and 365 days.' },
        { status: 400 }
      );
    }

    const noticeDays = Number(noticePeriodDays);
    if (isNaN(noticeDays) || noticeDays < 0 || noticeDays > 30) {
      return NextResponse.json(
        { success: false, message: 'Notice period days must be between 0 and 30 days.' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    const orgId = auth.organizationId;
    const now = new Date();

    const updatedLeavePolicies = {
      approvalWorkflow: approvalWorkflow || 'TWO_TIER',
      maxCarryForwardDays: carryForwardLimit,
      allowEncashment: Boolean(allowEncashment),
      halfDayAllowed: Boolean(halfDayAllowed),
      attachmentRequiredDays: Number(attachmentRequiredDays) || 3,
      noticePeriodDays: noticeDays,
      leaveTypes: Array.isArray(leaveTypes) && leaveTypes.length > 0 ? leaveTypes : DEFAULT_LEAVE_POLICIES.leaveTypes,
      updatedAt: now,
    };

    await db.collection('organization_settings').updateOne(
      { organizationId: orgId },
      {
        $set: {
          leave: updatedLeavePolicies,
          updatedAt: now,
        },
      },
      { upsert: true }
    );

    await logAuditEvent(req, 'UPDATE_LEAVE_SETTINGS', {
      details: { organizationId: orgId, policies: updatedLeavePolicies },
    });

    return NextResponse.json({
      success: true,
      message: 'Leave policies updated successfully.',
      data: updatedLeavePolicies,
    });
  } catch (error: any) {
    console.error('Error in PATCH /api/v1/settings/leave:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update leave settings.' },
      { status: 500 }
    );
  }
}
