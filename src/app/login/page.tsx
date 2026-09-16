'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { DEMO_ACCOUNTS } from '@/lib/demoConfig';
import {
  Building2,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ShieldCheck,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  Shield,
  KeyRound,
  UserCheck,
  UserPlus,
  HelpCircle,
  Send,
} from 'lucide-react';

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, requestOtp, isAuthenticated, isHydrated, getRoleDashboardRoute } = useAuthStore();

  const [authMode, setAuthMode] = useState<'PASSWORD' | 'OTP'>('PASSWORD');
  const [selectedRole, setSelectedRole] = useState<'SUPER_ADMIN' | 'ADMIN'>('SUPER_ADMIN');
  const [identifier, setIdentifier] = useState('superadmin@organization.com');
  const [password, setPassword] = useState('super123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isHydrated && isAuthenticated) {
      const target = getRoleDashboardRoute();
      router.replace(target);
    }
  }, [isHydrated, isAuthenticated, router, getRoleDashboardRoute]);

  const handleSelectDemoAccount = (roleKey: 'SUPER_ADMIN' | 'ADMIN') => {
    setSelectedRole(roleKey);
    const account = DEMO_ACCOUNTS.find((a) => a.roleKey === roleKey);
    if (account) {
      setIdentifier(account.email);
      setPassword(account.password);
      setErrorMessage(null);
      setSuccessMessage(null);
    }
  };

  const handleSubmitPasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !password) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await login({ identifier, password, rememberMe });

      if (res.requiresTwoFactor && res.twoFactorToken) {
        router.push(`/verify-otp?email=${encodeURIComponent(identifier)}&twoFactorToken=${res.twoFactorToken}`);
        return;
      }

      if (res.success && res.session) {
        const targetDashboard = getRoleDashboardRoute(res.session.user.role);
        router.replace(targetDashboard);
      } else {
        setErrorMessage(res.message || 'Invalid email/employee ID or password.');
        setIsLoading(false);
      }
    } catch {
      setErrorMessage('Sign-in service encountered an error. Please try again.');
      setIsLoading(false);
    }
  };

  const handleRequestOtpLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier) {
      setErrorMessage('Please enter your email address to receive an OTP.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await requestOtp(identifier);
      if (res.success) {
        setSuccessMessage(res.message || 'A 6-digit verification code has been sent to your email.');
        setTimeout(() => {
          router.push(`/verify-otp?email=${encodeURIComponent(identifier.trim().toLowerCase())}`);
        }, 1200);
      } else {
        setErrorMessage(res.message || 'Failed to send OTP verification code.');
        setIsLoading(false);
      }
    } catch {
      setErrorMessage('Failed to request verification code. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-slate-950 p-4 font-sans text-slate-100">
      {/* Dynamic background glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-indigo-900/30 via-slate-950 to-slate-950 pointer-events-none" />

      <div className="relative w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900/90 p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-6">
        {/* Header / Logo */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-lg shadow-blue-500/20">
            <Building2 className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight sm:text-3xl">EMS / HRMS</h1>
          <p className="text-xs text-slate-400 max-w-sm">
            Enterprise Management & Human Resources Operations Center
          </p>
        </div>

        {/* Auth Mode Switcher */}
        <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800">
          <button
            type="button"
            onClick={() => { setAuthMode('PASSWORD'); setErrorMessage(null); setSuccessMessage(null); }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              authMode === 'PASSWORD'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <KeyRound className="h-3.5 w-3.5" /> Password Sign In
          </button>
          <button
            type="button"
            onClick={() => { setAuthMode('OTP'); setErrorMessage(null); setSuccessMessage(null); }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              authMode === 'OTP'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Send className="h-3.5 w-3.5" /> Gmail OTP Sign In
          </button>
        </div>

        {/* Demo Account Selector Buttons */}
        {authMode === 'PASSWORD' && (
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <UserCheck className="h-3.5 w-3.5 text-blue-400" /> Select Demo Role
            </label>
            <div className="grid grid-cols-2 gap-3">
              {DEMO_ACCOUNTS.map((acc) => {
                const isSelected = selectedRole === acc.roleKey;
                return (
                  <button
                    key={acc.roleKey}
                    type="button"
                    onClick={() => handleSelectDemoAccount(acc.roleKey)}
                    className={`flex flex-col text-left p-3.5 rounded-2xl border transition-all duration-200 ${
                      isSelected
                        ? 'border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/10 ring-1 ring-blue-500'
                        : 'border-slate-800 bg-slate-800/50 hover:bg-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-white">{acc.label}</span>
                      <Shield className={`h-4 w-4 ${isSelected ? 'text-blue-400' : 'text-slate-500'}`} />
                    </div>
                    <span className="text-[11px] font-mono text-slate-400 mt-1 truncate">{acc.email}</span>
                    <span className="text-[10px] text-slate-500 mt-0.5 truncate">{acc.description}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="flex items-start gap-2 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-300">
            <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
            <p>{errorMessage}</p>
          </div>
        )}

        {/* Success Alert */}
        {successMessage && (
          <div className="flex items-start gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-300">
            <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
            <p>{successMessage}</p>
          </div>
        )}

        {/* Form */}
        {authMode === 'PASSWORD' ? (
          <form onSubmit={handleSubmitPasswordLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Email Address or Employee ID</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2.5 pl-10 pr-4 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="user@organization.com or EMP1001"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300">Password</label>
                <Link
                  href="/forgot-password"
                  className="text-[11px] font-semibold text-blue-400 hover:text-blue-300 transition"
                >
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2.5 pl-10 pr-10 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-slate-400 hover:text-slate-200">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded-md border-slate-700 bg-slate-950 text-blue-600 focus:ring-blue-500/20"
                />
                <span>Remember me on this device</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3 text-xs font-bold text-white shadow-lg shadow-blue-500/20 hover:from-blue-500 hover:to-indigo-500 transition disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRequestOtpLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Registered Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                <input
                  type="email"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2.5 pl-10 pr-4 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="user@organization.com"
                />
              </div>
              <p className="text-[11px] text-slate-500">
                We will send a cryptographically secure 6-digit OTP to your registered Gmail address.
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3 text-xs font-bold text-white shadow-lg shadow-blue-500/20 hover:from-blue-500 hover:to-indigo-500 transition disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Sending Verification Code...</span>
                </>
              ) : (
                <>
                  <span>Send OTP Code</span>
                  <Send className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* Additional Auth Links */}
        <div className="flex items-center justify-between border-t border-slate-800/80 pt-4 text-xs text-slate-400">
          <Link
            href="/complete-account"
            className="flex items-center gap-1.5 hover:text-white transition font-medium text-blue-400"
          >
            <UserPlus className="h-3.5 w-3.5" /> Have an Invitation? Complete Setup
          </Link>
          <Link
            href="/careers"
            className="flex items-center gap-1.5 hover:text-white transition text-slate-400"
          >
            <HelpCircle className="h-3.5 w-3.5" /> Public Careers
          </Link>
        </div>

        {/* Footer Info */}
        <div className="text-center pt-1">
          <p className="text-[11px] text-slate-500 flex items-center justify-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" /> Authoritative Session & RBAC Enforcement Active
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen w-full items-center justify-center bg-slate-950 font-sans text-white">
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
            <p className="text-xs font-semibold text-slate-400">Loading Sign In Portal...</p>
          </div>
        </div>
      }
    >
      <LoginFormContent />
    </Suspense>
  );
}
