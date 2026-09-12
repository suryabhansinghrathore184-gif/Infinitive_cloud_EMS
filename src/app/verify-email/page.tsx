'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Mail, CheckCircle2, AlertCircle, RefreshCw, ArrowRight } from 'lucide-react';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [isLoading, setIsLoading] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      setIsSuccess(false);
      setMessage('Missing verification token in link. Please check your email or request a new verification link.');
      return;
    }

    const verifyToken = async () => {
      try {
        const res = await fetch('/api/v1/auth/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });
        const data = await res.json();
        setIsLoading(false);
        if (res.ok && data.success) {
          setIsSuccess(true);
          setMessage(data.message || 'Your email address has been verified successfully.');
        } else {
          setIsSuccess(false);
          setMessage(data.message || 'Email verification failed or link has expired.');
        }
      } catch {
        setIsLoading(false);
        setIsSuccess(false);
        setMessage('Network error verifying email address.');
      }
    };

    verifyToken();
  }, [token]);

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-slate-950 p-4 font-sans text-slate-100">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-blue-900/30 via-slate-950 to-slate-950 pointer-events-none" />

      <div className="relative w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/90 p-8 shadow-2xl backdrop-blur-xl text-center space-y-4">
        {isLoading ? (
          <div className="py-8 flex flex-col items-center gap-3">
            <RefreshCw className="h-10 w-10 animate-spin text-indigo-500" />
            <h2 className="text-lg font-bold text-white">Verifying Email Address...</h2>
            <p className="text-xs text-slate-400">Validating your security token with server</p>
          </div>
        ) : isSuccess ? (
          <div className="py-4 space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/30">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <h2 className="text-xl font-bold text-white">Email Verified!</h2>
            <p className="text-xs text-slate-300 leading-relaxed">{message}</p>
            <div className="pt-2">
              <Link
                href="/login"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-indigo-600 py-3 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 hover:from-amber-600 hover:to-indigo-700"
              >
                <span>Proceed to Sign In</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="py-4 space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-600 text-white shadow-lg shadow-rose-600/30">
              <AlertCircle className="h-7 w-7" />
            </div>
            <h2 className="text-xl font-bold text-white">Verification Failed</h2>
            <p className="text-xs text-slate-300 leading-relaxed">{message}</p>
            <div className="pt-2 flex flex-col gap-2">
              <Link
                href="/login"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-800 py-3 text-xs font-bold text-white hover:bg-slate-700"
              >
                <span>Return to Login</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen w-full items-center justify-center bg-slate-950 text-white">
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
            <p className="text-xs font-semibold text-slate-400">Loading...</p>
          </div>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
