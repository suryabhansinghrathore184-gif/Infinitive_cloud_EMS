'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import {
  Building2,
  Lock,
  Mail,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  ArrowRight,
  RefreshCw,
  ShieldCheck,
  KeyRound,
  Send,
} from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, requestOtp, isAuthenticated, isLockedOut, lockoutUntil, getRoleDashboardRoute } = useAuthStore();

  const [activeTab, setActiveTab] = useState<'otp' | 'password'>('otp');
  const [otpEmail, setOtpEmail] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loggedOutToast, setLoggedOutToast] = useState(false);
  const [resetSuccessToast, setResetSuccessToast] = useState(false);

  useEffect(() => {
    if (searchParams.get('logged_out') === 'true') {
      setLoggedOutToast(true);
      setTimeout(() => setLoggedOutToast(false), 4000);
    }
    if (searchParams.get('reset_success') === 'true') {
      setResetSuccessToast(true);
      setTimeout(() => setResetSuccessToast(false), 5000);
    }
  }, [searchParams]);

  useEffect(() => {
    if (isAuthenticated) {
      const redirectUrl = searchParams.get('redirect');
      if (redirectUrl && redirectUrl.startsWith('/')) {
        router.replace(redirectUrl);
      } else {
        router.replace(getRoleDashboardRoute());
      }
    }
  }, [isAuthenticated, router, searchParams, getRoleDashboardRoute]);

  const handleOtpRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanEmail = otpEmail.trim();
    if (!cleanEmail) {
      setErrorMessage('Please enter your registered email address.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await requestOtp(cleanEmail);
      setIsLoading(false);

      if (!res.success) {
        setErrorMessage(res.message || 'Failed to send verification code.');
        return;
      }

      router.push(`/verify-otp?email=${encodeURIComponent(cleanEmail)}`);
    } catch {
      setIsLoading(false);
      setErrorMessage('An unexpected error occurred while requesting OTP.');
    }
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!identifier.trim()) {
      setErrorMessage('Please enter your Email or Employee ID.');
      return;
    }

    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await login({
        identifier: identifier.trim(),
        password,
        rememberMe,
      });

      setIsLoading(false);

      if (!response.success) {
        setErrorMessage(response.message || 'Authentication failed. Please check your credentials.');
        return;
      }

      if (response.requiresTwoFactor) {
        router.push('/verify-otp');
        return;
      }

      const redirectUrl = searchParams.get('redirect');
      if (redirectUrl && redirectUrl.startsWith('/')) {
        router.replace(redirectUrl);
      } else {
        router.replace(getRoleDashboardRoute(response.session?.user.role));
      }
    } catch {
      setIsLoading(false);
      setErrorMessage('An unexpected error occurred. Please try again later.');
    }
  };

  const getLockoutMinutes = () => {
    if (!lockoutUntil) return 15;
    const diff = lockoutUntil - Date.now();
    return Math.max(1, Math.ceil(diff / (60 * 1000)));
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-slate-950 p-4 font-sans text-slate-100">
      {/* Background Glow Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-blue-900/30 via-slate-950 to-slate-950 pointer-events-none" />

      {/* Logged Out Toast */}
      {loggedOutToast && (
        <div className="fixed right-6 top-6 z-50 flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-xs font-semibold text-white shadow-2xl border border-emerald-500/30">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>You have been logged out successfully.</span>
        </div>
      )}

      {/* Password Reset Toast */}
      {resetSuccessToast && (
        <div className="fixed right-6 top-6 z-50 flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-xs font-semibold text-white shadow-2xl border border-emerald-500/30">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>Password reset successful! Please sign in with your new password.</span>
        </div>
      )}

      <div className="relative w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/90 p-8 shadow-2xl backdrop-blur-xl">
        {/* Logo & Header */}
        <div className="flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-sky-500 text-white shadow-lg shadow-indigo-600/30">
            <Building2 className="h-7 w-7" />
          </div>
          <h1 className="mt-4 text-xl font-extrabold tracking-tight text-white">EMS / HRMS Enterprise</h1>
          <p className="mt-1 text-xs text-slate-400 font-medium">Infinitive Cloud Management System</p>
        </div>

        {/* Tab Switcher */}
        <div className="mt-6 flex rounded-xl bg-slate-950/80 p-1 border border-slate-800/80">
          <button
            type="button"
            onClick={() => {
              setActiveTab('otp');
              setErrorMessage(null);
            }}
            className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-bold transition-all ${
              activeTab === 'otp'
                ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <KeyRound className="h-3.5 w-3.5" />
            <span>Email OTP Login</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('password');
              setErrorMessage(null);
            }}
            className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-bold transition-all ${
              activeTab === 'password'
                ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Lock className="h-3.5 w-3.5" />
            <span>Password Login</span>
          </button>
        </div>

        {/* Lockout Alert */}
        {isLockedOut ? (
          <div className="mt-4 flex items-start gap-3 rounded-2xl border border-rose-500/30 bg-rose-950/40 p-4 text-xs text-rose-200">
            <ShieldAlert className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-rose-100">Account Temporarily Locked</p>
              <p className="mt-1 text-rose-300/80 leading-relaxed">
                Too many invalid login attempts. For security reasons, login is temporarily disabled for{' '}
                <strong className="text-white font-mono">{getLockoutMinutes()} minutes</strong>.
              </p>
            </div>
          </div>
        ) : (
          /* Error Message Alert */
          errorMessage && (
            <div className="mt-4 flex items-center gap-2.5 rounded-2xl border border-rose-500/30 bg-rose-950/40 p-3.5 text-xs font-semibold text-rose-300">
              <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )
        )}

        {/* TAB 1: EMAIL OTP LOGIN */}
        {activeTab === 'otp' && (
          <form onSubmit={handleOtpRequest} className="mt-5 space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-300">Registered Email Address *</label>
              <div className="relative mt-1.5">
                <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                <input
                  type="email"
                  required
                  disabled={isLockedOut || isLoading}
                  placeholder="user@organization.com"
                  value={otpEmail}
                  onChange={(e) => setOtpEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/80 py-2.5 pl-10 pr-4 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-hidden disabled:opacity-50"
                />
              </div>
              <p className="mt-1.5 text-[11px] text-slate-400">
                We will send a 6-digit verification code to your Gmail inbox via Gmail SMTP.
              </p>
            </div>

            <button
              type="submit"
              disabled={isLockedOut || isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 py-3 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 hover:from-sky-600 hover:to-indigo-700 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Sending Verification Code...</span>
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <span>Send Verification Code</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* TAB 2: PASSWORD LOGIN */}
        {activeTab === 'password' && (
          <form onSubmit={handlePasswordLogin} className="mt-5 space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-300">Email or Employee ID *</label>
              <div className="relative mt-1.5">
                <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  required
                  disabled={isLockedOut || isLoading}
                  placeholder="user@organization.com or EMP1001"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/80 py-2.5 pl-10 pr-4 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-hidden disabled:opacity-50"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300">Password *</label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 hover:underline"
                >
                  Forgot Password?
                </Link>
              </div>
              <div className="relative mt-1.5">
                <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  disabled={isLockedOut || isLoading}
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/80 py-2.5 pl-10 pr-10 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-hidden disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-800 bg-slate-950 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <span>Remember session</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isLockedOut || isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 py-3 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 hover:from-sky-600 hover:to-indigo-700 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Authenticating Credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* Have an Invitation Section */}
        <div className="mt-5 border-t border-slate-800/80 pt-4 text-center space-y-2">
          <p className="text-xs font-semibold text-slate-300">Have an invitation?</p>
          <Link
            href="/complete-account"
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-600/25 hover:shadow-indigo-600/40 transition-all cursor-pointer ring-2 ring-indigo-500/30 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            <ShieldCheck className="h-4 w-4 text-indigo-200" />
            <span>Complete Account Setup</span>
          </Link>
        </div>

        <div className="mt-4 flex items-center justify-center gap-1.5 font-mono text-[11px] text-slate-500 border-t border-slate-800/80 pt-4">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
          <span>Encrypted TLS 1.3 & Server Session Protected</span>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen w-full items-center justify-center bg-slate-950 text-white">
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
            <p className="text-xs font-semibold text-slate-400">Loading Portal...</p>
          </div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
