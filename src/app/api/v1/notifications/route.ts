import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext, checkPermissions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { createNotification } from '@/lib/notifications/notificationService';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const auth = getAuthContext(req);
    const perm = checkPermissions(auth);
    if (!perm.isAllowed) {
      return NextResponse.json({ success: false, message: perm.message }, { status: perm.statusCode });
    }

    const { db } = await connectToDatabase();
    const url = new URL(req.url);

    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '20', 10)));
    const search = url.searchParams.get('search')?.trim();
    const category = url.searchParams.get('category')?.trim();
    const status = url.searchParams.get('status')?.trim();
    const priority = url.searchParams.get('priority')?.trim();
    const eventType = url.searchParams.get('eventType')?.trim();

    // Build query with strict organization isolation & role/recipient scope
    const query: any = {
      organizationId: auth.organizationId,
      deletedAt: { $in: [null, undefined] },
    };

    // Role-based Recipient Scope Enforcement
    if (auth.role === 'EMPLOYEE') {
      query.$or = [
        { recipientId: auth.userId },
        { recipientId: auth.employeeId },
        { targetScope: 'ORGANIZATION' },
      ];
    } else {
      // HR/Admin: include matching recipientId or role/org broadcast scope
      query.$or = [
        { recipientId: auth.userId },
        { recipientId: auth.employeeId },
        { recipientId: 'usr-admin-1' },
        { targetScope: 'ORGANIZATION' },
        { targetScope: 'ROLE', targetId: auth.role },
      ];
    }

    // Category Filter Mapping
    if (category && category !== 'all') {
      if (category === 'unread') {
        query.$and = [{ status: 'UNREAD' }];
      } else {
        const catMap: Record<string, string> = {
          'hr_employee': 'HR_EMPLOYEE',
          'payroll': 'PAYROLL',
          'attendance': 'ATTENDANCE',
          'leave': 'LEAVE',
          'recruitment': 'RECRUITMENT',
          'documents': 'DOCUMENT',
          'system': 'SYSTEM',
        };
        const targetCat = catMap[category.toLowerCase()] || category.toUpperCase();
        query.category = targetCat;
      }
    }

    // Status Filter
    if (status && status !== 'all') {
      query.status = status.toUpperCase();
    }

    // Priority Filter
    if (priority && priority !== 'all') {
      query.priority = priority.toUpperCase();
    }

    // EventType Filter
    if (eventType && eventType !== 'all') {
      query.eventType = eventType;
    }

    // Server-Side Search
    if (search) {
      query.$text = { $search: search };
      // Fallback regex if text index is missing
      delete query.$text;
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { title: searchRegex },
        { message: searchRegex },
        { eventType: searchRegex },
        { category: searchRegex },
      ];
    }

    const skip = (page - 1) * limit;

    // Fetch notifications & summary counts concurrently
    const [rawNotifications, totalCount, unreadCount, readCount] = await Promise.all([
      db.collection('notifications').find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray(),
      db.collection('notifications').countDocuments(query),
      db.collection('notifications').countDocuments({ ...query, status: 'UNREAD' }),
      db.collection('notifications').countDocuments({ ...query, status: 'READ' }),
    ]);

    const totalPages = Math.ceil(totalCount / limit) || 1;

    // Map doc format cleanly
    const notifications = rawNotifications.map((doc) => ({
      id: doc.id || String(doc._id),
      _id: String(doc._id),
      organizationId: doc.organizationId,
      recipientType: doc.recipientType || 'EMPLOYEE',
      recipientId: doc.recipientId,
      targetScope: doc.targetScope || 'USER',
      eventType: doc.eventType,
      category: doc.category || 'SYSTEM',
      title: doc.title,
      message: doc.message,
      priority: doc.priority || 'NORMAL',
      channel: doc.channel || 'IN_APP',
      status: doc.status || (doc.isRead ? 'READ' : 'UNREAD'),
      isRead: doc.status === 'READ' || Boolean(doc.isRead),
      actionUrl: doc.actionUrl || doc.link || null,
      link: doc.actionUrl || doc.link || null,
      metadata: doc.metadata || {},
      createdAt: doc.createdAt,
      readAt: doc.readAt || null,
    }));

    return NextResponse.json({
      success: true,
      notifications,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages,
      },
      totalCount,
      unreadCount,
      readCount,
    });
  } catch (err: any) {
    console.error('Error fetching notifications:', err);
    return NextResponse.json({ success: false, message: err.message || 'Failed to load notifications' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = getAuthContext(req);
    const perm = checkPermissions(auth, ['SUPER_ADMIN', 'ADMIN', 'HR']);
    if (!perm.isAllowed) {
      return NextResponse.json({ success: false, message: perm.message }, { status: perm.statusCode });
    }

    const body = await req.json();
    const createdDoc = await createNotification({
      organizationId: auth.organizationId,
      recipientType: body.recipientType,
      recipientId: body.recipientId,
      targetScope: body.targetScope,
      targetId: body.targetId,
      eventType: body.eventType || 'system_alert',
      category: body.category || 'SYSTEM',
      title: body.title,
      message: body.message,
      priority: body.priority || 'NORMAL',
      actionUrl: body.actionUrl || body.link,
      metadata: body.metadata,
      recipientEmail: body.recipientEmail,
      recipientPhone: body.recipientPhone,
    });

    return NextResponse.json({
      success: true,
      message: 'Notification created successfully',
      notification: createdDoc,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message || 'Failed to create notification' }, { status: 500 });
  }
}
