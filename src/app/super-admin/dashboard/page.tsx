'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { SuperAdminLayout } from '@/components/layout/SuperAdminLayout';
import { useAuthStore } from '@/store/authStore';
import { formatRoleLabel } from '@/lib/roleUtils';
import {
  Building2,
  Users,
  UserCheck,
  CalendarOff,
  Plus,
  BarChart3,
  RefreshCw,
  ArrowUpRight,
  Activity,
  Lock,
  CalendarDays,
  ShieldCheck,
  Puzzle,
  Settings,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileCheck,
  TrendingUp,
  Download,
  AlertCircle,
  ShieldAlert,
  UserPlus,
  Layers,
  Search,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface SuperAdminStats {
  kpis: {
    totalOrganizations: number;
    activeOrganizations: number;
    totalUsers: number;
    totalWorkforce: number;
    activeEmployees: number;
    pendingApprovals: number;
    onLeaveToday: number;
    pendingLeaves: number;
    pendingTickets: number;
    orgsGrowthText: string;
    usersGrowthText: string;
    workforceGrowthText: string;
    leavesText: string;
  };
  organizationGrowth: Array<{ date: string; organizations: number }>;
  workforceGrowth: Array<{ date: string; workforce: number }>;
  roleDistribution: Array<{
    role: string;
    label: string;
    count: number;
    percentage: number;
    color: string;
    textColor: string;
  }>;
  systemHealth: Array<{
    service: string;
    name: string;
    status: 'Healthy' | 'Connected' | 'Warning' | 'Not Configured' | 'Failed';
    details: string;
  }>;
  securityOverview: {
    failedLogins: number;
    successfulLogins: number;
    activeSessions: number;
    securityAlerts: number;
    recentSecurityEvents: number;
  };
  recentAuditLogs: Array<{
    id: string;
    action: string;
    performedBy: string;
    performedByName: string;
    role: string;
    organizationId: string;
    timestamp: string;
  }>;
}

const DEFAULT_STATS: SuperAdminStats = {
  kpis: {
    totalOrganizations: 0,
    activeOrganizations: 0,
    totalUsers: 0,
    totalWorkforce: 0,
    activeEmployees: 0,
    pendingApprovals: 0,
    onLeaveToday: 0,
    pendingLeaves: 0,
    pendingTickets: 0,
    orgsGrowthText: 'Loading...',
    usersGrowthText: 'Loading...',
    workforceGrowthText: 'Loading...',
    leavesText: 'Loading...',
  },
  organizationGrowth: [],
  workforceGrowth: [],
  roleDistribution: [],
  systemHealth: [],
  securityOverview: {
    failedLogins: 0,
    successfulLogins: 0,
    activeSessions: 0,
    securityAlerts: 0,
    recentSecurityEvents: 0,
  },
  recentAuditLogs: [],
};

const CHART_PIE_COLORS = ['#4f46e5', '#9333ea', '#2563eb', '#f59e0b', '#10b981'];

export default function SuperAdminDashboardPage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<SuperAdminStats>(DEFAULT_STATS);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<'7D' | '30D' | '90D' | '1Y'>('30D');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const fetchStats = useCallback(async () => {
    setIsRefreshing(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/super-admin/stats?range=${dateRange}`);
      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }
      const result = await res.json();
      if (result.success && result.data) {
        setStats({
          kpis: { ...DEFAULT_STATS.kpis, ...(result.data.kpis || {}) },
          organizationGrowth: Array.isArray(result.data.organizationGrowth) ? result.data.organizationGrowth : [],
          workforceGrowth: Array.isArray(result.data.workforceGrowth) ? result.data.workforceGrowth : [],
          roleDistribution: Array.isArray(result.data.roleDistribution) ? result.data.roleDistribution : [],
          systemHealth: Array.isArray(result.data.systemHealth) && result.data.systemHealth.length > 0 ? result.data.systemHealth : DEFAULT_STATS.systemHealth,
          securityOverview: {
            ...DEFAULT_STATS.securityOverview,
            ...(result.data.securityOverview || {}),
          },
          recentAuditLogs: Array.isArray(result.data.recentAuditLogs) ? result.data.recentAuditLogs : [],
        });
      } else {
        throw new Error(result.message || 'Failed to retrieve stats data');
      }
    } catch (err: any) {
      console.error('Error fetching Super Admin stats:', err);
      setError(err.message || 'Unable to load executive metrics');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleExportReport = () => {
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(stats, null, 2)
    )}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute(
      'download',
      `SuperAdmin_Executive_Report_${new Date().toISOString().split('T')[0]}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const displayName = user?.name || 'Super Administrator';
  const roleLabel = formatRoleLabel(user?.role || 'SUPER_ADMIN');
  const todayDateString = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <SuperAdminLayout
      pageTitle="Super Admin Executive Control Center"
      breadcrumbs={[{ label: 'Executive Control Center', href: '/super-admin/dashboard' }]}
    >
      {/* 1. HEADER & TOOLBAR */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-slate-900 sm:text-2xl tracking-tight">
              Welcome back, {displayName}!
            </h2>
            <span className="rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 font-semibold px-2.5 py-0.5 text-xs">
              {roleLabel}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Enterprise multi-tenant control center, system health, workforce metrics, and governance audit stream
          </p>
        </div>

        {/* Global Toolbar */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Date Range Selector */}
          <div className="flex items-center rounded-xl border border-slate-200 bg-white p-1 text-xs font-semibold shadow-2xs">
            {(['7D', '30D', '90D', '1Y'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setDateRange(r)}
                className={`rounded-lg px-2.5 py-1 transition-all ${
                  dateRange === r
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          <div className="hidden lg:flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 shadow-2xs">
            <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
            <span>{todayDateString}</span>
          </div>

          <button
            onClick={fetchStats}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 disabled:opacity-50 transition-colors cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-slate-500 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleExportReport}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <Download className="h-3.5 w-3.5 text-slate-500" />
            <span>Export</span>
          </button>

          <Link
            href="/super-admin/organizations"
            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>+ Add Organization</span>
          </Link>
        </div>
      </div>

      {/* ERROR STATE BANNER */}
      {error && (
        <div className="flex items-center justify-between rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-800 shadow-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
            <span>Unable to load executive metrics: {error}</span>
          </div>
          <button
            onClick={fetchStats}
            className="rounded-lg bg-rose-600 px-3 py-1 font-bold text-white hover:bg-rose-700 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* 2. EXECUTIVE KPI CARDS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, idx) => (
            <div key={idx} className="h-32 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs animate-pulse">
              <div className="h-4 w-20 rounded bg-slate-200 mb-3" />
              <div className="h-7 w-12 rounded bg-slate-300 mb-2" />
              <div className="h-3 w-28 rounded bg-slate-100" />
            </div>
          ))
        ) : (
          <>
            {/* KPI 1: Organizations */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all hover:shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Organizations</span>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                  <Building2 className="h-4.5 w-4.5" />
                </div>
              </div>
              <p className="mt-3 text-2xl font-extrabold text-slate-900">{stats.kpis.totalOrganizations}</p>
              <div className="mt-2 flex items-center gap-1">
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                  {stats.kpis.activeOrganizations} Active
                </span>
              </div>
            </div>

            {/* KPI 2: System Users */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all hover:shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">System Users</span>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600 border border-purple-100">
                  <Users className="h-4.5 w-4.5" />
                </div>
              </div>
              <p className="mt-3 text-2xl font-extrabold text-slate-900">{stats.kpis.totalUsers}</p>
              <div className="mt-2 flex items-center gap-1">
                <span className="text-[10px] font-semibold text-slate-500">
                  Authenticated Accounts
                </span>
              </div>
            </div>

            {/* KPI 3: Total Workforce */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all hover:shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Workforce</span>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                  <UserCheck className="h-4.5 w-4.5" />
                </div>
              </div>
              <p className="mt-3 text-2xl font-extrabold text-slate-900">{stats.kpis.totalWorkforce}</p>
              <div className="mt-2 flex items-center gap-1">
                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 border border-blue-200">
                  Global Directory
                </span>
              </div>
            </div>

            {/* KPI 4: Active Employees */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all hover:shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Active Employees</span>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                  <UserPlus className="h-4.5 w-4.5" />
                </div>
              </div>
              <p className="mt-3 text-2xl font-extrabold text-slate-900">{stats.kpis.activeEmployees}</p>
              <div className="mt-2 flex items-center gap-1">
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                  {stats.kpis.totalWorkforce > 0
                    ? `${Math.round((stats.kpis.activeEmployees / stats.kpis.totalWorkforce) * 100)}% Active`
                    : '0% Active'}
                </span>
              </div>
            </div>

            {/* KPI 5: Pending Approvals */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all hover:shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Pending Approvals</span>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
                  <FileCheck className="h-4.5 w-4.5" />
                </div>
              </div>
              <p className="mt-3 text-2xl font-extrabold text-slate-900">{stats.kpis.pendingApprovals}</p>
              <div className="mt-2 flex items-center gap-1">
                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200">
                  {stats.kpis.pendingLeaves} Leaves / {stats.kpis.pendingTickets} HR
                </span>
              </div>
            </div>

            {/* KPI 6: On Leave Today */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all hover:shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">On Leave Today</span>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-600 border border-rose-100">
                  <CalendarOff className="h-4.5 w-4.5" />
                </div>
              </div>
              <p className="mt-3 text-2xl font-extrabold text-slate-900">{stats.kpis.onLeaveToday}</p>
              <div className="mt-2 flex items-center gap-1">
                <span className="text-[10px] font-semibold text-slate-500">
                  {stats.kpis.onLeaveToday === 0 ? 'Full Workforce Active' : 'Approved Leave Log'}
                </span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* 3. EXECUTIVE GROWTH ANALYTICS CHARTS */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Organization Growth Chart */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">Organization Growth</h3>
              <p className="text-[11px] text-slate-500">Cumulative tenant additions over selected window ({dateRange})</p>
            </div>
            <div className="flex items-center gap-1 rounded-xl bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700 border border-indigo-100">
              <TrendingUp className="h-3.5 w-3.5 text-indigo-600" />
              <span>Real DB Metrics</span>
            </div>
          </div>

          <div className="h-64 w-full">
            {isLoading || !isMounted ? (
              <div className="flex h-full items-center justify-center bg-slate-50 rounded-xl">
                <RefreshCw className="h-6 w-6 animate-spin text-indigo-600" />
              </div>
            ) : (stats.organizationGrowth || []).length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-xs text-slate-400">
                <Building2 className="h-8 w-8 text-slate-300 mb-1" />
                <span>No organization growth data recorded</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.organizationGrowth || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="orgGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', fontSize: '12px', border: 'none' }}
                  />
                  <Area type="monotone" dataKey="organizations" stroke="#4f46e5" strokeWidth={2.5} fillOpacity={1} fill="url(#orgGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Workforce Growth Chart */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">Workforce Growth</h3>
              <p className="text-[11px] text-slate-500">Cumulative staff onboarded based on joining dates</p>
            </div>
            <div className="flex items-center gap-1 rounded-xl bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 border border-emerald-100">
              <UserCheck className="h-3.5 w-3.5 text-emerald-600" />
              <span>Verified Directory</span>
            </div>
          </div>

          <div className="h-64 w-full">
            {isLoading || !isMounted ? (
              <div className="flex h-full items-center justify-center bg-slate-50 rounded-xl">
                <RefreshCw className="h-6 w-6 animate-spin text-indigo-600" />
              </div>
            ) : (stats.workforceGrowth || []).length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-xs text-slate-400">
                <Users className="h-8 w-8 text-slate-300 mb-1" />
                <span>No workforce growth data recorded</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.workforceGrowth || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="workforceGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', fontSize: '12px', border: 'none' }}
                  />
                  <Area type="monotone" dataKey="workforce" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#workforceGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* 4. OPERATIONS: USER & ROLE DISTRIBUTION + SYSTEM HEALTH */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* User & Role Distribution */}
        <div className="lg:col-span-6 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">User & Role Distribution</h3>
              <p className="text-[11px] text-slate-500">System user breakdown across RBAC authorization tiers</p>
            </div>
            <Link
              href="/super-admin/roles"
              className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:underline"
            >
              <span>Matrix</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            {/* Pie Chart Visual */}
            <div className="h-44 w-full flex items-center justify-center">
              {isLoading || !isMounted ? (
                <div className="h-32 w-32 rounded-full border-4 border-slate-200 animate-pulse" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.roleDistribution || []}
                      cx="50%"
                      cy="50%"
                      innerRadius={42}
                      outerRadius={65}
                      paddingAngle={4}
                      dataKey="count"
                    >
                      {(stats.roleDistribution || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_PIE_COLORS[index % CHART_PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', fontSize: '11px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* List Distribution Progress Bars */}
            <div className="space-y-2.5 text-xs font-semibold">
              {(stats.roleDistribution || []).map((r, i) => (
                <div key={r.role} className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-700 font-bold flex items-center gap-1.5">
                      <span className={`h-2.5 w-2.5 rounded-full ${r.color}`} />
                      {r.label}
                    </span>
                    <span className="text-slate-500 font-mono">
                      {r.count} ({r.percentage}%)
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full ${r.color} transition-all duration-500`}
                      style={{ width: `${Math.max(5, r.percentage)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* System Health Status */}
        <div className="lg:col-span-6 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">System Infrastructure Health</h3>
              <p className="text-[11px] text-slate-500">Live operational status of core database, API, SMTP & storage</p>
            </div>
            <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>ALL SYSTEMS OPERATIONAL</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {(stats.systemHealth || []).map((sh) => {
              const isOk = sh.status === 'Healthy' || sh.status === 'Connected';
              const isNotConfig = sh.status === 'Not Configured';
              const isWarning = sh.status === 'Warning';

              return (
                <div
                  key={sh.service}
                  className="flex items-start gap-3 rounded-xl border border-slate-200/80 bg-slate-50/60 p-3"
                >
                  <div className="mt-0.5 shrink-0">
                    {isOk ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    ) : isNotConfig ? (
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                    ) : isWarning ? (
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-rose-600" />
                    )}
                  </div>
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-slate-900 truncate">{sh.name}</p>
                    </div>
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-[9px] font-extrabold border ${
                        isOk
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : isNotConfig
                          ? 'bg-slate-100 text-slate-600 border-slate-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {sh.status}
                    </span>
                    <p className="text-[10px] text-slate-500 truncate">{sh.details}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 5. SECURITY & RECENT SYSTEM ACTIVITY */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Security Overview */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">Security Overview</h3>
              <p className="text-[11px] text-slate-500">Authentication security & session governance metrics</p>
            </div>
            <Link
              href="/super-admin/security"
              className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:underline"
            >
              <span>Security Center</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-3.5">
              <div className="flex items-center gap-1.5 text-slate-500 font-semibold text-[11px]">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span>Successful Logins</span>
              </div>
              <p className="mt-2 text-xl font-black text-slate-900">{stats.securityOverview?.successfulLogins ?? 0}</p>
              <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">Verified Sessions</p>
            </div>

            <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-3.5">
              <div className="flex items-center gap-1.5 text-slate-500 font-semibold text-[11px]">
                <ShieldAlert className="h-4 w-4 text-rose-600" />
                <span>Failed Attempts</span>
              </div>
              <p className="mt-2 text-xl font-black text-slate-900">{stats.securityOverview?.failedLogins ?? 0}</p>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Blocked/Invalid</p>
            </div>

            <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-3.5">
              <div className="flex items-center gap-1.5 text-slate-500 font-semibold text-[11px]">
                <Lock className="h-4 w-4 text-indigo-600" />
                <span>Active Sessions</span>
              </div>
              <p className="mt-2 text-xl font-black text-slate-900">{stats.securityOverview?.activeSessions ?? 0}</p>
              <p className="text-[10px] text-indigo-600 font-semibold mt-0.5">Online Users</p>
            </div>

            <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-3.5">
              <div className="flex items-center gap-1.5 text-slate-500 font-semibold text-[11px]">
                <Activity className="h-4 w-4 text-purple-600" />
                <span>Security Events</span>
              </div>
              <p className="mt-2 text-xl font-black text-slate-900">{stats.securityOverview?.recentSecurityEvents ?? 0}</p>
              <p className="text-[10px] text-purple-600 font-semibold mt-0.5">Logged in 7 Days</p>
            </div>
          </div>

          <div className="pt-2">
            <Link
              href="/super-admin/security"
              className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors"
            >
              <Lock className="h-3.5 w-3.5 text-indigo-600" />
              <span>View Security Policies →</span>
            </Link>
          </div>
        </div>

        {/* Audit Log Stream */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">Recent System Activity Audit Stream</h3>
              <p className="text-[11px] text-slate-500">Real-time audit log events across organizations</p>
            </div>
            <Link
              href="/super-admin/audit-logs"
              className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:underline"
            >
              <span>View All Logs</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-10 text-slate-400">
              <RefreshCw className="h-6 w-6 animate-spin text-indigo-600" />
              <p className="mt-2 text-xs font-medium text-slate-600">Streaming audit logs...</p>
            </div>
          ) : (stats.recentAuditLogs || []).length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              No recent audit activity recorded.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 text-xs">
              {(stats.recentAuditLogs || []).slice(0, 5).map((log) => (
                <div key={log.id} className="flex items-center justify-between py-2.5 hover:bg-slate-50/80 px-2 rounded-xl transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 font-bold text-[10px] border border-indigo-100">
                      LOG
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{log.action}</p>
                      <p className="text-[10px] text-slate-500">
                        Actor: <strong className="text-slate-700">{log.performedByName || log.performedBy}</strong> ({log.role})
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 6. EXECUTIVE QUICK ACTIONS */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900">Executive Quick Actions</h3>
            <p className="text-[11px] text-slate-500">Fast access to core administration & governance modules</p>
          </div>
          <Activity className="h-4 w-4 text-indigo-600" />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5 text-xs">
          <Link
            href="/super-admin/organizations"
            className="flex flex-col justify-between rounded-xl border border-slate-200/80 bg-slate-50/60 p-4 hover:border-indigo-400 hover:bg-indigo-50/50 hover:shadow-xs transition-all group"
          >
            <div className="space-y-1">
              <div className="flex items-center justify-between font-bold text-slate-900">
                <span className="group-hover:text-indigo-600 transition-colors">Add Organization</span>
                <Building2 className="h-4 w-4 text-indigo-600" />
              </div>
              <p className="text-[11px] text-slate-500 font-medium">Provision new organization tenant</p>
            </div>
            <div className="mt-3 flex items-center gap-1 text-[11px] font-bold text-indigo-600">
              <span>Open Module</span>
              <ArrowUpRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </div>
          </Link>

          <Link
            href="/super-admin/users"
            className="flex flex-col justify-between rounded-xl border border-slate-200/80 bg-slate-50/60 p-4 hover:border-indigo-400 hover:bg-indigo-50/50 hover:shadow-xs transition-all group"
          >
            <div className="space-y-1">
              <div className="flex items-center justify-between font-bold text-slate-900">
                <span className="group-hover:text-indigo-600 transition-colors">Manage Users</span>
                <Users className="h-4 w-4 text-indigo-600" />
              </div>
              <p className="text-[11px] text-slate-500 font-medium">Configure credentials & RBAC roles</p>
            </div>
            <div className="mt-3 flex items-center gap-1 text-[11px] font-bold text-indigo-600">
              <span>Open Module</span>
              <ArrowUpRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </div>
          </Link>

          <Link
            href="/super-admin/security"
            className="flex flex-col justify-between rounded-xl border border-slate-200/80 bg-slate-50/60 p-4 hover:border-indigo-400 hover:bg-indigo-50/50 hover:shadow-xs transition-all group"
          >
            <div className="space-y-1">
              <div className="flex items-center justify-between font-bold text-slate-900">
                <span className="group-hover:text-indigo-600 transition-colors">Security Center</span>
                <Lock className="h-4 w-4 text-indigo-600" />
              </div>
              <p className="text-[11px] text-slate-500 font-medium">Audit logs & security rules</p>
            </div>
            <div className="mt-3 flex items-center gap-1 text-[11px] font-bold text-indigo-600">
              <span>Open Module</span>
              <ArrowUpRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </div>
          </Link>

          <Link
            href="/super-admin/reports"
            className="flex flex-col justify-between rounded-xl border border-slate-200/80 bg-slate-50/60 p-4 hover:border-indigo-400 hover:bg-indigo-50/50 hover:shadow-xs transition-all group"
          >
            <div className="space-y-1">
              <div className="flex items-center justify-between font-bold text-slate-900">
                <span className="group-hover:text-indigo-600 transition-colors">Executive Reports</span>
                <BarChart3 className="h-4 w-4 text-indigo-600" />
              </div>
              <p className="text-[11px] text-slate-500 font-medium">Export system analytics & stats</p>
            </div>
            <div className="mt-3 flex items-center gap-1 text-[11px] font-bold text-indigo-600">
              <span>Open Module</span>
              <ArrowUpRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </div>
          </Link>

          <Link
            href="/super-admin/settings"
            className="flex flex-col justify-between rounded-xl border border-slate-200/80 bg-slate-50/60 p-4 hover:border-indigo-400 hover:bg-indigo-50/50 hover:shadow-xs transition-all group"
          >
            <div className="space-y-1">
              <div className="flex items-center justify-between font-bold text-slate-900">
                <span className="group-hover:text-indigo-600 transition-colors">System Settings</span>
                <Settings className="h-4 w-4 text-indigo-600" />
              </div>
              <p className="text-[11px] text-slate-500 font-medium">Core system & storage parameters</p>
            </div>
            <div className="mt-3 flex items-center gap-1 text-[11px] font-bold text-indigo-600">
              <span>Open Module</span>
              <ArrowUpRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </div>
          </Link>
        </div>
      </div>
    </SuperAdminLayout>
  );
}
