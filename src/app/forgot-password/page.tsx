'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { KeyRound, Mail, ArrowLeft, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { forgotPassword } = useAuthStore();

  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await forgotPassword(email.trim());
      setIsLoading(false);
      if (res.success) {
        setIsSuccess(true);
      } else {
        setErrorMessage(res.message);
      }
    } catch {
      setIsLoading(false);
      setErrorMessage('An error occurred. Please try again.');
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-slate-950 p-4 font-sans text-slate-100">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-blue-900/30 via-slate-950 to-slate-950 pointer-events-none" />

      <div className="relative w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/90 p-8 shadow-2xl backdrop-blur-xl">
        <Link
          href="/login"
          className="flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Login</span>
        </Link>

        {isSuccess ? (
          <div className="mt-6 flex flex-col items-center text-center space-y-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/30">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <h2 className="text-xl font-bold text-white">Reset Link Sent!</h2>
            <p className="text-xs text-slate-400 leading-relaxed max-w-xs">
              If an active account exists for <strong className="text-white">{email}</strong>, we have dispatched a password reset link to your inbox.
            </p>
            <div className="pt-4 w-full">
              <Link
                href="/reset-password?token=demo-reset-token"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-xs font-bold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500 transition-all"
              >
                <span>Proceed to Reset Password Page (Demo)</span>
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="mt-6 flex flex-col items-center text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/30">
                <KeyRound className="h-7 w-7" />
              </div>
              <h2 className="mt-4 text-xl font-bold tracking-tight text-white">Forgot Your Password?</h2>
              <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                Enter your work email address below and we will send you instructions to reset your password.
              </p>
            </div>

            {errorMessage && (
              <div className="mt-5 flex items-center gap-2.5 rounded-2xl border border-rose-500/30 bg-rose-950/40 p-3.5 text-xs font-semibold text-rose-300">
                <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300">Work Email Address *</label>
                <div className="relative mt-1.5">
                  <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                  <input
                    type="email"
                    required
                    disabled={isLoading}
                    placeholder="user@organization.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950/80 py-2.5 pl-10 pr-4 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none disabled:opacity-50"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || !email}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-xs font-bold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500 transition-all disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Dispatching Link...</span>
                  </>
                ) : (
                  <span>Send Password Reset Link</span>
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
