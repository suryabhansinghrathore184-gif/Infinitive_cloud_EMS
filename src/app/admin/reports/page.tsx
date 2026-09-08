'use client';

import React, { useState } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { useEmsStore } from '@/store/emsStore';
import { Download, FileSpreadsheet, FileText, BarChart3 } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

export default function ReportsPage() {
  const { state } = useEmsStore();
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerExport = (format: string, reportName: string) => {
    setToastMessage(`Exporting ${reportName} in ${format} format...`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const departments = state.departments;
  const employees = state.employees;

  const deptDistribution = departments.map((d, index) => ({
    name: d.name,
    count: employees.filter((e) => e.department === d.name).length,
    color: COLORS[index % COLORS.length],
  }));

  const hasData = employees.length > 0 || departments.length > 0;

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

      {/* Analytics Charts Grid vs Empty State */}
      {!hasData ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-xs text-slate-500">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 mx-auto">
            <BarChart3 className="h-6 w-6" />
          </div>
          <h4 className="mt-3 text-sm font-bold text-slate-800">No data available for this report</h4>
          <p className="mt-1 max-w-xs mx-auto text-xs text-slate-500">
            Add company employees and organization units to visualize analytics and executive reporting charts.
          </p>
        </div>
      ) : (
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
            <h3 className="text-sm font-bold text-slate-900 mb-1">Headcount by Department</h3>
            <p className="text-xs text-slate-500 mb-4">Real department employee count</p>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deptDistribution}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#2563eb" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
