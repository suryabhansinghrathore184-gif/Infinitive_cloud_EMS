'use client';

import React, { useState } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Settings, Building2, Clock, CalendarDays, CreditCard, Bell, Save, CheckCircle2 } from 'lucide-react';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'org' | 'attendance' | 'leave' | 'payroll' | 'notification'>('org');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleSave = () => {
    setToastMessage('System settings updated successfully!');
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <AdminLayout
      pageTitle="System Settings"
      breadcrumbs={[{ label: 'Settings', href: '/admin/settings' }]}
    >
      {/* Toast */}
      {toastMessage && (
        <div className="fixed right-6 top-20 z-50 flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs text-white shadow-xl">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">System & Module Configurations</h2>
          <p className="text-xs text-slate-500">
            Configure global organization parameters, attendance rules, leave policies, and payroll settings
          </p>
        </div>

        <button
          onClick={handleSave}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-md hover:bg-blue-700"
        >
          <Save className="h-4 w-4" /> Save Changes
        </button>
      </div>

      {/* Settings Navigation Bar */}
      <div className="flex border-b border-slate-200 bg-white rounded-xl p-1 shadow-sm text-xs font-semibold text-slate-600">
        {[
          { key: 'org', label: 'Organization', icon: Building2 },
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
              className={`flex items-center gap-2 rounded-lg px-4 py-2.5 transition-all ${
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
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm text-xs text-slate-700 space-y-4">
        {activeTab === 'org' && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-slate-800">Company Name</label>
              <input type="text" defaultValue="Enterprise HRMS Global Ltd." className="mt-1 w-full rounded-xl border p-2.5 bg-slate-50" />
            </div>
            <div>
              <label className="font-bold text-slate-800">Default Timezone</label>
              <input type="text" defaultValue="Asia/Kolkata (IST +05:30)" className="mt-1 w-full rounded-xl border p-2.5 bg-slate-50" />
            </div>
            <div>
              <label className="font-bold text-slate-800">Base Currency</label>
              <input type="text" defaultValue="INR (₹)" className="mt-1 w-full rounded-xl border p-2.5 bg-slate-50" />
            </div>
            <div>
              <label className="font-bold text-slate-800">Working Days Per Week</label>
              <input type="text" defaultValue="5 Days (Monday - Friday)" className="mt-1 w-full rounded-xl border p-2.5 bg-slate-50" />
            </div>
          </div>
        )}

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
