'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { SuperAdminLayout } from '@/components/layout/SuperAdminLayout';
import {
  BarChart3,
  TrendingUp,
  Download,
  Building2,
  Users,
  CalendarOff,
  Clock,
  RefreshCw,
  Filter,
  PieChart,
  FileSpreadsheet,
  FileJson,
  Printer,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  UserCheck,
  UserX,
  Briefcase,
  DollarSign,
  Info,
  ChevronUp,
  ChevronDown,
  X,
  ArrowUpRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';

// Safe Numeric Helpers (Guarantees zero NaN / Infinity / undefined outputs)
const safeNumber = (val: any): number => {
  const n = Number(val);
  return Number.isFinite(n) && !isNaN(n) ? n : 0;
};

const safePercentage = (part: any, total: any): number => {
  const p = safeNumber(part);
  const t = safeNumber(total);
  if (t <= 0) return 0;
  return Math.round((p / t) * 1000) / 10;
};

interface OrgComparisonRow {
  id: string;
  name: string;
  status: string;
  totalEmployees: number;
  activeEmployees: number;
  inactiveEmployees: number;
  users: number;
  departments: number;
  onLeaveToday: number;
}

interface ExecutiveData {
  kpis: {
    totalOrganizations: number;
    activeOrganizations: number;
    inactiveOrganizations: number;
    activeOrgPercentage: number;
    inactiveOrgPercentage: number;
    totalUsers: number;
    totalWorkforce: number;
    totalEmployees: number;
    activeEmployees: number;
    inactiveEmployees: number;
    activeWorkforcePercentage: number;
    inactiveWorkforcePercentage: number;
    onLeaveToday: number;
    leavePercentage: number;
    pendingApprovals: number;
    pendingLeaves: number;
    pendingTickets: number;
  };
  tenantOperationalHealth: {
    totalOrganizations: number;
    activeOrganizations: number;
    inactiveOrganizations: number;
    activePercentage: number;
    inactivePercentage: number;
  };
  globalWorkforce: {
    totalEmployees: number;
    activeEmployees: number;
    inactiveEmployees: number;
    onLeaveToday: number;
    activePercentage: number;
    inactivePercentage: number;
    leavePercentage: number;
    departmentBreakdown: Array<{ name: string; count: number; percentage: number }>;
  };
  orgBreakdown: OrgComparisonRow[];
  organizationGrowth: Array<{ date: string; newOrganizations: number; cumulativeOrganizations: number }>;
  workforceGrowth: Array<{ date: string; newEmployees: number; cumulativeWorkforce: number }>;
  attendanceStats: {
    presentCount: number;
    absentCount: number;
    lateCount: number;
    onLeaveCount: number;
    attendancePercentage: number;
    absencePercentage: number;
    latePercentage: number;
    totalRecordsToday: number;
  };
  leaveStats: {
    pending: number;
    approved: number;
    rejected: number;
    cancelled: number;
    totalRequests: number;
    approvalRate: number;
    byType: Array<{ type: string; count: number }>;
  };
  recruitmentStats: {
    hasData: boolean;
    openJobs: number;
    totalCandidates: number;
    shortlisted: number;
    interview: number;
    selected: number;
    rejected: number;
  };
  payrollStats: {
    hasData: boolean;
    totalRecords: number;
    processed: number;
    pending: number;
    paid: number;
    totalAmount: number;
  };
  roleDistribution: Array<{ role: string; label: string; count: number; percentage: number; color: string }>;
  executiveInsights: string[];
}

export default function SuperAdminReportsPage() {
  const [data, setData] = useState<ExecutiveData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Global Executive Filters
  const [rangeFilter, setRangeFilter] = useState('30D'); // 7D, 30D, 90D, 1Y
  const [orgFilter, setOrgFilter] = useState('ALL');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Org Table Sort
  const [sortField, setSortField] = useState<keyof OrgComparisonRow>('totalEmployees');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Org Detail Drawer
  const [selectedOrgModal, setSelectedOrgModal] = useState<OrgComparisonRow | null>(null);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchAnalytics = useCallback(async () => {
    setIsRefreshing(true);
    setHasError(false);

    try {
      const params = new URLSearchParams();
      params.set('range', rangeFilter);
      if (orgFilter !== 'ALL') params.set('organizationId', orgFilter);
      if (deptFilter !== 'ALL') params.set('department', deptFilter);
      if (statusFilter !== 'ALL') params.set('status', statusFilter);

      const res = await fetch(`/api/v1/super-admin/stats?${params.toString()}`);
      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }

      const result = await res.json();
      if (result.success && result.data) {
        setData(result.data);
      } else {
        throw new Error(result.message || 'Failed to load executive analytics');
      }
    } catch (err: any) {
      console.error('Failed to fetch executive analytics:', err);
      setHasError(true);
      setErrorMessage(err.message || 'Failed to fetch executive analytics');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [rangeFilter, orgFilter, deptFilter, statusFilter]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const handleResetFilters = () => {
    setRangeFilter('30D');
    setOrgFilter('ALL');
    setDeptFilter('ALL');
    setStatusFilter('ALL');
  };

  // Sortable Organization Table Logic
  const sortedOrgBreakdown = useMemo(() => {
    if (!data?.orgBreakdown) return [];
    return [...data.orgBreakdown].sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];
      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortOrder === 'asc' ? valA - valB : valB - valA;
      }
      return sortOrder === 'asc'
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA));
    });
  }, [data?.orgBreakdown, sortField, sortOrder]);

  const handleSort = (field: keyof OrgComparisonRow) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  // Exports
  const exportCSV = () => {
    if (!data) return;
    const k = data.kpis;
    const csvContent =
      'Executive Report Category,Metric Name,Value\n' +
      `Organizations,Total Organizations,${k.totalOrganizations}\n` +
      `Organizations,Active Organizations,${k.activeOrganizations}\n` +
      `Organizations,Inactive Organizations,${k.inactiveOrganizations}\n` +
      `Organizations,Active Percentage,${k.activeOrgPercentage}%\n` +
      `Workforce,Total Employees,${k.totalWorkforce}\n` +
      `Workforce,Active Employees,${k.activeEmployees}\n` +
      `Workforce,Inactive Employees,${k.inactiveEmployees}\n` +
      `Workforce,Active Workforce Percentage,${k.activeWorkforcePercentage}%\n` +
      `Workforce,On Leave Today,${k.onLeaveToday}\n` +
      `Workforce,Pending Approvals,${k.pendingApprovals}\n` +
      `Users,System Users,${k.totalUsers}\n`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `executive_analytics_report_${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Executive report exported to CSV');
  };

  const exportJSON = () => {
    if (!data) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `executive_analytics_data_${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Executive dataset exported to JSON');
  };

  const printReport = () => {
    window.print();
  };

  const kpis = data?.kpis || {
    totalOrganizations: 0,
    activeOrganizations: 0,
    inactiveOrganizations: 0,
    activeOrgPercentage: 0,
    inactiveOrgPercentage: 0,
    totalUsers: 0,
    totalWorkforce: 0,
    totalEmployees: 0,
    activeEmployees: 0,
    inactiveEmployees: 0,
    activeWorkforcePercentage: 0,
    inactiveWorkforcePercentage: 0,
    onLeaveToday: 0,
    leavePercentage: 0,
    pendingApprovals: 0,
    pendingLeaves: 0,
    pendingTickets: 0,
  };

  return (
    <SuperAdminLayout
      pageTitle="Super Admin Executive Reports & Analytics"
      breadcrumbs={[{ label: 'Reports & Analytics', href: '/super-admin/reports' }]}
    >
      {/* Toast Feedback */}
      {toast && (
        <div
          className={`fixed right-6 top-20 z-50 flex items-center gap-2 rounded-xl px-4 py-3 text-xs font-bold text-white shadow-2xl transition-all border ${
            toast.type === 'success' ? 'bg-slate-900 border-slate-700' : 'bg-rose-900 border-rose-700'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          ) : (
            <AlertCircle className="h-4 w-4 text-rose-400" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      <div className="space-y-6">
        {/* Header Title Banner */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-extrabold text-slate-900">Executive Intelligence Dashboard</h2>
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-black text-emerald-800 border border-emerald-300">
                REAL-TIME METRICS
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Cross-tenant operational health, workforce distribution, growth trends, and attendance intelligence
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <button
              onClick={fetchAnalytics}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 text-indigo-600 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>

            <button
              onClick={exportCSV}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-3 py-2 text-xs font-bold text-white shadow-xs"
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={exportJSON}
              className="flex items-center gap-1.5 rounded-xl bg-slate-800 hover:bg-slate-900 px-3 py-2 text-xs font-bold text-white shadow-xs"
            >
              <FileJson className="h-3.5 w-3.5" />
              <span>Export JSON</span>
            </button>

            <button
              onClick={printReport}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-xs"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print</span>
            </button>
          </div>
        </div>

        {/* Executive Global Filter Bar */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-indigo-600" />
              <span className="text-xs font-extrabold text-slate-900">Executive Filters</span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Date Range Selector */}
              <select
                value={rangeFilter}
                onChange={(e) => setRangeFilter(e.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-500"
              >
                <option value="7D">Time Range: Last 7 Days</option>
                <option value="30D">Time Range: Last 30 Days</option>
                <option value="90D">Time Range: Last 90 Days</option>
                <option value="1Y">Time Range: Last 1 Year</option>
              </select>

              {/* Organization Filter */}
              <select
                value={orgFilter}
                onChange={(e) => setOrgFilter(e.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-500 max-w-[200px] truncate"
              >
                <option value="ALL">Organization: All Tenants</option>
                {(data?.orgBreakdown || []).map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-500"
              >
                <option value="ALL">Status: All Statuses</option>
                <option value="Active">Status: Active Only</option>
                <option value="Inactive">Status: Inactive Only</option>
              </select>

              {(rangeFilter !== '30D' || orgFilter !== 'ALL' || deptFilter !== 'ALL' || statusFilter !== 'ALL') && (
                <button
                  onClick={handleResetFilters}
                  className="flex items-center gap-1 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100"
                >
                  <X className="h-3.5 w-3.5" />
                  <span>Reset</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Loading / Error States */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <RefreshCw className="h-8 w-8 animate-spin text-indigo-600" />
            <p className="mt-3 text-xs font-medium text-slate-600">Generating real executive report metrics...</p>
          </div>
        ) : hasError ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-12 text-center shadow-xs">
            <AlertCircle className="mx-auto h-10 w-10 text-rose-500" />
            <h3 className="mt-3 text-base font-extrabold text-slate-900">Unable to Load Executive Analytics</h3>
            <p className="mt-1 text-xs text-slate-600 max-w-md mx-auto">{errorMessage}</p>
            <button
              onClick={fetchAnalytics}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-rose-600 hover:bg-rose-700 px-4 py-2 text-xs font-bold text-white shadow-xs"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Retry Request</span>
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Executive KPI Summary (8 Cards - Strictly zero NaN) */}
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-8">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-[10px] font-extrabold uppercase">Total Orgs</span>
                  <Building2 className="h-4 w-4 text-indigo-600" />
                </div>
                <div className="mt-2 text-2xl font-black text-slate-900">{kpis.totalOrganizations}</div>
                <div className="mt-1 text-[10px] font-bold text-emerald-600">{kpis.activeOrganizations} Active</div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-[10px] font-extrabold uppercase">Active Orgs</span>
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                </div>
                <div className="mt-2 text-2xl font-black text-emerald-700">{kpis.activeOrganizations}</div>
                <div className="mt-1 text-[10px] font-bold text-emerald-600">{kpis.activeOrgPercentage}% Active</div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-[10px] font-extrabold uppercase">Inactive Orgs</span>
                  <AlertCircle className="h-4 w-4 text-slate-400" />
                </div>
                <div className="mt-2 text-2xl font-black text-slate-600">{kpis.inactiveOrganizations}</div>
                <div className="mt-1 text-[10px] font-bold text-slate-500">{kpis.inactiveOrgPercentage}% Inactive</div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-[10px] font-extrabold uppercase">System Users</span>
                  <Users className="h-4 w-4 text-blue-600" />
                </div>
                <div className="mt-2 text-2xl font-black text-blue-600">{kpis.totalUsers}</div>
                <div className="mt-1 text-[10px] font-bold text-slate-400">Auth Accounts</div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-[10px] font-extrabold uppercase">Workforce</span>
                  <TrendingUp className="h-4 w-4 text-emerald-600" />
                </div>
                <div className="mt-2 text-2xl font-black text-slate-900">{kpis.totalWorkforce}</div>
                <div className="mt-1 text-[10px] font-bold text-emerald-600">{kpis.activeWorkforcePercentage}% Active</div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-[10px] font-extrabold uppercase">Active Staff</span>
                  <UserCheck className="h-4 w-4 text-emerald-600" />
                </div>
                <div className="mt-2 text-2xl font-black text-emerald-600">{kpis.activeEmployees}</div>
                <div className="mt-1 text-[10px] font-bold text-slate-400">{kpis.inactiveEmployees} Inactive</div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-[10px] font-extrabold uppercase">On Leave Today</span>
                  <CalendarOff className="h-4 w-4 text-amber-600" />
                </div>
                <div className="mt-2 text-2xl font-black text-amber-600">{kpis.onLeaveToday}</div>
                <div className="mt-1 text-[10px] font-bold text-amber-600">{kpis.leavePercentage}% of Staff</div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-[10px] font-extrabold uppercase">Pending Ops</span>
                  <Clock className="h-4 w-4 text-purple-600" />
                </div>
                <div className="mt-2 text-2xl font-black text-purple-700">{kpis.pendingApprovals}</div>
                <div className="mt-1 text-[10px] font-bold text-purple-600">{kpis.pendingLeaves} Leaves</div>
              </div>
            </div>

            {/* Dynamic Executive Insights Section */}
            {data?.executiveInsights && data.executiveInsights.length > 0 && (
              <div className="rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50/80 to-purple-50/80 p-5 shadow-xs">
                <div className="flex items-center gap-2 border-b border-indigo-100 pb-3 mb-3">
                  <Zap className="h-4 w-4 text-indigo-600" />
                  <h3 className="text-xs font-extrabold text-indigo-900 uppercase">Executive Intelligence Insights</h3>
                </div>
                <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 text-xs font-semibold text-slate-700">
                  {(data?.executiveInsights || []).map((insight, idx) => (
                    <div key={idx} className="flex items-start gap-2 bg-white/80 p-2.5 rounded-xl border border-indigo-100/50">
                      <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 mt-1.5 shrink-0" />
                      <span>{insight}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Visual Analytics Grid: Tenant Health & Global Workforce */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Tenant Operational Health */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-indigo-600" />
                    <h3 className="text-sm font-extrabold text-slate-900">Tenant Operational Health</h3>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 font-mono">CROSS-TENANT</span>
                </div>

                {kpis.totalOrganizations === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-400 font-medium">No organization data available</div>
                ) : (
                  <div className="space-y-5 text-xs">
                    <div>
                      <div className="flex justify-between font-extrabold text-slate-700 mb-2">
                        <span>Organization Status Distribution</span>
                        <span className="text-emerald-700 font-black">{kpis.activeOrgPercentage}% Active</span>
                      </div>
                      <div className="h-4 w-full rounded-full bg-slate-100 overflow-hidden flex shadow-inner">
                        <div
                          className="bg-emerald-500 h-full transition-all duration-500"
                          style={{ width: `${kpis.activeOrgPercentage}%` }}
                          title={`Active: ${kpis.activeOrganizations}`}
                        />
                        <div
                          className="bg-slate-300 h-full transition-all duration-500"
                          style={{ width: `${kpis.inactiveOrgPercentage}%` }}
                          title={`Inactive: ${kpis.inactiveOrganizations}`}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                        <span className="text-[10px] font-extrabold text-slate-500 block">ACTIVE ORGANIZATIONS</span>
                        <span className="text-2xl font-black text-emerald-700">{kpis.activeOrganizations}</span>
                        <span className="text-[10px] text-slate-400 block font-mono mt-0.5">{kpis.activeOrgPercentage}% of Total</span>
                      </div>
                      <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                        <span className="text-[10px] font-extrabold text-slate-500 block">INACTIVE ORGANIZATIONS</span>
                        <span className="text-2xl font-black text-slate-700">{kpis.inactiveOrganizations}</span>
                        <span className="text-[10px] text-slate-400 block font-mono mt-0.5">{kpis.inactiveOrgPercentage}% of Total</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Global Workforce Ratio */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-emerald-600" />
                    <h3 className="text-sm font-extrabold text-slate-900">Global Workforce Ratio</h3>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 font-mono">STAFF METRICS</span>
                </div>

                {kpis.totalWorkforce === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-400 font-medium">No workforce data available</div>
                ) : (
                  <div className="space-y-5 text-xs">
                    <div>
                      <div className="flex justify-between font-extrabold text-slate-700 mb-2">
                        <span>Active vs Inactive Employee Ratio</span>
                        <span className="text-indigo-700 font-black">{kpis.activeWorkforcePercentage}% Active</span>
                      </div>
                      <div className="h-4 w-full rounded-full bg-slate-100 overflow-hidden flex shadow-inner">
                        <div
                          className="bg-indigo-600 h-full transition-all duration-500"
                          style={{ width: `${kpis.activeWorkforcePercentage}%` }}
                        />
                        <div
                          className="bg-rose-400 h-full transition-all duration-500"
                          style={{ width: `${kpis.inactiveWorkforcePercentage}%` }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 pt-2">
                      <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                        <span className="text-[10px] font-extrabold text-slate-500 block">ACTIVE</span>
                        <span className="text-lg font-black text-emerald-700">{kpis.activeEmployees}</span>
                      </div>
                      <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                        <span className="text-[10px] font-extrabold text-slate-500 block">INACTIVE</span>
                        <span className="text-lg font-black text-slate-600">{kpis.inactiveEmployees}</span>
                      </div>
                      <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                        <span className="text-[10px] font-extrabold text-slate-500 block">LEAVE TODAY</span>
                        <span className="text-lg font-black text-amber-600">{kpis.onLeaveToday}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Attendance & Leave Analytics Row */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Attendance Analytics */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-5 w-5 text-indigo-600" />
                    <h3 className="text-sm font-extrabold text-slate-900">Attendance Overview</h3>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 font-mono">TODAY</span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4">
                    <span className="text-[10px] font-extrabold text-emerald-800 uppercase block">Present</span>
                    <span className="text-2xl font-black text-emerald-700">{data?.attendanceStats.presentCount ?? 0}</span>
                    <span className="text-[10px] text-emerald-600 block font-mono font-bold mt-0.5">
                      {data?.attendanceStats.attendancePercentage ?? 0}% Rate
                    </span>
                  </div>

                  <div className="rounded-xl border border-rose-100 bg-rose-50/50 p-4">
                    <span className="text-[10px] font-extrabold text-rose-800 uppercase block">Absent</span>
                    <span className="text-2xl font-black text-rose-700">{data?.attendanceStats.absentCount ?? 0}</span>
                    <span className="text-[10px] text-rose-600 block font-mono font-bold mt-0.5">
                      {data?.attendanceStats.absencePercentage ?? 0}% Rate
                    </span>
                  </div>

                  <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-4">
                    <span className="text-[10px] font-extrabold text-amber-800 uppercase block">Late Arrival</span>
                    <span className="text-2xl font-black text-amber-700">{data?.attendanceStats.lateCount ?? 0}</span>
                    <span className="text-[10px] text-amber-600 block font-mono font-bold mt-0.5">
                      {data?.attendanceStats.latePercentage ?? 0}% Rate
                    </span>
                  </div>

                  <div className="rounded-xl border border-purple-100 bg-purple-50/50 p-4">
                    <span className="text-[10px] font-extrabold text-purple-800 uppercase block">On Leave</span>
                    <span className="text-2xl font-black text-purple-700">{data?.attendanceStats.onLeaveCount ?? 0}</span>
                    <span className="text-[10px] text-purple-600 block font-mono font-bold mt-0.5">Approved</span>
                  </div>
                </div>
              </div>

              {/* Leave Analytics */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                  <div className="flex items-center gap-2">
                    <CalendarOff className="h-5 w-5 text-amber-600" />
                    <h3 className="text-sm font-extrabold text-slate-900">Leave Analytics & Approval Rate</h3>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 font-mono">ALL TIME</span>
                </div>

                <div className="grid grid-cols-4 gap-3 text-xs mb-4">
                  <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                    <span className="text-[10px] font-bold text-amber-600 block">Pending</span>
                    <span className="text-xl font-black text-slate-900">{data?.leaveStats.pending ?? 0}</span>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                    <span className="text-[10px] font-bold text-emerald-600 block">Approved</span>
                    <span className="text-xl font-black text-slate-900">{data?.leaveStats.approved ?? 0}</span>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                    <span className="text-[10px] font-bold text-rose-600 block">Rejected</span>
                    <span className="text-xl font-black text-slate-900">{data?.leaveStats.rejected ?? 0}</span>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-500 block">Cancelled</span>
                    <span className="text-xl font-black text-slate-900">{data?.leaveStats.cancelled ?? 0}</span>
                  </div>
                </div>

                <div className="rounded-xl bg-indigo-50 p-3.5 border border-indigo-100 text-xs flex items-center justify-between font-extrabold">
                  <span className="text-indigo-900">Leave Request Approval Rate:</span>
                  <span className="text-base text-indigo-700 font-black">{data?.leaveStats.approvalRate ?? 0}%</span>
                </div>
              </div>
            </div>

            {/* Organization Executive Comparison Table */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-indigo-600" />
                  <h3 className="text-sm font-extrabold text-slate-900">Organization Comparison Directory</h3>
                </div>
                <span className="text-[10px] font-bold text-slate-400 font-mono">
                  {sortedOrgBreakdown.length} TENANTS
                </span>
              </div>

              {sortedOrgBreakdown.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400 font-medium">No tenant organizations found</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 font-extrabold text-slate-600">
                        <th className="p-3">Organization Name</th>
                        <th
                          className="p-3 cursor-pointer hover:text-indigo-600"
                          onClick={() => handleSort('totalEmployees')}
                        >
                          <div className="flex items-center gap-1">
                            <span>Employees</span>
                            {sortField === 'totalEmployees' && (sortOrder === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                          </div>
                        </th>
                        <th
                          className="p-3 cursor-pointer hover:text-indigo-600"
                          onClick={() => handleSort('activeEmployees')}
                        >
                          <div className="flex items-center gap-1">
                            <span>Active Staff</span>
                            {sortField === 'activeEmployees' && (sortOrder === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                          </div>
                        </th>
                        <th className="p-3">Inactive Staff</th>
                        <th
                          className="p-3 cursor-pointer hover:text-indigo-600"
                          onClick={() => handleSort('users')}
                        >
                          <div className="flex items-center gap-1">
                            <span>Users</span>
                            {sortField === 'users' && (sortOrder === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                          </div>
                        </th>
                        <th
                          className="p-3 cursor-pointer hover:text-indigo-600"
                          onClick={() => handleSort('departments')}
                        >
                          <div className="flex items-center gap-1">
                            <span>Depts</span>
                            {sortField === 'departments' && (sortOrder === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                          </div>
                        </th>
                        <th className="p-3">On Leave</th>
                        <th className="p-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(sortedOrgBreakdown || []).map((org) => (
                        <tr
                          key={org.id}
                          onClick={() => setSelectedOrgModal(org)}
                          className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                        >
                          <td className="p-3 font-extrabold text-slate-900">{org.name}</td>
                          <td className="p-3 font-bold text-slate-700">{org.totalEmployees}</td>
                          <td className="p-3 font-bold text-emerald-700">{org.activeEmployees}</td>
                          <td className="p-3 text-slate-500">{org.inactiveEmployees}</td>
                          <td className="p-3 font-bold text-blue-700">{org.users}</td>
                          <td className="p-3 text-slate-700">{org.departments}</td>
                          <td className="p-3 font-bold text-amber-600">{org.onLeaveToday}</td>
                          <td className="p-3">
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold border ${
                                org.status !== 'Inactive'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-slate-100 text-slate-600 border-slate-300'
                              }`}
                            >
                              {org.status || 'Active'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Optional Recruitment & Payroll Summary Cards (Only shown when data exists) */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Recruitment Analytics */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-indigo-600" />
                    <h3 className="text-sm font-extrabold text-slate-900">Recruitment Analytics</h3>
                  </div>
                </div>

                {!data?.recruitmentStats.hasData ? (
                  <div className="py-10 text-center text-xs text-slate-400 font-medium">No recruitment data available</div>
                ) : (
                  <div className="grid grid-cols-3 gap-3 text-xs">
                    <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                      <span className="text-[10px] font-bold text-slate-500 block">OPEN JOBS</span>
                      <span className="text-lg font-black text-indigo-700">{data.recruitmentStats.openJobs}</span>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                      <span className="text-[10px] font-bold text-slate-500 block">CANDIDATES</span>
                      <span className="text-lg font-black text-slate-900">{data.recruitmentStats.totalCandidates}</span>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                      <span className="text-[10px] font-bold text-emerald-600 block">SELECTED</span>
                      <span className="text-lg font-black text-emerald-700">{data.recruitmentStats.selected}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Payroll Summary */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-emerald-600" />
                    <h3 className="text-sm font-extrabold text-slate-900">Payroll Executive Summary</h3>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 font-mono">AGGREGATE ONLY</span>
                </div>

                {!data?.payrollStats.hasData ? (
                  <div className="py-10 text-center text-xs text-slate-400 font-medium">No payroll data available</div>
                ) : (
                  <div className="grid grid-cols-3 gap-3 text-xs">
                    <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                      <span className="text-[10px] font-bold text-slate-500 block">TOTAL RECORDS</span>
                      <span className="text-lg font-black text-slate-900">{data.payrollStats.totalRecords}</span>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                      <span className="text-[10px] font-bold text-emerald-600 block">PROCESSED</span>
                      <span className="text-lg font-black text-emerald-700">{data.payrollStats.processed}</span>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                      <span className="text-[10px] font-bold text-amber-600 block">PENDING</span>
                      <span className="text-lg font-black text-amber-700">{data.payrollStats.pending}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ORGANIZATION DETAIL DRAWER / MODAL */}
      {selectedOrgModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <Building2 className="h-5 w-5 text-indigo-600" />
                <h3 className="text-base font-extrabold text-slate-900">{selectedOrgModal.name}</h3>
              </div>
              <button
                onClick={() => setSelectedOrgModal(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 block">Organization ID</span>
                  <span className="font-mono font-extrabold text-slate-900">{selectedOrgModal.id}</span>
                </div>
                <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 block">Status</span>
                  <span className="font-extrabold text-emerald-700">{selectedOrgModal.status}</span>
                </div>
                <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 block">Total Workforce</span>
                  <span className="font-extrabold text-slate-900">{selectedOrgModal.totalEmployees} Employees</span>
                </div>
                <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 block">Active Employees</span>
                  <span className="font-extrabold text-emerald-700">{selectedOrgModal.activeEmployees} Active</span>
                </div>
                <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 block">Auth Users</span>
                  <span className="font-extrabold text-blue-700">{selectedOrgModal.users} Accounts</span>
                </div>
                <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 block">Departments</span>
                  <span className="font-extrabold text-slate-900">{selectedOrgModal.departments} Depts</span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end border-t border-slate-100 pt-4">
              <button
                onClick={() => setSelectedOrgModal(null)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}
    </SuperAdminLayout>
  );
}
