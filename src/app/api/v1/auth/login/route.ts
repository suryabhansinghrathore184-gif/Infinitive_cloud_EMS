import { NextResponse } from 'next/server';
import { AuthUser } from '@/types/auth';

// Demo Auth Directory for development & testing
const DEMO_USERS: (AuthUser & { passwordHash: string })[] = [
  {
    id: 'usr-admin-01',
    employeeId: 'EMP9201',
    name: 'Suryabhan Singh Rathore',
    email: 'admin@organization.com',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80',
    role: 'HR/Admin',
    department: 'Human Resources',
    designation: 'HR Administrator',
    passwordHash: 'admin123',
  },
  {
    id: 'usr-super-01',
    employeeId: 'SUP0001',
    name: 'Super Administrator',
    email: 'superadmin@organization.com',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    role: 'Super Admin',
    department: 'Executive Board',
    designation: 'Platform Super Admin',
    passwordHash: 'super123',
  },
  {
    id: 'usr-mgr-01',
    employeeId: 'MGR1001',
    name: 'Vikramaditya Sharma',
    email: 'manager@organization.com',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
    role: 'Manager',
    department: 'Engineering & IT',
    designation: 'Engineering Manager',
    passwordHash: 'manager123',
  },
  {
    id: 'usr-emp-01',
    employeeId: 'EMP1001',
    name: 'Aarav Sharma',
    email: 'employee@organization.com',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
    role: 'Employee',
    department: 'Engineering & IT',
    designation: 'Senior Software Engineer',
    passwordHash: 'emp123',
  },
  {
    id: 'usr-2fa-01',
    employeeId: 'EMP2FA',
    name: 'Ananya Roy (2FA Enabled)',
    email: '2fa@organization.com',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
    role: 'HR/Admin',
    department: 'Human Resources',
    designation: 'HR Lead',
    isTwoFactorEnabled: true,
    passwordHash: '2fa123',
  },
];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { identifier, password } = body;

    if (!identifier || !password) {
      return NextResponse.json(
        { success: false, message: 'Email/Employee ID and password are required.' },
        { status: 400 }
      );
    }

    const cleanIdentifier = identifier.trim().toLowerCase();
    const user = DEMO_USERS.find(
      (u) =>
        u.email.toLowerCase() === cleanIdentifier ||
        u.employeeId.toLowerCase() === cleanIdentifier
    );

    if (!user || user.passwordHash !== password) {
      return NextResponse.json(
        { success: false, message: 'Invalid email/employee ID or password.' },
        { status: 401 }
      );
    }

    // Check if 2FA is required
    if (user.isTwoFactorEnabled) {
      const twoFactorToken = `2fa-tok-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
      return NextResponse.json({
        success: true,
        message: 'Password verified. 2FA OTP sent to your registered email/phone.',
        requiresTwoFactor: true,
        twoFactorToken,
      });
    }

    // Generate JWT access & refresh tokens
    const now = Date.now();
    const expiresAt = now + 15 * 60 * 1000; // 15 minutes
    const accessToken = `jwt-access-${user.id}-${now}`;
    const refreshToken = `jwt-refresh-${user.id}-${now}`;

    const { passwordHash, ...userData } = user;

    return NextResponse.json({
      success: true,
      message: 'Login successful. Redirecting to your dashboard...',
      session: {
        user: userData,
        accessToken,
        refreshToken,
        expiresAt,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'An error occurred during authentication.' },
      { status: 500 }
    );
  }
}
