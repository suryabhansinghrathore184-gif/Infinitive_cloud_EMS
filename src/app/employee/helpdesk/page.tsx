'use client';

import React, { useState, useEffect } from 'react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { AdminLayout } from '@/components/layout/AdminLayout';
import {
  HelpCircle,
  Plus,
  Search,
  RefreshCw,
  CheckCircle2,
  Eye,
  Loader2,
  AlertCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  MessageSquare,
  FileText,
} from 'lucide-react';
import { HrTicket } from '@/types/admin';

// Modals
import { CreateHrTicketModal } from '@/components/modals/CreateHrTicketModal';
import { TicketDetailModal } from '@/components/modals/TicketDetailModal';

export default function EmployeeHelpdeskPage() {
  // Filters & State
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(15);

  // Data State from MongoDB
  const [tickets, setTickets] = useState<HrTicket[]>([]);
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
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [activeDetailTicketId, setActiveDetailTicketId] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const fetchTicketsFromApi = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const params = new URLSearchParams();
      if (selectedStatus !== 'All') params.append('status', selectedStatus);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());
      params.append('page', String(currentPage));
      params.append('limit', String(pageSize));

      const res = await fetch(`/api/v1/hr-requests?${params.toString()}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to fetch your support tickets');
      }

      setTickets(data.tickets || []);
      setStatusCounts(data.statusCounts || { open: 0, assigned: 0, inProgress: 0, resolved: 0, closed: 0, total: 0 });
      setTotalFilteredCount(data.count || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err: any) {
      console.error('Error loading employee tickets:', err);
      setErrorMsg(err.message || 'Unable to load support tickets');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTicketsFromApi();
  }, [selectedStatus, searchQuery, currentPage, pageSize]);

  const handleResetFilters = () => {
    setSelectedStatus('All');
    setSearchQuery('');
    setCurrentPage(1);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Open':
        return <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 border border-blue-200">Open</span>;
      case 'Assigned':
        return <span className="inline-flex items-center rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-semibold text-purple-700 border border-purple-200">Assigned</span>;
      case 'In Progress':
        return <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 border border-amber-200">In Progress</span>;
      case 'Resolved':
        return <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">Resolved</span>;
      case 'Closed':
        return <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600 border border-slate-300">Closed</span>;
      default:
        return <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600 border border-slate-200">{status}</span>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'Urgent':
        return <span className="inline-flex items-center rounded-md bg-rose-100 px-2 py-0.5 text-[11px] font-bold text-rose-800">Urgent</span>;
      case 'High':
        return <span className="inline-flex items-center rounded-md bg-orange-100 px-2 py-0.5 text-[11px] font-semibold text-orange-800">High</span>;
      case 'Medium':
        return <span className="inline-flex items-center rounded-md bg-blue-100 px-2 py-0.5 text-[11px] font-semibold text-blue-800">Medium</span>;
      default:
        return <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">Low</span>;
    }
  };

  return (
    <AuthGuard allowedRoles={['Employee', 'Super Admin', 'Admin', 'HR Manager', 'Payroll Manager']}>
      <AdminLayout
        pageTitle="Employee Helpdesk"
        breadcrumbs={[
          { label: 'My Workspace', href: '/employee/dashboard' },
          { label: 'Helpdesk & Support', href: '/employee/helpdesk' },
        ]}
      >
        {/* Toast Alert */}
        {toastMessage && (
          <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm text-white shadow-2xl animate-in fade-in slide-in-from-bottom-5">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Page Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <HelpCircle className="h-6 w-6 text-indigo-600" />
              My HR Support Requests
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Submit tickets for salary queries, attendance corrections, leave requests, or general HR assistance.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchTicketsFromApi}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-200 transition hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4" />
              New Support Request
            </button>
          </div>
        </div>

        {/* Lifecycle Stats Cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <div
            onClick={() => setSelectedStatus('Open')}
            className={`cursor-pointer rounded-2xl border p-4 shadow-sm transition ${
              selectedStatus === 'Open' ? 'border-blue-500 bg-blue-50/50 ring-2 ring-blue-500/20' : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-semibold text-blue-600">Open Tickets</span>
              <Clock className="h-4 w-4 text-blue-500" />
            </div>
            <p className="mt-2 text-2xl font-black text-slate-900">{statusCounts.open}</p>
            <p className="mt-0.5 text-[10px] text-slate-400">Awaiting HR pickup</p>
          </div>

          <div
            onClick={() => setSelectedStatus('In Progress')}
            className={`cursor-pointer rounded-2xl border p-4 shadow-sm transition ${
              selectedStatus === 'In Progress' ? 'border-amber-500 bg-amber-50/50 ring-2 ring-amber-500/20' : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-semibold text-amber-600">In Progress</span>
              <RefreshCw className="h-4 w-4 text-amber-500" />
            </div>
            <p className="mt-2 text-2xl font-black text-slate-900">{statusCounts.assigned + statusCounts.inProgress}</p>
            <p className="mt-0.5 text-[10px] text-slate-400">Being processed by HR</p>
          </div>

          <div
            onClick={() => setSelectedStatus('Resolved')}
            className={`cursor-pointer rounded-2xl border p-4 shadow-sm transition ${
              selectedStatus === 'Resolved' ? 'border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500/20' : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-semibold text-emerald-600">Resolved</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            </div>
            <p className="mt-2 text-2xl font-black text-slate-900">{statusCounts.resolved}</p>
            <p className="mt-0.5 text-[10px] text-slate-400">Solution provided</p>
          </div>

          <div
            onClick={() => setSelectedStatus('Closed')}
            className={`cursor-pointer rounded-2xl border p-4 shadow-sm transition ${
              selectedStatus === 'Closed' ? 'border-slate-400 bg-slate-100 ring-2 ring-slate-400/20' : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-semibold text-slate-600">Closed</span>
              <FileText className="h-4 w-4 text-slate-500" />
            </div>
            <p className="mt-2 text-2xl font-black text-slate-900">{statusCounts.closed}</p>
            <p className="mt-0.5 text-[10px] text-slate-400">Archived tickets</p>
          </div>

          <div
            onClick={() => setSelectedStatus('All')}
            className={`cursor-pointer rounded-2xl border p-4 shadow-sm transition ${
              selectedStatus === 'All' ? 'border-indigo-500 bg-indigo-50/50 ring-2 ring-indigo-500/20' : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-semibold text-indigo-600">Total Created</span>
              <HelpCircle className="h-4 w-4 text-indigo-500" />
            </div>
            <p className="mt-2 text-2xl font-black text-slate-900">{statusCounts.total}</p>
            <p className="mt-0.5 text-[10px] text-slate-400">All submitted requests</p>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search ticket #, subject title, or description..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-4 py-2 text-xs font-medium text-slate-800 placeholder-slate-400 transition focus:border-indigo-500 focus:bg-white focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setCurrentPage(1);
                }}
                className="rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-medium text-slate-700 transition focus:border-indigo-500 focus:bg-white focus:outline-none"
              >
                <option value="All">All Statuses</option>
                <option value="Open">Open</option>
                <option value="Assigned">Assigned</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
                <option value="Closed">Closed</option>
              </select>

              {(selectedStatus !== 'All' || searchQuery !== '') && (
                <button
                  onClick={handleResetFilters}
                  className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Reset
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Tickets Table / List */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mb-2" />
              <p className="text-xs font-semibold text-slate-600">Loading your tickets from MongoDB...</p>
            </div>
          ) : tickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <HelpCircle className="h-12 w-12 text-slate-300 mb-3" />
              <p className="text-sm font-bold text-slate-700">No HR requests found</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm text-center">
                {searchQuery || selectedStatus !== 'All'
                  ? 'No tickets match your current filters. Try resetting your search filters.'
                  : 'You have not submitted any HR support tickets yet. Click "New Support Request" above to get started.'}
              </p>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-md hover:bg-indigo-700"
              >
                <Plus className="h-4 w-4" />
                Submit New Ticket
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-4 py-3.5">Ticket ID</th>
                    <th className="px-4 py-3.5">Subject & Description</th>
                    <th className="px-4 py-3.5">Category</th>
                    <th className="px-4 py-3.5">Priority</th>
                    <th className="px-4 py-3.5">Assigned HR</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-4 py-3.5">Created Date</th>
                    <th className="px-4 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {tickets.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-4 py-3.5 font-mono text-[11px] font-bold text-indigo-600">
                        {t.ticketNumber}
                      </td>
                      <td className="px-4 py-3.5 max-w-xs">
                        <div className="font-semibold text-slate-900 truncate">{t.subject}</div>
                        <div className="text-[11px] text-slate-400 truncate">{t.description}</div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                          {t.requestType}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">{getPriorityBadge(t.priority)}</td>
                      <td className="px-4 py-3.5">
                        {t.assignedToName ? (
                          <div className="flex items-center gap-1.5 text-slate-800 font-medium">
                            <span className="h-5 w-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-bold">
                              {t.assignedToName.charAt(0)}
                            </span>
                            <span className="truncate max-w-[120px]">{t.assignedToName}</span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Unassigned</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">{getStatusBadge(t.status)}</td>
                      <td className="px-4 py-3.5 text-slate-500 text-[11px]">
                        {new Date(t.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <button
                          onClick={() => setActiveDetailTicketId(t.id)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm"
                        >
                          <Eye className="h-3.5 w-3.5 text-indigo-600" />
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Footer */}
          {tickets.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200 bg-slate-50/50 px-4 py-3 text-xs text-slate-500">
              <div>
                Showing <span className="font-bold text-slate-800">{tickets.length}</span> of{' '}
                <span className="font-bold text-slate-800">{totalFilteredCount}</span> support requests
              </div>
              <div className="flex items-center gap-2">
                <button
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 font-semibold text-slate-700 disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Prev
                </button>
                <span className="px-2 font-medium text-slate-700">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 font-semibold text-slate-700 disabled:opacity-40"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modals */}
        <CreateHrTicketModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          isHrUser={false}
          onTicketCreated={(newTicket) => {
            setIsCreateModalOpen(false);
            showToast(`Support request ${newTicket.ticketNumber} created successfully!`);
            fetchTicketsFromApi();
          }}
        />

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
