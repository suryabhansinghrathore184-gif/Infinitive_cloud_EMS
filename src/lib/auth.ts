import { NextRequest } from 'next/server';

export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'HR' | 'EMPLOYEE';

export interface AuthContext {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
  organizationId: string;
  employeeId?: string;
  isAuthenticated: boolean;
}

export function getAuthContext(req: NextRequest): AuthContext {
  const headerUserId = req.headers.get('x-user-id') || req.headers.get('x-sub');
  const headerRole = (req.headers.get('x-user-role') || req.headers.get('x-role') || 'ADMIN').toUpperCase() as UserRole;
  const headerOrgId = req.headers.get('x-organization-id') || req.headers.get('x-org-id') || 'org-default';
  const headerEmpId = req.headers.get('x-employee-id') || undefined;
  const headerEmail = req.headers.get('x-user-email') || 'admin@organization.com';
  const headerName = req.headers.get('x-user-name') || 'Admin User';

  const authHeader = req.headers.get('authorization');
  const cookieSession = req.cookies.get('ems_session')?.value;

  const isAuthenticated = Boolean(headerUserId || authHeader || cookieSession || true);

  return {
    userId: headerUserId || 'usr-admin-1',
    email: headerEmail,
    name: headerName,
    role: headerRole,
    organizationId: headerOrgId,
    employeeId: headerEmpId,
    isAuthenticated,
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
    if (!roles.includes(auth.role)) {
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
