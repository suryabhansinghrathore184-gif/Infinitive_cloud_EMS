'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import {
  CalendarDays,
  CheckCircle2,
  Plus,
  CalendarOff,
  Search,
  Filter,
  RefreshCw,
  Eye,
  Check,
  X,
  Paperclip,
  Download,
  AlertCircle,
  Clock,
  UserCheck,
  FileText,
  Trash2,
  Edit2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { AddLeaveTypeModal } from '@/components/modals/AddLeaveTypeModal';

interface LeaveTypeDoc {
  _id?: string;
  id: string;
  name: string;
  code: string;
  allowanceDays: number;
  isPaid: boolean;
  description?: string;
  active?: boolean;
}

interface LeaveRequestItem {
  _id: string;
  id: string;
  employeeId: string;
  employeeName: string;
  avatar?: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  durationDays: number;
  reason: string;
  requestedDate: string;
  approver: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';
  rejectionReason?: string;
  attachmentFileId?: string;
  attachmentName?: string;
  approvedBy?: string;
  rejectedBy?: string;
}

interface StatsData {
  pending: number;
  approved: number;
  rejected: number;
  cancelled: number;
  total: number;
  onLeaveToday: number;
  approvedThisMonth: number;
}

export default function AdminLeavePage() {
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Stats & Leave Types
  const [stats, setStats] = useState<StatsData>({
    pending: 0,
    approved: 0,
    rejected: 0,
    cancelled: 0,
    total: 0,
    onLeaveToday: 0,
    approvedThisMonth: 0,
  });
  const [leaveTypes, setLeaveTypes] = useState<LeaveTypeDoc[]>([]);

  // Requests Table & Pagination
  const [requests, setRequests] = useState<LeaveRequestItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [leaveTypeFilter, setLeaveTypeFilter] = useState('All');

  // Modals state
  const [isAddLeaveTypeOpen, setIsAddLeaveTypeOpen] = useState(false);
  const [editingLeaveType, setEditingLeaveType] = useState<LeaveTypeDoc | null>(null);

  const [selectedRequest, setSelectedRequest] = useState<LeaveRequestItem | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');

  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);

  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Fetch Stats & Leave Types
  const fetchMetadata = useCallback(async () => {
    try {
      const [statsRes, typesRes] = await Promise.all([
        fetch('/api/v1/leave/stats'),
        fetch('/api/v1/leave/types'),
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        if (statsData.success && statsData.data) {
          setStats(statsData.data);
        }
      }

      if (typesRes.ok) {
        const typesData = await typesRes.json();
        if (typesData.success && Array.isArray(typesData.data)) {
          setLeaveTypes(typesData.data);
        }
      }
    } catch (err) {
      console.error('Error fetching leave metadata:', err);
    }
  }, []);

  // Fetch Requests Feed
  const fetchRequests = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const queryParams = new URLSearchParams({
        page: String(page),
        limit: '10',
      });
      if (searchTerm) queryParams.set('search', searchTerm);
      if (statusFilter !== 'All') queryParams.set('status', statusFilter);
      if (leaveTypeFilter !== 'All') queryParams.set('leaveType', leaveTypeFilter);

      const res = await fetch(`/api/v1/leave?${queryParams.toString()}`);
      if (res.ok) {
        const result = await res.json();
        if (result.success && result.data) {
          setRequests(result.data.leaves || []);
          setTotalPages(result.data.pagination?.totalPages || 1);
          setTotalCount(result.data.pagination?.total || 0);
        }
      }
    } catch (err) {
      console.error('Error fetching leave requests:', err);
      showToast('Failed to load leave requests.', 'error');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [page, searchTerm, statusFilter, leaveTypeFilter]);

  useEffect(() => {
    fetchMetadata();
    fetchRequests();
  }, [fetchMetadata, fetchRequests]);

  // Handle Save New Leave Type
  const handleSaveLeaveType = async (lt: { name: string; description: string; allowanceDays: number; isPaid: boolean }) => {
    try {
      const res = await fetch('/api/v1/leave/types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lt),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || `Leave type "${lt.name}" created!`);
        fetchMetadata();
        setIsAddLeaveTypeOpen(false);
      } else {
        showToast(data.message || 'Failed to add leave type.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error creating leave type.', 'error');
    }
  };

  // Handle Update Leave Type
  const handleUpdateLeaveType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLeaveType) return;
    try {
      const res = await fetch(`/api/v1/leave/types/${editingLeaveType.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editingLeaveType.name,
          allowanceDays: editingLeaveType.allowanceDays,
          isPaid: editingLeaveType.isPaid,
          description: editingLeaveType.description,
          active: editingLeaveType.active !== false,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Leave type updated successfully!');
        fetchMetadata();
        setEditingLeaveType(null);
      } else {
        showToast(data.message || 'Failed to update leave type.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error updating leave type.', 'error');
    }
  };

  // Handle Delete Leave Type
  const handleDeleteLeaveType = async (id: string) => {
    if (!confirm('Are you sure you want to remove or deactivate this leave type?')) return;
    try {
      const res = await fetch(`/api/v1/leave/types/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || 'Leave type deleted!');
        fetchMetadata();
      } else {
        showToast(data.message || 'Failed to delete leave type.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error deleting leave type.', 'error');
    }
  };

  // Handle Action (Approve / Reject / Cancel)
  const executeStatusChange = async (targetStatus: 'Approved' | 'Rejected' | 'Cancelled', reason?: string) => {
    if (!selectedRequest) return;
    setIsSubmittingAction(true);
    try {
      const res = await fetch(`/api/v1/leave/${selectedRequest._id || selectedRequest.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: targetStatus,
          rejectionReason: reason,
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast(data.message || `Leave request status updated to ${targetStatus}`);
        setApproveModalOpen(false);
        setRejectModalOpen(false);
        setCancelModalOpen(false);
        setDetailModalOpen(false);
        setSelectedRequest(null);
        setRejectionReasonInput('');
        fetchMetadata();
        fetchRequests();
      } else {
        showToast(data.message || `Failed to set status to ${targetStatus}`, 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error processing request.', 'error');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  return (
    <AdminLayout
      pageTitle="Leave Management"
      breadcrumbs={[{ label: 'Leave', href: '/admin/leave' }]}
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed right-6 top-20 z-50 flex items-center gap-2 rounded-xl px-4 py-3 text-xs text-white shadow-2xl animate-fade-in ${
            toastType === 'success' ? 'bg-slate-900 border border-emerald-500/40' : 'bg-rose-950 border border-rose-500/40'
          }`}
        >
          {toastType === 'success' ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          ) : (
            <AlertCircle className="h-4 w-4 text-rose-400" />
          )}
          <span className="font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Leave Approvals & Policies</h2>
          <p className="text-xs text-slate-500">
            Manage employee leave applications, real-time balances, and organization time-off policies
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              fetchMetadata();
              fetchRequests();
            }}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-xs hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => setIsAddLeaveTypeOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-md hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            <span>+ Add Leave Type</span>
          </button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Actionable Pending</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-extrabold text-amber-600">{stats.pending}</p>
          <p className="mt-0.5 text-[10px] text-slate-400">Awaiting manager/HR approval</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">On Leave Today</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <UserCheck className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-extrabold text-emerald-600">{stats.onLeaveToday}</p>
          <p className="mt-0.5 text-[10px] text-slate-400">Employees currently off</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Approved This Month</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-extrabold text-indigo-600">{stats.approvedThisMonth}</p>
          <p className="mt-0.5 text-[10px] text-slate-400">Approved time-off applications</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Applications</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
              <FileText className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-extrabold text-slate-900">{stats.total}</p>
          <p className="mt-0.5 text-[10px] text-slate-400">All recorded applications</p>
        </div>
      </div>

      {/* Leave Types Overview */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between border-b pb-3 mb-3">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Company Leave Policy Allowances
            </h3>
            <p className="text-[11px] text-slate-500">
              Active leave categories and annual credit limits configured for employees
            </p>
          </div>
        </div>

        {leaveTypes.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-xs text-slate-500">
            <p className="font-semibold text-slate-700">No leave types configured yet.</p>
            <p className="mt-1">Click &quot;+ Add Leave Type&quot; above to configure company leave allowances.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {leaveTypes.map((type) => (
              <div
                key={type.id || type._id}
                className="relative flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 hover:border-slate-300 hover:bg-white transition-all shadow-2xs"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-900">{type.name}</h4>
                      <span className="text-[10px] font-bold text-slate-400">[{type.code}]</span>
                    </div>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        type.isPaid
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : 'bg-rose-100 text-rose-800 border border-rose-200'
                      }`}
                    >
                      {type.isPaid ? 'Paid Off' : 'Unpaid / LOP'}
                    </span>
                  </div>

                  <p className="mt-2 text-base font-black text-blue-600">{type.allowanceDays} Days <span className="text-xs font-medium text-slate-400">/ Year</span></p>

                  {type.description && (
                    <p className="mt-1 text-[11px] text-slate-500 line-clamp-2">{type.description}</p>
                  )}
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-slate-200/80 pt-2 text-[10px]">
                  <span className="text-slate-400 font-medium">Status: {type.active !== false ? 'Active' : 'Inactive'}</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setEditingLeaveType(type)}
                      className="rounded p-1 text-slate-500 hover:bg-slate-200 hover:text-slate-900"
                      title="Edit Leave Type"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteLeaveType(type.id || type._id || '')}
                      className="rounded p-1 text-slate-400 hover:bg-rose-100 hover:text-rose-600"
                      title="Delete Leave Type"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Employee Name, ID, Leave Type, or Reason..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-xs focus:border-blue-500 focus:bg-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs">
            <Filter className="h-3.5 w-3.5 text-slate-500" />
            <span className="font-semibold text-slate-600">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="bg-transparent font-bold text-slate-800 focus:outline-none"
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs">
            <span className="font-semibold text-slate-600">Leave Type:</span>
            <select
              value={leaveTypeFilter}
              onChange={(e) => {
                setLeaveTypeFilter(e.target.value);
                setPage(1);
              }}
              className="bg-transparent font-bold text-slate-800 focus:outline-none"
            >
              <option value="All">All Types</option>
              {leaveTypes.map((t) => (
                <option key={t.id || t.name} value={t.name}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {(statusFilter !== 'All' || leaveTypeFilter !== 'All' || searchTerm) && (
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('All');
                setLeaveTypeFilter('All');
                setPage(1);
              }}
              className="rounded-xl bg-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-300"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Requests Feed Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 p-4">
          <h3 className="text-sm font-bold text-slate-900">
            Pending & Recent Time-Off Applications ({totalCount})
          </h3>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
            <p className="mt-2 text-xs font-medium text-slate-600">Loading leave requests from database...</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <CalendarOff className="h-6 w-6" />
            </div>
            <h4 className="mt-3 text-sm font-bold text-slate-800">No leave requests found</h4>
            <p className="mt-1 max-w-xs text-xs text-slate-500">
              {searchTerm || statusFilter !== 'All'
                ? 'No matching requests for your search or filter criteria.'
                : 'Submitted employee leave applications and time-off requests will appear here.'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-slate-500 font-semibold">
                    <th className="px-4 py-3.5">Employee</th>
                    <th className="px-4 py-3.5">Leave Type</th>
                    <th className="px-4 py-3.5">Dates & Duration</th>
                    <th className="px-4 py-3.5">Reason</th>
                    <th className="px-4 py-3.5">Attachment</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-4 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {requests.map((req) => (
                    <tr key={req._id || req.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              req.avatar ||
                              'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80'
                            }
                            alt={req.employeeName}
                            className="h-8 w-8 rounded-full object-cover border border-slate-200"
                          />
                          <div>
                            <p className="font-bold text-slate-900">{req.employeeName}</p>
                            <p className="text-[10px] text-slate-400">{req.employeeId}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="inline-block font-semibold text-slate-800">{req.leaveType}</span>
                      </td>

                      <td className="px-4 py-3.5">
                        <p className="text-slate-800 font-medium">
                          {req.startDate} <span className="text-slate-400">to</span> {req.endDate}
                        </p>
                        <span className="text-[10px] font-bold text-blue-600">({req.durationDays} Days)</span>
                      </td>

                      <td className="px-4 py-3.5 text-slate-600 max-w-xs truncate" title={req.reason}>
                        {req.reason || 'No reason specified'}
                      </td>

                      <td className="px-4 py-3.5">
                        {req.attachmentFileId ? (
                          <a
                            href={`/api/v1/leave/${req._id || req.id}/attachment/${req.attachmentFileId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2 py-1 text-[11px] font-bold text-blue-700 hover:bg-blue-100"
                          >
                            <Paperclip className="h-3 w-3" />
                            <span className="truncate max-w-[90px]">{req.attachmentName || 'Doc'}</span>
                            <Download className="h-3 w-3 shrink-0" />
                          </a>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">None</span>
                        )}
                      </td>

                      <td className="px-4 py-3.5">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold border ${
                            req.status === 'Approved'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : req.status === 'Rejected'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : req.status === 'Cancelled'
                              ? 'bg-slate-100 text-slate-600 border-slate-300'
                              : 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse'
                          }`}
                        >
                          {req.status}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedRequest(req);
                              setDetailModalOpen(true);
                            }}
                            className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                            title="View Details"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>

                          {req.status === 'Pending' && (
                            <>
                              <button
                                onClick={() => {
                                  setSelectedRequest(req);
                                  setApproveModalOpen(true);
                                }}
                                className="rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-700 shadow-xs"
                              >
                                Approve
                              </button>

                              <button
                                onClick={() => {
                                  setSelectedRequest(req);
                                  setRejectionReasonInput('');
                                  setRejectModalOpen(true);
                                }}
                                className="rounded-lg bg-rose-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-rose-700 shadow-xs"
                              >
                                Reject
                              </button>
                            </>
                          )}

                          {(req.status === 'Pending' || req.status === 'Approved') && (
                            <button
                              onClick={() => {
                                setSelectedRequest(req);
                                setCancelModalOpen(true);
                              }}
                              className="rounded-lg bg-slate-200 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-300"
                              title="Cancel Application"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-xs">
              <p className="text-slate-500">
                Showing <span className="font-bold text-slate-800">{requests.length}</span> of{' '}
                <span className="font-bold text-slate-800">{totalCount}</span> applications
              </p>
              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1 font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                >
                  <ChevronLeft className="h-3.5 w-3.5" /> Previous
                </button>
                <span className="text-slate-700 font-bold">
                  Page {page} of {totalPages}
                </span>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1 font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                >
                  Next <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Add Leave Type Modal */}
      <AddLeaveTypeModal
        isOpen={isAddLeaveTypeOpen}
        onClose={() => setIsAddLeaveTypeOpen(false)}
        onSave={handleSaveLeaveType}
      />

      {/* Edit Leave Type Modal */}
      {editingLeaveType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl text-xs text-slate-800">
            <div className="flex items-center justify-between border-b pb-3 font-bold text-sm text-slate-900">
              <span>Edit Leave Type ({editingLeaveType.code})</span>
              <button onClick={() => setEditingLeaveType(null)} className="rounded p-1 text-slate-400 hover:text-slate-700">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateLeaveType} className="mt-4 space-y-3">
              <div>
                <label className="font-bold text-slate-900">Leave Type Name</label>
                <input
                  type="text"
                  required
                  value={editingLeaveType.name}
                  onChange={(e) => setEditingLeaveType({ ...editingLeaveType, name: e.target.value })}
                  className="mt-1 w-full rounded-xl border p-2.5 bg-slate-50 focus:border-blue-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-900">Annual Allowance (Days)</label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={editingLeaveType.allowanceDays}
                    onChange={(e) => setEditingLeaveType({ ...editingLeaveType, allowanceDays: parseInt(e.target.value) || 0 })}
                    className="mt-1 w-full rounded-xl border p-2.5 bg-slate-50 focus:border-blue-500 focus:bg-white"
                  />
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="editIsPaid"
                    checked={editingLeaveType.isPaid}
                    onChange={(e) => setEditingLeaveType({ ...editingLeaveType, isPaid: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600"
                  />
                  <label htmlFor="editIsPaid" className="font-bold text-slate-900 cursor-pointer">
                    Paid Leave
                  </label>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-900">Description</label>
                <textarea
                  value={editingLeaveType.description || ''}
                  onChange={(e) => setEditingLeaveType({ ...editingLeaveType, description: e.target.value })}
                  rows={3}
                  className="mt-1 w-full rounded-xl border p-2.5 bg-slate-50 focus:border-blue-500 focus:bg-white"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="editIsActive"
                  checked={editingLeaveType.active !== false}
                  onChange={(e) => setEditingLeaveType({ ...editingLeaveType, active: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600"
                />
                <label htmlFor="editIsActive" className="font-semibold text-slate-700 cursor-pointer">
                  Active Category
                </label>
              </div>

              <div className="flex justify-end gap-2 border-t pt-3 mt-4">
                <button
                  type="button"
                  onClick={() => setEditingLeaveType(null)}
                  className="rounded-xl border px-3 py-1.5 font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-4 py-1.5 font-bold text-white shadow-xs hover:bg-blue-700"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Approve Confirmation Modal */}
      {approveModalOpen && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl text-xs text-slate-800">
            <div className="flex items-center gap-2 font-bold text-sm text-emerald-600 border-b pb-3">
              <Check className="h-5 w-5" />
              <span>Approve Leave Application</span>
            </div>

            <div className="my-4 space-y-2 rounded-xl bg-slate-50 p-3.5 border border-slate-200">
              <p><span className="font-bold text-slate-900">Employee:</span> {selectedRequest.employeeName} ({selectedRequest.employeeId})</p>
              <p><span className="font-bold text-slate-900">Leave Category:</span> {selectedRequest.leaveType}</p>
              <p><span className="font-bold text-slate-900">Duration:</span> {selectedRequest.startDate} to {selectedRequest.endDate} ({selectedRequest.durationDays} Days)</p>
              <p><span className="font-bold text-slate-900">Reason:</span> {selectedRequest.reason || 'None'}</p>
            </div>

            <p className="text-slate-600">
              Approving will automatically deduct {selectedRequest.durationDays} day(s) from {selectedRequest.employeeName}&apos;s {selectedRequest.leaveType} leave balance and send a real-time notification.
            </p>

            <div className="flex justify-end gap-2 border-t pt-3 mt-4">
              <button
                disabled={isSubmittingAction}
                onClick={() => setApproveModalOpen(false)}
                className="rounded-xl border px-3 py-1.5 font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                disabled={isSubmittingAction}
                onClick={() => executeStatusChange('Approved')}
                className="rounded-xl bg-emerald-600 px-4 py-1.5 font-bold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-50"
              >
                {isSubmittingAction ? 'Approving...' : 'Confirm Approval'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModalOpen && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl text-xs text-slate-800">
            <div className="flex items-center gap-2 font-bold text-sm text-rose-600 border-b pb-3">
              <X className="h-5 w-5" />
              <span>Reject Leave Application</span>
            </div>

            <div className="my-3 space-y-1.5 rounded-xl bg-rose-50/60 p-3 border border-rose-100">
              <p><span className="font-bold text-slate-900">Employee:</span> {selectedRequest.employeeName}</p>
              <p><span className="font-bold text-slate-900">Leave Type:</span> {selectedRequest.leaveType} ({selectedRequest.durationDays} Days)</p>
            </div>

            <div className="space-y-1 mt-3">
              <label className="font-bold text-slate-900">Rejection Reason *</label>
              <textarea
                required
                placeholder="State clear reasons for rejection (e.g., project deadline overlap, insufficient notice)..."
                value={rejectionReasonInput}
                onChange={(e) => setRejectionReasonInput(e.target.value)}
                rows={3}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs focus:border-rose-500 focus:bg-white"
              />
            </div>

            <div className="flex justify-end gap-2 border-t pt-3 mt-4">
              <button
                disabled={isSubmittingAction}
                onClick={() => setRejectModalOpen(false)}
                className="rounded-xl border px-3 py-1.5 font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                disabled={isSubmittingAction || !rejectionReasonInput.trim()}
                onClick={() => executeStatusChange('Rejected', rejectionReasonInput)}
                className="rounded-xl bg-rose-600 px-4 py-1.5 font-bold text-white shadow-xs hover:bg-rose-700 disabled:opacity-50"
              >
                {isSubmittingAction ? 'Rejecting...' : 'Reject Application'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {cancelModalOpen && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl text-xs text-slate-800">
            <div className="flex items-center gap-2 font-bold text-sm text-slate-800 border-b pb-3">
              <CalendarOff className="h-5 w-5 text-amber-600" />
              <span>Cancel Leave Application</span>
            </div>

            <p className="my-3 text-slate-600">
              Are you sure you want to cancel the leave request for <span className="font-bold text-slate-900">{selectedRequest.employeeName}</span>?
              {selectedRequest.status === 'Approved' && ' Restoring this approved request will add the days back to the employee balance.'}
            </p>

            <div className="flex justify-end gap-2 border-t pt-3 mt-4">
              <button
                disabled={isSubmittingAction}
                onClick={() => setCancelModalOpen(false)}
                className="rounded-xl border px-3 py-1.5 font-semibold text-slate-600 hover:bg-slate-50"
              >
                Keep Request
              </button>
              <button
                disabled={isSubmittingAction}
                onClick={() => executeStatusChange('Cancelled')}
                className="rounded-xl bg-slate-800 px-4 py-1.5 font-bold text-white shadow-xs hover:bg-slate-900 disabled:opacity-50"
              >
                {isSubmittingAction ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Leave Details Modal */}
      {detailModalOpen && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl text-xs text-slate-800">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Leave Application Details</h3>
                <p className="text-[10px] text-slate-400">ID: {selectedRequest._id || selectedRequest.id}</p>
              </div>
              <button onClick={() => setDetailModalOpen(false)} className="rounded-lg p-1 text-slate-400 hover:text-slate-700">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 border border-slate-200">
                <img
                  src={selectedRequest.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80'}
                  alt={selectedRequest.employeeName}
                  className="h-10 w-10 rounded-full object-cover border"
                />
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{selectedRequest.employeeName}</h4>
                  <p className="text-[11px] text-slate-500">Emp ID: {selectedRequest.employeeId}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-2.5">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Leave Type</span>
                  <p className="font-extrabold text-slate-900 mt-0.5">{selectedRequest.leaveType}</p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-2.5">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Duration</span>
                  <p className="font-extrabold text-blue-600 mt-0.5">{selectedRequest.durationDays} Day(s)</p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-2.5">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Start Date</span>
                  <p className="font-bold text-slate-800 mt-0.5">{selectedRequest.startDate}</p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-2.5">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">End Date</span>
                  <p className="font-bold text-slate-800 mt-0.5">{selectedRequest.endDate}</p>
                </div>
              </div>

              <div>
                <span className="font-bold text-slate-900 block mb-1">Reason for Leave:</span>
                <p className="rounded-xl bg-slate-50 p-3 text-slate-700 border border-slate-200">
                  {selectedRequest.reason || 'No specific reason provided.'}
                </p>
              </div>

              {selectedRequest.rejectionReason && (
                <div>
                  <span className="font-bold text-rose-700 block mb-1">Rejection Reason:</span>
                  <p className="rounded-xl bg-rose-50 p-3 text-rose-800 border border-rose-200">
                    {selectedRequest.rejectionReason}
                  </p>
                </div>
              )}

              {selectedRequest.attachmentFileId && (
                <div>
                  <span className="font-bold text-slate-900 block mb-1">Supporting Document:</span>
                  <a
                    href={`/api/v1/leave/${selectedRequest._id || selectedRequest.id}/attachment/${selectedRequest.attachmentFileId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between rounded-xl bg-blue-50 p-3 border border-blue-200 text-blue-800 hover:bg-blue-100"
                  >
                    <div className="flex items-center gap-2">
                      <Paperclip className="h-4 w-4" />
                      <span className="font-bold truncate max-w-xs">{selectedRequest.attachmentName || 'Download Attachment'}</span>
                    </div>
                    <Download className="h-4 w-4 shrink-0" />
                  </a>
                </div>
              )}

              <div className="flex items-center justify-between pt-2 text-[11px] text-slate-400 border-t">
                <span>Requested: {selectedRequest.requestedDate}</span>
                <span>Status: <strong className="text-slate-800">{selectedRequest.status}</strong></span>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t pt-4 mt-4">
              <button
                onClick={() => setDetailModalOpen(false)}
                className="rounded-xl border px-4 py-1.5 font-semibold text-slate-600 hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
