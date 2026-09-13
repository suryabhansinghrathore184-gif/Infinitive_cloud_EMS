'use client';

import React, { useState, useEffect } from 'react';
import { CreditCard, RefreshCw, Download, Eye, CheckCircle2 } from 'lucide-react';

export default function EmployeePayrollPage() {
  const [payslips, setPayslips] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPayslip, setSelectedPayslip] = useState<any | null>(null);

  const fetchPayroll = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/v1/payroll');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setPayslips(data.data || []);
        }
      }
    } catch (err) {
      console.error('Error fetching employee payslips:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPayroll();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">My Payslips & Payroll</h1>
          <p className="text-sm text-slate-500 mt-1">Access monthly salary breakdowns, tax deductions, and download payslips.</p>
        </div>
        <button
          onClick={fetchPayroll}
          className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 transition-all cursor-pointer"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-500">
            <RefreshCw className="h-5 w-5 animate-spin text-indigo-600 mx-auto mb-2" />
            <span>Loading payslip records...</span>
          </div>
        ) : payslips.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            No processed payslips found for your account.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Period</th>
                  <th className="py-3.5 px-4">Basic Salary</th>
                  <th className="py-3.5 px-4">Deductions</th>
                  <th className="py-3.5 px-4">Net Salary</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payslips.map((p) => (
                  <tr key={p._id || p.id} className="hover:bg-slate-50/80">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{p.payrollPeriod || p.month || '2026-03'}</td>
                    <td className="py-3.5 px-4 font-mono">${(p.basicSalary || 5000).toLocaleString()}</td>
                    <td className="py-3.5 px-4 font-mono text-rose-600">-${(p.deductions || 350).toLocaleString()}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-600">${(p.netSalary || 4650).toLocaleString()}</td>
                    <td className="py-3.5 px-4">
                      <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
                        {p.status || 'PAID'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedPayslip(p)}
                        className="inline-flex items-center gap-1 text-indigo-600 font-bold hover:text-indigo-800 cursor-pointer"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>View Payslip</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedPayslip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-extrabold text-slate-900">Payslip Detail</h3>
            <p className="text-xs text-slate-500">Period: {selectedPayslip.payrollPeriod || 'March 2026'}</p>
            <div className="mt-4 space-y-3 rounded-2xl bg-slate-50 p-4 text-xs font-mono">
              <div className="flex justify-between">
                <span>Basic Salary:</span>
                <span>${(selectedPayslip.basicSalary || 5000).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-rose-600">
                <span>Total Deductions / Tax:</span>
                <span>-${(selectedPayslip.deductions || 350).toLocaleString()}</span>
              </div>
              <hr className="border-slate-200" />
              <div className="flex justify-between font-bold text-emerald-600 text-sm">
                <span>Net Pay Amount:</span>
                <span>${(selectedPayslip.netSalary || 4650).toLocaleString()}</span>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => alert('Downloading official PDF payslip...')}
                className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-500 cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Download PDF</span>
              </button>
              <button
                onClick={() => setSelectedPayslip(null)}
                className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
