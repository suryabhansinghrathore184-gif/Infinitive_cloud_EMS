'use client';

import React, { useState } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { useEmsStore } from '@/store/emsStore';
import { Lock, CheckCircle2, FileText, Play, CreditCard } from 'lucide-react';

export default function PayrollPage() {
  const { state } = useEmsStore();
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const employees = state.employees;
  const totalDisbursed = 0;

  return (
    <AdminLayout
      pageTitle="Payroll Management"
      breadcrumbs={[{ label: 'Payroll', href: '/admin/payroll' }]}
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
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900">Monthly Payroll Processing</h2>
            <span className="flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 border border-amber-200">
              <Lock className="h-3 w-3" /> Confidential
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Calculate salary components, statutory deductions (PF/PT/TDS), and approve payslips
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => showToast('Initiating Payroll Calculation Engine...')}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-md hover:bg-blue-700"
          >
            <Play className="h-4 w-4" />
            <span>Process Payroll</span>
          </button>
        </div>
      </div>

      {/* Payroll Workflow Diagram */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm text-xs">
        <h4 className="font-bold text-slate-900 mb-2">Automated Payroll Calculation Flow</h4>
        <div className="flex flex-wrap items-center gap-2 font-medium text-slate-600">
          <span className="rounded-lg bg-slate-100 px-3 py-1.5 border border-slate-200">Employee Master</span>
          <span>→</span>
          <span className="rounded-lg bg-slate-100 px-3 py-1.5 border border-slate-200">Attendance Data</span>
          <span>→</span>
          <span className="rounded-lg bg-slate-100 px-3 py-1.5 border border-slate-200">Approved Leaves</span>
          <span>→</span>
          <span className="rounded-lg bg-slate-100 px-3 py-1.5 border border-slate-200">Overtime & Bonus</span>
          <span>→</span>
          <span className="rounded-lg bg-blue-50 text-blue-700 px-3 py-1.5 border border-blue-200 font-bold">Net Salary</span>
          <span>→</span>
          <span className="rounded-lg bg-emerald-50 text-emerald-700 px-3 py-1.5 border border-emerald-200 font-bold">Payslip PDF</span>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <span className="text-xs font-semibold text-slate-500">TOTAL NET PAYROLL</span>
          <p className="mt-2 text-2xl font-extrabold text-slate-900">₹{totalDisbursed.toLocaleString('en-IN')}</p>
          <span className="text-[10px] text-slate-400">Current Cycle</span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <span className="text-xs font-semibold text-slate-500">STATUTORY DEDUCTIONS</span>
          <p className="mt-2 text-2xl font-extrabold text-slate-900">₹0</p>
          <span className="text-[10px] text-slate-400">PF + PT + TDS Income Tax</span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <span className="text-xs font-semibold text-slate-500">PAYSLIPS GENERATED</span>
          <p className="mt-2 text-2xl font-extrabold text-emerald-600">0 / {employees.length}</p>
          <span className="text-[10px] text-slate-400">Ready for Disbursal</span>
        </div>
      </div>

      {/* Payroll Table vs Empty State */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {employees.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <CreditCard className="h-6 w-6" />
            </div>
            <h4 className="mt-3 text-sm font-bold text-slate-800">No payroll records yet</h4>
            <p className="mt-1 max-w-xs text-xs text-slate-500">
              Add employees and process salary runs to generate monthly payroll records and payslips.
            </p>
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-slate-500 font-semibold">
                <th className="px-4 py-3.5">Employee</th>
                <th className="px-4 py-3.5">Department</th>
                <th className="px-4 py-3.5">Designation</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-right">Payslip</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {employees.map((emp) => (
                <tr key={emp.id} className="hover:bg-slate-50/60">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <img src={emp.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80'} alt={emp.firstName} className="h-8 w-8 rounded-full object-cover" />
                      <div>
                        <p className="font-bold text-slate-900">{emp.firstName} {emp.lastName}</p>
                        <p className="text-[10px] text-slate-400">{emp.employeeId}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-slate-700">{emp.department}</td>
                  <td className="px-4 py-3.5 text-slate-700">{emp.designation}</td>
                  <td className="px-4 py-3.5">
                    <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200">
                      {emp.status}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <button
                      onClick={() => showToast(`Generating Payslip for ${emp.firstName} ${emp.lastName}`)}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      <FileText className="h-3.5 w-3.5 text-blue-600" /> PDF
                    </button>
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
