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
    const body = await req.json();
    const { resolution } = body;

    if (!resolution || !resolution.trim()) {
      return NextResponse.json({ success: false, message: 'Resolution message/summary is required to resolve a ticket' }, { status: 400 });
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
    const historyItem = {
      action: `Ticket Marked Resolved: ${resolution.slice(0, 80)}`,
      performedBy: auth.name || 'HR Admin',
      timestamp: nowISO,
    };

    await db.collection('hr_requests').updateOne(
      { _id: ticketDoc._id },
      {
        $set: {
          status: 'Resolved',
          resolution: resolution.trim(),
          resolvedAt: nowISO,
          updatedAt: nowISO,
        },
        $push: { history: historyItem } as any,
      }
    );

    // Notify employee of resolution
    const notifDoc = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      userId: ticketDoc.employeeId,
      organizationId: orgId,
      title: `HR Request Resolved: ${ticketDoc.ticketNo}`,
      message: `Resolution: ${resolution.slice(0, 120)}`,
      category: 'system',
      priority: 'high',
      isRead: false,
      link: '/employee/helpdesk',
      createdAt: nowISO,
      updatedAt: nowISO,
    };
    await db.collection('notifications').insertOne(notifDoc);

    // Audit Event
    await logAuditEvent(req, 'RESOLVE_HR_TICKET', {
      employeeId: ticketDoc.employeeId,
      details: {
        ticketNo: ticketDoc.ticketNo,
        resolution,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Ticket ${ticketDoc.ticketNo} marked as Resolved`,
      status: 'Resolved',
      resolution,
    });
  } catch (error: any) {
    console.error('Error resolving ticket:', error);
    return NextResponse.json({ success: false, message: error.message || 'Failed to resolve ticket' }, { status: 500 });
  }
}
