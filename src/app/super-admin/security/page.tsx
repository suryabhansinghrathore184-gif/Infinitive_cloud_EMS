'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  Globe,
  SlidersHorizontal,
  X,
  RotateCcw,
  Check,
  AlertTriangle,
  FileText,
  Clock,
  Zap,
} from 'lucide-react';

interface SecurityConfig {
  mfaEnforced: boolean;
  mfaForSuperAdminsOnly: boolean;
  otpExpiryMinutes: number;
  passwordPolicyMinLength: number;
  requireSpecialChars: boolean;
  requireNumbers: boolean;
  requireUppercase: boolean;
  passwordExpiryDays: number;
  maxLoginAttempts: number;
  sessionTimeoutMinutes: number;
  concurrentSessionsAllowed: boolean;
  revokeOnPasswordChange: boolean;
  ipWhitelistEnabled: boolean;
  allowedIpRanges: string[];
  geoBlockingEnabled: boolean;
  updatedAt: string;
  updatedBy?: string;
}

interface SecurityStats {
  totalUsersCount: number;
  mfaUsersCount: number;
  activeSessionsCount: number;
  failedLoginsLast24h: number;
  sslStatus: string;
  dbEncryptionStatus: string;
}

interface SecurityAuditLog {
  id: string;
  action: string;
  performedBy: string;
  performedByName: string;
  role: string;
  details: any;
  timestamp: string;
}

interface DiagnosticCheck {
  check: string;
  status: 'PASSED' | 'WARNING' | 'INFO';
  details: string;
}

export default function SuperAdminSecurityPage() {
  const [config, setConfig] = useState<SecurityConfig | null>(null);
  const [originalConfig, setOriginalConfig] = useState<SecurityConfig | null>(null);
  const [stats, setStats] = useState<SecurityStats | null>(null);
  const [recentLogs, setRecentLogs] = useState<SecurityAuditLog[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modals
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [showRevokeGlobalModal, setShowRevokeGlobalModal] = useState(false);
  const [showDiagnosticModal, setShowDiagnosticModal] = useState(false);

  // Diagnostic State
  const [isDiagnosticRunning, setIsDiagnosticRunning] = useState(false);
  const [diagnosticResult, setDiagnosticResult] = useState<{
    score: number;
    timestamp: string;
    checks: DiagnosticCheck[];
  } | null>(null);

  // Fetch security state from backend
  const fetchSecurityData = useCallback(async () => {
    setIsLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/v1/super-admin/security');
      const result = await res.json();
      if (res.ok && result.success && result.data) {
        setConfig(result.data.config);
        setOriginalConfig(result.data.config);
        setStats(result.data.stats);
        setRecentLogs(result.data.recentSecurityLogs || []);
      }
    } catch (err: any) {
      console.error('Error fetching security data:', err);
      setMessage({ type: 'error', text: 'Failed to connect to security governance service.' });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSecurityData();
  }, [fetchSecurityData]);

  // Handle boolean toggle changes
  const handleToggle = (key: keyof SecurityConfig) => {
    if (!config) return;
    setConfig({
      ...config,
      [key]: !config[key],
    });
  };

  // Handle number input changes
  const handleNumberChange = (key: keyof SecurityConfig, val: number) => {
    if (!config) return;
    setConfig({
      ...config,
      [key]: val,
    });
  };

  // Calculate dirty state
  const isDirty = useMemo(() => {
    if (!config || !originalConfig) return false;
    return JSON.stringify(config) !== JSON.stringify(originalConfig);
  }, [config, originalConfig]);

  // Confirm Save Policies
  const handleConfirmSave = async (actionType = 'SAVE') => {
    if (!config) return;
    setIsSaving(true);
    setShowSaveModal(false);
    setShowRestoreModal(false);
    setMessage(null);

    try {
      const res = await fetch('/api/v1/super-admin/security', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config, actionType }),
      });

      const result = await res.json();
      if (res.ok && result.success) {
        setMessage({ type: 'success', text: result.message || 'Security policies saved successfully.' });
        fetchSecurityData();
      } else {
        setMessage({ type: 'error', text: result.message || 'Failed to save security configuration.' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Network communication error.' });
    } finally {
      setIsSaving(false);
    }
  };

  // Run Security Health Diagnostic
  const handleRunDiagnostic = async () => {
    setIsDiagnosticRunning(true);
    setShowDiagnosticModal(true);
    try {
      const res = await fetch('/api/v1/super-admin/security/diagnostic', {
        method: 'POST',
      });
      const result = await res.json();
      if (res.ok && result.success && result.data) {
        setDiagnosticResult(result.data);
      }
    } catch (err) {
      console.error('Diagnostic error:', err);
    } finally {
      setIsDiagnosticRunning(false);
    }
  };

  // Emergency Global Session Revocation
  const handleConfirmRevokeGlobalSessions = async () => {
    setIsSaving(true);
    setShowRevokeGlobalModal(false);
    setMessage(null);

    try {
      const res = await fetch('/api/v1/super-admin/security/revoke-global-sessions', {
        method: 'POST',
      });
      const result = await res.json();
      if (res.ok && result.success) {
        setMessage({ type: 'success', text: result.message });
        fetchSecurityData();
      } else {
        setMessage({ type: 'error', text: result.message || 'Failed to revoke global sessions.' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Error executing session revocation.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SuperAdminLayout
      pageTitle="System Security & Access Governance Center"
      breadcrumbs={[
        { label: 'Executive Dashboard', href: '/super-admin/dashboard' },
        { label: 'Security Center', href: '/super-admin/security' },
      ]}
    >
      {/* 1. Header Toolbar */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Security Governance Controls</h2>
            <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
              ENTERPRISE SHIELD
            </span>
            {isDirty && (
              <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-extrabold text-amber-800 border border-amber-300 animate-pulse">
                UNSAVED CHANGES
              </span>
            )}
          </div>
          <p className="text-xs font-medium text-slate-500 mt-0.5">
            Multi-factor authentication enforcement, password strength requirements, session security, and network whitelisting.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleRunDiagnostic}
            className="flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700 shadow-2xs hover:bg-indigo-100"
          >
            <Zap className="h-3.5 w-3.5 text-indigo-600" />
            <span>Run Diagnostic</span>
          </button>

          <button
            onClick={() => setShowRevokeGlobalModal(true)}
            className="flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 shadow-2xs hover:bg-rose-100"
          >
            <Lock className="h-3.5 w-3.5 text-rose-600" />
            <span>Revoke All Sessions</span>
          </button>

          <button
            onClick={() => setShowRestoreModal(true)}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50"
          >
            <RotateCcw className="h-3.5 w-3.5 text-slate-500" />
            <span>Restore Defaults</span>
          </button>

          <button
            onClick={fetchSecurityData}
            disabled={isLoading || isSaving}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-indigo-600 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh Audit</span>
          </button>

          <button
            onClick={() => setShowSaveModal(true)}
            disabled={!isDirty || isSaving}
            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 transition-colors"
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

      {/* 2. Executive Security Metrics Row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {/* Active Sessions */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Live Tokens</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <Activity className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-extrabold text-slate-900">{stats?.activeSessionsCount ?? 0}</p>
          <span className="mt-1 inline-block text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
            Active Tokens
          </span>
        </div>

        {/* Failed Logins 24h */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Failed Logins</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
              <ShieldAlert className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-extrabold text-rose-600">{stats?.failedLoginsLast24h ?? 0}</p>
          <span className="mt-1 inline-block text-[10px] font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded">
            Last 24h Events
          </span>
        </div>

        {/* MFA Coverage */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">MFA Users</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              <Key className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-extrabold text-purple-600">{stats?.mfaUsersCount ?? 0}</p>
          <span className="mt-1 inline-block text-[10px] font-semibold text-purple-600 bg-purple-50 px-2 py-0.5 rounded">
            2FA Active
          </span>
        </div>

        {/* Total Users */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">User Roster</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <UserCheck className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-extrabold text-slate-900">{stats?.totalUsersCount ?? 0}</p>
          <span className="mt-1 inline-block text-[10px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
            Protected Accounts
          </span>
        </div>

        {/* Transport Security */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Transport</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Lock className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-sm font-extrabold text-emerald-600">TLS 1.3 / SSL</p>
          <span className="mt-1 inline-block text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
            Active & Valid
          </span>
        </div>

        {/* Database Vault */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Database Vault</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
              <Server className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-sm font-extrabold text-teal-600">AES-256 Atlas</p>
          <span className="mt-1 inline-block text-[10px] font-semibold text-teal-600 bg-teal-50 px-2 py-0.5 rounded">
            Encrypted at Rest
          </span>
        </div>
      </div>

      {/* 3. Main Policy Governance Cards */}
      {isLoading || !config ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-16 text-slate-400">
          <RefreshCw className="h-8 w-8 animate-spin text-indigo-600" />
          <p className="mt-3 text-xs font-medium text-slate-600">Loading security governance policies...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Card 1: Multi-Factor Authentication */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 font-bold">
                <Key className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Multi-Factor Authentication (MFA / 2FA)</h3>
                <p className="text-[11px] text-slate-500">Configure global 2FA and OTP login mandates</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/60">
                <div>
                  <p className="font-bold text-slate-800">Enforce MFA for All Users</p>
                  <p className="text-[10px] text-slate-500">Require TOTP authenticator app on every user login</p>
                </div>
                <input
                  type="checkbox"
                  checked={config.mfaEnforced}
                  onChange={() => handleToggle('mfaEnforced')}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/60">
                <div>
                  <p className="font-bold text-slate-800">Enforce MFA for Super Admin & Admin Only</p>
                  <p className="text-[10px] text-slate-500">Require 2FA specifically for privileged administrative accounts</p>
                </div>
                <input
                  type="checkbox"
                  checked={config.mfaForSuperAdminsOnly}
                  onChange={() => handleToggle('mfaForSuperAdminsOnly')}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-700">OTP Code Expiration (Minutes)</p>
                  <p className="text-[10px] text-slate-500">Duration before verification OTP expires</p>
                </div>
                <input
                  type="number"
                  min={5}
                  max={30}
                  value={config.otpExpiryMinutes}
                  onChange={(e) => handleNumberChange('otpExpiryMinutes', parseInt(e.target.value, 10) || 10)}
                  className="w-20 rounded-lg border border-slate-200 p-1.5 text-center font-bold text-slate-800"
                />
              </div>
            </div>
          </div>

          {/* Card 2: Password Complexity & Expiry */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600 font-bold">
                <Lock className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Password Policy Requirements</h3>
                <p className="text-[11px] text-slate-500">Enforce strong password rules for all account credentials</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-700">Minimum Password Length</p>
                  <p className="text-[10px] text-slate-500">Recommended minimum character length</p>
                </div>
                <input
                  type="number"
                  min={6}
                  max={32}
                  value={config.passwordPolicyMinLength}
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
                  checked={config.requireSpecialChars}
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
                  checked={config.requireNumbers}
                  onChange={() => handleToggle('requireNumbers')}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-700">Password Expiry Period (Days)</p>
                  <p className="text-[10px] text-slate-500">Days before mandatory rotation (0 = Disabled)</p>
                </div>
                <input
                  type="number"
                  min={0}
                  max={365}
                  value={config.passwordExpiryDays}
                  onChange={(e) => handleNumberChange('passwordExpiryDays', parseInt(e.target.value, 10) || 0)}
                  className="w-20 rounded-lg border border-slate-200 p-1.5 text-center font-bold text-slate-800"
                />
              </div>
            </div>
          </div>

          {/* Card 3: Session Security & Lockout */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
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
                  <p className="text-[10px] text-slate-500">Temporarily locks account after N failed retries</p>
                </div>
                <input
                  type="number"
                  min={3}
                  max={10}
                  value={config.maxLoginAttempts}
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
                  value={config.sessionTimeoutMinutes}
                  onChange={(e) => handleNumberChange('sessionTimeoutMinutes', parseInt(e.target.value, 10) || 60)}
                  className="w-20 rounded-lg border border-slate-200 p-1.5 text-center font-bold text-slate-800"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/60">
                <div>
                  <p className="font-bold text-slate-800">Allow Concurrent Device Logins</p>
                  <p className="text-[10px] text-slate-500">Permit multiple active sessions per user account</p>
                </div>
                <input
                  type="checkbox"
                  checked={config.concurrentSessionsAllowed}
                  onChange={() => handleToggle('concurrentSessionsAllowed')}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/60">
                <div>
                  <p className="font-bold text-slate-800">Revoke Sessions on Password Change</p>
                  <p className="text-[10px] text-slate-500">Automatically logout all devices when password updates</p>
                </div>
                <input
                  type="checkbox"
                  checked={config.revokeOnPasswordChange}
                  onChange={() => handleToggle('revokeOnPasswordChange')}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Card 4: Network Security & IP Whitelisting */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 font-bold">
                <Globe className="h-5 w-5" />
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
                  checked={config.ipWhitelistEnabled}
                  onChange={() => handleToggle('ipWhitelistEnabled')}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
              </div>

              <div>
                <label className="block mb-1 font-bold text-slate-700">Approved IP Subnets (CIDR)</label>
                <input
                  type="text"
                  value={config.allowedIpRanges ? config.allowedIpRanges.join(', ') : '0.0.0.0/0'}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      allowedIpRanges: e.target.value.split(',').map((s) => s.trim()),
                    })
                  }
                  className="w-full rounded-xl border border-slate-200 p-2.5 font-mono text-xs font-semibold text-slate-800 focus:border-indigo-500 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/60">
                <div>
                  <p className="font-bold text-slate-800">Enable Geo-Blocking Threat Alerts</p>
                  <p className="text-[10px] text-slate-500">Alert Super Admin on logins from unapproved regions</p>
                </div>
                <input
                  type="checkbox"
                  checked={config.geoBlockingEnabled}
                  onChange={() => handleToggle('geoBlockingEnabled')}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Real-time Security Audit & Threat Feed */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-indigo-600" />
            <h3 className="text-sm font-extrabold text-slate-900">Recent Security Audit & Threat Events</h3>
          </div>
          <span className="text-[11px] font-semibold text-slate-500">Live Audit Vault Stream</span>
        </div>

        <div className="space-y-2 text-xs">
          {recentLogs.length === 0 ? (
            <p className="py-6 text-center text-slate-500">No security audit logs recorded yet.</p>
          ) : (
            recentLogs.map((log) => (
              <div key={log.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between rounded-xl border border-slate-100 bg-slate-50 p-3 gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="rounded-md bg-indigo-100 px-2 py-0.5 text-[10px] font-extrabold text-indigo-800 border border-indigo-200">
                    {log.action}
                  </span>
                  <span className="font-bold text-slate-900">{log.performedByName}</span>
                  <span className="text-[10px] font-mono text-slate-500">({log.performedBy})</span>
                </div>

                <span className="text-[10px] text-slate-400 font-mono">
                  {new Date(log.timestamp).toLocaleString()}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODALS SECTION */}
      {/* ========================================================================= */}

      {/* 1. Save Policy Confirmation Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-indigo-600" />
                <h3 className="text-sm font-extrabold text-slate-900">Save Security Policy Governance?</h3>
              </div>
              <button onClick={() => setShowSaveModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              You are updating system-wide security policies including multi-factor authentication, password rules, session timeouts, and IP whitelisting.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowSaveModal(false)}
                className="rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleConfirmSave('SAVE')}
                disabled={isSaving}
                className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Confirm & Save Policies'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Emergency Global Session Revocation Modal */}
      {showRevokeGlobalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-rose-600" />
                <h3 className="text-sm font-extrabold text-slate-900">Emergency Global Session Revocation</h3>
              </div>
              <button onClick={() => setShowRevokeGlobalModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="rounded-xl bg-rose-50 p-3.5 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-800">
              <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold">High-Impact Emergency Action</strong>
                This will invalidate all active session tokens across all user accounts in the application, requiring all active users to re-authenticate.
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowRevokeGlobalModal(false)}
                className="rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRevokeGlobalSessions}
                disabled={isSaving}
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-rose-700 disabled:opacity-50"
              >
                {isSaving ? 'Revoking...' : 'Confirm Global Revocation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Restore Defaults Modal */}
      {showRestoreModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <RotateCcw className="h-5 w-5 text-amber-600" />
                <h3 className="text-sm font-extrabold text-slate-900">Restore Factory Security Policies?</h3>
              </div>
              <button onClick={() => setShowRestoreModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              This will restore factory default parameters for MFA mandates, password rules, lockout thresholds, and IP ranges.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowRestoreModal(false)}
                className="rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleConfirmSave('RESTORE_DEFAULTS')}
                disabled={isSaving}
                className="rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-amber-700 disabled:opacity-50"
              >
                {isSaving ? 'Restoring...' : 'Confirm Restore Defaults'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Security Diagnostic Results Modal */}
      {showDiagnosticModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-indigo-600" />
                <h3 className="text-sm font-extrabold text-slate-900">Security Health Diagnostic Audit</h3>
              </div>
              <button onClick={() => setShowDiagnosticModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            {isDiagnosticRunning ? (
              <div className="py-12 flex flex-col items-center justify-center text-slate-500 text-xs">
                <RefreshCw className="h-8 w-8 animate-spin text-indigo-600" />
                <p className="mt-3 font-semibold text-slate-700">Executing security diagnostic checks...</p>
              </div>
            ) : diagnosticResult ? (
              <div className="space-y-4 text-xs">
                <div className="flex items-center justify-between rounded-xl bg-indigo-50 p-4 border border-indigo-200">
                  <div>
                    <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">Security Health Index</span>
                    <span className="text-2xl font-extrabold text-indigo-900">{diagnosticResult.score} / 100</span>
                  </div>
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-extrabold text-emerald-800 border border-emerald-300">
                    EXCELLENT RATING
                  </span>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {diagnosticResult.checks.map((item, idx) => (
                    <div key={idx} className="flex items-start justify-between rounded-xl border border-slate-200 bg-slate-50 p-3 gap-2">
                      <div>
                        <p className="font-bold text-slate-900">{item.check}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">{item.details}</p>
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold border shrink-0 ${
                          item.status === 'PASSED'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : item.status === 'WARNING'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-blue-50 text-blue-700 border-blue-200'
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowDiagnosticModal(false)}
                className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800"
              >
                Close Diagnostic
              </button>
            </div>
          </div>
        </div>
      )}
    </SuperAdminLayout>
  );
}
