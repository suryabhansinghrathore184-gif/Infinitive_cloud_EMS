'use client';

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useEmsStore } from '@/store/emsStore';
import { Clock, CheckCircle2, XCircle, Calendar, UserX } from 'lucide-react';

const COLORS = {
  present: '#10b981',
  absent: '#f43f5e',
  late: '#f59e0b',
  onLeave: '#3b82f6',
};

export const AttendanceOverview: React.FC = () => {
  const { state, totalEmployeesCount } = useEmsStore();

  const presentCount = state.attendance.filter((a) => a.status === 'Present').length;
  const absentCount = state.attendance.filter((a) => a.status === 'Absent').length;
  const lateCount = state.attendance.filter((a) => a.status === 'Late').length;
  const onLeaveCount = state.attendance.filter((a) => a.status === 'On Leave').length;

  const total = totalEmployeesCount > 0 ? totalEmployeesCount : state.attendance.length;
  const presentPercentage = total > 0 ? ((presentCount / total) * 100).toFixed(1) : '0.0';

  const data = [
    { name: 'Present', value: presentCount, color: COLORS.present },
    { name: 'Absent', value: absentCount, color: COLORS.absent },
    { name: 'Late', value: lateCount, color: COLORS.late },
    { name: 'On Leave', value: onLeaveCount, color: COLORS.onLeave },
  ];

  const hasAnyData = total > 0 && (presentCount > 0 || absentCount > 0 || lateCount > 0 || onLeaveCount > 0);

  return (
    <div className="flex h-full w-full flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      {/* Card Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900">Today&apos;s Attendance</h3>
          <p className="text-xs text-slate-500">Live breakdown of workforce status</p>
        </div>
        <div className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
          {presentPercentage}% Turnout
        </div>
      </div>

      {/* Main Content: Chart & Stats */}
      {!hasAnyData ? (
        <div className="flex min-h-[220px] flex-1 flex-col items-center justify-center py-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
            <UserX className="h-6 w-6" />
          </div>
          <h4 className="mt-3 text-sm font-bold text-slate-800">No attendance data yet</h4>
          <p className="mt-1 max-w-xs text-xs text-slate-500">
            Add employees to your organization to begin logging daily attendance & turnout metrics.
          </p>
        </div>
      ) : (
        <div className="grid flex-1 grid-cols-1 gap-6 pt-4 sm:grid-cols-2 sm:items-center">
          {/* Donut Chart Container */}
          <div className="relative flex h-52 w-full items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                  stroke="none"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '12px',
                    border: 'none',
                    color: '#fff',
                    fontSize: '12px',
                    padding: '8px 12px',
                  }}
                  itemStyle={{ color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Inner Donut Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-2xl font-extrabold text-slate-900">{total}</span>
              <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Employees</span>
            </div>
          </div>

          {/* Legend / Metrics Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-xl bg-slate-50 p-2.5 transition-colors hover:bg-emerald-50/50">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <span className="text-xs font-medium text-slate-700">Present</span>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold text-slate-900">{presentCount}</span>
                <span className="ml-1 text-[11px] text-slate-400">({presentPercentage}%)</span>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-slate-50 p-2.5 transition-colors hover:bg-rose-50/50">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-100 text-rose-600">
                  <XCircle className="h-4 w-4" />
                </div>
                <span className="text-xs font-medium text-slate-700">Absent</span>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold text-slate-900">{absentCount}</span>
                <span className="ml-1 text-[11px] text-slate-400">
                  ({total > 0 ? ((absentCount / total) * 100).toFixed(1) : '0.0'}%)
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-slate-50 p-2.5 transition-colors hover:bg-amber-50/50">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
                  <Clock className="h-4 w-4" />
                </div>
                <span className="text-xs font-medium text-slate-700">Late Arrivals</span>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold text-slate-900">{lateCount}</span>
                <span className="ml-1 text-[11px] text-slate-400">
                  ({total > 0 ? ((lateCount / total) * 100).toFixed(1) : '0.0'}%)
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-slate-50 p-2.5 transition-colors hover:bg-blue-50/50">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                  <Calendar className="h-4 w-4" />
                </div>
                <span className="text-xs font-medium text-slate-700">On Leave</span>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold text-slate-900">{onLeaveCount}</span>
                <span className="ml-1 text-[11px] text-slate-400">
                  ({total > 0 ? ((onLeaveCount / total) * 100).toFixed(1) : '0.0'}%)
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
