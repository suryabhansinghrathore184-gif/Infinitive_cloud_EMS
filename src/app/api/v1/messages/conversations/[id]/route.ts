import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase, uploadFileToGridFS } from '@/lib/mongodb';
import { getAuthContext, checkPermissions } from '@/lib/auth';
import { InternalMessage, MessageAttachment } from '@/types/admin';

export const dynamic = 'force-dynamic';

// GET /api/v1/messages/conversations/[id] - Fetch single conversation & message history
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

    const conversation = await db.collection('conversations').findOne({
      id,
      organizationId: auth.organizationId,
    });

    if (!conversation) {
      return NextResponse.json({ success: false, message: 'Conversation thread not found' }, { status: 404 });
    }

    // Access control check for employees
    if (auth.role === 'EMPLOYEE') {
      const empId = auth.employeeId || auth.userId;
      if (conversation.employeeId !== empId && conversation.employeeId !== auth.userId && conversation.employeeId !== auth.employeeId) {
        return NextResponse.json({ success: false, message: 'Forbidden. Access restricted.' }, { status: 403 });
      }
    }

    const nowISO = new Date().toISOString();

    // Mark unread messages as read based on who is viewing
    if (auth.role === 'EMPLOYEE') {
      if (conversation.unreadCountEmployee > 0) {
        await db.collection('conversations').updateOne(
          { id },
          { $set: { unreadCountEmployee: 0, updatedAt: nowISO } }
        );
      }
      await db.collection('messages').updateMany(
        { conversationId: id, readAt: null, senderRole: { $ne: 'EMPLOYEE' } },
        { $set: { readAt: nowISO } }
      );
    } else {
      if (conversation.unreadCountHr > 0) {
        await db.collection('conversations').updateOne(
          { id },
          { $set: { unreadCountHr: 0, updatedAt: nowISO } }
        );
      }
      await db.collection('messages').updateMany(
        { conversationId: id, readAt: null, senderRole: 'EMPLOYEE' },
        { $set: { readAt: nowISO } }
      );
    }

    // Fetch message history
    const rawMessages = await db
      .collection('messages')
      .find({ conversationId: id, organizationId: auth.organizationId })
      .sort({ createdAt: 1 })
      .toArray();

    const messages: InternalMessage[] = rawMessages.map((m) => ({
      id: m.id || m._id.toString(),
      conversationId: m.conversationId,
      organizationId: m.organizationId,
      senderId: m.senderId,
      senderRole: m.senderRole,
      senderName: m.senderName || 'User',
      senderAvatar: m.senderAvatar || '',
      receiverId: m.receiverId,
      message: m.message || '',
      attachments: m.attachments || [],
      readAt: m.readAt || null,
      createdAt: m.createdAt || new Date().toISOString(),
    }));

    const formattedConversation = {
      id: conversation.id || conversation._id.toString(),
      organizationId: conversation.organizationId,
      employeeId: conversation.employeeId,
      employeeName: conversation.employeeName || 'Employee',
      employeeAvatar: conversation.employeeAvatar || '',
      employeeEmail: conversation.employeeEmail || '',
      department: conversation.department || '',
      subject: conversation.subject || 'No Subject',
      lastMessage: conversation.lastMessage || '',
      lastMessageAt: conversation.lastMessageAt || conversation.createdAt,
      unreadCountHr: auth.role === 'EMPLOYEE' ? conversation.unreadCountHr : 0,
      unreadCountEmployee: auth.role === 'EMPLOYEE' ? 0 : conversation.unreadCountEmployee,
      createdBy: conversation.createdBy,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
    };

    return NextResponse.json({
      success: true,
      conversation: formattedConversation,
      messages,
    });
  } catch (error: any) {
    console.error('Error fetching conversation history:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Failed to fetch conversation history' },
      { status: 500 }
    );
  }
}

// POST /api/v1/messages/conversations/[id] - Reply to conversation thread
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

    const conversation = await db.collection('conversations').findOne({
      id,
      organizationId: auth.organizationId,
    });

    if (!conversation) {
      return NextResponse.json({ success: false, message: 'Conversation thread not found' }, { status: 404 });
    }

    if (auth.role === 'EMPLOYEE') {
      const empId = auth.employeeId || auth.userId;
      if (conversation.employeeId !== empId && conversation.employeeId !== auth.userId && conversation.employeeId !== auth.employeeId) {
        return NextResponse.json({ success: false, message: 'Forbidden. Access restricted.' }, { status: 403 });
      }
    }

    const contentType = req.headers.get('content-type') || '';
    let messageText = '';
    let attachments: MessageAttachment[] = [];

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      messageText = (formData.get('message') as string) || '';

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
      messageText = body.message || '';
      attachments = body.attachments || [];
    }

    if (!messageText && attachments.length === 0) {
      return NextResponse.json({ success: false, message: 'Message body or file attachment is required' }, { status: 400 });
    }

    const nowISO = new Date().toISOString();
    const msgId = `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const isEmployee = auth.role === 'EMPLOYEE';
    const receiverId = isEmployee ? conversation.createdBy || 'HR' : conversation.employeeId;

    const replyMessage: InternalMessage = {
      id: msgId,
      conversationId: id,
      organizationId: auth.organizationId,
      senderId: isEmployee ? (auth.employeeId || auth.userId) : auth.userId,
      senderRole: auth.role,
      senderName: auth.name || (isEmployee ? conversation.employeeName : 'HR Admin'),
      senderAvatar: isEmployee ? conversation.employeeAvatar : '',
      receiverId,
      message: messageText || (attachments.length > 0 ? `Sent attachment: ${attachments[0].fileName}` : ''),
      attachments,
      readAt: null,
      createdAt: nowISO,
    };

    await db.collection('messages').insertOne(replyMessage as any);

    // Update conversation record
    const updateField = isEmployee
      ? { $inc: { unreadCountHr: 1 }, $set: { lastMessage: replyMessage.message, lastMessageAt: nowISO, updatedAt: nowISO } }
      : { $inc: { unreadCountEmployee: 1 }, $set: { lastMessage: replyMessage.message, lastMessageAt: nowISO, updatedAt: nowISO } };

    await db.collection('conversations').updateOne({ id }, updateField);

    // Create & Dispatch Notification via notificationService
    const notifTargetUserId = isEmployee
      ? conversation.createdBy || 'usr-admin-1'
      : (conversation.employeeId || receiverId);

    const notifTitle = isEmployee
      ? `New reply from ${conversation.employeeName}: ${conversation.subject}`
      : `New message from HR: ${conversation.subject}`;

    const notifLink = isEmployee ? '/admin/communication' : '/employee/messages';

    try {
      const { createNotification } = await import('@/lib/notifications/notificationService');
      await createNotification({
        organizationId: auth.organizationId,
        recipientType: isEmployee ? 'ADMIN' : 'EMPLOYEE',
        recipientId: notifTargetUserId,
        eventType: 'internal_hr_message',
        category: 'HR_EMPLOYEE',
        title: notifTitle,
        message: replyMessage.message.length > 100 ? `${replyMessage.message.slice(0, 100)}...` : replyMessage.message,
        priority: 'HIGH',
        actionUrl: notifLink,
      });
    } catch (notifErr) {
      console.warn('Could not dispatch message notification:', notifErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Reply sent successfully',
      reply: replyMessage,
    });
  } catch (error: any) {
    console.error('Error posting reply message:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Failed to send reply' },
      { status: 500 }
    );
  }
}
