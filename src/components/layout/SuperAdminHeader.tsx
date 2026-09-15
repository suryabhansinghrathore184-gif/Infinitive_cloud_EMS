'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { formatRoleLabel } from '@/lib/roleUtils';
import {
  Menu,
  Bell,
  HelpCircle,
  User,
  Settings,
  Shield,
  LogOut,
  ChevronDown,
  ShieldAlert,
  Search,
} from 'lucide-react';

interface SuperAdminHeaderProps {
  onToggleSidebar: () => void;
  pageTitle?: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
}

export const SuperAdminHeader: React.FC<SuperAdminHeaderProps> = ({
  onToggleSidebar,
  pageTitle = 'Super Admin Control Center',
  breadcrumbs = [],
}) => {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    router.push('/super-admin/dashboard');
  };

  const roleDisplay = formatRoleLabel(user?.role || 'SUPER_ADMIN');

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur-md sm:px-6 shadow-2xs">
      {/* Left Section: Sidebar Toggle & Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 lg:hidden"
          aria-label="Toggle Sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex flex-col">
          <h1 className="text-sm font-extrabold text-slate-900 sm:text-base leading-tight">
            {pageTitle}
          </h1>

          {breadcrumbs.length > 0 && (
            <nav className="hidden items-center gap-1.5 text-[11px] text-slate-400 sm:flex">
              <Link href="/super-admin/dashboard" className="hover:text-indigo-600">
                Super Admin
              </Link>
              {breadcrumbs.map((crumb, idx) => (
                <React.Fragment key={idx}>
                  <span>/</span>
                  {crumb.href ? (
                    <Link href={crumb.href} className="hover:text-indigo-600 font-medium">
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="font-semibold text-slate-600">{crumb.label}</span>
                  )}
                </React.Fragment>
              ))}
            </nav>
          )}
        </div>
      </div>

      {/* Right Section: Notifications, Help & Profile Dropdown */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick Help */}
        <Link
          href="/super-admin/dashboard"
          className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          title="Super Admin Dashboard"
        >
          <HelpCircle className="h-5 w-5" />
        </Link>

        {/* Notifications */}
        <Link
          href="/super-admin/notifications"
          className="relative rounded-xl p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          title="Notifications Center"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-amber-500 animate-ping"></span>
        </Link>

        <div className="h-6 w-px bg-slate-200 mx-1"></div>

        {/* User Profile Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50 p-1.5 pl-2 hover:bg-slate-100 transition-colors"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-tr from-amber-500 to-indigo-600 text-white font-bold text-xs shadow-xs">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} className="h-full w-full rounded-lg object-cover" />
              ) : (
                <Shield className="h-4 w-4 text-white" />
              )}
            </div>

            <div className="hidden text-left sm:block">
              <div className="flex items-center gap-1">
                <span className="text-xs font-bold text-slate-900 truncate max-w-[110px]">
                  {user?.name || 'Super Admin'}
                </span>
                <span className="rounded bg-amber-100 px-1 py-0.2 text-[9px] font-extrabold text-amber-800 border border-amber-300">
                  ROOT
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium">{roleDisplay}</p>
            </div>

            <ChevronDown className="h-4 w-4 text-slate-400" />
          </button>

          {/* Profile Dropdown Menu */}
          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white p-2 shadow-2xl border border-slate-100 text-xs animate-fade-in z-50">
              <div className="border-b border-slate-100 p-3">
                <p className="font-bold text-slate-900">{user?.name || 'Super Admin'}</p>
                <p className="text-[11px] text-slate-400 truncate">{user?.email || 'admin@organization.com'}</p>
                <span className="mt-1.5 inline-block rounded-full bg-amber-50 px-2 py-0.5 text-[9px] font-extrabold text-amber-700 border border-amber-200">
                  {roleDisplay} (Root Privileges)
                </span>
              </div>

              <div className="py-1 space-y-0.5">
                <Link
                  href="/super-admin/settings"
                  onClick={() => setIsProfileOpen(false)}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-slate-700 hover:bg-slate-100 font-medium"
                >
                  <User className="h-4 w-4 text-slate-500" />
                  <span>My Profile & Settings</span>
                </Link>

                <Link
                  href="/super-admin/settings"
                  onClick={() => setIsProfileOpen(false)}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-slate-700 hover:bg-slate-100 font-medium"
                >
                  <Settings className="h-4 w-4 text-slate-500" />
                  <span>System Settings</span>
                </Link>

                <Link
                  href="/super-admin/security"
                  onClick={() => setIsProfileOpen(false)}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-slate-700 hover:bg-slate-100 font-medium"
                >
                  <ShieldAlert className="h-4 w-4 text-slate-500" />
                  <span>Security Center</span>
                </Link>
              </div>

              <div className="border-t border-slate-100 pt-1">
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-rose-600 hover:bg-rose-50 font-bold"
                >
                  <LogOut className="h-4 w-4 text-rose-600" />
                  <span>Log Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
