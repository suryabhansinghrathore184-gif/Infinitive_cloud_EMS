import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase, uploadFileToGridFS } from '@/lib/mongodb';
import { getAuthContext, checkPermissions } from '@/lib/auth';
import { ConversationThread, InternalMessage, MessageAttachment } from '@/types/admin';

export const dynamic = 'force-dynamic';

// GET /api/v1/messages/conversations - List conversations
export async function GET(req: NextRequest) {
  try {
    const auth = getAuthContext(req);
    const perm = checkPermissions(auth);
    if (!perm.isAllowed) {
      return NextResponse.json({ success: false, message: perm.message }, { status: perm.statusCode });
    }

    const { searchParams } = new URL(req.url);
    const targetEmployeeId = searchParams.get('employeeId');

    const { db } = await connectToDatabase();

    const query: any = { organizationId: auth.organizationId };

    if (auth.role === 'EMPLOYEE') {
      // Employees can ONLY see conversations where they are the employee participant
      const empId = auth.employeeId || auth.userId;
      query.$or = [{ employeeId: empId }, { employeeId: auth.userId }, { employeeId: auth.employeeId }];
    } else if (targetEmployeeId) {
      query.employeeId = targetEmployeeId;
    }

    const rawConversations = await db
      .collection('conversations')
      .find(query)
      .sort({ updatedAt: -1 })
      .toArray();

    const conversations: ConversationThread[] = rawConversations.map((c) => ({
      id: c.id || c._id.toString(),
      organizationId: c.organizationId,
      employeeId: c.employeeId,
      employeeName: c.employeeName || 'Employee',
      employeeAvatar: c.employeeAvatar || '',
      employeeEmail: c.employeeEmail || '',
      department: c.department || '',
      subject: c.subject || 'No Subject',
      lastMessage: c.lastMessage || '',
      lastMessageAt: c.lastMessageAt || c.createdAt || new Date().toISOString(),
      unreadCountHr: c.unreadCountHr || 0,
      unreadCountEmployee: c.unreadCountEmployee || 0,
      createdBy: c.createdBy || '',
      createdAt: c.createdAt || new Date().toISOString(),
      updatedAt: c.updatedAt || new Date().toISOString(),
    }));

    return NextResponse.json({ success: true, conversations });
  } catch (error: any) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Failed to fetch conversations' },
      { status: 500 }
    );
  }
}

// POST /api/v1/messages/conversations - Create new conversation thread (HR -> Employee)
export async function POST(req: NextRequest) {
  try {
    const auth = getAuthContext(req);
    const perm = checkPermissions(auth, ['SUPER_ADMIN', 'ADMIN', 'HR', 'MANAGER']);
    if (!perm.isAllowed) {
      return NextResponse.json({ success: false, message: perm.message }, { status: perm.statusCode });
    }

    const contentType = req.headers.get('content-type') || '';
    let employeeId = '';
    let subject = '';
    let messageText = '';
    let attachments: MessageAttachment[] = [];

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      employeeId = (formData.get('employeeId') as string) || '';
      subject = (formData.get('subject') as string) || '';
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
      employeeId = body.employeeId || '';
      subject = body.subject || '';
      messageText = body.message || '';
      attachments = body.attachments || [];
    }

    if (!employeeId || !subject || !messageText) {
      return NextResponse.json(
        { success: false, message: 'employeeId, subject, and message are required fields' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    // Fetch employee details
    const employeeDoc = await db.collection('employees').findOne({
      organizationId: auth.organizationId,
      $or: [{ employeeId }, { id: employeeId }, { userId: employeeId }],
    });

    const empName = employeeDoc?.fullName || `${employeeDoc?.firstName || ''} ${employeeDoc?.lastName || ''}`.trim() || 'Employee';
    const empAvatar = employeeDoc?.photo || employeeDoc?.avatar || '';
    const empEmail = employeeDoc?.email || '';
    const empDept = employeeDoc?.department || '';
    const targetUserId = employeeDoc?.userId || employeeDoc?.employeeId || employeeId;

    const convId = `conv-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const msgId = `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const nowISO = new Date().toISOString();

    const conversationDoc: ConversationThread = {
      id: convId,
      organizationId: auth.organizationId,
      employeeId,
      employeeName: empName,
      employeeAvatar: empAvatar,
      employeeEmail: empEmail,
      department: empDept,
      subject,
      lastMessage: messageText,
      lastMessageAt: nowISO,
      unreadCountHr: 0,
      unreadCountEmployee: 1,
      createdBy: auth.userId,
      createdAt: nowISO,
      updatedAt: nowISO,
    };

    const initialMessage: InternalMessage = {
      id: msgId,
      conversationId: convId,
      organizationId: auth.organizationId,
      senderId: auth.userId,
      senderRole: auth.role,
      senderName: auth.name || 'HR Admin',
      senderAvatar: '',
      receiverId: employeeId,
      message: messageText,
      attachments,
      readAt: null,
      createdAt: nowISO,
    };

    await db.collection('conversations').insertOne(conversationDoc as any);
    await db.collection('messages').insertOne(initialMessage as any);

    // Create in-app notification for Employee
    const notificationDoc = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      userId: targetUserId,
      employeeId,
      title: `New message from HR: ${subject}`,
      message: messageText.length > 100 ? `${messageText.slice(0, 100)}...` : messageText,
      category: 'system',
      priority: 'high',
      isRead: false,
      link: '/employee/messages',
      createdAt: nowISO,
      updatedAt: nowISO,
    };
    await db.collection('notifications').insertOne(notificationDoc);

    return NextResponse.json({
      success: true,
      message: 'Message sent successfully',
      conversation: conversationDoc,
      initialMessage,
    });
  } catch (error: any) {
    console.error('Error creating conversation:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Failed to send message' },
      { status: 500 }
    );
  }
}
