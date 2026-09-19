'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { useAuthStore } from '@/store/authStore';
import {
  Bell,
  RefreshCw,
  CheckCircle2,
  Inbox,
  CalendarDays,
  CreditCard,
  Clock,
  MessageSquare,
  ShieldAlert,
  Search,
  RotateCcw,
  X,
  ExternalLink,
  CheckCheck,
  User,
  Building2,
  AlertCircle,
  Sparkles,
  Info,
  Eye,
  Check,
  ShieldCheck,
} from 'lucide-react';

interface NotificationItem {
  id: string;
  _id?: string;
  organizationId?: string;
  recipientType?: string;
  recipientId?: string;
  targetScope?: string;
  eventType?: string;
  category?: string;
  title: string;
  message: string;
  priority?: string;
  channel?: string;
  status?: string; // 'READ' | 'UNREAD'
  isRead?: boolean;
  actionUrl?: string | null;
  link?: string | null;
  metadata?: any;
  createdAt?: string;
  readAt?: string | null;
}

export default function EmployeeNotificationsPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [profileData, setProfileData] = useState<any>(null);
  const [kpis, setKpis] = useState({
    total: 0,
    unread: 0,
    read: 0,
    today: 0,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isMarkingAllRead, setIsMarkingAllRead] = useState(false);
  const [markingReadId, setMarkingReadId] = useState<string | null>(null);

  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('All'); // 'All' | 'UNREAD' | 'READ'
  const [filterCategory, setFilterCategory] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(15);

  // Notification Detail Modal State
  const [selectedNotif, setSelectedNotif] = useState<NotificationItem | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Fetch Notifications & User Session Data
  const fetchNotifications = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setIsError(false);
    setErrorMessage(null);

    try {
      const [notifRes, meRes] = await Promise.all([
        fetch('/api/v1/notifications?limit=100').catch(() => null),
        fetch('/api/v1/auth/me').catch(() => null),
      ]);

      if (meRes && meRes.ok) {
        const meData = await meRes.json();
        if (meData.success && meData.user) {
          setProfileData(meData.user);
        }
      }

      if (notifRes && notifRes.ok) {
        const data = await notifRes.json();
        if (data.success && Array.isArray(data.notifications || data.data)) {
          const list: NotificationItem[] = data.notifications || data.data || [];
          setNotifications(list);

          // Derived KPI metrics
          const unreadCount = list.filter((n) => n.status === 'UNREAD' || (!n.status && !n.isRead)).length;
          const readCount = list.length - unreadCount;

          const now = new Date();
          const startOfTodayISO = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
          const todayCount = list.filter((n) => n.createdAt && n.createdAt >= startOfTodayISO).length;

          setKpis({
            total: data.kpis?.total ?? list.length,
            unread: data.unreadCount ?? data.kpis?.unread ?? unreadCount,
            read: data.readCount ?? data.kpis?.read ?? readCount,
            today: data.kpis?.today ?? todayCount,
          });

          if (isManualRefresh) {
            showToast('Notifications inbox refreshed');
          }
        } else {
          setNotifications([]);
        }
      } else {
        setIsError(true);
        setErrorMessage('Unable to fetch notifications. Please try again.');
      }
    } catch (err: any) {
      console.error('Error fetching employee notifications:', err);
      setIsError(true);
      setErrorMessage(err?.message || 'A network error occurred while loading notifications.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Handle ESC key for modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedNotif(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Mark Single Notification as Read
  const handleMarkAsRead = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setMarkingReadId(id);

    try {
      const res = await fetch(`/api/v1/notifications/${id}/read`, {
        method: 'PATCH',
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          // Update locally immediately
          setNotifications((prev) =>
            prev.map((n) => (n.id === id || n._id === id ? { ...n, status: 'READ', isRead: true } : n))
          );
          setKpis((prev) => ({
            ...prev,
            unread: Math.max(0, prev.unread - 1),
            read: prev.read + 1,
          }));
        }
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
    } finally {
      setMarkingReadId(null);
    }
  };

  // Mark All Notifications as Read
  const handleMarkAllRead = async () => {
    if (kpis.unread <= 0 || isMarkingAllRead) return;

    setIsMarkingAllRead(true);
    try {
      const res = await fetch('/api/v1/notifications/mark-all-read', {
        method: 'PATCH',
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          // Update all locally
          const nowISO = new Date().toISOString();
          setNotifications((prev) =>
            prev.map((n) => ({ ...n, status: 'READ', isRead: true, readAt: nowISO }))
          );
          setKpis((prev) => ({
            ...prev,
            read: prev.total,
            unread: 0,
          }));
          showToast('All notifications marked as read');
        }
      }
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    } finally {
      setIsMarkingAllRead(false);
    }
  };

  // Handle Notification Item Click (Mark Read & Navigate if target link exists)
  const handleNotificationClick = async (notif: NotificationItem) => {
    if (notif.status === 'UNREAD' || !notif.isRead) {
      await handleMarkAsRead(notif.id || notif._id || '');
    }

    const targetUrl = notif.actionUrl || notif.link;
    if (targetUrl && targetUrl.startsWith('/')) {
      router.push(targetUrl);
    } else {
      setSelectedNotif(notif);
    }
  };

  // Available Category Options derived from backend
  const categoryOptions = useMemo(() => {
    const set = new Set<string>();
    notifications.forEach((n) => {
      if (n.category) set.add(n.category.toUpperCase());
    });
    return Array.from(set);
  }, [notifications]);

  // Filter & Search Logic
  const filteredNotifications = useMemo(() => {
    return notifications.filter((notif) => {
      // Search Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const t = (notif.title || '').toLowerCase();
        const m = (notif.message || '').toLowerCase();
        const c = (notif.category || '').toLowerCase();
        if (!t.includes(q) && !m.includes(q) && !c.includes(q)) return false;
      }

      // Status Filter
      if (filterStatus !== 'All') {
        const isUnread = notif.status === 'UNREAD' || (!notif.status && !notif.isRead);
        if (filterStatus === 'UNREAD' && !isUnread) return false;
        if (filterStatus === 'READ' && isUnread) return false;
      }

      // Category Filter
      if (filterCategory !== 'All') {
        const cat = (notif.category || '').toUpperCase();
        if (cat !== filterCategory.toUpperCase()) return false;
      }

      return true;
    });
  }, [notifications, searchQuery, filterStatus, filterCategory]);

  const isFiltered = searchQuery.trim() !== '' || filterStatus !== 'All' || filterCategory !== 'All';

  const resetFilters = () => {
    setSearchQuery('');
    setFilterStatus('All');
    setFilterCategory('All');
    setCurrentPage(1);
  };

  // Relative Time Formatter
  const formatRelativeTime = (dateStr?: string) => {
    if (!dateStr) return 'Recent';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'Recent';

    const now = new Date();
    const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSeconds < 60) return 'Just now';
    if (diffSeconds < 3600) {
      const mins = Math.floor(diffSeconds / 60);
      return `${mins} ${mins === 1 ? 'min' : 'mins'} ago`;
    }
    if (diffSeconds < 86400) {
      const hours = Math.floor(diffSeconds / 3600);
      return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    }
    if (diffSeconds < 172800) return 'Yesterday';
    return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Category Icon Resolver
  const getCategoryIcon = (categoryStr?: string, eventTypeStr?: string) => {
    const c = (categoryStr || eventTypeStr || '').toUpperCase();
    if (c.includes('LEAVE')) return <CalendarDays className="h-4 w-4 text-emerald-600" />;
    if (c.includes('PAYROLL') || c.includes('SALARY')) return <CreditCard className="h-4 w-4 text-indigo-600" />;
    if (c.includes('ATTENDANCE')) return <Clock className="h-4 w-4 text-amber-600" />;
    if (c.includes('EMPLOYEE') || c.includes('MESSAGE') || c.includes('HR')) return <MessageSquare className="h-4 w-4 text-sky-600" />;
    if (c.includes('ANNOUNCEMENT') || c.includes('BROADCAST')) return <Bell className="h-4 w-4 text-indigo-600" />;
    if (c.includes('SECURITY') || c.includes('AUDIT') || c.includes('SYSTEM')) return <ShieldAlert className="h-4 w-4 text-rose-600" />;
    return <Bell className="h-4 w-4 text-slate-500" />;
  };

  // User Identity Context
  const employeeName = profileData?.name || user?.name || 'Employee';
  const employeeId = profileData?.employeeId || user?.employeeId || 'N/A';
  const designation = profileData?.designation || user?.designation || 'Team Member';
  const department = profileData?.department || user?.department || 'General';

  return (
    <AuthGuard allowedRoles={['EMPLOYEE', 'SUPER_ADMIN', 'ADMIN', 'HR', 'MANAGER']}>
      <AdminLayout
        allowedRoles={['EMPLOYEE', 'SUPER_ADMIN', 'ADMIN', 'HR', 'MANAGER']}
        pageTitle="My Notifications"
        breadcrumbs={[
          { label: 'My Workspace', href: '/employee/dashboard' },
          { label: 'Notifications', href: '/employee/notifications' },
        ]}
      >
        <div className="space-y-6 pb-12">
          {/* Toast Notification Banner */}
          {toastMessage && (
            <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-xs font-semibold text-white shadow-2xl animate-fade-in border border-slate-700">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>{toastMessage}</span>
            </div>
          )}

          {/* PAGE HEADER & USER CONTEXT BADGE */}
          <div className="flex flex-col gap-4 rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">My Notifications</h1>
                {kpis.unread > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-[11px] font-extrabold text-rose-700 border border-rose-200 animate-pulse">
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-600"></span>
                    {kpis.unread} Unread
                  </span>
                )}
                {kpis.unread === 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-extrabold text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                    All Caught Up
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Stay updated with official HR alerts, attendance updates, leave approvals, payroll payouts, and company announcements.
              </p>

              {/* Employee Context Pill */}
              <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-slate-600 font-medium">
                <div className="flex items-center gap-1.5 rounded-lg bg-slate-50 px-3 py-1 border border-slate-200/80">
                  <User className="h-3.5 w-3.5 text-slate-400" />
                  <span className="font-bold text-slate-800">{employeeName}</span>
                  <span className="text-[10px] text-slate-400 font-mono">({employeeId})</span>
                </div>
                <div className="flex items-center gap-1.5 rounded-lg bg-slate-50 px-3 py-1 border border-slate-200/80">
                  <Building2 className="h-3.5 w-3.5 text-slate-400" />
                  <span>{designation}</span>
                  <span className="text-slate-300">•</span>
                  <span className="font-semibold text-slate-700">{department}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                onClick={handleMarkAllRead}
                disabled={kpis.unread === 0 || isMarkingAllRead}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-slate-900 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                title="Mark all notifications as READ"
              >
                <CheckCheck className={`h-4 w-4 ${isMarkingAllRead ? 'animate-spin text-emerald-600' : 'text-emerald-600'}`} />
                <span>{isMarkingAllRead ? 'Marking...' : 'Mark All as Read'}</span>
              </button>

              <button
                onClick={() => fetchNotifications(true)}
                disabled={isRefreshing || isLoading}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 transition-all cursor-pointer disabled:opacity-50 shadow-xs"
                title="Refresh notifications inbox"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin text-indigo-400' : ''}`} />
                <span>{isRefreshing ? 'Refreshing...' : 'Refresh Inbox'}</span>
              </button>
            </div>
          </div>

          {/* ERROR ALERT BANNER */}
          {isError && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50/90 p-4 text-xs text-rose-800 shadow-xs flex items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
                <div>
                  <p className="font-bold text-rose-900">Failed to Load Notifications</p>
                  <p className="text-rose-700 mt-0.5">{errorMessage || 'An error occurred while connecting to the notification service.'}</p>
                </div>
              </div>
              <button
                onClick={() => fetchNotifications(true)}
                className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-700 transition-colors shrink-0 cursor-pointer"
              >
                Retry
              </button>
            </div>
          )}

          {/* REAL-DATA KPI SUMMARY CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Total Notifications */}
            <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all hover:shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Notifications</span>
                <div className="rounded-xl bg-slate-100 p-2 text-slate-600 border border-slate-200">
                  <Bell className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-3">
                {isLoading ? (
                  <div className="h-7 w-20 bg-slate-200 animate-pulse rounded-md"></div>
                ) : (
                  <span className="text-2xl font-extrabold text-slate-900 tracking-tight">{kpis.total}</span>
                )}
                <p className="text-[11px] font-medium text-slate-400 mt-1">Total received alerts</p>
              </div>
            </div>

            {/* Card 2: Unread Notifications */}
            <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all hover:shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Unread Alerts</span>
                <div className="rounded-xl bg-indigo-50 p-2 text-indigo-600 border border-indigo-100">
                  <Sparkles className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-3">
                {isLoading ? (
                  <div className="h-7 w-20 bg-slate-200 animate-pulse rounded-md"></div>
                ) : (
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-extrabold text-indigo-600 tracking-tight">{kpis.unread}</span>
                    <span className="text-xs text-indigo-500 font-semibold">unread</span>
                  </div>
                )}
                <p className="text-[11px] font-medium text-slate-400 mt-1">Requires your attention</p>
              </div>
            </div>

            {/* Card 3: Read Notifications */}
            <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all hover:shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Read / Archived</span>
                <div className="rounded-xl bg-emerald-50 p-2 text-emerald-600 border border-emerald-100">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-3">
                {isLoading ? (
                  <div className="h-7 w-20 bg-slate-200 animate-pulse rounded-md"></div>
                ) : (
                  <span className="text-2xl font-extrabold text-slate-900 tracking-tight">{kpis.read}</span>
                )}
                <p className="text-[11px] font-medium text-slate-400 mt-1">Acknowledged notifications</p>
              </div>
            </div>

            {/* Card 4: Today's Alerts */}
            <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all hover:shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Recent (Today)</span>
                <div className="rounded-xl bg-amber-50 p-2 text-amber-600 border border-amber-100">
                  <Clock className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-3">
                {isLoading ? (
                  <div className="h-7 w-20 bg-slate-200 animate-pulse rounded-md"></div>
                ) : (
                  <span className="text-2xl font-extrabold text-slate-900 tracking-tight">{kpis.today}</span>
                )}
                <p className="text-[11px] font-medium text-slate-400 mt-1">Received in last 24 hours</p>
              </div>
            </div>
          </div>

          {/* SEARCH & FILTER CONTROLS */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search notifications by title, message text, or category..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-2 text-xs font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:border-indigo-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Filter Dropdowns */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Status Filter */}
                <select
                  value={filterStatus}
                  onChange={(e) => {
                    setFilterStatus(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 focus:border-indigo-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 transition-all cursor-pointer"
                >
                  <option value="All">All Statuses</option>
                  <option value="UNREAD">Unread Only</option>
                  <option value="READ">Read Only</option>
                </select>

                {/* Category Filter */}
                <select
                  value={filterCategory}
                  onChange={(e) => {
                    setFilterCategory(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 focus:border-indigo-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 transition-all cursor-pointer"
                >
                  <option value="All">All Categories</option>
                  {categoryOptions.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>

                {/* Reset Filters */}
                {isFiltered && (
                  <button
                    onClick={resetFilters}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all cursor-pointer shadow-2xs"
                  >
                    <RotateCcw className="h-3.5 w-3.5 text-slate-400" />
                    <span>Reset</span>
                  </button>
                )}
              </div>
            </div>

            {/* Active Filter Badge */}
            {isFiltered && (
              <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 text-[11px] text-slate-500">
                <span>
                  Showing <strong className="text-slate-800">{filteredNotifications.length}</strong> of{' '}
                  <strong className="text-slate-800">{notifications.length}</strong> notifications
                </span>
              </div>
            )}
          </div>

          {/* MAIN CONTENT: NOTIFICATIONS FEED */}
          <div className="rounded-2xl border border-slate-200/90 bg-white shadow-xs overflow-hidden">
            <div className="border-b border-slate-200/80 bg-slate-50/60 px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-indigo-600" />
                <h2 className="text-sm font-extrabold text-slate-800">Notification Feed</h2>
              </div>
              <span className="text-xs text-slate-500 font-semibold">
                {filteredNotifications.length} {filteredNotifications.length === 1 ? 'alert' : 'alerts'}
              </span>
            </div>

            {isLoading ? (
              /* SKELETON LOADER FOR FEED */
              <div className="p-5 space-y-4">
                {[1, 2, 3, 4].map((idx) => (
                  <div key={idx} className="animate-pulse flex items-start gap-4 border-b border-slate-100 pb-4">
                    <div className="h-9 w-9 bg-slate-200 rounded-xl shrink-0"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-48 bg-slate-200 rounded-md"></div>
                      <div className="h-3 w-72 bg-slate-100 rounded-md"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : notifications.length === 0 ? (
              /* ZERO NOTIFICATIONS EMPTY STATE */
              <div className="p-12 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-300 mb-4">
                  <Inbox className="h-7 w-7" />
                </div>
                <h3 className="text-base font-bold text-slate-800">Your notifications inbox is empty</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1.5 leading-relaxed font-medium">
                  When HR or system events occur (leave decisions, payroll updates, announcements), alerts will appear here.
                </p>
              </div>
            ) : filteredNotifications.length === 0 ? (
              /* SEARCH FILTER EMPTY STATE */
              <div className="p-10 text-center text-xs text-slate-500">
                <Search className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                <p className="font-bold text-slate-700 text-sm">No matching notifications found</p>
                <p className="text-xs text-slate-400 mt-1">Try changing your filters or search keywords.</p>
                <button
                  onClick={resetFilters}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3 py-2 text-xs font-bold text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Clear Filters</span>
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredNotifications.map((notif) => {
                  const notifId = notif.id || notif._id || Math.random().toString();
                  const isUnread = notif.status === 'UNREAD' || (!notif.status && !notif.isRead);
                  const relTime = formatRelativeTime(notif.createdAt);
                  const categoryName = (notif.category || 'SYSTEM').toUpperCase();
                  const targetUrl = notif.actionUrl || notif.link;

                  return (
                    <div
                      key={notifId}
                      onClick={() => handleNotificationClick(notif)}
                      className={`p-4 sm:p-5 transition-all cursor-pointer group flex items-start gap-4 ${
                        isUnread
                          ? 'bg-indigo-50/40 hover:bg-indigo-50/80 border-l-4 border-indigo-600'
                          : 'hover:bg-slate-50/80 border-l-4 border-transparent'
                      }`}
                    >
                      {/* Icon */}
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white border border-slate-200/80 shadow-2xs group-hover:scale-105 transition-transform">
                        {getCategoryIcon(notif.category, notif.eventType)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h3 className={`text-xs font-bold ${isUnread ? 'text-slate-900 font-extrabold' : 'text-slate-800'}`}>
                            {notif.title}
                          </h3>

                          {/* Category Badge */}
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-extrabold text-slate-600 border border-slate-200">
                            {categoryName}
                          </span>

                          {/* Unread Status Pill */}
                          {isUnread && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-extrabold text-indigo-700">
                              <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 animate-pulse"></span>
                              NEW
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-600 leading-relaxed font-medium line-clamp-2">{notif.message}</p>

                        <div className="mt-2 flex items-center gap-3 text-[11px] text-slate-400 font-medium">
                          <span className="font-mono">{relTime}</span>

                          {/* Action Link Hint */}
                          {targetUrl && (
                            <span className="inline-flex items-center gap-1 text-indigo-600 font-semibold group-hover:underline">
                              <span>Open Target</span>
                              <ExternalLink className="h-3 w-3" />
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 shrink-0 self-center">
                        {isUnread && (
                          <button
                            onClick={(e) => handleMarkAsRead(notifId, e)}
                            disabled={markingReadId === notifId}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-indigo-100 hover:text-indigo-700 transition-colors cursor-pointer"
                            title="Mark as read"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                        )}

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedNotif(notif);
                          }}
                          className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer shadow-2xs"
                          title="View notification details"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* NOTIFICATION DETAILS MODAL */}
          {selectedNotif && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs animate-fade-in">
              <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-5">
                {/* Modal Header */}
                <div className="flex items-start justify-between border-b border-slate-200 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 border border-indigo-100">
                      {getCategoryIcon(selectedNotif.category, selectedNotif.eventType)}
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 block">
                        {selectedNotif.category || 'Notification'}
                      </span>
                      <h3 className="text-base font-extrabold text-slate-900">{selectedNotif.title}</h3>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedNotif(null)}
                    className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Full Message Body */}
                <div className="rounded-xl bg-slate-50 p-4 border border-slate-200/80 text-xs text-slate-700 leading-relaxed font-medium">
                  {selectedNotif.message}
                </div>

                {/* Metadata Details */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="rounded-lg bg-slate-50 p-2.5 border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Received Time</span>
                    <span className="font-semibold text-slate-800 font-mono">
                      {selectedNotif.createdAt ? new Date(selectedNotif.createdAt).toLocaleString() : 'N/A'}
                    </span>
                  </div>

                  <div className="rounded-lg bg-slate-50 p-2.5 border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Read Status</span>
                    <span className="font-semibold text-slate-800">
                      {selectedNotif.status === 'READ' || selectedNotif.isRead ? 'READ' : 'UNREAD'}
                    </span>
                  </div>
                </div>

                {/* Modal Footer Actions */}
                <div className="flex items-center justify-between border-t border-slate-200 pt-4">
                  {(selectedNotif.actionUrl || selectedNotif.link) ? (
                    <button
                      onClick={() => {
                        const target = selectedNotif.actionUrl || selectedNotif.link;
                        setSelectedNotif(null);
                        if (target && target.startsWith('/')) router.push(target);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 transition-colors cursor-pointer"
                    >
                      <span>Open Related Section</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </button>
                  ) : (
                    <div></div>
                  )}

                  <button
                    onClick={() => setSelectedNotif(null)}
                    className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </AdminLayout>
    </AuthGuard>
  );
}
