'use client';

import React from 'react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { useAuthStore } from '@/store/authStore';
import { User, Clock, CalendarDays, FileText, CheckCircle2 } from 'lucide-react';

export default function EmployeeDashboardPage() {
  const { user } = useAuthStore();

  return (
    <AuthGuard allowedRoles={['Employee', 'Super Admin']}>
      <AdminLayout
        pageTitle="Employee Portal"
        breadcrumbs={[{ label: 'My Workspace', href: '/employee/dashboard' }]}
      >
        {/* Welcome Header */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Welcome, {user?.name || 'Employee'} 👋
            </h2>
            <p className="text-xs text-slate-500">
              View your attendance record, leave balances, downloaded payslips, and personal documents.
            </p>
          </div>
          <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700 border border-amber-200">
            Role: {user?.role || 'Employee'}
          </span>
        </div>

        {/* Employee Summary Cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-semibold">Today Status</span>
              <Clock className="h-4 w-4 text-emerald-500" />
            </div>
            <p className="mt-2 text-2xl font-black text-emerald-600">Checked In</p>
            <p className="mt-0.5 text-[10px] text-slate-400">Time: 09:14 AM (GPS)</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-semibold">Leave Balance</span>
              <CalendarDays className="h-4 w-4 text-blue-500" />
            </div>
            <p className="mt-2 text-2xl font-black text-slate-900">18 Days</p>
            <p className="mt-0.5 text-[10px] text-blue-600 font-semibold">12 Casual + 6 Sick</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-semibold">Latest Payslip</span>
              <FileText className="h-4 w-4 text-purple-500" />
            </div>
            <p className="mt-2 text-base font-extrabold text-slate-900">August 2026</p>
            <p className="mt-0.5 text-[10px] text-purple-600 font-bold">Ready to Download</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-semibold">Self Rating</span>
              <CheckCircle2 className="h-4 w-4 text-amber-500" />
            </div>
            <p className="mt-2 text-2xl font-black text-slate-900">4.5 / 5.0</p>
            <p className="mt-0.5 text-[10px] text-slate-400">H1 Review Complete</p>
          </div>
        </div>

        {/* Employee Self-Service Shortcuts */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Employee Self-Service (ESS) Hub</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-1.5">
              <h4 className="font-bold text-slate-900">Apply Time-Off</h4>
              <p className="text-[11px] text-slate-500">Submit casual, sick, or earned leave requests to your manager.</p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-1.5">
              <h4 className="font-bold text-slate-900">Download Salary Slips</h4>
              <p className="text-[11px] text-slate-500">View and print confidential monthly payslip PDFs.</p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-1.5">
              <h4 className="font-bold text-slate-900">Update Profile Details</h4>
              <p className="text-[11px] text-slate-500">Manage emergency contacts, address, and profile photo.</p>
            </div>
          </div>
        </div>
      </AdminLayout>
    </AuthGuard>
  );
}
