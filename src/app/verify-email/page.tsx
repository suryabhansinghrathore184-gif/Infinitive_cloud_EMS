'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Mail, CheckCircle2, AlertCircle, RefreshCw, ArrowRight, ShieldCheck, ArrowLeft } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return email || 'user@organization.com';
  const [name, domain] = email.split('@');
  if (name.length <= 2) return `${name.charAt(0)}*****@${domain}`;
  return `${name.charAt(0)}${'*'.repeat(Math.max(5, name.length - 2))}${name.charAt(name.length - 1)}@${domain}`;
}

function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryEmail = searchParams.get('email') || '';
  const token = searchParams.get('token') || '';

  const { pendingOtpEmail, requestOtp } = useAuthStore();
  const activeEmail = queryEmail || pendingOtpEmail || '';

  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [timer, setTimer] = useState<number>(60);
  const [canResend, setCanResend] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Automatic token-based verification if token parameter is passed in URL
  useEffect(() => {
    if (token) {
      setIsLoading(true);
      fetch('/api/v1/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
        .then((res) => res.json())
        .then((data) => {
          setIsLoading(false);
          if (data.success) {
            setIsSuccess(true);
          } else {
            setErrorMessage(data.message || 'Verification link expired.');
          }
        })
        .catch(() => {
          setIsLoading(false);
          setErrorMessage('Network error during verification.');
        });
    }
  }, [token]);

  // Resend cooldown timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    } else {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const fullCode = otp.join('');
    if (fullCode.length !== 6) {
      setErrorMessage('Please enter all 6 digits of your verification code.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/v1/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: activeEmail, otp: fullCode }),
      });
      const data = await res.json();
      setIsLoading(false);

      if (!res.ok || !data.success) {
        setErrorMessage(data.message || 'Invalid verification code. Please try again.');
        return;
      }

      setIsSuccess(true);
    } catch {
      setIsLoading(false);
      setErrorMessage('Failed to verify code. Please try again.');
    }
  };

  const handleResend = async () => {
    if (!canResend) return;

    setErrorMessage(null);
    setCanResend(false);
    setTimer(60);

    try {
      const res = await fetch('/api/v1/auth/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: activeEmail, purpose: 'EMAIL_VERIFICATION' }),
      });
      const data = await res.json();
      if (data.success) {
        setToastMessage('A new verification code has been sent via Gmail.');
        setTimeout(() => setToastMessage(null), 4000);
      } else {
        setErrorMessage(data.message);
      }
    } catch {
      setErrorMessage('Failed to resend verification code.');
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-slate-950 p-4 font-sans text-slate-100">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-blue-900/30 via-slate-950 to-slate-950 pointer-events-none" />

      {toastMessage && (
        <div className="fixed right-6 top-6 z-50 flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-xs font-semibold text-white shadow-2xl border border-emerald-500/30">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="relative w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/90 p-8 shadow-2xl backdrop-blur-xl">
        <button
          onClick={() => router.push('/login')}
          className="flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Login</span>
        </button>

        {isSuccess ? (
          <div className="mt-6 flex flex-col items-center text-center space-y-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/30">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white">Email Verified!</h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Your email address has been verified successfully. You may now proceed to sign in to your EMS/HRMS account.
            </p>
            <div className="pt-4 w-full">
              <Link
                href="/login"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-indigo-600 py-3 text-xs font-bold text-white shadow-lg hover:from-emerald-600 hover:to-indigo-700 transition-all cursor-pointer"
              >
                <span>Proceed to Sign In</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        ) : (
          <div>
            <div className="mt-6 flex flex-col items-center text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/30">
                <ShieldCheck className="h-7 w-7" />
              </div>
              <h2 className="mt-4 text-xl font-bold tracking-tight text-white">Verify Your Email</h2>
              <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                We&apos;ve sent a 6-digit verification code to your email address.
              </p>
              {activeEmail && (
                <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-slate-800/80 px-3 py-1 text-xs text-indigo-300 border border-slate-700 font-mono">
                  <Mail className="h-3.5 w-3.5" />
                  <span>{maskEmail(activeEmail)}</span>
                </div>
              )}
            </div>

            {errorMessage && (
              <div className="mt-5 flex items-center gap-2.5 rounded-2xl border border-rose-500/30 bg-rose-950/40 p-3.5 text-xs font-semibold text-rose-300">
                <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleVerify} className="mt-6 space-y-6">
              <div className="flex items-center justify-center gap-2">
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => {
                      inputRefs.current[idx] = el;
                    }}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    className="h-12 w-12 rounded-xl border border-slate-800 bg-slate-950 text-center text-lg font-bold text-white focus:border-indigo-500 focus:outline-hidden"
                  />
                ))}
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Did not receive code?</span>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={!canResend}
                  className={`font-semibold transition-colors ${
                    canResend ? 'text-indigo-400 hover:text-indigo-300 hover:underline cursor-pointer' : 'text-slate-600 cursor-not-allowed'
                  }`}
                >
                  {canResend ? 'Resend Code' : `Resend in ${timer}s`}
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading || otp.join('').length !== 6}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 py-3 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 hover:from-sky-600 hover:to-indigo-700 transition-all disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Verifying Email...</span>
                  </>
                ) : (
                  <span>Verify Email</span>
                )}
              </button>
            </form>
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
            <p className="text-xs font-semibold text-slate-400">Loading Verification...</p>
          </div>
        </div>
      }
    >
      <VerifyEmailForm />
    </Suspense>
  );
}
