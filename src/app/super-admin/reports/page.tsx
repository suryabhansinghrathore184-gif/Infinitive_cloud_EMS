'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
} from 'lucide-react';

interface ReportStats {
  totalOrganizations: number;
  activeOrganizations: number;
  totalUsers: number;
  totalEmployees: number;
  activeEmployees: number;
  onLeaveToday: number;
  pendingLeaves: number;
  pendingTickets: number;
}

export default function SuperAdminReportsPage() {
  const [stats, setStats] = useState<ReportStats>({
    totalOrganizations: 0,
    activeOrganizations: 0,
    totalUsers: 0,
    totalEmployees: 0,
    activeEmployees: 0,
    onLeaveToday: 0,
    pendingLeaves: 0,
    pendingTickets: 0,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedOrgFilter, setSelectedOrgFilter] = useState('ALL');
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const fetchReportData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/v1/super-admin/stats');
      if (res.ok) {
        const result = await res.json();
        if (result.success && result.data) {
          setStats(result.data);
        }
      }
    } catch (err) {
      console.error('Failed to fetch report metrics:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  const handleExportCSV = () => {
    const csvContent =
      'Metric,Value\n' +
      `Total Organizations,${stats.totalOrganizations}\n` +
      `Active Organizations,${stats.activeOrganizations}\n` +
      `Total System Users,${stats.totalUsers}\n` +
      `Total Employees,${stats.totalEmployees}\n` +
      `Active Employees,${stats.activeEmployees}\n` +
      `Employees On Leave Today,${stats.onLeaveToday}\n` +
      `Pending Leave Requests,${stats.pendingLeaves}\n`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `super_admin_executive_report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('Executive report exported cleanly to CSV');
  };

  return (
    <SuperAdminLayout
      pageTitle="Super Admin Executive Reports & Analytics"
      breadcrumbs={[{ label: 'Reports & Analytics', href: '/super-admin/reports' }]}
    >
      {/* Export Toast */}
      {toast && (
        <div className="fixed right-6 top-20 z-50 flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs text-white shadow-2xl animate-fade-in border border-slate-700 font-bold">
          <FileSpreadsheet className="h-4 w-4 text-emerald-400" />
          <span>{toast}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-slate-900">Executive Reports & Intelligence</h2>
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-800 border border-emerald-300">
              CROSS-TENANT METRICS
            </span>
          </div>
          <p className="text-xs text-slate-500">
            System-wide organization growth, workforce distribution, attendance rates, and operational metrics
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchReportData}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-xs hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh Analytics</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 px-4 py-2 text-xs font-bold text-white shadow-md hover:from-emerald-700 hover:to-teal-800"
          >
            <Download className="h-4 w-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Primary Metrics Grid */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <RefreshCw className="h-8 w-8 animate-spin text-indigo-600" />
          <p className="mt-3 text-xs font-medium text-slate-600">Generating executive analytics report...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Summary KPIs */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold">Total Organizations</span>
                <Building2 className="h-4 w-4 text-indigo-600" />
              </div>
              <p className="mt-3 text-3xl font-black text-slate-900">{stats.totalOrganizations}</p>
              <p className="mt-1 text-[10px] font-semibold text-emerald-600">
                {stats.activeOrganizations} Active Tenants
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold">System Users</span>
                <Users className="h-4 w-4 text-blue-600" />
              </div>
              <p className="mt-3 text-3xl font-black text-blue-600">{stats.totalUsers}</p>
              <p className="mt-1 text-[10px] text-slate-400 font-medium">Across all roles</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold">Global Workforce</span>
                <TrendingUp className="h-4 w-4 text-emerald-600" />
              </div>
              <p className="mt-3 text-3xl font-black text-emerald-600">{stats.totalEmployees}</p>
              <p className="mt-1 text-[10px] font-semibold text-emerald-700">
                {stats.activeEmployees} Active Employees
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold">On Leave Today</span>
                <CalendarOff className="h-4 w-4 text-amber-600" />
              </div>
              <p className="mt-3 text-3xl font-black text-amber-600">{stats.onLeaveToday}</p>
              <p className="mt-1 text-[10px] font-semibold text-amber-700">
                {stats.pendingLeaves} Pending Approvals
              </p>
            </div>
          </div>

          {/* Visual Analytics Sections */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Tenant Health & Distribution */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b pb-3 mb-4">
                <Building2 className="h-4 w-4 text-indigo-600" />
                <span>Tenant Operational Health</span>
              </h3>

              {stats.totalOrganizations === 0 ? (
                <div className="py-10 text-center text-xs text-slate-500">No data available</div>
              ) : (
                <div className="space-y-4 text-xs">
                  <div>
                    <div className="flex justify-between font-bold text-slate-700 mb-1">
                      <span>Active vs Inactive Organizations</span>
                      <span>
                        {Math.round(
                          (stats.activeOrganizations / (stats.totalOrganizations || 1)) * 100
                        )}
                        % Active
                      </span>
                    </div>
                    <div className="h-3.5 w-full rounded-full bg-slate-100 overflow-hidden flex">
                      <div
                        className="bg-emerald-500 h-full"
                        style={{
                          width: `${
                            (stats.activeOrganizations / (stats.totalOrganizations || 1)) * 100
                          }%`,
                        }}
                      ></div>
                      <div
                        className="bg-slate-300 h-full"
                        style={{
                          width: `${
                            ((stats.totalOrganizations - stats.activeOrganizations) /
                              (stats.totalOrganizations || 1)) *
                            100
                          }%`,
                        }}
                      ></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                      <p className="text-[10px] font-bold text-slate-500">ACTIVE TENANTS</p>
                      <p className="text-lg font-black text-slate-900">{stats.activeOrganizations}</p>
                    </div>
                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                      <p className="text-[10px] font-bold text-slate-500">INACTIVE TENANTS</p>
                      <p className="text-lg font-black text-slate-900">
                        {stats.totalOrganizations - stats.activeOrganizations}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Workforce Activity Summary */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b pb-3 mb-4">
                <Users className="h-4 w-4 text-emerald-600" />
                <span>Global Workforce Ratio</span>
              </h3>

              {stats.totalEmployees === 0 ? (
                <div className="py-10 text-center text-xs text-slate-500">No data available</div>
              ) : (
                <div className="space-y-4 text-xs">
                  <div>
                    <div className="flex justify-between font-bold text-slate-700 mb-1">
                      <span>Active Employee Workforce Ratio</span>
                      <span>
                        {Math.round(
                          (stats.activeEmployees / (stats.totalEmployees || 1)) * 100
                        )}
                        % Active
                      </span>
                    </div>
                    <div className="h-3.5 w-full rounded-full bg-slate-100 overflow-hidden flex">
                      <div
                        className="bg-indigo-600 h-full"
                        style={{
                          width: `${
                            (stats.activeEmployees / (stats.totalEmployees || 1)) * 100
                          }%`,
                        }}
                      ></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                      <p className="text-[10px] font-bold text-slate-500">ACTIVE EMPLOYEES</p>
                      <p className="text-lg font-black text-emerald-600">{stats.activeEmployees}</p>
                    </div>
                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                      <p className="text-[10px] font-bold text-slate-500">LEAVE TODAY</p>
                      <p className="text-lg font-black text-amber-600">{stats.onLeaveToday}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </SuperAdminLayout>
  );
}
