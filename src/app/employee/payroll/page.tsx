'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { useAuthStore } from '@/store/authStore';
import {
  CreditCard,
  RefreshCw,
  Download,
  Eye,
  CheckCircle2,
  AlertCircle,
  FileText,
  Building2,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Filter,
  X,
  Printer,
  RotateCcw,
} from 'lucide-react';

interface AllowancesDetail {
  hra?: number;
  conveyance?: number;
  medical?: number;
  specialAllowance?: number;
  otherAllowances?: number;
}

interface PayrollRecord {
  _id?: string;
  id?: string;
  payrollPeriod?: string;
  payPeriod?: string;
  payMonth?: number;
  payYear?: number;
  basic?: number;
  basicSalary?: number;
  allowances?: number | AllowancesDetail;
  bonus?: number;
  overtimePay?: number;
  grossSalary?: number;
  pf?: number;
  pt?: number;
  tds?: number;
  esi?: number;
  otherDeductions?: number;
  totalDeductions?: number;
  deductions?: number;
  netSalary?: number;
  status?: string;
  processedAt?: string;
  paidDays?: number;
  workingDays?: number;
  lopDays?: number;
  employeeName?: string;
  employeeId?: string;
  department?: string;
  designation?: string;
}

export default function EmployeePayrollPage() {
  const { user } = useAuthStore();

  const [records, setRecords] = useState<PayrollRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filters & Pagination
  const [filterYear, setFilterYear] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);

  // Modal
  const [selectedPayslip, setSelectedPayslip] = useState<PayrollRecord | null>(null);
  const [isFetchingPayslip, setIsFetchingPayslip] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchPayroll = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const res = await fetch('/api/v1/payroll');
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data?.payrollRecords) {
          setRecords(data.data.payrollRecords || []);
        } else if (data.success && Array.isArray(data.data)) {
          setRecords(data.data || []);
        } else {
          setRecords([]);
        }
      } else {
        setIsError(true);
      }
    } catch (err) {
      console.error('Error fetching employee payslips:', err);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPayroll();
  }, [fetchPayroll]);

  // Available filter years
  const availableYears = useMemo(() => {
    const set = new Set<string>();
    records.forEach((r) => {
      if (r.payYear) set.add(String(r.payYear));
      else if (r.payrollPeriod) {
        const yearPart = r.payrollPeriod.split('-')[0];
        if (yearPart && yearPart.length === 4) set.add(yearPart);
      }
    });
    return Array.from(set).sort().reverse();
  }, [records]);

  // Filtered records
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (filterYear !== 'All') {
        const yr = String(r.payYear || r.payrollPeriod?.split('-')[0] || '');
        if (yr !== filterYear) return false;
      }
      if (filterStatus !== 'All') {
        const st = (r.status || '').toUpperCase();
        if (st !== filterStatus.toUpperCase()) return false;
      }
      return true;
    });
  }, [records, filterYear, filterStatus]);

  // Paginated records
  const totalPages = Math.ceil(filteredRecords.length / pageSize) || 1;
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRecords.slice(start, start + pageSize);
  }, [filteredRecords, currentPage, pageSize]);

  // Latest record for Hero
  const latestRecord = records[0];

  const handleOpenPayslipModal = async (record: PayrollRecord) => {
    setIsFetchingPayslip(true);
    try {
      const recId = record._id || record.id || record.employeeId;
      const res = await fetch(`/api/v1/payroll/${recId}/payslip`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data?.payrollRecord) {
          setSelectedPayslip(data.data.payrollRecord);
        } else {
          setSelectedPayslip(record);
        }
      } else {
        setSelectedPayslip(record);
      }
    } catch {
      setSelectedPayslip(record);
    } finally {
      setIsFetchingPayslip(false);
    }
  };

  const getStatusBadge = (status?: string) => {
    const st = (status || 'PROCESSED').toUpperCase();
    if (st === 'PAID') {
      return <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">PAID</span>;
    }
    if (st === 'APPROVED' || st === 'PROCESSED') {
      return <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-[10px] font-bold text-indigo-700 border border-indigo-200">{st}</span>;
    }
    if (st === 'DRAFT' || st === 'PROCESSING') {
      return <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200">{st}</span>;
    }
    return <span className="rounded-full bg-rose-50 px-2.5 py-0.5 text-[10px] font-bold text-rose-700 border border-rose-200">{st}</span>;
  };

  const handleResetFilters = () => {
    setFilterYear('All');
    setFilterStatus('All');
    setCurrentPage(1);
  };

  // Helper to extract basic and allowances safely
  const getBasicSalary = (r: PayrollRecord) => r.basic ?? r.basicSalary ?? 0;
  const getTotalDeductions = (r: PayrollRecord) => r.totalDeductions ?? r.deductions ?? 0;
  const getNetSalary = (r: PayrollRecord) => r.netSalary ?? 0;

  return (
    <AuthGuard allowedRoles={['EMPLOYEE', 'SUPER_ADMIN', 'ADMIN', 'HR', 'MANAGER']}>
      <AdminLayout
        allowedRoles={['EMPLOYEE', 'SUPER_ADMIN', 'ADMIN', 'HR', 'MANAGER']}
        pageTitle="Payroll"
        breadcrumbs={[
          { label: 'My Workspace', href: '/employee/dashboard' },
          { label: 'Payroll', href: '/employee/payroll' },
        ]}
      >
        {/* Toast Alert */}
        {toastMessage && (
          <div className="fixed right-6 top-20 z-50 flex items-center gap-2 rounded-xl bg-slate-900 border border-emerald-500/40 px-4 py-3 text-xs text-white shadow-2xl animate-fade-in">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span className="font-medium">{toastMessage}</span>
          </div>
        )}

        <div className="space-y-6">
          {/* Page Header */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-slate-950">Payroll</h1>
              <p className="text-xs font-medium text-slate-500 mt-0.5">
                View your salary, payslips, and payroll history.
              </p>
            </div>
            <button
              onClick={fetchPayroll}
              disabled={isLoading}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 disabled:opacity-50 transition-all cursor-pointer"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh Data</span>
            </button>
          </div>

          {/* Global Error Alert */}
          {isError && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-4 text-xs text-rose-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                <span>Unable to load payroll information. Please check your connection.</span>
              </div>
              <button
                onClick={fetchPayroll}
                className="rounded-xl bg-rose-600 px-3 py-1.5 font-bold text-white shadow-xs hover:bg-rose-700 transition-all cursor-pointer"
              >
                Retry
              </button>
            </div>
          )}

          {/* Pulse Skeleton Loading State */}
          {isLoading ? (
            <div className="space-y-6 animate-pulse">
              <div className="h-36 w-full rounded-2xl bg-slate-200/80"></div>
              <div className="h-64 rounded-2xl bg-slate-200/80"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Latest Payslip Hero Section */}
              {latestRecord ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="space-y-2 text-center md:text-left">
                    <div className="flex items-center justify-center md:justify-start gap-2">
                      <h2 className="text-base font-extrabold text-slate-900">
                        {latestRecord.payPeriod || latestRecord.payrollPeriod || 'Latest Payslip'}
                      </h2>
                      {getStatusBadge(latestRecord.status)}
                    </div>
                    <p className="text-xs text-slate-500 font-medium">
                      Official processed payroll statement for authenticated employee account.
                    </p>
                    <div className="flex items-center justify-center md:justify-start gap-3 text-xs pt-1">
                      <button
                        onClick={() => handleOpenPayslipModal(latestRecord)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-indigo-200 hover:bg-indigo-500 transition-all cursor-pointer"
                      >
                        <Eye className="h-4 w-4" />
                        <span>View Payslip</span>
                      </button>
                      <button
                        onClick={() => {
                          handleOpenPayslipModal(latestRecord);
                        }}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                      >
                        <Download className="h-3.5 w-3.5 text-indigo-600" />
                        <span>Download</span>
                      </button>
                    </div>
                  </div>

                  {/* Salary Summary Numbers */}
                  <div className="grid grid-cols-3 gap-3 text-center text-xs font-mono bg-slate-50 p-4 rounded-2xl border border-slate-100 min-w-[320px]">
                    <div>
                      <span className="text-[10px] text-slate-400 font-sans block">Gross Salary</span>
                      <span className="text-sm font-extrabold text-slate-900">
                        ₹{(latestRecord.grossSalary || 0).toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-sans block">Deductions</span>
                      <span className="text-sm font-extrabold text-rose-600">
                        -₹{getTotalDeductions(latestRecord).toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-sans block">Net Payout</span>
                      <span className="text-base font-black text-emerald-600">
                        ₹{getNetSalary(latestRecord).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-xs text-slate-400 space-y-2 shadow-xs">
                  <CreditCard className="h-10 w-10 text-slate-300 mx-auto" />
                  <p className="font-bold text-slate-700 text-sm">No payroll records yet</p>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Your payslips will appear here after payroll is processed.
                  </p>
                </div>
              )}

              {/* Payroll History Section */}
              <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
                {/* Filter Bar */}
                <div className="border-b border-slate-100 p-4 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50">
                  <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <FileText className="h-4 w-4 text-indigo-600" />
                    <span>Payroll History</span>
                  </h3>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    {availableYears.length > 0 && (
                      <select
                        value={filterYear}
                        onChange={(e) => {
                          setFilterYear(e.target.value);
                          setCurrentPage(1);
                        }}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 outline-none"
                      >
                        <option value="All">All Years</option>
                        {availableYears.map((yr) => (
                          <option key={yr} value={yr}>
                            {yr}
                          </option>
                        ))}
                      </select>
                    )}

                    <select
                      value={filterStatus}
                      onChange={(e) => {
                        setFilterStatus(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 outline-none"
                    >
                      <option value="All">All Statuses</option>
                      <option value="PAID">PAID</option>
                      <option value="APPROVED">APPROVED</option>
                      <option value="PROCESSED">PROCESSED</option>
                    </select>

                    {(filterYear !== 'All' || filterStatus !== 'All') && (
                      <button
                        onClick={handleResetFilters}
                        className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-200 cursor-pointer"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        <span>Reset</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* History Table */}
                {filteredRecords.length === 0 ? (
                  <div className="p-12 text-center text-xs text-slate-400 space-y-2">
                    <CreditCard className="h-10 w-10 text-slate-300 mx-auto" />
                    <p className="font-bold text-slate-700 text-sm">No payroll records match your filters.</p>
                    <p className="text-xs text-slate-400">Try adjusting your year or status filter above.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-600">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[10px]">
                        <tr>
                          <th className="py-3.5 px-4">Payroll Period</th>
                          <th className="py-3.5 px-4">Gross Salary</th>
                          <th className="py-3.5 px-4">Total Deductions</th>
                          <th className="py-3.5 px-4">Net Salary</th>
                          <th className="py-3.5 px-4">Status</th>
                          <th className="py-3.5 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {paginatedRecords.map((r) => (
                          <tr key={r._id || r.id || r.payrollPeriod} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3.5 px-4 font-bold text-slate-900">
                              {r.payPeriod || r.payrollPeriod || 'Period'}
                            </td>
                            <td className="py-3.5 px-4 font-mono font-semibold text-slate-800">
                              ₹{(r.grossSalary || 0).toLocaleString()}
                            </td>
                            <td className="py-3.5 px-4 font-mono text-rose-600">
                              -₹{getTotalDeductions(r).toLocaleString()}
                            </td>
                            <td className="py-3.5 px-4 font-mono font-extrabold text-emerald-600">
                              ₹{getNetSalary(r).toLocaleString()}
                            </td>
                            <td className="py-3.5 px-4">{getStatusBadge(r.status)}</td>
                            <td className="py-3.5 px-4 text-right space-x-2">
                              <button
                                onClick={() => handleOpenPayslipModal(r)}
                                className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
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

                {/* Pagination Footer */}
                {filteredRecords.length > 0 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200 bg-slate-50/50 px-4 py-3 text-xs text-slate-500">
                    <div>
                      Showing <span className="font-bold text-slate-800">{paginatedRecords.length}</span> of{' '}
                      <span className="font-bold text-slate-800">{filteredRecords.length}</span> payroll entries
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        disabled={currentPage <= 1}
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 font-semibold text-slate-700 disabled:opacity-40 cursor-pointer"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        <span>Previous</span>
                      </button>
                      <span className="px-2 font-medium text-slate-700">
                        Page {currentPage} of {totalPages}
                      </span>
                      <button
                        disabled={currentPage >= totalPages}
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 font-semibold text-slate-700 disabled:opacity-40 cursor-pointer"
                      >
                        <span>Next</span>
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Detailed Payslip Modal */}
          {selectedPayslip && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
              <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl space-y-4 animate-fade-in text-xs max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-indigo-600" />
                    <h3 className="text-base font-extrabold text-slate-900">EMS / HRMS • Employee Payslip</h3>
                  </div>
                  <button onClick={() => setSelectedPayslip(null)} className="rounded-lg p-1 text-slate-400 hover:text-slate-700">
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Employee Header Metadata */}
                <div className="grid grid-cols-2 gap-4 rounded-xl bg-slate-50 p-4 border border-slate-100 font-medium">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Employee Name</span>
                    <span className="font-bold text-slate-900 text-sm">{selectedPayslip.employeeName || user?.name || 'Employee'}</span>
                    <span className="text-[11px] text-indigo-600 block">{selectedPayslip.designation || 'Staff'} • {selectedPayslip.department || 'General'}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Payroll Period</span>
                    <span className="font-bold text-slate-900 text-sm">{selectedPayslip.payPeriod || selectedPayslip.payrollPeriod}</span>
                    <div className="mt-1">{getStatusBadge(selectedPayslip.status)}</div>
                  </div>
                </div>

                {/* Attendance Context if present */}
                {(selectedPayslip.workingDays !== undefined || selectedPayslip.paidDays !== undefined) && (
                  <div className="grid grid-cols-3 gap-2 text-center font-mono text-[11px] bg-indigo-50/60 p-2.5 rounded-xl border border-indigo-100">
                    <div>
                      <span className="text-[9px] text-slate-400 font-sans block">Working Days</span>
                      <span className="font-bold text-slate-800">{selectedPayslip.workingDays || 26} Days</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 font-sans block">Paid Days</span>
                      <span className="font-bold text-emerald-700">{selectedPayslip.paidDays || selectedPayslip.workingDays || 26} Days</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 font-sans block">LOP Days</span>
                      <span className="font-bold text-rose-600">{selectedPayslip.lopDays || 0} Days</span>
                    </div>
                  </div>
                )}

                {/* Itemized Earnings & Deductions Breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Earnings Column */}
                  <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3.5 space-y-2">
                    <h4 className="font-extrabold text-slate-900 uppercase text-[10px] tracking-wider text-emerald-700 border-b border-slate-200/60 pb-1.5">
                      Earnings & Allowances
                    </h4>
                    <div className="space-y-1.5 font-mono text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-sans">Basic Salary:</span>
                        <span className="font-bold text-slate-900">₹{getBasicSalary(selectedPayslip).toLocaleString()}</span>
                      </div>

                      {typeof selectedPayslip.allowances === 'object' && selectedPayslip.allowances && (
                        <>
                          {Boolean(selectedPayslip.allowances.hra) && (
                            <div className="flex justify-between text-slate-600">
                              <span className="text-slate-500 font-sans">HRA:</span>
                              <span>+₹{(selectedPayslip.allowances.hra || 0).toLocaleString()}</span>
                            </div>
                          )}
                          {Boolean(selectedPayslip.allowances.conveyance) && (
                            <div className="flex justify-between text-slate-600">
                              <span className="text-slate-500 font-sans">Conveyance:</span>
                              <span>+₹{(selectedPayslip.allowances.conveyance || 0).toLocaleString()}</span>
                            </div>
                          )}
                          {Boolean(selectedPayslip.allowances.specialAllowance) && (
                            <div className="flex justify-between text-slate-600">
                              <span className="text-slate-500 font-sans">Special Allowance:</span>
                              <span>+₹{(selectedPayslip.allowances.specialAllowance || 0).toLocaleString()}</span>
                            </div>
                          )}
                        </>
                      )}

                      {Boolean(selectedPayslip.overtimePay) && (
                        <div className="flex justify-between text-indigo-600">
                          <span className="text-slate-500 font-sans">Overtime Pay:</span>
                          <span>+₹{(selectedPayslip.overtimePay || 0).toLocaleString()}</span>
                        </div>
                      )}

                      {Boolean(selectedPayslip.bonus) && (
                        <div className="flex justify-between text-indigo-600">
                          <span className="text-slate-500 font-sans">Bonus / Incentives:</span>
                          <span>+₹{(selectedPayslip.bonus || 0).toLocaleString()}</span>
                        </div>
                      )}

                      <div className="flex justify-between border-t border-slate-200 pt-1 font-bold text-emerald-700">
                        <span className="font-sans">Gross Salary:</span>
                        <span>₹{(selectedPayslip.grossSalary || getBasicSalary(selectedPayslip)).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Deductions Column */}
                  <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3.5 space-y-2">
                    <h4 className="font-extrabold text-slate-900 uppercase text-[10px] tracking-wider text-rose-700 border-b border-slate-200/60 pb-1.5">
                      Deductions & Taxes
                    </h4>
                    <div className="space-y-1.5 font-mono text-[11px]">
                      {Boolean(selectedPayslip.pf) && (
                        <div className="flex justify-between text-slate-600">
                          <span className="text-slate-500 font-sans">Provident Fund (PF):</span>
                          <span>-₹{(selectedPayslip.pf || 0).toLocaleString()}</span>
                        </div>
                      )}
                      {Boolean(selectedPayslip.pt) && (
                        <div className="flex justify-between text-slate-600">
                          <span className="text-slate-500 font-sans">Professional Tax (PT):</span>
                          <span>-₹{(selectedPayslip.pt || 0).toLocaleString()}</span>
                        </div>
                      )}
                      {Boolean(selectedPayslip.tds) && (
                        <div className="flex justify-between text-slate-600">
                          <span className="text-slate-500 font-sans">TDS / Income Tax:</span>
                          <span>-₹{(selectedPayslip.tds || 0).toLocaleString()}</span>
                        </div>
                      )}
                      {Boolean(selectedPayslip.esi) && (
                        <div className="flex justify-between text-slate-600">
                          <span className="text-slate-500 font-sans">ESI Deduction:</span>
                          <span>-₹{(selectedPayslip.esi || 0).toLocaleString()}</span>
                        </div>
                      )}

                      <div className="flex justify-between border-t border-slate-200 pt-1 font-bold text-rose-700">
                        <span className="font-sans">Total Deductions:</span>
                        <span>-₹{getTotalDeductions(selectedPayslip).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Net Salary Summary Box */}
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 flex items-center justify-between text-emerald-950 font-mono">
                  <div>
                    <span className="text-xs font-extrabold font-sans block">Net Payout Amount</span>
                    <span className="text-[11px] text-emerald-700 font-sans">Deposited into bank account</span>
                  </div>
                  <span className="text-2xl font-black text-emerald-700">
                    ₹{getNetSalary(selectedPayslip).toLocaleString()}
                  </span>
                </div>

                {/* Actions Footer */}
                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 font-bold text-white shadow-xs hover:bg-indigo-500 cursor-pointer"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    <span>Print / Save PDF</span>
                  </button>
                  <button
                    onClick={() => setSelectedPayslip(null)}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
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
