import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase, uploadFileToGridFS } from '@/lib/mongodb';
import { getAuthContext, checkPermissions } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';
import { HrTicketComment, MessageAttachment } from '@/types/admin';

export const dynamic = 'force-dynamic';

export async function POST(
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
        return NextResponse.json({ success: false, message: 'Forbidden. Access restricted.' }, { status: 403 });
      }
    }

    const contentType = req.headers.get('content-type') || '';
    let commentText = '';
    let isInternal = false;
    let attachments: MessageAttachment[] = [];

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      commentText = (formData.get('comment') as string) || '';
      isInternal = formData.get('isInternal') === 'true';

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
      commentText = body.comment || '';
      isInternal = Boolean(body.isInternal);
      attachments = body.attachments || [];
    }

    if (!commentText.trim() && attachments.length === 0) {
      return NextResponse.json({ success: false, message: 'Comment body or attachment is required' }, { status: 400 });
    }

    // Strict rule: Employees CANNOT post internal HR notes
    if (auth.role === 'EMPLOYEE') {
      isInternal = false;
    }

    const nowISO = new Date().toISOString();
    const commentId = `cmt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const newComment: HrTicketComment = {
      id: commentId,
      requestId: ticketDoc.id || id,
      organizationId: orgId,
      authorId: auth.userId || auth.employeeId || 'user',
      authorName: auth.name || 'User',
      authorRole: auth.role,
      comment: commentText.trim(),
      isInternal,
      attachments,
      createdAt: nowISO,
    };

    await db.collection('hr_request_comments').insertOne(newComment as any);

    // Update ticket timestamp
    await db.collection('hr_requests').updateOne(
      { _id: ticketDoc._id },
      { $set: { updatedAt: nowISO } }
    );

    // Trigger Notification
    const isHrSender = auth.role !== 'EMPLOYEE';
    if (isHrSender && !isInternal) {
      // Notify Employee
      const notifDoc = {
        id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        userId: ticketDoc.employeeId,
        organizationId: orgId,
        title: `HR Response on ${ticketDoc.ticketNo}`,
        message: commentText.length > 100 ? `${commentText.slice(0, 100)}...` : commentText,
        category: 'system',
        priority: 'medium',
        isRead: false,
        link: '/employee/helpdesk',
        createdAt: nowISO,
        updatedAt: nowISO,
      };
      await db.collection('notifications').insertOne(notifDoc);
    } else if (!isHrSender) {
      // Employee replied -> Notify Assigned HR or Admin
      const notifDoc = {
        id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        userId: ticketDoc.assignedToId || 'usr-admin-1',
        organizationId: orgId,
        title: `Reply from ${ticketDoc.creatorName} on ${ticketDoc.ticketNo}`,
        message: commentText.length > 100 ? `${commentText.slice(0, 100)}...` : commentText,
        category: 'system',
        priority: 'medium',
        isRead: false,
        link: '/admin/helpdesk',
        createdAt: nowISO,
        updatedAt: nowISO,
      };
      await db.collection('notifications').insertOne(notifDoc);
    }

    // Audit Event
    await logAuditEvent(req, isInternal ? 'ADD_HR_TICKET_INTERNAL_NOTE' : 'ADD_HR_TICKET_COMMENT', {
      employeeId: ticketDoc.employeeId,
      details: {
        ticketNo: ticketDoc.ticketNo,
        isInternal,
        commentId,
      },
    });

    return NextResponse.json({
      success: true,
      message: isInternal ? 'Internal HR note added' : 'Comment added successfully',
      comment: newComment,
    });
  } catch (error: any) {
    console.error('Error posting ticket comment:', error);
    return NextResponse.json({ success: false, message: error.message || 'Failed to post comment' }, { status: 500 });
  }
}
