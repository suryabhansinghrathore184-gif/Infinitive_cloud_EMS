'use client';

import React, { useState, useEffect } from 'react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Bell, RefreshCw, CheckCircle2, Inbox } from 'lucide-react';

interface NotificationItem {
  _id?: string;
  id?: string;
  title?: string;
  message?: string;
  createdAt?: string;
  status?: string;
}

export default function EmployeeNotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/v1/notifications');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setNotifications(data.data || []);
        }
      }
    } catch (err) {
      console.error('Error fetching employee notifications:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      const res = await fetch('/api/v1/notifications/mark-all-read', { method: 'POST' });
      if (res.ok) {
        fetchNotifications();
      }
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

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
        <div className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">My Inbox Notifications</h1>
              <p className="text-xs text-slate-500 mt-1">
                View personal system alerts, leave decision updates, helpdesk responses, and company broadcasts.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleMarkAllRead}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 cursor-pointer"
              >
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                <span>Mark All as Read</span>
              </button>
              <button
                onClick={fetchNotifications}
                disabled={isLoading}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition-all cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
            {isLoading ? (
              <div className="p-12 text-center text-xs text-slate-500">
                <RefreshCw className="h-5 w-5 animate-spin text-indigo-600 mx-auto mb-2" />
                <span>Loading notifications inbox...</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-500">
                <Inbox className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                <p className="font-bold text-slate-700 text-sm">Your notifications inbox is empty</p>
                <p className="text-xs text-slate-400 mt-1">When HR or system events occur, alerts will appear here.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {notifications.map((item) => (
                  <div key={item._id || item.id} className="p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">{item.title}</h4>
                        <p className="mt-0.5 text-xs text-slate-600 leading-relaxed">{item.message}</p>
                        <span className="mt-1.5 block text-[10px] text-slate-400 font-mono">
                          {item.createdAt ? new Date(item.createdAt).toLocaleString() : 'Recent'}
                        </span>
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[9px] font-bold border shrink-0 ${
                          item.status === 'READ'
                            ? 'bg-slate-100 text-slate-500 border-slate-200'
                            : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                        }`}
                      >
                        {item.status || 'UNREAD'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </AdminLayout>
    </AuthGuard>
  );
}
