'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

export default function RootPage() {
  const router = useRouter();
  const { isAuthenticated, isHydrated, getRoleDashboardRoute } = useAuthStore();

  useEffect(() => {
    if (!isHydrated) return;

    if (isAuthenticated) {
      router.replace(getRoleDashboardRoute());
    } else {
      router.replace('/login');
    }
  }, [isAuthenticated, isHydrated, router, getRoleDashboardRoute]);

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-slate-950 text-white">
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
        <p className="text-xs font-semibold text-slate-400">Loading EMS Portal...</p>
      </div>
    </div>
  );
}
