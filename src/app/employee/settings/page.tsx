'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { useAuthStore } from '@/store/authStore';
import {
  Settings,
  Lock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Eye,
  EyeOff,
  User,
  Building2,
  Mail,
  Camera,
  Trash2,
  Monitor,
  Globe,
  Bell,
  Check,
  Sparkles,
  KeyRound,
  FileText,
  BadgeCheck,
  Info,
} from 'lucide-react';

interface ActiveSession {
  id: string;
  sessionToken?: string;
  userAgent: string;
  ipAddress: string;
  createdAt: string;
  lastActiveAt: string;
  expiresAt: string;
  isCurrent: boolean;
}

export default function EmployeeSettingsPage() {
  const { user } = useAuthStore();

  // Active Tab
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'sessions' | 'notifications'>('profile');

  // Profile Context State
  const [profileData, setProfileData] = useState<any>(null);
  const [isPhotoUploading, setIsPhotoUploading] = useState(false);
  const [isPhotoRemoving, setIsPhotoRemoving] = useState(false);

  // Password & Security State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordSuccessMsg, setPasswordSuccessMsg] = useState<string | null>(null);
  const [passwordErrorMsg, setPasswordErrorMsg] = useState<string | null>(null);

  // Sessions State
  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [revokingSessionId, setRevokingSessionId] = useState<string | null>(null);

  // Notifications State
  const [notificationHealth, setNotificationHealth] = useState<any>(null);
  const [isLoadingNotifSettings, setIsLoadingNotifSettings] = useState(false);

  // Overall Page Loading & Error State
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Fetch Authenticated Profile & Initial Settings
  const fetchSettingsData = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setIsError(false);
    setErrorMessage(null);

    try {
      const [meRes, sessionsRes, notifRes] = await Promise.all([
        fetch('/api/v1/auth/me').catch(() => null),
        fetch('/api/v1/auth/sessions').catch(() => null),
        fetch('/api/v1/settings/notifications').catch(() => null),
      ]);

      if (meRes && meRes.ok) {
        const meData = await meRes.json();
        if (meData.success && meData.user) {
          setProfileData(meData.user);
        }
      }

      if (sessionsRes && sessionsRes.ok) {
        const sessionsData = await sessionsRes.json();
        if (sessionsData.success && Array.isArray(sessionsData.data)) {
          setSessions(sessionsData.data);
        }
      }

      if (notifRes && notifRes.ok) {
        const notifData = await notifRes.json();
        if (notifData.success && notifData.data) {
          setNotificationHealth(notifData.data.channelHealth || null);
        }
      }

      if (isManualRefresh) {
        showToast('Settings refreshed successfully');
      }
    } catch (err: any) {
      console.error('Error fetching settings:', err);
      setIsError(true);
      setErrorMessage(err?.message || 'Failed to load settings data. Please try again.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchSettingsData();
  }, [fetchSettingsData]);

  // Upload Profile Photo to GridFS
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];

    if (file.size > 5 * 1024 * 1024) {
      showToast('Image size exceeds 5MB limit.');
      return;
    }

    setIsPhotoUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/v1/settings/profile/photo', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast('Profile photo updated successfully!');
        fetchSettingsData(true);
      } else {
        showToast(data.message || 'Failed to upload profile photo.');
      }
    } catch (err: any) {
      console.error('Error uploading profile photo:', err);
      showToast('Failed to upload profile photo.');
    } finally {
      setIsPhotoUploading(false);
    }
  };

  // Remove Profile Photo from GridFS
  const handlePhotoRemove = async () => {
    if (!confirm('Are you sure you want to remove your profile photo?')) return;
    setIsPhotoRemoving(true);

    try {
      const res = await fetch('/api/v1/settings/profile/photo', {
        method: 'DELETE',
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast('Profile photo removed.');
        fetchSettingsData(true);
      } else {
        showToast(data.message || 'Failed to remove profile photo.');
      }
    } catch (err: any) {
      console.error('Error removing profile photo:', err);
      showToast('Failed to remove profile photo.');
    } finally {
      setIsPhotoRemoving(false);
    }
  };

  // Change Password Submission
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSuccessMsg(null);
    setPasswordErrorMsg(null);

    if (!currentPassword) {
      setPasswordErrorMsg('Please enter your current password.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordErrorMsg('New password and confirmation password do not match.');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordErrorMsg('New password must be at least 6 characters long.');
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const res = await fetch('/api/v1/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setPasswordSuccessMsg(data.message || 'Your password has been changed successfully.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordErrorMsg(data.message || 'Failed to update password. Please check your current password.');
      }
    } catch (err: any) {
      console.error('Error changing password:', err);
      setPasswordErrorMsg('A network error occurred while updating password.');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  // Revoke Session Action
  const handleRevokeSession = async (sessionId: string) => {
    if (!confirm('Are you sure you want to log out this active device session?')) return;
    setRevokingSessionId(sessionId);

    try {
      const res = await fetch(`/api/v1/auth/sessions/${sessionId}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast('Session revoked successfully.');
        setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      } else {
        showToast(data.message || 'Failed to revoke session.');
      }
    } catch (err) {
      console.error('Error revoking session:', err);
      showToast('Error revoking session.');
    } finally {
      setRevokingSessionId(null);
    }
  };

  // Password Strength Calculation
  const passwordStrength = useMemo(() => {
    if (!newPassword) return { score: 0, label: 'None', color: 'bg-slate-200' };
    let score = 0;
    if (newPassword.length >= 6) score += 1;
    if (newPassword.length >= 10) score += 1;
    if (/[A-Z]/.test(newPassword)) score += 1;
    if (/[0-9]/.test(newPassword)) score += 1;
    if (/[^A-Za-z0-9]/.test(newPassword)) score += 1;

    if (score <= 2) return { score: 25, label: 'Weak', color: 'bg-rose-500' };
    if (score === 3) return { score: 50, label: 'Fair', color: 'bg-amber-500' };
    if (score === 4) return { score: 75, label: 'Strong', color: 'bg-emerald-500' };
    return { score: 100, label: 'Very Strong', color: 'bg-indigo-600' };
  }, [newPassword]);

  // Authenticated Employee Identity Context
  const employeeName = profileData?.name || user?.name || 'Employee';
  const employeeId = profileData?.employeeId || user?.employeeId || 'N/A';
  const designation = profileData?.designation || user?.designation || 'Team Member';
  const department = profileData?.department || user?.department || 'General';
  const email = profileData?.email || user?.email || 'N/A';
  const avatarUrl = profileData?.avatar || user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80';

  return (
    <AuthGuard allowedRoles={['EMPLOYEE', 'SUPER_ADMIN', 'ADMIN', 'HR', 'MANAGER']}>
      <AdminLayout
        allowedRoles={['EMPLOYEE', 'SUPER_ADMIN', 'ADMIN', 'HR', 'MANAGER']}
        pageTitle="Account Settings"
        breadcrumbs={[
          { label: 'My Workspace', href: '/employee/dashboard' },
          { label: 'Settings', href: '/employee/settings' },
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
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Account & Portal Settings</h1>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-extrabold text-emerald-700 border border-emerald-200">
                  <BadgeCheck className="h-3.5 w-3.5 text-emerald-600" />
                  Verified Account
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Manage profile details, account security, active device sessions, and notification alert channels.
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

            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => fetchSettingsData(true)}
                disabled={isRefreshing || isLoading}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 transition-all cursor-pointer disabled:opacity-50 shadow-xs"
                title="Refresh settings and profile"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin text-indigo-400' : ''}`} />
                <span>{isRefreshing ? 'Refreshing...' : 'Refresh Settings'}</span>
              </button>
            </div>
          </div>

          {/* ERROR ALERT BANNER */}
          {isError && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50/90 p-4 text-xs text-rose-800 shadow-xs flex items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
                <div>
                  <p className="font-bold text-rose-900">Failed to Load Settings</p>
                  <p className="text-rose-700 mt-0.5">{errorMessage || 'An error occurred while connecting to setting services.'}</p>
                </div>
              </div>
              <button
                onClick={() => fetchSettingsData(true)}
                className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-700 transition-colors shrink-0 cursor-pointer"
              >
                Retry
              </button>
            </div>
          )}

          {/* SETTINGS CATEGORIZED TAB NAVIGATION */}
          <div className="flex items-center border-b border-slate-200 bg-white rounded-2xl px-3 py-1 shadow-xs overflow-x-auto scrollbar-none">
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-extrabold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'profile'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <User className="h-4 w-4" />
              <span>Profile & Account</span>
            </button>

            <button
              onClick={() => setActiveTab('security')}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-extrabold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'security'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Lock className="h-4 w-4" />
              <span>Password & Security</span>
            </button>

            <button
              onClick={() => setActiveTab('sessions')}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-extrabold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'sessions'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="h-4 w-4" />
              <span>Two-Factor & Sessions</span>
              {sessions.length > 0 && (
                <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 border border-indigo-200">
                  {sessions.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('notifications')}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-extrabold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'notifications'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Bell className="h-4 w-4" />
              <span>Notification Channels</span>
            </button>
          </div>

          {/* TAB 1: PROFILE & ACCOUNT */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              {/* Photo & Avatar Upload Card */}
              <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <h2 className="text-sm font-extrabold text-slate-900">Profile Photo Avatar</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Upload a professional headshot stored securely in MongoDB GridFS.</p>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                    JPG, PNG, WEBP (Max 5MB)
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <div className="relative">
                    <img
                      src={avatarUrl}
                      alt={employeeName}
                      className="h-24 w-24 rounded-full object-cover border-4 border-slate-100 shadow-md"
                    />
                    {isPhotoUploading && (
                      <div className="absolute inset-0 rounded-full bg-slate-950/60 flex items-center justify-center text-white">
                        <RefreshCw className="h-6 w-6 animate-spin" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-3 text-center sm:text-left">
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                      <label className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 transition-all cursor-pointer">
                        <Camera className="h-3.5 w-3.5" />
                        <span>{isPhotoUploading ? 'Uploading...' : 'Upload New Photo'}</span>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={handlePhotoUpload}
                          disabled={isPhotoUploading}
                          className="hidden"
                        />
                      </label>

                      <button
                        onClick={handlePhotoRemove}
                        disabled={isPhotoRemoving || avatarUrl.includes('unsplash')}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 transition-all cursor-pointer disabled:opacity-40"
                      >
                        <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                        <span>{isPhotoRemoving ? 'Removing...' : 'Remove Photo'}</span>
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-400 font-medium">Your photo will be visible on HR tickets and team directories.</p>
                  </div>
                </div>
              </div>

              {/* Employee Work Account Information (HR-Controlled Read-Only) */}
              <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div>
                    <h2 className="text-sm font-extrabold text-slate-900">Work & Account Details</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Official employment records managed directly by HR Administration.</p>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600 border border-slate-200">
                    <Lock className="h-3 w-3 text-slate-400" />
                    HR Read-Only
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">Full Name</label>
                    <div className="rounded-xl border border-slate-200/80 bg-slate-50 px-3.5 py-2.5 text-xs font-bold text-slate-900">
                      {employeeName}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">Employee ID</label>
                    <div className="rounded-xl border border-slate-200/80 bg-slate-50 px-3.5 py-2.5 text-xs font-mono font-bold text-indigo-600">
                      {employeeId}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">Work Email Address</label>
                    <div className="rounded-xl border border-slate-200/80 bg-slate-50 px-3.5 py-2.5 text-xs font-semibold text-slate-800">
                      {email}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">Department</label>
                    <div className="rounded-xl border border-slate-200/80 bg-slate-50 px-3.5 py-2.5 text-xs font-semibold text-slate-800">
                      {department}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">Designation</label>
                    <div className="rounded-xl border border-slate-200/80 bg-slate-50 px-3.5 py-2.5 text-xs font-semibold text-slate-800">
                      {designation}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">Account Status</label>
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 px-3.5 py-2.5 text-xs font-extrabold text-emerald-800 flex items-center justify-between">
                      <span>ACTIVE & VERIFIED</span>
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    </div>
                  </div>
                </div>

                <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200/80 text-[11px] text-slate-600 flex items-center gap-2">
                  <Info className="h-4 w-4 text-indigo-600 shrink-0" />
                  <span>To update official work details or department assignments, please submit an HR request via the Helpdesk portal.</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PASSWORD & SECURITY */}
          {activeTab === 'security' && (
            <div className="max-w-2xl rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-5">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <KeyRound className="h-5 w-5 text-indigo-600" />
                  <span>Change Account Password</span>
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Ensure your account is using a strong password. Minimum 6 characters.
                </p>
              </div>

              {passwordSuccessMsg && (
                <div className="flex items-center gap-2.5 rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-xs font-bold text-emerald-800 animate-fade-in">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>{passwordSuccessMsg}</span>
                </div>
              )}

              {passwordErrorMsg && (
                <div className="flex items-center gap-2.5 rounded-xl bg-rose-50 border border-rose-200 p-4 text-xs font-bold text-rose-800 animate-fade-in">
                  <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                  <span>{passwordErrorMsg}</span>
                </div>
              )}

              <form onSubmit={handlePasswordChange} className="space-y-4">
                {/* Current Password */}
                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-slate-700">Current Password *</label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      required
                      placeholder="Enter your current account password..."
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-3.5 pr-10 text-xs font-medium text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-slate-700">New Password *</label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      placeholder="Enter new password (min. 6 characters)..."
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-3.5 pr-10 text-xs font-medium text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>

                  {/* Password Strength Meter */}
                  {newPassword && (
                    <div className="space-y-1 pt-1.5">
                      <div className="flex justify-between text-[11px] font-semibold text-slate-500">
                        <span>Strength: <strong className="text-slate-800">{passwordStrength.label}</strong></span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${passwordStrength.color} transition-all duration-300`}
                          style={{ width: `${passwordStrength.score}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm New Password */}
                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-slate-700">Confirm New Password *</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      placeholder="Re-enter new password..."
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-3.5 pr-10 text-xs font-medium text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isUpdatingPassword || !currentPassword || !newPassword}
                    className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {isUpdatingPassword ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <span>Updating Password...</span>
                      </>
                    ) : (
                      <>
                        <Lock className="h-3.5 w-3.5" />
                        <span>Update Password</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 3: TWO-FACTOR & ACTIVE SESSIONS */}
          {activeTab === 'sessions' && (
            <div className="space-y-6">
              {/* Two-Factor Authentication Status Card */}
              <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className="h-5 w-5 text-emerald-600" />
                    <div>
                      <h2 className="text-sm font-extrabold text-slate-900">Two-Factor & OTP Authentication Status</h2>
                      <p className="text-xs text-slate-500 mt-0.5">Two-factor login OTP verification active via Nodemailer Gmail SMTP.</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-extrabold text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    ENABLED & ENFORCED
                  </span>
                </div>

                <div className="rounded-xl bg-slate-50 p-4 border border-slate-200/80 text-xs text-slate-700 leading-relaxed font-medium">
                  Your login sessions require OTP verification codes dispatched to your registered email address (<strong className="text-slate-900">{email}</strong>).
                </div>
              </div>

              {/* Active Device Sessions List */}
              <div className="rounded-2xl border border-slate-200/90 bg-white shadow-xs overflow-hidden">
                <div className="border-b border-slate-200/80 bg-slate-50/60 px-5 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Monitor className="h-4 w-4 text-indigo-600" />
                    <h2 className="text-sm font-extrabold text-slate-900">Active Device Sessions</h2>
                  </div>
                  <span className="text-xs font-semibold text-slate-500">
                    {sessions.length} {sessions.length === 1 ? 'session' : 'sessions'}
                  </span>
                </div>

                {isLoading ? (
                  <div className="p-6 space-y-3">
                    {[1, 2].map((i) => (
                      <div key={i} className="animate-pulse h-12 bg-slate-100 rounded-xl"></div>
                    ))}
                  </div>
                ) : sessions.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400">
                    <Globe className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-bold text-slate-700 text-sm">No active session details found</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {sessions.map((sess) => (
                      <div key={sess.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/80 transition-colors">
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 border border-slate-200">
                            <Monitor className="h-5 w-5 text-slate-500" />
                          </div>
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <h3 className="text-xs font-extrabold text-slate-900 truncate max-w-xs">{sess.userAgent}</h3>
                              {sess.isCurrent && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-0.5 text-[10px] font-extrabold text-indigo-700 border border-indigo-200">
                                  <Sparkles className="h-3 w-3 text-indigo-600" />
                                  CURRENT SESSION
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] font-mono text-slate-500">
                              IP: {sess.ipAddress} • Created: {new Date(sess.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        {!sess.isCurrent && (
                          <button
                            onClick={() => handleRevokeSession(sess.id)}
                            disabled={revokingSessionId === sess.id}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 transition-all cursor-pointer disabled:opacity-40 shrink-0"
                          >
                            <Trash2 className="h-3.5 w-3.5 text-rose-600" />
                            <span>{revokingSessionId === sess.id ? 'Revoking...' : 'Revoke Session'}</span>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: NOTIFICATION PREFERENCES */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              {/* Notification Channel Health Status Card */}
              <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-4">
                <div className="border-b border-slate-100 pb-4">
                  <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                    <Bell className="h-4 w-4 text-indigo-600" />
                    <span>Notification Channels Status</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">Enterprise delivery gateway connections configured for alert dispatch.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
                    <span className="text-[11px] font-extrabold text-emerald-800 uppercase tracking-wider block">In-App Alerts</span>
                    <span className="text-xs font-bold text-emerald-700 mt-1 block">CONNECTED & ACTIVE</span>
                  </div>

                  <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-4">
                    <span className="text-[11px] font-extrabold text-indigo-800 uppercase tracking-wider block">Email / SMTP</span>
                    <span className="text-xs font-bold text-indigo-700 mt-1 block">CONNECTED (Gmail SMTP)</span>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">WhatsApp API</span>
                    <span className="text-xs font-semibold text-slate-600 mt-1 block">HR CONFIGURED</span>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">SMS Gateway</span>
                    <span className="text-xs font-semibold text-slate-600 mt-1 block">HR CONFIGURED</span>
                  </div>
                </div>
              </div>

              {/* Event Preferences List */}
              <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-4">
                <h2 className="text-sm font-extrabold text-slate-900 border-b border-slate-100 pb-3">Subscribed Notification Alerts</h2>
                <div className="space-y-3">
                  {[
                    { title: 'HR Private Messages', desc: 'Direct notices and messages from HR Management', status: 'In-App + Email' },
                    { title: 'Leave Application Decisions', desc: 'Approvals, rejections, and quota updates', status: 'In-App + Email' },
                    { title: 'Payroll Payout Bulletins', desc: 'Payslip generation and monthly salary releases', status: 'In-App + Email' },
                    { title: 'Attendance Alert Bulletins', desc: 'Missing check-in reminders and overtime logs', status: 'In-App' },
                    { title: 'Helpdesk Response Notifications', desc: 'Replies and status changes on HR tickets', status: 'In-App + Email' },
                  ].map((pref, idx) => (
                    <div key={idx} className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-slate-50/60 p-3.5">
                      <div>
                        <h3 className="text-xs font-bold text-slate-900">{pref.title}</h3>
                        <p className="text-[11px] text-slate-500">{pref.desc}</p>
                      </div>
                      <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-700 border border-emerald-200 shrink-0">
                        {pref.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </AdminLayout>
    </AuthGuard>
  );
}
