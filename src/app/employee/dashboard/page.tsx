'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { useAuthStore } from '@/store/authStore';
import Link from 'next/link';
import {
  Clock,
  CalendarDays,
  CreditCard,
  Bell,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ArrowRight,
  FileText,
  ShieldCheck,
  CheckCheck,
  ChevronRight,
  Inbox,
  UserCheck,
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
  priority?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

export default function EmployeeDashboardPage() {
  const { user } = useAuthStore();

  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
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
    setIsError(false);
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
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Derived metrics from real context
  const activeUser = profileData || user;
  const fullName = activeUser?.name || 'Employee';
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

  // Attendance states
  const hasCheckedIn = Boolean(todayAttendance?.checkIn || todayAttendance?.clockIn);
  const hasCheckedOut = Boolean(todayAttendance?.checkOut || todayAttendance?.clockOut);
  const isClockedIn = hasCheckedIn && !hasCheckedOut;
  const isAttendanceComplete = hasCheckedIn && hasCheckedOut;

  // Clock in/out action
  const handleAttendanceClockToggle = async () => {
    if (isAttendanceComplete) return;

    setIsClockingIn(true);
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
            ? 'Clock In recorded successfully! Have a productive day.'
            : 'Clock Out recorded successfully! Have a great evening.'
        );
        fetchDashboardData();
      } else {
        showToast(data.message || 'Failed to update attendance.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Attendance action failed.', 'error');
    } finally {
      setIsClockingIn(false);
    }
  };

  return (
    <AuthGuard allowedRoles={['EMPLOYEE', 'SUPER_ADMIN', 'ADMIN', 'HR', 'MANAGER']}>
      <AdminLayout
        allowedRoles={['EMPLOYEE', 'SUPER_ADMIN', 'ADMIN', 'HR', 'MANAGER']}
        pageTitle="Employee Workspace"
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

        {/* Page Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-slate-950">Employee Dashboard</h1>
            <p className="text-xs font-medium text-slate-500 mt-0.5">
              Welcome back, <strong className="text-slate-800">{fullName}</strong>. Here&apos;s your work summary.
            </p>
          </div>
          <button
            onClick={fetchDashboardData}
            disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 disabled:opacity-50 transition-all cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh Data</span>
          </button>
        </div>

        {/* Global Error State */}
        {isError && (
          <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50/70 p-4 text-xs text-rose-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
              <span>Unable to load this information. Please check your connection.</span>
            </div>
            <button
              onClick={fetchDashboardData}
              className="rounded-xl bg-rose-600 px-3 py-1.5 font-bold text-white shadow-xs hover:bg-rose-700 transition-all cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* Pulse Skeleton Loading State */}
        {isLoading ? (
          <div className="space-y-6 animate-pulse">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-8 h-28 rounded-2xl bg-slate-200/80"></div>
              <div className="lg:col-span-4 h-28 rounded-2xl bg-slate-200/80"></div>
            </div>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-24 rounded-xl bg-slate-200/80"></div>
              ))}
            </div>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              <div className="lg:col-span-8 h-64 rounded-2xl bg-slate-200/80"></div>
              <div className="lg:col-span-4 h-64 rounded-2xl bg-slate-200/80"></div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Top Grid: Profile Card (8 Cols) + Attendance Card (4 Cols) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Profile Card */}
              <div className="lg:col-span-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-5">
                <div className="flex items-center gap-4">
                  <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-2xl font-extrabold text-white shadow-md shadow-indigo-600/20 overflow-hidden border border-indigo-100">
                    {activeUser?.photoUrl ? (
                      <img src={activeUser.photoUrl} alt={fullName} className="h-full w-full object-cover" />
                    ) : (
                      (fullName || 'E').charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-slate-900">{fullName}</h2>
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                        <ShieldCheck className="h-3 w-3" /> {activeUser?.status || 'Active Employee'}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-indigo-600">
                      {activeUser?.designation || 'Staff Member'} <span className="text-slate-400">•</span> <span className="text-slate-600">{activeUser?.department || 'General'}</span>
                    </p>
                    <div className="flex items-center gap-3 text-[11px] text-slate-500 font-mono pt-0.5">
                      <span>ID: <strong className="text-slate-800">{activeUser?.employeeId || '--'}</strong></span>
                      <span>Manager: <strong className="text-slate-800">{activeUser?.managerName || activeUser?.reportingToName || 'HR Administration'}</strong></span>
                    </div>
                  </div>
                </div>

                <Link
                  href="/employee/profile"
                  className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors shrink-0"
                >
                  <span>View Profile →</span>
                </Link>
              </div>

              {/* Compact Attendance Card */}
              <div className="lg:col-span-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Today&apos;s Attendance</span>
                  <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${
                    isAttendanceComplete
                      ? 'bg-slate-100 text-slate-600 border-slate-200'
                      : isClockedIn
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>
                    {isAttendanceComplete ? 'CHECKED OUT' : isClockedIn ? 'CHECKED IN' : 'NOT MARKED'}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono py-1">
                  <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-sans block">Clock In</span>
                    <span className="font-bold text-slate-800">{todayAttendance?.checkIn || todayAttendance?.clockIn || '--:--'}</span>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-sans block">Clock Out</span>
                    <span className="font-bold text-slate-800">{todayAttendance?.checkOut || todayAttendance?.clockOut || '--:--'}</span>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-sans block">Hours</span>
                    <span className="font-bold text-indigo-600">{todayAttendance?.workingHours ? `${todayAttendance.workingHours}h` : '--'}</span>
                  </div>
                </div>

                <button
                  onClick={handleAttendanceClockToggle}
                  disabled={isClockingIn || isAttendanceComplete}
                  className={`w-full inline-flex items-center justify-center gap-2 rounded-xl py-2 text-xs font-bold shadow-xs transition-all ${
                    isAttendanceComplete
                      ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                      : isClockedIn
                      ? 'bg-rose-600 hover:bg-rose-500 text-white cursor-pointer'
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer'
                  }`}
                >
                  <Clock className="h-4 w-4" />
                  <span>
                    {isClockingIn
                      ? 'Updating...'
                      : isAttendanceComplete
                      ? 'Attendance Complete'
                      : isClockedIn
                      ? 'Check Out'
                      : 'Check In'}
                  </span>
                </button>
              </div>
            </div>

            {/* 6 Responsive KPI Cards */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
              {/* 1. Today Attendance */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">ATTENDANCE</span>
                  <UserCheck className="h-4 w-4 text-indigo-600" />
                </div>
                <p className="mt-2 text-base font-extrabold text-slate-900 truncate">
                  {isAttendanceComplete ? 'Present' : isClockedIn ? 'Present' : 'Not Marked'}
                </p>
                <p className="mt-0.5 text-[10px] text-slate-400 font-mono">
                  {todayAttendance?.workingHours ? `${todayAttendance.workingHours}h today` : '8h 00m expected'}
                </p>
              </div>

              {/* 2. Leave Balance */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">LEAVE BALANCE</span>
                  <CalendarDays className="h-4 w-4 text-emerald-600" />
                </div>
                <p className="mt-2 text-lg font-black text-emerald-600">
                  {totalRemainingLeave} <span className="text-xs font-semibold text-slate-400">Days</span>
                </p>
                <p className="mt-0.5 text-[10px] text-slate-400">Available quota</p>
              </div>

              {/* 3. Pending Leave */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">PENDING LEAVE</span>
                  <CalendarDays className="h-4 w-4 text-amber-600" />
                </div>
                <p className="mt-2 text-lg font-black text-amber-600">{pendingLeaveCount}</p>
                <p className="mt-0.5 text-[10px] text-slate-400">Awaiting approval</p>
              </div>

              {/* 4. Latest Payroll */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">LATEST PAYROLL</span>
                  <CreditCard className="h-4 w-4 text-indigo-600" />
                </div>
                {latestPayroll?.netSalary !== undefined ? (
                  <>
                    <p className="mt-2 text-base font-extrabold text-slate-900 font-mono truncate">
                      ₹{latestPayroll.netSalary.toLocaleString()}
                    </p>
                    <p className="mt-0.5 text-[10px] text-slate-400 truncate">{latestPayroll.payrollPeriod || 'Processed'}</p>
                  </>
                ) : (
                  <>
                    <p className="mt-2 text-xs font-bold text-slate-500">No payroll available</p>
                    <p className="mt-0.5 text-[10px] text-slate-400">No records</p>
                  </>
                )}
              </div>

              {/* 5. Unread Alerts */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">UNREAD ALERTS</span>
                  <Bell className="h-4 w-4 text-rose-500" />
                </div>
                <p className="mt-2 text-lg font-black text-rose-600">{unreadNotifCount}</p>
                <p className="mt-0.5 text-[10px] text-slate-400">
                  {unreadNotifCount === 0 ? "You're all caught up" : 'System notices'}
                </p>
              </div>

              {/* 6. Open Tickets */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">OPEN TICKETS</span>
                  <HelpCircle className="h-4 w-4 text-indigo-600" />
                </div>
                <p className="mt-2 text-lg font-black text-indigo-600">{helpdeskCounts.open}</p>
                <p className="mt-0.5 text-[10px] text-slate-400">
                  {helpdeskCounts.open === 0 ? 'No open support tickets' : 'Active HR requests'}
                </p>
              </div>
            </div>

            {/* 2-Column Content Layout (70% Left / 30% Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column (8 cols): Leave Quotas, Leave Requests, Payroll */}
              <div className="lg:col-span-8 space-y-6">
                {/* 7. My Leave Balance */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-indigo-600" />
                      <span>My Leave Balance</span>
                    </h3>
                    <Link
                      href="/employee/leave"
                      className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800"
                    >
                      <span>Apply Leave →</span>
                    </Link>
                  </div>

                  {Object.keys(leaveBalances).length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-400">
                      No leave balance quotas assigned yet.
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      {Object.entries(leaveBalances).map(([key, cat]: [string, any]) => (
                        <div key={key} className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-xs space-y-1">
                          <span className="font-bold text-slate-800 truncate block">{cat.name || key}</span>
                          <p className="text-base font-black text-indigo-600">
                            {cat.remaining} <span className="text-[10px] font-normal text-slate-400">Days available</span>
                          </p>
                          <div className="flex justify-between text-[10px] text-slate-500 border-t border-slate-200/60 pt-1">
                            <span>Quota: {cat.total}</span>
                            <span>Used: {cat.used}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 10. Recent Leave Requests */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-indigo-600" />
                      <span>Recent Leave Requests</span>
                    </h3>
                    <Link href="/employee/leave" className="text-xs font-bold text-indigo-600 hover:text-indigo-800">
                      View All →
                    </Link>
                  </div>

                  {leaveRequests.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400 space-y-1">
                      <Inbox className="h-8 w-8 text-slate-300 mx-auto" />
                      <p className="font-semibold text-slate-600">No time-off requests yet</p>
                      <p className="text-[11px] text-slate-400">Your submitted leave applications will appear here.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px]">
                            <th className="pb-2">Leave Type</th>
                            <th className="pb-2">Date Range</th>
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
                                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                                    req.status === 'Approved'
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                      : req.status === 'Rejected'
                                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                      : req.status === 'Cancelled'
                                      ? 'bg-slate-100 text-slate-600 border border-slate-200'
                                      : 'bg-amber-50 text-amber-700 border border-amber-200'
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

                {/* 11. Latest Payroll */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-indigo-600" />
                      <span>Latest Payroll</span>
                    </h3>
                    <Link href="/employee/payroll" className="text-xs font-bold text-indigo-600 hover:text-indigo-800">
                      View Payroll →
                    </Link>
                  </div>

                  {latestPayroll ? (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl border border-slate-100 bg-slate-50/60 p-4 text-xs">
                      <div>
                        <span className="font-bold text-slate-900 text-sm">Period: {latestPayroll.payrollPeriod || latestPayroll.month || 'Current'}</span>
                        <p className="text-slate-500 mt-0.5">Status: <strong className="text-emerald-600">{latestPayroll.status || 'PAID'}</strong></p>
                      </div>
                      <div className="text-right font-mono">
                        <span className="text-slate-400 block text-[10px]">Net Payout Amount</span>
                        <span className="text-xl font-extrabold text-emerald-600">₹{(latestPayroll.netSalary || 0).toLocaleString()}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="py-8 text-center text-xs text-slate-400 space-y-1">
                      <CreditCard className="h-8 w-8 text-slate-300 mx-auto" />
                      <p className="font-semibold text-slate-600">No payroll records available yet.</p>
                      <p className="text-[11px] text-slate-400">When HR processes your salary, your payslips will appear here.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column (4 cols): Notifications & Support Tickets */}
              <div className="lg:col-span-4 space-y-6">
                {/* 8. Recent Notifications */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                      <Bell className="h-4 w-4 text-rose-500" />
                      <span>Recent Notifications</span>
                    </h3>
                    <Link href="/employee/notifications" className="text-xs font-bold text-indigo-600 hover:text-indigo-800">
                      View All →
                    </Link>
                  </div>

                  {notifications.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400 space-y-1">
                      <CheckCheck className="h-8 w-8 text-emerald-500 mx-auto" />
                      <p className="font-semibold text-slate-700">No new notifications</p>
                      <p className="text-[11px] text-slate-400">You&apos;re all caught up.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {notifications.slice(0, 4).map((item) => (
                        <div key={item._id || item.id} className="rounded-xl border border-slate-100 bg-slate-50/60 p-3 text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-bold text-slate-900 truncate max-w-[180px]">{item.title}</h4>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${
                                item.status === 'READ' ? 'bg-slate-100 text-slate-500' : 'bg-rose-50 text-rose-700'
                              }`}
                            >
                              {item.status || 'UNREAD'}
                            </span>
                          </div>
                          <p className="text-slate-600 line-clamp-2">{item.message}</p>
                          <span className="text-[10px] text-slate-400 font-mono block pt-0.5">
                            {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Recent'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 9. Support Tickets */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                      <HelpCircle className="h-4 w-4 text-indigo-600" />
                      <span>Support Tickets</span>
                    </h3>
                    <Link href="/employee/helpdesk" className="text-xs font-bold text-indigo-600 hover:text-indigo-800">
                      Open Helpdesk →
                    </Link>
                  </div>

                  {helpdeskTickets.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400 space-y-1">
                      <HelpCircle className="h-8 w-8 text-slate-300 mx-auto" />
                      <p className="font-semibold text-slate-600">No open support tickets</p>
                      <p className="text-[11px] text-slate-400">Submit HR queries or attendance corrections via Helpdesk.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {helpdeskTickets.slice(0, 3).map((t) => (
                        <div key={t.id} className="rounded-xl border border-slate-100 bg-slate-50/60 p-3 text-xs flex items-center justify-between">
                          <div>
                            <span className="font-mono text-[10px] font-bold text-indigo-600">{t.ticketNumber}</span>
                            <h4 className="font-bold text-slate-900 truncate max-w-[150px]">{t.subject}</h4>
                          </div>
                          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[9px] font-bold text-slate-600 border border-slate-200">
                            {t.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </AdminLayout>
    </AuthGuard>
  );
}
