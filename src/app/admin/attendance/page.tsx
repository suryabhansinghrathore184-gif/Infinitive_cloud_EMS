'use client';

import React, { useState } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { useEmsStore } from '@/store/emsStore';
import { Clock, CheckCircle2, XCircle, Calendar, Download, Filter, UserX } from 'lucide-react';

export default function AttendancePage() {
  const { state } = useEmsStore();
  const [statusFilter, setStatusFilter] = useState('All');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const records = state.attendance;

  const presentCount = records.filter((r) => r.status === 'Present').length;
  const absentCount = records.filter((r) => r.status === 'Absent').length;
  const lateCount = records.filter((r) => r.status === 'Late').length;
  const onLeaveCount = records.filter((r) => r.status === 'On Leave').length;
  const total = records.length;

  const filteredRecords = records.filter(
    (rec) => statusFilter === 'All' || rec.status === statusFilter
  );

  return (
    <AdminLayout
      pageTitle="Attendance Management"
      breadcrumbs={[{ label: 'Attendance', href: '/admin/attendance' }]}
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed right-6 top-20 z-50 flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs text-white shadow-xl">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
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

        <button
          onClick={() => showToast('Exporting attendance log...')}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-md hover:bg-blue-700"
        >
          <Download className="h-4 w-4" />
          <span>Export Monthly Log</span>
        </button>
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

      {/* Filter Bar */}
      <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700 focus:border-blue-500 focus:outline-none"
          >
            <option value="All">All Attendance Statuses</option>
            <option value="Present">Present</option>
            <option value="Late">Late</option>
            <option value="On Leave">On Leave</option>
            <option value="Work From Home">Work From Home</option>
          </select>
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
            <h4 className="mt-3 text-sm font-bold text-slate-800">No attendance data yet</h4>
            <p className="mt-1 max-w-xs text-xs text-slate-500">
              Employee check-in logs, biometric punches, and manual corrections will display here.
            </p>
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-slate-500 font-semibold">
                <th className="px-4 py-3.5">Employee</th>
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
                      <img src={rec.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80'} alt={rec.employeeName} className="h-8 w-8 rounded-full object-cover" />
                      <div>
                        <p className="font-bold text-slate-900">{rec.employeeName}</p>
                        <p className="text-[10px] text-slate-400">{rec.employeeId}</p>
                      </div>
                    </div>
                  </td>
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
    </AdminLayout>
  );
}
