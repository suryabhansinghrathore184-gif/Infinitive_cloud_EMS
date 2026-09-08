'use client';

import React from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { WelcomeSection } from '@/components/dashboard/WelcomeSection';
import { StatCard } from '@/components/dashboard/StatCard';
import { AttendanceOverview } from '@/components/dashboard/AttendanceOverview';
import { EmployeeGrowthChart } from '@/components/dashboard/EmployeeGrowthChart';
import { LeaveRequestsTable } from '@/components/dashboard/LeaveRequestsTable';
import { UpcomingEvents } from '@/components/dashboard/UpcomingEvents';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { Announcements } from '@/components/dashboard/Announcements';
import { useEmsStore } from '@/store/emsStore';
import { Database, Trash2, RefreshCw, AlertCircle } from 'lucide-react';

export default function AdminDashboardPage() {
  const {
    state,
    totalEmployeesCount,
    activeEmployeesCount,
    onLeaveCount,
    newEmployeesCount,
    clearSeedData,
    resetToDemoData,
  } = useEmsStore();

  // Dynamic KPI Metrics calculated from the underlying EMS Data Store
  const dynamicKpiMetrics = [
    {
      id: 'total-employees',
      title: 'Total Employees',
      value: totalEmployeesCount.toLocaleString(),
      change: '+8.2%',
      isPositive: true,
      periodText: 'vs last month',
      iconName: 'users' as const,
    },
    {
      id: 'active-employees',
      title: 'Active Employees',
      value: activeEmployeesCount.toLocaleString(),
      change: '+2.4%',
      isPositive: true,
      periodText: 'vs last month',
      iconName: 'user-check' as const,
    },
    {
      id: 'on-leave',
      title: 'On Leave',
      value: onLeaveCount.toLocaleString(),
      change: '-1.5%',
      isPositive: true,
      periodText: 'vs last month',
      iconName: 'user-minus' as const,
    },
    {
      id: 'new-employees',
      title: 'New Employees',
      value: newEmployeesCount.toLocaleString(),
      change: '+12.0%',
      isPositive: true,
      periodText: 'vs last month',
      iconName: 'user-plus' as const,
    },
  ];

  return (
    <AdminLayout pageTitle="Dashboard">
      {/* Demo vs Real Data Source Control Banner */}
      <div className="flex flex-wrap items-center justify-between rounded-2xl border border-blue-200 bg-blue-50/60 p-4 text-xs text-blue-900 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white font-bold">
            <Database className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-slate-900">{state.company.name}</span>
              {state.isDemoData ? (
                <span className="rounded-full bg-amber-100 px-2.5 py-0.5 font-bold text-amber-800 text-[10px] border border-amber-300">
                  DEMO SEED DATA ACTIVE
                </span>
              ) : (
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 font-bold text-emerald-800 text-[10px] border border-emerald-300">
                  REAL COMPANY DATA SOURCE
                </span>
              )}
            </div>
            <p className="text-slate-600 mt-0.5">
              Dashboard metrics are dynamically calculated from the underlying EMS Master Database ({totalEmployeesCount} Employees Registered).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-2 sm:mt-0">
          {state.isDemoData ? (
            <button
              onClick={clearSeedData}
              className="flex items-center gap-1.5 rounded-xl border border-rose-300 bg-white px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50"
              title="Purge demo records to enter real company employee data"
            >
              <Trash2 className="h-3.5 w-3.5" /> Purge Seed Data
            </button>
          ) : (
            <button
              onClick={resetToDemoData}
              className="flex items-center gap-1.5 rounded-xl border border-blue-300 bg-white px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Load Sample Demo Data
            </button>
          )}
        </div>
      </div>

      {/* Welcome Greeting */}
      <WelcomeSection />

      {/* Dynamic KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {dynamicKpiMetrics.map((metric) => (
          <StatCard key={metric.id} metric={metric} />
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <AttendanceOverview />
        </div>
        <div className="lg:col-span-7">
          <EmployeeGrowthChart />
        </div>
      </div>

      {/* Leave Requests & Upcoming Events */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7 xl:col-span-8">
          <LeaveRequestsTable />
        </div>
        <div className="lg:col-span-5 xl:col-span-4">
          <UpcomingEvents />
        </div>
      </div>

      {/* Activity & Announcements Stream */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-6">
          <RecentActivity />
        </div>
        <div className="lg:col-span-6">
          <Announcements />
        </div>
      </div>
    </AdminLayout>
  );
}
