'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { useAuthStore } from '@/store/authStore';
import Link from 'next/link';
import {
  LayoutDashboard,
  Clock,
  CalendarDays,
  CreditCard,
  Bell,
  HelpCircle,
  User,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ArrowRight,
  TrendingUp,
  FileText,
  Building2,
  ShieldCheck,
  LogOut,
} from 'lucide-react';

interface AttendanceRecord {
  _id?: string;
  id?: string;
  date?: string;
  checkIn?: string;
  clockIn?: string;
  checkOut?: string;
  clockOut?: string;
  status?: string;
  workingHours?: number;
}

interface LeaveRequest {
  _id?: string;
  id?: string;
  leaveType?: string;
  startDate?: string;
  endDate?: string;
  durationDays?: number;
  status?: string;
  requestedDate?: string;
  reason?: string;
}

interface PayrollRecord {
  _id?: string;
  id?: string;
  payrollPeriod?: string;
  month?: string;
  basicSalary?: number;
  deductions?: number;
  netSalary?: number;
  status?: string;
}

interface NotificationItem {
  _id?: string;
  id?: string;
  title?: string;
  message?: string;
  createdAt?: string;
  status?: string;
}

interface HelpdeskTicket {
  id?: string;
  ticketNumber?: string;
  subject?: string;
  requestType?: string;
  status?: string;
  createdAt?: string;
}

export default function EmployeeDashboardPage() {
  const { user } = useAuthStore();

  const [isLoading, setIsLoading] = useState(true);
  const [isClockingIn, setIsClockingIn] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  // Real Data States
  const [profileData, setProfileData] = useState<any>(null);
  const [attendanceLogs, setAttendanceLogs] = useState<AttendanceRecord[]>([]);
  const [leaveBalances, setLeaveBalances] = useState<Record<string, any>>({});
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [helpdeskTickets, setHelpdeskTickets] = useState<HelpdeskTicket[]>([]);
  const [helpdeskCounts, setHelpdeskCounts] = useState({ open: 0, total: 0 });

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [
        meRes,
        attRes,
        balRes,
        leaveRes,
        payRes,
        notifRes,
        helpRes,
      ] = await Promise.all([
        fetch('/api/v1/auth/me').catch(() => null),
        fetch('/api/v1/attendance').catch(() => null),
        fetch('/api/v1/leave/balances').catch(() => null),
        fetch('/api/v1/leave?limit=10').catch(() => null),
        fetch('/api/v1/payroll').catch(() => null),
        fetch('/api/v1/notifications').catch(() => null),
        fetch('/api/v1/hr-requests?limit=10').catch(() => null),
      ]);

      if (meRes && meRes.ok) {
        const data = await meRes.json();
        if (data.success) setProfileData(data.data);
      }

      if (attRes && attRes.ok) {
        const data = await attRes.json();
        if (data.success) setAttendanceLogs(data.data || []);
      }

      if (balRes && balRes.ok) {
        const data = await balRes.json();
        if (data.success && data.data?.balances) setLeaveBalances(data.data.balances);
      }

      if (leaveRes && leaveRes.ok) {
        const data = await leaveRes.json();
        if (data.success && data.data?.leaves) setLeaveRequests(data.data.leaves);
      }

      if (payRes && payRes.ok) {
        const data = await payRes.json();
        if (data.success) setPayrollRecords(data.data || []);
      }

      if (notifRes && notifRes.ok) {
        const data = await notifRes.json();
        if (data.success) setNotifications(data.data || []);
      }

      if (helpRes && helpRes.ok) {
        const data = await helpRes.json();
        if (data.success) {
          setHelpdeskTickets(data.tickets || []);
          setHelpdeskCounts({
            open: (data.statusCounts?.open || 0) + (data.statusCounts?.assigned || 0) + (data.statusCounts?.inProgress || 0),
            total: data.statusCounts?.total || 0,
          });
        }
      }
    } catch (err) {
      console.error('Error loading employee dashboard data:', err);
      showToast('Failed to load some dashboard metrics.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Derived KPI metrics
  const activeUser = profileData || user;
  const todayStr = new Date().toISOString().split('T')[0];
  const todayAttendance = attendanceLogs.find(
    (log) => log.date === todayStr || log.date?.startsWith(todayStr)
  ) || attendanceLogs[0];

  const totalRemainingLeave = Object.values(leaveBalances).reduce(
    (sum: number, cat: any) => sum + (cat.remaining || 0),
    0
  );

  const pendingLeaveCount = leaveRequests.filter((r) => r.status === 'Pending').length;
  const latestPayroll = payrollRecords[0];
  const unreadNotifCount = notifications.filter((n) => n.status !== 'READ').length;

  // Handle Check-in / Check-out quick action
  const handleAttendanceClockToggle = async () => {
    setIsClockingIn(true);
    const isClockedIn = todayAttendance?.checkIn && !todayAttendance?.checkOut;
    const action = isClockedIn ? 'CLOCK_OUT' : 'CLOCK_IN';

    try {
      const res = await fetch('/api/v1/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      const data = await res.json();
      if (data.success) {
        showToast(
          action === 'CLOCK_IN'
            ? 'Checked in successfully! Have a productive day.'
            : 'Checked out successfully! Have a great evening.'
        );
        fetchDashboardData();
      } else {
        showToast(data.message || 'Failed to update attendance.', 'error');
      }
    } finally {
      setIsClockingIn(false);
    }
  };

  return (
    <AuthGuard allowedRoles={['EMPLOYEE', 'SUPER_ADMIN', 'ADMIN', 'HR', 'MANAGER']}>
      <AdminLayout
        allowedRoles={['EMPLOYEE', 'SUPER_ADMIN', 'ADMIN', 'HR', 'MANAGER']}
        pageTitle="Employee Self-Service Dashboard"
        breadcrumbs={[{ label: 'Dashboard', href: '/employee/dashboard' }]}
      >
        {/* Toast Notification */}
        {toastMessage && (
          <div
            className={`fixed right-6 top-20 z-50 flex items-center gap-2 rounded-xl px-4 py-3 text-xs text-white shadow-2xl animate-fade-in ${
              toastType === 'success' ? 'bg-slate-900 border border-emerald-500/40' : 'bg-rose-950 border border-rose-500/40'
            }`}
          >
            {toastType === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            ) : (
              <AlertCircle className="h-4 w-4 text-rose-400" />
            )}
            <span className="font-medium">{toastMessage}</span>
          </div>
        )}

        {/* Header & Refresh */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Employee Dashboard</h1>
            <p className="text-xs text-slate-500 mt-1">
              Welcome back, <strong className="text-slate-800">{activeUser?.name || 'Employee'}</strong>. Here is your real-time work summary.
            </p>
          </div>
          <button
            onClick={fetchDashboardData}
            disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh Data</span>
          </button>
        </div>

        {/* Welcome Profile Card */}
        <div className="rounded-3xl border border-slate-200 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-2xl font-extrabold text-white shadow-lg shadow-indigo-600/40 border-2 border-indigo-400/30 overflow-hidden">
                {activeUser?.photoUrl ? (
                  <img src={activeUser.photoUrl} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  (activeUser?.name || 'E').charAt(0).toUpperCase()
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-white">{activeUser?.name || 'Employee'}</h2>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
                    <ShieldCheck className="h-3 w-3" /> Active Employee
                  </span>
                </div>
                <p className="text-xs font-medium text-indigo-200 mt-0.5">
                  {activeUser?.designation || 'Staff Member'} • <span className="text-slate-300">{activeUser?.department || 'General'}</span>
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-slate-400 font-mono">
                  <span>ID: <strong className="text-slate-200">{activeUser?.employeeId || 'EMP-1001'}</strong></span>
                  <span>Manager: <strong className="text-slate-200">{activeUser?.managerName || activeUser?.reportingToName || 'HR Administrator'}</strong></span>
                </div>
              </div>
            </div>

            {/* Attendance Quick Clock Action */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 backdrop-blur-md flex flex-col sm:flex-row items-center gap-4 text-xs">
              <div className="text-center sm:text-left">
                <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Today&apos;s Attendance Status</span>
                <span className={`text-sm font-extrabold ${todayAttendance?.checkIn ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {todayAttendance?.checkIn ? (todayAttendance.checkOut ? 'Clocked Out' : 'Clocked In') : 'Not Checked In'}
                </span>
                {todayAttendance?.checkIn && (
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                    In: {todayAttendance.checkIn || todayAttendance.clockIn} {todayAttendance.checkOut ? `• Out: ${todayAttendance.checkOut}` : ''}
                  </p>
                )}
              </div>
              <button
                onClick={handleAttendanceClockToggle}
                disabled={isClockingIn}
                className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 font-bold shadow-md transition-all cursor-pointer ${
                  todayAttendance?.checkIn && !todayAttendance?.checkOut
                    ? 'bg-rose-600 hover:bg-rose-500 text-white'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                }`}
              >
                <Clock className="h-4 w-4" />
                <span>
                  {isClockingIn
                    ? 'Updating...'
                    : todayAttendance?.checkIn && !todayAttendance?.checkOut
                    ? 'Clock Out'
                    : 'Clock In Now'}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* 6 Real KPI Cards */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
          {/* KPI 1: Today Attendance */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Attendance</span>
              <Clock className="h-4 w-4 text-indigo-600" />
            </div>
            <p className="mt-2 text-lg font-black text-slate-900 truncate">
              {todayAttendance?.status || (todayAttendance?.checkIn ? 'Present' : 'Not Marked')}
            </p>
            <p className="mt-0.5 text-[10px] text-slate-400">
              {todayAttendance?.workingHours ? `${todayAttendance.workingHours} hrs today` : 'Today status'}
            </p>
          </div>

          {/* KPI 2: Leave Balance */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Leave Balance</span>
              <CalendarDays className="h-4 w-4 text-emerald-600" />
            </div>
            <p className="mt-2 text-xl font-black text-emerald-600">
              {totalRemainingLeave} <span className="text-xs font-semibold text-slate-400">Days</span>
            </p>
            <p className="mt-0.5 text-[10px] text-slate-400">Available quota</p>
          </div>

          {/* KPI 3: Pending Leave */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Pending Leave</span>
              <CalendarDays className="h-4 w-4 text-amber-600" />
            </div>
            <p className="mt-2 text-xl font-black text-amber-600">{pendingLeaveCount}</p>
            <p className="mt-0.5 text-[10px] text-slate-400">Awaiting approval</p>
          </div>

          {/* KPI 4: Monthly Payroll */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Latest Net Salary</span>
              <CreditCard className="h-4 w-4 text-indigo-600" />
            </div>
            <p className="mt-2 text-lg font-black text-slate-900 font-mono truncate">
              {latestPayroll?.netSalary !== undefined ? `$${latestPayroll.netSalary.toLocaleString()}` : '--'}
            </p>
            <p className="mt-0.5 text-[10px] text-slate-400">{latestPayroll?.payrollPeriod || 'Latest period'}</p>
          </div>

          {/* KPI 5: Notifications */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Unread Alerts</span>
              <Bell className="h-4 w-4 text-rose-500" />
            </div>
            <p className="mt-2 text-xl font-black text-rose-600">{unreadNotifCount}</p>
            <p className="mt-0.5 text-[10px] text-slate-400">System notices</p>
          </div>

          {/* KPI 6: Helpdesk */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Open Tickets</span>
              <HelpCircle className="h-4 w-4 text-indigo-600" />
            </div>
            <p className="mt-2 text-xl font-black text-indigo-600">{helpdeskCounts.open}</p>
            <p className="mt-0.5 text-[10px] text-slate-400">{helpdeskCounts.total} total created</p>
          </div>
        </div>

        {/* Dashboard Main Grid Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column (8 cols): Attendance & Leave Activity */}
          <div className="lg:col-span-8 space-y-6">
            {/* Attendance & Leave Quick Panel */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-indigo-600" />
                  <span>My Leave Balances Overview</span>
                </h3>
                <Link
                  href="/employee/leave"
                  className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800"
                >
                  <span>Apply Leave</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              {Object.keys(leaveBalances).length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  No leave balance quotas assigned yet.
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {Object.entries(leaveBalances).map(([key, cat]: [string, any]) => (
                    <div key={key} className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-xs">
                      <span className="font-bold text-slate-800 truncate block">{cat.name || key}</span>
                      <p className="mt-1 text-lg font-black text-indigo-600">
                        {cat.remaining} <span className="text-[10px] font-normal text-slate-400">rem.</span>
                      </p>
                      <div className="mt-1 flex justify-between text-[10px] text-slate-500 border-t border-slate-200/60 pt-1">
                        <span>Quota: {cat.total}</span>
                        <span>Used: {cat.used}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Leave Requests */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-indigo-600" />
                  <span>Recent Leave Requests</span>
                </h3>
                <Link href="/employee/leave" className="text-xs font-bold text-indigo-600 hover:text-indigo-800">
                  View All
                </Link>
              </div>

              {leaveRequests.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  No leave requests submitted yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px]">
                        <th className="pb-2">Type</th>
                        <th className="pb-2">Dates</th>
                        <th className="pb-2">Duration</th>
                        <th className="pb-2">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {leaveRequests.slice(0, 5).map((req) => (
                        <tr key={req._id || req.id} className="hover:bg-slate-50/60">
                          <td className="py-2.5 font-bold text-slate-900">{req.leaveType}</td>
                          <td className="py-2.5 text-slate-600">
                            {req.startDate} to {req.endDate}
                          </td>
                          <td className="py-2.5 text-indigo-600 font-bold">{req.durationDays} Days</td>
                          <td className="py-2.5">
                            <span
                              className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${
                                req.status === 'Approved'
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : req.status === 'Rejected'
                                  ? 'bg-rose-50 text-rose-700'
                                  : 'bg-amber-50 text-amber-700'
                              }`}
                            >
                              {req.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Latest Payroll Preview */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-indigo-600" />
                  <span>Latest Payslip Summary</span>
                </h3>
                <Link href="/employee/payroll" className="text-xs font-bold text-indigo-600 hover:text-indigo-800">
                  My Payslips
                </Link>
              </div>

              {latestPayroll ? (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl border border-slate-100 bg-slate-50/60 p-4 text-xs">
                  <div>
                    <span className="font-bold text-slate-900 text-sm">Period: {latestPayroll.payrollPeriod || latestPayroll.month || 'Current'}</span>
                    <p className="text-slate-500 mt-0.5">Status: <strong className="text-emerald-600">{latestPayroll.status || 'PAID'}</strong></p>
                  </div>
                  <div className="text-right font-mono">
                    <span className="text-slate-400 block text-[10px]">Net Salary Amount</span>
                    <span className="text-xl font-extrabold text-emerald-600">${(latestPayroll.netSalary || 0).toLocaleString()}</span>
                  </div>
                </div>
              ) : (
                <div className="py-6 text-center text-xs text-slate-400">
                  No processed payslips available yet.
                </div>
              )}
            </div>
          </div>

          {/* Right Column (4 cols): Notifications & Support Activity */}
          <div className="lg:col-span-4 space-y-6">
            {/* System Notifications */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <Bell className="h-4 w-4 text-rose-500" />
                  <span>Recent Notifications</span>
                </h3>
                <Link href="/employee/notifications" className="text-xs font-bold text-indigo-600 hover:text-indigo-800">
                  View All
                </Link>
              </div>

              {notifications.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  No notifications found.
                </div>
              ) : (
                <div className="space-y-3">
                  {notifications.slice(0, 4).map((item) => (
                    <div key={item._id || item.id} className="rounded-xl border border-slate-100 bg-slate-50/60 p-3 text-xs">
                      <h4 className="font-bold text-slate-900">{item.title}</h4>
                      <p className="text-slate-600 mt-0.5 line-clamp-2">{item.message}</p>
                      <span className="text-[10px] text-slate-400 font-mono mt-1 block">
                        {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Recent'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Helpdesk Support Activity */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <HelpCircle className="h-4 w-4 text-indigo-600" />
                  <span>Support Tickets</span>
                </h3>
                <Link href="/employee/helpdesk" className="text-xs font-bold text-indigo-600 hover:text-indigo-800">
                  Open Helpdesk
                </Link>
              </div>

              {helpdeskTickets.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  No support tickets created yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {helpdeskTickets.slice(0, 3).map((t) => (
                    <div key={t.id} className="rounded-xl border border-slate-100 bg-slate-50/60 p-3 text-xs flex items-center justify-between">
                      <div>
                        <span className="font-mono text-[10px] font-bold text-indigo-600">{t.ticketNumber}</span>
                        <h4 className="font-bold text-slate-900 truncate max-w-[180px]">{t.subject}</h4>
                      </div>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-bold text-slate-600">
                        {t.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </AdminLayout>
    </AuthGuard>
  );
}
