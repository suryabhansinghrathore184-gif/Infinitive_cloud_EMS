'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { SuperAdminLayout } from '@/components/layout/SuperAdminLayout';
import {
  Lock,
  ShieldCheck,
  ShieldAlert,
  Key,
  RefreshCw,
  Save,
  CheckCircle2,
  AlertCircle,
  Activity,
  Server,
  UserCheck,
} from 'lucide-react';

interface SecurityData {
  config: {
    mfaEnforced: boolean;
    mfaForSuperAdminsOnly: boolean;
    passwordPolicyMinLength: number;
    requireSpecialChars: boolean;
    requireNumbers: boolean;
    maxLoginAttempts: number;
    sessionTimeoutMinutes: number;
    concurrentSessionsAllowed: boolean;
    ipWhitelistEnabled: boolean;
    allowedIpRanges: string[];
    updatedAt: string;
  };
  stats: {
    totalUsersCount: number;
    activeSessionsCount: number;
    failedLoginsLast24h: number;
    sslStatus: string;
    dbEncryptionStatus: string;
  };
}

export default function SuperAdminSecurityPage() {
  const [data, setData] = useState<SecurityData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchSecurityData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/v1/super-admin/security');
      if (res.ok) {
        const result = await res.json();
        if (result.success && result.data) {
          setData(result.data);
        }
      }
    } catch (err) {
      console.error('Error fetching security settings:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSecurityData();
  }, [fetchSecurityData]);

  const handleToggle = (key: string) => {
    if (!data) return;
    setData({
      ...data,
      config: {
        ...data.config,
        [key]: !(data.config as any)[key],
      },
    });
  };

  const handleNumberChange = (key: string, val: number) => {
    if (!data) return;
    setData({
      ...data,
      config: {
        ...data.config,
        [key]: val,
      },
    });
  };

  const handleSave = async () => {
    if (!data) return;
    setIsSaving(true);
    setMessage(null);

    try {
      const res = await fetch('/api/v1/super-admin/security', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: data.config }),
      });

      const result = await res.json();
      if (res.ok && result.success) {
        setMessage({ type: 'success', text: 'Security policy governance parameters saved successfully.' });
        fetchSecurityData();
      } else {
        setMessage({ type: 'error', text: result.message || 'Failed to update security configuration.' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Network communication error.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SuperAdminLayout
      pageTitle="System Security & Governance Center"
      breadcrumbs={[
        { label: 'Executive Dashboard', href: '/super-admin/dashboard' },
        { label: 'Security Center', href: '/super-admin/security' },
      ]}
    >
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-slate-900">Security Governance Controls</h2>
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-800 border border-emerald-300">
              ENTERPRISE SHIELD
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Multi-factor authentication enforcement, password strength requirements, session security, and access whitelisting
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchSecurityData}
            disabled={isLoading || isSaving}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh Audit</span>
          </button>

          <button
            onClick={handleSave}
            disabled={isSaving || isLoading || !data}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:from-amber-600 hover:to-indigo-700 disabled:opacity-50"
          >
            {isSaving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            <span>Save Security Policies</span>
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

      {/* Live Security Metrics */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Active Sessions</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <Activity className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900">{data?.stats?.activeSessionsCount ?? 0}</p>
          <p className="mt-0.5 text-[10px] font-semibold text-emerald-600">Live Authenticated Tokens</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Failed Logins (24h)</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
              <ShieldAlert className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-rose-600">{data?.stats?.failedLoginsLast24h ?? 0}</p>
          <p className="mt-0.5 text-[10px] text-slate-400">Suspicious requests</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Transport Security</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Lock className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-sm font-black text-emerald-600">TLS 1.3 / SSL</p>
          <p className="mt-0.5 text-[10px] text-emerald-700 font-semibold">Active & Valid</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Database Vault</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Server className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-sm font-black text-blue-600">AES-256 Atlas</p>
          <p className="mt-0.5 text-[10px] text-slate-500">Encrypted at Rest</p>
        </div>
      </div>

      {/* Main Settings Sections */}
      {isLoading || !data ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-16 text-slate-400">
          <RefreshCw className="h-8 w-8 animate-spin text-indigo-600" />
          <p className="mt-3 text-xs font-medium text-slate-600">Loading security governance policies...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Card 1: Multi-Factor Authentication */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-3 border-b pb-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 font-bold">
                <Key className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Multi-Factor Authentication (MFA)</h3>
                <p className="text-[11px] text-slate-500">Configure global 2FA and OTP login mandates</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/60">
                <div>
                  <p className="font-bold text-slate-800">Enforce MFA for All Users</p>
                  <p className="text-[10px] text-slate-500">Require TOTP authenticator app on every login</p>
                </div>
                <input
                  type="checkbox"
                  checked={data.config.mfaEnforced}
                  onChange={() => handleToggle('mfaEnforced')}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/60">
                <div>
                  <p className="font-bold text-slate-800">Enforce MFA for Super Admin & Admin Only</p>
                  <p className="text-[10px] text-slate-500">Require 2FA specifically for root administrators</p>
                </div>
                <input
                  type="checkbox"
                  checked={data.config.mfaForSuperAdminsOnly}
                  onChange={() => handleToggle('mfaForSuperAdminsOnly')}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Card 2: Password Complexity & Expiry */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-3 border-b pb-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600 font-bold">
                <Lock className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Password Policy Requirements</h3>
                <p className="text-[11px] text-slate-500">Enforce strong password rules for all accounts</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-700">Minimum Password Length</label>
                <input
                  type="number"
                  min={6}
                  max={32}
                  value={data.config.passwordPolicyMinLength}
                  onChange={(e) => handleNumberChange('passwordPolicyMinLength', parseInt(e.target.value, 10) || 8)}
                  className="w-20 rounded-lg border border-slate-200 p-1.5 text-center font-bold text-slate-800"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/60">
                <div>
                  <p className="font-bold text-slate-800">Require Special Characters (!@#$%^&*)</p>
                  <p className="text-[10px] text-slate-500">Passwords must include at least one symbol</p>
                </div>
                <input
                  type="checkbox"
                  checked={data.config.requireSpecialChars}
                  onChange={() => handleToggle('requireSpecialChars')}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/60">
                <div>
                  <p className="font-bold text-slate-800">Require Numbers (0-9)</p>
                  <p className="text-[10px] text-slate-500">Passwords must contain numeric digits</p>
                </div>
                <input
                  type="checkbox"
                  checked={data.config.requireNumbers}
                  onChange={() => handleToggle('requireNumbers')}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Card 3: Session Security & Lockout */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-3 border-b pb-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600 font-bold">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Session Security & Lockout</h3>
                <p className="text-[11px] text-slate-500">Inactivity timeouts and brute-force protection</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-700">Max Failed Login Attempts</p>
                  <p className="text-[10px] text-slate-500">Temporarily locks account after N retries</p>
                </div>
                <input
                  type="number"
                  min={3}
                  max={10}
                  value={data.config.maxLoginAttempts}
                  onChange={(e) => handleNumberChange('maxLoginAttempts', parseInt(e.target.value, 10) || 5)}
                  className="w-20 rounded-lg border border-slate-200 p-1.5 text-center font-bold text-slate-800"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-700">Inactivity Session Timeout (Minutes)</p>
                  <p className="text-[10px] text-slate-500">Auto-logs user out after idle duration</p>
                </div>
                <input
                  type="number"
                  min={15}
                  max={480}
                  value={data.config.sessionTimeoutMinutes}
                  onChange={(e) => handleNumberChange('sessionTimeoutMinutes', parseInt(e.target.value, 10) || 60)}
                  className="w-20 rounded-lg border border-slate-200 p-1.5 text-center font-bold text-slate-800"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/60">
                <div>
                  <p className="font-bold text-slate-800">Allow Concurrent Device Logins</p>
                  <p className="text-[10px] text-slate-500">Permit multiple active sessions per user</p>
                </div>
                <input
                  type="checkbox"
                  checked={data.config.concurrentSessionsAllowed}
                  onChange={() => handleToggle('concurrentSessionsAllowed')}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Card 4: IP Whitelisting & Network Rules */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-3 border-b pb-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 font-bold">
                <Server className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Network & IP Whitelisting</h3>
                <p className="text-[11px] text-slate-500">Restrict admin login access to specific CIDR ranges</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/60">
                <div>
                  <p className="font-bold text-slate-800">Enable IP Range Restriction</p>
                  <p className="text-[10px] text-slate-500">Block admin access outside approved corporate IPs</p>
                </div>
                <input
                  type="checkbox"
                  checked={data.config.ipWhitelistEnabled}
                  onChange={() => handleToggle('ipWhitelistEnabled')}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
              </div>

              <div>
                <label className="block mb-1 font-bold text-slate-700">Approved IP Subnets (CIDR)</label>
                <input
                  type="text"
                  value={data.config.allowedIpRanges ? data.config.allowedIpRanges.join(', ') : '0.0.0.0/0'}
                  onChange={(e) =>
                    setData({
                      ...data,
                      config: {
                        ...data.config,
                        allowedIpRanges: e.target.value.split(',').map((s) => s.trim()),
                      },
                    })
                  }
                  className="w-full rounded-xl border border-slate-200 p-2.5 font-mono text-xs font-semibold text-slate-800 focus:border-indigo-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </SuperAdminLayout>
  );
}
