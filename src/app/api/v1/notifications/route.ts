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
    const orgIdParam = url.searchParams.get('orgId')?.trim() || url.searchParams.get('organizationId')?.trim();
    const dateRange = url.searchParams.get('dateRange')?.trim();

    // Base query with soft delete filter
    const query: any = {
      deletedAt: { $in: [null, undefined] },
    };

    // Organization Scope Enforcement
    if (auth.role === 'SUPER_ADMIN') {
      if (orgIdParam && orgIdParam !== 'all') {
        query.organizationId = orgIdParam;
      }
    } else {
      query.organizationId = auth.organizationId;
    }

    // Role-based Recipient Scope Enforcement
    if (auth.role === 'EMPLOYEE') {
      query.$or = [
        { recipientId: auth.userId },
        { recipientId: auth.employeeId },
        { targetScope: 'ORGANIZATION' },
      ];
    } else if (auth.role !== 'SUPER_ADMIN') {
      query.$or = [
        { recipientId: auth.userId },
        { recipientId: auth.employeeId },
        { recipientId: 'usr-admin-1' },
        { targetScope: 'ORGANIZATION' },
        { targetScope: 'ROLE', targetId: auth.role },
      ];
    }

    // Category Filter Mapping
    if (category && category !== 'all' && category !== 'ALL') {
      if (category.toUpperCase() === 'UNREAD') {
        query.status = 'UNREAD';
      } else if (category.toUpperCase() === 'READ') {
        query.status = 'READ';
      } else {
        const catMap: Record<string, string[]> = {
          SECURITY: ['SECURITY', 'AUDIT'],
          ORGANIZATION: ['ORGANIZATION', 'TENANT'],
          USER_ACCESS: ['USER_ACCESS', 'USER', 'ROLE'],
          EMPLOYEE: ['EMPLOYEE', 'HR_EMPLOYEE'],
          ATTENDANCE: ['ATTENDANCE'],
          LEAVE: ['LEAVE'],
          PAYROLL: ['PAYROLL'],
          SYSTEM: ['SYSTEM'],
          INTEGRATION: ['INTEGRATION'],
        };
        const mapped = catMap[category.toUpperCase()] || [category.toUpperCase()];
        query.category = { $in: mapped };
      }
    }

    // Status Filter (READ / UNREAD)
    if (status && status !== 'all' && status !== 'ALL') {
      query.status = status.toUpperCase();
    }

    // Priority / Severity Filter
    if (priority && priority !== 'all' && priority !== 'ALL') {
      const prioUpper = priority.toUpperCase();
      if (prioUpper === 'CRITICAL') {
        query.priority = { $in: ['CRITICAL', 'URGENT'] };
      } else if (prioUpper === 'WARNING') {
        query.priority = { $in: ['HIGH', 'WARNING'] };
      } else if (prioUpper === 'INFO') {
        query.priority = { $in: ['NORMAL', 'INFO', 'LOW'] };
      } else {
        query.priority = prioUpper;
      }
    }

    // EventType Filter
    if (eventType && eventType !== 'all') {
      query.eventType = eventType;
    }

    // Date Range Filter
    const now = new Date();
    if (dateRange === 'today') {
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      query.createdAt = { $gte: startOfDay };
    } else if (dateRange === 'last7days') {
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      query.createdAt = { $gte: sevenDaysAgo };
    } else if (dateRange === 'last30days') {
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      query.createdAt = { $gte: thirtyDaysAgo };
    }

    // Server-Side Search Filter (title, message, category, eventType, organizationId)
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      const searchConditions = [
        { title: searchRegex },
        { message: searchRegex },
        { eventType: searchRegex },
        { category: searchRegex },
        { organizationId: searchRegex },
        { recipientId: searchRegex },
      ];
      if (query.$or) {
        query.$and = [{ $or: query.$or }, { $or: searchConditions }];
        delete query.$or;
      } else {
        query.$or = searchConditions;
      }
    }

    const skip = (page - 1) * limit;
    const startOfTodayISO = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

    // Base scope for Executive KPIs
    const kpiBaseQuery: any = { deletedAt: { $in: [null, undefined] } };
    if (auth.role !== 'SUPER_ADMIN') {
      kpiBaseQuery.organizationId = auth.organizationId;
    } else if (orgIdParam && orgIdParam !== 'all') {
      kpiBaseQuery.organizationId = orgIdParam;
    }

    // Concurrently fetch page items, count totals, and compute Executive KPIs
    const [rawNotifications, totalCount, unreadCount, readCount, criticalCount, warningCount, todayCount, systemCount] =
      await Promise.all([
        db.collection('notifications').find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray(),
        db.collection('notifications').countDocuments(query),
        db.collection('notifications').countDocuments({ ...kpiBaseQuery, status: 'UNREAD' }),
        db.collection('notifications').countDocuments({ ...kpiBaseQuery, status: 'READ' }),
        db.collection('notifications').countDocuments({ ...kpiBaseQuery, priority: { $in: ['CRITICAL', 'URGENT'] } }),
        db.collection('notifications').countDocuments({ ...kpiBaseQuery, priority: { $in: ['HIGH', 'WARNING'] } }),
        db.collection('notifications').countDocuments({ ...kpiBaseQuery, createdAt: { $gte: startOfTodayISO } }),
        db.collection('notifications').countDocuments({
          ...kpiBaseQuery,
          category: { $in: ['SYSTEM', 'SECURITY', 'INTEGRATION', 'AUDIT'] },
        }),
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
      data: notifications,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages,
      },
      kpis: {
        total: totalCount,
        unread: unreadCount,
        read: readCount,
        critical: criticalCount,
        warnings: warningCount,
        today: todayCount,
        systemAlerts: systemCount,
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
      organizationId: body.organizationId || auth.organizationId,
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
