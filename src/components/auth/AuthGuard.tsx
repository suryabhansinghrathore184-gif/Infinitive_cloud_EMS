'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { ShieldAlert } from 'lucide-react';
import { normalizeRole } from '@/lib/roleUtils';

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children, allowedRoles }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isHydrated, getRoleDashboardRoute } = useAuthStore();
  const [authError, setAuthError] = useState<string | null>(null);

  const publicRoutes = ['/login', '/forgot-password', '/reset-password', '/verify-otp', '/complete-account', '/verify-email', '/careers'];
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

    // 3. Authenticated user role check & route protection
    if (isAuthenticated) {
      const userRole = user?.role || 'EMPLOYEE';
      const normUserRole = normalizeRole(userRole);

      // Explicitly block HR/ADMIN from accessing /super-admin routes
      if (normUserRole !== 'SUPER_ADMIN' && pathname.startsWith('/super-admin')) {
        setAuthError(`Access Denied: Your account role (${userRole}) is not authorized to view ${pathname}.`);
        setTimeout(() => {
          router.replace('/admin/dashboard');
        }, 2000);
        return;
      }

      if (allowedRoles && allowedRoles.length > 0) {
        const normAllowedRoles = allowedRoles.map((r) => normalizeRole(r));
        let hasPermission = false;

        if (normUserRole === 'SUPER_ADMIN') {
          hasPermission = true;
        } else {
          hasPermission = normAllowedRoles.some((allowed) => {
            if (allowed === normUserRole) return true;
            if (
              (normUserRole === 'ADMIN' || normUserRole === 'HR') &&
              (allowed === 'ADMIN' || allowed === 'HR')
            ) {
              return true;
            }
            return false;
          });
        }

        if (!hasPermission) {
          setAuthError(`Access Denied: Your account role (${userRole}) is not authorized to view ${pathname}.`);
          const targetDashboard = getRoleDashboardRoute();
          setTimeout(() => {
            router.replace(targetDashboard);
          }, 2000);
        } else {
          setAuthError(null);
        }
      } else {
        setAuthError(null);
      }
    }
  }, [isAuthenticated, isHydrated, pathname, user, allowedRoles, router, isPublicRoute, getRoleDashboardRoute]);

  // Loading spinner during hydration
  if (!isHydrated) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-900 text-white font-sans">
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
      <div className="flex h-screen w-full items-center justify-center bg-slate-900 p-4 text-white font-sans">
        <div className="flex max-w-md flex-col items-center rounded-2xl border border-rose-500/30 bg-slate-800 p-6 text-center shadow-2xl space-y-3 animate-fade-in">
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
