export interface DemoAccount {
  roleKey: 'SUPER_ADMIN' | 'ADMIN';
  label: string;
  email: string;
  password: string;
  role: 'SUPER_ADMIN' | 'ADMIN';
  id: string;
  employeeId: string;
  name: string;
  targetDashboard: string;
  description: string;
}

export const IS_DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE !== 'false';

export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    roleKey: 'SUPER_ADMIN',
    label: 'Super Admin',
    email: 'superadmin@organization.com',
    password: 'super123',
    role: 'SUPER_ADMIN',
    id: 'usr-super-01',
    employeeId: 'SUP0001',
    name: 'Super Administrator',
    targetDashboard: '/super-admin/dashboard',
    description: 'Full system control, platform security, and tenant management',
  },
  {
    roleKey: 'ADMIN',
    label: 'HR / Admin',
    email: 'admin@organization.com',
    password: 'admin123',
    role: 'ADMIN',
    id: 'usr-admin-01',
    employeeId: 'EMP9201',
    name: 'Suryabhan Singh Rathore',
    targetDashboard: '/admin/dashboard',
    description: 'HR management, employee directory, payroll, and department admin',
  },
];
