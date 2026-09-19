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
  Calendar,
  Search,
  DollarSign,
  TrendingDown,
  TrendingUp,
  Inbox,
  User,
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
  payoutDate?: string;
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
  const [profileData, setProfileData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterYear, setFilterYear] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);

  // Payslip Modal
  const [selectedPayslip, setSelectedPayslip] = useState<PayrollRecord | null>(null);
  const [isFetchingPayslip, setIsFetchingPayslip] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchPayrollData = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setIsError(false);
    setErrorMessage(null);

    try {
      const [payRes, meRes] = await Promise.all([
        fetch('/api/v1/payroll').catch(() => null),
        fetch('/api/v1/auth/me').catch(() => null),
      ]);

      if (meRes && meRes.ok) {
        const meData = await meRes.json();
        if (meData.success) setProfileData(meData.data);
      }

      if (payRes && payRes.ok) {
        const data = await payRes.json();
        if (data.success && data.data?.payrollRecords) {
          setRecords(data.data.payrollRecords || []);
        } else if (data.success && Array.isArray(data.data)) {
          setRecords(data.data || []);
        } else {
          setRecords([]);
        }
      } else {
        setIsError(true);
        setErrorMessage('Failed to fetch payroll records from the server.');
      }

      if (isManualRefresh) {
        showToast('Payroll data updated successfully.');
      }
    } catch (err: any) {
      console.error('Error fetching employee payslips:', err);
      setIsError(true);
      setErrorMessage(err?.message || 'Unable to load payroll information. Please try again.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPayrollData();
  }, [fetchPayrollData]);

  // Derived user details
  const activeUser = profileData || user;
  const fullName = activeUser?.name || 'Employee';
  const todayFormattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

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
      const periodStr = (r.payPeriod || r.payrollPeriod || '').toLowerCase();
      if (searchQuery.trim() && !periodStr.includes(searchQuery.toLowerCase())) {
        return false;
      }
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
  }, [records, searchQuery, filterYear, filterStatus]);

  // Paginated records
  const totalPages = Math.ceil(filteredRecords.length / pageSize) || 1;
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRecords.slice(start, start + pageSize);
  }, [filteredRecords, currentPage, pageSize]);

  // Latest record for Hero summary
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
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="h-3 w-3" />
          <span>PAID</span>
        </span>
      );
    }
    if (st === 'APPROVED' || st === 'PROCESSED') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-0.5 text-[10px] font-bold text-indigo-700 border border-indigo-200">
          <ShieldCheck className="h-3 w-3" />
          <span>{st}</span>
        </span>
      );
    }
    if (st === 'DRAFT' || st === 'PROCESSING' || st === 'PENDING') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200">
          <AlertCircle className="h-3 w-3" />
          <span>{st}</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-600 border border-slate-200">
        <span>{st}</span>
      </span>
    );
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setFilterYear('All');
    setFilterStatus('All');
    setCurrentPage(1);
  };

  // Helper getters
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
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span className="font-medium">{toastMessage}</span>
          </div>
        )}

        {/* Page Top Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6 pb-2 border-b border-slate-200/80">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-black tracking-tight text-slate-900">Employee Payroll Portal</h1>
              <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-0.5 text-[11px] font-bold text-indigo-700 border border-indigo-200">
                <CreditCard className="h-3.5 w-3.5" />
                <span>{activeUser?.employeeId || 'STAFF'}</span>
              </span>
            </div>
            <p className="text-xs font-medium text-slate-500 mt-1 flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5 text-slate-400" />
              <span>{todayFormattedDate}</span>
              <span className="text-slate-300">•</span>
              <span>View your official processed salary statements, payslips, and tax breakdown.</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchPayrollData(true)}
              disabled={isLoading || isRefreshing}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50 transition-all cursor-pointer"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing || isLoading ? 'animate-spin text-indigo-600' : 'text-slate-500'}`} />
              <span>{isRefreshing ? 'Refreshing...' : 'Refresh Data'}</span>
            </button>
          </div>
        </div>

        {/* Global Error Banner */}
        {isError && (
          <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50/80 p-4 text-xs text-rose-800 flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
              <div>
                <p className="font-bold text-rose-900">Unable to load payroll statements</p>
                <p className="text-rose-700 mt-0.5">{errorMessage || 'Please check your connection and retry.'}</p>
              </div>
            </div>
            <button
              onClick={() => fetchPayrollData(true)}
              className="rounded-xl bg-rose-600 px-3.5 py-1.5 font-bold text-white shadow-xs hover:bg-rose-700 transition-all cursor-pointer shrink-0"
            >
              Retry
            </button>
          </div>
        )}

        {/* Pulse Skeleton Loading State */}
        {isLoading ? (
          <div className="space-y-6 animate-pulse">
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-28 rounded-2xl bg-slate-200/80"></div>
              ))}
            </div>
            <div className="h-64 rounded-2xl bg-slate-200/80"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Payroll Financial KPI Summary Cards */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {/* 1. Latest Net Payout */}
              <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs flex flex-col justify-between space-y-2">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Latest Net Payout</span>
                  <DollarSign className="h-4 w-4 text-emerald-600" />
                </div>
                {latestRecord ? (
                  <div>
                    <span className="text-2xl font-black text-emerald-600 font-mono">
                      ₹{getNetSalary(latestRecord).toLocaleString()}
                    </span>
                    <p className="text-[11px] text-slate-400 font-medium mt-0.5 truncate">
                      {latestRecord.payPeriod || latestRecord.payrollPeriod || 'Latest Statement'}
                    </p>
                  </div>
                ) : (
                  <div>
                    <span className="text-sm font-bold text-slate-400">₹0</span>
                    <p className="text-[11px] text-slate-400">No records yet</p>
                  </div>
                )}
              </div>

              {/* 2. Gross Salary */}
              <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs flex flex-col justify-between space-y-2">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Gross Salary</span>
                  <TrendingUp className="h-4 w-4 text-indigo-600" />
                </div>
                {latestRecord ? (
                  <div>
                    <span className="text-xl font-black text-slate-900 font-mono">
                      ₹{(latestRecord.grossSalary || getBasicSalary(latestRecord)).toLocaleString()}
                    </span>
                    <p className="text-[11px] text-slate-400 font-medium mt-0.5">Base & Allowances</p>
                  </div>
                ) : (
                  <div>
                    <span className="text-sm font-bold text-slate-400">₹0</span>
                    <p className="text-[11px] text-slate-400">No records yet</p>
                  </div>
                )}
              </div>

              {/* 3. Total Deductions */}
              <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs flex flex-col justify-between space-y-2">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Total Deductions</span>
                  <TrendingDown className="h-4 w-4 text-rose-500" />
                </div>
                {latestRecord ? (
                  <div>
                    <span className="text-xl font-black text-rose-600 font-mono">
                      -₹{getTotalDeductions(latestRecord).toLocaleString()}
                    </span>
                    <p className="text-[11px] text-slate-400 font-medium mt-0.5">PF, PT & TDS</p>
                  </div>
                ) : (
                  <div>
                    <span className="text-sm font-bold text-slate-400">₹0</span>
                    <p className="text-[11px] text-slate-400">No records yet</p>
                  </div>
                )}
              </div>

              {/* 4. Payment Status */}
              <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs flex flex-col justify-between space-y-2">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Payment Status</span>
                  <ShieldCheck className="h-4 w-4 text-indigo-600" />
                </div>
                {latestRecord ? (
                  <div>
                    <div className="mt-1">{getStatusBadge(latestRecord.status)}</div>
                    <p className="text-[11px] text-slate-400 font-medium mt-2 truncate">
                      {latestRecord.payoutDate ? `Paid on ${latestRecord.payoutDate}` : 'Processed'}
                    </p>
                  </div>
                ) : (
                  <div>
                    <span className="text-xs font-bold text-slate-400">No Status</span>
                    <p className="text-[11px] text-slate-400">Awaiting processing</p>
                  </div>
                )}
              </div>
            </div>

            {/* Latest Payslip Highlight Hero Box */}
            {latestRecord && (
              <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="space-y-2 text-center md:text-left">
                  <div className="flex items-center justify-center md:justify-start gap-2.5">
                    <h2 className="text-lg font-black text-slate-900">
                      {latestRecord.payPeriod || latestRecord.payrollPeriod || 'Latest Payslip Statement'}
                    </h2>
                    {getStatusBadge(latestRecord.status)}
                  </div>
                  <p className="text-xs text-slate-500 font-medium">
                    Official verified salary statement for authenticated employee account.
                  </p>
                  <div className="flex items-center justify-center md:justify-start gap-3 text-xs pt-1">
                    <button
                      onClick={() => handleOpenPayslipModal(latestRecord)}
                      className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-500 transition-all cursor-pointer"
                    >
                      <Eye className="h-4 w-4" />
                      <span>View Detailed Payslip</span>
                    </button>
                    <button
                      onClick={() => handleOpenPayslipModal(latestRecord)}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      <Download className="h-3.5 w-3.5 text-indigo-600" />
                      <span>Download Statement</span>
                    </button>
                  </div>
                </div>

                {/* Financial Summary Strip */}
                <div className="grid grid-cols-3 gap-3 text-center text-xs font-mono bg-slate-50/80 p-4 rounded-2xl border border-slate-100 min-w-[320px]">
                  <div>
                    <span className="text-[10px] text-slate-400 font-sans block mb-0.5">Gross Salary</span>
                    <span className="text-sm font-extrabold text-slate-900">
                      ₹{(latestRecord.grossSalary || getBasicSalary(latestRecord)).toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-sans block mb-0.5">Deductions</span>
                    <span className="text-sm font-extrabold text-rose-600">
                      -₹{getTotalDeductions(latestRecord).toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-sans block mb-0.5">Net Payout</span>
                    <span className="text-base font-black text-emerald-600">
                      ₹{getNetSalary(latestRecord).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Payroll History Section */}
            <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
              {/* Filter Controls Bar */}
              <div className="border-b border-slate-100 p-4 flex flex-col md:flex-row items-center justify-between gap-3 bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-indigo-600" />
                  <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Payroll History & Statements</h3>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
                  {/* Search Period */}
                  <div className="relative flex-1 md:w-48">
                    <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search period..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full rounded-xl border border-slate-200 bg-white pl-8 pr-3 py-1.5 text-xs font-medium text-slate-800 placeholder-slate-400 outline-none focus:border-indigo-500"
                    />
                  </div>

                  {/* Year Filter */}
                  {availableYears.length > 0 && (
                    <select
                      value={filterYear}
                      onChange={(e) => {
                        setFilterYear(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 outline-none cursor-pointer"
                    >
                      <option value="All">All Years</option>
                      {availableYears.map((yr) => (
                        <option key={yr} value={yr}>
                          {yr}
                        </option>
                      ))}
                    </select>
                  )}

                  {/* Status Filter */}
                  <select
                    value={filterStatus}
                    onChange={(e) => {
                      setFilterStatus(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 outline-none cursor-pointer"
                  >
                    <option value="All">All Statuses</option>
                    <option value="PAID">PAID</option>
                    <option value="APPROVED">APPROVED</option>
                    <option value="PROCESSED">PROCESSED</option>
                    <option value="DRAFT">DRAFT</option>
                  </select>

                  {/* Reset Button */}
                  {(filterYear !== 'All' || filterStatus !== 'All' || searchQuery) && (
                    <button
                      onClick={handleResetFilters}
                      className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span>Reset</span>
                    </button>
                  )}
                </div>
              </div>

              {/* History Data Table & Mobile Responsive Cards */}
              {filteredRecords.length === 0 ? (
                <div className="p-12 text-center text-xs text-slate-400 space-y-2">
                  <Inbox className="h-10 w-10 text-slate-300 mx-auto" />
                  <p className="font-bold text-slate-700 text-sm">No payroll statements found</p>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto">
                    {records.length === 0
                      ? 'Your payslips will appear here after payroll is processed by HR.'
                      : 'No statements match your current search or status filters.'}
                  </p>
                </div>
              ) : (
                <>
                  {/* Desktop / Tablet Table View */}
                  <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-600">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-extrabold uppercase tracking-wider text-[10px]">
                        <tr>
                          <th className="py-3.5 px-4">Payroll Period</th>
                          <th className="py-3.5 px-4">Gross Salary</th>
                          <th className="py-3.5 px-4">Total Deductions</th>
                          <th className="py-3.5 px-4">Net Payout</th>
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
                              ₹{(r.grossSalary || getBasicSalary(r)).toLocaleString()}
                            </td>
                            <td className="py-3.5 px-4 font-mono text-rose-600 font-medium">
                              -₹{getTotalDeductions(r).toLocaleString()}
                            </td>
                            <td className="py-3.5 px-4 font-mono font-black text-emerald-600">
                              ₹{getNetSalary(r).toLocaleString()}
                            </td>
                            <td className="py-3.5 px-4">{getStatusBadge(r.status)}</td>
                            <td className="py-3.5 px-4 text-right space-x-2">
                              <button
                                onClick={() => handleOpenPayslipModal(r)}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
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

                  {/* Mobile Card View (< 640px) */}
                  <div className="block sm:hidden divide-y divide-slate-100 p-3 space-y-3">
                    {paginatedRecords.map((r) => (
                      <div key={r._id || r.id || r.payrollPeriod} className="rounded-xl border border-slate-200/80 bg-white p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 text-sm">{r.payPeriod || r.payrollPeriod}</span>
                          {getStatusBadge(r.status)}
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono bg-slate-50 p-2.5 rounded-xl">
                          <div>
                            <span className="text-[9px] text-slate-400 font-sans block">Gross</span>
                            <span className="font-bold text-slate-900">₹{(r.grossSalary || getBasicSalary(r)).toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-400 font-sans block">Deduction</span>
                            <span className="font-bold text-rose-600">-₹{getTotalDeductions(r).toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-400 font-sans block">Net</span>
                            <span className="font-bold text-emerald-600">₹{getNetSalary(r).toLocaleString()}</span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleOpenPayslipModal(r)}
                          className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2 text-xs font-bold text-white shadow-xs cursor-pointer"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>View Payslip Details</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Pagination Footer */}
              {filteredRecords.length > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200 bg-slate-50/50 px-4 py-3 text-xs text-slate-500">
                  <div>
                    Showing <span className="font-bold text-slate-800">{paginatedRecords.length}</span> of{' '}
                    <span className="font-bold text-slate-800">{filteredRecords.length}</span> statements
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      disabled={currentPage <= 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 font-bold text-slate-700 disabled:opacity-40 transition-colors cursor-pointer"
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
                      className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 font-bold text-slate-700 disabled:opacity-40 transition-colors cursor-pointer"
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

        {/* Detailed Itemized Payslip Modal */}
        {selectedPayslip && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
            <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl space-y-4 animate-fade-in text-xs max-h-[90vh] overflow-y-auto border border-slate-100">
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <CreditCard className="h-5 w-5 text-indigo-600" />
                  <div>
                    <h3 className="text-base font-black text-slate-900">EMS / HRMS • Salary Statement</h3>
                    <p className="text-[11px] text-slate-500 font-medium">Official Employee Payslip Breakdown</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedPayslip(null)}
                  className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Employee Header Information */}
              <div className="grid grid-cols-2 gap-4 rounded-xl bg-slate-50/80 p-4 border border-slate-100 font-medium">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Employee</span>
                  <span className="font-bold text-slate-900 text-sm block mt-0.5">{selectedPayslip.employeeName || fullName}</span>
                  <span className="text-[11px] text-indigo-600 block mt-0.5">
                    {selectedPayslip.designation || activeUser?.designation || 'Staff'} • {selectedPayslip.department || activeUser?.department || 'General'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Period</span>
                  <span className="font-bold text-slate-900 text-sm block mt-0.5">{selectedPayslip.payPeriod || selectedPayslip.payrollPeriod}</span>
                  <div className="mt-1 flex justify-end">{getStatusBadge(selectedPayslip.status)}</div>
                </div>
              </div>

              {/* Attendance Context */}
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

              {/* Net Payout Summary Box */}
              <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 flex items-center justify-between text-emerald-950 font-mono shadow-2xs">
                <div>
                  <span className="text-xs font-extrabold font-sans block">Net Payout Amount</span>
                  <span className="text-[11px] text-emerald-700 font-sans">Deposited into salary account</span>
                </div>
                <span className="text-2xl font-black text-emerald-700">
                  ₹{getNetSalary(selectedPayslip).toLocaleString()}
                </span>
              </div>

              {/* Action Buttons Footer */}
              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-500 transition-all cursor-pointer"
                >
                  <Printer className="h-4 w-4" />
                  <span>Print / Download PDF</span>
                </button>
                <button
                  onClick={() => setSelectedPayslip(null)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </AdminLayout>
    </AuthGuard>
  );
}
