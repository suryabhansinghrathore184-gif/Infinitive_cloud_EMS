// API Client & Service Wrapper for Authentication Endpoints

import {
  LoginPayload,
  LoginResponse,
  OtpVerifyPayload,
  ForgotPasswordPayload,
  ResetPasswordPayload,
  AuthSession,
} from '@/types/auth';

export class AuthService {
  private static BASE_URL = '/api/v1/auth';

  public static async login(credentials: LoginPayload): Promise<LoginResponse> {
    const res = await fetch(`${this.BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    return res.json();
  }

  public static async verifyOtp(payload: OtpVerifyPayload): Promise<LoginResponse> {
    const res = await fetch(`${this.BASE_URL}/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  }

  public static async resendOtp(twoFactorToken: string): Promise<{ success: boolean; message: string; twoFactorToken?: string }> {
    const res = await fetch(`${this.BASE_URL}/resend-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ twoFactorToken }),
    });
    return res.json();
  }

  public static async refreshToken(refreshToken: string): Promise<{ success: boolean; accessToken?: string; expiresAt?: number; message?: string }> {
    const res = await fetch(`${this.BASE_URL}/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    return res.json();
  }

  public static async logout(token?: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${this.BASE_URL}/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    return res.json();
  }

  public static async forgotPassword(email: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${this.BASE_URL}/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    return res.json();
  }

  public static async resetPassword(payload: ResetPasswordPayload): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${this.BASE_URL}/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  }

  public static async getCurrentUser(token: string): Promise<{ success: boolean; user?: any; message?: string }> {
    const res = await fetch(`${this.BASE_URL}/me`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  }
}
