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
}

export default function EmployeeLeavePage() {
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Balances & Leave Types
  const [balances, setBalances] = useState<Record<string, LeaveBalanceCategory>>({});
  const [leaveTypes, setLeaveTypes] = useState<LeaveTypeOption[]>([]);
  const [myRequests, setMyRequests] = useState<PersonalLeaveItem[]>([]);

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

  // Cancellation modal
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [requestToCancel, setRequestToCancel] = useState<PersonalLeaveItem | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // UX Duration Calculation
  const calculatedDuration = useMemo(() => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) return 0;
    return Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1);
  }, [startDate, endDate]);

  const fetchData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const [balRes, typesRes, requestsRes] = await Promise.all([
        fetch('/api/v1/leave/balances'),
        fetch('/api/v1/leave/types'),
        fetch('/api/v1/leave?limit=50'),
      ]);

      if (balRes.ok) {
        const balData = await balRes.json();
        if (balData.success && balData.data?.balances) {
          setBalances(balData.data.balances);
        }
      }

      if (typesRes.ok) {
        const typesData = await typesRes.json();
        if (typesData.success && Array.isArray(typesData.data)) {
          setLeaveTypes(typesData.data);
          if (typesData.data.length > 0 && !selectedLeaveType) {
            setSelectedLeaveType(typesData.data[0].name);
          }
        }
      }

      if (requestsRes.ok) {
        const reqData = await requestsRes.json();
        if (reqData.success && reqData.data?.leaves) {
          setMyRequests(reqData.data.leaves);
        }
      }
    } catch (err) {
      console.error('Error fetching employee leave data:', err);
      showToast('Failed to load leave data.', 'error');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [selectedLeaveType]);

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
        showToast('Document uploaded to GridFS binary vault!');
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
        showToast(data.message || 'Leave request submitted successfully!');
        setIsApplyModalOpen(false);
        setStartDate('');
        setEndDate('');
        setReason('');
        setUploadedFileId(null);
        setUploadedFileName(null);
        setAttachmentFile(null);
        fetchData();
      } else {
        showToast(data.message || 'Failed to submit leave request.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error submitting leave request.', 'error');
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
        showToast(data.message || 'Failed to cancel request.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error cancelling request.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const balanceEntries = Object.entries(balances);

  return (
    <AuthGuard allowedRoles={['Employee', 'Super Admin']}>
      <AdminLayout
        pageTitle="My Time-Off & Leave Portal"
        breadcrumbs={[{ label: 'Leave Portal', href: '/employee/leave' }]}
      >
        {/* Toast */}
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
            <h2 className="text-xl font-bold text-slate-900">My Leave Balances & History</h2>
            <p className="text-xs text-slate-500">
              Apply for leave, track approval status, and check your real-time company time-off balance
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchData}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-xs hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>

            <button
              onClick={() => setIsApplyModalOpen(true)}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-md hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              <span>+ Apply for Leave</span>
            </button>
          </div>
        </div>

        {/* Real Balance Cards */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Annual Leave Balances</h3>
          {isLoading ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-28 animate-pulse rounded-2xl bg-slate-100 border border-slate-200"></div>
              ))}
            </div>
          ) : balanceEntries.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-xs text-slate-500">
              No leave balances initialized. Contact HR administrator to assign leave quotas.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {balanceEntries.map(([key, cat]) => (
                <div key={key} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
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

                  <p className="mt-2 text-2xl font-black text-blue-600">{cat.remaining} <span className="text-xs font-medium text-slate-400">Available</span></p>

                  <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500 border-t pt-1.5">
                    <span>Total: <strong className="text-slate-800">{cat.total}</strong></span>
                    <span>Used: <strong className="text-slate-800">{cat.used}</strong></span>
                    <span>Pending: <strong className="text-amber-600">{cat.pending}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* My Applications Feed */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-4">
            <h3 className="text-sm font-bold text-slate-900">My Leave Applications ({myRequests.length})</h3>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
              <p className="mt-2 text-xs font-medium text-slate-600">Loading your leave requests...</p>
            </div>
          ) : myRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <CalendarOff className="h-6 w-6" />
              </div>
              <h4 className="mt-3 text-sm font-bold text-slate-800">No time-off requests yet</h4>
              <p className="mt-1 max-w-xs text-xs text-slate-500">
                When you submit a leave application, its status, dates, and approver updates will appear here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-slate-500 font-semibold">
                    <th className="px-4 py-3.5">Leave Type</th>
                    <th className="px-4 py-3.5">Dates & Duration</th>
                    <th className="px-4 py-3.5">Reason</th>
                    <th className="px-4 py-3.5">Attachment</th>
                    <th className="px-4 py-3.5">Submitted On</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-4 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {myRequests.map((req) => (
                    <tr key={req._id || req.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3.5 font-bold text-slate-900">{req.leaveType}</td>
                      <td className="px-4 py-3.5">
                        <p className="text-slate-800 font-medium">
                          {req.startDate} <span className="text-slate-400">to</span> {req.endDate}
                        </p>
                        <span className="text-[10px] font-bold text-blue-600">({req.durationDays} Days)</span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-600 max-w-xs truncate" title={req.reason}>
                        {req.reason || 'None'}
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
                      <td className="px-4 py-3.5 text-slate-500">{req.requestedDate}</td>
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
                        {(req.status === 'Pending' || req.status === 'Approved') && (
                          <button
                            onClick={() => {
                              setRequestToCancel(req);
                              setCancelModalOpen(true);
                            }}
                            className="rounded-lg bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100"
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
        </div>

        {/* Apply for Leave Modal */}
        {isApplyModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
            <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl text-xs text-slate-800 animate-fade-in">
              <div className="flex items-center justify-between border-b pb-3 font-bold text-sm text-slate-900">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-blue-600" />
                  <span>Apply for Time-Off / Leave</span>
                </div>
                <button onClick={() => setIsApplyModalOpen(false)} className="rounded-lg p-1 text-slate-400 hover:text-slate-700">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleSubmitLeave} className="mt-4 space-y-3">
                <div>
                  <label className="font-bold text-slate-900">Leave Category *</label>
                  <select
                    required
                    value={selectedLeaveType}
                    onChange={(e) => setSelectedLeaveType(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 focus:border-blue-500 focus:bg-white font-semibold"
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
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 focus:border-blue-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-900">End Date *</label>
                    <input
                      type="date"
                      required
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 focus:border-blue-500 focus:bg-white"
                    />
                  </div>
                </div>

                {calculatedDuration > 0 && (
                  <div className="rounded-xl bg-blue-50/70 p-2.5 border border-blue-200 flex items-center justify-between text-blue-900">
                    <span className="font-bold">Total Duration:</span>
                    <span className="font-black text-sm text-blue-700">{calculatedDuration} Day(s)</span>
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
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 focus:border-blue-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-900 block mb-1">Supporting Document (GridFS)</label>
                  <div className="flex items-center gap-2">
                    <label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-2.5 hover:bg-slate-100">
                      <Upload className="h-4 w-4 text-slate-400" />
                      <span className="text-slate-600 font-medium">
                        {isUploading ? 'Uploading to Vault...' : uploadedFileName || 'Choose File (Max 10MB)'}
                      </span>
                      <input type="file" onChange={handleFileUpload} className="hidden" accept=".pdf,.png,.jpg,.jpeg,.doc,.docx" />
                    </label>
                    {uploadedFileId && (
                      <span className="rounded-full bg-emerald-100 p-1 text-emerald-700" title="File Uploaded">
                        <CheckCircle2 className="h-4 w-4" />
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-2 border-t pt-3 mt-4">
                  <button
                    type="button"
                    onClick={() => setIsApplyModalOpen(false)}
                    className="rounded-xl border px-3 py-1.5 font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || isUploading}
                    className="rounded-xl bg-blue-600 px-4 py-1.5 font-bold text-white shadow-xs hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Application'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Cancel Modal */}
        {cancelModalOpen && requestToCancel && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
            <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl text-xs text-slate-800">
              <div className="flex items-center gap-2 font-bold text-sm text-slate-800 border-b pb-3">
                <CalendarOff className="h-5 w-5 text-amber-600" />
                <span>Cancel Leave Application</span>
              </div>

              <p className="my-3 text-slate-600">
                Are you sure you want to cancel your <span className="font-bold text-slate-900">{requestToCancel.leaveType}</span> request ({requestToCancel.startDate} to {requestToCancel.endDate})?
              </p>

              <div className="flex justify-end gap-2 border-t pt-3 mt-4">
                <button
                  disabled={isSubmitting}
                  onClick={() => setCancelModalOpen(false)}
                  className="rounded-xl border px-3 py-1.5 font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Keep Request
                </button>
                <button
                  disabled={isSubmitting}
                  onClick={handleCancelRequest}
                  className="rounded-xl bg-rose-600 px-4 py-1.5 font-bold text-white shadow-xs hover:bg-rose-700 disabled:opacity-50"
                >
                  {isSubmitting ? 'Cancelling...' : 'Confirm Cancel'}
                </button>
              </div>
            </div>
          </div>
        )}
      </AdminLayout>
    </AuthGuard>
  );
}
