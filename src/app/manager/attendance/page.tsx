'use client';

import React, { useState, useEffect } from 'react';
import { Clock, RefreshCw, Calendar, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

export default function ManagerAttendancePage() {
  const [attendance, setAttendance] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const fetchAttendance = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/v1/attendance?date=${date}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setAttendance(data.data || []);
        }
      }
    } catch (err) {
      console.error('Error fetching team attendance:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [date]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Team Attendance</h1>
          <p className="text-sm text-slate-500 mt-1">Monitor daily attendance, check-ins, and working hours for direct reports.</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:border-indigo-500 focus:outline-hidden"
          />
          <button
            onClick={fetchAttendance}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition-all cursor-pointer"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-500">
            <RefreshCw className="h-5 w-5 animate-spin text-indigo-600 mx-auto mb-2" />
            <span>Loading team attendance records...</span>
          </div>
        ) : attendance.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            No attendance records found for selected date ({date}).
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Employee</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Clock In</th>
                  <th className="py-3.5 px-4">Clock Out</th>
                  <th className="py-3.5 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {attendance.map((rec) => (
                  <tr key={rec._id || rec.id} className="hover:bg-slate-50/80">
                    <td className="py-3.5 px-4 font-semibold text-slate-900">{rec.employeeName || rec.employeeId}</td>
                    <td className="py-3.5 px-4">{rec.date}</td>
                    <td className="py-3.5 px-4 font-mono">{rec.checkIn || rec.clockIn || '--:--'}</td>
                    <td className="py-3.5 px-4 font-mono">{rec.checkOut || rec.clockOut || '--:--'}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          rec.status === 'Present' || rec.status === 'PRESENT'
                            ? 'bg-emerald-50 text-emerald-700'
                            : rec.status === 'Late'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-rose-50 text-rose-700'
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
  );
}
