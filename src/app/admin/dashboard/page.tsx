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
import { mockKpiMetrics } from '@/data/dashboard';

export default function AdminDashboardPage() {
  return (
    <AdminLayout pageTitle="Dashboard">
      {/* Welcome Greeting */}
      <WelcomeSection />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {mockKpiMetrics.map((metric) => (
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
