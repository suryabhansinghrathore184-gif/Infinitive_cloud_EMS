import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getAuthContext, checkPermissions } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';

export const dynamic = 'force-dynamic';

// GET /api/v1/super-admin/users - Fetch paginated system users, KPIs, and filter options
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
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '15', 10)));
    const search = searchParams.get('search')?.trim() || '';
    const roleFilter = searchParams.get('role')?.trim() || 'All';
    const statusFilter = searchParams.get('status')?.trim() || 'All';
    const orgFilter = searchParams.get('organizationId')?.trim() || 'All';
    const verificationFilter = searchParams.get('verification')?.trim() || 'All';

    // 1. Fetch Summary KPI Counts
    const [
      totalUsers,
      activeUsers,
      inactiveUsers,
      pendingVerifyUsers,
      lockedAccounts,
      activeSessions,
      orgDocs,
    ] = await Promise.all([
      db.collection('users').countDocuments(),
      db.collection('users').countDocuments({ status: { $in: ['ACTIVE', 'Active'] } }),
      db.collection('users').countDocuments({ status: { $in: ['INACTIVE', 'Inactive', 'Disabled'] } }),
      db.collection('users').countDocuments({
        $or: [
          { emailVerificationStatus: 'PENDING' },
          { emailVerified: false },
          { emailVerificationStatus: { $exists: false }, emailVerified: { $ne: true } },
        ],
      }),
      db.collection('users').countDocuments({ status: { $in: ['LOCKED', 'Locked', 'Suspended'] } }),
      db.collection('auth_tokens').countDocuments({ expiresAt: { $gt: new Date().toISOString() } }),
      db.collection('organization_settings').find({}).toArray(),
    ]);

    // Format organization list for dropdown filters
    const orgMap = new Map<string, { id: string; name: string; code: string }>();
    orgDocs.forEach((doc) => {
      const orgId = doc.organizationId || doc._id.toString();
      const details = doc.organization || {};
      if (!orgMap.has(orgId)) {
        orgMap.set(orgId, {
          id: orgId,
          name: details.name || doc.name || 'Infinitive Cloud Solutions',
          code: details.code || doc.code || 'ICS-HQ',
        });
      }
    });

    if (!orgMap.has('org-default')) {
      orgMap.set('org-default', {
        id: 'org-default',
        name: 'Infinitive Cloud Solutions',
        code: 'ICS-HQ',
      });
    }

    const organizationsList = Array.from(orgMap.values());

    // 2. Build Filter Query
    let query: any = {};

    if (roleFilter !== 'All') {
      query.$or = [{ role: roleFilter }, { roleTitle: roleFilter }];
    }

    if (statusFilter !== 'All') {
      if (statusFilter === 'Active') {
        query.status = { $in: ['ACTIVE', 'Active'] };
      } else if (statusFilter === 'Inactive') {
        query.status = { $in: ['INACTIVE', 'Inactive', 'Disabled'] };
      } else if (statusFilter === 'Locked' || statusFilter === 'Suspended') {
        query.status = { $in: ['LOCKED', 'Locked', 'Suspended'] };
      } else if (statusFilter === 'Pending Verification') {
        query.$or = [{ emailVerificationStatus: 'PENDING' }, { emailVerified: false }];
      } else {
        query.status = statusFilter;
      }
    }

    if (orgFilter !== 'All') {
      query.organizationId = orgFilter;
    }

    if (verificationFilter !== 'All') {
      if (verificationFilter === 'Verified') {
        query.$or = [{ emailVerified: true }, { emailVerificationStatus: 'VERIFIED' }];
      } else if (verificationFilter === 'Pending') {
        query.$or = [{ emailVerified: false }, { emailVerificationStatus: 'PENDING' }];
      }
    }

    if (search) {
      const regex = new RegExp(search, 'i');
      query.$and = [
        ...(query.$and || []),
        {
          $or: [
            { name: regex },
            { fullName: regex },
            { email: regex },
            { role: regex },
            { employeeId: regex },
            { organizationId: regex },
          ],
        },
      ];
    }

    // 3. Execute Paginated Query
    const totalFilteredCount = await db.collection('users').countDocuments(query);
    const userDocs = await db
      .collection('users')
      .find(query, { projection: { password: 0, passwordHash: 0, salt: 0, otp: 0 } })
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();

    // Map each user record with organization details and active session count
    const formattedUsers = await Promise.all(
      userDocs.map(async (u) => {
        const uOrgId = u.organizationId || 'org-default';
        const orgInfo = orgMap.get(uOrgId) || {
          id: uOrgId,
          name: uOrgId.replace(/^org-?/, '').toUpperCase() + ' Org',
          code: uOrgId.toUpperCase().slice(0, 6),
        };

        const sessionCount = await db.collection('auth_tokens').countDocuments({
          $or: [{ userId: u.id }, { email: u.email }],
          expiresAt: { $gt: new Date().toISOString() },
        });

        const isVerified = u.emailVerified === true || u.emailVerificationStatus === 'VERIFIED';
        const isLocked = u.status === 'LOCKED' || u.status === 'Locked' || u.status === 'Suspended';
        const isActive = u.status === 'ACTIVE' || u.status === 'Active';

        return {
          id: u._id.toString(),
          userId: u.id || u._id.toString(),
          employeeId: u.employeeId || 'N/A',
          name: u.name || u.fullName || 'User Account',
          email: u.email || 'N/A',
          role: u.role || 'EMPLOYEE',
          organizationId: uOrgId,
          organizationName: orgInfo.name,
          organizationCode: orgInfo.code,
          status: isActive ? 'Active' : isLocked ? 'Locked' : 'Inactive',
          emailVerificationStatus: isVerified ? 'Verified' : 'Pending Verification',
          emailVerified: isVerified,
          isTwoFactorEnabled: !!u.isTwoFactorEnabled,
          activeSessionsCount: sessionCount,
          avatar: u.avatar || '',
          lastLogin: u.lastLogin || u.updatedAt || u.createdAt || 'Never',
          createdAt: u.createdAt ? new Date(u.createdAt).toISOString().split('T')[0] : 'N/A',
        };
      })
    );

    // Audit Log
    await logAuditEvent(req, 'USER_VIEWED', {
      details: { page, limit, totalFilteredCount, search, roleFilter, statusFilter },
    });

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalUsers,
          activeUsers,
          inactiveUsers,
          pendingVerify: pendingVerifyUsers,
          lockedAccounts,
          activeSessions,
        },
        organizations: organizationsList,
        users: formattedUsers,
        pagination: {
          total: totalFilteredCount,
          page,
          limit,
          totalPages: Math.ceil(totalFilteredCount / limit) || 1,
        },
      },
    });
  } catch (error: any) {
    console.error('Error fetching system users:', error);
    return NextResponse.json({ success: false, message: error.message || 'Failed to fetch system users' }, { status: 500 });
  }
}
