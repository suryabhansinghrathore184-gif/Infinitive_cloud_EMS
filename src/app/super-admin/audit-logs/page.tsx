'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { SuperAdminLayout } from '@/components/layout/SuperAdminLayout';
import { formatRoleLabel } from '@/lib/roleUtils';
import {
  ShieldAlert,
  Search,
  Filter,
  RefreshCw,
  Clock,
  User,
  Building2,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
  FileText,
  Download,
  Activity,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
} from 'lucide-react';

interface AuditLog {
  id: string;
  action: string;
  category: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  performedBy: string;
  performedByName: string;
  role: string;
  organizationId: string;
  organizationName: string;
  organizationCode: string;
  details: any;
  oldValue?: any;
  newValue?: any;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
}

interface AuditStats {
  totalEvents: number;
  activeActors24h: number;
  securityOverridesCount: number;
  retentionPolicy: string;
}

interface FilterOptions {
  categories: string[];
  organizations: Array<{ id: string; name: string; code: string }>;
  roles: string[];
  severities: string[];
  timeRanges: string[];
}

export default function SuperAdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<AuditStats>({
    totalEvents: 0,
    activeActors24h: 0,
    securityOverridesCount: 0,
    retentionPolicy: '90-Day Enterprise Immutable Policy (AES-256 Storage)',
  });
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    categories: [],
    organizations: [],
    roles: [],
    severities: [],
    timeRanges: [],
  });

  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [orgFilter, setOrgFilter] = useState('All');
  const [roleFilter, setRoleFilter] = useState('All');
  const [timeFilter, setTimeFilter] = useState('All');
  const [severityFilter, setSeverityFilter] = useState('All');

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);

  // Live Auto-Refresh Polling
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [copiedPayload, setCopiedPayload] = useState(false);

  // Detail Modal
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '20',
        search,
        category: categoryFilter,
        organizationId: orgFilter,
        role: roleFilter,
        timeRange: timeFilter,
        severity: severityFilter,
      });

      const res = await fetch(`/api/v1/super-admin/audit-logs?${params.toString()}`);
      if (res.ok) {
        const result = await res.json();
        if (result.success && result.data) {
          setLogs(result.data.logs || []);
          setStats(result.data.stats || {});
          setFilterOptions(result.data.filters || {});
          setTotalPages(result.data.pagination?.totalPages || 1);
          setTotalLogs(result.data.pagination?.total || 0);
        }
      }
    } catch (err) {
      console.error('Error fetching audit logs:', err);
    } finally {
      setIsLoading(false);
    }
  }, [page, search, categoryFilter, orgFilter, roleFilter, timeFilter, severityFilter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Live auto-refresh polling interval
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (autoRefresh) {
      interval = setInterval(() => {
        fetchLogs();
      }, 10000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, fetchLogs]);

  // Handle Export (CSV / JSON)
  const handleExport = (format: 'csv' | 'json') => {
    const params = new URLSearchParams({
      search,
      category: categoryFilter,
      organizationId: orgFilter,
      role: roleFilter,
      timeRange: timeFilter,
      severity: severityFilter,
      export: format,
    });

    window.open(`/api/v1/super-admin/audit-logs?${params.toString()}`, '_blank');
  };

  // Copy Payload JSON
  const handleCopyPayload = (obj: any) => {
    navigator.clipboard.writeText(JSON.stringify(obj, null, 2));
    setCopiedPayload(true);
    setTimeout(() => setCopiedPayload(false), 2000);
  };

  // Severity badge rendering
  const renderSeverityBadge = (severity: 'INFO' | 'WARNING' | 'CRITICAL') => {
    let color = 'bg-slate-100 text-slate-700 border-slate-200';
    if (severity === 'CRITICAL') {
      color = 'bg-rose-100 text-rose-800 border-rose-300 font-extrabold';
    } else if (severity === 'WARNING') {
      color = 'bg-amber-100 text-amber-800 border-amber-300 font-extrabold';
    }
    return (
      <span className={`rounded-md px-2 py-0.5 text-[9px] font-bold border ${color}`}>
        {severity}
      </span>
    );
  };

  return (
    <SuperAdminLayout
      pageTitle="Global Audit Trail & Compliance Stream"
      breadcrumbs={[
        { label: 'Executive Dashboard', href: '/super-admin/dashboard' },
        { label: 'Audit Logs', href: '/super-admin/audit-logs' },
      ]}
    >
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-slate-900">System Activity Stream</h2>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-extrabold text-slate-800 border border-slate-300">
              {totalLogs} AUDIT EVENTS RECORDED
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Immutable system audit logs tracking administrative overrides, security telemetry, user access, and system transactions across all organizations
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition-colors ${
              autoRefresh ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Activity className={`h-3.5 w-3.5 ${autoRefresh ? 'animate-pulse text-emerald-600' : 'text-slate-400'}`} />
            <span>{autoRefresh ? 'Auto-Refresh (10s)' : 'Enable Live Stream'}</span>
          </button>

          <button
            onClick={fetchLogs}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => handleExport('csv')}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 transition-colors"
          >
            <Download className="h-3.5 w-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => handleExport('json')}
            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-3.5 py-2 text-xs font-bold text-white shadow-md transition-colors"
          >
            <FileText className="h-3.5 w-3.5" />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Audit Events</p>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900">{stats.totalEvents || 0}</span>
            <FileText className="h-5 w-5 text-indigo-500" />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Active Performers (24h)</p>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-black text-emerald-600">{stats.activeActors24h || 0}</span>
            <User className="h-5 w-5 text-emerald-500" />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Security & Critical Overrides</p>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-black text-purple-600">{stats.securityOverridesCount || 0}</span>
            <ShieldAlert className="h-5 w-5 text-purple-500" />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Retention & Storage Policy</p>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-xs font-bold text-slate-700 leading-tight">90-Day Enterprise Immutable Policy</span>
            <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
          </div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by action, actor email, employee name, IP address, or payload details..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-4 py-2.5 text-xs font-medium text-slate-800 focus:border-indigo-500 focus:bg-white focus:outline-hidden"
          />
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5">
          {/* Category Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Event Category</label>
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:outline-hidden"
            >
              <option value="All">All Categories</option>
              <option value="LOGIN">LOGIN</option>
              <option value="OTP">OTP</option>
              <option value="LOGOUT">LOGOUT</option>
              <option value="USER CHANGES">USER CHANGES</option>
              <option value="ROLE CHANGES">ROLE CHANGES</option>
              <option value="ORGANIZATION CHANGES">ORGANIZATION CHANGES</option>
              <option value="EMPLOYEE CHANGES">EMPLOYEE CHANGES</option>
              <option value="LEAVE">LEAVE</option>
              <option value="PAYROLL">PAYROLL</option>
              <option value="SECURITY EVENTS">SECURITY EVENTS</option>
              <option value="SESSION REVOCATION">SESSION REVOCATION</option>
              <option value="SETTINGS CHANGES">SETTINGS CHANGES</option>
              <option value="INTEGRATION EVENTS">INTEGRATION EVENTS</option>
            </select>
          </div>

          {/* Organization Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Organization</label>
            <select
              value={orgFilter}
              onChange={(e) => {
                setOrgFilter(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:outline-hidden"
            >
              <option value="All">All Organizations</option>
              {filterOptions.organizations?.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name} ({o.code})
                </option>
              ))}
            </select>
          </div>

          {/* System Role Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">System Role</label>
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:outline-hidden"
            >
              <option value="All">All Roles</option>
              <option value="SUPER_ADMIN">Super Admin</option>
              <option value="ADMIN">Admin</option>
              <option value="HR">HR</option>
              <option value="MANAGER">Manager</option>
              <option value="EMPLOYEE">Employee</option>
            </select>
          </div>

          {/* Severity Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Severity</label>
            <select
              value={severityFilter}
              onChange={(e) => {
                setSeverityFilter(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:outline-hidden"
            >
              <option value="All">All Severities</option>
              <option value="INFO">INFO</option>
              <option value="WARNING">WARNING</option>
              <option value="CRITICAL">CRITICAL</option>
            </select>
          </div>

          {/* Time Horizon Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Time Horizon</label>
            <select
              value={timeFilter}
              onChange={(e) => {
                setTimeFilter(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:outline-hidden"
            >
              <option value="All">All Time</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <RefreshCw className="h-8 w-8 animate-spin text-indigo-600" />
            <p className="mt-3 text-xs font-medium text-slate-600">Streaming audit logs...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-500">
            <ShieldAlert className="mx-auto h-10 w-10 text-slate-300" />
            <p className="mt-2 font-bold text-slate-700">No audit logs found</p>
            <p className="text-slate-400">Try adjusting search terms or filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Action Event & Category</th>
                  <th className="py-3.5 px-4">Actor</th>
                  <th className="py-3.5 px-4">Role & Organization</th>
                  <th className="py-3.5 px-4">Device & IP</th>
                  <th className="py-3.5 px-4">Timestamp</th>
                  <th className="py-3.5 px-4 text-right">Payload</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 font-bold text-[10px]">
                          LOG
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="font-bold text-slate-900">{log.action}</p>
                            {renderSeverityBadge(log.severity)}
                          </div>
                          <span className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider">{log.category}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-800">{log.performedByName || 'System'}</p>
                      <p className="text-[10px] text-slate-400">{log.performedBy}</p>
                    </td>

                    <td className="py-3 px-4">
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700 border border-slate-200">
                        {formatRoleLabel(log.role)}
                      </span>
                      <p className="text-[10px] font-mono text-slate-400 mt-0.5">{log.organizationName} ({log.organizationCode})</p>
                    </td>

                    <td className="py-3 px-4 text-[11px]">
                      <p className="font-mono text-[10px] text-slate-700">{log.ipAddress}</p>
                      <p className="text-[10px] text-slate-400 truncate max-w-xs">{log.userAgent}</p>
                    </td>

                    <td className="py-3 px-4 text-slate-500 text-[11px] font-mono">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-slate-400" />
                        <span>{new Date(log.timestamp).toLocaleString()}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-100 hover:border-slate-300 transition-colors"
                      >
                        <Eye className="h-3 w-3 text-slate-500" />
                        <span>Inspect Payload</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/50 px-4 py-3 text-xs">
            <span className="text-slate-500 font-medium">
              Page <strong className="text-slate-900">{page}</strong> of <strong className="text-slate-900">{totalPages}</strong> ({totalLogs} total events)
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Next
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* JSON Payload Inspector & Diff Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-indigo-600" />
                <h3 className="text-base font-extrabold text-slate-900">Audit Event Payload & Diff Inspector</h3>
              </div>
              <button onClick={() => setSelectedLog(null)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs rounded-xl bg-slate-50 p-3 border border-slate-200">
              <div>
                <p className="text-slate-500 font-medium">Action Event:</p>
                <p className="font-bold text-slate-900">{selectedLog.action}</p>
              </div>
              <div>
                <p className="text-slate-500 font-medium">Actor Email:</p>
                <p className="font-bold text-slate-900">{selectedLog.performedBy}</p>
              </div>
              <div>
                <p className="text-slate-500 font-medium">Role & Org:</p>
                <p className="font-bold text-slate-900">{selectedLog.role} &bull; {selectedLog.organizationName}</p>
              </div>
              <div>
                <p className="text-slate-500 font-medium">Timestamp:</p>
                <p className="font-mono text-slate-900">{new Date(selectedLog.timestamp).toISOString()}</p>
              </div>
            </div>

            {/* Side-by-side Before / After Diff view if available */}
            {(selectedLog.oldValue || selectedLog.newValue) && (
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3 space-y-1">
                  <p className="font-bold text-amber-900 text-[10px] uppercase">Before Value (oldValue)</p>
                  <pre className="max-h-40 overflow-y-auto font-mono text-[10px] text-amber-800 scrollbar-thin">
                    {JSON.stringify(selectedLog.oldValue || {}, null, 2)}
                  </pre>
                </div>
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3 space-y-1">
                  <p className="font-bold text-emerald-900 text-[10px] uppercase">After Value (newValue)</p>
                  <pre className="max-h-40 overflow-y-auto font-mono text-[10px] text-emerald-800 scrollbar-thin">
                    {JSON.stringify(selectedLog.newValue || {}, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-xs font-bold text-slate-700">JSON Event Payload Details</p>
                <button
                  onClick={() => handleCopyPayload(selectedLog.details)}
                  className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800"
                >
                  {copiedPayload ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copiedPayload ? 'Copied' : 'Copy Payload'}</span>
                </button>
              </div>
              <pre className="max-h-72 overflow-y-auto rounded-xl bg-slate-950 p-4 font-mono text-[11px] text-emerald-400 shadow-inner scrollbar-thin">
                {JSON.stringify(selectedLog.details || {}, null, 2)}
              </pre>
            </div>

            <div className="flex justify-end pt-2 border-t">
              <button
                onClick={() => setSelectedLog(null)}
                className="rounded-xl border border-slate-200 bg-white px-5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </SuperAdminLayout>
  );
}
