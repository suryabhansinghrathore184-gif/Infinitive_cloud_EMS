'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { AdminLayout } from '@/components/layout/AdminLayout';
import Link from 'next/link';
import {
  Clock,
  RefreshCw,
  CalendarCheck,
  CheckCircle2,
  AlertCircle,
  Filter,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
  HelpCircle,
  Calendar,
  UserCheck,
  AlertTriangle,
  RotateCcw,
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
  workingHours?: number | string;
  method?: string;
  location?: string;
}

export default function EmployeeAttendancePage() {
  const [logs, setLogs] = useState<AttendanceRecord[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(15);

  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [isClocking, setIsClocking] = useState(false);

  // Filters
  const [filterMonth, setFilterMonth] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');

  // Modals & Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchAttendance = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const params = new URLSearchParams();
      if (filterMonth) params.append('month', filterMonth);
      if (filterStatus && filterStatus !== 'All') params.append('status', filterStatus);
      params.append('page', String(currentPage));
      params.append('limit', String(pageSize));

      const res = await fetch(`/api/v1/attendance?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setLogs(data.data || []);
          setTotalRecords(data.total || data.data?.length || 0);
          setTotalPages(data.totalPages || 1);
        } else {
          setIsError(true);
        }
      } else {
        setIsError(true);
      }
    } catch (err) {
      console.error('Error fetching personal attendance logs:', err);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, [filterMonth, filterStatus, currentPage, pageSize]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  // Determine Today's Attendance State
  const todayStr = new Date().toISOString().split('T')[0];
  const todayRecord = logs.find((rec) => rec.date === todayStr || rec.date?.startsWith(todayStr));

  const hasCheckIn = Boolean(todayRecord?.checkIn || todayRecord?.clockIn);
  const hasCheckOut = Boolean(todayRecord?.checkOut || todayRecord?.clockOut);

  const isCheckedIn = hasCheckIn && !hasCheckOut;
  const isCheckedOut = hasCheckIn && hasCheckOut;
  const isNotMarked = !hasCheckIn;

  // Monthly summary metrics calculated from fetched logs
  const summaryMetrics = useMemo(() => {
    let present = 0;
    let late = 0;
    let absent = 0;
    let totalHours = 0;

    logs.forEach((rec) => {
      const st = (rec.status || '').toUpperCase();
      if (st === 'PRESENT' || st === 'CHECKED OUT') present += 1;
      if (st === 'LATE') late += 1;
      if (st === 'ABSENT') absent += 1;

      if (rec.workingHours) {
        const hrs = typeof rec.workingHours === 'number' ? rec.workingHours : parseFloat(String(rec.workingHours));
        if (!isNaN(hrs)) totalHours += hrs;
      }
    });

    return {
      presentDays: present,
      lateDays: late,
      absentDays: absent,
      totalHours: Math.round(totalHours * 10) / 10,
    };
  }, [logs]);

  // Handle Clock-In / Clock-Out toggle
  const handleClockToggle = async () => {
    if (isCheckedOut || isClocking) return;

    setIsClocking(true);
    const action = isCheckedIn ? 'CLOCK_OUT' : 'CLOCK_IN';

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
            ? 'Attendance checked in successfully.'
            : 'Attendance checked out successfully.'
        );
        fetchAttendance();
      } else {
        showToast(data.message || 'Unable to update attendance. Please try again.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Unable to update attendance. Please try again.', 'error');
    } finally {
      setIsClocking(false);
    }
  };

  const handleResetFilters = () => {
    setFilterMonth('');
    setFilterStatus('All');
    setCurrentPage(1);
  };

  const getStatusBadge = (status?: string) => {
    const st = (status || 'Present').toUpperCase();
    if (st === 'PRESENT') {
      return <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">Present</span>;
    }
    if (st === 'LATE') {
      return <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200">Late</span>;
    }
    if (st === 'ABSENT') {
      return <span className="rounded-full bg-rose-50 px-2.5 py-0.5 text-[10px] font-bold text-rose-700 border border-rose-200">Absent</span>;
    }
    if (st === 'LEAVE') {
      return <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold text-blue-700 border border-blue-200">Leave</span>;
    }
    return <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-600 border border-slate-200">{status || 'Incomplete'}</span>;
  };

  return (
    <AuthGuard allowedRoles={['EMPLOYEE', 'SUPER_ADMIN', 'ADMIN', 'HR', 'MANAGER']}>
      <AdminLayout
        allowedRoles={['EMPLOYEE', 'SUPER_ADMIN', 'ADMIN', 'HR', 'MANAGER']}
        pageTitle="Attendance"
        breadcrumbs={[
          { label: 'My Workspace', href: '/employee/dashboard' },
          { label: 'Attendance', href: '/employee/attendance' },
        ]}
      >
        {/* Toast Alert */}
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

        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-slate-950">Attendance</h1>
              <p className="text-xs font-medium text-slate-500 mt-0.5">
                Track your working hours and attendance history.
              </p>
            </div>
            <button
              onClick={fetchAttendance}
              disabled={isLoading}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 disabled:opacity-50 transition-all cursor-pointer"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh Data</span>
            </button>
          </div>

          {/* Global Error State */}
          {isError && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-4 text-xs text-rose-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                <span>Unable to load attendance. Please check your connection.</span>
              </div>
              <button
                onClick={fetchAttendance}
                className="rounded-xl bg-rose-600 px-3 py-1.5 font-bold text-white shadow-xs hover:bg-rose-700 transition-all cursor-pointer"
              >
                Retry
              </button>
            </div>
          )}

          {/* Pulse Skeleton Loading State */}
          {isLoading ? (
            <div className="space-y-6 animate-pulse">
              <div className="h-32 w-full rounded-2xl bg-slate-200/80"></div>
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-24 rounded-xl bg-slate-200/80"></div>
                ))}
              </div>
              <div className="h-64 rounded-2xl bg-slate-200/80"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Today's Attendance Section */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-5">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                    <CalendarCheck className="h-6 w-6" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Today ({todayStr})</span>
                    <h2 className="text-base font-extrabold text-slate-900">
                      Status:{' '}
                      <span className={isCheckedOut ? 'text-slate-600' : isCheckedIn ? 'text-emerald-600' : 'text-amber-600'}>
                        {isCheckedOut ? 'Checked Out' : isCheckedIn ? 'Checked In' : 'Not Marked'}
                      </span>
                    </h2>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center text-xs font-mono">
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 min-w-[90px]">
                    <span className="text-[10px] text-slate-400 font-sans block">Clock In</span>
                    <span className="font-bold text-slate-900">{todayRecord?.checkIn || todayRecord?.clockIn || '--:--'}</span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 min-w-[90px]">
                    <span className="text-[10px] text-slate-400 font-sans block">Clock Out</span>
                    <span className="font-bold text-slate-900">{todayRecord?.checkOut || todayRecord?.clockOut || '--:--'}</span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 min-w-[90px]">
                    <span className="text-[10px] text-slate-400 font-sans block">Working Hours</span>
                    <span className="font-bold text-indigo-600">
                      {todayRecord?.workingHours ? `${todayRecord.workingHours} hrs` : '--'}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleClockToggle}
                  disabled={isClocking || isCheckedOut}
                  className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold shadow-xs transition-all shrink-0 ${
                    isCheckedOut
                      ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                      : isCheckedIn
                      ? 'bg-rose-600 hover:bg-rose-500 text-white cursor-pointer'
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer'
                  }`}
                >
                  <Clock className="h-4 w-4" />
                  <span>
                    {isClocking
                      ? 'Checking In...'
                      : isCheckedOut
                      ? 'Attendance Complete'
                      : isCheckedIn
                      ? 'Check Out'
                      : 'Check In'}
                  </span>
                </button>
              </div>

              {/* Monthly Summary Cards */}
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Present Days</span>
                    <UserCheck className="h-4 w-4 text-emerald-600" />
                  </div>
                  <p className="mt-2 text-xl font-black text-emerald-600">{summaryMetrics.presentDays}</p>
                  <p className="mt-0.5 text-[10px] text-slate-400">Current log period</p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Late Days</span>
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                  </div>
                  <p className="mt-2 text-xl font-black text-amber-600">{summaryMetrics.lateDays}</p>
                  <p className="mt-0.5 text-[10px] text-slate-400">Past grace period</p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Absent Days</span>
                    <AlertCircle className="h-4 w-4 text-rose-600" />
                  </div>
                  <p className="mt-2 text-xl font-black text-rose-600">{summaryMetrics.absentDays}</p>
                  <p className="mt-0.5 text-[10px] text-slate-400">Unexcused absence</p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Working Hours</span>
                    <Clock className="h-4 w-4 text-indigo-600" />
                  </div>
                  <p className="mt-2 text-xl font-black text-indigo-600">{summaryMetrics.totalHours} <span className="text-xs font-semibold text-slate-400">hrs</span></p>
                  <p className="mt-0.5 text-[10px] text-slate-400">Total logged</p>
                </div>
              </div>

              {/* Attendance History Section */}
              <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden space-y-0">
                {/* Filter Bar */}
                <div className="border-b border-slate-100 p-4 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50">
                  <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-indigo-600" />
                    <span>Attendance History</span>
                  </h3>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2.5 py-1 text-xs">
                      <Filter className="h-3.5 w-3.5 text-slate-400" />
                      <input
                        type="month"
                        value={filterMonth}
                        onChange={(e) => {
                          setFilterMonth(e.target.value);
                          setCurrentPage(1);
                        }}
                        className="bg-transparent font-semibold text-slate-700 outline-none"
                      />
                    </div>

                    <select
                      value={filterStatus}
                      onChange={(e) => {
                        setFilterStatus(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 outline-none"
                    >
                      <option value="All">All Statuses</option>
                      <option value="Present">Present</option>
                      <option value="Late">Late</option>
                      <option value="Absent">Absent</option>
                      <option value="Leave">Leave</option>
                    </select>

                    {(filterMonth || filterStatus !== 'All') && (
                      <button
                        onClick={handleResetFilters}
                        className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-200"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        <span>Reset</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* History Table */}
                {logs.length === 0 ? (
                  <div className="p-12 text-center text-xs text-slate-400 space-y-2">
                    <CalendarCheck className="h-10 w-10 text-slate-300 mx-auto" />
                    <p className="font-bold text-slate-700 text-sm">No attendance records yet</p>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      Your attendance history will appear here after your first attendance entry.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-600">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[10px]">
                        <tr>
                          <th className="py-3.5 px-4">Date</th>
                          <th className="py-3.5 px-4">Day</th>
                          <th className="py-3.5 px-4">Clock In</th>
                          <th className="py-3.5 px-4">Clock Out</th>
                          <th className="py-3.5 px-4">Working Hours</th>
                          <th className="py-3.5 px-4">Status</th>
                          <th className="py-3.5 px-4 text-right">Details</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {logs.map((rec) => {
                          const dateObj = rec.date ? new Date(rec.date) : null;
                          const dayName = dateObj && !isNaN(dateObj.getTime())
                            ? dateObj.toLocaleDateString('en-US', { weekday: 'short' })
                            : '--';

                          return (
                            <tr key={rec._id || rec.id} className="hover:bg-slate-50/80 transition-colors">
                              <td className="py-3.5 px-4 font-bold text-slate-900">{rec.date}</td>
                              <td className="py-3.5 px-4 text-slate-500 font-semibold">{dayName}</td>
                              <td className="py-3.5 px-4 font-mono text-slate-800">{rec.checkIn || rec.clockIn || '--:--'}</td>
                              <td className="py-3.5 px-4 font-mono text-slate-800">{rec.checkOut || rec.clockOut || '--:--'}</td>
                              <td className="py-3.5 px-4 font-mono font-bold text-indigo-600">
                                {rec.workingHours ? `${rec.workingHours} hrs` : '--'}
                              </td>
                              <td className="py-3.5 px-4">{getStatusBadge(rec.status)}</td>
                              <td className="py-3.5 px-4 text-right">
                                <button
                                  onClick={() => setSelectedRecord(rec)}
                                  className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                  <span>View</span>
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Pagination Footer */}
                {totalRecords > 0 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200 bg-slate-50/50 px-4 py-3 text-xs text-slate-500">
                    <div>
                      Showing <span className="font-bold text-slate-800">{logs.length}</span> of{' '}
                      <span className="font-bold text-slate-800">{totalRecords}</span> attendance entries
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        disabled={currentPage <= 1}
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 font-semibold text-slate-700 disabled:opacity-40 cursor-pointer"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        <span>Previous</span>
                      </button>
                      <span className="px-2 font-medium text-slate-700">
                        Page {currentPage} of {totalPages}
                      </span>
                      <button
                        disabled={currentPage >= totalPages}
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 font-semibold text-slate-700 disabled:opacity-40 cursor-pointer"
                      >
                        <span>Next</span>
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Attendance Details Modal */}
          {selectedRecord && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
              <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4 animate-fade-in text-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2 font-extrabold text-sm text-slate-900">
                    <CalendarCheck className="h-4 w-4 text-indigo-600" />
                    <span>Attendance Record ({selectedRecord.date})</span>
                  </div>
                  <button onClick={() => setSelectedRecord(null)} className="text-slate-400 hover:text-slate-700 p-1">
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-3 rounded-xl bg-slate-50 p-4 text-xs font-medium text-slate-700 border border-slate-100">
                  <div className="flex justify-between border-b border-slate-200/60 pb-2">
                    <span className="text-slate-400">Date:</span>
                    <span className="font-bold text-slate-900">{selectedRecord.date}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200/60 pb-2">
                    <span className="text-slate-400">Clock In Time:</span>
                    <span className="font-bold text-slate-900 font-mono">{selectedRecord.checkIn || selectedRecord.clockIn || '--:--'}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200/60 pb-2">
                    <span className="text-slate-400">Clock Out Time:</span>
                    <span className="font-bold text-slate-900 font-mono">{selectedRecord.checkOut || selectedRecord.clockOut || '--:--'}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200/60 pb-2">
                    <span className="text-slate-400">Total Hours:</span>
                    <span className="font-bold text-indigo-600 font-mono">{selectedRecord.workingHours ? `${selectedRecord.workingHours} hrs` : '--'}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200/60 pb-2">
                    <span className="text-slate-400">Method / Location:</span>
                    <span className="font-bold text-slate-900">{selectedRecord.method || 'Web'} • {selectedRecord.location || 'Office HQ'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Attendance Status:</span>
                    <span>{getStatusBadge(selectedRecord.status)}</span>
                  </div>
                </div>

                {/* Helpdesk Correction Prompt */}
                <div className="rounded-xl border border-indigo-100 bg-indigo-50/70 p-3 flex items-center justify-between text-indigo-900">
                  <div className="flex items-center gap-2">
                    <HelpCircle className="h-4 w-4 text-indigo-600 shrink-0" />
                    <span className="font-semibold text-[11px]">Need to correct attendance?</span>
                  </div>
                  <Link
                    href="/employee/helpdesk"
                    className="font-bold text-xs text-indigo-700 hover:text-indigo-900 underline"
                  >
                    Contact HR →
                  </Link>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => setSelectedRecord(null)}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </AdminLayout>
    </AuthGuard>
  );
}
