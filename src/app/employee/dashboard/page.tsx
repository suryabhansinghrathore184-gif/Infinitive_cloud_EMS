'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { useAuthStore } from '@/store/authStore';
import { Building2, LogOut, ShieldCheck, Clock, RefreshCw } from 'lucide-react';

export default function EmployeeDashboardPage() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await logout();
    router.replace('/login?logged_out=true');
  };

  return (
    <AuthGuard allowedRoles={['EMPLOYEE', 'SUPER_ADMIN']}>
      <div className="flex min-h-screen w-full items-center justify-center bg-slate-950 p-4 font-sans text-slate-100">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-indigo-900/30 via-slate-950 to-slate-950 pointer-events-none" />

        <div className="relative w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/90 p-8 shadow-2xl backdrop-blur-xl text-center space-y-6">
          {/* Header Icon */}
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-sky-500 text-white shadow-lg shadow-indigo-600/30">
            <Building2 className="h-8 w-8" />
          </div>

          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-bold text-indigo-400 border border-indigo-500/20">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              Authenticated as {user?.role || 'EMPLOYEE'}
            </span>
            <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-white">
              Employee Panel Coming Soon
            </h1>
            <p className="mt-2 text-xs text-slate-400 leading-relaxed">
              Welcome, <strong className="text-white font-semibold">{user?.name || user?.email || 'Employee'}</strong>! Your account has been authenticated successfully. The Employee self-service workspace is currently under development.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-left text-xs space-y-2 font-mono text-slate-400">
            <div className="flex items-center justify-between">
              <span>Employee ID:</span>
              <span className="font-bold text-slate-200">{user?.employeeId || 'EMP1001'}</span>
            </div>
            <div className="flex items-center justify-between border-t border-slate-800/80 pt-2">
              <span>Email:</span>
              <span className="font-bold text-slate-200">{user?.email || 'employee@organization.com'}</span>
            </div>
            <div className="flex items-center justify-between border-t border-slate-800/80 pt-2">
              <span>Session Status:</span>
              <span className="font-bold text-emerald-400 flex items-center gap-1">
                <Clock className="h-3 w-3" /> Active
              </span>
            </div>
          </div>

          <div className="border-t border-slate-800/80 pt-4">
            <p className="text-xs text-slate-400 mb-4">You may safely log out of your session below:</p>
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 py-3 text-xs font-bold text-white border border-slate-700 shadow-lg transition-all disabled:opacity-50 cursor-pointer"
            >
              {isLoggingOut ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin text-slate-400" />
                  <span>Logging Out...</span>
                </>
              ) : (
                <>
                  <LogOut className="h-4 w-4 text-rose-400" />
                  <span>Log Out of Employee Session</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
