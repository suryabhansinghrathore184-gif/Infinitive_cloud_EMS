'use client';

import React, { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { useEmsStore } from '@/store/emsStore';
import {
  Download,
  FileSpreadsheet,
  FileText,
  BarChart3,
  RefreshCw,
  Filter,
  Users,
  UserPlus,
  UserMinus,
  Briefcase,
  MapPin,
  PieChart as PieIcon,
  Calendar,
  Loader2,
  AlertCircle,
  Eye,
  CheckCircle2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

import { ReportDetailModal } from '@/components/modals/ReportDetailModal';
import { downloadFile, printReport } from '@/lib/exportHelper';

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#64748b', '#3b82f6'];

interface AnalyticsData {
  totalEmployees: number;
  activeEmployees: number;
  newJoinersThisMonth: number;
  exitsThisMonth: number;
  deptDistribution: { name: string; count: number; percentage: number; color: string }[];
  employmentTypeDistribution: { name: string; count: number }[];
  locationDistribution: { name: string; count: number }[];
  genderDistribution: { name: string; count: number }[];
  monthlyHeadcountTrend: { month: string; headcount: number }[];
}

export default function ReportsPage() {
  const { state } = useEmsStore();

  // Filter state
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [selectedDepartment, setSelectedDepartment] = useState<string>('All');
  const [selectedLocation, setSelectedLocation] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');

  // Analytics API state
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal State
  const [activeModalReport, setActiveModalReport] = useState<{
    endpoint: string;
    title: string;
    description: string;
  } | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const fetchAnalyticsData = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const params = new URLSearchParams();
      if (selectedMonth) params.append('month', selectedMonth);
      if (selectedDepartment && selectedDepartment !== 'All') params.append('department', selectedDepartment);
      if (selectedLocation && selectedLocation !== 'All') params.append('location', selectedLocation);
      if (selectedStatus && selectedStatus !== 'All') params.append('status', selectedStatus);

      const res = await fetch(`/api/v1/reports/analytics?${params.toString()}`);
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Failed to fetch executive analytics');
      }

      setAnalytics(json.data);
    } catch (err: any) {
      console.error('Error loading report analytics:', err);
      setErrorMsg(err.message || 'Failed to load report analytics');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, [selectedMonth, selectedDepartment, selectedLocation, selectedStatus]);

  const handleDownloadDirectCSV = async (endpoint: string, reportName: string) => {
    showToast(`Generating ${reportName} CSV...`);
    try {
      const params = new URLSearchParams();
      params.append('format', 'csv');
      if (selectedMonth) params.append('month', selectedMonth);
      if (selectedDepartment && selectedDepartment !== 'All') params.append('department', selectedDepartment);
      if (selectedLocation && selectedLocation !== 'All') params.append('location', selectedLocation);
      if (selectedStatus && selectedStatus !== 'All') params.append('status', selectedStatus);

      const res = await fetch(`${endpoint}?${params.toString()}`);
      const csvStr = await res.text();
      downloadFile(csvStr, `${reportName.replace(/\s+/g, '_')}.csv`, 'text/csv;charset=utf-8;');
      showToast(`${reportName} CSV downloaded successfully.`);
    } catch (err) {
      console.error('CSV export error:', err);
      alert(`Failed to download ${reportName} CSV.`);
    }
  };

  const handleGlobalPdfExport = () => {
    if (!analytics) return;
    const headers = ['Department', 'Headcount', 'Percentage of Total'];
    const rows = analytics.deptDistribution.map((d) => [d.name, d.count, `${d.percentage}%`]);
    const summary = [
      { label: 'Total Employees', value: analytics.totalEmployees },
      { label: 'Active Headcount', value: analytics.activeEmployees },
      { label: 'New Joiners', value: analytics.newJoinersThisMonth },
      { label: 'Exits', value: analytics.exitsThisMonth },
    ];
    printReport(
      'HR Executive Summary Report',
      { Month: selectedMonth, Department: selectedDepartment, Location: selectedLocation, Status: selectedStatus },
      summary,
      headers,
      rows
    );
  };

  const handleGlobalExcelExport = () => {
    handleDownloadDirectCSV('/api/v1/reports/employee-directory', 'Employee_Directory_Dataset');
  };

  const reportCards = [
    {
      title: 'Employee Directory Report',
      desc: 'Active headcount, grades & locations',
      endpoint: '/api/v1/reports/employee-directory',
    },
    {
      title: 'Monthly Attendance Summary',
      desc: 'Turnout rates, overtime & late hours',
      endpoint: '/api/v1/reports/attendance',
    },
    {
      title: 'Leave Utilization Audit',
      desc: 'Balances, encashment & approvals',
      endpoint: '/api/v1/reports/leave',
    },
    {
      title: 'Payroll Disbursal Register',
      desc: 'Gross salary, PF, PT, TDS deductions',
      endpoint: '/api/v1/reports/payroll',
    },
    {
      title: 'Employee Attrition & Turnover',
      desc: 'Resignation reasons & tenure metrics',
      endpoint: '/api/v1/reports/attrition',
    },
    {
      title: 'Recruitment Funnel Report',
      desc: 'Time to hire, candidate source & offers',
      endpoint: '/api/v1/reports/recruitment',
    },
  ];

  const deptDistribution = analytics?.deptDistribution || [];
  const hasChartData = deptDistribution.some((d) => d.count > 0);

  return (
    <AdminLayout
      pageTitle="HR Intelligence & Reports"
      breadcrumbs={[{ label: 'Reports', href: '/admin/reports' }]}
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed right-6 top-20 z-50 flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs text-white shadow-xl animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">HR Intelligence & Export Hub</h2>
          <p className="text-xs text-slate-500">
            Generate workforce, attendance, leave, turnover, and payroll audit reports
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchAnalyticsData()}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-indigo-600 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={handleGlobalPdfExport}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700 transition-all"
          >
            <FileText className="h-4 w-4" /> Print / Save PDF
          </button>
          <button
            onClick={handleGlobalExcelExport}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" /> Export Excel (.xls)
          </button>
        </div>
      </div>

      {/* Global Filters Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-xs">
        <div className="flex items-center gap-2 font-bold text-slate-800">
          <Filter className="w-4 h-4 text-indigo-600" />
          <span>Global Filters:</span>
        </div>

        <div className="flex flex-wrap items-center gap-3 flex-1 max-w-4xl">
          {/* Month Picker */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent font-medium text-slate-800 focus:outline-none"
            />
          </div>

          {/* Department Filter */}
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="All">All Departments</option>
            {state.departments.map((d) => (
              <option key={d.id} value={d.name}>
                {d.name}
              </option>
            ))}
          </select>

          {/* Location Filter */}
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="All">All Locations</option>
            {state.locations.map((l) => (
              <option key={l.id} value={l.name}>
                {l.name}
              </option>
            ))}
          </select>

          {/* Employee Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Probation">Probation</option>
            <option value="Resigned">Resigned</option>
            <option value="Terminated">Terminated</option>
            <option value="On Leave">On Leave</option>
          </select>
        </div>
      </div>

      {/* Workforce Overview Metric Widgets */}
      {analytics && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-500">Total Workforce</p>
              <p className="text-xl font-black text-slate-900">{analytics.totalEmployees}</p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-500">Active Headcount</p>
              <p className="text-xl font-black text-emerald-600">{analytics.activeEmployees}</p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-500">New Joiners ({selectedMonth || 'Month'})</p>
              <p className="text-xl font-black text-amber-600">{analytics.newJoinersThisMonth}</p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center gap-3">
            <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl">
              <UserMinus className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-500">Exits ({selectedMonth || 'Month'})</p>
              <p className="text-xl font-black text-rose-600">{analytics.exitsThisMonth}</p>
            </div>
          </div>
        </div>
      )}

      {/* 6 Report Category Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {reportCards.map((rep, idx) => (
          <div
            key={idx}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:border-indigo-300 transition-all flex flex-col justify-between"
          >
            <div>
              <h4 className="text-xs font-bold text-slate-900">{rep.title}</h4>
              <p className="mt-1 text-[11px] text-slate-500 leading-relaxed">{rep.desc}</p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <button
                onClick={() =>
                  setActiveModalReport({
                    endpoint: rep.endpoint,
                    title: rep.title,
                    description: rep.desc,
                  })
                }
                className="flex items-center gap-1 font-bold text-indigo-600 hover:text-indigo-800 text-[11px]"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>View Report</span>
              </button>

              <button
                onClick={() => handleDownloadDirectCSV(rep.endpoint, rep.title)}
                className="flex items-center gap-1 font-semibold text-slate-600 hover:text-indigo-600 text-[11px]"
              >
                <Download className="w-3.5 h-3.5 text-slate-400" />
                <span>Download CSV</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Analytics Charts & Interactive Widgets */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-slate-200 shadow-sm text-slate-400 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          <span className="text-xs font-medium">Aggregating live HR analytics from MongoDB...</span>
        </div>
      ) : errorMsg ? (
        <div className="p-6 bg-red-50 border border-red-200 text-red-700 rounded-2xl flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button
            onClick={() => fetchAnalyticsData()}
            className="px-4 py-2 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      ) : !hasChartData ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-xs text-slate-500">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 mx-auto">
            <BarChart3 className="h-6 w-6" />
          </div>
          <h4 className="mt-3 text-sm font-bold text-slate-800">No employee data available for selected filters</h4>
          <p className="mt-1 max-w-xs mx-auto text-xs text-slate-500">
            Add company employees and organization units to visualize analytics and executive reporting charts.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Main Charts Grid */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Chart 1: Department Distribution (Pie/Donut) */}
            <div className="lg:col-span-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 mb-0.5">Department Distribution</h3>
                  <p className="text-xs text-slate-500">Headcount breakdown per business unit</p>
                </div>
                <PieIcon className="w-5 h-5 text-indigo-500" />
              </div>

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
                    <Tooltip
                      formatter={(val: any, name: any, item: any) => [
                        `${val} employees (${item.payload.percentage}%)`,
                        item.payload.name,
                      ]}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Headcount by Department (Bar Chart) */}
            <div className="lg:col-span-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 mb-0.5">Headcount by Department</h3>
                  <p className="text-xs text-slate-500">Real department employee count & ratio</p>
                </div>
                <BarChart3 className="w-5 h-5 text-emerald-500" />
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={deptDistribution}>
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip
                      formatter={(val: any, name: any, item: any) => [
                        `${val} Headcount (${item.payload.percentage}% of total)`,
                        'Employee Count',
                      ]}
                    />
                    <Bar dataKey="count" fill="#2563eb" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Additional Useful HR Analytics Widgets */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Widget 1: Employment Type Breakdown */}
            {Boolean(analytics?.employmentTypeDistribution && analytics.employmentTypeDistribution.length > 0) && (
              <div className="lg:col-span-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center justify-between">
                  <span>Employment Types</span>
                  <Briefcase className="w-4 h-4 text-indigo-500" />
                </h3>
                <div className="space-y-2">
                  {analytics?.employmentTypeDistribution?.map((t, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs">
                      <span className="text-slate-600 font-medium">{t.name}</span>
                      <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">
                        {t.count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Widget 2: Location Distribution */}
            {Boolean(analytics?.locationDistribution && analytics.locationDistribution.length > 0) && (
              <div className="lg:col-span-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center justify-between">
                  <span>Location Breakdown</span>
                  <MapPin className="w-4 h-4 text-emerald-500" />
                </h3>
                <div className="space-y-2">
                  {analytics?.locationDistribution?.map((l, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs">
                      <span className="text-slate-600 font-medium truncate max-w-[180px]">{l.name}</span>
                      <span className="font-bold text-slate-900 bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md border border-emerald-100">
                        {l.count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Widget 3: Monthly Headcount Trend */}
            {Boolean(analytics?.monthlyHeadcountTrend && analytics.monthlyHeadcountTrend.length > 0) && (
              <div className="lg:col-span-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center justify-between">
                  <span>Headcount Growth Trend</span>
                  <Users className="w-4 h-4 text-amber-500" />
                </h3>
                <div className="space-y-2">
                  {analytics?.monthlyHeadcountTrend?.map((m, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs">
                      <span className="text-slate-600 font-medium">{m.month}</span>
                      <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                        {m.headcount} Total
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Interactive Report Detail Modal */}
      {activeModalReport && (
        <ReportDetailModal
          isOpen={!!activeModalReport}
          onClose={() => setActiveModalReport(null)}
          reportEndpoint={activeModalReport.endpoint}
          reportTitle={activeModalReport.title}
          reportDescription={activeModalReport.description}
          currentFilters={{
            month: selectedMonth,
            department: selectedDepartment,
            location: selectedLocation,
            status: selectedStatus,
          }}
        />
      )}
    </AdminLayout>
  );
}
