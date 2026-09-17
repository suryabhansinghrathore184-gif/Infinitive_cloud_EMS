'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Clock, RefreshCw, CalendarCheck, CheckCircle2, AlertCircle, Filter } from 'lucide-react';

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
  remarks?: string;
}

export default function EmployeeAttendancePage() {
  const [logs, setLogs] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isClocking, setIsClocking] = useState(false);
  const [filterMonth, setFilterMonth] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchAttendance = useCallback(async () => {
    setIsLoading(true);
    try {
      const url = filterMonth ? `/api/v1/attendance?month=${filterMonth}` : '/api/v1/attendance';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setLogs(data.data || []);
        }
      }
    } catch (err) {
      console.error('Error fetching personal attendance logs:', err);
    } finally {
      setIsLoading(false);
    }
  }, [filterMonth]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayRecord = logs.find((rec) => rec.date === todayStr || rec.date?.startsWith(todayStr)) || logs[0];
  const isClockedIn = todayRecord?.checkIn && !todayRecord?.checkOut;

  const handleClockToggle = async () => {
    setIsClocking(true);
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
            ? 'Clock-in recorded successfully!'
            : 'Clock-out recorded successfully!'
        );
        fetchAttendance();
      } else {
        showToast(data.message || 'Clock action failed.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error communicating with attendance service.', 'error');
    } finally {
      setIsClocking(false);
    }
  };

  return (
    <AuthGuard allowedRoles={['EMPLOYEE', 'SUPER_ADMIN', 'ADMIN', 'HR', 'MANAGER']}>
      <AdminLayout
        allowedRoles={['EMPLOYEE', 'SUPER_ADMIN', 'ADMIN', 'HR', 'MANAGER']}
        pageTitle="My Attendance"
        breadcrumbs={[
          { label: 'My Workspace', href: '/employee/dashboard' },
          { label: 'Attendance', href: '/employee/attendance' },
        ]}
      >
        {/* Toast */}
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
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">My Attendance & Working Hours</h1>
              <p className="text-xs text-slate-500 mt-1">
                Record your daily attendance clock-ins, clock-outs, and review personal monthly history logs.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleClockToggle}
                disabled={isClocking}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold text-white shadow-md transition-all cursor-pointer ${
                  isClockedIn ? 'bg-rose-600 hover:bg-rose-500' : 'bg-indigo-600 hover:bg-indigo-500'
                }`}
              >
                <Clock className="h-4 w-4" />
                <span>{isClocking ? 'Recording...' : isClockedIn ? 'Clock Out Now' : 'Clock In Now'}</span>
              </button>
              <button
                onClick={fetchAttendance}
                disabled={isLoading}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* Today Summary Banner */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                <CalendarCheck className="h-6 w-6" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Today ({todayStr})</span>
                <h3 className="text-base font-extrabold text-slate-900">
                  Status: <span className="text-indigo-600">{todayRecord?.status || (todayRecord?.checkIn ? 'Present' : 'Not Clocked In')}</span>
                </h3>
              </div>
            </div>
            <div className="flex items-center gap-6 text-xs font-mono text-slate-600">
              <div>
                <span className="text-[10px] text-slate-400 block font-sans">Check In</span>
                <span className="font-bold text-slate-900">{todayRecord?.checkIn || todayRecord?.clockIn || '--:--'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-sans">Check Out</span>
                <span className="font-bold text-slate-900">{todayRecord?.checkOut || todayRecord?.clockOut || '--:--'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-sans">Working Hours</span>
                <span className="font-bold text-emerald-600">{todayRecord?.workingHours ? `${todayRecord.workingHours} hrs` : '--'}</span>
              </div>
            </div>
          </div>

          {/* Attendance History Table */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
            <div className="border-b border-slate-100 p-4 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Attendance Log History</h3>
              <div className="flex items-center gap-2">
                <Filter className="h-3.5 w-3.5 text-slate-400" />
                <input
                  type="month"
                  value={filterMonth}
                  onChange={(e) => setFilterMonth(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700"
                />
              </div>
            </div>

            {isLoading ? (
              <div className="p-12 text-center text-xs text-slate-500">
                <RefreshCw className="h-5 w-5 animate-spin text-indigo-600 mx-auto mb-2" />
                <span>Loading personal attendance log...</span>
              </div>
            ) : logs.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-500">
                No attendance records found for your account.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4">Date</th>
                      <th className="py-3.5 px-4">Check In</th>
                      <th className="py-3.5 px-4">Check Out</th>
                      <th className="py-3.5 px-4">Hours Worked</th>
                      <th className="py-3.5 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {logs.map((rec) => (
                      <tr key={rec._id || rec.id} className="hover:bg-slate-50/80">
                        <td className="py-3.5 px-4 font-semibold text-slate-900">{rec.date}</td>
                        <td className="py-3.5 px-4 font-mono">{rec.checkIn || rec.clockIn || '--:--'}</td>
                        <td className="py-3.5 px-4 font-mono">{rec.checkOut || rec.clockOut || '--:--'}</td>
                        <td className="py-3.5 px-4 font-mono text-indigo-600">{rec.workingHours ? `${rec.workingHours} hrs` : '--'}</td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                              rec.status === 'Present' || rec.status === 'PRESENT'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : rec.status === 'Late' || rec.status === 'LATE'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {rec.status || 'Present'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </AdminLayout>
    </AuthGuard>
  );
}
