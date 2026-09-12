import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getAuthContext, checkPermissions } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';

export const dynamic = 'force-dynamic';

const DEFAULT_ROLE_MATRIX = [
  {
    module: 'Organizations Management',
    key: 'organizations',
    SUPER_ADMIN: 'FULL',
    ADMIN: 'READ',
    HR: 'NONE',
    MANAGER: 'NONE',
    EMPLOYEE: 'NONE',
  },
  {
    module: 'User & Access Management',
    key: 'users',
    SUPER_ADMIN: 'FULL',
    ADMIN: 'READ_WRITE',
    HR: 'READ',
    MANAGER: 'NONE',
    EMPLOYEE: 'NONE',
  },
  {
    module: 'Employee Directory & Profiles',
    key: 'employees',
    SUPER_ADMIN: 'FULL',
    ADMIN: 'FULL',
    HR: 'READ_WRITE',
    MANAGER: 'READ',
    EMPLOYEE: 'READ',
  },
  {
    module: 'Attendance & Shifts',
    key: 'attendance',
    SUPER_ADMIN: 'FULL',
    ADMIN: 'FULL',
    HR: 'READ_WRITE',
    MANAGER: 'READ_WRITE',
    EMPLOYEE: 'READ',
  },
  {
    module: 'Leave Management & Quotas',
    key: 'leave',
    SUPER_ADMIN: 'FULL',
    ADMIN: 'FULL',
    HR: 'READ_WRITE',
    MANAGER: 'READ_WRITE',
    EMPLOYEE: 'READ_WRITE',
  },
  {
    module: 'Payroll & Compensation',
    key: 'payroll',
    SUPER_ADMIN: 'FULL',
    ADMIN: 'FULL',
    HR: 'READ',
    MANAGER: 'NONE',
    EMPLOYEE: 'READ',
  },
  {
    module: 'Performance & Goals',
    key: 'performance',
    SUPER_ADMIN: 'FULL',
    ADMIN: 'FULL',
    HR: 'READ_WRITE',
    MANAGER: 'READ_WRITE',
    EMPLOYEE: 'READ',
  },
  {
    module: 'Document Vault & Storage',
    key: 'documents',
    SUPER_ADMIN: 'FULL',
    ADMIN: 'FULL',
    HR: 'READ_WRITE',
    MANAGER: 'READ',
    EMPLOYEE: 'READ',
  },
  {
    module: 'Recruitment & Hiring',
    key: 'recruitment',
    SUPER_ADMIN: 'FULL',
    ADMIN: 'FULL',
    HR: 'READ_WRITE',
    MANAGER: 'READ',
    EMPLOYEE: 'NONE',
  },
  {
    module: 'Internal Communication',
    key: 'communication',
    SUPER_ADMIN: 'FULL',
    ADMIN: 'FULL',
    HR: 'READ_WRITE',
    MANAGER: 'READ_WRITE',
    EMPLOYEE: 'READ',
  },
  {
    module: 'Notification Dispatcher',
    key: 'notifications',
    SUPER_ADMIN: 'FULL',
    ADMIN: 'FULL',
    HR: 'READ_WRITE',
    MANAGER: 'READ',
    EMPLOYEE: 'READ',
  },
  {
    module: 'HR Helpdesk & Tickets',
    key: 'helpdesk',
    SUPER_ADMIN: 'FULL',
    ADMIN: 'FULL',
    HR: 'READ_WRITE',
    MANAGER: 'READ_WRITE',
    EMPLOYEE: 'READ_WRITE',
  },
  {
    module: 'System Settings & Security',
    key: 'settings',
    SUPER_ADMIN: 'FULL',
    ADMIN: 'READ_WRITE',
    HR: 'READ',
    MANAGER: 'NONE',
    EMPLOYEE: 'NONE',
  },
];

export async function GET(req: NextRequest) {
  try {
    const auth = getAuthContext(req);
    const perm = checkPermissions(auth, ['SUPER_ADMIN', 'ADMIN']);
    if (!perm.isAllowed) {
      return NextResponse.json({ success: false, message: perm.message }, { status: perm.statusCode });
    }

    const { db } = await connectToDatabase();
    const roleDoc = await db.collection('system_settings').findOne({ _id: 'role_permissions_matrix' as any });

    const matrix = roleDoc?.matrix || DEFAULT_ROLE_MATRIX;

    return NextResponse.json({
      success: true,
      data: {
        roles: ['SUPER_ADMIN', 'ADMIN', 'HR', 'MANAGER', 'EMPLOYEE'],
        matrix,
        updatedAt: roleDoc?.updatedAt || new Date().toISOString(),
        updatedBy: roleDoc?.updatedBy || 'System Default',
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || 'Failed to fetch roles matrix' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = getAuthContext(req);
    const perm = checkPermissions(auth, ['SUPER_ADMIN']);
    if (!perm.isAllowed) {
      return NextResponse.json({ success: false, message: perm.message }, { status: perm.statusCode });
    }

    const body = await req.json();
    const { matrix } = body;

    if (!Array.isArray(matrix)) {
      return NextResponse.json({ success: false, message: 'Invalid permissions matrix format.' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const now = new Date();

    await db.collection('system_settings').updateOne(
      { _id: 'role_permissions_matrix' as any },
      {
        $set: {
          matrix,
          updatedAt: now,
          updatedBy: auth.email || auth.userId,
        },
      },
      { upsert: true }
    );

    await logAuditEvent(req, 'UPDATE_ROLE_PERMISSION_MATRIX', { details: { updatedBy: auth.email } });

    return NextResponse.json({
      success: true,
      message: 'Role permissions matrix updated successfully.',
      data: matrix,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || 'Failed to update roles matrix' }, { status: 500 });
  }
}
