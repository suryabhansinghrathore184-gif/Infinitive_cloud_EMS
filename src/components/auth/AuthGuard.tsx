'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { AlertCircle, ShieldAlert } from 'lucide-react';

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children, allowedRoles }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isHydrated, getRoleDashboardRoute } = useAuthStore();
  const [authError, setAuthError] = useState<string | null>(null);

  const publicRoutes = ['/login', '/forgot-password', '/reset-password', '/verify-otp'];
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));

  useEffect(() => {
    if (!isHydrated) return;

    // 1. Unauthenticated user trying to access protected route
    if (!isAuthenticated && !isPublicRoute) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    // 2. Authenticated user trying to access public auth routes (e.g., /login)
    if (isAuthenticated && isPublicRoute) {
      const targetDashboard = getRoleDashboardRoute();
      router.replace(targetDashboard);
      return;
    }

    // 3. Authenticated user trying to access unauthorized role route
    if (isAuthenticated && allowedRoles && allowedRoles.length > 0) {
      const userRole = user?.role || '';
      const hasPermission = allowedRoles.includes(userRole);

      if (!hasPermission) {
        setAuthError(`Access Denied: Your account role (${userRole}) is not authorized to view ${pathname}.`);
        const targetDashboard = getRoleDashboardRoute();
        setTimeout(() => {
          router.replace(targetDashboard);
        }, 2000);
      }
    }
  }, [isAuthenticated, isHydrated, pathname, user, allowedRoles, router, isPublicRoute, getRoleDashboardRoute]);

  // Loading spinner during hydration
  if (!isHydrated) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-900 text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
          <p className="text-xs font-semibold text-slate-400">Authenticating session...</p>
        </div>
      </div>
    );
  }

  // Authorization Error Alert
  if (authError) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-900 p-4 text-white">
        <div className="flex max-w-md flex-col items-center rounded-2xl border border-rose-500/30 bg-slate-800 p-6 text-center shadow-2xl space-y-3">
          <ShieldAlert className="h-12 w-12 text-rose-500 animate-bounce" />
          <h3 className="text-base font-bold text-slate-100">Unauthorized Access Attempt</h3>
          <p className="text-xs text-slate-400 leading-relaxed">{authError}</p>
          <p className="text-[11px] text-slate-500 font-mono">Redirecting to your authorized dashboard...</p>
        </div>
      </div>
    );
  }

  // Block rendering protected content if unauthenticated
  if (!isAuthenticated && !isPublicRoute) {
    return null;
  }

  return <>{children}</>;
};
