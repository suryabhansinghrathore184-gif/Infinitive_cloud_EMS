'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { useAuthStore } from '@/store/authStore';
import {
  HelpCircle,
  Plus,
  Search,
  RefreshCw,
  CheckCircle2,
  Eye,
  AlertCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  MessageSquare,
  FileText,
  User,
  Building2,
  ShieldCheck,
  X,
  Sparkles,
  Filter,
  Play,
  Check,
} from 'lucide-react';
import { HrTicket } from '@/types/admin';

// Modals
import { CreateHrTicketModal } from '@/components/modals/CreateHrTicketModal';
import { TicketDetailModal } from '@/components/modals/TicketDetailModal';

export default function EmployeeHelpdeskPage() {
  const { user } = useAuthStore();

  // Filters & Search State
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedRequestType, setSelectedRequestType] = useState<string>('All');
  const [selectedPriority, setSelectedPriority] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize] = useState<number>(15);

  // Data State from MongoDB
  const [tickets, setTickets] = useState<HrTicket[]>([]);
  const [profileData, setProfileData] = useState<any>(null);
  const [statusCounts, setStatusCounts] = useState({
    open: 0,
    assigned: 0,
    inProgress: 0,
    resolved: 0,
    closed: 0,
    total: 0,
  });

  const [totalFilteredCount, setTotalFilteredCount] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isError, setIsError] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [activeDetailTicketId, setActiveDetailTicketId] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchTicketsFromApi = useCallback(
    async (isManualRefresh = false) => {
      if (isManualRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setIsError(false);
      setErrorMsg('');

      try {
        const params = new URLSearchParams();
        if (selectedStatus !== 'All') params.append('status', selectedStatus);
        if (selectedRequestType !== 'All') params.append('requestType', selectedRequestType);
        if (selectedPriority !== 'All') params.append('priority', selectedPriority);
        if (searchQuery.trim()) params.append('search', searchQuery.trim());
        params.append('page', String(currentPage));
        params.append('limit', String(pageSize));

        const [tckRes, meRes] = await Promise.all([
          fetch(`/api/v1/hr-requests?${params.toString()}`).catch(() => null),
          fetch('/api/v1/auth/me').catch(() => null),
        ]);

        if (meRes && meRes.ok) {
          const meData = await meRes.json();
          if (meData.success && meData.user) {
            setProfileData(meData.user);
          }
        }

        if (tckRes && tckRes.ok) {
          const data = await tckRes.json();
          if (data.success) {
            setTickets(data.tickets || []);
            setStatusCounts(data.statusCounts || { open: 0, assigned: 0, inProgress: 0, resolved: 0, closed: 0, total: 0 });
            setTotalFilteredCount(data.count || 0);
            setTotalPages(data.totalPages || 1);

            if (isManualRefresh) {
              showToast('HR support tickets refreshed');
            }
          } else {
            setIsError(true);
            setErrorMsg(data.message || 'Unable to load support requests.');
          }
        } else {
          setIsError(true);
          setErrorMsg('Failed to fetch HR support tickets.');
        }
      } catch (err: any) {
        console.error('Error loading employee tickets:', err);
        setIsError(true);
        setErrorMsg(err.message || 'Unable to load support tickets. Please try again.');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [selectedStatus, selectedRequestType, selectedPriority, searchQuery, currentPage, pageSize]
  );

  useEffect(() => {
    fetchTicketsFromApi();
  }, [fetchTicketsFromApi]);

  const handleResetFilters = () => {
    setSelectedStatus('All');
    setSelectedRequestType('All');
    setSelectedPriority('All');
    setSearchQuery('');
    setCurrentPage(1);
  };

  const isFiltered =
    selectedStatus !== 'All' || selectedRequestType !== 'All' || selectedPriority !== 'All' || searchQuery.trim() !== '';

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Open':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-extrabold text-blue-700 border border-blue-200">
            <Clock className="h-3 w-3 text-blue-600" />
            Open
          </span>
        );
      case 'Assigned':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2.5 py-0.5 text-[11px] font-extrabold text-purple-700 border border-purple-200">
            <User className="h-3 w-3 text-purple-600" />
            Assigned
          </span>
        );
      case 'In Progress':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-extrabold text-amber-700 border border-amber-200">
            <RefreshCw className="h-3 w-3 text-amber-600" />
            In Progress
          </span>
        );
      case 'Resolved':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-extrabold text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
            Resolved
          </span>
        );
      case 'Closed':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-extrabold text-slate-700 border border-slate-300">
            <FileText className="h-3 w-3 text-slate-500" />
            Closed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-700 border border-slate-200">
            {status}
          </span>
        );
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'Urgent':
        return (
          <span className="inline-flex items-center rounded-md bg-rose-100 px-2 py-0.5 text-[10px] font-extrabold text-rose-800 border border-rose-200">
            Urgent
          </span>
        );
      case 'High':
        return (
          <span className="inline-flex items-center rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 border border-amber-200">
            High
          </span>
        );
      case 'Medium':
        return (
          <span className="inline-flex items-center rounded-md bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-800 border border-indigo-200">
            Medium
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700 border border-slate-200">
            Low
          </span>
        );
    }
  };

  // User Identity Context
  const employeeName = profileData?.name || user?.name || 'Employee';
  const employeeId = profileData?.employeeId || user?.employeeId || 'N/A';
  const designation = profileData?.designation || user?.designation || 'Team Member';
  const department = profileData?.department || user?.department || 'General';

  return (
    <AuthGuard allowedRoles={['EMPLOYEE', 'SUPER_ADMIN', 'ADMIN', 'HR', 'MANAGER']}>
      <AdminLayout
        allowedRoles={['EMPLOYEE', 'SUPER_ADMIN', 'ADMIN', 'HR', 'MANAGER']}
        pageTitle="Employee Helpdesk"
        breadcrumbs={[
          { label: 'My Workspace', href: '/employee/dashboard' },
          { label: 'Helpdesk & Support', href: '/employee/helpdesk' },
        ]}
      >
        <div className="space-y-6 pb-12">
          {/* Toast Notification Banner */}
          {toastMessage && (
            <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-xs font-semibold text-white shadow-2xl animate-fade-in border border-slate-700">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>{toastMessage}</span>
            </div>
          )}

          {/* PAGE HEADER & USER CONTEXT BADGE */}
          <div className="flex flex-col gap-4 rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">My HR Support Requests</h1>
                <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-0.5 text-[11px] font-extrabold text-indigo-700 border border-indigo-200">
                  <ShieldCheck className="h-3.5 w-3.5 text-indigo-600" />
                  Employee HR Portal
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Submit and track tickets for salary queries, attendance corrections, leave requests, document requests, or general HR assistance.
              </p>

              {/* Employee Identity Context Pill */}
              <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-slate-600 font-medium">
                <div className="flex items-center gap-1.5 rounded-lg bg-slate-50 px-3 py-1 border border-slate-200/80">
                  <User className="h-3.5 w-3.5 text-slate-400" />
                  <span className="font-bold text-slate-800">{employeeName}</span>
                  <span className="text-[10px] text-slate-400 font-mono">({employeeId})</span>
                </div>
                <div className="flex items-center gap-1.5 rounded-lg bg-slate-50 px-3 py-1 border border-slate-200/80">
                  <Building2 className="h-3.5 w-3.5 text-slate-400" />
                  <span>{designation}</span>
                  <span className="text-slate-300">•</span>
                  <span className="font-semibold text-slate-700">{department}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                onClick={() => fetchTicketsFromApi(true)}
                disabled={isRefreshing || isLoading}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-slate-900 transition-all cursor-pointer disabled:opacity-50"
                title="Refresh support tickets"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin text-indigo-600' : ''}`} />
                <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
              </button>

              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700 transition-all cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>New Support Request</span>
              </button>
            </div>
          </div>

          {/* ERROR ALERT BANNER */}
          {isError && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50/90 p-4 text-xs text-rose-800 shadow-xs flex items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
                <div>
                  <p className="font-bold text-rose-900">Failed to Load Support Tickets</p>
                  <p className="text-rose-700 mt-0.5">{errorMsg || 'An error occurred while connecting to HR helpdesk.'}</p>
                </div>
              </div>
              <button
                onClick={() => fetchTicketsFromApi(true)}
                className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-700 transition-colors shrink-0 cursor-pointer"
              >
                Retry
              </button>
            </div>
          )}

          {/* REAL-DATA LIFECYCLE STATS KPI CARDS */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {/* Card 1: Open */}
            <div
              onClick={() => {
                setSelectedStatus('Open');
                setCurrentPage(1);
              }}
              className={`cursor-pointer rounded-2xl border p-4 shadow-2xs transition-all hover:shadow-md ${
                selectedStatus === 'Open'
                  ? 'border-blue-500 bg-blue-50/60 ring-2 ring-blue-500/20'
                  : 'border-slate-200/90 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-600">Open Tickets</span>
                <Clock className="h-4 w-4 text-blue-500" />
              </div>
              <div className="mt-2.5">
                {isLoading ? (
                  <div className="h-7 w-12 bg-slate-200 animate-pulse rounded-md"></div>
                ) : (
                  <span className="text-2xl font-extrabold text-slate-900 tracking-tight">{statusCounts.open}</span>
                )}
                <p className="mt-0.5 text-[10px] text-slate-400 font-medium">Awaiting HR pickup</p>
              </div>
            </div>

            {/* Card 2: In Progress */}
            <div
              onClick={() => {
                setSelectedStatus('In Progress');
                setCurrentPage(1);
              }}
              className={`cursor-pointer rounded-2xl border p-4 shadow-2xs transition-all hover:shadow-md ${
                selectedStatus === 'In Progress'
                  ? 'border-amber-500 bg-amber-50/60 ring-2 ring-amber-500/20'
                  : 'border-slate-200/90 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-600">In Progress</span>
                <RefreshCw className="h-4 w-4 text-amber-500" />
              </div>
              <div className="mt-2.5">
                {isLoading ? (
                  <div className="h-7 w-12 bg-slate-200 animate-pulse rounded-md"></div>
                ) : (
                  <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
                    {statusCounts.assigned + statusCounts.inProgress}
                  </span>
                )}
                <p className="mt-0.5 text-[10px] text-slate-400 font-medium">Being processed by HR</p>
              </div>
            </div>

            {/* Card 3: Resolved */}
            <div
              onClick={() => {
                setSelectedStatus('Resolved');
                setCurrentPage(1);
              }}
              className={`cursor-pointer rounded-2xl border p-4 shadow-2xs transition-all hover:shadow-md ${
                selectedStatus === 'Resolved'
                  ? 'border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-500/20'
                  : 'border-slate-200/90 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-600">Resolved</span>
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              </div>
              <div className="mt-2.5">
                {isLoading ? (
                  <div className="h-7 w-12 bg-slate-200 animate-pulse rounded-md"></div>
                ) : (
                  <span className="text-2xl font-extrabold text-slate-900 tracking-tight">{statusCounts.resolved}</span>
                )}
                <p className="mt-0.5 text-[10px] text-slate-400 font-medium">Solution provided</p>
              </div>
            </div>

            {/* Card 4: Closed */}
            <div
              onClick={() => {
                setSelectedStatus('Closed');
                setCurrentPage(1);
              }}
              className={`cursor-pointer rounded-2xl border p-4 shadow-2xs transition-all hover:shadow-md ${
                selectedStatus === 'Closed'
                  ? 'border-slate-400 bg-slate-100 ring-2 ring-slate-400/20'
                  : 'border-slate-200/90 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600">Closed</span>
                <FileText className="h-4 w-4 text-slate-500" />
              </div>
              <div className="mt-2.5">
                {isLoading ? (
                  <div className="h-7 w-12 bg-slate-200 animate-pulse rounded-md"></div>
                ) : (
                  <span className="text-2xl font-extrabold text-slate-900 tracking-tight">{statusCounts.closed}</span>
                )}
                <p className="mt-0.5 text-[10px] text-slate-400 font-medium">Archived tickets</p>
              </div>
            </div>

            {/* Card 5: Total Created */}
            <div
              onClick={() => {
                setSelectedStatus('All');
                setCurrentPage(1);
              }}
              className={`cursor-pointer rounded-2xl border p-4 shadow-2xs transition-all hover:shadow-md ${
                selectedStatus === 'All'
                  ? 'border-indigo-500 bg-indigo-50/60 ring-2 ring-indigo-500/20'
                  : 'border-slate-200/90 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-600">Total Created</span>
                <HelpCircle className="h-4 w-4 text-indigo-500" />
              </div>
              <div className="mt-2.5">
                {isLoading ? (
                  <div className="h-7 w-12 bg-slate-200 animate-pulse rounded-md"></div>
                ) : (
                  <span className="text-2xl font-extrabold text-slate-900 tracking-tight">{statusCounts.total}</span>
                )}
                <p className="mt-0.5 text-[10px] text-slate-400 font-medium">All submitted requests</p>
              </div>
            </div>
          </div>

          {/* SEARCH & FILTER TOOLBAR */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs space-y-3">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by ticket #, subject title, or description..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-8 py-2 text-xs font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:border-indigo-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setCurrentPage(1);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Filter Dropdowns */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Status Dropdown */}
                <select
                  value={selectedStatus}
                  onChange={(e) => {
                    setSelectedStatus(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 focus:border-indigo-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 transition-all cursor-pointer"
                >
                  <option value="All">All Statuses</option>
                  <option value="Open">Open</option>
                  <option value="Assigned">Assigned</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Closed">Closed</option>
                </select>

                {/* Request Type Dropdown */}
                <select
                  value={selectedRequestType}
                  onChange={(e) => {
                    setSelectedRequestType(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 focus:border-indigo-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 transition-all cursor-pointer"
                >
                  <option value="All">All Request Types</option>
                  <option value="Salary Issue">Salary Issue</option>
                  <option value="Attendance Correction">Attendance Correction</option>
                  <option value="Leave Issue">Leave Issue</option>
                  <option value="Document Request">Document Request</option>
                  <option value="Payroll Issue">Payroll Issue</option>
                  <option value="Profile Correction">Profile Correction</option>
                  <option value="IT/Asset Request">IT/Asset Request</option>
                  <option value="General HR Query">General HR Query</option>
                </select>

                {/* Priority Dropdown */}
                <select
                  value={selectedPriority}
                  onChange={(e) => {
                    setSelectedPriority(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 focus:border-indigo-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 transition-all cursor-pointer"
                >
                  <option value="All">All Priorities</option>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                </select>

                {/* Reset Filters */}
                {isFiltered && (
                  <button
                    onClick={handleResetFilters}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all cursor-pointer shadow-2xs"
                  >
                    <RotateCcw className="h-3.5 w-3.5 text-slate-400" />
                    <span>Reset</span>
                  </button>
                )}
              </div>
            </div>

            {/* Active Filter Count Badge */}
            {isFiltered && (
              <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 text-[11px] text-slate-500">
                <span>
                  Showing <strong className="text-slate-800">{totalFilteredCount}</strong> matching support requests
                </span>
              </div>
            )}
          </div>

          {/* MAIN CONTENT: TICKET LIST TABLE & MOBILE CARDS */}
          <div className="rounded-2xl border border-slate-200/90 bg-white shadow-xs overflow-hidden">
            <div className="border-b border-slate-200/80 bg-slate-50/60 px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-indigo-600" />
                <h2 className="text-sm font-extrabold text-slate-800">Support Ticket Log</h2>
              </div>
              <span className="text-xs text-slate-500 font-semibold">
                {totalFilteredCount} {totalFilteredCount === 1 ? 'ticket' : 'tickets'}
              </span>
            </div>

            {isLoading ? (
              /* SKELETON LOADER FOR TABLE */
              <div className="p-6 space-y-4">
                {[1, 2, 3, 4].map((idx) => (
                  <div key={idx} className="animate-pulse flex items-center justify-between border-b border-slate-100 pb-4">
                    <div className="space-y-2">
                      <div className="h-4 w-32 bg-slate-200 rounded-md"></div>
                      <div className="h-3 w-56 bg-slate-100 rounded-md"></div>
                    </div>
                    <div className="h-6 w-20 bg-slate-200 rounded-full"></div>
                  </div>
                ))}
              </div>
            ) : tickets.length === 0 ? (
              /* ZERO DATA EMPTY STATE */
              <div className="p-12 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-300 mb-4">
                  <HelpCircle className="h-7 w-7" />
                </div>
                <h3 className="text-base font-bold text-slate-800">
                  {isFiltered ? 'No matching support requests found' : 'No Support Requests Yet'}
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1.5 leading-relaxed font-medium">
                  {isFiltered
                    ? 'No tickets match your current filters or search keywords. Try adjusting or clearing your search criteria.'
                    : 'Create a support request when you need help from HR regarding salary, attendance, leave, or documents.'}
                </p>

                {isFiltered ? (
                  <button
                    onClick={handleResetFilters}
                    className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Clear All Filters</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700 transition-all cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                    <span>New Support Request</span>
                  </button>
                )}
              </div>
            ) : (
              <div>
                {/* DESKTOP TABLE VIEW (>= 640px) */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-700 font-extrabold uppercase tracking-wider text-[11px]">
                      <tr>
                        <th className="py-3.5 px-4">Ticket ID</th>
                        <th className="py-3.5 px-4">Subject & Description</th>
                        <th className="py-3.5 px-4">Request Type</th>
                        <th className="py-3.5 px-4">Priority</th>
                        <th className="py-3.5 px-4">Assigned HR</th>
                        <th className="py-3.5 px-4">Status</th>
                        <th className="py-3.5 px-4">Created Date</th>
                        <th className="py-3.5 px-5 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {tickets.map((t) => {
                        const tckNo = t.ticketNo || (t as any).ticketNumber || `HR-${t.id.slice(-6).toUpperCase()}`;
                        const reqType = t.requestType || t.category || 'General HR Query';
                        const assigneeName = t.assignedToName || t.assignee || 'Unassigned';

                        return (
                          <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3.5 px-4 font-mono font-bold text-indigo-600">{tckNo}</td>
                            <td className="py-3.5 px-4 max-w-xs">
                              <div className="font-bold text-slate-900 truncate">{t.subject}</div>
                              <div className="text-[11px] text-slate-400 truncate">{t.description}</div>
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-700 border border-slate-200">
                                {reqType}
                              </span>
                            </td>
                            <td className="py-3.5 px-4">{getPriorityBadge(t.priority)}</td>
                            <td className="py-3.5 px-4">
                              {assigneeName !== 'Unassigned' ? (
                                <div className="flex items-center gap-1.5 text-slate-800 font-bold">
                                  <div className="h-5 w-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-black">
                                    {assigneeName.charAt(0).toUpperCase()}
                                  </div>
                                  <span className="truncate max-w-[120px]">{assigneeName}</span>
                                </div>
                              ) : (
                                <span className="text-[11px] text-slate-400 italic">Unassigned</span>
                              )}
                            </td>
                            <td className="py-3.5 px-4">{getStatusBadge(t.status)}</td>
                            <td className="py-3.5 px-4 font-mono text-slate-500">
                              {new Date(t.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                            </td>
                            <td className="py-3.5 px-5 text-right">
                              <button
                                onClick={() => setActiveDetailTicketId(t.id)}
                                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-all cursor-pointer shadow-2xs"
                              >
                                <Eye className="h-3.5 w-3.5 text-slate-400 group-hover:text-indigo-600" />
                                <span>View Details</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* MOBILE CARD VIEW (< 640px) */}
                <div className="block sm:hidden divide-y divide-slate-100">
                  {tickets.map((t) => {
                    const tckNo = t.ticketNo || (t as any).ticketNumber || `HR-${t.id.slice(-6).toUpperCase()}`;
                    const reqType = t.requestType || t.category || 'General HR Query';
                    const assigneeName = t.assignedToName || t.assignee || 'Unassigned';

                    return (
                      <div key={t.id} className="p-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="font-mono font-extrabold text-xs text-indigo-600 block">{tckNo}</span>
                            <h3 className="font-extrabold text-sm text-slate-900 mt-0.5">{t.subject}</h3>
                          </div>
                          <div>{getStatusBadge(t.status)}</div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700 border border-slate-200">
                            {reqType}
                          </span>
                          {getPriorityBadge(t.priority)}
                        </div>

                        <p className="text-xs text-slate-600 line-clamp-2 italic bg-slate-50/50 p-2 rounded-lg border border-slate-100">
                          {t.description}
                        </p>

                        <div className="flex items-center justify-between pt-1">
                          <div className="text-[11px] text-slate-400 font-mono">
                            Assigned: <strong className="text-slate-700 font-sans">{assigneeName}</strong>
                          </div>
                          <button
                            onClick={() => setActiveDetailTicketId(t.id)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-800 transition-colors cursor-pointer"
                          >
                            <Eye className="h-3.5 w-3.5 text-indigo-400" />
                            <span>View Details</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* PAGINATION BAR */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between border-t border-slate-200/80 px-5 py-3 text-xs text-slate-500 bg-slate-50/40">
                    <span>
                      Page <strong className="text-slate-800">{currentPage}</strong> of{' '}
                      <strong className="text-slate-800">{totalPages}</strong>
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition-colors cursor-pointer"
                      >
                        <ChevronLeft className="h-3.5 w-3.5" />
                        <span>Previous</span>
                      </button>
                      <button
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition-colors cursor-pointer"
                      >
                        <span>Next</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* CREATE SUPPORT REQUEST MODAL */}
        <CreateHrTicketModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          isHrUser={false}
          onTicketCreated={(newTicket) => {
            setIsCreateModalOpen(false);
            const tNo = newTicket.ticketNo || (newTicket as any).ticketNumber || 'Ticket';
            showToast(`Support request ${tNo} created successfully!`);
            fetchTicketsFromApi(true);
          }}
        />

        {/* TICKET DETAILS & DISCUSSION MODAL */}
        <TicketDetailModal
          isOpen={!!activeDetailTicketId}
          onClose={() => setActiveDetailTicketId(null)}
          ticketId={activeDetailTicketId}
          isHrUser={false}
          onTicketUpdated={() => {
            fetchTicketsFromApi();
          }}
        />
      </AdminLayout>
    </AuthGuard>
  );
}
