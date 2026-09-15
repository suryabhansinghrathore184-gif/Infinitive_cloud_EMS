import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { hashPassword } from '@/lib/cryptoAuth';

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
    const now = new Date();
    for (const u of DEFAULT_USERS_SEED) {
      const existingUser = await db.collection('users').findOne({ email: u.email });
      if (!existingUser) {
        const { salt, formatted } = hashPassword(u.rawPassword);
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
          { $setOnInsert: userDoc },
          { upsert: true }
        );

        await db.collection('employees').updateOne(
          { organizationId: u.organizationId, employeeId: u.employeeId },
          {
            $setOnInsert: {
              organizationId: u.organizationId,
              employeeId: u.employeeId,
              firstName: u.name.split(' ')[0],
              lastName: u.name.split(' ').slice(1).join(' ') || 'User',
              email: u.email,
              department: u.department,
              designation: u.designation,
              role: u.role,
              status: u.status,
              createdAt: now,
              updatedAt: now,
            },
          },
          { upsert: true }
        );
      } else {
        if (!existingUser.role || existingUser.role !== u.role || !existingUser.employeeId || !existingUser.id) {
          await db.collection('users').updateOne(
            { email: u.email },
            { $set: { role: u.role, employeeId: u.employeeId, id: u.id, updatedAt: now } }
          );
        }
      }
    }
    seedCompleted = true;
  } catch (err) {
    console.warn('User seeding warning:', err);
  }
}

export function getAuthContext(req: NextRequest): AuthContext {
  const cookieSessionToken = req.cookies.get('ems_session')?.value;
  const authHeader = req.headers.get('authorization');
  let headerToken = authHeader ? authHeader.replace(/^Bearer\s+/i, '').trim() : null;

  const sessionToken = cookieSessionToken || headerToken;

  const headerUserId = req.headers.get('x-user-id');
  const headerEmail = req.headers.get('x-user-email');
  const headerRoleRaw = req.headers.get('x-user-role') || req.headers.get('x-role');
  const headerOrgId = req.headers.get('x-organization-id');
  const headerEmpId = req.headers.get('x-employee-id');

  if (headerUserId && headerRoleRaw) {
    const roleUpper = headerRoleRaw.toUpperCase().replace(/[\s_\-\/]+/g, '');
    const normRole: UserRole =
      roleUpper === 'SUPERADMIN'
        ? 'SUPER_ADMIN'
        : roleUpper === 'ADMIN' || roleUpper === 'HR' || roleUpper === 'HRADMIN'
        ? 'ADMIN'
        : roleUpper === 'MANAGER'
        ? 'MANAGER'
        : 'EMPLOYEE';

    return {
      userId: headerUserId,
      email: headerEmail || 'user@organization.com',
      name: req.headers.get('x-user-name') || 'Authenticated User',
      role: normRole,
      organizationId: headerOrgId || 'org-default',
      employeeId: headerEmpId || undefined,
      isAuthenticated: true,
    };
  }

  if (sessionToken) {
    const sessionRegex = /^jwt-(?:session|access)-(.+?)-(org-[^\-]+)-([A-Z_]+)-([^\-]+)-(\d+)$/i;
    const match = sessionToken.match(sessionRegex);

    if (match) {
      const [, uId, orgId, rawRole, empId] = match;
      const roleUpper = rawRole.toUpperCase().replace(/[\s_\-\/]+/g, '');
      const normRole: UserRole =
        roleUpper === 'SUPERADMIN' || roleUpper === 'SUPER_ADMIN'
          ? 'SUPER_ADMIN'
          : roleUpper === 'ADMIN' || roleUpper === 'HR' || roleUpper === 'HRADMIN'
          ? 'ADMIN'
          : roleUpper === 'MANAGER'
          ? 'MANAGER'
          : 'EMPLOYEE';

      const isSuper = normRole === 'SUPER_ADMIN' || uId === 'usr-super-01';
      const isAdmin = normRole === 'ADMIN' || uId === 'usr-admin-01';

      const canonicalUserId = isSuper ? 'usr-super-01' : isAdmin ? 'usr-admin-01' : uId;
      const canonicalEmail = isSuper ? 'superadmin@organization.com' : isAdmin ? 'admin@organization.com' : `${uId}@organization.com`;
      const canonicalName = isSuper ? 'Super Administrator' : isAdmin ? 'Suryabhan Singh Rathore' : 'Authenticated User';
      const canonicalEmpId = isSuper ? 'SUP0001' : isAdmin ? 'EMP9201' : empId;

      return {
        userId: canonicalUserId,
        email: canonicalEmail,
        name: canonicalName,
        role: normRole,
        organizationId: orgId || 'org-default',
        employeeId: canonicalEmpId,
        isAuthenticated: true,
        sessionId: sessionToken,
      };
    }

    const tokenUpper = sessionToken.toUpperCase();
    const detectedRole: UserRole = tokenUpper.includes('SUPER_ADMIN') || tokenUpper.includes('SUPERADMIN')
      ? 'SUPER_ADMIN'
      : tokenUpper.includes('MANAGER')
      ? 'MANAGER'
      : tokenUpper.includes('EMPLOYEE')
      ? 'EMPLOYEE'
      : 'ADMIN';

    const empIdFallback = detectedRole === 'SUPER_ADMIN' ? 'SUP0001' : detectedRole === 'ADMIN' ? 'EMP9201' : detectedRole === 'MANAGER' ? 'MGR1001' : 'EMP1001';
    const emailFallback = detectedRole === 'SUPER_ADMIN' ? 'superadmin@organization.com' : detectedRole === 'ADMIN' ? 'admin@organization.com' : detectedRole === 'MANAGER' ? 'manager@organization.com' : 'employee@organization.com';
    const userIdFallback = detectedRole === 'SUPER_ADMIN' ? 'usr-super-01' : detectedRole === 'ADMIN' ? 'usr-admin-01' : detectedRole === 'MANAGER' ? 'usr-mgr-01' : 'usr-emp-01';
    const nameFallback = detectedRole === 'SUPER_ADMIN' ? 'Super Administrator' : detectedRole === 'ADMIN' ? 'Suryabhan Singh Rathore' : 'Authenticated User';

    return {
      userId: userIdFallback,
      email: emailFallback,
      name: nameFallback,
      role: detectedRole,
      organizationId: 'org-default',
      employeeId: empIdFallback,
      isAuthenticated: true,
      sessionId: sessionToken,
    };
  }

  return {
    userId: '',
    email: '',
    name: 'Unauthenticated Guest',
    role: 'EMPLOYEE',
    organizationId: 'org-default',
    employeeId: undefined,
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
    const normalizedAuthRole = auth.role === ('Super Admin' as any) ? 'SUPER_ADMIN' : auth.role;
    const normalizedRequiredRoles = roles.map((r) =>
      r === ('Super Admin' as any) ? 'SUPER_ADMIN' : r === ('HR' as any) ? 'ADMIN' : r
    );

    if (!normalizedRequiredRoles.includes(normalizedAuthRole)) {
      return {
        isAllowed: false,
        statusCode: 403,
        message: `Forbidden. Action requires ${roles.join(' or ')} permission.`,
      };
    }
  }

  return { isAllowed: true, statusCode: 200, message: 'Authorized' };
}

export { formatRoleLabel } from '@/lib/roleUtils';
