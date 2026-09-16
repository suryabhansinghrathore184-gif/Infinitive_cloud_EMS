'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { Building2, ShieldCheck, RefreshCw, AlertCircle, ArrowLeft, Send } from 'lucide-react';

function VerifyOtpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { verifyOtp, resendOtp, getRoleDashboardRoute } = useAuthStore();

  const emailParam = searchParams.get('email') || '';
  const twoFactorTokenParam = searchParams.get('twoFactorToken') || '';

  const [otpDigits, setOtpDigits] = useState<string[]>(Array(6).fill(''));
  const [email, setEmail] = useState<string>(emailParam);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number>(60);
  const [canResend, setCanResend] = useState<boolean>(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (emailParam) setEmail(emailParam);
  }, [emailParam]);

  // Countdown timer for resending OTP
  useEffect(() => {
    if (countdown <= 0) {
      setCanResend(true);
      return;
    }
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  // Auto-focus first input on mount
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleDigitChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const newDigits = [...otpDigits];
    newDigits[index] = digit;
    setOtpDigits(newDigits);
    setErrorMessage(null);

    // Auto-advance to next input
    if (digit && index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pastedData) return;

    const newDigits = Array(6).fill('');
    for (let i = 0; i < pastedData.length; i++) {
      newDigits[i] = pastedData[i];
    }
    setOtpDigits(newDigits);
    setErrorMessage(null);

    const targetIndex = Math.min(pastedData.length, 5);
    inputRefs.current[targetIndex]?.focus();
  };

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const fullOtp = otpDigits.join('');

    if (fullOtp.length !== 6) {
      setErrorMessage('Please enter the complete 6-digit verification code.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await verifyOtp(fullOtp, email || undefined, twoFactorTokenParam || undefined);

      if (res.success && res.session) {
        setSuccessMessage('Verification successful! Redirecting to your dashboard...');
        const targetDashboard = getRoleDashboardRoute(res.session.user.role);
        setTimeout(() => {
          router.replace(targetDashboard);
        }, 1000);
      } else {
        setErrorMessage(res.message || 'Invalid or expired verification code. Please check and try again.');
        setIsLoading(false);
      }
    } catch {
      setErrorMessage('Verification failed due to a server error. Please try again.');
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!canResend) return;

    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await resendOtp(email || undefined);
      if (res.success) {
        setSuccessMessage(res.message || 'A new verification code has been dispatched to your email.');
        setCountdown(60);
        setCanResend(false);
        setOtpDigits(Array(6).fill(''));
        if (inputRefs.current[0]) inputRefs.current[0].focus();
      } else {
        setErrorMessage(res.message || 'Failed to resend verification code.');
      }
    } catch {
      setErrorMessage('Failed to resend code. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-slate-950 p-4 font-sans text-slate-100">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-indigo-900/30 via-slate-950 to-slate-950 pointer-events-none" />

      <div className="relative w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/90 p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-6">
        {/* Header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-lg shadow-blue-500/20">
            <Building2 className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Enter Verification Code</h1>
          <p className="text-xs text-slate-400 max-w-xs">
            We sent a 6-digit OTP code to{' '}
            <span className="font-mono font-bold text-slate-200">{email || 'your registered email'}</span>.
          </p>
        </div>

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

        {/* 6-Digit OTP Form */}
        <form onSubmit={handleVerify} className="space-y-6">
          <div className="flex justify-between gap-2 sm:gap-3">
            {otpDigits.map((digit, index) => (
              <input
                key={index}
                ref={(el) => { inputRefs.current[index] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleDigitChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                className="h-12 w-11 sm:h-14 sm:w-12 text-center text-lg font-bold font-mono rounded-xl border border-slate-700 bg-slate-950 text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={isLoading || otpDigits.join('').length !== 6}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3 text-xs font-bold text-white shadow-lg shadow-blue-500/20 hover:from-blue-500 hover:to-indigo-500 transition disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Verifying Code...</span>
              </>
            ) : (
              <>
                <span>Verify & Continue</span>
                <ShieldCheck className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        {/* Resend Code Footer */}
        <div className="flex flex-col items-center space-y-3 border-t border-slate-800/80 pt-4 text-xs">
          <div className="flex items-center gap-1.5 text-slate-400">
            <span>Didn&apos;t receive the code?</span>
            {canResend ? (
              <button
                type="button"
                onClick={handleResendCode}
                disabled={isLoading}
                className="font-bold text-blue-400 hover:text-blue-300 underline flex items-center gap-1"
              >
                <Send className="h-3 w-3" /> Resend Code
              </button>
            ) : (
              <span className="font-mono text-slate-500">Resend in {countdown}s</span>
            )}
          </div>

          <Link
            href="/login"
            className="flex items-center gap-1 text-slate-400 hover:text-white transition pt-1"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen w-full items-center justify-center bg-slate-950 font-sans text-white">
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
            <p className="text-xs font-semibold text-slate-400">Loading OTP Screen...</p>
          </div>
        </div>
      }
    >
      <VerifyOtpContent />
    </Suspense>
  );
}
