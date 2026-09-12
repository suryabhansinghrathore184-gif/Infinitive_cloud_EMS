'use client';

import React, { useState } from 'react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { SuperAdminSidebar } from './SuperAdminSidebar';
import { SuperAdminHeader } from './SuperAdminHeader';

interface SuperAdminLayoutProps {
  children: React.ReactNode;
  pageTitle?: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
}

export const SuperAdminLayout: React.FC<SuperAdminLayoutProps> = ({
  children,
  pageTitle,
  breadcrumbs,
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <AuthGuard allowedRoles={['Super Admin', 'SUPER_ADMIN', 'HR Administrator']}>
      <div className="flex h-screen w-full overflow-hidden bg-slate-100 font-sans text-slate-900 antialiased">
        {/* Super Admin Sidebar */}
        <SuperAdminSidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        {/* Main Content Area */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <SuperAdminHeader
            onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
            pageTitle={pageTitle}
            breadcrumbs={breadcrumbs}
          />

          <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin scrollbar-thumb-slate-300">
            {children}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
};
