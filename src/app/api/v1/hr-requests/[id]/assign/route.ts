import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getAuthContext, checkPermissions } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = getAuthContext(req);
    const perm = checkPermissions(auth, ['SUPER_ADMIN', 'ADMIN', 'HR', 'MANAGER']);
    if (!perm.isAllowed) {
      return NextResponse.json({ success: false, message: perm.message }, { status: perm.statusCode });
    }

    const { id } = params;
    const body = await req.json();
    const { assignedToId, assignedToName, assignedToAvatar } = body;

    if (!assignedToId || !assignedToName) {
      return NextResponse.json({ success: false, message: 'assignedToId and assignedToName are required' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const orgId = auth.organizationId;

    const ticketDoc = await db.collection('hr_requests').findOne({
      organizationId: orgId,
      $or: [{ id }, { ticketNo: id }],
    });

    if (!ticketDoc) {
      return NextResponse.json({ success: false, message: 'HR Support Ticket not found' }, { status: 404 });
    }

    const nowISO = new Date().toISOString();
    let newStatus = ticketDoc.status;
    if (ticketDoc.status === 'Open') {
      newStatus = 'Assigned';
    }

    const historyItem = {
      action: `Assigned to ${assignedToName}`,
      performedBy: auth.name || 'HR Admin',
      timestamp: nowISO,
    };

    await db.collection('hr_requests').updateOne(
      { _id: ticketDoc._id },
      {
        $set: {
          assignedToId,
          assignedToName,
          assignee: assignedToName,
          assignedToAvatar: assignedToAvatar || '',
          status: newStatus,
          updatedAt: nowISO,
        },
        $push: { history: historyItem } as any,
      }
    );

    // Send notification to assigned HR staff member
    const notifDoc = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      userId: assignedToId,
      organizationId: orgId,
      title: `HR Ticket Assigned: ${ticketDoc.ticketNo}`,
      message: `You have been assigned to support ticket ${ticketDoc.ticketNo} (${ticketDoc.subject}).`,
      category: 'system',
      priority: 'high',
      isRead: false,
      link: '/admin/helpdesk',
      createdAt: nowISO,
      updatedAt: nowISO,
    };
    await db.collection('notifications').insertOne(notifDoc);

    // Audit Event
    await logAuditEvent(req, 'ASSIGN_HR_TICKET', {
      employeeId: ticketDoc.employeeId,
      details: {
        ticketNo: ticketDoc.ticketNo,
        assignedToName,
        assignedToId,
        newStatus,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Ticket ${ticketDoc.ticketNo} assigned to ${assignedToName}`,
      status: newStatus,
      assignedToName,
    });
  } catch (error: any) {
    console.error('Error assigning HR ticket:', error);
    return NextResponse.json({ success: false, message: error.message || 'Failed to assign ticket' }, { status: 500 });
  }
}
