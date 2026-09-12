'use client';

import React, { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { useEmsStore } from '@/store/emsStore';
import { Clock, CheckCircle2, XCircle, Calendar, Download, Filter, UserX, Plus, Loader2 } from 'lucide-react';
import { MarkAttendanceModal } from '@/components/modals/MarkAttendanceModal';
import { AttendanceRecord } from '@/types/admin';

export default function AttendancePage() {
  const { state, addAttendanceRecord } = useEmsStore();

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
  const todayStr = now.toISOString().split('T')[0];
  const firstDayOfMonth = `${currentYear}-${currentMonth}-01`;

  const [statusFilter, setStatusFilter] = useState('All');
  const [fromDate, setFromDate] = useState(firstDayOfMonth);
  const [toDate, setToDate] = useState(todayStr);

  const [isMarkModalOpen, setIsMarkModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  const [liveAttendance, setLiveAttendance] = useState<AttendanceRecord[] | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchLiveAttendance = async () => {
    try {
      const res = await fetch('/api/v1/attendance');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setLiveAttendance(data.data);
      }
    } catch (e) {
      console.error('Failed to load attendance records from API', e);
    }
  };

  useEffect(() => {
    fetchLiveAttendance();
  }, []);

  const records = liveAttendance || state.attendance || [];

  const presentCount = records.filter((r) => r.status === 'Present').length;
  const absentCount = records.filter((r) => r.status === 'Absent').length;
  const lateCount = records.filter((r) => r.status === 'Late').length;
  const onLeaveCount = records.filter((r) => r.status === 'On Leave').length;
  const total = records.length;

  const filteredRecords = records.filter((rec) => {
    const matchStatus = statusFilter === 'All' || rec.status === statusFilter;
    const matchFrom = !fromDate || rec.date >= fromDate;
    const matchTo = !toDate || rec.date <= toDate;
    return matchStatus && matchFrom && matchTo;
  });

  const handleExportLog = async () => {
    if (isExporting) return;
    setIsExporting(true);

    try {
      const queryParams = new URLSearchParams();
      if (statusFilter && statusFilter !== 'All') queryParams.set('status', statusFilter);
      if (fromDate) queryParams.set('from', fromDate);
      if (toDate) queryParams.set('to', toDate);

      const res = await fetch(`/api/v1/attendance/export?${queryParams.toString()}`);

      if (res.ok && res.headers.get('content-type')?.includes('text/csv')) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `attendance-log-${todayStr}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);

        showToast('Attendance log exported successfully.', 'success');
      } else {
        const errorData = await res.json().catch(() => ({}));
        showToast(errorData.message || 'No attendance records found for the selected filters.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Unable to export attendance log. Please try again.', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleSaveAttendance = async (rec: Omit<AttendanceRecord, 'id' | 'workingHours'>) => {
    try {
      const res = await fetch('/api/v1/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rec),
      });
      const data = await res.json();
      if (data.success) {
        addAttendanceRecord(rec);
        fetchLiveAttendance();
        showToast(`Attendance marked for ${rec.employeeName} (${rec.status})`, 'success');
      } else {
        showToast(data.message || 'Failed to mark attendance', 'error');
      }
    } catch (e: any) {
      addAttendanceRecord(rec);
      showToast(`Attendance marked for ${rec.employeeName} (${rec.status})`, 'success');
    }
  };

  return (
    <AdminLayout
      pageTitle="Attendance Management"
      breadcrumbs={[{ label: 'Attendance', href: '/admin/attendance' }]}
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed right-6 top-20 z-50 flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs text-white shadow-xl border ${
            toastType === 'success' ? 'bg-slate-900 border-slate-700' : 'bg-rose-900 border-rose-700'
          }`}
        >
          {toastType === 'success' ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          ) : (
            <XCircle className="h-4 w-4 text-rose-400" />
          )}
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Attendance Monitoring</h2>
          <p className="text-xs text-slate-500">
            Track daily employee punches, working hours, breaks, and attendance corrections
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMarkModalOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-md hover:bg-blue-700 active:scale-95 transition"
          >
            <Plus className="h-4 w-4" />
            <span>Mark Attendance</span>
          </button>

          <button
            onClick={handleExportLog}
            disabled={isExporting}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60 transition"
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
            ) : (
              <Download className="h-4 w-4 text-slate-500" />
            )}
            <span>{isExporting ? 'Exporting...' : 'Export Log'}</span>
          </button>
        </div>
      </div>

      {/* Stats Summary Grid (Dynamically Computed) */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>PRESENT</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="mt-2 text-2xl font-extrabold text-slate-900">{presentCount}</p>
          <span className="text-[10px] text-emerald-600 font-semibold">
            {total > 0 ? ((presentCount / total) * 100).toFixed(1) : '0.0'}% turnout
          </span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>ABSENT</span>
            <XCircle className="h-4 w-4 text-rose-600" />
          </div>
          <p className="mt-2 text-2xl font-extrabold text-slate-900">{absentCount}</p>
          <span className="text-[10px] text-rose-600 font-semibold">
            {total > 0 ? ((absentCount / total) * 100).toFixed(1) : '0.0'}% absent
          </span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>LATE ARRIVALS</span>
            <Clock className="h-4 w-4 text-amber-600" />
          </div>
          <p className="mt-2 text-2xl font-extrabold text-slate-900">{lateCount}</p>
          <span className="text-[10px] text-amber-600 font-semibold">
            {total > 0 ? ((lateCount / total) * 100).toFixed(1) : '0.0'}% late
          </span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>ON LEAVE</span>
            <Calendar className="h-4 w-4 text-blue-600" />
          </div>
          <p className="mt-2 text-2xl font-extrabold text-slate-900">{onLeaveCount}</p>
          <span className="text-[10px] text-blue-600 font-semibold">
            {total > 0 ? ((onLeaveCount / total) * 100).toFixed(1) : '0.0'}% on leave
          </span>
        </div>
      </div>

      {/* Filter Bar with Status & Professional Date Range Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700 focus:border-blue-500 focus:outline-none font-medium"
            >
              <option value="All">All Attendance Statuses</option>
              <option value="Present">Present</option>
              <option value="Late">Late</option>
              <option value="Absent">Absent</option>
              <option value="On Leave">On Leave</option>
              <option value="Work From Home">Work From Home</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <span className="font-semibold text-slate-500">From:</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-700 focus:border-blue-500 focus:outline-none"
            />
            <span className="font-semibold text-slate-500">To:</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-700 focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        <span className="text-xs text-slate-500">Working Hours = (Check-out - Check-in) - Break</span>
      </div>

      {/* Table vs Empty State */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {filteredRecords.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <UserX className="h-6 w-6" />
            </div>
            <h4 className="mt-3 text-sm font-bold text-slate-800">No attendance data found</h4>
            <p className="mt-1 max-w-xs text-xs text-slate-500">
              Adjust filters or click &quot;+ Mark Attendance&quot; above to log employee check-in, biometric punches, or attendance records.
            </p>
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-slate-500 font-semibold">
                <th className="px-4 py-3.5">Employee</th>
                <th className="px-4 py-3.5">Date</th>
                <th className="px-4 py-3.5">Check-In</th>
                <th className="px-4 py-3.5">Check-Out</th>
                <th className="px-4 py-3.5">Break</th>
                <th className="px-4 py-3.5">Working Hours</th>
                <th className="px-4 py-3.5">Method</th>
                <th className="px-4 py-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.map((rec) => (
                <tr key={rec.id} className="hover:bg-slate-50/60">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <img
                        src={rec.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80'}
                        alt={rec.employeeName}
                        className="h-8 w-8 rounded-full object-cover"
                      />
                      <div>
                        <p className="font-bold text-slate-900">{rec.employeeName}</p>
                        <p className="text-[10px] text-slate-400">{rec.employeeId}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-slate-700">{rec.date}</td>
                  <td className="px-4 py-3.5 font-semibold text-slate-800">{rec.checkIn}</td>
                  <td className="px-4 py-3.5 font-semibold text-slate-800">{rec.checkOut}</td>
                  <td className="px-4 py-3.5 text-slate-500">{rec.breakDuration}</td>
                  <td className="px-4 py-3.5 font-bold text-blue-600">{rec.workingHours}</td>
                  <td className="px-4 py-3.5">
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 border border-slate-200">
                      {rec.method}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200">
                      {rec.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <MarkAttendanceModal
        isOpen={isMarkModalOpen}
        onClose={() => setIsMarkModalOpen(false)}
        employees={state.employees}
        onSave={handleSaveAttendance}
      />
    </AdminLayout>
  );
}
