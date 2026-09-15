import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getAuthContext, checkPermissions } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';

export const dynamic = 'force-dynamic';

const DEFAULT_ROLE_MATRIX = [
  // ORGANIZATION
  {
    category: 'ORGANIZATION',
    module: 'Organization Management',
    key: 'organizations',
    SUPER_ADMIN: 'FULL',
    ADMIN: 'READ',
    HR: 'NONE',
    MANAGER: 'NONE',
    EMPLOYEE: 'NONE',
  },
  {
    category: 'ORGANIZATION',
    module: 'Organization Structure & Hierarchy',
    key: 'organization_structure',
    SUPER_ADMIN: 'FULL',
    ADMIN: 'READ',
    HR: 'NONE',
    MANAGER: 'NONE',
    EMPLOYEE: 'NONE',
  },

  // USER & ACCESS
  {
    category: 'USER & ACCESS',
    module: 'User & Access Management',
    key: 'users',
    SUPER_ADMIN: 'FULL',
    ADMIN: 'READ_WRITE',
    HR: 'READ',
    MANAGER: 'NONE',
    EMPLOYEE: 'NONE',
  },
  {
    category: 'USER & ACCESS',
    module: 'Roles & Permission Matrix',
    key: 'roles',
    SUPER_ADMIN: 'FULL',
    ADMIN: 'READ',
    HR: 'NONE',
    MANAGER: 'NONE',
    EMPLOYEE: 'NONE',
  },

  // PEOPLE
  {
    category: 'PEOPLE',
    module: 'Employee Directory & Profiles',
    key: 'employees',
    SUPER_ADMIN: 'FULL',
    ADMIN: 'FULL',
    HR: 'READ_WRITE',
    MANAGER: 'READ',
    EMPLOYEE: 'READ',
  },

  // TIME & ATTENDANCE
  {
    category: 'TIME & ATTENDANCE',
    module: 'Attendance & Shift Tracking',
    key: 'attendance',
    SUPER_ADMIN: 'FULL',
    ADMIN: 'FULL',
    HR: 'READ_WRITE',
    MANAGER: 'READ_WRITE',
    EMPLOYEE: 'READ',
  },

  // LEAVE
  {
    category: 'LEAVE',
    module: 'Leave Management & Policies',
    key: 'leave',
    SUPER_ADMIN: 'FULL',
    ADMIN: 'FULL',
    HR: 'READ_WRITE',
    MANAGER: 'READ_WRITE',
    EMPLOYEE: 'READ_WRITE',
  },

  // FINANCE
  {
    category: 'FINANCE',
    module: 'Payroll & Compensation',
    key: 'payroll',
    SUPER_ADMIN: 'FULL',
    ADMIN: 'FULL',
    HR: 'READ',
    MANAGER: 'NONE',
    EMPLOYEE: 'READ',
  },

  // PERFORMANCE
  {
    category: 'PERFORMANCE',
    module: 'Performance & Goals',
    key: 'performance',
    SUPER_ADMIN: 'FULL',
    ADMIN: 'FULL',
    HR: 'READ_WRITE',
    MANAGER: 'READ_WRITE',
    EMPLOYEE: 'READ',
  },

  // DOCUMENTS
  {
    category: 'DOCUMENTS',
    module: 'Document Vault & Storage',
    key: 'documents',
    SUPER_ADMIN: 'FULL',
    ADMIN: 'FULL',
    HR: 'READ_WRITE',
    MANAGER: 'READ',
    EMPLOYEE: 'READ',
  },

  // TALENT
  {
    category: 'TALENT',
    module: 'Recruitment & Job Openings',
    key: 'recruitment',
    SUPER_ADMIN: 'FULL',
    ADMIN: 'FULL',
    HR: 'READ_WRITE',
    MANAGER: 'READ',
    EMPLOYEE: 'NONE',
  },

  // COMMUNICATION
  {
    category: 'COMMUNICATION',
    module: 'Internal Announcements & Messages',
    key: 'communication',
    SUPER_ADMIN: 'FULL',
    ADMIN: 'FULL',
    HR: 'READ_WRITE',
    MANAGER: 'READ_WRITE',
    EMPLOYEE: 'READ',
  },
  {
    category: 'COMMUNICATION',
    module: 'Notification Dispatcher',
    key: 'notifications',
    SUPER_ADMIN: 'FULL',
    ADMIN: 'FULL',
    HR: 'READ_WRITE',
    MANAGER: 'READ',
    EMPLOYEE: 'READ',
  },
  {
    category: 'COMMUNICATION',
    module: 'HR Helpdesk & Ticketing',
    key: 'helpdesk',
    SUPER_ADMIN: 'FULL',
    ADMIN: 'FULL',
    HR: 'READ_WRITE',
    MANAGER: 'READ_WRITE',
    EMPLOYEE: 'READ_WRITE',
  },

  // REPORTING
  {
    category: 'REPORTING',
    module: 'Reports & Business Analytics',
    key: 'reports',
    SUPER_ADMIN: 'FULL',
    ADMIN: 'FULL',
    HR: 'READ',
    MANAGER: 'READ',
    EMPLOYEE: 'NONE',
  },

  // SYSTEM
  {
    category: 'SYSTEM',
    module: 'System Settings & Organization Config',
    key: 'settings',
    SUPER_ADMIN: 'FULL',
    ADMIN: 'READ_WRITE',
    HR: 'READ',
    MANAGER: 'NONE',
    EMPLOYEE: 'NONE',
  },
  {
    category: 'SYSTEM',
    module: 'Third-Party Integrations',
    key: 'integrations',
    SUPER_ADMIN: 'FULL',
    ADMIN: 'READ',
    HR: 'NONE',
    MANAGER: 'NONE',
    EMPLOYEE: 'NONE',
  },
  {
    category: 'SYSTEM',
    module: 'Audit Logs & Governance',
    key: 'audit_logs',
    SUPER_ADMIN: 'FULL',
    ADMIN: 'READ',
    HR: 'NONE',
    MANAGER: 'NONE',
    EMPLOYEE: 'NONE',
  },
  {
    category: 'SYSTEM',
    module: 'Security Center & Threat Monitoring',
    key: 'security',
    SUPER_ADMIN: 'FULL',
    ADMIN: 'NONE',
    HR: 'NONE',
    MANAGER: 'NONE',
    EMPLOYEE: 'NONE',
  },
];

// GET /api/v1/super-admin/roles - Fetch RBAC matrix, versioning, and RBAC audit logs
export async function GET(req: NextRequest) {
  try {
    const auth = getAuthContext(req);
    const perm = checkPermissions(auth, ['SUPER_ADMIN']);
    if (!perm.isAllowed) {
      return NextResponse.json({ success: false, message: perm.message }, { status: perm.statusCode });
    }

    const { db } = await connectToDatabase();

    const [roleDoc, auditLogs] = await Promise.all([
      db.collection('system_settings').findOne({ _id: 'role_permissions_matrix' as any }),
      db
        .collection('audit_logs')
        .find({
          action: {
            $in: [
              'UPDATE_ROLE_PERMISSION_MATRIX',
              'ROLE_PERMISSION_UPDATED',
              'ROLE_PERMISSION_RESET',
              'ROLE_PERMISSION_DEFAULTS_RESTORED',
            ],
          },
        })
        .sort({ timestamp: -1 })
        .limit(15)
        .toArray(),
    ]);

    const rawMatrix = roleDoc?.matrix || DEFAULT_ROLE_MATRIX;

    // Ensure all default modules exist in the fetched matrix with category tags
    const matrix = DEFAULT_ROLE_MATRIX.map((defRow) => {
      const existingRow = rawMatrix.find((r: any) => r.key === defRow.key || r.module === defRow.module);
      if (existingRow) {
        return {
          ...defRow,
          ...existingRow,
          category: defRow.category,
          SUPER_ADMIN: 'FULL', // HARD-LOCKED SUPER ADMIN
        };
      }
      return defRow;
    });

    const categories = Array.from(new Set(matrix.map((m) => m.category)));

    const formattedAudit = auditLogs.map((log) => ({
      id: log._id.toString(),
      action: log.action,
      performedBy: log.performerUserId || log.performedBy || 'Super Admin',
      performedByName: log.performedByName || 'Super Administrator',
      role: log.performerRole || log.role || 'SUPER_ADMIN',
      details: log.details || {},
      timestamp: log.timestamp || log.createdAt || new Date().toISOString(),
    }));

    return NextResponse.json({
      success: true,
      data: {
        roles: ['SUPER_ADMIN', 'ADMIN', 'HR', 'MANAGER', 'EMPLOYEE'],
        categories,
        matrix,
        version: roleDoc?.version || 1,
        updatedAt: roleDoc?.updatedAt || new Date().toISOString(),
        updatedBy: roleDoc?.updatedBy || 'System Default',
        auditHistory: formattedAudit,
        defaultMatrix: DEFAULT_ROLE_MATRIX,
      },
    });
  } catch (error: any) {
    console.error('Error fetching RBAC roles matrix:', error);
    return NextResponse.json({ success: false, message: error.message || 'Failed to fetch roles matrix' }, { status: 500 });
  }
}

// PATCH /api/v1/super-admin/roles - Save or Reset RBAC Matrix Policies
export async function PATCH(req: NextRequest) {
  try {
    const auth = getAuthContext(req);
    const perm = checkPermissions(auth, ['SUPER_ADMIN']);
    if (!perm.isAllowed) {
      return NextResponse.json({ success: false, message: perm.message }, { status: perm.statusCode });
    }

    const body = await req.json();
    const { matrix, actionType } = body;

    const { db } = await connectToDatabase();
    const now = new Date();

    let targetMatrix = matrix;
    let auditAction = 'ROLE_PERMISSION_UPDATED';
    let logMessage = 'Updated role permissions matrix policies';

    if (actionType === 'RESTORE_DEFAULTS') {
      targetMatrix = DEFAULT_ROLE_MATRIX;
      auditAction = 'ROLE_PERMISSION_DEFAULTS_RESTORED';
      logMessage = 'Restored factory default RBAC permission policies';
    } else if (actionType === 'RESET_UNSAVED') {
      auditAction = 'ROLE_PERMISSION_RESET';
      logMessage = 'Reset unsaved permission policy changes';
    }

    if (!Array.isArray(targetMatrix)) {
      return NextResponse.json({ success: false, message: 'Invalid permissions matrix format.' }, { status: 400 });
    }

    // CRITICAL SECURITY ENFORCEMENT: Hard-lock SUPER_ADMIN to FULL for all modules
    const sanitizedMatrix = targetMatrix.map((row: any) => ({
      ...row,
      SUPER_ADMIN: 'FULL',
    }));

    const existingDoc = await db.collection('system_settings').findOne({ _id: 'role_permissions_matrix' as any });
    const currentVersion = (existingDoc?.version || 1) + 1;

    await db.collection('system_settings').updateOne(
      { _id: 'role_permissions_matrix' as any },
      {
        $set: {
          matrix: sanitizedMatrix,
          version: currentVersion,
          updatedAt: now.toISOString(),
          updatedBy: auth.name || auth.email || auth.userId,
        },
      },
      { upsert: true }
    );

    await logAuditEvent(req, auditAction, {
      details: {
        updatedBy: auth.email,
        version: currentVersion,
        actionType: actionType || 'SAVE_POLICY',
        message: logMessage,
      },
    });

    return NextResponse.json({
      success: true,
      message: `${logMessage} successfully (Version v${currentVersion}).`,
      data: {
        matrix: sanitizedMatrix,
        version: currentVersion,
        updatedAt: now.toISOString(),
        updatedBy: auth.name || auth.email,
      },
    });
  } catch (error: any) {
    console.error('Error updating RBAC roles matrix:', error);
    return NextResponse.json({ success: false, message: error.message || 'Failed to update roles matrix' }, { status: 500 });
  }
}
