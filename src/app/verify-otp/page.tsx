'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { ShieldCheck, ArrowLeft, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function VerifyOtpPage() {
  const router = useRouter();
  const { verifyOtp, resendOtp, getRoleDashboardRoute } = useAuthStore();

  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [timer, setTimer] = useState<number>(60);
  const [canResend, setCanResend] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
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

    // Auto-advance to next input field
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
      setErrorMessage('Please enter all 6 digits of your OTP code.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await verifyOtp(fullCode);
      setIsLoading(false);

      if (!response.success) {
        setErrorMessage(response.message || 'Invalid OTP code. Please try again.');
        return;
      }

      router.replace(getRoleDashboardRoute(response.session?.user.role));
    } catch {
      setIsLoading(false);
      setErrorMessage('Failed to verify OTP code. Please try again.');
    }
  };

  const handleResend = async () => {
    if (!canResend) return;

    setErrorMessage(null);
    setCanResend(false);
    setTimer(60);

    const res = await resendOtp();
    if (res.success) {
      setToastMessage(res.message);
      setTimeout(() => setToastMessage(null), 4000);
    } else {
      setErrorMessage(res.message);
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

        <div className="mt-6 flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/30">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <h2 className="mt-4 text-xl font-bold tracking-tight text-white">Two-Factor Verification</h2>
          <p className="mt-1 text-xs text-slate-400 leading-relaxed">
            Enter the 6-digit authentication code sent to your email/mobile. (Use test code:{' '}
            <strong className="text-emerald-400 font-mono">123456</strong>)
          </p>
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
                className="h-12 w-12 rounded-xl border border-slate-800 bg-slate-950 text-center text-lg font-bold text-white focus:border-emerald-500 focus:outline-none"
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
                canResend ? 'text-emerald-400 hover:text-emerald-300 hover:underline cursor-pointer' : 'text-slate-600 cursor-not-allowed'
              }`}
            >
              {canResend ? 'Resend OTP' : `Resend in ${timer}s`}
            </button>
          </div>

          <button
            type="submit"
            disabled={isLoading || otp.join('').length !== 6}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-xs font-bold text-white shadow-lg shadow-emerald-600/30 hover:bg-emerald-500 transition-all disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Verifying Code...</span>
              </>
            ) : (
              <span>Verify & Proceed to Dashboard</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
