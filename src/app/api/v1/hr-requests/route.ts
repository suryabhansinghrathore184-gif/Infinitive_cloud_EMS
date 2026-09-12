import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase, uploadFileToGridFS } from '@/lib/mongodb';
import { getAuthContext, checkPermissions } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';
import { HrTicket, MessageAttachment } from '@/types/admin';

export const dynamic = 'force-dynamic';

// GET /api/v1/hr-requests - List tickets with filters & live status counts
export async function GET(req: NextRequest) {
  try {
    const auth = getAuthContext(req);
    const perm = checkPermissions(auth);
    if (!perm.isAllowed) {
      return NextResponse.json({ success: false, message: perm.message }, { status: perm.statusCode });
    }

    const { searchParams } = new URL(req.url);
    const statusParam = searchParams.get('status') || 'All';
    const requestTypeParam = searchParams.get('requestType') || searchParams.get('category') || 'All';
    const priorityParam = searchParams.get('priority') || 'All';
    const assigneeParam = searchParams.get('assignedToId') || searchParams.get('assignee') || 'All';
    const departmentParam = searchParams.get('department') || 'All';
    const dateRangeParam = searchParams.get('dateRange') || 'All';
    const searchParam = searchParams.get('search') || '';

    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '25', 10)));

    const { db } = await connectToDatabase();
    const orgId = auth.organizationId;

    // Base query with tenant isolation
    const baseQuery: any = { organizationId: orgId };

    // Role-based scope
    if (auth.role === 'EMPLOYEE') {
      const empId = auth.employeeId || auth.userId;
      baseQuery.$or = [{ employeeId: empId }, { employeeId: auth.userId }, { employeeId: auth.employeeId }];
    } else if (auth.role === 'MANAGER' && auth.employeeId) {
      const team = await db.collection('employees').find({
        organizationId: orgId,
        $or: [{ managerId: auth.employeeId }, { reportingTo: auth.employeeId }, { employeeId: auth.employeeId }],
      }).toArray();
      const teamEmpIds = team.map((e) => e.employeeId || e.id || e._id.toString());
      baseQuery.$or = [{ employeeId: { $in: teamEmpIds } }, { assignedToId: auth.employeeId }, { assignedToId: auth.userId }];
    }

    // Compute live status counts matching the scoped base query
    const rawAllForCounts = await db.collection('hr_requests').find(baseQuery).toArray();

    const statusCounts = {
      open: 0,
      assigned: 0,
      inProgress: 0,
      resolved: 0,
      closed: 0,
      total: rawAllForCounts.length,
    };

    rawAllForCounts.forEach((t) => {
      const s = (t.status || 'Open').toLowerCase();
      if (s === 'open') statusCounts.open += 1;
      else if (s === 'assigned') statusCounts.assigned += 1;
      else if (s === 'in progress' || s === 'inprogress') statusCounts.inProgress += 1;
      else if (s === 'resolved') statusCounts.resolved += 1;
      else if (s === 'closed') statusCounts.closed += 1;
    });

    const actionableCount = statusCounts.open + statusCounts.assigned + statusCounts.inProgress;

    // Build filter query for table pagination
    const filterQuery: any = { ...baseQuery };

    if (statusParam && statusParam !== 'All' && statusParam !== 'ALL') {
      filterQuery.status = statusParam;
    }
    if (requestTypeParam && requestTypeParam !== 'All' && requestTypeParam !== 'ALL') {
      filterQuery.requestType = requestTypeParam;
    }
    if (priorityParam && priorityParam !== 'All' && priorityParam !== 'ALL') {
      filterQuery.priority = priorityParam;
    }
    if (assigneeParam && assigneeParam !== 'All' && assigneeParam !== 'ALL') {
      filterQuery.assignedToId = assigneeParam;
    }
    if (departmentParam && departmentParam !== 'All' && departmentParam !== 'ALL') {
      filterQuery.department = departmentParam;
    }

    // Date range filter
    if (dateRangeParam && dateRangeParam !== 'All') {
      const now = new Date();
      let startDate = new Date();
      if (dateRangeParam === 'Today') {
        startDate.setHours(0, 0, 0, 0);
      } else if (dateRangeParam === 'Last 7 days') {
        startDate.setDate(now.getDate() - 7);
      } else if (dateRangeParam === 'Last 30 days') {
        startDate.setDate(now.getDate() - 30);
      }
      filterQuery.createdAt = { $gte: startDate.toISOString() };
    }

    // Search query
    if (searchParam) {
      const regex = new RegExp(searchParam, 'i');
      filterQuery.$and = [
        ...(filterQuery.$and || []),
        {
          $or: [
            { ticketNo: regex },
            { creatorName: regex },
            { employeeId: regex },
            { subject: regex },
            { requestType: regex },
            { department: regex },
          ],
        },
      ];
    }

    const totalFiltered = await db.collection('hr_requests').countDocuments(filterQuery);
    const totalPages = Math.ceil(totalFiltered / limit) || 1;

    const rawTickets = await db
      .collection('hr_requests')
      .find(filterQuery)
      .sort({ updatedAt: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();

    const tickets: HrTicket[] = rawTickets.map((t) => ({
      id: t.id || t._id.toString(),
      ticketNo: t.ticketNo || `HR-${t._id.toString().slice(-6).toUpperCase()}`,
      organizationId: t.organizationId,
      employeeId: t.employeeId || 'EMP-N/A',
      creatorName: t.creatorName || 'Employee',
      creatorAvatar: t.creatorAvatar || '',
      department: t.department || 'N/A',
      email: t.email || '',
      requestType: t.requestType || t.category || 'General HR Query',
      category: t.category || t.requestType,
      subject: t.subject || 'Support Request',
      description: t.description || '',
      priority: t.priority || 'Medium',
      status: t.status || 'Open',
      assignedToId: t.assignedToId || '',
      assignedToName: t.assignedToName || t.assignee || 'Unassigned',
      assignee: t.assignedToName || t.assignee || 'Unassigned',
      resolution: t.resolution || '',
      attachments: t.attachments || [],
      history: t.history || [],
      createdAt: t.createdAt || new Date().toISOString(),
      updatedAt: t.updatedAt || t.createdAt || new Date().toISOString(),
      resolvedAt: t.resolvedAt,
      closedAt: t.closedAt,
    }));

    return NextResponse.json({
      success: true,
      count: totalFiltered,
      totalPages,
      currentPage: page,
      statusCounts,
      actionableCount,
      tickets,
    });
  } catch (error: any) {
    console.error('Error fetching HR requests:', error);
    return NextResponse.json({ success: false, message: error.message || 'Failed to fetch HR requests' }, { status: 500 });
  }
}

// POST /api/v1/hr-requests - Create new HR ticket
export async function POST(req: NextRequest) {
  try {
    const auth = getAuthContext(req);
    const perm = checkPermissions(auth);
    if (!perm.isAllowed) {
      return NextResponse.json({ success: false, message: perm.message }, { status: perm.statusCode });
    }

    const contentType = req.headers.get('content-type') || '';
    let targetEmployeeId = '';
    let requestType = 'General HR Query';
    let subject = '';
    let description = '';
    let priority: 'Low' | 'Medium' | 'High' | 'Urgent' = 'Medium';
    let attachments: MessageAttachment[] = [];

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      targetEmployeeId = (formData.get('employeeId') as string) || '';
      requestType = (formData.get('requestType') as string) || (formData.get('category') as string) || 'General HR Query';
      subject = (formData.get('subject') as string) || '';
      description = (formData.get('description') as string) || '';
      priority = ((formData.get('priority') as string) || 'Medium') as any;

      const file = formData.get('file') as File | null;
      if (file && file.size > 0) {
        const buffer = Buffer.from(await file.arrayBuffer());
        const fileId = await uploadFileToGridFS(file.name, file.type || 'application/octet-stream', buffer, 'documents');
        attachments.push({
          fileId,
          fileName: file.name,
          fileSize: `${(file.size / 1024).toFixed(1)} KB`,
          fileSizeBytes: file.size,
          mimeType: file.type || 'application/octet-stream',
          fileUrl: `/api/v1/documents/${fileId}/file`,
        });
      }
    } else {
      const body = await req.json();
      targetEmployeeId = body.employeeId || '';
      requestType = body.requestType || body.category || 'General HR Query';
      subject = body.subject || '';
      description = body.description || '';
      priority = body.priority || 'Medium';
      attachments = body.attachments || [];
    }

    if (!subject.trim() || !description.trim()) {
      return NextResponse.json({ success: false, message: 'Subject and Description are required fields' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const orgId = auth.organizationId;

    // Determine actual employee identity (Server-side security check)
    let empId = auth.employeeId || auth.userId;
    let empName = auth.name || 'Employee';
    let empEmail = auth.email || '';
    let empDept = '';
    let empAvatar = '';

    if (auth.role !== 'EMPLOYEE' && targetEmployeeId) {
      // HR/Admin creating ticket on behalf of specific employee
      const empDoc = await db.collection('employees').findOne({
        organizationId: orgId,
        $or: [{ employeeId: targetEmployeeId }, { id: targetEmployeeId }],
      });
      if (empDoc) {
        empId = empDoc.employeeId || empDoc.id;
        empName = empDoc.fullName || `${empDoc.firstName || ''} ${empDoc.lastName || ''}`.trim();
        empEmail = empDoc.email || '';
        empDept = empDoc.department || '';
        empAvatar = empDoc.photo || empDoc.avatar || '';
      }
    } else {
      // Look up caller's employee profile
      const empDoc = await db.collection('employees').findOne({
        organizationId: orgId,
        $or: [{ employeeId: empId }, { userId: auth.userId }],
      });
      if (empDoc) {
        empId = empDoc.employeeId || empId;
        empName = empDoc.fullName || `${empDoc.firstName || ''} ${empDoc.lastName || ''}`.trim() || empName;
        empEmail = empDoc.email || empEmail;
        empDept = empDoc.department || '';
        empAvatar = empDoc.photo || empDoc.avatar || '';
      }
    }

    const nowISO = new Date().toISOString();
    const randNum = Math.floor(100000 + Math.random() * 900000);
    const ticketNo = `HR-${randNum}`;
    const reqId = `tck-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const newTicketDoc: HrTicket = {
      id: reqId,
      ticketNo,
      organizationId: orgId,
      employeeId: empId,
      creatorName: empName,
      creatorAvatar: empAvatar,
      department: empDept,
      email: empEmail,
      requestType: requestType as any,
      category: requestType,
      subject: subject.trim(),
      description: description.trim(),
      priority,
      status: 'Open',
      assignedToId: '',
      assignedToName: 'Unassigned',
      assignee: 'Unassigned',
      attachments,
      history: [
        {
          action: 'Ticket Created',
          performedBy: auth.name || empName,
          timestamp: nowISO,
        },
      ],
      createdAt: nowISO,
      updatedAt: nowISO,
    };

    await db.collection('hr_requests').insertOne(newTicketDoc as any);

    // Create Notification for HR/Admin users
    const notifDoc = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      userId: 'usr-admin-1', // broadcast/admin target
      organizationId: orgId,
      title: `New HR Request ${ticketNo}: ${subject}`,
      message: `${empName} submitted a ${requestType} ticket (${priority} priority).`,
      category: 'system',
      priority: priority === 'Urgent' || priority === 'High' ? 'high' : 'medium',
      isRead: false,
      link: '/admin/helpdesk',
      createdAt: nowISO,
      updatedAt: nowISO,
    };
    await db.collection('notifications').insertOne(notifDoc);

    // Audit Log Event
    await logAuditEvent(req, 'CREATE_HR_TICKET', {
      employeeId: empId,
      details: {
        ticketNo,
        subject,
        priority,
        requestType,
        targetEmployee: empName,
      },
    });

    return NextResponse.json({
      success: true,
      message: `HR Support Ticket ${ticketNo} created successfully`,
      ticket: newTicketDoc,
    });
  } catch (error: any) {
    console.error('Error creating HR request:', error);
    return NextResponse.json({ success: false, message: error.message || 'Failed to create HR request' }, { status: 500 });
  }
}
