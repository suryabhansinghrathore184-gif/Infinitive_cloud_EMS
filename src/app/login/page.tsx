'use client';

import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isAuthenticated, isLockedOut, lockoutUntil, getRoleDashboardRoute } = useAuthStore();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loggedOutToast, setLoggedOutToast] = useState(false);

  useEffect(() => {
    if (searchParams.get('logged_out') === 'true') {
      setLoggedOutToast(true);
      setTimeout(() => setLoggedOutToast(false), 4000);
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

  const handleSubmit = async (e: React.FormEvent) => {
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
        setErrorMessage(response.message || 'Authentication failed. Please try again.');
        return;
      }

      if (response.requiresTwoFactor) {
        router.push('/verify-otp');
        return;
      }

      // Successful login redirect
      const redirectUrl = searchParams.get('redirect');
      if (redirectUrl && redirectUrl.startsWith('/')) {
        router.replace(redirectUrl);
      } else {
        router.replace(getRoleDashboardRoute(response.session?.user.role));
      }
    } catch {
      setIsLoading(false);
      setErrorMessage('An unexpected error occurred. Please try again.');
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
        <div className="fixed right-6 top-6 z-50 flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-xs font-semibold text-white shadow-2xl border border-emerald-500/30 animate-fade-in">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>You have been logged out successfully.</span>
        </div>
      )}

      <div className="relative w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/90 p-8 shadow-2xl backdrop-blur-xl">
        {/* Logo & Header */}
        <div className="flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/30">
            <Building2 className="h-7 w-7" />
          </div>
          <h1 className="mt-4 text-xl font-bold tracking-tight text-white">EMS / HRMS Portal</h1>
          <p className="mt-1 text-xs text-slate-400">Infinitive Cloud Enterprise Management System</p>
        </div>

        <div className="mt-6 border-t border-slate-800/80 pt-6">
          <h2 className="text-lg font-bold text-white">Welcome Back</h2>
          <p className="text-xs text-slate-400">Sign in to access your HR workspace & dashboard</p>
        </div>

        {/* Lockout Alert */}
        {isLockedOut ? (
          <div className="mt-4 flex items-start gap-3 rounded-2xl border border-rose-500/30 bg-rose-950/40 p-4 text-xs text-rose-200">
            <ShieldAlert className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-rose-100">Account Temporarily Locked</p>
              <p className="mt-1 text-rose-300/80 leading-relaxed">
                Too many invalid password attempts. For security reasons, login is disabled for{' '}
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

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-300">Email or Employee ID *</label>
            <div className="relative mt-1.5">
              <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
              <input
                type="text"
                required
                disabled={isLockedOut || isLoading}
                placeholder="admin@organization.com or EMP9201"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950/80 py-2.5 pl-10 pr-4 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none disabled:opacity-50"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300">Password *</label>
              <Link
                href="/forgot-password"
                className="text-xs font-semibold text-blue-400 hover:text-blue-300 hover:underline"
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
                className="w-full rounded-xl border border-slate-800 bg-slate-950/80 py-2.5 pl-10 pr-10 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none disabled:opacity-50"
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
                className="h-4 w-4 rounded border-slate-800 bg-slate-950 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <span>Remember me for 30 days</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={isLockedOut || isLoading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-xs font-bold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500 transition-all disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <span>Sign In to Dashboard</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        {/* Demo Credentials Helper Box */}
        <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950/60 p-3.5 text-[11px] text-slate-400 space-y-1.5">
          <p className="font-bold text-slate-200 uppercase tracking-wider text-[10px]">Demo Role Credentials:</p>
          <div className="grid grid-cols-2 gap-1 text-[10px]">
            <p>
              <strong className="text-blue-400">Admin:</strong> admin@organization.com / admin123
            </p>
            <p>
              <strong className="text-emerald-400">Super Admin:</strong> superadmin@organization.com / super123
            </p>
            <p>
              <strong className="text-purple-400">Manager:</strong> manager@organization.com / manager123
            </p>
            <p>
              <strong className="text-amber-400">Employee:</strong> employee@organization.com / emp123
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
