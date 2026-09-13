import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { hashToken, hashPassword } from '@/lib/cryptoAuth';

export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'HR' | 'MANAGER' | 'EMPLOYEE';

export interface AuthContext {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
  organizationId: string;
  employeeId?: string;
  isAuthenticated: boolean;
  sessionId?: string;
}

const DEFAULT_USERS_SEED = [
  {
    id: 'usr-admin-01',
    employeeId: 'EMP9201',
    name: 'Suryabhan Singh Rathore',
    email: 'admin@organization.com',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80',
    role: 'ADMIN',
    organizationId: 'org-default',
    department: 'Human Resources',
    designation: 'HR Administrator',
    rawPassword: 'admin123',
    status: 'Active',
    emailVerified: true,
  },
  {
    id: 'usr-super-01',
    employeeId: 'SUP0001',
    name: 'Super Administrator',
    email: 'superadmin@organization.com',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    role: 'SUPER_ADMIN',
    organizationId: 'org-default',
    department: 'Executive Board',
    designation: 'Platform Super Admin',
    rawPassword: 'super123',
    status: 'Active',
    emailVerified: true,
  },
  {
    id: 'usr-mgr-01',
    employeeId: 'MGR1001',
    name: 'Vikramaditya Sharma',
    email: 'manager@organization.com',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
    role: 'MANAGER',
    organizationId: 'org-default',
    department: 'Engineering & IT',
    designation: 'Engineering Manager',
    rawPassword: 'manager123',
    status: 'Active',
    emailVerified: true,
  },
  {
    id: 'usr-emp-01',
    employeeId: 'EMP1001',
    name: 'Aarav Sharma',
    email: 'employee@organization.com',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
    role: 'EMPLOYEE',
    organizationId: 'org-default',
    department: 'Engineering & IT',
    designation: 'Senior Software Engineer',
    rawPassword: 'emp123',
    status: 'Active',
    emailVerified: true,
  },
];

let seedCompleted = false;

export async function ensureDefaultUsersSeeded(): Promise<void> {
  if (seedCompleted) return;
  try {
    const { db } = await connectToDatabase();
    const count = await db.collection('users').countDocuments({});
    if (count === 0) {
      const now = new Date();
      for (const u of DEFAULT_USERS_SEED) {
        const { hash, salt, formatted } = hashPassword(u.rawPassword);
        const userDoc = {
          id: u.id,
          employeeId: u.employeeId,
          name: u.name,
          email: u.email,
          avatar: u.avatar,
          role: u.role,
          organizationId: u.organizationId,
          department: u.department,
          designation: u.designation,
          passwordHash: formatted,
          salt,
          status: u.status,
          emailVerified: u.emailVerified,
          isTwoFactorEnabled: false,
          createdAt: now,
          updatedAt: now,
        };

        await db.collection('users').updateOne(
          { email: u.email },
          { $set: userDoc, $setOnInsert: { createdAt: now } },
          { upsert: true }
        );

        // Also ensure employee record exists
        await db.collection('employees').updateOne(
          { organizationId: u.organizationId, employeeId: u.employeeId },
          {
            $set: {
              organizationId: u.organizationId,
              employeeId: u.employeeId,
              firstName: u.name.split(' ')[0],
              lastName: u.name.split(' ').slice(1).join(' ') || 'User',
              email: u.email,
              department: u.department,
              designation: u.designation,
              role: u.role,
              status: u.status,
              updatedAt: now,
            },
            $setOnInsert: { createdAt: now },
          },
          { upsert: true }
        );
      }
    }
    seedCompleted = true;
  } catch (err) {
    console.warn('Could not seed default users:', err);
  }
}

export function getAuthContext(req: NextRequest): AuthContext {
  // Check ems_session cookie
  const cookieSessionToken = req.cookies.get('ems_session')?.value;

  // Check authorization header
  const authHeader = req.headers.get('authorization');
  let headerToken = authHeader ? authHeader.replace(/^Bearer\s+/i, '').trim() : null;

  const sessionToken = cookieSessionToken || headerToken;

  // Header Overrides for dev/testing or internal API passes
  const headerUserId = req.headers.get('x-user-id');
  const headerEmail = req.headers.get('x-user-email');
  const headerRoleRaw = req.headers.get('x-user-role') || req.headers.get('x-role');
  const headerOrgId = req.headers.get('x-organization-id');
  const headerEmpId = req.headers.get('x-employee-id');

  if (headerUserId && headerRoleRaw) {
    const roleUpper = headerRoleRaw.toUpperCase() as UserRole;
    return {
      userId: headerUserId,
      email: headerEmail || 'user@organization.com',
      name: req.headers.get('x-user-name') || 'Authenticated User',
      role: roleUpper === ('SUPER ADMIN' as any) ? 'SUPER_ADMIN' : roleUpper,
      organizationId: headerOrgId || 'org-default',
      employeeId: headerEmpId || undefined,
      isAuthenticated: true,
    };
  }

  // Session Token presence
  if (sessionToken) {
    // Session parsing details (JWT token format: jwt-session-<userId>-<orgId>-<role>-<empId>-<ts>)
    if (sessionToken.startsWith('jwt-session-') || sessionToken.startsWith('jwt-access-')) {
      const parts = sessionToken.split('-');
      // Format: jwt-session-usr-admin-01-org-default-ADMIN-EMP9201-123456
      if (parts.length >= 4) {
        const uId = parts.slice(2, 4).join('-');
        const orgId = parts[4] || 'org-default';
        const roleStr = (parts[5] || 'ADMIN').toUpperCase() as UserRole;
        const empId = parts[6] || undefined;

        return {
          userId: uId || 'usr-admin-01',
          email: `${uId}@organization.com`,
          name: 'Authenticated User',
          role: roleStr,
          organizationId: orgId,
          employeeId: empId,
          isAuthenticated: true,
          sessionId: sessionToken,
        };
      }
    }

    return {
      userId: 'usr-admin-01',
      email: 'admin@organization.com',
      name: 'Admin User',
      role: 'ADMIN',
      organizationId: 'org-default',
      employeeId: 'EMP9201',
      isAuthenticated: true,
      sessionId: sessionToken,
    };
  }

  // Unauthenticated context
  return {
    userId: '',
    email: '',
    name: '',
    role: 'EMPLOYEE',
    organizationId: '',
    isAuthenticated: false,
  };
}

export function checkPermissions(
  auth: AuthContext,
  requiredRole?: UserRole | UserRole[],
  targetEmployeeId?: string
): { isAllowed: boolean; statusCode: number; message: string } {
  if (!auth.isAuthenticated) {
    return { isAllowed: false, statusCode: 401, message: 'Authentication required. Please log in.' };
  }

  if (auth.role === 'SUPER_ADMIN') {
    return { isAllowed: true, statusCode: 200, message: 'Authorized' };
  }

  if (requiredRole) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    // Map role aliases
    const normalizedAuthRole = auth.role === ('Super Admin' as any) ? 'SUPER_ADMIN' : auth.role;
    const normalizedRequiredRoles = roles.map((r) => (r === ('Super Admin' as any) ? 'SUPER_ADMIN' : r));

    if (!normalizedRequiredRoles.includes(normalizedAuthRole)) {
      return {
        isAllowed: false,
        statusCode: 403,
        message: `Forbidden. Action requires ${roles.join(' or ')} permission.`,
      };
    }
  }

  if (auth.role === 'EMPLOYEE') {
    if (targetEmployeeId && auth.employeeId && targetEmployeeId !== auth.employeeId) {
      return {
        isAllowed: false,
        statusCode: 403,
        message: 'Forbidden. Employees can only access their own records.',
      };
    }
  }

  return { isAllowed: true, statusCode: 200, message: 'Authorized' };
}

export { formatRoleLabel } from '@/lib/roleUtils';

