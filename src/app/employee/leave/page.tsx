'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { AdminLayout } from '@/components/layout/AdminLayout';
import {
  CalendarDays,
  CheckCircle2,
  Plus,
  CalendarOff,
  Clock,
  RefreshCw,
  Paperclip,
  Download,
  AlertCircle,
  X,
  FileText,
  Upload,
  ChevronLeft,
  ChevronRight,
  Eye,
  Trash2,
  CheckCheck,
  RotateCcw,
} from 'lucide-react';

interface LeaveBalanceCategory {
  code: string;
  name: string;
  total: number;
  used: number;
  pending: number;
  remaining: number;
  isPaid?: boolean;
}

interface LeaveTypeOption {
  id: string;
  name: string;
  code: string;
  allowanceDays: number;
  isPaid: boolean;
}

interface PersonalLeaveItem {
  _id: string;
  id: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  durationDays: number;
  reason: string;
  requestedDate: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';
  rejectionReason?: string;
  attachmentFileId?: string;
  attachmentName?: string;
  approver?: string;
}

export default function EmployeeLeavePage() {
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  // Balances & Leave Types & Requests
  const [balances, setBalances] = useState<Record<string, LeaveBalanceCategory>>({});
  const [leaveTypes, setLeaveTypes] = useState<LeaveTypeOption[]>([]);
  const [myRequests, setMyRequests] = useState<PersonalLeaveItem[]>([]);

  // Pagination & Filtering
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRequestsCount, setTotalRequestsCount] = useState(0);
  const [pageSize] = useState(15);
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterLeaveType, setFilterLeaveType] = useState('All');

  // Apply Modal state
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [selectedLeaveType, setSelectedLeaveType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');

  // Attachment state
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [uploadedFileId, setUploadedFileId] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modals
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [requestToCancel, setRequestToCancel] = useState<PersonalLeaveItem | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedDetailRequest, setSelectedDetailRequest] = useState<PersonalLeaveItem | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Calculated Duration
  const calculatedDuration = useMemo(() => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) return 0;
    return Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1);
  }, [startDate, endDate]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const params = new URLSearchParams();
      if (filterStatus && filterStatus !== 'All') params.append('status', filterStatus);
      if (filterLeaveType && filterLeaveType !== 'All') params.append('leaveType', filterLeaveType);
      params.append('page', String(currentPage));
      params.append('limit', String(pageSize));

      const [balRes, typesRes, requestsRes] = await Promise.all([
        fetch('/api/v1/leave/balances').catch(() => null),
        fetch('/api/v1/leave/types').catch(() => null),
        fetch(`/api/v1/leave?${params.toString()}`).catch(() => null),
      ]);

      if (balRes && balRes.ok) {
        const balData = await balRes.json();
        if (balData.success && balData.data?.balances) {
          setBalances(balData.data.balances);
        }
      }

      if (typesRes && typesRes.ok) {
        const typesData = await typesRes.json();
        if (typesData.success && Array.isArray(typesData.data)) {
          setLeaveTypes(typesData.data);
          if (typesData.data.length > 0 && !selectedLeaveType) {
            setSelectedLeaveType(typesData.data[0].name);
          }
        }
      }

      if (requestsRes && requestsRes.ok) {
        const reqData = await requestsRes.json();
        if (reqData.success && reqData.data?.leaves) {
          setMyRequests(reqData.data.leaves);
          setTotalRequestsCount(reqData.data.pagination?.total || reqData.data.leaves.length);
          setTotalPages(reqData.data.pagination?.totalPages || 1);
        }
      } else {
        setIsError(true);
      }
    } catch (err) {
      console.error('Error fetching employee leave data:', err);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, [filterStatus, filterLeaveType, currentPage, pageSize, selectedLeaveType]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle File Upload to GridFS
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      showToast('Attachment must be smaller than 10MB.', 'error');
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/v1/leave/upload-attachment', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.success && data.data?.fileId) {
        setUploadedFileId(data.data.fileId);
        setUploadedFileName(data.data.filename);
        setAttachmentFile(file);
        showToast('Document uploaded successfully to GridFS storage!');
      } else {
        showToast(data.message || 'File upload failed.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error uploading file.', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  // Submit Leave Request
  const handleSubmitLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLeaveType || !startDate || !endDate) {
      showToast('Please fill all required fields.', 'error');
      return;
    }

    if (calculatedDuration <= 0) {
      showToast('End date must be after or equal to start date.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/v1/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leaveType: selectedLeaveType,
          startDate,
          endDate,
          durationDays: calculatedDuration,
          reason,
          attachmentFileId: uploadedFileId,
          attachmentName: uploadedFileName,
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast(data.message || 'Leave request submitted successfully.');
        setIsApplyModalOpen(false);
        setStartDate('');
        setEndDate('');
        setReason('');
        setUploadedFileId(null);
        setUploadedFileName(null);
        setAttachmentFile(null);
        fetchData();
      } else {
        showToast(data.message || 'Unable to submit leave request.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Unable to submit leave request.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cancel Personal Leave Request
  const handleCancelRequest = async () => {
    if (!requestToCancel) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/v1/leave/${requestToCancel._id || requestToCancel.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Cancelled' }),
      });

      const data = await res.json();
      if (data.success) {
        showToast('Leave request cancelled successfully.');
        setCancelModalOpen(false);
        setRequestToCancel(null);
        fetchData();
      } else {
        showToast(data.message || 'Unable to cancel the request.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Unable to cancel the request.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetFilters = () => {
    setFilterStatus('All');
    setFilterLeaveType('All');
    setCurrentPage(1);
  };

  const balanceEntries = Object.entries(balances);

  return (
    <AuthGuard allowedRoles={['EMPLOYEE', 'SUPER_ADMIN', 'ADMIN', 'HR', 'MANAGER']}>
      <AdminLayout
        allowedRoles={['EMPLOYEE', 'SUPER_ADMIN', 'ADMIN', 'HR', 'MANAGER']}
        pageTitle="Leave"
        breadcrumbs={[
          { label: 'My Workspace', href: '/employee/dashboard' },
          { label: 'Leave', href: '/employee/leave' },
        ]}
      >
        {/* Toast Alert */}
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

        <div className="space-y-6">
          {/* Page Header */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-slate-950">Leave</h1>
              <p className="text-xs font-medium text-slate-500 mt-0.5">
                Manage your leave balance and requests.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={fetchData}
                disabled={isLoading}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 disabled:opacity-50 transition-all cursor-pointer"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Refresh Data</span>
              </button>
              <button
                onClick={() => setIsApplyModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-indigo-200 hover:bg-indigo-500 transition-all cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Apply for Leave</span>
              </button>
            </div>
          </div>

          {/* Global Error Alert */}
          {isError && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-4 text-xs text-rose-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                <span>Unable to load leave information. Please check your connection.</span>
              </div>
              <button
                onClick={fetchData}
                className="rounded-xl bg-rose-600 px-3 py-1.5 font-bold text-white shadow-xs hover:bg-rose-700 transition-all cursor-pointer"
              >
                Retry
              </button>
            </div>
          )}

          {/* Pulse Skeleton Loading State */}
          {isLoading ? (
            <div className="space-y-6 animate-pulse">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-28 rounded-2xl bg-slate-200/80"></div>
                ))}
              </div>
              <div className="h-64 rounded-2xl bg-slate-200/80"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Leave Balance Cards */}
              <div className="space-y-3">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Leave Balance Summary</h2>
                {balanceEntries.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center text-xs text-slate-400">
                    No leave balance available.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {balanceEntries.map(([key, cat]) => (
                      <div key={key} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900 truncate max-w-[120px]">{cat.name || key}</span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${
                              cat.isPaid !== false
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {cat.isPaid !== false ? 'Paid' : 'Unpaid'}
                          </span>
                        </div>

                        <p className="text-2xl font-black text-indigo-600">
                          {cat.remaining} <span className="text-xs font-medium text-slate-400">Days remaining</span>
                        </p>

                        <div className="flex items-center justify-between text-[10px] text-slate-500 border-t border-slate-100 pt-2 font-mono">
                          <span>Quota: <strong className="text-slate-800">{cat.total}</strong></span>
                          <span>Used: <strong className="text-slate-800">{cat.used}</strong></span>
                          <span>Pending: <strong className="text-amber-600">{cat.pending}</strong></span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Leave Requests Table */}
              <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
                {/* Filter Bar */}
                <div className="border-b border-slate-100 p-4 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50">
                  <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-indigo-600" />
                    <span>Leave Requests</span>
                  </h3>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <select
                      value={filterStatus}
                      onChange={(e) => {
                        setFilterStatus(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 outline-none"
                    >
                      <option value="All">All Statuses</option>
                      <option value="Pending">Pending</option>
                      <option value="Approved">Approved</option>
                      <option value="Rejected">Rejected</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>

                    <select
                      value={filterLeaveType}
                      onChange={(e) => {
                        setFilterLeaveType(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 outline-none"
                    >
                      <option value="All">All Leave Types</option>
                      {leaveTypes.map((t) => (
                        <option key={t.id || t.name} value={t.name}>
                          {t.name}
                        </option>
                      ))}
                    </select>

                    {(filterStatus !== 'All' || filterLeaveType !== 'All') && (
                      <button
                        onClick={handleResetFilters}
                        className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-200"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        <span>Reset</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Table Feed */}
                {myRequests.length === 0 ? (
                  <div className="p-12 text-center text-xs text-slate-400 space-y-2">
                    <CalendarOff className="h-10 w-10 text-slate-300 mx-auto" />
                    <p className="font-bold text-slate-700 text-sm">No leave requests yet.</p>
                    <p className="text-xs text-slate-400 max-w-xs mx-auto">
                      Your leave requests will appear here after you submit one.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-600">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[10px]">
                        <tr>
                          <th className="py-3.5 px-4">Request ID</th>
                          <th className="py-3.5 px-4">Leave Type</th>
                          <th className="py-3.5 px-4">Dates</th>
                          <th className="py-3.5 px-4">Duration</th>
                          <th className="py-3.5 px-4">Attachment</th>
                          <th className="py-3.5 px-4">Submitted</th>
                          <th className="py-3.5 px-4">Status</th>
                          <th className="py-3.5 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {myRequests.map((req) => (
                          <tr key={req._id || req.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3.5 px-4 font-mono font-bold text-indigo-600 text-[11px]">
                              {(req._id || req.id).substring(0, 8)}
                            </td>
                            <td className="py-3.5 px-4 font-bold text-slate-900">{req.leaveType}</td>
                            <td className="py-3.5 px-4 font-medium text-slate-700">
                              {req.startDate} <span className="text-slate-400">to</span> {req.endDate}
                            </td>
                            <td className="py-3.5 px-4 font-bold text-indigo-600">{req.durationDays} Days</td>
                            <td className="py-3.5 px-4">
                              {req.attachmentFileId ? (
                                <a
                                  href={`/api/v1/leave/${req._id || req.id}/attachment/${req.attachmentFileId}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-2 py-1 text-[11px] font-bold text-indigo-700 hover:bg-indigo-100"
                                >
                                  <Paperclip className="h-3 w-3" />
                                  <span className="truncate max-w-[80px]">{req.attachmentName || 'Doc'}</span>
                                  <Download className="h-3 w-3 shrink-0" />
                                </a>
                              ) : (
                                <span className="text-[10px] text-slate-400 italic">None</span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-slate-500">{req.requestedDate}</td>
                            <td className="py-3.5 px-4">
                              <span
                                className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${
                                  req.status === 'Approved'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : req.status === 'Rejected'
                                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                                    : req.status === 'Cancelled'
                                    ? 'bg-slate-100 text-slate-600 border-slate-200'
                                    : 'bg-amber-50 text-amber-700 border-amber-200'
                                }`}
                              >
                                {req.status}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right space-x-2">
                              <button
                                onClick={() => {
                                  setSelectedDetailRequest(req);
                                  setDetailModalOpen(true);
                                }}
                                className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                              >
                                <Eye className="h-3.5 w-3.5" />
                                <span>Details</span>
                              </button>
                              {(req.status === 'Pending' || req.status === 'Approved') && (
                                <button
                                  onClick={() => {
                                    setRequestToCancel(req);
                                    setCancelModalOpen(true);
                                  }}
                                  className="rounded-lg bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100 cursor-pointer"
                                >
                                  Cancel
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Pagination Footer */}
                {totalRequestsCount > 0 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200 bg-slate-50/50 px-4 py-3 text-xs text-slate-500">
                    <div>
                      Showing <span className="font-bold text-slate-800">{myRequests.length}</span> of{' '}
                      <span className="font-bold text-slate-800">{totalRequestsCount}</span> leave requests
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

          {/* Apply for Leave Modal */}
          {isApplyModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
              <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl text-xs text-slate-800 space-y-3 animate-fade-in">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 font-bold text-sm text-slate-900">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-indigo-600" />
                    <span>Apply for Leave</span>
                  </div>
                  <button onClick={() => setIsApplyModalOpen(false)} className="rounded-lg p-1 text-slate-400 hover:text-slate-700">
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <form onSubmit={handleSubmitLeave} className="space-y-3">
                  <div>
                    <label className="font-bold text-slate-900">Leave Category *</label>
                    <select
                      required
                      value={selectedLeaveType}
                      onChange={(e) => setSelectedLeaveType(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 focus:border-indigo-500 focus:bg-white font-semibold"
                    >
                      {leaveTypes.map((t) => (
                        <option key={t.id || t.name} value={t.name}>
                          {t.name} ({t.allowanceDays} Days/Yr - {t.isPaid ? 'Paid' : 'Unpaid'})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-900">Start Date *</label>
                      <input
                        type="date"
                        required
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 focus:border-indigo-500 focus:bg-white font-semibold"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-900">End Date *</label>
                      <input
                        type="date"
                        required
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 focus:border-indigo-500 focus:bg-white font-semibold"
                      />
                    </div>
                  </div>

                  {calculatedDuration > 0 && (
                    <div className="rounded-xl bg-indigo-50/80 p-2.5 border border-indigo-200 flex items-center justify-between text-indigo-950 font-medium">
                      <span>Calculated Duration:</span>
                      <span className="font-extrabold text-indigo-600">{calculatedDuration} Day(s)</span>
                    </div>
                  )}

                  <div>
                    <label className="font-bold text-slate-900">Reason for Leave *</label>
                    <textarea
                      required
                      placeholder="Provide details or reason for time off..."
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      rows={3}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 focus:border-indigo-500 focus:bg-white font-medium"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-900 block mb-1">Supporting Document (GridFS)</label>
                    <div className="flex items-center gap-2">
                      <label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-2.5 hover:bg-slate-100">
                        <Upload className="h-4 w-4 text-slate-400" />
                        <span className="text-slate-600 font-medium truncate max-w-[200px]">
                          {isUploading ? 'Uploading to Vault...' : uploadedFileName || 'Choose File (Max 10MB)'}
                        </span>
                        <input type="file" onChange={handleFileUpload} className="hidden" accept=".pdf,.png,.jpg,.jpeg,.doc,.docx" />
                      </label>
                      {uploadedFileId && (
                        <span className="rounded-full bg-emerald-100 p-1.5 text-emerald-700" title="File Uploaded">
                          <CheckCircle2 className="h-4 w-4" />
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 border-t border-slate-100 pt-3 mt-4">
                    <button
                      type="button"
                      onClick={() => setIsApplyModalOpen(false)}
                      className="rounded-xl border border-slate-200 px-3.5 py-2 font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting || isUploading}
                      className="rounded-xl bg-indigo-600 px-5 py-2 font-bold text-white shadow-xs hover:bg-indigo-500 disabled:opacity-50 cursor-pointer"
                    >
                      {isSubmitting ? 'Submitting...' : 'Submit Application'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Details Modal */}
          {detailModalOpen && selectedDetailRequest && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
              <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl text-xs text-slate-800 space-y-4 animate-fade-in">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 font-bold text-sm text-slate-900">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-indigo-600" />
                    <span>Leave Request Details</span>
                  </div>
                  <button onClick={() => setDetailModalOpen(false)} className="rounded-lg p-1 text-slate-400 hover:text-slate-700">
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-2.5 rounded-xl bg-slate-50 p-4 text-xs font-medium text-slate-700 border border-slate-100">
                  <div className="flex justify-between border-b border-slate-200/60 pb-2">
                    <span className="text-slate-400">Request ID:</span>
                    <span className="font-bold text-slate-900 font-mono">{(selectedDetailRequest._id || selectedDetailRequest.id).substring(0, 10)}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200/60 pb-2">
                    <span className="text-slate-400">Leave Type:</span>
                    <span className="font-bold text-slate-900">{selectedDetailRequest.leaveType}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200/60 pb-2">
                    <span className="text-slate-400">Date Range:</span>
                    <span className="font-bold text-slate-900">{selectedDetailRequest.startDate} to {selectedDetailRequest.endDate}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200/60 pb-2">
                    <span className="text-slate-400">Total Duration:</span>
                    <span className="font-bold text-indigo-600">{selectedDetailRequest.durationDays} Day(s)</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200/60 pb-2">
                    <span className="text-slate-400">Reason:</span>
                    <span className="font-bold text-slate-900 text-right max-w-[200px] truncate">{selectedDetailRequest.reason || 'None provided'}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200/60 pb-2">
                    <span className="text-slate-400">Submitted On:</span>
                    <span className="font-bold text-slate-900">{selectedDetailRequest.requestedDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Approver Role:</span>
                    <span className="font-bold text-slate-800">{selectedDetailRequest.approver || 'Manager / HR'}</span>
                  </div>
                </div>

                {/* Workflow Timeline Indicator */}
                <div className="space-y-2 rounded-xl bg-slate-50/70 p-3 border border-slate-100 text-[11px]">
                  <span className="font-bold text-slate-500 uppercase tracking-wider block">Approval Workflow Timeline</span>
                  <div className="flex items-center justify-between text-slate-600 pt-1 font-medium">
                    <span className="text-emerald-600 font-bold">1. Submitted</span>
                    <span>→</span>
                    <span className={selectedDetailRequest.status === 'Pending' ? 'text-amber-600 font-bold' : 'text-emerald-600 font-bold'}>2. Manager Review</span>
                    <span>→</span>
                    <span className={selectedDetailRequest.status === 'Approved' ? 'text-emerald-600 font-bold' : selectedDetailRequest.status === 'Rejected' ? 'text-rose-600 font-bold' : 'text-slate-400'}>
                      3. {selectedDetailRequest.status}
                    </span>
                  </div>
                </div>

                {selectedDetailRequest.rejectionReason && (
                  <div className="rounded-xl bg-rose-50 p-3 border border-rose-200 text-rose-800 text-xs">
                    <span className="font-bold">Rejection Reason:</span>
                    <p className="mt-0.5">{selectedDetailRequest.rejectionReason}</p>
                  </div>
                )}

                <div className="flex justify-end pt-2 border-t border-slate-100">
                  <button
                    onClick={() => setDetailModalOpen(false)}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Cancel Confirmation Modal */}
          {cancelModalOpen && requestToCancel && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
              <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl text-xs text-slate-800 space-y-3">
                <div className="flex items-center gap-2 font-bold text-sm text-slate-900 border-b border-slate-100 pb-3">
                  <CalendarOff className="h-4 w-4 text-amber-600" />
                  <span>Cancel Leave Request</span>
                </div>

                <p className="text-slate-600">
                  Are you sure you want to cancel your <span className="font-bold text-slate-900">{requestToCancel.leaveType}</span> request ({requestToCancel.startDate} to {requestToCancel.endDate})?
                </p>

                <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
                  <button
                    disabled={isSubmitting}
                    onClick={() => setCancelModalOpen(false)}
                    className="rounded-xl border border-slate-200 px-3.5 py-1.5 font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                  >
                    Keep Request
                  </button>
                  <button
                    disabled={isSubmitting}
                    onClick={handleCancelRequest}
                    className="rounded-xl bg-rose-600 px-4 py-1.5 font-bold text-white shadow-xs hover:bg-rose-500 disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmitting ? 'Cancelling...' : 'Confirm Cancel'}
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
