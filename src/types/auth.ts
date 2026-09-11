// TypeScript interfaces for EMS Authentication & Access Control

export type UserRole = 'Super Admin' | 'HR/Admin' | 'Manager' | 'Employee';

export interface AuthUser {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  avatar: string;
  role: UserRole;
  department?: string;
  designation?: string;
  isTwoFactorEnabled?: boolean;
}

export interface AuthSession {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // Unix timestamp in ms
}

export interface LoginPayload {
  identifier: string; // Email or Employee ID
  password: string;
  rememberMe?: boolean;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  requiresTwoFactor?: boolean;
  twoFactorToken?: string;
  session?: AuthSession;
}

export interface OtpVerifyPayload {
  twoFactorToken: string;
  otpCode: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface AuthActivityLog {
  id: string;
  userId?: string;
  userEmail?: string;
  action: 'LOGIN_SUCCESS' | 'LOGIN_FAILED' | 'LOGOUT' | 'OTP_VERIFIED' | 'PASSWORD_RESET_REQUESTED' | 'PASSWORD_RESET_SUCCESS' | 'SESSION_EXPIRED' | 'ACCOUNT_LOCKED';
  details: string;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
}
