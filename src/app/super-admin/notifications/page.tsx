'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { SuperAdminLayout } from '@/components/layout/SuperAdminLayout';
import {
  Bell,
  CheckCircle2,
  Search,
  Filter,
  Trash2,
  CheckCheck,
  RefreshCw,
  AlertTriangle,
  Info,
  ShieldAlert,
  Clock,
  Building2,
  User,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  X,
  SlidersHorizontal,
  CheckSquare,
  Square,
  AlertCircle,
  Database,
  Layers,
  Calendar,
  Sparkles,
  Eye,
} from 'lucide-react';

interface NotificationItem {
  id: string;
  _id?: string;
  organizationId: string;
  recipientType?: string;
  recipientId?: string;
  targetScope?: string;
  eventType?: string;
  category: string;
  title: string;
  message: string;
  priority: string; // 'CRITICAL' | 'HIGH' | 'WARNING' | 'NORMAL' | 'INFO' | 'SUCCESS'
  status: 'READ' | 'UNREAD';
  isRead: boolean;
  actionUrl?: string | null;
  metadata?: Record<string, any>;
  createdAt: string;
  readAt?: string | null;
}

interface NotificationKpis {
  total: number;
  unread: number;
  read: number;
  critical: number;
  warnings: number;
  today: number;
  systemAlerts: number;
}

interface OrganizationOption {
  id: string;
  name: string;
}

export default function SuperAdminNotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [kpis, setKpis] = useState<NotificationKpis>({
    total: 0,
    unread: 0,
    read: 0,
    critical: 0,
    warnings: 0,
    today: 0,
    systemAlerts: 0,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Retention info
  const [retentionDays, setRetentionDays] = useState<number | null>(90);

  // Organizations for filter
  const [organizations, setOrganizations] = useState<OrganizationOption[]>([]);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedDateRange, setSelectedDateRange] = useState<string>('ALL_TIME');
  const [selectedOrgId, setSelectedOrgId] = useState<string>('ALL');

  // Pagination
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(25);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);

  // Bulk Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkExecuting, setIsBulkExecuting] = useState(false);

  // Detail Modal
  const [detailItem, setDetailItem] = useState<NotificationItem | null>(null);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Fetch Organizations list for filter dropdown
  const fetchOrganizations = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/super-admin/organizations');
      if (res.ok) {
        const result = await res.json();
        if (result.success && Array.isArray(result.organizations)) {
          setOrganizations(
            result.organizations.map((o: any) => ({
              id: o.id || String(o._id),
              name: o.name || o.organizationName || o.id,
            }))
          );
        }
      }
    } catch (err) {
      console.error('Failed to fetch organizations list for filter:', err);
    }
  }, []);

  // Fetch Retention policy info
  const fetchRetention = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/notifications/retention');
      if (res.ok) {
        const result = await res.json();
        if (result.success && result.retentionDays) {
          setRetentionDays(result.retentionDays);
        }
      }
    } catch {}
  }, []);

  // Main Notifications Fetcher
  const fetchNotifications = useCallback(
    async (showSpin = true) => {
      if (showSpin) setIsRefreshing(true);
      setHasError(false);

      try {
        const params = new URLSearchParams();
        params.set('page', String(page));
        params.set('limit', String(limit));

        if (searchTerm.trim()) params.set('search', searchTerm.trim());
        if (selectedCategory !== 'ALL') params.set('category', selectedCategory);
        if (selectedSeverity !== 'ALL') params.set('priority', selectedSeverity);
        if (selectedStatus !== 'ALL') params.set('status', selectedStatus);
        if (selectedOrgId !== 'ALL') params.set('orgId', selectedOrgId);

        if (selectedDateRange === 'TODAY') params.set('dateRange', 'today');
        else if (selectedDateRange === 'LAST_7_DAYS') params.set('dateRange', 'last7days');
        else if (selectedDateRange === 'LAST_30_DAYS') params.set('dateRange', 'last30days');

        const res = await fetch(`/api/v1/notifications?${params.toString()}`);
        if (!res.ok) {
          throw new Error(`Server returned HTTP ${res.status}`);
        }

        const result = await res.json();
        if (result.success) {
          const list = result.notifications || result.data || [];
          setNotifications(list);

          if (result.pagination) {
            setTotalPages(result.pagination.totalPages || 1);
            setTotalItems(result.pagination.total || list.length);
          } else {
            setTotalItems(result.totalCount || list.length);
            setTotalPages(Math.ceil((result.totalCount || list.length) / limit) || 1);
          }

          if (result.kpis) {
            setKpis(result.kpis);
          }
        } else {
          throw new Error(result.message || 'Failed to fetch notifications');
        }
      } catch (err: any) {
        console.error('Error loading notifications:', err);
        setHasError(true);
        setErrorMessage(err.message || 'Failed to load notifications');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [page, limit, searchTerm, selectedCategory, selectedSeverity, selectedStatus, selectedOrgId, selectedDateRange]
  );

  // Initial load & Polling
  useEffect(() => {
    fetchOrganizations();
    fetchRetention();
  }, [fetchOrganizations, fetchRetention]);

  useEffect(() => {
    fetchNotifications(true);
  }, [fetchNotifications]);

  // Live Auto-Refresh (Every 30s)
  useEffect(() => {
    const timer = setInterval(() => {
      fetchNotifications(false);
    }, 30000);
    return () => clearInterval(timer);
  }, [fetchNotifications]);

  // Handle Page Reset on Filter Changes
  const handleFilterChange = (setter: (val: any) => void, value: any) => {
    setter(value);
    setPage(1);
    setSelectedIds([]);
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setSelectedCategory('ALL');
    setSelectedSeverity('ALL');
    setSelectedStatus('ALL');
    setSelectedDateRange('ALL_TIME');
    setSelectedOrgId('ALL');
    setPage(1);
    setSelectedIds([]);
  };

  // Mark Single Read / Unread
  const toggleReadStatus = async (item: NotificationItem, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const endpoint = item.isRead
      ? `/api/v1/notifications/${item.id}/unread`
      : `/api/v1/notifications/${item.id}/read`;

    try {
      const res = await fetch(endpoint, { method: 'PATCH' });
      const result = await res.json();
      if (res.ok && result.success) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === item.id ? { ...n, isRead: !item.isRead, status: item.isRead ? 'UNREAD' : 'READ' } : n))
        );
        showToast(item.isRead ? 'Notification marked as UNREAD' : 'Notification marked as READ');
        fetchNotifications(false);
      } else {
        showToast(result.message || 'Action failed', 'error');
      }
    } catch {
      showToast('Network error updating status', 'error');
    }
  };

  // Delete Single
  const deleteSingle = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      const res = await fetch(`/api/v1/notifications/${id}`, { method: 'DELETE' });
      const result = await res.json();
      if (res.ok && result.success) {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        setSelectedIds((prev) => prev.filter((i) => i !== id));
        showToast('Notification deleted');
        fetchNotifications(false);
      } else {
        showToast(result.message || 'Failed to delete notification', 'error');
      }
    } catch {
      showToast('Failed to delete notification', 'error');
    }
  };

  // Mark All As Read
  const markAllAsRead = async () => {
    try {
      const res = await fetch('/api/v1/notifications/mark-all-read', { method: 'PATCH' });
      const result = await res.json();
      if (res.ok && result.success) {
        showToast(`Marked ${result.updatedCount || 'all'} notifications as READ`);
        fetchNotifications(true);
      } else {
        showToast(result.message || 'Failed to mark all as read', 'error');
      }
    } catch {
      showToast('Error marking all notifications as read', 'error');
    }
  };

  // Bulk Operations
  const handleBulkAction = async (action: 'markRead' | 'markUnread' | 'delete') => {
    if (!selectedIds.length) return;
    setIsBulkExecuting(true);
    try {
      const res = await fetch('/api/v1/notifications/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ids: selectedIds }),
      });
      const result = await res.json();
      if (res.ok && result.success) {
        showToast(`Bulk ${action} completed for ${result.modifiedCount || selectedIds.length} items`);
        setSelectedIds([]);
        fetchNotifications(true);
      } else {
        showToast(result.message || 'Bulk operation failed', 'error');
      }
    } catch {
      showToast('Bulk request failed', 'error');
    } finally {
      setIsBulkExecuting(false);
    }
  };

  // Select All Checkbox Handler
  const toggleSelectAll = () => {
    if (selectedIds.length === notifications.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(notifications.map((n) => n.id));
    }
  };

  const toggleSelectOne = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  // Helpers for Icons and Badges
  const getCategoryIcon = (category: string, priority: string) => {
    const cat = (category || '').toUpperCase();
    const prio = (priority || '').toUpperCase();

    if (prio === 'CRITICAL' || prio === 'URGENT') return <ShieldAlert className="h-4 w-4 text-rose-600" />;
    if (cat.includes('SECURITY') || cat.includes('AUDIT')) return <ShieldAlert className="h-4 w-4 text-rose-600" />;
    if (cat.includes('SYSTEM') || cat.includes('INTEGRATION')) return <Database className="h-4 w-4 text-indigo-600" />;
    if (cat.includes('PAYROLL') || cat.includes('LEAVE')) return <Layers className="h-4 w-4 text-amber-600" />;
    if (cat.includes('EMPLOYEE') || cat.includes('USER')) return <User className="h-4 w-4 text-blue-600" />;
    return <Bell className="h-4 w-4 text-indigo-600" />;
  };

  const renderSeverityBadge = (priority: string) => {
    const p = (priority || 'NORMAL').toUpperCase();
    if (p === 'CRITICAL' || p === 'URGENT') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-black text-rose-800 border border-rose-300">
          <AlertCircle className="h-3 w-3 text-rose-600" /> CRITICAL
        </span>
      );
    }
    if (p === 'HIGH' || p === 'WARNING') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-black text-amber-800 border border-amber-300">
          <AlertTriangle className="h-3 w-3 text-amber-600" /> WARNING
        </span>
      );
    }
    if (p === 'SUCCESS') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black text-emerald-800 border border-emerald-300">
          <CheckCircle2 className="h-3 w-3 text-emerald-600" /> SUCCESS
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-black text-indigo-700 border border-indigo-200">
        <Info className="h-3 w-3 text-indigo-600" /> INFO
      </span>
    );
  };

  const sanitizeMetadata = (meta?: Record<string, any>) => {
    if (!meta || typeof meta !== 'object') return {};
    const sanitized: Record<string, any> = {};
    const sensitive = ['password', 'token', 'secret', 'hash', 'otp', 'key', 'auth'];

    Object.keys(meta).forEach((key) => {
      const lower = key.toLowerCase();
      if (sensitive.some((s) => lower.includes(s))) {
        sanitized[key] = '••••••••';
      } else {
        sanitized[key] = meta[key];
      }
    });
    return sanitized;
  };

  const startRecord = (page - 1) * limit + 1;
  const endRecord = Math.min(page * limit, totalItems);

  return (
    <SuperAdminLayout
      pageTitle="Super Admin Notification Operations Center"
      breadcrumbs={[{ label: 'Notifications', href: '/super-admin/notifications' }]}
    >
      {/* Toast Alert */}
      {toast && (
        <div
          className={`fixed right-6 top-20 z-50 flex items-center gap-2 rounded-xl px-4 py-3 text-xs font-bold text-white shadow-2xl transition-all border ${
            toast.type === 'success' ? 'bg-slate-900 border-slate-700' : 'bg-rose-900 border-rose-700'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          ) : (
            <AlertCircle className="h-4 w-4 text-rose-400" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      <div className="space-y-6">
        {/* Header Title Banner */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-extrabold text-slate-900">System Notification Control Center</h2>
              <span className="flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-black text-emerald-800 border border-emerald-300">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                LIVE STREAM
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Monitor platform-wide alerts, security event broadcasts, and tenant lifecycle audit updates in real-time
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => fetchNotifications(true)}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 text-indigo-600 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>

            <button
              onClick={markAllAsRead}
              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-4 py-2 text-xs font-bold text-white shadow-xs transition-colors"
            >
              <CheckCheck className="h-4 w-4" />
              <span>Mark All as Read</span>
            </button>
          </div>
        </div>

        {/* Retention Policy Banner */}
        {retentionDays !== null && (
          <div className="flex items-center justify-between rounded-xl bg-indigo-50/50 p-3 border border-indigo-100 text-xs">
            <div className="flex items-center gap-2 text-indigo-900 font-semibold">
              <Info className="h-4 w-4 text-indigo-600 shrink-0" />
              <span>
                Automated Notification Retention Policy: <strong>{retentionDays} Days</strong>. Old read alerts are automatically archived by backend cron.
              </span>
            </div>
            <a
              href="/super-admin/settings"
              className="text-[11px] font-extrabold text-indigo-700 hover:underline flex items-center gap-1"
            >
              <span>Configure Policy</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )}

        {/* Executive Summary KPI Row */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-extrabold uppercase">Total Alerts</span>
              <Bell className="h-4 w-4 text-indigo-600" />
            </div>
            <div className="mt-2 text-2xl font-black text-slate-900">{kpis.total}</div>
            <div className="mt-1 text-[10px] font-semibold text-slate-400">Total in Scope</div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-extrabold uppercase">Unread</span>
              <span className="h-2 w-2 rounded-full bg-indigo-600"></span>
            </div>
            <div className="mt-2 text-2xl font-black text-indigo-600">{kpis.unread}</div>
            <div className="mt-1 text-[10px] font-semibold text-indigo-600">Pending Action</div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-extrabold uppercase">Critical</span>
              <AlertCircle className="h-4 w-4 text-rose-600" />
            </div>
            <div className="mt-2 text-2xl font-black text-rose-600">{kpis.critical}</div>
            <div className="mt-1 text-[10px] font-semibold text-rose-600">High Priority</div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-extrabold uppercase">Warnings</span>
              <AlertTriangle className="h-4 w-4 text-amber-600" />
            </div>
            <div className="mt-2 text-2xl font-black text-amber-600">{kpis.warnings}</div>
            <div className="mt-1 text-[10px] font-semibold text-amber-600">Requires Attention</div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-extrabold uppercase">Today</span>
              <Calendar className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="mt-2 text-2xl font-black text-emerald-700">{kpis.today}</div>
            <div className="mt-1 text-[10px] font-semibold text-emerald-600">Received Today</div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-extrabold uppercase">System Alerts</span>
              <ShieldAlert className="h-4 w-4 text-purple-600" />
            </div>
            <div className="mt-2 text-2xl font-black text-purple-700">{kpis.systemAlerts}</div>
            <div className="mt-1 text-[10px] font-semibold text-purple-600">Audit & Security</div>
          </div>
        </div>

        {/* Category Pills Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'ALL', label: 'ALL CATEGORIES' },
            { id: 'UNREAD', label: 'UNREAD' },
            { id: 'READ', label: 'READ' },
            { id: 'SECURITY', label: 'SECURITY' },
            { id: 'ORGANIZATION', label: 'ORGANIZATION' },
            { id: 'USER_ACCESS', label: 'USER & ACCESS' },
            { id: 'EMPLOYEE', label: 'EMPLOYEE' },
            { id: 'ATTENDANCE', label: 'ATTENDANCE' },
            { id: 'LEAVE', label: 'LEAVE' },
            { id: 'PAYROLL', label: 'PAYROLL' },
            { id: 'SYSTEM', label: 'SYSTEM' },
            { id: 'INTEGRATION', label: 'INTEGRATION' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleFilterChange(setSelectedCategory, cat.id)}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search & Comprehensive Filters Toolbar */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => handleFilterChange(setSearchTerm, e.target.value)}
                placeholder="Search by title, message, category, event type, organization..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-2.5 text-xs font-medium text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            {/* Filter Dropdowns */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Severity Dropdown */}
              <select
                value={selectedSeverity}
                onChange={(e) => handleFilterChange(setSelectedSeverity, e.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-500"
              >
                <option value="ALL">Severity: All</option>
                <option value="CRITICAL">Critical / Urgent</option>
                <option value="WARNING">Warning / High</option>
                <option value="SUCCESS">Success</option>
                <option value="INFO">Info / Normal</option>
              </select>

              {/* Read / Unread Status Dropdown */}
              <select
                value={selectedStatus}
                onChange={(e) => handleFilterChange(setSelectedStatus, e.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-500"
              >
                <option value="ALL">Status: All</option>
                <option value="UNREAD">Unread Only</option>
                <option value="READ">Read Only</option>
              </select>

              {/* Date Range Dropdown */}
              <select
                value={selectedDateRange}
                onChange={(e) => handleFilterChange(setSelectedDateRange, e.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-500"
              >
                <option value="ALL_TIME">Date: All Time</option>
                <option value="TODAY">Today Only</option>
                <option value="LAST_7_DAYS">Last 7 Days</option>
                <option value="LAST_30_DAYS">Last 30 Days</option>
              </select>

              {/* Organization Filter Dropdown */}
              <select
                value={selectedOrgId}
                onChange={(e) => handleFilterChange(setSelectedOrgId, e.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-500 max-w-[180px] truncate"
              >
                <option value="ALL">Organization: All</option>
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
              </select>

              {(searchTerm ||
                selectedCategory !== 'ALL' ||
                selectedSeverity !== 'ALL' ||
                selectedStatus !== 'ALL' ||
                selectedDateRange !== 'ALL_TIME' ||
                selectedOrgId !== 'ALL') && (
                <button
                  onClick={clearAllFilters}
                  className="flex items-center gap-1 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                  <span>Clear Filters</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Bulk Action Toolbar Bar (Appears when items selected) */}
        {selectedIds.length > 0 && (
          <div className="flex items-center justify-between rounded-2xl bg-indigo-900 p-4 text-white shadow-xl animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-3">
              <span className="rounded-lg bg-indigo-700 px-3 py-1 text-xs font-black">
                {selectedIds.length} SELECTED
              </span>
              <span className="text-xs text-indigo-200 hidden sm:inline-block">
                Apply batch actions to selected system notifications
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleBulkAction('markRead')}
                disabled={isBulkExecuting}
                className="flex items-center gap-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Mark Read</span>
              </button>

              <button
                onClick={() => handleBulkAction('markUnread')}
                disabled={isBulkExecuting}
                className="flex items-center gap-1 rounded-xl bg-indigo-700 hover:bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50"
              >
                <Clock className="h-3.5 w-3.5" />
                <span>Mark Unread</span>
              </button>

              <button
                onClick={() => handleBulkAction('delete')}
                disabled={isBulkExecuting}
                className="flex items-center gap-1 rounded-xl bg-rose-600 hover:bg-rose-700 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete</span>
              </button>

              <button
                onClick={() => setSelectedIds([])}
                className="rounded-xl p-1 text-indigo-300 hover:text-white hover:bg-indigo-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        {/* Main Notification Stream Area */}
        {isLoading ? (
          /* Loading Skeletons */
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((idx) => (
              <div key={idx} className="animate-pulse rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex items-start justify-between">
                <div className="flex items-start gap-3.5 w-full">
                  <div className="h-10 w-10 rounded-xl bg-slate-200 shrink-0" />
                  <div className="space-y-2 w-full max-w-xl">
                    <div className="h-4 w-48 rounded bg-slate-200" />
                    <div className="h-3 w-full rounded bg-slate-100" />
                    <div className="h-3 w-3/4 rounded bg-slate-100" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : hasError ? (
          /* Error State */
          <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-12 text-center shadow-xs">
            <AlertCircle className="mx-auto h-10 w-10 text-rose-500" />
            <h3 className="mt-3 text-base font-extrabold text-slate-900">Unable to Load Notifications</h3>
            <p className="mt-1 text-xs text-slate-600 max-w-md mx-auto">{errorMessage}</p>
            <button
              onClick={() => fetchNotifications(true)}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-rose-600 hover:bg-rose-700 px-4 py-2 text-xs font-bold text-white shadow-xs"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Retry Request</span>
            </button>
          </div>
        ) : notifications.length === 0 ? (
          /* Empty State */
          <div className="rounded-2xl border border-slate-200 bg-white p-16 text-center shadow-xs">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600">
              <Sparkles className="h-8 w-8" />
            </div>
            <h3 className="mt-4 text-base font-extrabold text-slate-900">You&apos;re All Caught Up</h3>
            <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
              No system notifications or audit alerts match your active filter parameters.
            </p>
            <button
              onClick={clearAllFilters}
              className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          /* Notification List */
          <div className="space-y-3">
            {/* Header select-all bar */}
            <div className="flex items-center justify-between px-2 text-xs text-slate-500 font-semibold">
              <button
                onClick={toggleSelectAll}
                className="flex items-center gap-2 hover:text-slate-900 transition-colors"
              >
                {selectedIds.length === notifications.length ? (
                  <CheckSquare className="h-4 w-4 text-indigo-600" />
                ) : (
                  <Square className="h-4 w-4 text-slate-400" />
                )}
                <span>Select All on Page ({notifications.length})</span>
              </button>

              <span>
                Showing {startRecord}–{endRecord} of {totalItems}
              </span>
            </div>

            {notifications.map((item) => {
              const isSelected = selectedIds.includes(item.id);
              return (
                <div
                  key={item.id}
                  onClick={() => setDetailItem(item)}
                  className={`group relative flex flex-col sm:flex-row sm:items-center sm:justify-between rounded-2xl border p-4 shadow-xs transition-all cursor-pointer ${
                    !item.isRead
                      ? 'border-indigo-200 bg-indigo-50/20 hover:border-indigo-300'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md'
                  } ${isSelected ? 'ring-2 ring-indigo-600 bg-indigo-50/40' : ''}`}
                >
                  <div className="flex items-start gap-3.5">
                    {/* Checkbox */}
                    <button
                      onClick={(e) => toggleSelectOne(item.id, e)}
                      className="mt-1 rounded text-indigo-600 hover:scale-110 transition-transform"
                    >
                      {isSelected ? (
                        <CheckSquare className="h-4 w-4 text-indigo-600" />
                      ) : (
                        <Square className="h-4 w-4 text-slate-300 hover:text-slate-500" />
                      )}
                    </button>

                    {/* Category Icon */}
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-50 border border-slate-100 shadow-xs">
                      {getCategoryIcon(item.category, item.priority)}
                    </div>

                    {/* Main Content */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-extrabold text-slate-900 leading-snug">{item.title}</h4>
                        {!item.isRead && (
                          <span className="h-2 w-2 rounded-full bg-indigo-600 animate-pulse"></span>
                        )}
                        {renderSeverityBadge(item.priority)}
                        <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-[10px] font-mono font-bold text-slate-600 uppercase">
                          {item.category}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">{item.message}</p>

                      <div className="flex items-center gap-3 text-[10px] font-mono text-slate-400 pt-1 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-slate-400" />
                          {new Date(item.createdAt).toLocaleString()}
                        </span>

                        <span className="flex items-center gap-1 font-bold text-slate-500">
                          <Building2 className="h-3 w-3 text-slate-400" />
                          Org: {item.organizationId}
                        </span>

                        {item.recipientId && (
                          <span className="flex items-center gap-1 text-slate-400">
                            <User className="h-3 w-3" />
                            To: {item.recipientId}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions Right */}
                  <div className="mt-3 sm:mt-0 flex items-center justify-end gap-1.5 border-t sm:border-t-0 border-slate-100 pt-2 sm:pt-0">
                    <button
                      onClick={(e) => toggleReadStatus(item, e)}
                      className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100"
                      title={item.isRead ? 'Mark as Unread' : 'Mark as Read'}
                    >
                      <CheckCircle2 className={`h-3.5 w-3.5 ${item.isRead ? 'text-emerald-600' : 'text-slate-400'}`} />
                      <span className="hidden md:inline">{item.isRead ? 'Unread' : 'Read'}</span>
                    </button>

                    <button
                      onClick={(e) => deleteSingle(item.id, e)}
                      className="rounded-xl border border-slate-200 bg-slate-50 p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200"
                      title="Delete Notification"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Footer Controls */}
        {totalItems > 0 && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
              <span>Show per page:</span>
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
                className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-700 focus:outline-none"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span className="text-slate-400 font-mono">
                (Showing {startRecord}–{endRecord} of {totalItems})
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Previous</span>
              </button>

              <span className="text-xs font-mono font-bold text-slate-700 px-2">
                Page {page} of {totalPages}
              </span>

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
              >
                <span>Next</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* NOTIFICATION DETAILS MODAL */}
      {detailItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-50 border border-slate-100">
                  {getCategoryIcon(detailItem.category, detailItem.priority)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-extrabold text-slate-900">{detailItem.title}</h3>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    {renderSeverityBadge(detailItem.priority)}
                    <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-mono font-bold text-slate-700">
                      {detailItem.category}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setDetailItem(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              <div>
                <label className="font-extrabold text-slate-400 text-[10px] uppercase">Message Payload</label>
                <div className="mt-1 rounded-xl bg-slate-50 p-3.5 border border-slate-100 text-slate-800 leading-relaxed font-medium">
                  {detailItem.message}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold block">Organization ID</span>
                  <span className="font-mono font-bold text-slate-900">{detailItem.organizationId}</span>
                </div>
                <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold block">Event Type</span>
                  <span className="font-mono font-bold text-indigo-700">{detailItem.eventType || 'N/A'}</span>
                </div>
                <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold block">Created Timestamp</span>
                  <span className="font-mono text-slate-700">{new Date(detailItem.createdAt).toLocaleString()}</span>
                </div>
                <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold block">Read Status</span>
                  <span className={`font-bold ${detailItem.isRead ? 'text-emerald-600' : 'text-indigo-600'}`}>
                    {detailItem.isRead ? `READ (${detailItem.readAt ? new Date(detailItem.readAt).toLocaleTimeString() : 'Yes'})` : 'UNREAD'}
                  </span>
                </div>
              </div>

              {detailItem.metadata && Object.keys(detailItem.metadata).length > 0 && (
                <div>
                  <label className="font-extrabold text-slate-400 text-[10px] uppercase">Sanitized Event Metadata</label>
                  <pre className="mt-1 rounded-xl bg-slate-900 p-3 font-mono text-[11px] text-emerald-400 overflow-x-auto">
                    {JSON.stringify(sanitizeMetadata(detailItem.metadata), null, 2)}
                  </pre>
                </div>
              )}

              {detailItem.actionUrl && (
                <div className="pt-2">
                  <a
                    href={detailItem.actionUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-4 py-2 font-bold text-white text-xs shadow-xs"
                  >
                    <span>Open Related Resource</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end border-t border-slate-100 pt-4">
              <button
                onClick={() => setDetailItem(null)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </SuperAdminLayout>
  );
}
