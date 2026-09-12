'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AdminLayout } from '@/components/layout/AdminLayout';
import {
  Bell,
  Mail,
  MessageSquare,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Check,
  Search,
  Clock,
  User,
  Calendar,
  DollarSign,
  FileText,
  Briefcase,
  Shield,
  Filter,
  ExternalLink,
  Send,
  Sliders,
  X,
  RefreshCw,
  Info,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Eye,
  RotateCcw,
  ShieldAlert,
  Activity,
  Layers,
} from 'lucide-react';

interface NotificationItem {
  id: string;
  _id: string;
  organizationId: string;
  recipientType?: string;
  recipientId?: string;
  eventType: string;
  category: string;
  title: string;
  message: string;
  priority: string;
  channel?: string;
  status: string;
  isRead: boolean;
  actionUrl?: string | null;
  link?: string | null;
  createdAt: string;
  readAt?: string | null;
}

interface NotificationPreference {
  eventType: string;
  category?: string;
  inApp: boolean;
  email: boolean;
  whatsapp: boolean;
  sms: boolean;
  push: boolean;
  enabled: boolean;
}

interface ChannelStatusItem {
  id: string;
  name: string;
  type: string;
  configured: boolean;
  status: string;
  statusText: string;
  description: string;
}

export default function NotificationsPage() {
  const router = useRouter();

  // Active Tab
  const [activeTab, setActiveTab] = useState<'feed' | 'channels' | 'matrix'>('feed');

  // Feed State
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);

  // Data State from MongoDB
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [readCount, setReadCount] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Detail Modal & Action States
  const [activeDetailNotif, setActiveDetailNotif] = useState<NotificationItem | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Channels & Preferences State
  const [channels, setChannels] = useState<ChannelStatusItem[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreference[]>([]);
  const [deliveryLogs, setDeliveryLogs] = useState<any[]>([]);
  const [retentionDays, setRetentionDays] = useState<number>(90);
  const [isUpdatingRetention, setIsUpdatingRetention] = useState<boolean>(false);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 1. Fetch Live Notifications Feed
  const fetchNotificationsFeed = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const params = new URLSearchParams();
      params.append('page', String(currentPage));
      params.append('limit', String(pageSize));
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      if (selectedPriority !== 'all') params.append('priority', selectedPriority);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());

      const res = await fetch(`/api/v1/notifications?${params.toString()}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to load notifications from database');
      }

      setNotifications(data.notifications || []);
      setTotalCount(data.totalCount || 0);
      setUnreadCount(data.unreadCount || 0);
      setReadCount(data.readCount || 0);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (err: any) {
      console.error('Error fetching notifications feed:', err);
      setErrorMsg(err.message || 'Unable to connect to notifications database.');
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Fetch Channels, Preferences & Retention
  const fetchChannelsAndPreferences = async () => {
    try {
      const [channelsRes, prefsRes, retentionRes, logsRes] = await Promise.all([
        fetch('/api/v1/notifications/channels'),
        fetch('/api/v1/notifications/preferences'),
        fetch('/api/v1/notifications/retention'),
        fetch('/api/v1/notifications/delivery-logs'),
      ]);

      if (channelsRes.ok) {
        const cData = await channelsRes.json();
        setChannels(cData.channels || []);
      }

      if (prefsRes.ok) {
        const pData = await prefsRes.json();
        setPreferences(pData.preferences || []);
      }

      if (retentionRes.ok) {
        const rData = await retentionRes.json();
        setRetentionDays(rData.retentionDays || 90);
      }

      if (logsRes.ok) {
        const lData = await logsRes.json();
        setDeliveryLogs(lData.logs || []);
      }
    } catch (err) {
      console.error('Error loading notification channels/preferences:', err);
    }
  };

  useEffect(() => {
    fetchNotificationsFeed();
  }, [selectedCategory, selectedPriority, searchQuery, currentPage, pageSize]);

  useEffect(() => {
    fetchChannelsAndPreferences();
  }, [activeTab]);

  // Actions
  const handleMarkAsRead = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    // Optimistic Update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, status: 'READ', isRead: true } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
    setReadCount((c) => c + 1);

    try {
      const res = await fetch(`/api/v1/notifications/${id}/read`, { method: 'PATCH' });
      const data = await res.json();
      if (!res.ok || !data.success) {
        fetchNotificationsFeed(); // Rollback
      }
    } catch {
      fetchNotificationsFeed();
    }
  };

  const handleMarkAsUnread = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    // Optimistic Update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, status: 'UNREAD', isRead: false } : n))
    );
    setUnreadCount((c) => c + 1);
    setReadCount((c) => Math.max(0, c - 1));

    try {
      const res = await fetch(`/api/v1/notifications/${id}/unread`, { method: 'PATCH' });
      const data = await res.json();
      if (!res.ok || !data.success) {
        fetchNotificationsFeed(); // Rollback
      }
    } catch {
      fetchNotificationsFeed();
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const res = await fetch('/api/v1/notifications/mark-all-read', { method: 'PATCH' });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`Marked ${data.updatedCount || 0} notifications as READ`);
        fetchNotificationsFeed();
      } else {
        throw new Error(data.message || 'Failed to mark notifications read');
      }
    } catch (err: any) {
      showToast(err.message || 'Action failed', 'error');
    }
  };

  const handleDeleteNotification = async (id: string) => {
    try {
      const res = await fetch(`/api/v1/notifications/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast('Notification deleted');
        setDeleteConfirmId(null);
        fetchNotificationsFeed();
      } else {
        throw new Error(data.message || 'Failed to delete notification');
      }
    } catch (err: any) {
      showToast(err.message || 'Delete failed', 'error');
    }
  };

  const handleUpdatePreference = async (eventType: string, key: 'inApp' | 'email' | 'whatsapp' | 'sms', value: boolean) => {
    setPreferences((prev) =>
      prev.map((p) => (p.eventType === eventType ? { ...p, [key]: value } : p))
    );

    try {
      const current = preferences.find((p) => p.eventType === eventType);
      await fetch('/api/v1/notifications/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...current,
          eventType,
          [key]: value,
        }),
      });
      showToast(`Updated preference for ${eventType}`);
    } catch {
      showToast('Failed to save preference', 'error');
    }
  };

  const handleSaveRetention = async (days: number) => {
    setIsUpdatingRetention(true);
    try {
      const res = await fetch('/api/v1/notifications/retention', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ retentionDays: days }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setRetentionDays(days);
        showToast(`Retention policy set to ${days} Days`);
      } else {
        throw new Error(data.message || 'Failed to update retention policy');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to update retention', 'error');
    } finally {
      setIsUpdatingRetention(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'HR_EMPLOYEE':
        return <User className="h-4 w-4 text-purple-600" />;
      case 'PAYROLL':
        return <DollarSign className="h-4 w-4 text-emerald-600" />;
      case 'ATTENDANCE':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'LEAVE':
        return <Calendar className="h-4 w-4 text-amber-600" />;
      case 'RECRUITMENT':
        return <Briefcase className="h-4 w-4 text-indigo-600" />;
      case 'DOCUMENT':
        return <FileText className="h-4 w-4 text-cyan-600" />;
      case 'SYSTEM':
        return <Shield className="h-4 w-4 text-rose-600" />;
      default:
        return <Bell className="h-4 w-4 text-slate-600" />;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return <span className="rounded-md bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-800">URGENT</span>;
      case 'HIGH':
        return <span className="rounded-md bg-orange-100 px-2 py-0.5 text-[10px] font-semibold text-orange-800">HIGH</span>;
      case 'LOW':
        return <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">LOW</span>;
      default:
        return <span className="rounded-md bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-800">NORMAL</span>;
    }
  };

  const getActiveChannelsSummary = () => {
    const connected = channels.filter((c) => c.status === 'CONNECTED').map((c) => c.name.split(' ')[0]);
    if (connected.length === 0) return 'In-App Only';
    return connected.join(' + ');
  };

  return (
    <AdminLayout
      pageTitle="Notification Center"
      breadcrumbs={[{ label: 'Notifications', href: '/admin/notifications' }]}
    >
      {/* Toast Alert */}
      {toastMessage && (
        <div
          className={`fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-xl px-4 py-3 text-xs font-semibold text-white shadow-2xl animate-in fade-in ${
            toastMessage.type === 'error' ? 'bg-rose-900' : 'bg-slate-900'
          }`}
        >
          {toastMessage.type === 'error' ? (
            <AlertCircle className="h-4 w-4 text-rose-400" />
          ) : (
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header & Subtitle */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Bell className="h-6 w-6 text-indigo-600" />
            Notification Center & Multi-Channel Dispatch
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Real-time HR event alerts, multi-channel gateways (SMTP, WhatsApp, SMS), retention policies, and event matrix
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchNotificationsFeed}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={handleMarkAllRead}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-md hover:bg-indigo-700 transition"
          >
            <Check className="h-4 w-4" />
            Mark All Read
          </button>
        </div>
      </div>

      {/* Dynamic Top Metrics Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold text-slate-500">Total Alerts</span>
            <Bell className="h-4 w-4 text-indigo-500" />
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900">{totalCount}</p>
          <p className="mt-0.5 text-[10px] text-slate-400">All matching notifications</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold text-blue-600">Unread</span>
            <Clock className="h-4 w-4 text-blue-500" />
          </div>
          <p className="mt-2 text-2xl font-black text-blue-600">{unreadCount}</p>
          <p className="mt-0.5 text-[10px] text-slate-400">Pending user action</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold text-emerald-600">Read</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900">{readCount}</p>
          <p className="mt-0.5 text-[10px] text-slate-400">Acknowledged alerts</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold text-purple-600">Channels</span>
            <Send className="h-4 w-4 text-purple-500" />
          </div>
          <p className="mt-2 text-sm font-bold text-slate-900 truncate">{getActiveChannelsSummary()}</p>
          <p className="mt-0.5 text-[10px] text-slate-400">Active dispatch gateways</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold text-amber-600">Retention</span>
            <Shield className="h-4 w-4 text-amber-500" />
          </div>
          <p className="mt-2 text-xl font-black text-slate-900">{retentionDays} Days</p>
          <p className="mt-0.5 text-[10px] text-slate-400">Server auto-cleanup policy</p>
        </div>
      </div>

      {/* Main Content Tabs */}
      <div className="border-b border-slate-200">
        <div className="flex gap-6 text-xs font-bold">
          <button
            onClick={() => setActiveTab('feed')}
            className={`pb-3 transition border-b-2 ${
              activeTab === 'feed'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Live Notification Feed
          </button>
          <button
            onClick={() => setActiveTab('channels')}
            className={`pb-3 transition border-b-2 ${
              activeTab === 'channels'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Delivery Channels (SMTP / WhatsApp / SMS)
          </button>
          <button
            onClick={() => setActiveTab('matrix')}
            className={`pb-3 transition border-b-2 ${
              activeTab === 'matrix'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Event Matrix & Preferences
          </button>
        </div>
      </div>

      {/* TAB 1: LIVE NOTIFICATION FEED */}
      {activeTab === 'feed' && (
        <div className="space-y-4">
          {/* Category Filter Pills & Search Bar */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search notifications title, message, event type..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-4 py-2 text-xs font-medium text-slate-800 placeholder-slate-400 transition focus:border-indigo-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={selectedPriority}
                  onChange={(e) => {
                    setSelectedPriority(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-medium text-slate-700 focus:border-indigo-500 focus:bg-white focus:outline-none"
                >
                  <option value="all">All Priorities</option>
                  <option value="LOW">Low</option>
                  <option value="NORMAL">Normal</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>

                {(selectedCategory !== 'all' || selectedPriority !== 'all' || searchQuery !== '') && (
                  <button
                    onClick={() => {
                      setSelectedCategory('all');
                      setSelectedPriority('all');
                      setSearchQuery('');
                      setCurrentPage(1);
                    }}
                    className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Reset
                  </button>
                )}
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100">
              {[
                { id: 'all', label: 'All' },
                { id: 'unread', label: `Unread (${unreadCount})` },
                { id: 'hr_employee', label: 'HR & Employee' },
                { id: 'payroll', label: 'Payroll' },
                { id: 'attendance', label: 'Attendance' },
                { id: 'leave', label: 'Leave' },
                { id: 'recruitment', label: 'Recruitment' },
                { id: 'documents', label: 'Documents' },
                { id: 'system', label: 'System' },
              ].map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    setSelectedCategory(c.id);
                    setCurrentPage(1);
                  }}
                  className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                    selectedCategory === c.id
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Error State */}
          {errorMsg && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
                <span>{errorMsg}</span>
              </div>
              <button
                onClick={fetchNotificationsFeed}
                className="rounded-lg bg-rose-600 px-3 py-1 text-xs font-semibold text-white hover:bg-rose-700"
              >
                Retry
              </button>
            </div>
          )}

          {/* Notifications Feed Cards List */}
          <div className="space-y-2.5">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400 rounded-2xl border border-slate-200 bg-white shadow-sm">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mb-2" />
                <p className="text-xs font-semibold text-slate-600">Loading notifications from MongoDB Atlas...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400 rounded-2xl border border-slate-200 bg-white shadow-sm">
                <Bell className="h-12 w-12 text-slate-300 mb-3" />
                <p className="text-sm font-bold text-slate-700">
                  {selectedCategory !== 'all' || searchQuery ? 'No notifications found for this filter' : 'No notifications yet'}
                </p>
                <p className="text-xs text-slate-400 mt-1 max-w-sm text-center">
                  {selectedCategory !== 'all' || searchQuery
                    ? 'Try adjusting your search criteria or resetting filters.'
                    : 'System and workflow alerts will appear here as EMS actions take place.'}
                </p>
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setActiveDetailNotif(item)}
                  className={`group relative cursor-pointer rounded-2xl border p-4 shadow-sm transition-all hover:shadow-md ${
                    !item.isRead
                      ? 'border-indigo-200 bg-indigo-50/40 ring-1 ring-indigo-500/10'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 border border-slate-200">
                        {getCategoryIcon(item.category)}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className={`text-xs ${!item.isRead ? 'font-extrabold text-slate-900' : 'font-bold text-slate-800'}`}>
                            {item.title}
                          </h4>
                          {getPriorityBadge(item.priority)}
                          {!item.isRead && (
                            <span className="inline-flex items-center rounded-full bg-blue-600 px-2 py-0.5 text-[9px] font-bold text-white">
                              NEW
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{item.message}</p>
                        <div className="flex items-center gap-3 text-[10px] text-slate-400 font-medium">
                          <span>{new Date(item.createdAt).toLocaleString()}</span>
                          <span>•</span>
                          <span className="uppercase">{item.category}</span>
                        </div>
                      </div>
                    </div>

                    {/* Quick Row Actions */}
                    <div className="flex items-center gap-1.5 opacity-80 group-hover:opacity-100">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveDetailNotif(item);
                        }}
                        className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 hover:bg-slate-100"
                        title="View Details"
                      >
                        <Eye className="h-3.5 w-3.5 text-indigo-600" />
                      </button>

                      <button
                        onClick={(e) => (item.isRead ? handleMarkAsUnread(item.id, e) : handleMarkAsRead(item.id, e))}
                        className={`rounded-lg border p-1.5 ${
                          item.isRead
                            ? 'border-slate-200 bg-white text-slate-400 hover:text-indigo-600'
                            : 'border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100'
                        }`}
                        title={item.isRead ? 'Mark as Unread' : 'Mark as Read'}
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirmId(item.id);
                        }}
                        className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                        title="Delete Notification"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Server-Side Pagination Footer */}
          {notifications.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200 bg-white px-4 py-3.5 rounded-2xl border text-xs text-slate-500 shadow-sm">
              <div>
                Showing <span className="font-bold text-slate-800">{notifications.length}</span> of{' '}
                <span className="font-bold text-slate-800">{totalCount}</span> alerts
              </div>
              <div className="flex items-center gap-2">
                <button
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 font-semibold text-slate-700 disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Prev
                </button>
                <span className="px-2 font-medium text-slate-700">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 font-semibold text-slate-700 disabled:opacity-40"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: DELIVERY CHANNELS */}
      {activeTab === 'channels' && (
        <div className="space-y-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Multi-Channel Delivery Gateways</h3>
                <p className="text-xs text-slate-500">
                  Channel health inspection pulling directly from /admin/integrations
                </p>
              </div>
              <button
                onClick={() => router.push('/admin/integrations')}
                className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700"
              >
                <Sliders className="h-3.5 w-3.5" />
                Manage Integrations
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {channels.map((c) => (
                <div key={c.id} className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white shadow-xs border border-slate-200">
                        {c.type === 'WHATSAPP' ? (
                          <MessageSquare className="h-4 w-4 text-emerald-600" />
                        ) : c.type === 'EMAIL' ? (
                          <Mail className="h-4 w-4 text-blue-600" />
                        ) : c.type === 'SMS' ? (
                          <Smartphone className="h-4 w-4 text-amber-600" />
                        ) : (
                          <Bell className="h-4 w-4 text-purple-600" />
                        )}
                      </div>
                      <span className="text-xs font-bold text-slate-900">{c.name}</span>
                    </div>

                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        c.status === 'CONNECTED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {c.statusText}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">{c.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery Logs Section */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">Multi-Channel Delivery Audit Logs</h3>
              </div>
              <span className="text-[11px] text-slate-400">Server-side verified dispatches</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Channel</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Message ID / Error</th>
                    <th className="px-4 py-3">Attempted Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {deliveryLogs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                        No multi-channel delivery attempts logged yet.
                      </td>
                    </tr>
                  ) : (
                    deliveryLogs.map((l) => (
                      <tr key={l.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 uppercase font-bold text-slate-900">{l.channel}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                              l.status === 'SENT' || l.status === 'DELIVERED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {l.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-[11px] text-slate-600">
                          {l.providerMessageId || l.errorMessage || 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-slate-500 text-[11px]">
                          {new Date(l.attemptedAt).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: EVENT MATRIX & PREFERENCES */}
      {activeTab === 'matrix' && (
        <div className="space-y-5">
          {/* Retention Policy Box */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Notification Retention Cleanup Policy</h3>
                <p className="text-xs text-slate-500">
                  Configure server-side retention cleanup period for organization notifications.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={retentionDays}
                  onChange={(e) => handleSaveRetention(Number(e.target.value))}
                  disabled={isUpdatingRetention}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-800 focus:bg-white focus:outline-none"
                >
                  <option value={7}>7 Days Retention</option>
                  <option value={30}>30 Days Retention</option>
                  <option value={60}>60 Days Retention</option>
                  <option value={90}>90 Days Retention (Default)</option>
                  <option value={180}>180 Days Retention</option>
                  <option value={365}>365 Days Retention</option>
                </select>
              </div>
            </div>
          </div>

          {/* Event Matrix Preferences Table */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Multi-Channel Event Dispatch Matrix</h3>
              <p className="text-xs text-slate-500">
                Configure which channels are triggered per event type. Disabled channels in /admin/integrations cannot be checked.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-4 py-3.5">Event Type</th>
                    <th className="px-4 py-3.5">Category</th>
                    <th className="px-4 py-3.5 text-center">In-App</th>
                    <th className="px-4 py-3.5 text-center">Email</th>
                    <th className="px-4 py-3.5 text-center">WhatsApp</th>
                    <th className="px-4 py-3.5 text-center">SMS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {preferences.map((p) => (
                    <tr key={p.eventType} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-semibold text-slate-900">{p.eventType}</td>
                      <td className="px-4 py-3 text-[11px] text-slate-500 uppercase">{p.category || 'SYSTEM'}</td>
                      <td className="px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={p.inApp}
                          onChange={(e) => handleUpdatePreference(p.eventType, 'inApp', e.target.checked)}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={p.email}
                          onChange={(e) => handleUpdatePreference(p.eventType, 'email', e.target.checked)}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={p.whatsapp}
                          onChange={(e) => handleUpdatePreference(p.eventType, 'whatsapp', e.target.checked)}
                          className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                        />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={p.sms}
                          onChange={(e) => handleUpdatePreference(p.eventType, 'sms', e.target.checked)}
                          className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* DETAIL VIEW MODAL */}
      {activeDetailNotif && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                {getCategoryIcon(activeDetailNotif.category)}
                <h3 className="text-base font-bold text-slate-900">{activeDetailNotif.title}</h3>
              </div>
              <button onClick={() => setActiveDetailNotif(null)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center gap-2">
                {getPriorityBadge(activeDetailNotif.priority)}
                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 uppercase">
                  {activeDetailNotif.category}
                </span>
                <span className="text-[11px] text-slate-400">
                  {new Date(activeDetailNotif.createdAt).toLocaleString()}
                </span>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-slate-700 leading-relaxed font-medium">
                {activeDetailNotif.message}
              </div>

              {activeDetailNotif.actionUrl && (
                <div className="pt-2">
                  <button
                    onClick={() => {
                      router.push(activeDetailNotif.actionUrl!);
                      setActiveDetailNotif(null);
                    }}
                    className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-md hover:bg-indigo-700"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Open Related Record
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setActiveDetailNotif(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertCircle className="h-6 w-6" />
              <h3 className="text-base font-bold text-slate-900">Delete Notification?</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to remove this notification? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteNotification(deleteConfirmId)}
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-md hover:bg-rose-700"
              >
                Delete Notification
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
