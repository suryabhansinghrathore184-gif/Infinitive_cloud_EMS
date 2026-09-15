import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getAuthContext, checkPermissions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const auth = getAuthContext(req);
    const perm = checkPermissions(auth, ['SUPER_ADMIN']);
    if (!perm.isAllowed) {
      return NextResponse.json({ success: false, message: perm.message }, { status: perm.statusCode });
    }

    const { db } = await connectToDatabase();
    const { searchParams } = new URL(req.url);

    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '25', 10)));
    const search = searchParams.get('search')?.trim() || '';
    const actionFilter = searchParams.get('action')?.trim() || 'All';
    const roleFilter = searchParams.get('role')?.trim() || 'All';
    const orgFilter = searchParams.get('organizationId')?.trim() || 'All';

    let query: any = {};
    if (orgFilter !== 'All') {
      query.organizationId = orgFilter;
    }
    if (actionFilter !== 'All') {
      query.action = actionFilter;
    }
    if (roleFilter !== 'All') {
      query.role = roleFilter;
    }
    if (search) {
      const regex = new RegExp(search, 'i');
      query.$or = [
        { action: regex },
        { performedBy: regex },
        { performedByName: regex },
        { role: regex },
        { employeeId: regex },
        { organizationId: regex },
      ];
    }

    const totalCount = await db.collection('audit_logs').countDocuments(query);
    const logs = await db
      .collection('audit_logs')
      .find(query)
      .sort({ timestamp: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();

    const formattedLogs = logs.map((log) => ({
      id: log._id.toString(),
      organizationId: log.organizationId || 'System Global',
      employeeId: log.employeeId || 'N/A',
      performedBy: log.performedBy || 'System Admin',
      performedByName: log.performedByName || log.performedBy || 'Admin User',
      role: log.role || 'HR Administrator',
      action: log.action || 'GENERAL_AUDIT',
      details: log.details || {},
      oldValue: log.oldValue || null,
      newValue: log.newValue || null,
      ipAddress: log.ipAddress || '127.0.0.1',
      userAgent: log.userAgent || 'Web Client',
      timestamp: log.timestamp ? new Date(log.timestamp).toISOString() : new Date().toISOString(),
    }));

    return NextResponse.json({
      success: true,
      data: {
        logs: formattedLogs,
        pagination: {
          total: totalCount,
          page,
          limit,
          totalPages: Math.ceil(totalCount / limit) || 1,
        },
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || 'Failed to fetch audit logs' }, { status: 500 });
  }
}
