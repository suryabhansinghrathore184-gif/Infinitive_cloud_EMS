'use client';

import React, { useState, useRef, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { useEmsStore } from '@/store/emsStore';
import { useAuthStore } from '@/store/authStore';
import {
  Building2,
  Clock,
  CalendarDays,
  CreditCard,
  Bell,
  Save,
  CheckCircle2,
  AlertCircle,
  User,
  Camera,
  ShieldCheck,
  Upload,
  Trash2,
  Loader2,
  FileImage,
} from 'lucide-react';

const DEFAULT_AVATAR =
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export default function SettingsPage() {
  const { state, updateAdminProfile } = useEmsStore();
  const { updateUserAvatar } = useAuthStore();
  const [activeTab, setActiveTab] = useState<
    'profile' | 'org' | 'attendance' | 'leave' | 'payroll' | 'notification'
  >('profile');

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const adminUser = state.adminUser || {
    name: 'Admin',
    email: 'admin@organization.com',
    role: 'HR Administrator',
    avatar: DEFAULT_AVATAR,
    phone: '+91 98765 43210',
  };

  const [profileData, setProfileData] = useState({
    name: adminUser.name,
    email: adminUser.email,
    role: adminUser.role,
    avatar: adminUser.avatar,
    phone: adminUser.phone || '',
  });

  // File upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [currentGridFsId, setCurrentGridFsId] = useState<string | null>(null);

  useEffect(() => {
    // Extract GridFS file ID from existing avatar URL if present
    if (adminUser.avatar && adminUser.avatar.includes('id=')) {
      const match = adminUser.avatar.match(/id=([a-fA-F0-9]{24})/);
      if (match) {
        setCurrentGridFsId(match[1]);
      }
    }
  }, [adminUser.avatar]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Handle local file selection from computer
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate image format
    if (!ALLOWED_TYPES.includes(file.type.toLowerCase())) {
      showToast(
        'Invalid file format. Only JPG, JPEG, PNG, and WEBP images are supported.',
        'error'
      );
      return;
    }

    // Validate size limit (<= 5 MB)
    if (file.size > MAX_FILE_SIZE) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
      showToast(`Selected file size (${sizeMb} MB) exceeds the 5 MB limit.`, 'error');
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    showToast(`Selected "${file.name}" (${(file.size / 1024).toFixed(1)} KB). Click "Save Profile & Photo" to upload.`, 'success');
  };

  // Upload image binary to backend MongoDB GridFS & Save Profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);

    try {
      let finalAvatarUrl = profileData.avatar;

      // If user selected a new photo file from computer
      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        if (currentGridFsId) {
          formData.append('previousFileId', currentGridFsId);
        }

        const res = await fetch('/api/v1/admin/profile/photo', {
          method: 'POST',
          body: formData,
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.message || 'Failed to upload photo to MongoDB GridFS');
        }

        finalAvatarUrl = data.photoUrl;
        if (data.fileId) {
          setCurrentGridFsId(data.fileId);
        }
        setSelectedFile(null);
        setPreviewUrl(null);
      }

      // Update state stores
      const updatedProfile = {
        ...profileData,
        avatar: finalAvatarUrl,
      };

      setProfileData(updatedProfile);
      updateAdminProfile(updatedProfile);
      updateUserAvatar(finalAvatarUrl);

      showToast('Admin Profile & Photo saved to MongoDB GridFS successfully!', 'success');
    } catch (err: any) {
      console.error('Error saving profile:', err);
      showToast(err.message || 'An error occurred while saving profile.', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  // Remove photo from MongoDB GridFS and reset to default
  const handleRemovePhoto = async () => {
    setIsUploading(true);
    try {
      let url = '/api/v1/admin/profile/photo';
      if (currentGridFsId) {
        url += `?id=${currentGridFsId}`;
      }

      const res = await fetch(url, { method: 'DELETE' });
      const data = await res.json();

      const newAvatar = data.defaultAvatar || DEFAULT_AVATAR;

      setSelectedFile(null);
      setPreviewUrl(null);
      setCurrentGridFsId(null);

      const updatedProfile = {
        ...profileData,
        avatar: newAvatar,
      };

      setProfileData(updatedProfile);
      updateAdminProfile(updatedProfile);
      updateUserAvatar(newAvatar);

      showToast('Profile photo removed from MongoDB GridFS successfully!', 'success');
    } catch (err: any) {
      console.error('Error removing photo:', err);
      showToast('Failed to delete photo from GridFS.', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const displayAvatar = previewUrl || profileData.avatar || DEFAULT_AVATAR;

  return (
    <AdminLayout
      pageTitle="System Settings & Admin Profile"
      breadcrumbs={[{ label: 'Settings', href: '/admin/settings' }]}
    >
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed right-6 top-20 z-50 flex items-center gap-2.5 rounded-xl px-4 py-3 text-xs text-white shadow-2xl border transition-all ${
            toast.type === 'success'
              ? 'bg-slate-900 border-emerald-500/50'
              : 'bg-rose-950 border-rose-500/50'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
          )}
          <span className="font-medium">{toast.message}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">System & Admin Profile Configurations</h2>
          <p className="text-xs text-slate-500">
            Upload profile photo to MongoDB GridFS, configure account credentials & system parameters
          </p>
        </div>

        {activeTab === 'profile' ? (
          <button
            onClick={handleSaveProfile}
            disabled={isUploading}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-md hover:bg-blue-700 active:scale-95 disabled:opacity-50"
          >
            {isUploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span>{isUploading ? 'Uploading to MongoDB...' : 'Save Profile & Photo'}</span>
          </button>
        ) : (
          <button
            onClick={() => showToast('System settings saved successfully!')}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-md hover:bg-blue-700 active:scale-95"
          >
            <Save className="h-4 w-4" /> Save Settings
          </button>
        )}
      </div>

      {/* Settings Navigation Bar */}
      <div className="flex border-b border-slate-200 bg-white rounded-xl p-1 shadow-sm text-xs font-semibold text-slate-600 overflow-x-auto">
        {[
          { key: 'profile', label: 'Admin Profile & Photo', icon: User },
          { key: 'org', label: 'Organization Settings', icon: Building2 },
          { key: 'attendance', label: 'Attendance Rules', icon: Clock },
          { key: 'leave', label: 'Leave Policies', icon: CalendarDays },
          { key: 'payroll', label: 'Payroll Settings', icon: CreditCard },
          { key: 'notification', label: 'Notification Settings', icon: Bell },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2.5 transition-all whitespace-nowrap ${
                activeTab === tab.key
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Form Content Container */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm text-xs text-slate-700">
        {/* TAB 1: ADMIN PROFILE & REAL PHOTO UPLOAD VIA MONGODB GRIDFS */}
        {activeTab === 'profile' && (
          <form onSubmit={handleSaveProfile} className="space-y-6">
            {/* Hidden File Input */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* Photo Section */}
            <div className="flex flex-col sm:flex-row items-center gap-6 border-b border-slate-100 pb-6">
              {/* Profile Image Preview */}
              <div className="relative h-28 w-28 flex-shrink-0 overflow-hidden rounded-full ring-4 ring-blue-500/20 shadow-lg group">
                <img
                  src={displayAvatar}
                  alt={profileData.name}
                  className="h-28 w-28 rounded-full object-cover"
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 bg-slate-900/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white"
                >
                  <Camera className="h-6 w-6" />
                  <span className="text-[10px] font-bold mt-1">Change</span>
                </div>
              </div>

              {/* Photo Actions & Metadata */}
              <div className="flex-1 space-y-3 text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <h3 className="text-base font-bold text-slate-900">Admin Profile Photo</h3>
                  <span className="flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 border border-blue-200">
                    <ShieldCheck className="h-3 w-3" /> GridFS Storage
                  </span>
                </div>

                <p className="text-slate-500 text-xs leading-relaxed max-w-xl">
                  Upload an actual image file from your computer (JPG, PNG, WEBP; max 5 MB). The binary data will be stored directly in MongoDB GridFS.
                </p>

                {/* Selected File Details */}
                {selectedFile && (
                  <div className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50/60 px-3 py-1.5 text-xs text-blue-900 font-medium">
                    <FileImage className="h-4 w-4 text-blue-600" />
                    <span>
                      Selected: <strong>{selectedFile.name}</strong> ({(selectedFile.size / 1024).toFixed(1)} KB)
                    </span>
                    <span className="rounded bg-blue-200 px-1.5 py-0.5 text-[10px] uppercase font-bold text-blue-800">
                      {selectedFile.type.split('/')[1]}
                    </span>
                  </div>
                )}

                {/* Upload Buttons */}
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 font-semibold text-white hover:bg-slate-800 active:scale-95 transition-all shadow-sm disabled:opacity-50"
                  >
                    <Upload className="h-3.5 w-3.5 text-blue-400" />
                    <span>Select Image from Computer</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    disabled={isUploading}
                    className="flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50/60 px-3 py-2 font-semibold text-rose-700 hover:bg-rose-100 active:scale-95 transition-all disabled:opacity-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Remove Photo</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Form Fields Grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="font-bold text-slate-900">Admin Full Name *</label>
                <input
                  type="text"
                  required
                  value={profileData.name}
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  className="mt-1 w-full rounded-xl border p-2.5 bg-slate-50 focus:border-blue-500 focus:bg-white font-semibold text-slate-900"
                />
              </div>

              <div>
                <label className="font-bold text-slate-900">Admin Email Address *</label>
                <input
                  type="email"
                  required
                  value={profileData.email}
                  onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                  className="mt-1 w-full rounded-xl border p-2.5 bg-slate-50 focus:border-blue-500 focus:bg-white font-semibold text-slate-900"
                />
              </div>

              <div>
                <label className="font-bold text-slate-900">Role Title</label>
                <input
                  type="text"
                  value={profileData.role}
                  onChange={(e) => setProfileData({ ...profileData, role: e.target.value })}
                  className="mt-1 w-full rounded-xl border p-2.5 bg-slate-50 focus:border-blue-500 focus:bg-white font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-slate-900">Contact Phone</label>
                <input
                  type="text"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  className="mt-1 w-full rounded-xl border p-2.5 bg-slate-50 focus:border-blue-500 focus:bg-white font-medium"
                />
              </div>
            </div>

            <div className="flex justify-end border-t pt-4">
              <button
                type="submit"
                disabled={isUploading}
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 font-bold text-white shadow-md hover:bg-blue-700 active:scale-95 disabled:opacity-50"
              >
                {isUploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                <span>{isUploading ? 'Uploading to MongoDB...' : 'Save Profile & Photo'}</span>
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: ORGANIZATION SETTINGS */}
        {activeTab === 'org' && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-slate-800">Company Name</label>
              <input type="text" defaultValue={state.company.name} className="mt-1 w-full rounded-xl border p-2.5 bg-slate-50" />
            </div>
            <div>
              <label className="font-bold text-slate-800">Default Timezone</label>
              <input type="text" defaultValue={state.company.timezone} className="mt-1 w-full rounded-xl border p-2.5 bg-slate-50" />
            </div>
            <div>
              <label className="font-bold text-slate-800">Base Currency</label>
              <input type="text" defaultValue={state.company.currency} className="mt-1 w-full rounded-xl border p-2.5 bg-slate-50" />
            </div>
            <div>
              <label className="font-bold text-slate-800">Working Days Per Week</label>
              <input type="text" defaultValue={state.company.workingDays} className="mt-1 w-full rounded-xl border p-2.5 bg-slate-50" />
            </div>
          </div>
        )}

        {/* TAB 3: ATTENDANCE RULES */}
        {activeTab === 'attendance' && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-slate-800">Official Shift Start</label>
              <input type="text" defaultValue="09:00 AM" className="mt-1 w-full rounded-xl border p-2.5 bg-slate-50" />
            </div>
            <div>
              <label className="font-bold text-slate-800">Late Mark Threshold</label>
              <input type="text" defaultValue="15 Minutes grace period" className="mt-1 w-full rounded-xl border p-2.5 bg-slate-50" />
            </div>
          </div>
        )}

        {/* TAB 4: LEAVE POLICIES */}
        {activeTab === 'leave' && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-slate-800">Leave Approval Workflow</label>
              <input type="text" defaultValue="2-Tier (Manager -> HR Approval)" className="mt-1 w-full rounded-xl border p-2.5 bg-slate-50" />
            </div>
            <div>
              <label className="font-bold text-slate-800">Earned Leave Carry-Forward Limit</label>
              <input type="text" defaultValue="Maximum 30 Days" className="mt-1 w-full rounded-xl border p-2.5 bg-slate-50" />
            </div>
          </div>
        )}

        {/* TAB 5: PAYROLL SETTINGS */}
        {activeTab === 'payroll' && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-slate-800">Monthly Payroll Cycle</label>
              <input type="text" defaultValue="1st to Last Day of Month (Disbursed on 1st)" className="mt-1 w-full rounded-xl border p-2.5 bg-slate-50" />
            </div>
            <div>
              <label className="font-bold text-slate-800">Provident Fund (PF) Contribution</label>
              <input type="text" defaultValue="12% of Basic Salary" className="mt-1 w-full rounded-xl border p-2.5 bg-slate-50" />
            </div>
          </div>
        )}

        {/* TAB 6: NOTIFICATIONS */}
        {activeTab === 'notification' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <span>Enable Email Payslip Notifications</span>
              <input type="checkbox" defaultChecked className="h-4 w-4" />
            </div>
            <div className="flex items-center justify-between border-b pb-2">
              <span>Enable WhatsApp Leave Approval Broadcasts</span>
              <input type="checkbox" defaultChecked className="h-4 w-4" />
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
