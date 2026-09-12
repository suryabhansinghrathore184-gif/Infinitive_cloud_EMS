'use client';

import { useState, useEffect } from 'react';
import {
  AuthUser,
  AuthSession,
  LoginPayload,
  LoginResponse,
  OtpVerifyPayload,
  ForgotPasswordPayload,
  ResetPasswordPayload,
  AuthActivityLog,
} from '@/types/auth';

const AUTH_STORAGE_KEY = 'ems_hrms_auth_state_v1';
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

export interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  loginAttempts: number;
  isLockedOut: boolean;
  lockoutUntil: number | null;
  twoFactorToken: string | null;
  authActivityLogs: AuthActivityLog[];
}

const initialAuthState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  loginAttempts: 0,
  isLockedOut: false,
  lockoutUntil: null,
  twoFactorToken: null,
  authActivityLogs: [],
};

export function useAuthStore() {
  const [state, setState] = useState<AuthState>(initialAuthState);
  const [isHydrated, setIsHydrated] = useState(false);

  // Hydrate from localStorage on client side
  useEffect(() => {
    try {
      const saved = localStorage.getItem(AUTH_STORAGE_KEY);
      if (saved) {
        const parsed: AuthState = JSON.parse(saved);
        // Check lockout status on hydration
        if (parsed.isLockedOut && parsed.lockoutUntil && Date.now() > parsed.lockoutUntil) {
          parsed.isLockedOut = false;
          parsed.lockoutUntil = null;
          parsed.loginAttempts = 0;
        }
        setState(parsed);
      }
    } catch {
      // Fallback
    } finally {
      setIsHydrated(true);
    }
  }, []);

  // Save state to localStorage
  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(state));
    }
  }, [state, isHydrated]);

  const recordActivity = (
    action: AuthActivityLog['action'],
    details: string,
    userEmail?: string
  ) => {
    const log: AuthActivityLog = {
      id: `act-auth-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      userEmail: userEmail || state.user?.email || 'Guest',
      userId: state.user?.id,
      action,
      details,
      ipAddress: '127.0.0.1 (Client)',
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'Server',
      timestamp: new Date().toISOString(),
    };

    setState((prev) => ({
      ...prev,
      authActivityLogs: [log, ...(prev.authActivityLogs || []).slice(0, 49)],
    }));
  };

  const login = async (payload: LoginPayload): Promise<LoginResponse> => {
    // Check account lockout
    if (state.isLockedOut) {
      if (state.lockoutUntil && Date.now() < state.lockoutUntil) {
        const minsLeft = Math.ceil((state.lockoutUntil - Date.now()) / (60 * 1000));
        return {
          success: false,
          message: `Account is temporarily locked due to repeated failed login attempts. Please try again in ${minsLeft} minute(s).`,
        };
      } else {
        // Reset lockout
        setState((prev) => ({ ...prev, isLockedOut: false, lockoutUntil: null, loginAttempts: 0 }));
      }
    }

    try {
      const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data: LoginResponse = await response.json();

      if (!response.ok || !data.success) {
        const newAttempts = state.loginAttempts + 1;
        let isLocked = false;
        let lockUntil: number | null = null;

        if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
          isLocked = true;
          lockUntil = Date.now() + LOCKOUT_DURATION_MS;
          recordActivity('ACCOUNT_LOCKED', `Account locked after ${MAX_LOGIN_ATTEMPTS} failed attempts`, payload.identifier);
        } else {
          recordActivity('LOGIN_FAILED', `Failed login attempt for ${payload.identifier}`, payload.identifier);
        }

        setState((prev) => ({
          ...prev,
          loginAttempts: newAttempts,
          isLockedOut: isLocked,
          lockoutUntil: lockUntil,
        }));

        return data;
      }

      // Check if 2FA is required
      if (data.requiresTwoFactor && data.twoFactorToken) {
        setState((prev) => ({
          ...prev,
          twoFactorToken: data.twoFactorToken || null,
        }));
        return data;
      }

      // Successful login
      if (data.session) {
        setState((prev) => ({
          ...prev,
          user: data.session!.user,
          accessToken: data.session!.accessToken,
          refreshToken: data.session!.refreshToken,
          isAuthenticated: true,
          loginAttempts: 0,
          isLockedOut: false,
          lockoutUntil: null,
          twoFactorToken: null,
        }));

        recordActivity('LOGIN_SUCCESS', `Successfully logged in as ${data.session.user.role}`, data.session.user.email);
      }

      return data;
    } catch {
      recordActivity('LOGIN_FAILED', `Network error during login for ${payload.identifier}`, payload.identifier);
      return { success: false, message: 'Network error. Please check your connection and try again.' };
    }
  };

  const verifyOtp = async (otpCode: string): Promise<LoginResponse> => {
    try {
      const response = await fetch('/api/v1/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ twoFactorToken: state.twoFactorToken, otpCode }),
      });

      const data: LoginResponse = await response.json();

      if (!response.ok || !data.success) {
        recordActivity('LOGIN_FAILED', `Invalid 2FA OTP attempt: ${otpCode}`);
        return data;
      }

      if (data.session) {
        setState((prev) => ({
          ...prev,
          user: data.session!.user,
          accessToken: data.session!.accessToken,
          refreshToken: data.session!.refreshToken,
          isAuthenticated: true,
          loginAttempts: 0,
          isLockedOut: false,
          lockoutUntil: null,
          twoFactorToken: null,
        }));

        recordActivity('OTP_VERIFIED', '2FA OTP verified successfully', data.session.user.email);
      }

      return data;
    } catch {
      return { success: false, message: 'Network error during OTP verification.' };
    }
  };

  const resendOtp = async (): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await fetch('/api/v1/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ twoFactorToken: state.twoFactorToken }),
      });
      const data = await response.json();
      if (data.success && data.twoFactorToken) {
        setState((prev) => ({ ...prev, twoFactorToken: data.twoFactorToken }));
      }
      return data;
    } catch {
      return { success: false, message: 'Failed to resend OTP.' };
    }
  };

  const logout = async (): Promise<void> => {
    try {
      if (state.accessToken) {
        await fetch('/api/v1/auth/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${state.accessToken}`,
          },
        });
      }
    } catch {
      // Ignore network errors during logout
    } finally {
      recordActivity('LOGOUT', 'User logged out and session cleared', state.user?.email);
      setState({
        ...initialAuthState,
        authActivityLogs: state.authActivityLogs, // Retain logs for audit visibility
      });
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  };

  const forgotPassword = async (email: string): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await fetch('/api/v1/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      recordActivity('PASSWORD_RESET_REQUESTED', `Password reset link requested for ${email}`, email);
      return data;
    } catch {
      return { success: false, message: 'Network error processing request.' };
    }
  };

  const resetPassword = async (payload: ResetPasswordPayload): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await fetch('/api/v1/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (data.success) {
        recordActivity('PASSWORD_RESET_SUCCESS', 'Password reset completed');
      }
      return data;
    } catch {
      return { success: false, message: 'Network error resetting password.' };
    }
  };

  const getRoleDashboardRoute = (role?: AuthUser['role']): string => {
    const userRole = role || state.user?.role;
    switch (userRole) {
      case 'Super Admin':
        return '/admin/dashboard';
      case 'HR/Admin':
        return '/admin/dashboard';
      case 'Manager':
        return '/manager/dashboard';
      case 'Employee':
        return '/employee/dashboard';
      default:
        return '/login';
    }
  };

  const updateUserAvatar = (avatarUrl: string) => {
    setState((prev) => {
      if (!prev.user) return prev;
      return {
        ...prev,
        user: {
          ...prev.user,
          avatar: avatarUrl,
        },
      };
    });
  };

  return {
    state,
    isHydrated,
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    isLockedOut: state.isLockedOut,
    loginAttempts: state.loginAttempts,
    lockoutUntil: state.lockoutUntil,
    authActivityLogs: state.authActivityLogs || [],
    login,
    verifyOtp,
    resendOtp,
    logout,
    forgotPassword,
    resetPassword,
    getRoleDashboardRoute,
    updateUserAvatar,
  };
}
