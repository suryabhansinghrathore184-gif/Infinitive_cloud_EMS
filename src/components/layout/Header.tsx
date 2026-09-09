'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  Bell,
  HelpCircle,
  Menu,
  ChevronDown,
  User,
  Settings,
  LogOut,
  ShieldCheck,
  Check,
  CheckCheck,
  CreditCard,
  CalendarDays,
  Users as UsersIcon,
  FileText,
  UserPlus,
  Clock,
  Puzzle,
} from 'lucide-react';
import { useEmsStore } from '@/store/emsStore';

interface HeaderProps {
  onMenuClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const router = useRouter();
  const {
    state,
    notifications,
    unreadNotificationsCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
  } = useEmsStore();

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const adminUser = state.adminUser || {
    name: 'Admin',
    email: 'admin@organization.com',
    role: 'HR Administrator',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80',
  };

  const recentNotifications = (notifications || []).slice(0, 5);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'payroll':
        return <CreditCard className="h-4 w-4 text-emerald-600" />;
      case 'leave':
        return <CalendarDays className="h-4 w-4 text-blue-600" />;
      case 'employee':
        return <UsersIcon className="h-4 w-4 text-indigo-600" />;
      case 'attendance':
        return <Clock className="h-4 w-4 text-amber-600" />;
      case 'document':
        return <FileText className="h-4 w-4 text-purple-600" />;
      case 'recruitment':
        return <UserPlus className="h-4 w-4 text-rose-600" />;
      default:
        return <Puzzle className="h-4 w-4 text-slate-600" />;
    }
  };

  const handleNotificationClick = (id: string, actionUrl: string) => {
    markNotificationAsRead(id);
    setIsNotificationsOpen(false);
    if (actionUrl) {
      router.push(actionUrl);
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6">
      {/* Left: Mobile Menu Toggle & Title */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 lg:hidden"
          aria-label="Open Sidebar"
        >
          <Menu className="h-6 w-6" />
        </button>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Dashboard</h1>
          <p className="hidden text-xs text-slate-500 sm:block">Overview of HR operations & organization activity</p>
        </div>
      </div>

      {/* Center: Global Search */}
      <div className="hidden max-w-md flex-1 px-8 md:block">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search employees, departments, requests..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-12 text-sm text-slate-800 placeholder-slate-400 transition-colors focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-slate-400">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-3">
        {/* Help Icon */}
        <button
          className="relative rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
          title="HR Support & Documentation"
        >
          <HelpCircle className="h-5 w-5" />
        </button>

        {/* Notification Icon */}
        <div className="relative">
          <button
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className="relative rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white shadow-sm animate-pulse">
                {unreadNotificationsCount > 99 ? '99+' : unreadNotificationsCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {isNotificationsOpen && (
            <div className="absolute right-0 mt-2 w-88 rounded-2xl border border-slate-200 bg-white py-2 shadow-2xl z-50 text-xs animate-fade-in">
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
                <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                  <span>Notifications</span>
                  {unreadNotificationsCount > 0 && (
                    <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700">
                      {unreadNotificationsCount} Unread
                    </span>
                  )}
                </div>
                {unreadNotificationsCount > 0 && (
                  <button
                    onClick={() => markAllNotificationsAsRead()}
                    className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:underline"
                  >
                    <CheckCheck className="h-3.5 w-3.5" />
                    <span>Mark all read</span>
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {recentNotifications.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 text-xs">No notifications yet.</div>
                ) : (
                  recentNotifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => handleNotificationClick(n.id, n.actionUrl)}
                      className={`flex items-start gap-3 p-3 transition cursor-pointer hover:bg-slate-50 ${
                        !n.isRead ? 'bg-blue-50/40' : ''
                      }`}
                    >
                      <div className="mt-0.5 rounded-lg border border-slate-100 bg-white p-2 shadow-xs">
                        {getCategoryIcon(n.category)}
                      </div>
                      <div className="flex-1 space-y-0.5 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className={`font-bold truncate ${!n.isRead ? 'text-slate-900' : 'text-slate-700'}`}>
                            {n.title}
                          </p>
                          {!n.isRead && <span className="h-2 w-2 rounded-full bg-blue-600 shrink-0"></span>}
                        </div>
                        <p className="text-[11px] text-slate-600 line-clamp-2">{n.message}</p>
                        <p className="text-[10px] text-slate-400 font-mono pt-0.5">
                          {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="border-t border-slate-100 p-2 text-center">
                <Link
                  href="/admin/notifications"
                  onClick={() => setIsNotificationsOpen(false)}
                  className="block rounded-xl py-1.5 font-bold text-blue-600 hover:bg-blue-50 transition"
                >
                  View All Notifications →
                </Link>
              </div>
            </div>
          )}
        </div>

        <div className="h-6 w-[1px] bg-slate-200"></div>

        {/* User Profile */}
        <div className="relative">
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-3 rounded-xl p-1.5 transition-colors hover:bg-slate-100"
          >
            {/* Avatar */}
            <div className="relative h-9 w-9 overflow-hidden rounded-full ring-2 ring-blue-500/30">
              <img
                src={adminUser.avatar}
                alt={adminUser.name}
                className="h-full w-full object-cover"
              />
              <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white"></span>
            </div>
            <div className="hidden text-left sm:block">
              <div className="flex items-center gap-1">
                <span className="text-sm font-semibold text-slate-900">{adminUser.name}</span>
                <ShieldCheck className="h-4 w-4 text-blue-600" />
              </div>
              <p className="text-xs text-slate-500">{adminUser.role}</p>
            </div>
            <ChevronDown className="hidden h-4 w-4 text-slate-400 sm:block" />
          </button>

          {/* Profile Dropdown */}
          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl">
              <div className="border-b border-slate-100 px-3 py-2">
                <p className="text-xs font-semibold text-slate-900">{adminUser.name}</p>
                <p className="text-[11px] text-slate-500">{adminUser.email}</p>
              </div>
              <div className="py-1 text-xs text-slate-700">
                <Link
                  href="/admin/settings"
                  onClick={() => setIsProfileOpen(false)}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 hover:bg-slate-100"
                >
                  <User className="h-4 w-4 text-slate-500" />
                  <span>My Profile & Photo</span>
                </Link>
                <Link
                  href="/admin/settings"
                  onClick={() => setIsProfileOpen(false)}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 hover:bg-slate-100"
                >
                  <Settings className="h-4 w-4 text-slate-500" />
                  <span>Account Settings</span>
                </Link>
              </div>
              <div className="border-t border-slate-100 pt-1 text-xs text-rose-600">
                <button
                  onClick={() => setIsProfileOpen(false)}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 hover:bg-rose-50"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
