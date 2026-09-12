'use client';

import React, { useState, useRef, useEffect } from 'react';
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
  CheckCheck,
  CreditCard,
  CalendarDays,
  Users as UsersIcon,
  FileText,
  UserPlus,
  Clock,
  Puzzle,
  Building2,
  X,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { useEmsStore } from '@/store/emsStore';
import { useAuthStore } from '@/store/authStore';
import { LogoutConfirmModal } from '@/components/modals/LogoutConfirmModal';

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

  const { user } = useAuthStore();

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  // Global search state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Notification category filter
  const [notifCategory, setNotifCategory] = useState<string>('all');

  const activeUser = user || {
    name: state.adminUser?.name || 'Admin',
    email: state.adminUser?.email || 'admin@organization.com',
    role: state.adminUser?.role || 'HR Administrator',
    avatar:
      state.adminUser?.avatar ||
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80',
  };

  // Close search popover on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filtered search results across employees, departments, designations, leaves
  const searchResults = (() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();

    const matchedEmployees = (state.employees || [])
      .filter(
        (e) =>
          e.firstName.toLowerCase().includes(q) ||
          e.lastName.toLowerCase().includes(q) ||
          e.employeeId.toLowerCase().includes(q) ||
          e.email.toLowerCase().includes(q) ||
          e.department.toLowerCase().includes(q)
      )
      .slice(0, 4)
      .map((e) => ({
        type: 'Employee',
        title: `${e.firstName} ${e.lastName}`,
        subtitle: `${e.employeeId} • ${e.department}`,
        url: '/admin/employees',
      }));

    const matchedDepts = (state.departments || [])
      .filter((d) => d.name.toLowerCase().includes(q) || d.code.toLowerCase().includes(q))
      .slice(0, 2)
      .map((d) => ({
        type: 'Department',
        title: d.name,
        subtitle: `Code: ${d.code} • Head: ${d.head}`,
        url: '/admin/organization',
      }));

    const matchedLeaves = (state.leaves || [])
      .filter((l) => l.employeeName.toLowerCase().includes(q) || l.leaveType.toLowerCase().includes(q))
      .slice(0, 2)
      .map((l) => ({
        type: 'Leave Request',
        title: `${l.employeeName} (${l.leaveType})`,
        subtitle: `Status: ${l.status} • ${l.durationDays} days`,
        url: '/admin/leave',
      }));

    return [...matchedEmployees, ...matchedDepts, ...matchedLeaves];
  })();

  // Filter notifications by category
  const filteredNotifications = (notifications || []).filter((n) => {
    if (notifCategory === 'all') return true;
    if (notifCategory === 'unread') return !n.isRead;
    return n.category === notifCategory;
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'payroll':
        return <CreditCard className="h-4 w-4 text-emerald-600" />;
      case 'leave':
        return <CalendarDays className="h-4 w-4 text-indigo-600" />;
      case 'employee':
        return <UsersIcon className="h-4 w-4 text-blue-600" />;
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
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur-md sm:px-6 shadow-xs">
      {/* Left: Mobile Menu Toggle & App Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 lg:hidden"
          aria-label="Open Sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 font-bold text-indigo-600 text-xs border border-indigo-200">
            HR
          </span>
          <h1 className="text-base font-bold tracking-tight text-slate-900 hidden sm:block">
            Enterprise Control Center
          </h1>
        </div>
      </div>

      {/* Center: Global Instant Search Popover */}
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
            placeholder="Search employees, ID, departments, leaves..."
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

        {/* Instant Search Results Dropdown */}
        {isSearchOpen && searchQuery.trim() && (
          <div className="absolute left-4 right-4 sm:left-8 sm:right-8 mt-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl z-50 text-xs animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <span>Search Results ({searchResults.length})</span>
              <Sparkles className="h-3 w-3 text-indigo-500" />
            </div>

            <div className="max-h-72 overflow-y-auto divide-y divide-slate-50">
              {searchResults.length === 0 ? (
                <div className="p-4 text-center text-slate-400 text-xs">
                  No matches found for &quot;{searchQuery}&quot;
                </div>
              ) : (
                searchResults.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      setIsSearchOpen(false);
                      setSearchQuery('');
                      router.push(item.url);
                    }}
                    className="flex items-center justify-between p-2.5 transition cursor-pointer hover:bg-indigo-50/60 rounded-xl"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-indigo-100 px-1.5 py-0.2 text-[9px] font-bold text-indigo-700">
                          {item.type}
                        </span>
                        <p className="font-bold text-slate-900 truncate">{item.title}</p>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate">{item.subtitle}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Right Action Icons */}
      <div className="flex items-center gap-2.5">
        {/* Help Center Icon */}
        <Link
          href="/admin/helpdesk"
          className="relative rounded-xl p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
          title="HR Helpdesk & Support Tickets"
        >
          <HelpCircle className="h-5 w-5" />
        </Link>

        {/* Notifications Icon & Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className="relative rounded-xl p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white shadow-xs animate-pulse">
                {unreadNotificationsCount > 99 ? '99+' : unreadNotificationsCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {isNotificationsOpen && (
            <div className="absolute right-0 mt-2 w-96 rounded-2xl border border-slate-200 bg-white py-2 shadow-2xl z-50 text-xs animate-fade-in">
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
                <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                  <span>Notifications</span>
                  {unreadNotificationsCount > 0 && (
                    <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700">
                      {unreadNotificationsCount} New
                    </span>
                  )}
                </div>
                {unreadNotificationsCount > 0 && (
                  <button
                    onClick={() => markAllNotificationsAsRead()}
                    className="flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:underline"
                  >
                    <CheckCheck className="h-3.5 w-3.5" />
                    <span>Mark all read</span>
                  </button>
                )}
              </div>

              {/* Category Filter Tabs */}
              <div className="flex border-b border-slate-100 px-2 py-1.5 gap-1 overflow-x-auto text-[11px] font-semibold text-slate-600">
                {[
                  { key: 'all', label: 'All' },
                  { key: 'unread', label: 'Unread' },
                  { key: 'leave', label: 'Leave' },
                  { key: 'payroll', label: 'Payroll' },
                  { key: 'attendance', label: 'Attendance' },
                  { key: 'document', label: 'Docs' },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setNotifCategory(tab.key)}
                    className={`rounded-lg px-2.5 py-1 transition-colors whitespace-nowrap ${
                      notifCategory === tab.key
                        ? 'bg-indigo-600 text-white'
                        : 'hover:bg-slate-100 text-slate-600'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Notifications List */}
              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {filteredNotifications.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 text-xs">No notifications found in this category.</div>
                ) : (
                  filteredNotifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => handleNotificationClick(n.id, n.actionUrl)}
                      className={`flex items-start gap-3 p-3 transition cursor-pointer hover:bg-slate-50 ${
                        !n.isRead ? 'bg-indigo-50/40' : ''
                      }`}
                    >
                      <div className="mt-0.5 rounded-xl border border-slate-100 bg-white p-2 shadow-xs shrink-0">
                        {getCategoryIcon(n.category)}
                      </div>
                      <div className="flex-1 space-y-0.5 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className={`font-bold truncate ${!n.isRead ? 'text-slate-900' : 'text-slate-700'}`}>
                            {n.title}
                          </p>
                          {!n.isRead && <span className="h-2 w-2 rounded-full bg-indigo-600 shrink-0"></span>}
                        </div>
                        <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">{n.message}</p>
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
                  className="block rounded-xl py-1.5 font-bold text-indigo-600 hover:bg-indigo-50 transition"
                >
                  View All Notifications →
                </Link>
              </div>
            </div>
          )}
        </div>

        <div className="h-5 w-[1px] bg-slate-200"></div>

        {/* User Profile Avatar & Dropdown */}
        <div className="relative shrink-0">
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex h-10 max-w-[200px] sm:max-w-[240px] items-center gap-2 rounded-xl p-1 transition-colors hover:bg-slate-100 min-w-0"
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
              <p className="truncate text-[10px] font-semibold text-slate-500">{activeUser.role}</p>
            </div>
            <ChevronDown className="hidden h-3.5 w-3.5 shrink-0 text-slate-400 sm:block" />
          </button>

          {/* Profile Menu Dropdown */}
          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-2xl z-50 text-xs">
              <div className="border-b border-slate-100 px-3 py-2">
                <p className="text-xs font-bold text-slate-900">{activeUser.name}</p>
                <p className="text-[11px] text-slate-500 truncate">{activeUser.email}</p>
              </div>
              <div className="py-1 text-slate-700">
                <Link
                  href="/admin/settings"
                  onClick={() => setIsProfileOpen(false)}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 hover:bg-slate-100 font-medium"
                >
                  <User className="h-4 w-4 text-slate-500" />
                  <span>My Profile & Photo</span>
                </Link>
                <Link
                  href="/admin/settings"
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
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      <LogoutConfirmModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
      />
    </header>
  );
};
