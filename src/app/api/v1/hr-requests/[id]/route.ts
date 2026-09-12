import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getAuthContext, checkPermissions } from '@/lib/auth';
import { HrTicket, HrTicketComment } from '@/types/admin';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = getAuthContext(req);
    const perm = checkPermissions(auth);
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

    // Access control for Employees
    if (auth.role === 'EMPLOYEE') {
      const empId = auth.employeeId || auth.userId;
      if (ticketDoc.employeeId !== empId && ticketDoc.employeeId !== auth.userId && ticketDoc.employeeId !== auth.employeeId) {
        return NextResponse.json({ success: false, message: 'Forbidden. You can only view your own support tickets.' }, { status: 403 });
      }
    }

    // Fetch comment thread
    const reqId = ticketDoc.id || id;
    const commentQuery: any = { requestId: reqId, organizationId: orgId };

    // Strip internal HR notes for Employee role (Strict privacy rule)
    if (auth.role === 'EMPLOYEE') {
      commentQuery.isInternal = { $ne: true };
    }

    const rawComments = await db
      .collection('hr_request_comments')
      .find(commentQuery)
      .sort({ createdAt: 1 })
      .toArray();

    const comments: HrTicketComment[] = rawComments.map((c) => ({
      id: c.id || c._id.toString(),
      requestId: c.requestId,
      organizationId: c.organizationId,
      authorId: c.authorId,
      authorName: c.authorName || 'User',
      authorRole: c.authorRole || 'Member',
      comment: c.comment || '',
      isInternal: Boolean(c.isInternal),
      attachments: c.attachments || [],
      createdAt: c.createdAt || new Date().toISOString(),
    }));

    const ticket: HrTicket = {
      id: ticketDoc.id || ticketDoc._id.toString(),
      ticketNo: ticketDoc.ticketNo,
      organizationId: ticketDoc.organizationId,
      employeeId: ticketDoc.employeeId,
      creatorName: ticketDoc.creatorName || 'Employee',
      creatorAvatar: ticketDoc.creatorAvatar || '',
      department: ticketDoc.department || 'N/A',
      email: ticketDoc.email || '',
      requestType: ticketDoc.requestType || ticketDoc.category || 'General HR Query',
      category: ticketDoc.category || ticketDoc.requestType,
      subject: ticketDoc.subject,
      description: ticketDoc.description || '',
      priority: ticketDoc.priority || 'Medium',
      status: ticketDoc.status || 'Open',
      assignedToId: ticketDoc.assignedToId || '',
      assignedToName: ticketDoc.assignedToName || ticketDoc.assignee || 'Unassigned',
      assignee: ticketDoc.assignedToName || ticketDoc.assignee || 'Unassigned',
      resolution: ticketDoc.resolution || '',
      attachments: ticketDoc.attachments || [],
      history: ticketDoc.history || [],
      createdAt: ticketDoc.createdAt,
      updatedAt: ticketDoc.updatedAt || ticketDoc.createdAt,
      resolvedAt: ticketDoc.resolvedAt,
      closedAt: ticketDoc.closedAt,
    };

    return NextResponse.json({
      success: true,
      ticket,
      comments,
    });
  } catch (error: any) {
    console.error('Error fetching ticket details:', error);
    return NextResponse.json({ success: false, message: error.message || 'Failed to fetch ticket details' }, { status: 500 });
  }
}
