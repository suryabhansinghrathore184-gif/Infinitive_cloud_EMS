import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getAuthContext, checkPermissions } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const auth = getAuthContext(req);
    const perm = checkPermissions(auth, ['SUPER_ADMIN', 'ADMIN']);
    if (!perm.isAllowed) {
      return NextResponse.json({ success: false, message: perm.message }, { status: perm.statusCode });
    }

    const { db } = await connectToDatabase();
    const { searchParams } = new URL(req.url);

    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '20', 10)));
    const search = searchParams.get('search')?.trim() || '';
    const roleFilter = searchParams.get('role')?.trim() || 'All';
    const statusFilter = searchParams.get('status')?.trim() || 'All';
    const orgFilter = searchParams.get('organizationId')?.trim() || 'All';

    let query: any = {};
    if (roleFilter !== 'All') {
      query.$or = [{ role: roleFilter }, { roleTitle: roleFilter }];
    }
    if (statusFilter !== 'All') {
      query.status = statusFilter;
    }
    if (orgFilter !== 'All') {
      query.organizationId = orgFilter;
    }
    if (search) {
      const regex = new RegExp(search, 'i');
      query.$or = [
        { name: regex },
        { fullName: regex },
        { email: regex },
        { role: regex },
        { employeeId: regex },
      ];
    }

    const totalCount = await db.collection('users').countDocuments(query);
    const userDocs = await db
      .collection('users')
      .find(query, { projection: { password: 0, passwordHash: 0, salt: 0 } })
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();

    // Fallback: If no users collection items returned, populate from employees collection
    let usersList = userDocs;
    if (userDocs.length === 0 && !search && roleFilter === 'All') {
      const empDocs = await db
        .collection('employees')
        .find({}, { projection: { password: 0 } })
        .limit(limit)
        .toArray();

      usersList = empDocs.map((e) => ({
        _id: e._id,
        id: e.id || e.employeeId,
        name: `${e.firstName || ''} ${e.lastName || ''}`.trim() || 'Employee',
        email: e.email,
        role: e.role || 'EMPLOYEE',
        organizationId: e.organizationId || auth.organizationId,
        status: e.status || 'Active',
        createdAt: e.createdAt,
        updatedAt: e.updatedAt,
      }));
    }

    const formattedUsers = usersList.map((u) => ({
      id: u._id?.toString() || u.id,
      name: u.name || u.fullName || 'User',
      email: u.email || 'N/A',
      role: u.role || u.roleTitle || 'EMPLOYEE',
      organizationId: u.organizationId || auth.organizationId,
      status: u.status || 'Active',
      lastLogin: u.lastLogin || u.updatedAt || u.createdAt || 'Never',
      createdAt: u.createdAt ? new Date(u.createdAt).toISOString().split('T')[0] : 'N/A',
    }));

    return NextResponse.json({
      success: true,
      data: {
        users: formattedUsers,
        pagination: {
          total: totalCount || formattedUsers.length,
          page,
          limit,
          totalPages: Math.ceil((totalCount || formattedUsers.length) / limit) || 1,
        },
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || 'Failed to fetch users' }, { status: 500 });
  }
}
