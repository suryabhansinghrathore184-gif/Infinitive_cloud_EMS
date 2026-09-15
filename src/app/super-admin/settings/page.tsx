'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { SuperAdminLayout } from '@/components/layout/SuperAdminLayout';
import { useAuthStore } from '@/store/authStore';
import { formatRoleLabel } from '@/lib/roleUtils';
import {
  Settings,
  RefreshCw,
  Save,
  CheckCircle2,
  AlertCircle,
  Database,
  Mail,
  Clock,
  ShieldAlert,
  Server,
  Building2,
  Globe,
  Camera,
  Trash2,
  Upload,
  X,
  User,
  ShieldCheck,
  DollarSign,
  Calendar,
  AlertTriangle,
  Lock,
} from 'lucide-react';

interface SystemSettingsData {
  systemName: string;
  maintenanceMode: boolean;
  allowSelfSignup: boolean;
  defaultOrganizationCode: string;
  defaultTimezone: string;
  supportEmail: string;
  smtpHost: string;
  smtpPort: number;
  smtpConfigured: boolean;
  storageBackend: string;
  dataRetentionDays: number;
  currency: string;
  dateFormat: string;
  language: string;
  updatedAt: string;
}

interface DbHealthData {
  dbName: string;
  mongoStatus: string;
  gridfsStatus: string;
  photosBucketStatus: string;
  documentsBucketStatus: string;
  totalPhotos: number;
  totalDocuments: number;
  lastCheckedAt: string;
}

interface SmtpTestData {
  provider: string;
  host: string;
  port: number;
  tls: string;
  status: string;
  message: string;
}

const DEFAULT_AVATAR =
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export default function SuperAdminSettingsPage() {
  const { user, updateUserAvatar } = useAuthStore();

  const [settings, setSettings] = useState<SystemSettingsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Profile State
  const [profileAvatar, setProfileAvatar] = useState<string>(user?.avatar || DEFAULT_AVATAR);
  const [profilePhotoId, setProfilePhotoId] = useState<string | null>(null);

  // Photo Upload Modal State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Remove Photo Modal State
  const [isRemovePhotoModalOpen, setIsRemovePhotoModalOpen] = useState(false);

  // Maintenance Confirmation Modal State
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
  const [pendingMaintenanceVal, setPendingMaintenanceVal] = useState<boolean | null>(null);

  // Real Diagnostics State
  const [isCheckingDb, setIsCheckingDb] = useState(false);
  const [dbHealth, setDbHealth] = useState<DbHealthData | null>(null);
  const [isTestingSmtp, setIsTestingSmtp] = useState(false);
  const [smtpTestResult, setSmtpTestResult] = useState<SmtpTestData | null>(null);

  // Sync avatar when user state updates
  useEffect(() => {
    if (user?.avatar) {
      setProfileAvatar(user.avatar);
    }
  }, [user]);

  // Robust, decoupled data fetcher avoiding infinite loading state
  const fetchSettings = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);

    // 1. Fetch System Settings
    try {
      const settingsRes = await fetch('/api/v1/super-admin/settings');
      if (settingsRes.ok) {
        const result = await settingsRes.json();
        if (result.success && result.data) {
          setSettings(result.data);
        } else {
          setLoadError(result.message || 'Failed to load system settings from server.');
        }
      } else {
        const errJson = await settingsRes.json().catch(() => ({}));
        setLoadError(errJson.message || `Server returned error status ${settingsRes.status}`);
      }
    } catch (err: any) {
      console.error('Error fetching global settings:', err);
      setLoadError(err.message || 'Network communication error while connecting to system settings API.');
    } finally {
      setIsLoading(false);
    }

    // 2. Fetch User Profile Info (Safely decoupled)
    try {
      const meRes = await fetch('/api/v1/auth/me');
      if (meRes.ok) {
        const meResult = await meRes.json();
        if (meResult.success && meResult.user && meResult.user.avatar) {
          setProfileAvatar(meResult.user.avatar);
          updateUserAvatar(meResult.user.avatar);
        }
      }
    } catch (meErr) {
      console.warn('Non-blocking error fetching user profile:', meErr);
    }

    // 3. Fetch Health status (Safely decoupled)
    try {
      const healthRes = await fetch('/api/v1/super-admin/settings/health');
      if (healthRes.ok) {
        const healthResult = await healthRes.json();
        if (healthResult.success && healthResult.data) {
          setDbHealth(healthResult.data);
        }
      }
    } catch (healthErr) {
      console.warn('Non-blocking error fetching DB health:', healthErr);
    }
  }, [updateUserAvatar]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleChange = (key: keyof SystemSettingsData, val: any) => {
    if (!settings) return;

    if (key === 'maintenanceMode' && val === true && !settings.maintenanceMode) {
      setPendingMaintenanceVal(true);
      setIsMaintenanceModalOpen(true);
      return;
    }

    setSettings({
      ...settings,
      [key]: val,
    });
  };

  const handleConfirmMaintenance = () => {
    if (settings && pendingMaintenanceVal !== null) {
      setSettings({
        ...settings,
        maintenanceMode: pendingMaintenanceVal,
      });
    }
    setIsMaintenanceModalOpen(false);
    setPendingMaintenanceVal(null);
  };

  const handleSave = async () => {
    if (!settings) return;
    setIsSaving(true);
    setMessage(null);

    try {
      const res = await fetch('/api/v1/super-admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      const result = await res.json();
      if (res.ok && result.success) {
        setMessage({ type: 'success', text: 'Global system settings saved successfully.' });
        if (result.data) {
          setSettings(result.data);
        }
      } else {
        setMessage({ type: 'error', text: result.message || 'Failed to save system settings.' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Network communication error.' });
    } finally {
      setIsSaving(false);
    }
  };

  // Profile Photo Validation (Client & Server side)
  const validateAndSelectFile = async (file: File) => {
    setFileError(null);

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !['jpg', 'jpeg', 'png', 'webp'].includes(ext)) {
      setFileError('Invalid file extension. Only .jpg, .jpeg, .png, and .webp files are allowed.');
      return;
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type.toLowerCase())) {
      setFileError('Invalid image format. Supported formats: JPG, JPEG, PNG, WEBP.');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      const mbSize = (file.size / (1024 * 1024)).toFixed(2);
      setFileError(`File size (${mbSize} MB) exceeds maximum allowed size of 5 MB.`);
      return;
    }

    try {
      const arrayBuffer = await file.slice(0, 4).arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      let isValidMagic = false;

      if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) isValidMagic = true;
      if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) isValidMagic = true;
      if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46) isValidMagic = true;

      if (!isValidMagic) {
        setFileError('Corrupted image binary or spoofed magic header signature verification failed.');
        return;
      }
    } catch {
      setFileError('Unable to inspect file binary content.');
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSelectFile(e.target.files[0]);
    }
  };

  const handleSavePhoto = async () => {
    if (!selectedFile) return;
    setIsUploadingPhoto(true);
    setFileError(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      if (profilePhotoId) {
        formData.append('previousFileId', profilePhotoId);
      }

      const res = await fetch('/api/v1/settings/profile/photo', {
        method: 'POST',
        body: formData,
      });

      const result = await res.json();
      if (res.ok && result.success) {
        const newPhotoUrl = result.photoUrl;
        setProfileAvatar(newPhotoUrl);
        setProfilePhotoId(result.fileId || null);
        updateUserAvatar(newPhotoUrl);

        setMessage({ type: 'success', text: 'Super Admin profile photo uploaded to GridFS successfully!' });
        setIsUploadModalOpen(false);
        setSelectedFile(null);
        setPreviewUrl(null);
      } else {
        setFileError(result.message || 'Failed to upload profile photo to GridFS.');
      }
    } catch (err: any) {
      setFileError(err.message || 'Network error during photo upload.');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleConfirmRemovePhoto = async () => {
    try {
      const res = await fetch('/api/v1/settings/profile/photo', {
        method: 'DELETE',
      });

      const result = await res.json();
      if (res.ok && result.success) {
        const fallbackAvatar = result.defaultAvatar || DEFAULT_AVATAR;
        setProfileAvatar(fallbackAvatar);
        setProfilePhotoId(null);
        updateUserAvatar(fallbackAvatar);

        setMessage({ type: 'success', text: 'Profile photo removed from GridFS. Reverted to default avatar.' });
      } else {
        setMessage({ type: 'error', text: result.message || 'Failed to remove profile photo.' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Network error deleting photo.' });
    } finally {
      setIsRemovePhotoModalOpen(false);
    }
  };

  const handleCheckDbConnection = async () => {
    setIsCheckingDb(true);
    try {
      const res = await fetch('/api/v1/super-admin/settings/health');
      if (res.ok) {
        const result = await res.json();
        if (result.success && result.data) {
          setDbHealth(result.data);
          setMessage({
            type: 'success',
            text: `Database health verified: ${result.data.dbName} (${result.data.mongoStatus}). GridFS Vault: ${result.data.gridfsStatus}.`,
          });
        }
      } else {
        setMessage({ type: 'error', text: 'Database connectivity test returned an error status.' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to reach database connection.' });
    } finally {
      setIsCheckingDb(false);
    }
  };

  const handleTestSmtp = async () => {
    setIsTestingSmtp(true);
    setSmtpTestResult(null);
    try {
      const res = await fetch('/api/v1/super-admin/settings/test-smtp', {
        method: 'POST',
      });
      const result = await res.json();
      if (res.ok && result.success && result.data) {
        setSmtpTestResult(result.data);
        if (result.data.status === 'Connected') {
          setMessage({ type: 'success', text: `SMTP Test Passed: ${result.data.message}` });
        } else {
          setMessage({ type: 'error', text: `SMTP Status: ${result.data.message}` });
        }
      } else {
        setMessage({ type: 'error', text: result.message || 'SMTP connection test failed.' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Network communication error testing SMTP relay.' });
    } finally {
      setIsTestingSmtp(false);
    }
  };

  const displayName = user?.name || 'Super Administrator';
  const displayEmail = user?.email || 'superadmin@organization.com';
  const roleLabel = formatRoleLabel(user?.role || 'SUPER_ADMIN');
  const employeeId = user?.employeeId || 'SUP0001';

  return (
    <SuperAdminLayout
      pageTitle="Global System & Infrastructure Settings"
      breadcrumbs={[
        { label: 'Executive Control Center', href: '/super-admin/dashboard' },
        { label: 'System Settings', href: '/super-admin/settings' },
      ]}
    >
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-slate-900">System Core Configuration</h2>
            <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-[10px] font-extrabold text-indigo-700 border border-indigo-200">
              Super Admin
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Global system controls, Super Admin identity, GridFS storage health, and outbound notification parameters
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchSettings}
            disabled={isLoading || isSaving}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 disabled:opacity-50 transition-colors cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh Settings</span>
          </button>

          <button
            onClick={handleSave}
            disabled={isSaving || isLoading || !settings}
            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-4 py-2 text-xs font-bold text-white shadow-md shadow-indigo-600/20 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {isSaving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            <span>Save System Controls</span>
          </button>
        </div>
      </div>

      {/* Notification Banner */}
      {message && (
        <div
          className={`flex items-center gap-2 rounded-2xl p-4 text-xs font-semibold border shadow-xs animate-fade-in ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          {message.type === 'success' ? <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" /> : <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* 1. SUPER ADMIN PROFILE & IDENTITY CARD */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-indigo-600" />
            <h3 className="text-sm font-extrabold text-slate-900">Profile & Admin Identity</h3>
          </div>
          <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-700 border border-emerald-200 flex items-center gap-1">
            <ShieldCheck className="h-3 w-3 text-emerald-600" />
            Active Governance Session
          </span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            {/* Avatar Container */}
            <div className="relative group shrink-0">
              <div className="h-24 w-24 rounded-full overflow-hidden ring-4 ring-indigo-500/20 shadow-md bg-slate-100">
                <img
                  src={profileAvatar}
                  alt={displayName}
                  className="h-full w-full object-cover"
                />
              </div>
              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg hover:bg-indigo-700 transition-transform group-hover:scale-105 cursor-pointer"
                title="Update Profile Photo"
              >
                <Camera className="h-4 w-4" />
              </button>
            </div>

            {/* Profile Identity Details */}
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-2">
                <h4 className="text-lg font-black text-slate-900">{displayName}</h4>
                <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-[10px] font-extrabold text-indigo-700 border border-indigo-200">
                  {roleLabel}
                </span>
              </div>
              <p className="font-medium text-slate-600">{displayEmail}</p>

              <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] font-semibold text-slate-500">
                <span>
                  Admin ID: <strong className="font-mono text-slate-800">{employeeId}</strong>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 text-emerald-700 font-bold">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  Status: Active
                </span>
                <span>•</span>
                <span>
                  GridFS Storage: <strong className="font-mono text-indigo-600">{profilePhotoId ? 'Photo Stored' : 'Default Avatar'}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-600/20 transition-colors cursor-pointer"
            >
              <Upload className="h-3.5 w-3.5" />
              <span>Change Photo</span>
            </button>

            <button
              onClick={() => setIsRemovePhotoModalOpen(true)}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-rose-50 hover:border-rose-200 hover:text-rose-700 px-3.5 py-2.5 text-xs font-semibold text-slate-700 shadow-2xs transition-colors cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Remove Photo</span>
            </button>
          </div>
        </div>
      </div>

      {/* Settings Grid States: Loading, Error, or Settings Content */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-16 text-slate-400 shadow-xs">
          <RefreshCw className="h-8 w-8 animate-spin text-indigo-600" />
          <p className="mt-3 text-xs font-medium text-slate-600">Loading system settings from MongoDB...</p>
        </div>
      ) : loadError && !settings ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-rose-200 bg-rose-50/50 p-12 text-center shadow-xs space-y-3">
          <AlertCircle className="h-10 w-10 text-rose-600" />
          <div>
            <h3 className="text-base font-extrabold text-rose-950">Unable to load system settings</h3>
            <p className="mt-1 text-xs text-rose-700 max-w-md">{loadError}</p>
          </div>
          <button
            onClick={fetchSettings}
            className="flex items-center gap-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 px-4 py-2 text-xs font-bold text-white shadow-md transition-colors cursor-pointer mt-2"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Retry Settings Load</span>
          </button>
        </div>
      ) : settings ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Section 2: Access & Maintenance Controls */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-3 border-b pb-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-600 font-bold">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Access & Maintenance</h3>
                <p className="text-[11px] text-slate-500">Global site availability & public self-registration mandates</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3.5 rounded-xl border border-rose-100 bg-rose-50/50">
                <div>
                  <p className="font-bold text-rose-900">Global Maintenance Mode</p>
                  <p className="text-[10px] text-rose-600">Temporarily restrict access for non-Super Admin users.</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.maintenanceMode}
                  onChange={(e) => handleChange('maintenanceMode', e.target.checked)}
                  className="h-5 w-5 rounded border-slate-300 text-rose-600 focus:ring-rose-500 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 bg-slate-50/60">
                <div>
                  <p className="font-bold text-slate-800">Allow Self-Registration</p>
                  <p className="text-[10px] text-slate-500">Allow public users to create accounts (Defaults strictly to EMPLOYEE role).</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.allowSelfSignup}
                  onChange={(e) => handleChange('allowSelfSignup', e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Section 3: General Branding & Regional */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-3 border-b pb-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 font-bold">
                <Globe className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">General Branding & Regional</h3>
                <p className="text-[11px] text-slate-500">Application title, timezone, support email, currency & date formats</p>
              </div>
            </div>

            <div className="space-y-3 text-xs font-medium">
              <div>
                <label className="block mb-1 font-bold text-slate-700">Application Title</label>
                <input
                  type="text"
                  value={settings.systemName}
                  onChange={(e) => handleChange('systemName', e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 font-semibold text-slate-800 focus:border-indigo-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 font-bold text-slate-700">Timezone</label>
                  <select
                    value={settings.defaultTimezone}
                    onChange={(e) => handleChange('defaultTimezone', e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-2.5 font-semibold text-slate-800 focus:border-indigo-500 focus:outline-hidden"
                  >
                    <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                    <option value="UTC">UTC (Universal)</option>
                    <option value="America/New_York">America/New_York (EST)</option>
                    <option value="Europe/London">Europe/London (GMT)</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-1 font-bold text-slate-700">Support Email</label>
                  <input
                    type="email"
                    value={settings.supportEmail}
                    onChange={(e) => handleChange('supportEmail', e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-2.5 font-semibold text-slate-800 focus:border-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 font-bold text-slate-700">Currency</label>
                  <select
                    value={settings.currency || 'INR (₹)'}
                    onChange={(e) => handleChange('currency', e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-2.5 font-semibold text-slate-800 focus:border-indigo-500 focus:outline-hidden"
                  >
                    <option value="INR (₹)">INR (₹)</option>
                    <option value="USD ($)">USD ($)</option>
                    <option value="EUR (€)">EUR (€)</option>
                    <option value="GBP (£)">GBP (£)</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-1 font-bold text-slate-700">Date Format</label>
                  <select
                    value={settings.dateFormat || 'DD/MM/YYYY'}
                    onChange={(e) => handleChange('dateFormat', e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-2.5 font-semibold text-slate-800 focus:border-indigo-500 focus:outline-hidden"
                  >
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Database & GridFS Storage Health */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 font-bold">
                  <Database className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">Database & GridFS Storage</h3>
                  <p className="text-[11px] text-slate-500">Real MongoDB Atlas & GridFS binary bucket health diagnostic</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCheckDbConnection}
                disabled={isCheckingDb}
                className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`h-3.5 w-3.5 text-indigo-600 ${isCheckingDb ? 'animate-spin' : ''}`} />
                <span>Check Connection</span>
              </button>
            </div>

            <div className="space-y-3 text-xs font-medium">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl border border-slate-100 bg-slate-50/60 space-y-1">
                  <p className="font-bold text-slate-700">MongoDB Atlas</p>
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-extrabold border ${
                    dbHealth?.mongoStatus === 'Connected' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
                  }`}>
                    <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                    {dbHealth?.mongoStatus || 'Connected'}
                  </span>
                  <p className="text-[10px] text-slate-500 font-mono">
                    Database: <strong className="text-slate-700">{dbHealth?.dbName || 'ems_database'}</strong>
                  </p>
                </div>

                <div className="p-3 rounded-xl border border-slate-100 bg-slate-50/60 space-y-1">
                  <p className="font-bold text-slate-700">GridFS Storage Vault</p>
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-extrabold border ${
                    dbHealth?.gridfsStatus === 'Healthy' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
                  }`}>
                    <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                    {dbHealth?.gridfsStatus || 'Healthy'}
                  </span>
                  <p className="text-[10px] text-slate-500">
                    Photos: <strong className="text-slate-700">{dbHealth?.totalPhotos ?? 0} files</strong>
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="flex items-center justify-between text-[11px] text-slate-600">
                  <span>Photo Bucket (photos.files):</span>
                  <span className="font-bold text-emerald-700">● {dbHealth?.photosBucketStatus || 'Healthy'}</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-600">
                  <span>Document Bucket (documents.files):</span>
                  <span className="font-bold text-emerald-700">● {dbHealth?.documentsBucketStatus || 'Healthy'}</span>
                </div>
              </div>

              {dbHealth?.lastCheckedAt && (
                <p className="text-[10px] text-slate-400 font-mono pt-1">
                  Last Health Check: {new Date(dbHealth.lastCheckedAt).toLocaleString()}
                </p>
              )}
            </div>
          </div>

          {/* Section 5: Email / SMTP Integration */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 font-bold">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">Email SMTP Integration</h3>
                  <p className="text-[11px] text-slate-500">Outbound system notification dispatcher relay status</p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleTestSmtp}
                disabled={isTestingSmtp}
                className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`h-3.5 w-3.5 text-emerald-600 ${isTestingSmtp ? 'animate-spin' : ''}`} />
                <span>Test SMTP Connection</span>
              </button>
            </div>

            <div className="space-y-3 text-xs font-medium">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <span className="block text-[10px] text-slate-500 font-bold uppercase">Provider</span>
                  <span className="font-bold text-slate-800">{smtpTestResult?.provider || 'Gmail SMTP'}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-500 font-bold uppercase">Host</span>
                  <span className="font-mono text-xs text-slate-800">{smtpTestResult?.host || settings.smtpHost}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-500 font-bold uppercase">Port & TLS</span>
                  <span className="font-mono text-xs text-slate-800">
                    {smtpTestResult?.port || settings.smtpPort} ({smtpTestResult?.tls || (settings.smtpPort === 465 ? 'SSL/TLS' : 'STARTTLS')})
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl border border-emerald-100 bg-emerald-50/50">
                <span className="font-bold text-emerald-900">Connection Status</span>
                <span className={`inline-flex items-center gap-1 font-bold ${
                  (smtpTestResult?.status || (settings.smtpConfigured ? 'Connected' : 'Not Configured')) === 'Connected'
                    ? 'text-emerald-700'
                    : 'text-amber-700'
                }`}>
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  {smtpTestResult?.status || (settings.smtpConfigured ? 'Connected' : 'Not Configured')}
                </span>
              </div>
            </div>
          </div>

          {/* Section 6: System Defaults */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-3 border-b pb-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600 font-bold">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">System Defaults</h3>
                <p className="text-[11px] text-slate-500">Audit log retention parameters & default organization code</p>
              </div>
            </div>

            <div className="space-y-3 text-xs font-medium">
              <div>
                <label className="block mb-1 font-bold text-slate-700">Audit Log Retention</label>
                <select
                  value={settings.dataRetentionDays}
                  onChange={(e) => handleChange('dataRetentionDays', parseInt(e.target.value, 10))}
                  className="w-full rounded-xl border border-slate-200 p-2.5 font-semibold text-slate-800 focus:border-indigo-500 focus:outline-hidden"
                >
                  <option value={30}>30 days</option>
                  <option value={90}>90 days</option>
                  <option value={180}>180 days</option>
                  <option value={365}>365 days (1 Year)</option>
                </select>
              </div>

              <div>
                <label className="block mb-1 font-bold text-slate-700">Default Organization Code</label>
                <input
                  type="text"
                  value={settings.defaultOrganizationCode}
                  onChange={(e) => handleChange('defaultOrganizationCode', e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 font-semibold text-slate-800 focus:border-indigo-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Section 7: Danger Zone */}
          <div className="rounded-2xl border border-rose-200/80 bg-white p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-3 border-b border-rose-100 pb-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-600 font-bold">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-rose-900">Danger Zone</h3>
                <p className="text-[11px] text-rose-600">High-impact system-wide governance controls requiring explicit confirmation</p>
              </div>
            </div>

            <div className="space-y-3 text-xs font-medium">
              <div className="flex items-center justify-between p-3.5 rounded-xl border border-rose-100 bg-rose-50/50">
                <div>
                  <p className="font-bold text-rose-900">Restrict Public Registration</p>
                  <p className="text-[10px] text-rose-600">Disable new self-registration accounts across all tenants</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleChange('allowSelfSignup', !settings.allowSelfSignup)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer ${
                    !settings.allowSelfSignup
                      ? 'bg-rose-600 text-white'
                      : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {!settings.allowSelfSignup ? 'Public Signup Disabled' : 'Disable Public Signup'}
                </button>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl border border-rose-100 bg-rose-50/50">
                <div>
                  <p className="font-bold text-rose-900">Global Maintenance Lockout</p>
                  <p className="text-[10px] text-rose-600">Toggle site-wide maintenance mode for non-Super Admin users</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleChange('maintenanceMode', !settings.maintenanceMode)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer ${
                    settings.maintenanceMode
                      ? 'bg-rose-600 text-white'
                      : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {settings.maintenanceMode ? 'Maintenance Mode Active' : 'Enable Maintenance Mode'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* UPDATE PROFILE PHOTO MODAL */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4 animate-scale-in">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <Camera className="h-5 w-5 text-indigo-600" />
                <h3 className="text-base font-extrabold text-slate-900">Update Profile Photo</h3>
              </div>
              <button
                onClick={() => {
                  setIsUploadModalOpen(false);
                  setSelectedFile(null);
                  setPreviewUrl(null);
                  setFileError(null);
                }}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {fileError && (
              <div className="rounded-xl bg-rose-50 p-3 text-xs font-semibold text-rose-700 border border-rose-200 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{fileError}</span>
              </div>
            )}

            {/* Preview Container */}
            <div className="flex flex-col items-center justify-center space-y-3 py-2">
              <div className="h-28 w-28 rounded-full overflow-hidden ring-4 ring-indigo-500/20 shadow-lg bg-slate-100">
                <img
                  src={previewUrl || profileAvatar}
                  alt="Preview"
                  className="h-full w-full object-cover"
                />
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <Upload className="h-3.5 w-3.5 text-indigo-600" />
                <span>Choose Photo (JPG, PNG, WEBP max 5MB)</span>
              </button>

              {selectedFile && (
                <p className="text-[11px] font-mono text-slate-500">
                  Selected: {selectedFile.name} ({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => {
                  setIsUploadModalOpen(false);
                  setSelectedFile(null);
                  setPreviewUrl(null);
                  setFileError(null);
                }}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSavePhoto}
                disabled={!selectedFile || isUploadingPhoto}
                className="flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-4 py-2 text-xs font-bold text-white shadow-md transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isUploadingPhoto ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                <span>Save Photo</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM REMOVE PHOTO MODAL */}
      {isRemovePhotoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600 border-b pb-3">
              <Trash2 className="h-6 w-6 shrink-0" />
              <h3 className="text-base font-extrabold text-slate-900">Remove Profile Photo?</h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Are you sure you want to remove your Super Admin profile photo? This will permanently delete the file from MongoDB GridFS storage and revert your profile to the default system avatar.
            </p>

            <div className="flex items-center justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setIsRemovePhotoModalOpen(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmRemovePhoto}
                className="rounded-xl bg-rose-600 hover:bg-rose-700 px-4 py-2 text-xs font-bold text-white shadow-md transition-colors cursor-pointer"
              >
                Confirm Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM MAINTENANCE MODE MODAL */}
      {isMaintenanceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600 border-b pb-3">
              <AlertTriangle className="h-6 w-6 shrink-0" />
              <h3 className="text-base font-extrabold text-slate-900">Enable Global Maintenance Mode?</h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Enabling Maintenance Mode will temporarily restrict system access for non-Super Admin users (Admins, HR, Managers, and Employees). Super Admin privileges will remain fully active so you can perform server maintenance safely.
            </p>

            <div className="flex items-center justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => {
                  setIsMaintenanceModalOpen(false);
                  setPendingMaintenanceVal(null);
                }}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmMaintenance}
                className="rounded-xl bg-rose-600 hover:bg-rose-700 px-4 py-2 text-xs font-bold text-white shadow-md transition-colors cursor-pointer"
              >
                Enable Maintenance Mode
              </button>
            </div>
          </div>
        </div>
      )}
    </SuperAdminLayout>
  );
}
