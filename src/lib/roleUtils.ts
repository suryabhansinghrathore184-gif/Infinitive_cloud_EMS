export type CanonicalRole = 'SUPER_ADMIN' | 'ADMIN' | 'HR' | 'MANAGER' | 'EMPLOYEE';

export function normalizeRole(role?: string): CanonicalRole {
  if (!role) return 'EMPLOYEE';
  const clean = role.trim().toUpperCase().replace(/[\s_\-\/]+/g, '');
  if (clean === 'SUPERADMIN' || clean === 'SUPERADMINISTRATOR') return 'SUPER_ADMIN';
  if (clean === 'ADMIN' || clean === 'ADMINISTRATOR' || clean === 'HRADMIN' || clean === 'HRMANAGER') return 'ADMIN';
  if (clean === 'HR' || clean === 'HUMANRESOURCES') return 'HR';
  if (clean === 'MANAGER' || clean === 'MGR') return 'MANAGER';
  if (clean === 'EMPLOYEE' || clean === 'EMP') return 'EMPLOYEE';
  return 'EMPLOYEE';
}

export function formatRoleLabel(role?: string): string {
  const norm = normalizeRole(role);
  switch (norm) {
    case 'SUPER_ADMIN':
      return 'Super Admin';
    case 'ADMIN':
      return 'Admin';
    case 'HR':
      return 'HR';
    case 'MANAGER':
      return 'Manager';
    case 'EMPLOYEE':
    default:
      return 'Employee';
  }
}
