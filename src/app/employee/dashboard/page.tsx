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
  Calendar,
  Folder,
  User,
  ExternalLink,
  Sparkles,
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
  payoutDate?: string;
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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
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

  const fetchDashboardData = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setIsError(false);
    setErrorMessage(null);

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

      if (isManualRefresh) {
        showToast('Dashboard updated with latest records.', 'success');
      }
    } catch (err: any) {
      console.error('Error loading employee dashboard data:', err);
      setIsError(true);
      setErrorMessage(err?.message || 'Unable to load dashboard information. Please try again.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Derived metrics from real context
  const activeUser = profileData || user;
  const fullName = activeUser?.name || 'Employee';
  const todayStr = new Date().toISOString().split('T')[0];
  const todayFormattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

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

  // Clock in/out action using real POST /api/v1/attendance contract
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
            ? 'Check In recorded successfully! Have a productive day.'
            : 'Check Out recorded successfully! Have a great evening.'
        );
        fetchDashboardData(true);
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
        {/* Floating Action Toast Notification */}
        {toastMessage && (
          <div
            className={`fixed right-6 top-20 z-50 flex items-center gap-2.5 rounded-xl px-4 py-3 text-xs font-semibold text-white shadow-2xl transition-all duration-300 ${
              toastType === 'success'
                ? 'bg-slate-900 border border-emerald-500/40'
                : 'bg-rose-950 border border-rose-500/40'
            }`}
          >
            {toastType === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
            )}
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Dashboard Top Bar & Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6 pb-2 border-b border-slate-200/80">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black tracking-tight text-slate-900">
                Welcome back, {fullName}
              </h1>
              <span className="text-xl">👋</span>
            </div>
            <p className="text-xs font-medium text-slate-500 mt-1 flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5 text-slate-400" />
              <span>{todayFormattedDate}</span>
              <span className="text-slate-300">•</span>
              <span>Here&apos;s your current work summary.</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchDashboardData(true)}
              disabled={isLoading || isRefreshing}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50 transition-all cursor-pointer"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing || isLoading ? 'animate-spin text-indigo-600' : 'text-slate-500'}`} />
              <span>{isRefreshing ? 'Refreshing...' : 'Refresh Data'}</span>
            </button>
          </div>
        </div>

        {/* Global Error State */}
        {isError && (
          <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50/80 p-4 text-xs text-rose-800 flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
              <div>
                <p className="font-bold text-rose-900">Unable to load dashboard information</p>
                <p className="text-rose-700 mt-0.5">{errorMessage || 'Please check your connection and retry.'}</p>
              </div>
            </div>
            <button
              onClick={() => fetchDashboardData(true)}
              className="rounded-xl bg-rose-600 px-3.5 py-1.5 font-bold text-white shadow-xs hover:bg-rose-700 transition-all cursor-pointer shrink-0"
            >
              Retry Request
            </button>
          </div>
        )}

        {/* Pulse Skeleton Loading State */}
        {isLoading ? (
          <div className="space-y-6 animate-pulse">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-8 h-32 rounded-2xl bg-slate-200/80"></div>
              <div className="lg:col-span-4 h-32 rounded-2xl bg-slate-200/80"></div>
            </div>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-28 rounded-xl bg-slate-200/80"></div>
              ))}
            </div>
            <div className="h-24 rounded-2xl bg-slate-200/80"></div>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              <div className="lg:col-span-8 space-y-6">
                <div className="h-56 rounded-2xl bg-slate-200/80"></div>
                <div className="h-64 rounded-2xl bg-slate-200/80"></div>
              </div>
              <div className="lg:col-span-4 space-y-6">
                <div className="h-64 rounded-2xl bg-slate-200/80"></div>
                <div className="h-56 rounded-2xl bg-slate-200/80"></div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Top Row: Employee Profile Summary (8 Cols) + Today's Attendance Widget (4 Cols) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Employee Profile Summary Card */}
              <div className="lg:col-span-8 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-full blur-2xl pointer-events-none -mr-10 -mt-10"></div>
                
                <div className="flex items-center gap-5 z-10">
                  <div className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-800 text-3xl font-black text-white shadow-lg shadow-indigo-600/20 overflow-hidden border-2 border-indigo-100">
                    {activeUser?.photoUrl ? (
                      <img src={activeUser.photoUrl} alt={fullName} className="h-full w-full object-cover" />
                    ) : (
                      (fullName || 'E').charAt(0).toUpperCase()
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h2 className="text-lg font-black text-slate-900">{fullName}</h2>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        <span>{activeUser?.status || 'Active Employee'}</span>
                      </span>
                    </div>

                    <p className="text-xs font-bold text-indigo-600 flex items-center gap-2">
                      <span>{activeUser?.designation || 'Staff Member'}</span>
                      <span className="text-slate-300">•</span>
                      <span className="text-slate-600">{activeUser?.department || 'General'}</span>
                    </p>

                    <div className="flex items-center gap-4 text-xs text-slate-500 font-mono pt-1 flex-wrap">
                      <span>Employee ID: <strong className="text-slate-800">{activeUser?.employeeId || '--'}</strong></span>
                      <span className="text-slate-300">•</span>
                      <span>Reporting Manager: <strong className="text-slate-800">{activeUser?.managerName || activeUser?.reportingToName || 'HR Administration'}</strong></span>
                    </div>
                  </div>
                </div>

                <Link
                  href="/employee/profile"
                  className="z-10 inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors shrink-0"
                >
                  <span>View Profile</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              {/* Today's Attendance Widget */}
              <div className="lg:col-span-4 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs flex flex-col justify-between space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-indigo-600" />
                    <span>Today&apos;s Attendance</span>
                  </span>
                  <span
                    className={`rounded-full px-3 py-0.5 text-[10px] font-extrabold border ${
                      isAttendanceComplete
                        ? 'bg-slate-100 text-slate-600 border-slate-200'
                        : isClockedIn
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 animate-pulse'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}
                  >
                    {isAttendanceComplete ? 'CHECKED OUT' : isClockedIn ? 'CHECKED IN' : 'NOT CHECKED IN'}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono py-1">
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-sans block mb-0.5">Clock In</span>
                    <span className="font-bold text-slate-800">{todayAttendance?.checkIn || todayAttendance?.clockIn || '--:--'}</span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-sans block mb-0.5">Clock Out</span>
                    <span className="font-bold text-slate-800">{todayAttendance?.checkOut || todayAttendance?.clockOut || '--:--'}</span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-sans block mb-0.5">Hours</span>
                    <span className="font-bold text-indigo-600">
                      {todayAttendance?.workingHours ? `${todayAttendance.workingHours}h` : '--'}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleAttendanceClockToggle}
                  disabled={isClockingIn || isAttendanceComplete}
                  className={`w-full inline-flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-extrabold shadow-xs transition-all ${
                    isAttendanceComplete
                      ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                      : isClockedIn
                      ? 'bg-rose-600 hover:bg-rose-500 text-white cursor-pointer shadow-rose-600/20 shadow-lg'
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer shadow-indigo-600/20 shadow-lg'
                  }`}
                >
                  <Clock className="h-4 w-4" />
                  <span>
                    {isClockingIn
                      ? 'Updating...'
                      : isAttendanceComplete
                      ? 'Attendance Complete for Today'
                      : isClockedIn
                      ? 'Check Out Now'
                      : 'Check In Now'}
                  </span>
                </button>
              </div>
            </div>

            {/* 6 Interactive KPI Cards */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
              {/* 1. Today Attendance KPI */}
              <Link
                href="/employee/attendance"
                className="group rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs hover:border-indigo-200 hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Attendance</span>
                  <UserCheck className="h-4 w-4 text-indigo-600 group-hover:scale-110 transition-transform" />
                </div>
                <p className="mt-2 text-base font-extrabold text-slate-900 truncate">
                  {isAttendanceComplete ? 'Present' : isClockedIn ? 'Checked In' : 'Not Marked'}
                </p>
                <p className="mt-0.5 text-[11px] text-slate-500 font-mono">
                  {todayAttendance?.workingHours ? `${todayAttendance.workingHours}h logged` : '8h expected'}
                </p>
              </Link>

              {/* 2. Leave Balance KPI */}
              <Link
                href="/employee/leave"
                className="group rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs hover:border-emerald-200 hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Leave Balance</span>
                  <CalendarDays className="h-4 w-4 text-emerald-600 group-hover:scale-110 transition-transform" />
                </div>
                <p className="mt-2 text-xl font-black text-emerald-600">
                  {totalRemainingLeave} <span className="text-xs font-semibold text-slate-400">Days</span>
                </p>
                <p className="mt-0.5 text-[11px] text-slate-500 truncate">Available quota</p>
              </Link>

              {/* 3. Pending Leave KPI */}
              <Link
                href="/employee/leave"
                className="group rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs hover:border-amber-200 hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Pending Leave</span>
                  <CalendarDays className="h-4 w-4 text-amber-600 group-hover:scale-110 transition-transform" />
                </div>
                <p className="mt-2 text-xl font-black text-amber-600">{pendingLeaveCount}</p>
                <p className="mt-0.5 text-[11px] text-slate-500 truncate">Awaiting approval</p>
              </Link>

              {/* 4. Latest Payroll KPI */}
              <Link
                href="/employee/payroll"
                className="group rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs hover:border-indigo-200 hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Latest Payroll</span>
                  <CreditCard className="h-4 w-4 text-indigo-600 group-hover:scale-110 transition-transform" />
                </div>
                {latestPayroll?.netSalary !== undefined ? (
                  <>
                    <p className="mt-2 text-base font-black text-slate-900 font-mono truncate">
                      ₹{latestPayroll.netSalary.toLocaleString()}
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-500 truncate">{latestPayroll.payrollPeriod || 'Processed'}</p>
                  </>
                ) : (
                  <>
                    <p className="mt-2 text-xs font-extrabold text-slate-600 truncate">No records yet</p>
                    <p className="mt-0.5 text-[11px] text-slate-400">No payroll</p>
                  </>
                )}
              </Link>

              {/* 5. Unread Alerts KPI */}
              <Link
                href="/employee/notifications"
                className="group rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs hover:border-rose-200 hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Unread Alerts</span>
                  <Bell className="h-4 w-4 text-rose-500 group-hover:scale-110 transition-transform" />
                </div>
                <p className="mt-2 text-xl font-black text-rose-600">{unreadNotifCount}</p>
                <p className="mt-0.5 text-[11px] text-slate-500 truncate">
                  {unreadNotifCount === 0 ? "You're all caught up" : 'System notices'}
                </p>
              </Link>

              {/* 6. Open Tickets KPI */}
              <Link
                href="/employee/helpdesk"
                className="group rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs hover:border-indigo-200 hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Open Tickets</span>
                  <HelpCircle className="h-4 w-4 text-indigo-600 group-hover:scale-110 transition-transform" />
                </div>
                <p className="mt-2 text-xl font-black text-indigo-600">{helpdeskCounts.open}</p>
                <p className="mt-0.5 text-[11px] text-slate-500 truncate">
                  {helpdeskCounts.open === 0 ? 'No open support tickets' : 'Active HR requests'}
                </p>
              </Link>
            </div>

            {/* Quick Actions Bar */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-4 w-4 text-indigo-600" />
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-600">Quick Actions</h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                <Link
                  href="/employee/leave"
                  className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-100 bg-slate-50/70 text-xs font-bold text-slate-700 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 transition-all"
                >
                  <CalendarDays className="h-4 w-4 text-indigo-600 shrink-0" />
                  <span>Apply Leave</span>
                </Link>
                <Link
                  href="/employee/attendance"
                  className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-100 bg-slate-50/70 text-xs font-bold text-slate-700 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 transition-all"
                >
                  <Clock className="h-4 w-4 text-indigo-600 shrink-0" />
                  <span>View Attendance</span>
                </Link>
                <Link
                  href="/employee/payroll"
                  className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-100 bg-slate-50/70 text-xs font-bold text-slate-700 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 transition-all"
                >
                  <CreditCard className="h-4 w-4 text-indigo-600 shrink-0" />
                  <span>View Payslips</span>
                </Link>
                <Link
                  href="/employee/documents"
                  className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-100 bg-slate-50/70 text-xs font-bold text-slate-700 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 transition-all"
                >
                  <Folder className="h-4 w-4 text-indigo-600 shrink-0" />
                  <span>My Documents</span>
                </Link>
                <Link
                  href="/employee/helpdesk"
                  className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-100 bg-slate-50/70 text-xs font-bold text-slate-700 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 transition-all"
                >
                  <HelpCircle className="h-4 w-4 text-indigo-600 shrink-0" />
                  <span>Helpdesk Support</span>
                </Link>
                <Link
                  href="/employee/profile"
                  className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-100 bg-slate-50/70 text-xs font-bold text-slate-700 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 transition-all"
                >
                  <User className="h-4 w-4 text-indigo-600 shrink-0" />
                  <span>My Profile</span>
                </Link>
              </div>
            </div>

            {/* Main 2-Column Content Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column (8 cols): Leave Balance, Leave Requests, Payroll */}
              <div className="lg:col-span-8 space-y-6">
                {/* My Leave Balance */}
                <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-4">
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
                    <div className="py-8 text-center text-xs text-slate-400 space-y-1">
                      <CalendarDays className="h-8 w-8 text-slate-300 mx-auto" />
                      <p className="font-semibold text-slate-600">No leave quotas assigned yet.</p>
                      <p className="text-[11px] text-slate-400">Your leave balances will appear once allocated by HR.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      {Object.entries(leaveBalances).map(([key, cat]: [string, any]) => (
                        <div key={key} className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 text-xs space-y-1">
                          <span className="font-bold text-slate-800 truncate block">{cat.name || key}</span>
                          <p className="text-lg font-black text-indigo-600">
                            {cat.remaining} <span className="text-[10px] font-normal text-slate-400">Days</span>
                          </p>
                          <div className="flex justify-between text-[10px] text-slate-500 border-t border-slate-200/60 pt-1.5 mt-1">
                            <span>Quota: {cat.total}</span>
                            <span>Used: {cat.used}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Recent Leave Requests */}
                <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-4">
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
                      <p className="font-semibold text-slate-600">No leave requests found</p>
                      <p className="text-[11px] text-slate-400">Your submitted leave applications will appear here.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px]">
                            <th className="pb-2.5">Leave Type</th>
                            <th className="pb-2.5">Date Range</th>
                            <th className="pb-2.5">Duration</th>
                            <th className="pb-2.5">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium">
                          {leaveRequests.slice(0, 5).map((req) => (
                            <tr key={req._id || req.id} className="hover:bg-slate-50/60">
                              <td className="py-3 font-bold text-slate-900">{req.leaveType}</td>
                              <td className="py-3 text-slate-600">
                                {req.startDate} to {req.endDate}
                              </td>
                              <td className="py-3 text-indigo-600 font-bold">{req.durationDays} Days</td>
                              <td className="py-3">
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

                {/* Latest Payroll Summary */}
                <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-indigo-600" />
                      <span>Payroll Summary</span>
                    </h3>
                    <Link href="/employee/payroll" className="text-xs font-bold text-indigo-600 hover:text-indigo-800">
                      View Payroll →
                    </Link>
                  </div>

                  {latestPayroll ? (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl border border-slate-100 bg-slate-50/60 p-4 text-xs">
                      <div>
                        <span className="font-bold text-slate-900 text-sm">
                          Period: {latestPayroll.payrollPeriod || latestPayroll.month || 'Current'}
                        </span>
                        <p className="text-slate-500 mt-0.5">
                          Status: <strong className="text-emerald-600">{latestPayroll.status || 'PAID'}</strong>
                        </p>
                      </div>
                      <div className="text-right font-mono">
                        <span className="text-slate-400 block text-[10px]">Net Payout Amount</span>
                        <span className="text-xl font-extrabold text-emerald-600">
                          ₹{(latestPayroll.netSalary || 0).toLocaleString()}
                        </span>
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
                {/* Recent Notifications */}
                <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-4">
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
                                item.status === 'READ' ? 'bg-slate-100 text-slate-500' : 'bg-rose-50 text-rose-700 border border-rose-200'
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

                {/* Support Tickets */}
                <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-4">
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
