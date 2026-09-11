'use client';

import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { ChevronRight, Home } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AuthGuard } from '@/components/auth/AuthGuard';

interface AdminLayoutProps {
  children: React.ReactNode;
  pageTitle?: string;
  breadcrumbs?: { label: string; href?: string }[];
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  children,
  pageTitle = 'Dashboard',
  breadcrumbs = [],
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();

  return (
    <AuthGuard allowedRoles={['HR/Admin', 'Super Admin']}>
      <div className="flex h-screen w-full overflow-hidden bg-slate-50 font-sans text-slate-900 antialiased">
        {/* Sidebar */}
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

        {/* Main Container */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Top Header */}
          <Header onMenuClick={() => setIsSidebarOpen(true)} />

          {/* Breadcrumb Bar */}
          {breadcrumbs.length > 0 && (
            <div className="flex items-center gap-2 border-b border-slate-200 bg-white px-6 py-2.5 text-xs text-slate-500">
              <Link href="/admin/dashboard" className="flex items-center gap-1 hover:text-blue-600">
                <Home className="h-3.5 w-3.5" />
                <span>Admin</span>
              </Link>
              {breadcrumbs.map((bc, idx) => (
                <React.Fragment key={idx}>
                  <ChevronRight className="h-3 w-3 text-slate-400" />
                  {bc.href ? (
                    <Link href={bc.href} className="hover:text-blue-600 font-medium">
                      {bc.label}
                    </Link>
                  ) : (
                    <span className="font-semibold text-slate-800">{bc.label}</span>
                  )}
                </React.Fragment>
              ))}
            </div>
          )}

          {/* Scrollable Content View */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-7xl space-y-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  );
};
