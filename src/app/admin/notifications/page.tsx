'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { useEmsStore } from '@/store/emsStore';
import {
  AppNotification,
  NotificationCategory,
  NotificationPriority,
  SmtpConfig,
  SmsConfig,
  WhatsappConfig,
} from '@/types/admin';
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
} from 'lucide-react';

export default function NotificationsPage() {
  const router = useRouter();
  const {
    state,
    notifications,
    notificationSettings,
    unreadNotificationsCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
    updateNotificationSettings,
    testChannelConfig,
  } = useEmsStore();

  const [activeTab, setActiveTab] = useState<'feed' | 'channels' | 'matrix'>('feed');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Modals state
  const [activeConfigModal, setActiveConfigModal] = useState<'smtp' | 'whatsapp' | 'sms' | null>(null);
  const [testModalChannel, setTestModalChannel] = useState<'smtp' | 'whatsapp' | 'sms' | null>(null);
  const [testRecipient, setTestRecipient] = useState<string>('');
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form states for modals
  const [smtpForm, setSmtpForm] = useState<SmtpConfig>(
    notificationSettings?.smtp || {
      configured: false,
      host: 'smtp.mailtrap.io',
      port: 587,
      username: 'admin@company.com',
      fromName: 'EMS HRMS System',
      fromEmail: 'noreply@company.com',
      useTls: true,
    }
  );

  const [whatsappForm, setWhatsappForm] = useState<WhatsappConfig>(
    notificationSettings?.whatsapp || {
      configured: false,
      phoneNumberId: '109823471092834',
      businessAccountId: 'act_982347192384',
      tokenSet: false,
    }
  );

  const [smsForm, setSmsForm] = useState<SmsConfig>(
    notificationSettings?.sms || {
      configured: false,
      provider: 'Twilio SMS Gateway',
      senderId: 'EMS-HR',
      apiKeySet: false,
    }
  );

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Filter notifications
  const filteredNotifications = notifications.filter((notif) => {
    const matchesCategory =
      selectedCategory === 'all'
        ? true
        : selectedCategory === 'unread'
        ? !notif.isRead
        : notif.category === selectedCategory;

    const matchesSearch =
      notif.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notif.message.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  const categoryIcons: Record<string, React.ReactNode> = {
    employee: <User className="h-4 w-4 text-blue-500" />,
    attendance: <Clock className="h-4 w-4 text-emerald-500" />,
    leave: <Calendar className="h-4 w-4 text-amber-500" />,
    payroll: <DollarSign className="h-4 w-4 text-purple-500" />,
    document: <FileText className="h-4 w-4 text-indigo-500" />,
    recruitment: <Briefcase className="h-4 w-4 text-teal-500" />,
    system: <Shield className="h-4 w-4 text-rose-500" />,
  };

  const priorityBadges: Record<NotificationPriority, { bg: string; text: string; border: string }> = {
    low: { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200' },
    normal: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
    high: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
    critical: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  };

  const formatTimestamp = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays}d ago`;

      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return isoString;
    }
  };

  const handleSaveSmtp = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedSmtp: SmtpConfig = {
      ...smtpForm,
      configured: true,
    };
    updateNotificationSettings({ smtp: updatedSmtp });
    setActiveConfigModal(null);
    showToast('SMTP Mail Gateway settings updated successfully!');
  };

  const handleSaveWhatsapp = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedWhatsapp: WhatsappConfig = {
      ...whatsappForm,
      configured: true,
      tokenSet: true,
    };
    updateNotificationSettings({ whatsapp: updatedWhatsapp });
    setActiveConfigModal(null);
    showToast('WhatsApp Business API settings configured!');
  };

  const handleSaveSms = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedSms: SmsConfig = {
      ...smsForm,
      configured: true,
      apiKeySet: true,
    };
    updateNotificationSettings({ sms: updatedSms });
    setActiveConfigModal(null);
    showToast('SMS Service Gateway settings saved!');
  };

  const handleSendTest = async () => {
    if (!testModalChannel || !testRecipient.trim()) {
      showToast('Please provide a valid recipient email/phone.', 'error');
      return;
    }

    setIsTesting(true);
    try {
      const channelParam = testModalChannel === 'smtp' ? 'email' : testModalChannel;
      const result = testChannelConfig(channelParam, testRecipient.trim());
      setIsTesting(false);
      setTestModalChannel(null);
      setTestRecipient('');
      if (result.success) {
        showToast(result.message, 'success');
      } else {
        showToast(result.message, 'error');
      }
    } catch {
      setIsTesting(false);
      showToast('Failed to dispatch test notification.', 'error');
    }
  };

  const handleTogglePreference = (prefId: string, channel: 'inApp' | 'email' | 'sms' | 'whatsapp') => {
    const updatedPrefs = (notificationSettings?.preferences || []).map((p) => {
      if (p.id === prefId) {
        return { ...p, [channel]: !p[channel] };
      }
      return p;
    });
    updateNotificationSettings({ preferences: updatedPrefs });
    showToast('Notification preferences updated!');
  };

  const handleRetentionChange = (days: '30' | '90' | '180' | '365' | 'never') => {
    updateNotificationSettings({ retentionDays: days });
    showToast(`Retention policy updated to ${days === 'never' ? 'Keep Indefinitely' : days + ' Days'}`);
  };

  return (
    <AdminLayout
      pageTitle="Notification Management Hub"
      breadcrumbs={[{ label: 'Notifications', href: '/admin/notifications' }]}
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed right-6 top-20 z-50 flex items-center gap-2.5 rounded-xl px-4 py-3 text-xs font-semibold text-white shadow-2xl transition-all ${
            toastMessage.type === 'success' ? 'bg-slate-900 border border-emerald-500/30' : 'bg-rose-900 border border-rose-500/30'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          ) : (
            <AlertCircle className="h-4 w-4 text-rose-400" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Notification Center & Multi-Channel Dispatch</h2>
          <p className="text-xs text-slate-500">
            Real-time HR event alerts, multi-channel gateways (SMTP, WhatsApp, SMS), retention policies, and event matrix
          </p>
        </div>

        <div className="flex items-center gap-2">
          {unreadNotificationsCount > 0 && (
            <button
              onClick={() => {
                markAllNotificationsAsRead();
                showToast('All notifications marked as read');
              }}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
            >
              <Check className="h-4 w-4 text-emerald-600" />
              <span>Mark All Read</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold">Total Alerts</span>
            <Bell className="h-4 w-4 text-blue-500" />
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900">{notifications.length}</p>
          <p className="mt-0.5 text-[10px] text-slate-400">Logged HR events</p>
        </div>

        <div className="rounded-2xl border border-amber-200/60 bg-amber-50/30 p-4 shadow-sm">
          <div className="flex items-center justify-between text-amber-600">
            <span className="text-[11px] font-semibold">Unread</span>
            <span className="flex h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
          </div>
          <p className="mt-2 text-2xl font-black text-amber-700">{unreadNotificationsCount}</p>
          <p className="mt-0.5 text-[10px] text-amber-600/80">Pending review</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold">Read</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900">
            {notifications.length - unreadNotificationsCount}
          </p>
          <p className="mt-0.5 text-[10px] text-slate-400">Acknowledged</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold">Channels</span>
            <Send className="h-4 w-4 text-indigo-500" />
          </div>
          <p className="mt-2 text-xs font-bold text-slate-800">
            {notificationSettings?.smtp?.configured ? 'SMTP ✓ ' : ''}
            {notificationSettings?.whatsapp?.configured ? 'WA ✓ ' : ''}
            {notificationSettings?.sms?.configured ? 'SMS ✓' : ''}
            {!notificationSettings?.smtp?.configured &&
              !notificationSettings?.whatsapp?.configured &&
              !notificationSettings?.sms?.configured &&
              'In-App Only'}
          </p>
          <p className="mt-1 text-[10px] text-slate-400">Active Gateways</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold">Retention</span>
            <Sliders className="h-4 w-4 text-purple-500" />
          </div>
          <p className="mt-2 text-lg font-black text-slate-900">
            {notificationSettings?.retentionDays === 'never'
              ? 'Indefinite'
              : `${notificationSettings?.retentionDays || '90'} Days`}
          </p>
          <p className="mt-0.5 text-[10px] text-slate-400">Auto-clean history</p>
        </div>
      </div>

      {/* Main Section Navigation Tabs */}
      <div className="flex items-center border-b border-slate-200 gap-6 text-xs font-semibold text-slate-500">
        <button
          onClick={() => setActiveTab('feed')}
          className={`flex items-center gap-2 border-b-2 pb-3 transition-colors ${
            activeTab === 'feed'
              ? 'border-blue-600 text-blue-600 font-bold'
              : 'border-transparent hover:text-slate-900'
          }`}
        >
          <Bell className="h-4 w-4" />
          <span>Live Notification Feed ({notifications.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('channels')}
          className={`flex items-center gap-2 border-b-2 pb-3 transition-colors ${
            activeTab === 'channels'
              ? 'border-blue-600 text-blue-600 font-bold'
              : 'border-transparent hover:text-slate-900'
          }`}
        >
          <Send className="h-4 w-4" />
          <span>Delivery Channels (SMTP / WhatsApp / SMS)</span>
        </button>

        <button
          onClick={() => setActiveTab('matrix')}
          className={`flex items-center gap-2 border-b-2 pb-3 transition-colors ${
            activeTab === 'matrix'
              ? 'border-blue-600 text-blue-600 font-bold'
              : 'border-transparent hover:text-slate-900'
          }`}
        >
          <Sliders className="h-4 w-4" />
          <span>Event Matrix & Preferences</span>
        </button>
      </div>

      {/* TAB 1: LIVE NOTIFICATION FEED */}
      {activeTab === 'feed' && (
        <div className="space-y-4">
          {/* Controls Bar: Category Pills + Search */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: 'all', label: 'All' },
                { id: 'unread', label: `Unread (${unreadNotificationsCount})` },
                { id: 'employee', label: 'HR & Employee' },
                { id: 'payroll', label: 'Payroll' },
                { id: 'attendance', label: 'Attendance' },
                { id: 'leave', label: 'Leave' },
                { id: 'recruitment', label: 'Recruitment' },
                { id: 'document', label: 'Documents' },
                { id: 'system', label: 'System' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                    selectedCategory === cat.id
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search notifications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white py-1.5 pl-8 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Notifications List Card */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {filteredNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                  <Bell className="h-6 w-6" />
                </div>
                <h4 className="mt-3 text-sm font-bold text-slate-800">No notifications found</h4>
                <p className="mt-1 max-w-xs text-xs text-slate-500">
                  No notifications match the selected filter category or search criteria.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredNotifications.map((notif) => {
                  const priorityStyle = priorityBadges[notif.priority] || priorityBadges.normal;

                  return (
                    <div
                      key={notif.id}
                      className={`flex flex-col gap-3 p-4 transition-colors sm:flex-row sm:items-center sm:justify-between ${
                        !notif.isRead ? 'bg-blue-50/20' : 'hover:bg-slate-50/60'
                      }`}
                    >
                      <div className="flex items-start gap-3.5">
                        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100">
                          {categoryIcons[notif.category] || <Bell className="h-4 w-4 text-slate-600" />}
                        </div>

                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4
                              className={`text-xs font-bold ${
                                !notif.isRead ? 'text-slate-900' : 'text-slate-700'
                              }`}
                            >
                              {notif.title}
                            </h4>

                            {!notif.isRead && (
                              <span className="flex h-2 w-2 rounded-full bg-blue-600" title="Unread" />
                            )}

                            <span
                              className={`rounded-md border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${priorityStyle.bg} ${priorityStyle.text} ${priorityStyle.border}`}
                            >
                              {notif.priority}
                            </span>

                            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[9px] font-semibold text-slate-600 uppercase">
                              {notif.category}
                            </span>
                          </div>

                          <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">{notif.message}</p>

                          <div className="flex items-center gap-3 text-[10px] text-slate-400 pt-0.5">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatTimestamp(notif.createdAt)}
                            </span>
                            <span>•</span>
                            <span>Target: {notif.recipientRole}</span>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 self-end sm:self-center">
                        {notif.actionUrl && (
                          <button
                            onClick={() => router.push(notif.actionUrl)}
                            className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs"
                          >
                            <span>View</span>
                            <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
                          </button>
                        )}

                        <button
                          onClick={() => {
                            markNotificationAsRead(notif.id);
                            showToast(notif.isRead ? 'Marked as unread' : 'Marked as read');
                          }}
                          className={`rounded-lg p-1.5 transition-colors ${
                            notif.isRead
                              ? 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'
                              : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                          }`}
                          title={notif.isRead ? 'Mark as Unread' : 'Mark as Read'}
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </button>

                        <button
                          onClick={() => setDeleteConfirmId(notif.id)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                          title="Delete Notification"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: DELIVERY CHANNELS */}
      {activeTab === 'channels' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-blue-100 bg-blue-50/40 p-4 text-xs text-blue-900 flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-blue-950">Multi-Channel Communication Gateway</p>
              <p className="mt-0.5 text-blue-800">
                Configure official delivery channels to dispatch automated email payslips, WhatsApp notifications, and urgent SMS broadcasts. In-App alerts are always active.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* 1. In-App Alerts Feed */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <Bell className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">In-App Notification Feed</h3>
                    <p className="text-[11px] text-slate-500">Header bell dropdown & sidebar badge counter</p>
                  </div>
                </div>
                <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                  Always Active
                </span>
              </div>

              <div className="rounded-xl bg-slate-50 p-3 text-xs space-y-1.5 text-slate-600">
                <p className="flex justify-between">
                  <span>Trigger Mode:</span> <strong className="text-slate-900">Real-time WebSocket / Event State</strong>
                </p>
                <p className="flex justify-between">
                  <span>Unread Count Badge:</span> <strong className="text-slate-900">Live Header & Sidebar</strong>
                </p>
              </div>
            </div>

            {/* 2. SMTP Email Gateway */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Email Dispatch (SMTP)</h3>
                    <p className="text-[11px] text-slate-500">Payslip PDFs, leave digests, job invitations</p>
                  </div>
                </div>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${
                    notificationSettings?.smtp?.configured
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}
                >
                  {notificationSettings?.smtp?.configured ? 'Configured' : 'Not Configured'}
                </span>
              </div>

              <div className="rounded-xl bg-slate-50 p-3 text-xs space-y-1.5 text-slate-600">
                <p className="flex justify-between">
                  <span>SMTP Host:</span> <strong className="text-slate-900">{notificationSettings?.smtp?.host || 'Not set'}</strong>
                </p>
                <p className="flex justify-between">
                  <span>Sender Email:</span> <strong className="text-slate-900">{notificationSettings?.smtp?.fromEmail || 'Not set'}</strong>
                </p>
                <p className="flex justify-between">
                  <span>Port & Encryption:</span> <strong className="text-slate-900">{notificationSettings?.smtp?.port} (TLS)</strong>
                </p>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={() => setActiveConfigModal('smtp')}
                  className="flex-1 rounded-xl bg-blue-600 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700"
                >
                  Configure SMTP
                </button>
                <button
                  onClick={() => {
                    setTestModalChannel('smtp');
                    setTestRecipient(notificationSettings?.smtp?.fromEmail || 'admin@company.com');
                  }}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50"
                >
                  <Send className="h-3.5 w-3.5 text-blue-600" />
                  <span>Send Test</span>
                </button>
              </div>
            </div>

            {/* 3. WhatsApp Business API */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                    <MessageSquare className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">WhatsApp Business API</h3>
                    <p className="text-[11px] text-slate-500">Instant WhatsApp message triggers for approvals</p>
                  </div>
                </div>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${
                    notificationSettings?.whatsapp?.configured
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}
                >
                  {notificationSettings?.whatsapp?.configured ? 'Configured' : 'Not Configured'}
                </span>
              </div>

              <div className="rounded-xl bg-slate-50 p-3 text-xs space-y-1.5 text-slate-600">
                <p className="flex justify-between">
                  <span>Phone Number ID:</span>{' '}
                  <strong className="text-slate-900">
                    {notificationSettings?.whatsapp?.phoneNumberId || 'Not Configured'}
                  </strong>
                </p>
                <p className="flex justify-between">
                  <span>Business Account ID:</span>{' '}
                  <strong className="text-slate-900">
                    {notificationSettings?.whatsapp?.businessAccountId || 'Not Configured'}
                  </strong>
                </p>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={() => setActiveConfigModal('whatsapp')}
                  className="flex-1 rounded-xl bg-blue-600 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700"
                >
                  Configure WhatsApp
                </button>
                <button
                  onClick={() => {
                    setTestModalChannel('whatsapp');
                    setTestRecipient('+91 98765 43210');
                  }}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50"
                >
                  <Send className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Send Test</span>
                </button>
              </div>
            </div>

            {/* 4. SMS Service Gateway */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                    <Smartphone className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">SMS Gateway (Twilio / Fast2SMS)</h3>
                    <p className="text-[11px] text-slate-500">Urgent OTPs & critical emergency broadcasts</p>
                  </div>
                </div>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${
                    notificationSettings?.sms?.configured
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}
                >
                  {notificationSettings?.sms?.configured ? 'Configured' : 'Not Configured'}
                </span>
              </div>

              <div className="rounded-xl bg-slate-50 p-3 text-xs space-y-1.5 text-slate-600">
                <p className="flex justify-between">
                  <span>Provider:</span>{' '}
                  <strong className="text-slate-900">{notificationSettings?.sms?.provider || 'Twilio'}</strong>
                </p>
                <p className="flex justify-between">
                  <span>Sender Header ID:</span>{' '}
                  <strong className="text-slate-900">{notificationSettings?.sms?.senderId || 'EMS-HR'}</strong>
                </p>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={() => setActiveConfigModal('sms')}
                  className="flex-1 rounded-xl bg-blue-600 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700"
                >
                  Configure SMS Gateway
                </button>
                <button
                  onClick={() => {
                    setTestModalChannel('sms');
                    setTestRecipient('+91 98765 43210');
                  }}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50"
                >
                  <Send className="h-3.5 w-3.5 text-purple-600" />
                  <span>Send Test</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: EVENT MATRIX & RETENTION PREFERENCES */}
      {activeTab === 'matrix' && (
        <div className="space-y-6">
          {/* Retention Policy Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-600" />
                <span>Notification Retention & Auto-Cleanup Policy</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Automatically purge older notifications to optimize browser storage and maintain performance.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <label className="text-xs font-semibold text-slate-700">Auto-Purge After:</label>
              <select
                value={notificationSettings?.retentionDays || '90'}
                onChange={(e) =>
                  handleRetentionChange(e.target.value as '30' | '90' | '180' | '365' | 'never')
                }
                className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-900 focus:border-blue-500 focus:outline-none shadow-xs"
              >
                <option value="30">30 Days</option>
                <option value="90">90 Days (Recommended)</option>
                <option value="180">180 Days</option>
                <option value="365">365 Days (1 Year)</option>
                <option value="never">Never (Keep Indefinitely)</option>
              </select>
            </div>
          </div>

          {/* Event Matrix Table */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Event Dispatch Matrix</h3>
                <p className="text-xs text-slate-500">Toggle which channels receive alerts for each specific HR event trigger</p>
              </div>
            </div>

            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 font-semibold text-slate-600">
                  <th className="px-4 py-3.5">HR Event Trigger</th>
                  <th className="px-4 py-3.5">Category</th>
                  <th className="px-4 py-3.5 text-center">In-App Alert</th>
                  <th className="px-4 py-3.5 text-center">Email (SMTP)</th>
                  <th className="px-4 py-3.5 text-center">SMS</th>
                  <th className="px-4 py-3.5 text-center">WhatsApp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(notificationSettings?.preferences || []).map((pref) => (
                  <tr key={pref.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3.5 font-bold text-slate-900">{pref.eventName}</td>
                    <td className="px-4 py-3.5">
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 uppercase">
                        {pref.category}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <input
                        type="checkbox"
                        checked={pref.inApp}
                        onChange={() => handleTogglePreference(pref.id, 'inApp')}
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <input
                        type="checkbox"
                        checked={pref.email}
                        onChange={() => handleTogglePreference(pref.id, 'email')}
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <input
                        type="checkbox"
                        checked={pref.sms}
                        onChange={() => handleTogglePreference(pref.id, 'sms')}
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <input
                        type="checkbox"
                        checked={pref.whatsapp}
                        onChange={() => handleTogglePreference(pref.id, 'whatsapp')}
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CONFIG MODAL: SMTP */}
      {activeConfigModal === 'smtp' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Mail className="h-5 w-5 text-indigo-600" />
                <span>Configure SMTP Mail Gateway</span>
              </h3>
              <button
                onClick={() => setActiveConfigModal(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSmtp} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700">SMTP Host</label>
                <input
                  type="text"
                  value={smtpForm.host}
                  onChange={(e) => setSmtpForm({ ...smtpForm, host: e.target.value })}
                  required
                  placeholder="smtp.mailtrap.io"
                  className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 text-slate-900 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Port</label>
                  <input
                    type="number"
                    value={smtpForm.port}
                    onChange={(e) => setSmtpForm({ ...smtpForm, port: parseInt(e.target.value) || 587 })}
                    required
                    className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 text-slate-900 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Security</label>
                  <select
                    value={smtpForm.useTls ? 'TLS' : 'SSL'}
                    onChange={(e) => setSmtpForm({ ...smtpForm, useTls: e.target.value === 'TLS' })}
                    className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 text-slate-900 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="TLS">TLS / STARTTLS</option>
                    <option value="SSL">SSL</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700">Sender Name</label>
                <input
                  type="text"
                  value={smtpForm.fromName}
                  onChange={(e) => setSmtpForm({ ...smtpForm, fromName: e.target.value })}
                  required
                  className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 text-slate-900 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700">From Email Address</label>
                <input
                  type="email"
                  value={smtpForm.fromEmail}
                  onChange={(e) => setSmtpForm({ ...smtpForm, fromEmail: e.target.value })}
                  required
                  className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 text-slate-900 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700">SMTP Username</label>
                <input
                  type="text"
                  value={smtpForm.username}
                  onChange={(e) => setSmtpForm({ ...smtpForm, username: e.target.value })}
                  placeholder="smtp_user"
                  className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 text-slate-900 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setActiveConfigModal(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2 font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-5 py-2 font-semibold text-white shadow-md hover:bg-blue-700"
                >
                  Save & Verify
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIG MODAL: WHATSAPP */}
      {activeConfigModal === 'whatsapp' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-emerald-600" />
                <span>Configure WhatsApp Business API</span>
              </h3>
              <button
                onClick={() => setActiveConfigModal(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveWhatsapp} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700">Phone Number ID</label>
                <input
                  type="text"
                  value={whatsappForm.phoneNumberId}
                  onChange={(e) => setWhatsappForm({ ...whatsappForm, phoneNumberId: e.target.value })}
                  required
                  placeholder="e.g. 109823471092834"
                  className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 text-slate-900 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700">WhatsApp Business Account ID</label>
                <input
                  type="text"
                  value={whatsappForm.businessAccountId}
                  onChange={(e) => setWhatsappForm({ ...whatsappForm, businessAccountId: e.target.value })}
                  required
                  placeholder="e.g. act_982347192384"
                  className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 text-slate-900 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700">System User Access Token</label>
                <input
                  type="password"
                  defaultValue="••••••••••••••••••••••••"
                  placeholder="EAAG..."
                  className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 text-slate-900 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setActiveConfigModal(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2 font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-600 px-5 py-2 font-semibold text-white shadow-md hover:bg-emerald-700"
                >
                  Save & Connect
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIG MODAL: SMS */}
      {activeConfigModal === 'sms' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-purple-600" />
                <span>Configure SMS Gateway</span>
              </h3>
              <button
                onClick={() => setActiveConfigModal(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSms} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700">Provider Service</label>
                <select
                  value={smsForm.provider}
                  onChange={(e) => setSmsForm({ ...smsForm, provider: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 text-slate-900 focus:border-blue-500 focus:outline-none"
                >
                  <option value="Twilio SMS Gateway">Twilio SMS Gateway</option>
                  <option value="Fast2SMS">Fast2SMS</option>
                  <option value="Msg91">Msg91</option>
                  <option value="Custom REST Gateway">Custom REST Gateway</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700">Sender ID (DLT Header)</label>
                <input
                  type="text"
                  value={smsForm.senderId}
                  onChange={(e) => setSmsForm({ ...smsForm, senderId: e.target.value })}
                  required
                  placeholder="EMS-HR"
                  className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 text-slate-900 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700">API Key / Account SID</label>
                <input
                  type="password"
                  defaultValue="AC••••••••••••••••••••••••"
                  className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 text-slate-900 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setActiveConfigModal(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2 font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-purple-600 px-5 py-2 font-semibold text-white shadow-md hover:bg-purple-700"
                >
                  Save Gateway
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TEST DISPATCH MODAL */}
      {testModalChannel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Send Test Notification ({testModalChannel.toUpperCase()})
              </h3>
              <button
                onClick={() => setTestModalChannel(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-600">
                Enter target email address or phone number to dispatch a simulated test notification payload.
              </p>
              <div>
                <label className="font-semibold text-slate-700">Recipient Target</label>
                <input
                  type="text"
                  value={testRecipient}
                  onChange={(e) => setTestRecipient(e.target.value)}
                  placeholder={
                    testModalChannel === 'smtp' ? 'user@domain.com' : '+91 98765 43210'
                  }
                  className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 text-slate-900 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setTestModalChannel(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2 font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSendTest}
                  disabled={isTesting}
                  className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2 font-semibold text-white shadow-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {isTesting ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      <span>Dispatch Test</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION DIALOG */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl space-y-4 text-xs">
            <h3 className="text-sm font-bold text-slate-900">Delete Notification?</h3>
            <p className="text-slate-600">
              Are you sure you want to delete this notification item? This will remove the notification entry without affecting the underlying HR record.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteNotification(deleteConfirmId);
                  setDeleteConfirmId(null);
                  showToast('Notification deleted');
                }}
                className="rounded-xl bg-rose-600 px-4 py-2 font-semibold text-white shadow-md hover:bg-rose-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
