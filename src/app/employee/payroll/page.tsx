'use client';

import React, { useState, useEffect } from 'react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { CreditCard, RefreshCw, Download, Eye, CheckCircle2, AlertCircle, FileText } from 'lucide-react';

interface PayrollRecord {
  _id?: string;
  id?: string;
  payrollPeriod?: string;
  month?: string;
  basicSalary?: number;
  allowances?: number;
  deductions?: number;
  taxDeduction?: number;
  netSalary?: number;
  status?: string;
  paymentDate?: string;
  payslipUrl?: string;
}

export default function EmployeePayrollPage() {
  const [payslips, setPayslips] = useState<PayrollRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPayslip, setSelectedPayslip] = useState<PayrollRecord | null>(null);

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
    <AuthGuard allowedRoles={['EMPLOYEE', 'SUPER_ADMIN', 'ADMIN', 'HR', 'MANAGER']}>
      <AdminLayout
        allowedRoles={['EMPLOYEE', 'SUPER_ADMIN', 'ADMIN', 'HR', 'MANAGER']}
        pageTitle="My Payslips & Payroll"
        breadcrumbs={[
          { label: 'My Workspace', href: '/employee/dashboard' },
          { label: 'My Payroll', href: '/employee/payroll' },
        ]}
      >
        <div className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">My Payslips & Salary Records</h1>
              <p className="text-xs text-slate-500 mt-1">
                Access your monthly processed payslips, basic salary breakdown, tax deductions, and net payouts.
              </p>
            </div>
            <button
              onClick={fetchPayroll}
              disabled={isLoading}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh Payslips</span>
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
                <CreditCard className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                <p className="font-bold text-slate-700 text-sm">No processed payslips found</p>
                <p className="text-xs text-slate-400 mt-1">When HR approves and processes your payroll, your payslips will appear here.</p>
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
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {payslips.map((p) => (
                      <tr key={p._id || p.id} className="hover:bg-slate-50/80">
                        <td className="py-3.5 px-4 font-bold text-slate-900">{p.payrollPeriod || p.month || 'N/A'}</td>
                        <td className="py-3.5 px-4 font-mono">${(p.basicSalary || 0).toLocaleString()}</td>
                        <td className="py-3.5 px-4 font-mono text-rose-600">-${(p.deductions || 0).toLocaleString()}</td>
                        <td className="py-3.5 px-4 font-mono font-bold text-emerald-600">${(p.netSalary || 0).toLocaleString()}</td>
                        <td className="py-3.5 px-4">
                          <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
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

          {/* Payslip Modal */}
          {selectedPayslip && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
              <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-indigo-600" />
                    <h3 className="text-base font-extrabold text-slate-900">Payslip Breakdown</h3>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-mono font-bold text-slate-700">
                    {selectedPayslip.payrollPeriod || selectedPayslip.month || 'Statement'}
                  </span>
                </div>

                <div className="space-y-3 rounded-2xl bg-slate-50/80 p-4 text-xs font-mono text-slate-700 border border-slate-200/60">
                  <div className="flex justify-between">
                    <span>Basic Salary:</span>
                    <span className="font-bold text-slate-900">${(selectedPayslip.basicSalary || 0).toLocaleString()}</span>
                  </div>
                  {selectedPayslip.allowances !== undefined && (
                    <div className="flex justify-between text-indigo-600">
                      <span>Allowances:</span>
                      <span>+${(selectedPayslip.allowances || 0).toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-rose-600">
                    <span>Total Deductions / Tax:</span>
                    <span>-${(selectedPayslip.deductions || 0).toLocaleString()}</span>
                  </div>
                  <hr className="border-slate-200 my-2" />
                  <div className="flex justify-between font-bold text-emerald-600 text-sm">
                    <span>Net Pay Amount:</span>
                    <span>${(selectedPayslip.netSalary || 0).toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    onClick={() => {
                      if (selectedPayslip.payslipUrl) {
                        window.open(selectedPayslip.payslipUrl, '_blank');
                      } else {
                        window.print();
                      }
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-500 cursor-pointer shadow-xs"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Download Payslip</span>
                  </button>
                  <button
                    onClick={() => setSelectedPayslip(null)}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </AdminLayout>
    </AuthGuard>
  );
}
