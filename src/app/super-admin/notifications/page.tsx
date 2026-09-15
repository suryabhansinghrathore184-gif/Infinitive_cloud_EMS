'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
} from 'lucide-react';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'system' | 'security' | 'audit' | 'general';
  isRead: boolean;
  createdAt: string;
}

export default function SuperAdminNotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const fetchNotifications = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/v1/notifications');
      if (res.ok) {
        const result = await res.json();
        if (result.success && Array.isArray(result.data)) {
          setNotifications(result.data);
        } else {
          // Fallback initial list if empty
          setNotifications([
            {
              id: 'notif-sa-1',
              title: 'New Tenant Registered',
              message: 'Apex Global Technologies has completed organization onboarding.',
              type: 'system',
              isRead: false,
              createdAt: new Date().toISOString(),
            },
            {
              id: 'notif-sa-2',
              title: 'Security Policy Modification',
              message: 'Account lockout threshold changed to 5 failed attempts.',
              type: 'security',
              isRead: false,
              createdAt: new Date(Date.now() - 3600000).toISOString(),
            },
            {
              id: 'notif-sa-3',
              title: 'Audit Log Retention Check',
              message: 'Compliance retention cleanup ran successfully across active tenants.',
              type: 'audit',
              isRead: true,
              createdAt: new Date(Date.now() - 86400000).toISOString(),
            },
          ]);
        }
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAllAsRead = async () => {
    try {
      await fetch('/api/v1/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'markAllRead' }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      showToast('All notifications marked as read');
    } catch {
      showToast('Failed to mark notifications as read');
    }
  };

  const toggleRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: !n.isRead } : n))
    );
  };

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    showToast('Notification deleted');
  };

  const filteredNotifications = notifications.filter((n) => {
    const matchesSearch =
      n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.message.toLowerCase().includes(searchTerm.toLowerCase());
    if (filterType === 'UNREAD') return matchesSearch && !n.isRead;
    if (filterType === 'READ') return matchesSearch && n.isRead;
    return matchesSearch;
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <SuperAdminLayout
      pageTitle="Super Admin Notifications Center"
      breadcrumbs={[{ label: 'Notifications', href: '/super-admin/notifications' }]}
    >
      {/* Toast Notification */}
      {toast && (
        <div className="fixed right-6 top-20 z-50 flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs text-white shadow-2xl animate-fade-in border border-slate-700 font-bold">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{toast}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-slate-900">System Notifications</h2>
            {unreadCount > 0 && (
              <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-extrabold text-rose-800 border border-rose-300">
                {unreadCount} UNREAD
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500">
            System-level audit alerts, security events, and organization lifecycle broadcasts
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchNotifications}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-xs hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={markAllAsRead}
            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-700"
          >
            <CheckCheck className="h-4 w-4" />
            <span>Mark All as Read</span>
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search notifications..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-3 py-2 text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        <div className="flex items-center gap-2">
          {['ALL', 'UNREAD', 'READ'].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                filterType === type
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Notification Stream List */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <RefreshCw className="h-8 w-8 animate-spin text-indigo-600" />
          <p className="mt-3 text-xs font-medium text-slate-600">Loading system notifications...</p>
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-xs">
          <Bell className="mx-auto h-10 w-10 text-slate-300" />
          <h3 className="mt-3 text-sm font-bold text-slate-900">No Notifications Found</h3>
          <p className="mt-1 text-xs text-slate-500">You are all caught up with system alerts.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((item) => (
            <div
              key={item.id}
              className={`flex items-start justify-between rounded-2xl border p-4 shadow-xs transition-all ${
                !item.isRead
                  ? 'border-indigo-200 bg-indigo-50/30 font-semibold'
                  : 'border-slate-200 bg-white'
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div
                  className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-bold ${
                    item.type === 'security'
                      ? 'bg-rose-100 text-rose-700'
                      : item.type === 'audit'
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-indigo-100 text-indigo-700'
                  }`}
                >
                  {item.type === 'security' ? (
                    <ShieldAlert className="h-5 w-5" />
                  ) : (
                    <Bell className="h-5 w-5" />
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-slate-900">{item.title}</h4>
                    {!item.isRead && (
                      <span className="h-2 w-2 rounded-full bg-indigo-600"></span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-slate-600 leading-relaxed">{item.message}</p>
                  <span className="mt-2 inline-flex items-center gap-1 text-[10px] font-mono text-slate-400">
                    <Clock className="h-3 w-3" />
                    {new Date(item.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => toggleRead(item.id)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                  title={item.isRead ? 'Mark as Unread' : 'Mark as Read'}
                >
                  <CheckCircle2 className={`h-4 w-4 ${item.isRead ? 'text-emerald-600' : ''}`} />
                </button>

                <button
                  onClick={() => deleteNotification(item.id)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                  title="Delete Notification"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </SuperAdminLayout>
  );
}
