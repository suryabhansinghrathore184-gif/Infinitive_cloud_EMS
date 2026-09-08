'use client';

import React, { useState } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { mockAttendanceRecords } from '@/data/attendance';
import { AttendanceRecord } from '@/types/admin';
import { Clock, CheckCircle2, XCircle, Calendar, Download, Filter } from 'lucide-react';

export default function AttendancePage() {
  const [records, setRecords] = useState<AttendanceRecord[]>(mockAttendanceRecords);
  const [statusFilter, setStatusFilter] = useState('All');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

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
          onClick={() => showToast('Exporting attendance report...')}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-md hover:bg-blue-700"
        >
          <Download className="h-4 w-4" />
          <span>Export Monthly Log</span>
        </button>
      </div>

      {/* Stats Summary Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>PRESENT</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="mt-2 text-2xl font-extrabold text-slate-900">1,086</p>
          <span className="text-[10px] text-emerald-600 font-semibold">87.0% turnout</span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>ABSENT</span>
            <XCircle className="h-4 w-4 text-rose-600" />
          </div>
          <p className="mt-2 text-2xl font-extrabold text-slate-900">72</p>
          <span className="text-[10px] text-rose-600 font-semibold">5.7% absent</span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>LATE ARRIVALS</span>
            <Clock className="h-4 w-4 text-amber-600" />
          </div>
          <p className="mt-2 text-2xl font-extrabold text-slate-900">54</p>
          <span className="text-[10px] text-amber-600 font-semibold">4.3% late</span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>ON LEAVE</span>
            <Calendar className="h-4 w-4 text-blue-600" />
          </div>
          <p className="mt-2 text-2xl font-extrabold text-slate-900">36</p>
          <span className="text-[10px] text-blue-600 font-semibold">2.9% on leave</span>
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

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
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
                    <img src={rec.avatar} alt={rec.employeeName} className="h-8 w-8 rounded-full object-cover" />
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
      </div>
    </AdminLayout>
  );
}
