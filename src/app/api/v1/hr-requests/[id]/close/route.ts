import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getAuthContext, checkPermissions } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function POST(
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
    const historyItem = {
      action: 'Ticket Closed',
      performedBy: auth.name || 'HR Admin',
      timestamp: nowISO,
    };

    await db.collection('hr_requests').updateOne(
      { _id: ticketDoc._id },
      {
        $set: {
          status: 'Closed',
          closedAt: nowISO,
          updatedAt: nowISO,
        },
        $push: { history: historyItem } as any,
      }
    );

    // Notify employee
    const notifDoc = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      userId: ticketDoc.employeeId,
      organizationId: orgId,
      title: `HR Ticket Closed: ${ticketDoc.ticketNo}`,
      message: `Your ticket (${ticketDoc.subject}) has been closed.`,
      category: 'system',
      priority: 'medium',
      isRead: false,
      link: '/employee/helpdesk',
      createdAt: nowISO,
      updatedAt: nowISO,
    };
    await db.collection('notifications').insertOne(notifDoc);

    // Audit Event
    await logAuditEvent(req, 'CLOSE_HR_TICKET', {
      employeeId: ticketDoc.employeeId,
      details: { ticketNo: ticketDoc.ticketNo },
    });

    return NextResponse.json({
      success: true,
      message: `Ticket ${ticketDoc.ticketNo} has been closed`,
      status: 'Closed',
    });
  } catch (error: any) {
    console.error('Error closing ticket:', error);
    return NextResponse.json({ success: false, message: error.message || 'Failed to close ticket' }, { status: 500 });
  }
}
