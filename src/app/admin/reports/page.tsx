'use client';

import React, { useState } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { BarChart3, Download, FileSpreadsheet, FileText, Filter, PieChart as PieIcon, TrendingUp } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';

const deptDistribution = [
  { name: 'Engineering & IT', count: 420, color: '#2563eb' },
  { name: 'Sales & BD', count: 310, color: '#10b981' },
  { name: 'Operations', count: 268, color: '#f59e0b' },
  { name: 'Marketing', count: 120, color: '#8b5cf6' },
  { name: 'Finance', count: 85, color: '#ec4899' },
  { name: 'HR', count: 45, color: '#06b6d4' },
];

const salaryRangeData = [
  { range: '0-3L', count: 120 },
  { range: '3-6L', count: 340 },
  { range: '6-10L', count: 410 },
  { range: '10-15L', count: 220 },
  { range: '15L+', count: 158 },
];

export default function ReportsPage() {
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerExport = (format: string, reportName: string) => {
    setToastMessage(`Exporting ${reportName} in ${format} format...`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <AdminLayout
      pageTitle="Reports & Executive Analytics"
      breadcrumbs={[{ label: 'Reports', href: '/admin/reports' }]}
    >
      {/* Toast */}
      {toastMessage && (
        <div className="fixed right-6 top-20 z-50 flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs text-white shadow-xl">
          <Download className="h-4 w-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">HR Intelligence & Export Hub</h2>
          <p className="text-xs text-slate-500">
            Generate workforce, attendance, leave, turnover, and payroll audit reports
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => triggerExport('PDF', 'Full HR Summary Report')}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-md hover:bg-blue-700"
          >
            <FileText className="h-4 w-4" /> Export PDF
          </button>
          <button
            onClick={() => triggerExport('Excel', 'Workforce Dataset')}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" /> Export Excel
          </button>
        </div>
      </div>

      {/* Report Categories Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { title: 'Employee Directory Report', desc: 'Active headcount, grades & locations' },
          { title: 'Monthly Attendance Summary', desc: 'Turnout rates, overtime & late hours' },
          { title: 'Leave Utilization Audit', desc: 'Balances, encashment & approvals' },
          { title: 'Payroll Disbursal Register', desc: 'Gross salary, PF, PT, TDS deductions' },
          { title: 'Employee Attrition & Turnover', desc: 'Resignation reasons & tenure metrics' },
          { title: 'Recruitment Funnel Report', desc: 'Time to hire, candidate source & offers' },
        ].map((rep, idx) => (
          <div key={idx} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:border-blue-300">
            <h4 className="text-xs font-bold text-slate-900">{rep.title}</h4>
            <p className="mt-1 text-[11px] text-slate-500">{rep.desc}</p>
            <div className="mt-3 flex items-center justify-end gap-2 text-[11px]">
              <button onClick={() => triggerExport('CSV', rep.title)} className="font-semibold text-blue-600 hover:underline">
                Download CSV
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Chart 1: Department Distribution */}
        <div className="lg:col-span-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-1">Department Distribution</h3>
          <p className="text-xs text-slate-500 mb-4">Headcount breakdown per business unit</p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={deptDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="count"
                >
                  {deptDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Salary Distribution */}
        <div className="lg:col-span-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-1">Salary Range Distribution</h3>
          <p className="text-xs text-slate-500 mb-4">Employee count across CTC bands</p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salaryRangeData}>
                <XAxis dataKey="range" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#2563eb" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
