'use client';

import React, { useState } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { useEmsStore } from '@/store/emsStore';
import { Settings, Building2, Clock, CalendarDays, CreditCard, Bell, Save, CheckCircle2, User, Camera, ShieldCheck } from 'lucide-react';

export default function SettingsPage() {
  const { state, updateAdminProfile } = useEmsStore();
  const [activeTab, setActiveTab] = useState<'profile' | 'org' | 'attendance' | 'leave' | 'payroll' | 'notification'>('profile');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const adminUser = state.adminUser || {
    name: 'Admin',
    email: 'admin@organization.com',
    role: 'HR Administrator',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80',
    phone: '+91 98765 43210',
  };

  const [profileData, setProfileData] = useState({
    name: adminUser.name,
    email: adminUser.email,
    role: adminUser.role,
    avatar: adminUser.avatar,
    phone: adminUser.phone || '',
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateAdminProfile(profileData);
    showToast('Admin Profile Photo & Details updated successfully!');
  };

  const presetAvatars = [
    { label: 'Executive Male 1', url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80' },
    { label: 'Executive Female 1', url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80' },
    { label: 'Professional Male 2', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' },
    { label: 'Professional Female 2', url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80' },
    { label: 'Corporate Avatar 3', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' },
  ];

  return (
    <AdminLayout
      pageTitle="System Settings & Admin Profile"
      breadcrumbs={[{ label: 'Settings', href: '/admin/settings' }]}
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed right-6 top-20 z-50 flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs text-white shadow-xl border border-slate-700">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">System & Admin Profile Configurations</h2>
          <p className="text-xs text-slate-500">
            Upload profile photo, configure account credentials, organization parameters, and system rules
          </p>
        </div>

        {activeTab === 'profile' ? (
          <button
            onClick={handleSaveProfile}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-md hover:bg-blue-700 active:scale-95"
          >
            <Save className="h-4 w-4" /> Save Profile & Photo
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

      {/* Form Content */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm text-xs text-slate-700">
        {/* TAB 1: ADMIN PROFILE & PHOTO UPLOAD */}
        {activeTab === 'profile' && (
          <form onSubmit={handleSaveProfile} className="space-y-6">
            {/* Photo Section */}
            <div className="flex flex-col sm:flex-row items-center gap-6 border-b border-slate-100 pb-6">
              <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-full ring-4 ring-blue-500/20 shadow-md">
                <img
                  src={profileData.avatar}
                  alt={profileData.name}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-slate-900/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                  <Camera className="h-6 w-6 text-white" />
                </div>
              </div>

              <div className="flex-1 space-y-2 text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <h3 className="text-base font-bold text-slate-900">Admin Profile Photo</h3>
                  <span className="flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 border border-blue-200">
                    <ShieldCheck className="h-3 w-3" /> HR Administrator
                  </span>
                </div>
                <p className="text-slate-500 text-xs">
                  Upload custom photo URL or pick from enterprise executive avatars below.
                </p>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-2">
                  {presetAvatars.map((preset, idx) => (
                    <button
                      type="button"
                      key={idx}
                      onClick={() => setProfileData({ ...profileData, avatar: preset.url })}
                      className={`flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-[11px] font-semibold transition-all ${
                        profileData.avatar === preset.url
                          ? 'border-blue-600 bg-blue-50 text-blue-700 ring-1 ring-blue-500'
                          : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <img src={preset.url} alt={preset.label} className="h-4 w-4 rounded-full object-cover" />
                      <span>{preset.label}</span>
                    </button>
                  ))}
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
                  className="mt-1 w-full rounded-xl border p-2.5 bg-slate-50 focus:border-blue-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="font-bold text-slate-900">Contact Phone</label>
                <input
                  type="text"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  className="mt-1 w-full rounded-xl border p-2.5 bg-slate-50 focus:border-blue-500 focus:bg-white"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="font-bold text-slate-900">Custom Profile Photo URL</label>
                <input
                  type="text"
                  placeholder="https://example.com/my-admin-photo.jpg"
                  value={profileData.avatar}
                  onChange={(e) => setProfileData({ ...profileData, avatar: e.target.value })}
                  className="mt-1 w-full rounded-xl border p-2.5 bg-slate-50 focus:border-blue-500 focus:bg-white font-mono text-[11px]"
                />
              </div>
            </div>

            <div className="flex justify-end border-t pt-4">
              <button
                type="submit"
                className="rounded-xl bg-blue-600 px-5 py-2 font-bold text-white shadow-md hover:bg-blue-700 active:scale-95"
              >
                Save Profile & Photo
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
