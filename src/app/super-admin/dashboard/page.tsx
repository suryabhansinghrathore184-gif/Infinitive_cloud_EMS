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
  ShieldAlert,
  Puzzle,
} from 'lucide-react';

interface SuperAdminStats {
  totalOrganizations: number;
  activeOrganizations: number;
  totalUsers: number;
  totalEmployees: number;
  activeEmployees: number;
  onLeaveToday: number;
  pendingLeaves: number;
  pendingTickets: number;
  recentAuditLogs: Array<{
    id: string;
    action: string;
    performedByName?: string;
    performedBy?: string;
    role?: string;
    organizationId?: string;
    timestamp: string;
  }>;
}

export default function SuperAdminDashboardPage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<SuperAdminStats>({
    totalOrganizations: 0,
    activeOrganizations: 0,
    totalUsers: 0,
    totalEmployees: 0,
    activeEmployees: 0,
    onLeaveToday: 0,
    pendingLeaves: 0,
    pendingTickets: 0,
    recentAuditLogs: [],
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchStats = useCallback(async () => {
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
      console.error('Error fetching Super Admin stats:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

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
      pageTitle="Super Admin Executive Dashboard"
      breadcrumbs={[{ label: 'Executive Dashboard', href: '/super-admin/dashboard' }]}
    >
      {/* Welcome Header */}
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
            Real-time multi-tenant analytics, system health metrics, organization growth, and governance feed
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="hidden sm:flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 shadow-2xs">
            <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
            <span>{todayDateString}</span>
          </div>

          <button
            onClick={fetchStats}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 disabled:opacity-50 transition-colors cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-slate-500 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh Metrics</span>
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

      {/* Primary KPI Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Organizations</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
              <Building2 className="h-4.5 w-4.5" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-extrabold text-slate-900">{stats.totalOrganizations}</p>
          <div className="mt-2 flex items-center gap-1.5">
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
              {stats.activeOrganizations} Active Tenants
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">System Users</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <Users className="h-4.5 w-4.5" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-extrabold text-slate-900">{stats.totalUsers}</p>
          <div className="mt-2 flex items-center gap-1.5">
            <span className="text-[11px] font-medium text-slate-500">Authenticated accounts</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Workforce</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <UserCheck className="h-4.5 w-4.5" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-extrabold text-slate-900">{stats.totalEmployees}</p>
          <div className="mt-2 flex items-center gap-1.5">
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
              {stats.activeEmployees} Active Employees
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">On Leave Today</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
              <CalendarOff className="h-4.5 w-4.5" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-extrabold text-slate-900">{stats.onLeaveToday}</p>
          <div className="mt-2 flex items-center gap-1.5">
            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
              {stats.pendingLeaves} Pending Requests
            </span>
          </div>
        </div>
      </div>

      {/* Secondary Content Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Executive Quick Actions */}
        <div className="lg:col-span-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-extrabold text-slate-900">Executive Quick Actions</h3>
            <Activity className="h-4 w-4 text-indigo-600" />
          </div>

          <div className="grid grid-cols-2 gap-2.5 text-xs">
            <Link
              href="/super-admin/organizations"
              className="flex flex-col gap-1 rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5 hover:border-indigo-400 hover:bg-indigo-50/50 transition-all"
            >
              <div className="flex items-center justify-between font-bold text-slate-900">
                <span>Add Org</span>
                <Plus className="h-3.5 w-3.5 text-indigo-600" />
              </div>
              <span className="text-[10px] text-slate-500 font-medium">Create new tenant</span>
            </Link>

            <Link
              href="/super-admin/users"
              className="flex flex-col gap-1 rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5 hover:border-indigo-400 hover:bg-indigo-50/50 transition-all"
            >
              <div className="flex items-center justify-between font-bold text-slate-900">
                <span>Manage Users</span>
                <Users className="h-3.5 w-3.5 text-indigo-600" />
              </div>
              <span className="text-[10px] text-slate-500 font-medium">Roles & Status</span>
            </Link>

            <Link
              href="/super-admin/security"
              className="flex flex-col gap-1 rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5 hover:border-indigo-400 hover:bg-indigo-50/50 transition-all"
            >
              <div className="flex items-center justify-between font-bold text-slate-900">
                <span>Security Center</span>
                <Lock className="h-3.5 w-3.5 text-indigo-600" />
              </div>
              <span className="text-[10px] text-slate-500 font-medium">Policy & Audit</span>
            </Link>

            <Link
              href="/super-admin/reports"
              className="flex flex-col gap-1 rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5 hover:border-indigo-400 hover:bg-indigo-50/50 transition-all"
            >
              <div className="flex items-center justify-between font-bold text-slate-900">
                <span>Executive Reports</span>
                <BarChart3 className="h-3.5 w-3.5 text-indigo-600" />
              </div>
              <span className="text-[10px] text-slate-500 font-medium">Analytics Export</span>
            </Link>
          </div>
        </div>

        {/* Real System Activity Audit Stream */}
        <div className="lg:col-span-8 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
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
          ) : stats.recentAuditLogs.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              No recent audit activity recorded.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 text-xs">
              {stats.recentAuditLogs.slice(0, 5).map((log) => (
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
    </SuperAdminLayout>
  );
}
