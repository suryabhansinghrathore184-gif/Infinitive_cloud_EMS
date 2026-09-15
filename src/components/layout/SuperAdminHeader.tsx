'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { formatRoleLabel } from '@/lib/roleUtils';
import { LogoutConfirmModal } from '@/components/modals/LogoutConfirmModal';
import {
  Menu,
  Bell,
  HelpCircle,
  User,
  Settings,
  LogOut,
  ChevronDown,
  ShieldAlert,
  Search,
  ShieldCheck,
  X,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

interface SuperAdminHeaderProps {
  onToggleSidebar: () => void;
  pageTitle?: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
}

export const SuperAdminHeader: React.FC<SuperAdminHeaderProps> = ({
  onToggleSidebar,
  pageTitle = 'Super Admin Control Center',
}) => {
  const router = useRouter();
  const { user } = useAuthStore();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeUser = user || {
    name: 'Super Administrator',
    email: 'superadmin@organization.com',
    role: 'SUPER_ADMIN',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const roleDisplay = formatRoleLabel(activeUser.role || 'SUPER_ADMIN');

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur-md sm:px-6 shadow-xs">
      {/* Left Section: Mobile Menu Toggle & Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 lg:hidden"
          aria-label="Toggle Sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 font-bold text-indigo-600 text-xs border border-indigo-200">
            SA
          </span>
          <h1 className="text-base font-bold tracking-tight text-slate-900 hidden sm:block">
            {pageTitle}
          </h1>
        </div>
      </div>

      {/* Center: Global Instant Search */}
      <div ref={searchRef} className="relative max-w-md flex-1 px-4 sm:px-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsSearchOpen(true);
            }}
            onFocus={() => setIsSearchOpen(true)}
            placeholder="Search system, organizations, users, logs..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-1.5 pl-9 pr-12 text-xs text-slate-800 placeholder-slate-400 transition-colors focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium"
          />
          {searchQuery ? (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 hover:text-slate-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : (
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-slate-400">
              ⌘K
            </kbd>
          )}
        </div>
      </div>

      {/* Right Section: Notifications, Help & Profile Dropdown */}
      <div className="flex items-center gap-2.5">
        <Link
          href="/super-admin/dashboard"
          className="relative rounded-xl p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
          title="Super Admin Support & Documentation"
        >
          <HelpCircle className="h-5 w-5" />
        </Link>

        <div className="relative">
          <Link
            href="/super-admin/notifications"
            className="relative rounded-xl p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
            title="System Notifications"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-indigo-600 animate-pulse"></span>
          </Link>
        </div>

        <div className="h-5 w-[1px] bg-slate-200"></div>

        {/* User Profile Dropdown */}
        <div className="relative shrink-0" ref={dropdownRef}>
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex h-10 max-w-[200px] sm:max-w-[240px] items-center gap-2 rounded-xl p-1 transition-colors hover:bg-slate-100 min-w-0 cursor-pointer"
          >
            <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full ring-2 ring-indigo-500/30">
              <img
                src={activeUser.avatar}
                alt={activeUser.name}
                className="h-9 w-9 rounded-full object-cover"
              />
              <span className="absolute bottom-0 right-0 h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-500 ring-2 ring-white"></span>
            </div>
            <div className="hidden min-w-0 flex-1 text-left sm:block">
              <div className="flex items-center gap-1 min-w-0">
                <span className="truncate text-xs font-bold text-slate-900">{activeUser.name}</span>
                <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-indigo-600" />
              </div>
              <p className="truncate text-[10px] font-semibold text-slate-500">{roleDisplay}</p>
            </div>
            <ChevronDown className="hidden h-3.5 w-3.5 shrink-0 text-slate-400 sm:block" />
          </button>

          {/* Profile Menu Dropdown */}
          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-2xl z-50 text-xs animate-fade-in">
              <div className="border-b border-slate-100 px-3 py-2">
                <p className="text-xs font-bold text-slate-900">{activeUser.name}</p>
                <p className="text-[11px] text-slate-500 truncate">{activeUser.email}</p>
                <span className="mt-1 inline-block rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-700 border border-indigo-200">
                  {roleDisplay}
                </span>
              </div>
              <div className="py-1 text-slate-700">
                <Link
                  href="/super-admin/settings"
                  onClick={() => setIsProfileOpen(false)}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 hover:bg-slate-100 font-medium"
                >
                  <User className="h-4 w-4 text-slate-500" />
                  <span>My Profile & Settings</span>
                </Link>
                <Link
                  href="/super-admin/security"
                  onClick={() => setIsProfileOpen(false)}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 hover:bg-slate-100 font-medium"
                >
                  <ShieldAlert className="h-4 w-4 text-slate-500" />
                  <span>Security Center</span>
                </Link>
                <Link
                  href="/super-admin/settings"
                  onClick={() => setIsProfileOpen(false)}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 hover:bg-slate-100 font-medium"
                >
                  <Settings className="h-4 w-4 text-slate-500" />
                  <span>System Settings</span>
                </Link>
              </div>
              <div className="border-t border-slate-100 pt-1 text-rose-600">
                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    setIsLogoutModalOpen(true);
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 hover:bg-rose-50 font-bold cursor-pointer"
                >
                  <LogOut className="h-4 w-4 text-rose-600" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <LogoutConfirmModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
      />
    </header>
  );
};
