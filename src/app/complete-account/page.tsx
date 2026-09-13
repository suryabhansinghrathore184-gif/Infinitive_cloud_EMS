'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ShieldCheck,
  Mail,
  Lock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Building2,
  UserCheck,
  ArrowRight,
  Eye,
  EyeOff,
} from 'lucide-react';

function CompleteAccountContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const queryEmail = searchParams.get('email') || '';
  const queryRole = searchParams.get('role') || 'EMPLOYEE';
  const queryOrg = searchParams.get('org') || 'EMS / HRMS Workspace';

  const [email, setEmail] = useState(queryEmail);
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (queryEmail) {
      setEmail(queryEmail);
    }
  }, [queryEmail]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email || !email.includes('@')) {
      setErrorMessage('Valid email address is required.');
      return;
    }

    if (!otp || otp.trim().length !== 6) {
      setErrorMessage('Please enter the 6-digit verification code sent to your email.');
      return;
    }

    if (!password || password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please verify your entries.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/v1/auth/complete-invitation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          otp: otp.trim(),
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.message || 'Failed to complete account setup.');
        return;
      }

      setIsComplete(true);
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error during account setup.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 py-12 text-slate-100 font-sans">
        <div className="w-full max-w-md space-y-6 text-center animate-fade-in">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 ring-8 ring-emerald-500/20 shadow-xl">
            <CheckCircle2 className="h-10 w-10" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-white">Account Setup Complete</h1>
            <p className="text-xs text-emerald-400 font-semibold bg-emerald-950/60 py-1.5 px-4 rounded-full inline-block border border-emerald-500/30">
              Your email has been verified and your account is now active.
            </p>
          </div>

          <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
            You can now sign in to your HR workspace using your official email address and newly established password.
          </p>

          <div className="pt-4">
            <Link
              href="/login"
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-700 transition-all"
            >
              <span>Continue to Login</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 py-12 text-slate-100 font-sans">
      <div className="w-full max-w-md space-y-6">
        {/* Branding Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-xl shadow-indigo-600/30 ring-8 ring-indigo-900/30">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">Complete Your Account</h1>
          <p className="text-xs text-slate-400">
            Verify your email OTP & establish your account password
          </p>
        </div>

        {/* Assigned Invitation Details Card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 space-y-2 shadow-lg backdrop-blur-md">
          <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-800">
            <div className="flex items-center gap-1.5 font-medium">
              <Building2 className="h-3.5 w-3.5 text-indigo-400" />
              <span>{queryOrg}</span>
            </div>
            <span className="rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-[10px] font-bold text-indigo-400 border border-indigo-500/20 uppercase tracking-wider">
              Role: {queryRole}
            </span>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <Mail className="h-4 w-4 text-slate-400 shrink-0" />
            <span className="text-xs font-semibold text-white font-mono truncate">{email || 'your-email@domain.com'}</span>
          </div>
        </div>

        {/* Alert Messages */}
        {errorMessage && (
          <div className="flex items-center gap-3 rounded-xl border border-rose-500/30 bg-rose-950/40 p-3.5 text-xs font-semibold text-rose-300 shadow-md">
            <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-950/40 p-3.5 text-xs font-semibold text-emerald-300 shadow-md">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4 shadow-xl">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Official Email Address *</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@organization.com"
              className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              6-Digit Verification OTP *
            </label>
            <input
              type="text"
              maxLength={6}
              required
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              placeholder="123456"
              className="w-full text-center tracking-widest font-mono text-lg rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-indigo-300 focus:border-indigo-500 focus:outline-none font-bold"
            />
            <p className="mt-1 text-[11px] text-slate-500">
              Enter the 6-digit code sent to your Gmail inbox.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Create Password *</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 pr-10 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none font-medium"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Confirm Password *</label>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none font-medium"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50 mt-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Activating Account...</span>
              </>
            ) : (
              <>
                <span>Complete Account & Activate</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        <div className="text-center text-xs text-slate-500">
          Already verified?{' '}
          <Link href="/login" className="font-bold text-indigo-400 hover:underline">
            Sign In Here
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function CompleteAccountPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    }>
      <CompleteAccountContent />
    </Suspense>
  );
}
