'use client';

import React, { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { useEmsStore } from '@/store/emsStore';
import {
  HelpCircle,
  Plus,
  Search,
  Filter,
  RefreshCw,
  CheckCircle2,
  UserCheck,
  Eye,
  Loader2,
  AlertCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
} from 'lucide-react';
import { HrTicket, HrTicketRequestType, Employee } from '@/types/admin';

// Modals
import { CreateHrTicketModal } from '@/components/modals/CreateHrTicketModal';
import { AssignTicketModal } from '@/components/modals/AssignTicketModal';
import { TicketDetailModal } from '@/components/modals/TicketDetailModal';

export default function HelpdeskPage() {
  const { state } = useEmsStore();

  // Filter & Search State
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedRequestType, setSelectedRequestType] = useState<string>('All');
  const [selectedPriority, setSelectedPriority] = useState<string>('All');
  const [selectedAssignee, setSelectedAssignee] = useState<string>('All');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('All');
  const [selectedDateRange, setSelectedDateRange] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);

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
  const [assigningTicket, setAssigningTicket] = useState<HrTicket | null>(null);
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
      if (selectedRequestType !== 'All') params.append('requestType', selectedRequestType);
      if (selectedPriority !== 'All') params.append('priority', selectedPriority);
      if (selectedAssignee !== 'All') params.append('assignedToId', selectedAssignee);
      if (selectedDepartment !== 'All') params.append('department', selectedDepartment);
      if (selectedDateRange !== 'All') params.append('dateRange', selectedDateRange);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());
      params.append('page', String(currentPage));
      params.append('limit', String(pageSize));

      const res = await fetch(`/api/v1/hr-requests?${params.toString()}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to fetch support tickets');
      }

      setTickets(data.tickets || []);
      setStatusCounts(data.statusCounts || { open: 0, assigned: 0, inProgress: 0, resolved: 0, closed: 0, total: 0 });
      setTotalFilteredCount(data.count || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err: any) {
      console.error('Error loading tickets:', err);
      setErrorMsg(err.message || 'Unable to load HR support requests');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTicketsFromApi();
  }, [
    selectedStatus,
    selectedRequestType,
    selectedPriority,
    selectedAssignee,
    selectedDepartment,
    selectedDateRange,
    searchQuery,
    currentPage,
    pageSize,
  ]);

  const handleClearFilters = () => {
    setSelectedStatus('All');
    setSelectedRequestType('All');
    setSelectedPriority('All');
    setSelectedAssignee('All');
    setSelectedDepartment('All');
    setSelectedDateRange('All');
    setSearchQuery('');
    setCurrentPage(1);
  };

  const hrEmployees = state.employees || [];

  const getPriorityBadgeClass = (priority: string) => {
    switch (priority) {
      case 'Urgent':
        return 'bg-rose-100 text-rose-800 border-rose-200 font-bold';
      case 'High':
        return 'bg-amber-100 text-amber-800 border-amber-200 font-semibold';
      case 'Medium':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Open':
        return 'bg-blue-100 text-blue-800 border-blue-200 font-semibold';
      case 'Assigned':
        return 'bg-purple-100 text-purple-800 border-purple-200 font-semibold';
      case 'In Progress':
        return 'bg-amber-100 text-amber-800 border-amber-200 font-semibold';
      case 'Resolved':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200 font-semibold';
      case 'Closed':
        return 'bg-slate-200 text-slate-700 border-slate-300 font-medium';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const requestTypes: HrTicketRequestType[] = [
    'Salary Issue',
    'Attendance Correction',
    'Leave Issue',
    'Document Request',
    'Payroll Issue',
    'Profile Correction',
    'IT/Asset Request',
    'General HR Query',
  ];

  return (
    <AdminLayout
      pageTitle="HR Helpdesk & Ticketing"
      breadcrumbs={[{ label: 'Helpdesk', href: '/admin/helpdesk' }]}
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed right-6 top-20 z-50 flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs text-white shadow-xl animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Employee Support Tickets</h2>
          <p className="text-xs text-slate-500">
            Resolve salary queries, attendance corrections, IT requests, and general HR tickets.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchTicketsFromApi()}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-indigo-600 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-4 py-2 text-xs font-bold text-white shadow-md shadow-indigo-600/20 transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>+ Create HR Request</span>
          </button>
        </div>
      </div>

      {/* Ticket Lifecycle Summary Cards */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm text-xs space-y-3">
        <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[10px]">Ticket Resolution Lifecycle</h4>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {[
            { label: 'Open', count: statusCounts.open, color: 'border-blue-200 bg-blue-50/70 text-blue-900' },
            { label: 'Assigned', count: statusCounts.assigned, color: 'border-purple-200 bg-purple-50/70 text-purple-900' },
            { label: 'In Progress', count: statusCounts.inProgress, color: 'border-amber-200 bg-amber-50/70 text-amber-900' },
            { label: 'Resolved', count: statusCounts.resolved, color: 'border-emerald-200 bg-emerald-50/70 text-emerald-900' },
            { label: 'Closed', count: statusCounts.closed, color: 'border-slate-200 bg-slate-100 text-slate-700' },
          ].map((sc) => {
            const isSelected = selectedStatus === sc.label;
            return (
              <button
                key={sc.label}
                onClick={() => {
                  setSelectedStatus(isSelected ? 'All' : sc.label);
                  setCurrentPage(1);
                }}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center transition-all ${sc.color} ${
                  isSelected ? 'ring-2 ring-indigo-600 shadow-md font-bold' : 'hover:opacity-90'
                }`}
              >
                <span className="text-xl font-black">{sc.count}</span>
                <span className="text-[11px] font-semibold mt-0.5">{sc.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="flex flex-col gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-xs">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search Ticket ID, Employee Name, Subject..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
          </div>

          <button
            onClick={handleClearFilters}
            className="text-xs font-semibold text-slate-500 hover:text-indigo-600 underline shrink-0"
          >
            Clear Filters
          </button>
        </div>

        {/* Dropdown Filters */}
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 pt-1">
          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="All">All Statuses</option>
            <option value="Open">Open</option>
            <option value="Assigned">Assigned</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
            <option value="Closed">Closed</option>
          </select>

          {/* Request Type Filter */}
          <select
            value={selectedRequestType}
            onChange={(e) => {
              setSelectedRequestType(e.target.value);
              setCurrentPage(1);
            }}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="All">All Categories</option>
            {requestTypes.map((rt) => (
              <option key={rt} value={rt}>
                {rt}
              </option>
            ))}
          </select>

          {/* Priority Filter */}
          <select
            value={selectedPriority}
            onChange={(e) => {
              setSelectedPriority(e.target.value);
              setCurrentPage(1);
            }}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="All">All Priorities</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Urgent">Urgent</option>
          </select>

          {/* Assigned HR Filter */}
          <select
            value={selectedAssignee}
            onChange={(e) => {
              setSelectedAssignee(e.target.value);
              setCurrentPage(1);
            }}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="All">All Assignees</option>
            {hrEmployees.map((hr) => (
              <option key={hr.employeeId || hr.id} value={hr.employeeId || hr.id}>
                {`${hr.firstName || ''} ${hr.lastName || ''}`.trim() || 'HR Staff'}
              </option>
            ))}
          </select>

          {/* Department Filter */}
          <select
            value={selectedDepartment}
            onChange={(e) => {
              setSelectedDepartment(e.target.value);
              setCurrentPage(1);
            }}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="All">All Depts</option>
            {state.departments.map((d) => (
              <option key={d.id} value={d.name}>
                {d.name}
              </option>
            ))}
          </select>

          {/* Date Range Filter */}
          <select
            value={selectedDateRange}
            onChange={(e) => {
              setSelectedDateRange(e.target.value);
              setCurrentPage(1);
            }}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="All">All Dates</option>
            <option value="Today">Today</option>
            <option value="Last 7 days">Last 7 days</option>
            <option value="Last 30 days">Last 30 days</option>
          </select>
        </div>
      </div>

      {/* Tickets Table Container */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col min-h-[400px]">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            <span className="text-xs font-medium">Loading HR tickets from database...</span>
          </div>
        ) : errorMsg ? (
          <div className="p-8 text-center text-xs text-red-600 space-y-3">
            <AlertCircle className="w-8 h-8 mx-auto text-red-500" />
            <p>{errorMsg}</p>
            <button onClick={() => fetchTicketsFromApi()} className="px-4 py-2 bg-slate-900 text-white font-bold rounded-xl">
              Retry
            </button>
          </div>
        ) : tickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <HelpCircle className="h-6 w-6" />
            </div>
            <h4 className="mt-3 text-sm font-bold text-slate-800">
              {statusCounts.total === 0 ? 'No HR requests yet' : 'No HR requests found for the selected filters'}
            </h4>
            <p className="mt-1 max-w-xs text-xs text-slate-500">
              {statusCounts.total === 0
                ? 'Support requests and tickets submitted by employees or managers will display here.'
                : 'Try adjusting your search keyword or clearing status and date filters.'}
            </p>

            {statusCounts.total > 0 && (
              <button
                onClick={handleClearFilters}
                className="mt-4 px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl text-xs shadow-md shadow-indigo-600/20"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="flex-1 flex flex-col justify-between">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                    <th className="px-4 py-3.5">Ticket ID</th>
                    <th className="px-4 py-3.5">Employee</th>
                    <th className="px-4 py-3.5">Request Type</th>
                    <th className="px-4 py-3.5">Subject</th>
                    <th className="px-4 py-3.5">Assignee</th>
                    <th className="px-4 py-3.5">Priority</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-4 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tickets.map((tck) => (
                    <tr key={tck.id} className="hover:bg-indigo-50/40 transition-colors">
                      <td className="px-4 py-3.5 font-mono font-bold text-indigo-600">{tck.ticketNo}</td>
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-slate-900">{tck.creatorName}</div>
                        <div className="text-[10px] text-slate-400">{tck.employeeId} {tck.department ? `• ${tck.department}` : ''}</div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="rounded-md bg-indigo-50 border border-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-700">
                          {tck.requestType}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-700 max-w-xs truncate font-medium">{tck.subject}</td>
                      <td className="px-4 py-3.5 text-slate-600 font-medium">
                        {tck.assignedToName && tck.assignedToName !== 'Unassigned' ? (
                          <span className="text-indigo-900 font-bold">{tck.assignedToName}</span>
                        ) : (
                          <span className="text-slate-400 italic">Unassigned</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] border ${getPriorityBadgeClass(tck.priority)}`}>
                          {tck.priority}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] border ${getStatusBadgeClass(tck.status)}`}>
                          {tck.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right space-x-1">
                        <button
                          onClick={() => setAssigningTicket(tck)}
                          title="Assign HR Staff"
                          className="rounded-lg bg-slate-100 p-1.5 text-slate-600 hover:bg-indigo-100 hover:text-indigo-700 transition-colors"
                        >
                          <UserCheck className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setActiveDetailTicketId(tck.id)}
                          title="View Details"
                          className="rounded-lg bg-indigo-600 p-1.5 text-white hover:bg-indigo-700 transition-colors shadow-sm"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <span>Rows per page:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-2 py-1 bg-white border border-slate-200 rounded-lg font-medium text-slate-700"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span className="ml-2 text-slate-400">
                  Showing {totalFilteredCount > 0 ? (currentPage - 1) * pageSize + 1 : 0} to{' '}
                  {Math.min(currentPage * pageSize, totalFilteredCount)} of {totalFilteredCount} tickets
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-white disabled:opacity-40 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="font-semibold text-slate-700">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-white disabled:opacity-40 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateHrTicketModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        employees={hrEmployees}
        isHrUser={true}
        onTicketCreated={(newTicket) => {
          fetchTicketsFromApi();
          showToast(`HR Ticket ${newTicket.ticketNo} created successfully.`);
        }}
      />

      <AssignTicketModal
        isOpen={!!assigningTicket}
        onClose={() => setAssigningTicket(null)}
        ticket={assigningTicket}
        hrStaffList={hrEmployees}
        onAssigned={(tNo, assignee) => {
          fetchTicketsFromApi();
          showToast(`Ticket ${tNo} assigned to ${assignee}`);
        }}
      />

      <TicketDetailModal
        isOpen={!!activeDetailTicketId}
        onClose={() => setActiveDetailTicketId(null)}
        ticketId={activeDetailTicketId}
        isHrUser={true}
        hrStaffList={hrEmployees}
        onTicketUpdated={() => {
          fetchTicketsFromApi();
        }}
      />
    </AdminLayout>
  );
}
