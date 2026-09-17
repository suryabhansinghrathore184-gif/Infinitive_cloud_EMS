export interface DemoAccount {
  roleKey: 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
  label: string;
  email: string;
  password: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
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
  {
    roleKey: 'MANAGER',
    label: 'Manager',
    email: 'manager@organization.com',
    password: 'manager123',
    role: 'MANAGER',
    id: 'usr-mgr-01',
    employeeId: 'MGR1001',
    name: 'Vikramaditya Sharma',
    targetDashboard: '/manager/dashboard',
    description: 'Team directory, attendance, leave approvals, and performance reviews',
  },
  {
    roleKey: 'EMPLOYEE',
    label: 'Employee',
    email: 'employee@organization.com',
    password: 'emp123',
    role: 'EMPLOYEE',
    id: 'usr-emp-01',
    employeeId: 'EMP1001',
    name: 'Aarav Sharma',
    targetDashboard: '/employee/dashboard',
    description: 'Employee self-service, personal attendance, leave, payslips, and helpdesk',
  },
];
