'use client';

import React from 'react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { useAuthStore } from '@/store/authStore';
import { Users, CheckCircle2, Clock, CalendarDays, Award } from 'lucide-react';

export default function ManagerDashboardPage() {
  const { user } = useAuthStore();

  return (
    <AuthGuard allowedRoles={['Manager', 'Super Admin']}>
      <AdminLayout
        pageTitle="Manager Operations Dashboard"
        breadcrumbs={[{ label: 'Manager Workspace', href: '/manager/dashboard' }]}
      >
        {/* Welcome Header */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Welcome back, {user?.name || 'Manager'} 👋
            </h2>
            <p className="text-xs text-slate-500">
              Manage your engineering team, track attendance, approve leaves, and conduct OKR reviews.
            </p>
          </div>
          <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-bold text-purple-700 border border-purple-200">
            Role: {user?.role || 'Manager'}
          </span>
        </div>

        {/* KPI Stats Grid */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-semibold">Direct Reports</span>
              <Users className="h-4 w-4 text-purple-500" />
            </div>
            <p className="mt-2 text-2xl font-black text-slate-900">8 Members</p>
            <p className="mt-0.5 text-[10px] text-slate-400">Engineering & IT Team</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-semibold">Team Attendance</span>
              <Clock className="h-4 w-4 text-emerald-500" />
            </div>
            <p className="mt-2 text-2xl font-black text-slate-900">100%</p>
            <p className="mt-0.5 text-[10px] text-emerald-600 font-semibold">All 8 Checked In</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-semibold">Leave Requests</span>
              <CalendarDays className="h-4 w-4 text-amber-500" />
            </div>
            <p className="mt-2 text-2xl font-black text-amber-700">1 Pending</p>
            <p className="mt-0.5 text-[10px] text-amber-600 font-semibold">Casual Leave Request</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-semibold">OKR Completion</span>
              <Award className="h-4 w-4 text-blue-500" />
            </div>
            <p className="mt-2 text-2xl font-black text-slate-900">84%</p>
            <p className="mt-0.5 text-[10px] text-slate-400">Q3 Performance Cycle</p>
          </div>
        </div>

        {/* Manager Actions Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Manager Team Actions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-2">
              <h4 className="font-bold text-xs text-slate-900">Approve Team Time-Off</h4>
              <p className="text-[11px] text-slate-500">Review and authorize pending leave applications from direct reports.</p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-2">
              <h4 className="font-bold text-xs text-slate-900">365 Performance Appraisals</h4>
              <p className="text-[11px] text-slate-500">Submit manager ratings for Q3 performance evaluation cycles.</p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-2">
              <h4 className="font-bold text-xs text-slate-900">Attendance Log Checks</h4>
              <p className="text-[11px] text-slate-500">Monitor shift check-in times and attendance correction requests.</p>
            </div>
          </div>
        </div>
      </AdminLayout>
    </AuthGuard>
  );
}
