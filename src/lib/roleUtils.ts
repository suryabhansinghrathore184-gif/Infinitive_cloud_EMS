/**
 * Pure client-safe role helper utilities.
 * Do NOT import server-only modules (like mongodb or next/server) here.
 */

export function formatRoleLabel(role?: string): string {
  if (!role) return 'Employee';
  const upper = role.toUpperCase().trim();
  switch (upper) {
    case 'SUPER_ADMIN':
    case 'SUPER ADMIN':
      return 'Super Admin';
    case 'ADMIN':
      return 'Admin';
    case 'HR':
    case 'HR/ADMIN':
      return 'HR';
    case 'MANAGER':
      return 'Manager';
    case 'EMPLOYEE':
    default:
      return 'Employee';
  }
}
