'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { SuperAdminLayout } from '@/components/layout/SuperAdminLayout';
import {
  ShieldAlert,
  ShieldCheck,
  Shield,
  KeyRound,
  Users,
  Lock,
  RefreshCw,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Sliders,
  RotateCcw,
  Zap,
  Clock,
  Globe,
  Database,
  Search,
  Filter,
  Eye,
  X,
  Send,
  Trash2,
  Server,
  FileText,
  ChevronRight,
  UserX,
  AlertCircle,
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
  updatedBy: string;
}

interface ActiveSession {
  id: string;
  userId: string;
  email: string;
  role: string;
  organizationId: string;
  userAgent: string;
  ipAddress: string;
  createdAt: string;
  expiresAt: string;
}

interface SecurityLog {
  id: string;
  action: string;
  performedBy: string;
  performedByName: string;
  role: string;
  organizationId: string;
  details: any;
  ipAddress: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  timestamp: string;
}

interface FailedLogin {
  id: string;
  email: string;
  action: string;
  ipAddress: string;
  reason: string;
  timestamp: string;
}

interface HealthSummary {
  overallStatus: 'HEALTHY' | 'WARNING' | 'CRITICAL';
  reasons: string[];
  components: {
    authentication: string;
    sessionSecurity: string;
    mfaPolicy: string;
    emailOtp: string;
    databaseSecurity: string;
    auditLogging: string;
  };
}

export default function SuperAdminSecurityPage() {
  const [config, setConfig] = useState<SecurityConfig | null>(null);
  const [initialConfig, setInitialConfig] = useState<SecurityConfig | null>(null);
  const [stats, setStats] = useState<any>({});
  const [healthSummary, setHealthSummary] = useState<HealthSummary | null>(null);
  const [smtpHealth, setSmtpHealth] = useState<any>({});
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  const [securityLogs, setSecurityLogs] = useState<SecurityLog[]>([]);
  const [failedLogins, setFailedLogins] = useState<FailedLogin[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [saveError, setSaveError] = useState('');

  // Event stream search & filter
  const [eventSearch, setEventSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('All');

  // Modals
  const [showDiagnosticModal, setShowDiagnosticModal] = useState(false);
  const [isDiagnosticRunning, setIsDiagnosticRunning] = useState(false);
  const [diagnosticResults, setDiagnosticResults] = useState<any>(null);

  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);

  const [showRestoreModal, setShowRestoreModal] = useState(false);

  const [isTestingSmtp, setIsTestingSmtp] = useState(false);
  const [smtpResult, setSmtpResult] = useState<any>(null);

  const hasUnsavedChanges = JSON.stringify(config) !== JSON.stringify(initialConfig);

  const fetchSecurityData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/v1/super-admin/security');
      if (res.ok) {
        const result = await res.json();
        if (result.success && result.data) {
          setConfig(result.data.config);
          setInitialConfig(result.data.config);
          setStats(result.data.stats || {});
          setHealthSummary(result.data.healthSummary || null);
          setSmtpHealth(result.data.smtpHealth || {});
          setActiveSessions(result.data.activeSessions || []);
          setSecurityLogs(result.data.recentSecurityLogs || []);
          setFailedLogins(result.data.failedLogins || []);
        }
      }
    } catch (err) {
      console.error('Error fetching security governance data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSecurityData();
  }, [fetchSecurityData]);

  // Save Config
  const handleSaveConfig = async (actionType?: string) => {
    setIsSaving(true);
    setSaveMessage('');
    setSaveError('');

    try {
      const res = await fetch('/api/v1/super-admin/security', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config,
          actionType: actionType || 'SAVE_SECURITY_CONFIG',
        }),
      });

      const result = await res.json();
      if (res.ok && result.success) {
        setSaveMessage(result.message || 'Security policies updated successfully.');
        setInitialConfig(result.data);
        setConfig(result.data);
        setShowRestoreModal(false);
      } else {
        setSaveError(result.message || 'Failed to save security policy.');
      }
    } catch (err: any) {
      setSaveError(err.message || 'Network error occurred.');
    } finally {
      setIsSaving(false);
    }
  };

  // Run Health Diagnostic Audit
  const handleRunDiagnostic = async () => {
    setIsDiagnosticRunning(true);
    setShowDiagnosticModal(true);
    setDiagnosticResults(null);

    try {
      const res = await fetch('/api/v1/super-admin/security/diagnostic', { method: 'POST' });
      if (res.ok) {
        const result = await res.json();
        if (result.success) {
          setDiagnosticResults(result.data);
        }
      }
    } catch (err) {
      console.error('Diagnostic error:', err);
    } finally {
      setIsDiagnosticRunning(false);
    }
  };

  // Revoke All Global Sessions
  const handleRevokeGlobalSessions = async () => {
    setIsRevoking(true);
    try {
      const res = await fetch('/api/v1/super-admin/security/revoke-global-sessions', { method: 'POST' });
      const result = await res.json();
      if (res.ok && result.success) {
        setShowRevokeModal(false);
        fetchSecurityData();
      }
    } catch (err) {
      console.error('Failed to revoke sessions:', err);
    } finally {
      setIsRevoking(false);
    }
  };

  // Test SMTP Connection Diagnostic
  const handleTestSmtp = async () => {
    setIsTestingSmtp(true);
    setSmtpResult(null);
    try {
      const res = await fetch('/api/v1/super-admin/settings/test-smtp', { method: 'POST' });
      const result = await res.json();
      setSmtpResult(result);
    } catch (err: any) {
      setSmtpResult({ success: false, message: err.message || 'SMTP diagnostic request failed.' });
    } finally {
      setIsTestingSmtp(false);
    }
  };

  // Filtered security log events
  const filteredLogs = securityLogs.filter((log) => {
    const matchesSearch =
      (log.action || '').toLowerCase().includes(eventSearch.toLowerCase()) ||
      (log.performedBy || '').toLowerCase().includes(eventSearch.toLowerCase()) ||
      (log.ipAddress || '').toLowerCase().includes(eventSearch.toLowerCase());

    const matchesSeverity = severityFilter === 'All' || log.severity === severityFilter;

    return matchesSearch && matchesSeverity;
  });

  return (
    <SuperAdminLayout
      pageTitle="Security & Access Governance Control Center"
      breadcrumbs={[
        { label: 'Executive Dashboard', href: '/super-admin/dashboard' },
        { label: 'Security Operations', href: '/super-admin/security' },
      ]}
    >
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-slate-900">Security & Access Governance Center</h2>
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-800 border border-emerald-300">
              ENTERPRISE GOVERNANCE ACTIVE
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Monitor authentication security, sessions, access controls, MFA policies, and system security events
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={fetchSecurityData}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleRunDiagnostic}
            className="flex items-center gap-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 px-3.5 py-2 text-xs font-bold text-white shadow-md transition-colors"
          >
            <Zap className="h-3.5 w-3.5" />
            <span>Run Diagnostic</span>
          </button>

          <button
            onClick={() => handleSaveConfig()}
            disabled={isSaving || !config}
            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-4 py-2 text-xs font-bold text-white shadow-md transition-colors disabled:opacity-50"
          >
            {isSaving ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
            <span>Save Security Policies</span>
          </button>
        </div>
      </div>

      {/* Unsaved Changes Banner */}
      {hasUnsavedChanges && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 flex items-center justify-between text-xs font-semibold text-amber-800 shadow-xs animate-pulse">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <span>UNSAVED SECURITY CHANGES: You have unsaved policy modifications.</span>
          </div>
          <button
            onClick={() => handleSaveConfig()}
            className="rounded-lg bg-amber-600 hover:bg-amber-700 px-3 py-1 font-bold text-white"
          >
            Save Changes Now
          </button>
        </div>
      )}

      {/* Save Alert Messages */}
      {saveMessage && (
        <div className="rounded-xl bg-emerald-50 p-3 text-xs font-semibold text-emerald-700 border border-emerald-200">
          {saveMessage}
        </div>
      )}
      {saveError && (
        <div className="rounded-xl bg-rose-50 p-3 text-xs font-semibold text-rose-700 border border-rose-200">
          {saveError}
        </div>
      )}

      {/* Security Health Summary Banner */}
      {healthSummary && (
        <div className={`rounded-2xl border p-4 shadow-xs ${
          healthSummary.overallStatus === 'HEALTHY' ? 'border-emerald-200 bg-emerald-50/40' : 'border-amber-200 bg-amber-50/40'
        }`}>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              {healthSummary.overallStatus === 'HEALTHY' ? (
                <ShieldCheck className="h-7 w-7 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="h-7 w-7 text-amber-600 shrink-0 animate-bounce" />
              )}
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">
                  Overall System Security Status: <span className={healthSummary.overallStatus === 'HEALTHY' ? 'text-emerald-700' : 'text-amber-700'}>{healthSummary.overallStatus}</span>
                </h3>
                <p className="text-xs text-slate-600">
                  Real-time security telemetry evaluated across authentication parameters, sessions, MFA policies, and database encryption.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6 text-[10px] font-bold">
              {Object.entries(healthSummary?.components || {}).map(([key, value]) => (
                <div key={key} className="rounded-xl bg-white p-2 border border-slate-200 text-center shadow-2xs">
                  <p className="text-slate-400 uppercase tracking-wider text-[9px]">{key.replace(/([A-Z])/g, ' $1')}</p>
                  <p className={`mt-0.5 font-extrabold ${value === 'Healthy' ? 'text-emerald-600' : 'text-amber-600'}`}>{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Real KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Live Sessions</p>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-black text-indigo-600">{stats.activeSessionsCount ?? 0}</span>
            <Activity className="h-4 w-4 text-indigo-500" />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Failed Logins 24h</p>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-black text-rose-600">{stats.failedLoginsLast24h ?? 0}</span>
            <ShieldAlert className="h-4 w-4 text-rose-500" />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">MFA Users</p>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-black text-emerald-600">{stats.mfaUsersCount ?? 0}</span>
            <Lock className="h-4 w-4 text-emerald-500" />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">User Roster</p>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900">{stats.totalUsersCount ?? 0}</span>
            <Users className="h-4 w-4 text-slate-400" />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Transport</p>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-2 py-1 rounded">HTTPS</span>
            <Globe className="h-4 w-4 text-emerald-500" />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Database Security</p>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-xs font-extrabold text-purple-700 bg-purple-50 px-2 py-1 rounded">AES-256</span>
            <Database className="h-4 w-4 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Security Policy Governance Cards */}
      {config && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Card 1: Password & Authentication Policy */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b pb-3">
              <KeyRound className="h-5 w-5 text-indigo-600" />
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Authentication & Password Complexity Policy</h3>
                <p className="text-[11px] text-slate-500">Configure global password length, character mandates, and expiration horizons</p>
              </div>
            </div>

            <div className="space-y-3 text-xs font-medium">
              <div className="flex items-center justify-between">
                <label className="text-slate-700 font-bold">Minimum Password Length</label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="6"
                    max="32"
                    value={config.passwordPolicyMinLength}
                    onChange={(e) => setConfig({ ...config, passwordPolicyMinLength: parseInt(e.target.value, 10) })}
                    className="w-28 accent-indigo-600"
                  />
                  <span className="font-mono font-bold text-slate-900 w-8 text-right">{config.passwordPolicyMinLength} chars</span>
                </div>
              </div>

              <div className="flex items-center justify-between border-t pt-2.5">
                <label className="text-slate-700 font-bold">Require Special Characters (!@#$%^&*)</label>
                <input
                  type="checkbox"
                  checked={config.requireSpecialChars}
                  onChange={(e) => setConfig({ ...config, requireSpecialChars: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-between border-t pt-2.5">
                <label className="text-slate-700 font-bold">Require Numerical Digits (0-9)</label>
                <input
                  type="checkbox"
                  checked={config.requireNumbers}
                  onChange={(e) => setConfig({ ...config, requireNumbers: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-between border-t pt-2.5">
                <label className="text-slate-700 font-bold">Require Uppercase Letters (A-Z)</label>
                <input
                  type="checkbox"
                  checked={config.requireUppercase}
                  onChange={(e) => setConfig({ ...config, requireUppercase: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-between border-t pt-2.5">
                <label className="text-slate-700 font-bold">Password Expiration Horizon</label>
                <select
                  value={config.passwordExpiryDays}
                  onChange={(e) => setConfig({ ...config, passwordExpiryDays: parseInt(e.target.value, 10) })}
                  className="rounded-xl border border-slate-200 px-3 py-1.5 font-semibold text-slate-800"
                >
                  <option value={30}>30 Days</option>
                  <option value={60}>60 Days</option>
                  <option value={90}>90 Days</option>
                  <option value={180}>180 Days</option>
                  <option value={0}>Never Expire</option>
                </select>
              </div>
            </div>
          </div>

          {/* Card 2: Session & Lockout Governance */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b pb-3">
              <Clock className="h-5 w-5 text-indigo-600" />
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Session Security & Brute-Force Lockout</h3>
                <p className="text-[11px] text-slate-500">Manage active token expiration, concurrent access, and login attempt thresholds</p>
              </div>
            </div>

            <div className="space-y-3 text-xs font-medium">
              <div className="flex items-center justify-between">
                <label className="text-slate-700 font-bold">Session Expiration Timeout</label>
                <select
                  value={config.sessionTimeoutMinutes}
                  onChange={(e) => setConfig({ ...config, sessionTimeoutMinutes: parseInt(e.target.value, 10) })}
                  className="rounded-xl border border-slate-200 px-3 py-1.5 font-semibold text-slate-800"
                >
                  <option value={15}>15 Minutes</option>
                  <option value={30}>30 Minutes</option>
                  <option value={60}>1 Hour</option>
                  <option value={240}>4 Hours</option>
                  <option value={1440}>24 Hours</option>
                </select>
              </div>

              <div className="flex items-center justify-between border-t pt-2.5">
                <label className="text-slate-700 font-bold">Max Failed Login Attempts Before Lockout</label>
                <select
                  value={config.maxLoginAttempts}
                  onChange={(e) => setConfig({ ...config, maxLoginAttempts: parseInt(e.target.value, 10) })}
                  className="rounded-xl border border-slate-200 px-3 py-1.5 font-semibold text-slate-800"
                >
                  <option value={3}>3 Attempts</option>
                  <option value={5}>5 Attempts</option>
                  <option value={10}>10 Attempts</option>
                </select>
              </div>

              <div className="flex items-center justify-between border-t pt-2.5">
                <label className="text-slate-700 font-bold">Allow Concurrent User Sessions</label>
                <input
                  type="checkbox"
                  checked={config.concurrentSessionsAllowed}
                  onChange={(e) => setConfig({ ...config, concurrentSessionsAllowed: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-between border-t pt-2.5">
                <label className="text-slate-700 font-bold">Revoke Sessions on Password Reset</label>
                <input
                  type="checkbox"
                  checked={config.revokeOnPasswordChange}
                  onChange={(e) => setConfig({ ...config, revokeOnPasswordChange: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-between border-t pt-2.5">
                <label className="text-slate-700 font-bold">Global MFA Enforcement</label>
                <input
                  type="checkbox"
                  checked={config.mfaEnforced}
                  onChange={(e) => setConfig({ ...config, mfaEnforced: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Live Session Monitor */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/60 px-5 py-4">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-indigo-600" />
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">Active Live User Sessions</h3>
              <p className="text-[11px] text-slate-500">Real-time session token monitoring across all tenant organizations</p>
            </div>
          </div>
          <button
            onClick={() => setShowRevokeModal(true)}
            className="flex items-center gap-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 px-3 py-1.5 text-xs font-bold text-rose-700 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Revoke All Sessions</span>
          </button>
        </div>

        {activeSessions.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500">
            <Activity className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-2 font-bold text-slate-700">No active user sessions recorded</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">User Account</th>
                  <th className="py-3 px-4">Role & Org</th>
                  <th className="py-3 px-4">Device & IP</th>
                  <th className="py-3 px-4">Created</th>
                  <th className="py-3 px-4">Expires</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {(activeSessions || []).map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900">{s.email}</p>
                      <p className="text-[10px] text-slate-400 font-mono">User ID: {s.userId}</p>
                    </td>
                    <td className="py-3 px-4">
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700 border border-slate-200">
                        {s.role}
                      </span>
                      <p className="text-[10px] font-mono text-slate-400 mt-0.5">{s.organizationId}</p>
                    </td>
                    <td className="py-3 px-4 text-[11px]">
                      <p className="font-medium text-slate-800">{s.userAgent.slice(0, 30)}...</p>
                      <p className="font-mono text-[10px] text-slate-400">{s.ipAddress}</p>
                    </td>
                    <td className="py-3 px-4 text-[11px] font-mono text-slate-500">
                      {new Date(s.createdAt).toLocaleTimeString()}
                    </td>
                    <td className="py-3 px-4 text-[11px] font-mono text-slate-500">
                      {new Date(s.expiresAt).toLocaleTimeString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={handleRevokeGlobalSessions}
                        className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-bold text-rose-600 hover:bg-rose-50 hover:border-rose-300"
                      >
                        Revoke
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Security Event Stream */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden space-y-3 p-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between border-b pb-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-indigo-600" />
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">Recent Security Event Stream</h3>
              <p className="text-[11px] text-slate-500">Real-time audit log stream tracking administrative overrides and login activity</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/super-admin/audit-logs"
              className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800"
            >
              <span>View Full Audit Logs</span>
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Filter events by action, email, or IP address..."
              value={eventSearch}
              onChange={(e) => setEventSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-3 py-1.5 text-xs font-medium text-slate-800 focus:outline-hidden"
            />
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <span>Severity:</span>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700"
            >
              <option value="All">All Severities</option>
              <option value="INFO">INFO</option>
              <option value="WARNING">WARNING</option>
              <option value="CRITICAL">CRITICAL</option>
            </select>
          </div>
        </div>

        {(filteredLogs || []).length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            No matching security events found
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {(filteredLogs || []).map((log) => (
              <div key={log.id} className="py-2.5 flex items-center justify-between text-xs hover:bg-slate-50/50 px-2 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className={`rounded-md px-2 py-0.5 text-[9px] font-black border ${
                    log.severity === 'CRITICAL' ? 'bg-rose-100 text-rose-800 border-rose-300' :
                    log.severity === 'WARNING' ? 'bg-amber-100 text-amber-800 border-amber-300' :
                    'bg-slate-100 text-slate-700 border-slate-200'
                  }`}>
                    {log.severity}
                  </span>
                  <div>
                    <p className="font-bold text-slate-900">{log.action}</p>
                    <p className="text-[11px] text-slate-500">{log.performedBy} ({log.role}) &bull; IP: {log.ipAddress}</p>
                  </div>
                </div>
                <span className="font-mono text-[10px] text-slate-400">
                  {new Date(log.timestamp).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Danger Zone */}
      <div className="rounded-2xl border border-rose-200 bg-rose-50/30 p-5 shadow-xs space-y-3">
        <div className="flex items-center gap-2 border-b border-rose-200 pb-3">
          <AlertCircle className="h-5 w-5 text-rose-600" />
          <div>
            <h3 className="text-sm font-extrabold text-rose-900">DANGER ZONE & EMERGENCY CONTROLS</h3>
            <p className="text-[11px] text-rose-700">High-privilege emergency security interventions</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowRevokeModal(true)}
            className="rounded-xl bg-rose-600 hover:bg-rose-700 px-4 py-2 text-xs font-bold text-white shadow-md transition-colors"
          >
            Emergency Revoke All Global Sessions
          </button>

          <button
            onClick={() => setShowRestoreModal(true)}
            className="rounded-xl border border-rose-300 bg-white hover:bg-rose-50 px-4 py-2 text-xs font-bold text-rose-700 transition-colors"
          >
            Restore Factory Security Defaults
          </button>
        </div>
      </div>

      {/* Diagnostic Modal */}
      {showDiagnosticModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-purple-600" />
                <h3 className="text-base font-extrabold text-slate-900">Automated Security Health Diagnostic</h3>
              </div>
              <button onClick={() => setShowDiagnosticModal(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            {isDiagnosticRunning ? (
              <div className="py-12 flex flex-col items-center justify-center text-slate-400 space-y-3">
                <RefreshCw className="h-8 w-8 animate-spin text-purple-600" />
                <p className="text-xs font-bold text-slate-700">Running diagnostic security audit checks...</p>
              </div>
            ) : diagnosticResults ? (
              <div className="space-y-4 text-xs">
                <div className="flex items-center justify-between rounded-xl bg-purple-50 p-4 border border-purple-200">
                  <div>
                    <p className="text-purple-700 font-bold">Overall Health Score Index</p>
                    <p className="text-3xl font-black text-purple-900">{diagnosticResults.healthScore} / 100</p>
                  </div>
                  <span className="rounded-full bg-purple-200 px-3 py-1 font-black text-purple-800 text-xs">
                    {diagnosticResults.summaryStatus}
                  </span>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {diagnosticResults.audits?.map((audit: any, i: number) => (
                    <div key={i} className="flex items-center justify-between rounded-lg border border-slate-200 p-2.5 bg-slate-50">
                      <div>
                        <p className="font-bold text-slate-900">{audit.name}</p>
                        <p className="text-[10px] text-slate-500">{audit.detail}</p>
                      </div>
                      <span className={`rounded-md px-2 py-0.5 font-bold text-[10px] ${
                        audit.status === 'PASS' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {audit.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="flex justify-end border-t pt-3">
              <button
                onClick={() => setShowDiagnosticModal(false)}
                className="rounded-xl bg-slate-900 hover:bg-slate-800 px-5 py-2 text-xs font-bold text-white transition-colors"
              >
                Close Diagnostic
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Revoke Sessions Modal */}
      {showRevokeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 border-b pb-3">
              <AlertTriangle className="h-5 w-5 text-rose-600" />
              <h3 className="text-base font-extrabold text-slate-900">Revoke All Active Sessions?</h3>
            </div>

            <p className="text-xs text-slate-600">
              This will immediately invalidate all active login session tokens across all tenant organizations. Users will be required to re-authenticate.
            </p>

            <div className="flex justify-end gap-2 border-t pt-3">
              <button onClick={() => setShowRevokeModal(false)} className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600">
                Cancel
              </button>
              <button
                onClick={handleRevokeGlobalSessions}
                disabled={isRevoking}
                className="rounded-xl bg-rose-600 hover:bg-rose-700 px-5 py-2 text-xs font-bold text-white shadow-md disabled:opacity-50"
              >
                {isRevoking ? 'Revoking...' : 'Confirm Emergency Revocation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Restore Defaults Modal */}
      {showRestoreModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 border-b pb-3">
              <RotateCcw className="h-5 w-5 text-amber-600" />
              <h3 className="text-base font-extrabold text-slate-900">Restore Factory Security Defaults?</h3>
            </div>

            <p className="text-xs text-slate-600">
              This will reset all security governance parameters to factory defaults (8-character password min, 60m session timeout, 5 login attempts).
            </p>

            <div className="flex justify-end gap-2 border-t pt-3">
              <button onClick={() => setShowRestoreModal(false)} className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600">
                Cancel
              </button>
              <button
                onClick={() => handleSaveConfig('RESTORE_DEFAULTS')}
                disabled={isSaving}
                className="rounded-xl bg-amber-600 hover:bg-amber-700 px-5 py-2 text-xs font-bold text-white shadow-md disabled:opacity-50"
              >
                {isSaving ? 'Restoring...' : 'Restore Defaults Now'}
              </button>
            </div>
          </div>
        </div>
      )}
    </SuperAdminLayout>
  );
}
