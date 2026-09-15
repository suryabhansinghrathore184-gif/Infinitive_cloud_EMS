'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { SuperAdminLayout } from '@/components/layout/SuperAdminLayout';
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
  updatedAt: string;
}

export default function SuperAdminSettingsPage() {
  const [settings, setSettings] = useState<SystemSettingsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/v1/super-admin/settings');
      if (res.ok) {
        const result = await res.json();
        if (result.success && result.data) {
          setSettings(result.data);
        }
      }
    } catch (err) {
      console.error('Error fetching global settings:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleChange = (key: keyof SystemSettingsData, val: any) => {
    if (!settings) return;
    setSettings({
      ...settings,
      [key]: val,
    });
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
        fetchSettings();
      } else {
        setMessage({ type: 'error', text: result.message || 'Failed to save system settings.' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Network communication error.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SuperAdminLayout
      pageTitle="Global System & Infrastructure Settings"
      breadcrumbs={[
        { label: 'Executive Dashboard', href: '/super-admin/dashboard' },
        { label: 'System Settings', href: '/super-admin/settings' },
      ]}
    >
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-slate-900">System Core Configuration</h2>
            <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-[10px] font-extrabold text-indigo-700 border border-indigo-200">
              GLOBAL ROOT
            </span>
          </div>
          <p className="text-xs text-slate-500">
            System maintenance controls, self-registration mandates, GridFS storage parameters, and default organization rules
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchSettings}
            disabled={isLoading || isSaving}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh Settings</span>
          </button>

          <button
            onClick={handleSave}
            disabled={isSaving || isLoading || !settings}
            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-4 py-2 text-xs font-bold text-white shadow-md transition-colors disabled:opacity-50"
          >
            {isSaving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            <span>Save System Controls</span>
          </button>
        </div>
      </div>

      {/* Notification Banner */}
      {message && (
        <div
          className={`flex items-center gap-2 rounded-xl p-3.5 text-xs font-semibold border ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          {message.type === 'success' ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <AlertCircle className="h-4 w-4 text-rose-600" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Settings Grid */}
      {isLoading || !settings ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-16 text-slate-400">
          <RefreshCw className="h-8 w-8 animate-spin text-indigo-600" />
          <p className="mt-3 text-xs font-medium text-slate-600">Loading system settings...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Section 1: Maintenance & System Controls */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-3 border-b pb-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-600 font-bold">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">System Maintenance & Access Controls</h3>
                <p className="text-[11px] text-slate-500">Manage global site availability and onboarding</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3.5 rounded-xl border border-rose-100 bg-rose-50/50">
                <div>
                  <p className="font-bold text-rose-900">Global Maintenance Mode</p>
                  <p className="text-[10px] text-rose-600">Temporarily restrict access for non-Super Admin users</p>
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
                  <p className="text-[10px] text-slate-500">Permit new users to register accounts on public sign-up</p>
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

          {/* Section 2: General System Information */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-3 border-b pb-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 font-bold">
                <Globe className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">General Branding & Regional</h3>
                <p className="text-[11px] text-slate-500">Application title, default timezone, and contact email</p>
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
                  <label className="block mb-1 font-bold text-slate-700">Default Timezone</label>
                  <select
                    value={settings.defaultTimezone}
                    onChange={(e) => handleChange('defaultTimezone', e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-2.5 font-semibold text-slate-800 focus:border-indigo-500 focus:outline-hidden"
                  >
                    <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                    <option value="UTC">UTC (Coordinated Universal Time)</option>
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
            </div>
          </div>

          {/* Section 3: Storage & Retention Infrastructure */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-3 border-b pb-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 font-bold">
                <Database className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Database & GridFS Storage</h3>
                <p className="text-[11px] text-slate-500">Document vault persistence and log retention</p>
              </div>
            </div>

            <div className="space-y-3 text-xs font-medium">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-700">Primary Storage Provider</p>
                  <p className="text-[10px] text-slate-500">GridFS binary file chunking</p>
                </div>
                <span className="rounded-lg bg-blue-50 px-3 py-1 font-mono text-xs font-extrabold text-blue-700 border border-blue-200">
                  {settings.storageBackend}
                </span>
              </div>

              <div>
                <label className="block mb-1 font-bold text-slate-700">Audit & Log Retention (Days)</label>
                <input
                  type="number"
                  min={30}
                  max={3650}
                  value={settings.dataRetentionDays}
                  onChange={(e) => handleChange('dataRetentionDays', parseInt(e.target.value, 10) || 365)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 font-semibold text-slate-800 focus:border-indigo-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Email SMTP Service */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-3 border-b pb-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 font-bold">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Email SMTP Integration Status</h3>
                <p className="text-[11px] text-slate-500">Global outbound notification dispatcher relay</p>
              </div>
            </div>

            <div className="space-y-3 text-xs font-medium">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700">SMTP Host Connection</span>
                <span className="font-mono text-xs text-slate-800">
                  {settings.smtpHost}:{settings.smtpPort}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl border border-emerald-100 bg-emerald-50/50">
                <span className="font-bold text-emerald-900">Relay Server Health</span>
                <span className="inline-flex items-center gap-1 font-bold text-emerald-700">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  Active & Configured
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </SuperAdminLayout>
  );
}
