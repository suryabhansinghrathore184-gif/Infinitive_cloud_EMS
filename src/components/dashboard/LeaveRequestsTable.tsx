'use client';

import React, { useState } from 'react';
import { mockLeaveRequests } from '@/data/dashboard';
import { LeaveRequest, LeaveStatus } from '@/types/dashboard';
import { Eye, Check, X, Clock, CalendarDays } from 'lucide-react';

export const LeaveRequestsTable: React.FC = () => {
  const [requests, setRequests] = useState<LeaveRequest[]>(mockLeaveRequests);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleAction = (id: string, newStatus: LeaveStatus, employeeName: string) => {
    setRequests((prev) =>
      prev.map((req) => (req.id === id ? { ...req, status: newStatus } : req))
    );
    showToast(`Leave request for ${employeeName} marked as ${newStatus}`);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const getStatusBadge = (status: LeaveStatus) => {
    switch (status) {
      case 'Approved':
        return (
          <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
            <Check className="mr-1 h-3 w-3" /> Approved
          </span>
        );
      case 'Rejected':
        return (
          <span className="inline-flex items-center rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-700">
            <X className="mr-1 h-3 w-3" /> Rejected
          </span>
        );
      case 'Pending':
      default:
        return (
          <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
            <Clock className="mr-1 h-3 w-3" /> Pending
          </span>
        );
    }
  };

  return (
    <div className="relative rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="absolute right-6 top-4 z-20 flex items-center gap-2 rounded-xl bg-slate-900 px-3.5 py-2 text-xs text-white shadow-xl animate-fade-in">
          <Check className="h-4 w-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900">Recent Leave Requests</h3>
          <p className="text-xs text-slate-500">Applications requiring management action</p>
        </div>
        <button className="text-xs font-semibold text-blue-600 hover:text-blue-700">
          View All ({requests.length})
        </button>
      </div>

      {/* Table Container */}
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-500">
              <th className="px-4 py-3 font-semibold">Employee</th>
              <th className="px-4 py-3 font-semibold">Leave Type</th>
              <th className="px-4 py-3 font-semibold">Duration</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {requests.map((req) => (
              <tr key={req.id} className="transition-colors hover:bg-slate-50/60">
                {/* Employee Info */}
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-3">
                    <img
                      src={req.avatar}
                      alt={req.employeeName}
                      className="h-8 w-8 rounded-full object-cover ring-1 ring-slate-200"
                    />
                    <div>
                      <p className="font-semibold text-slate-900">{req.employeeName}</p>
                      <p className="text-[10px] text-slate-400">{req.employeeId}</p>
                    </div>
                  </div>
                </td>

                {/* Leave Type */}
                <td className="px-4 py-3.5 font-medium text-slate-700">
                  {req.leaveType}
                </td>

                {/* Duration */}
                <td className="px-4 py-3.5">
                  <div className="text-slate-700">
                    <span className="font-medium">{req.fromDate}</span> to <span className="font-medium">{req.toDate}</span>
                  </div>
                  <span className="text-[10px] text-slate-400">({req.totalDays} Days)</span>
                </td>

                {/* Status Badge */}
                <td className="px-4 py-3.5">
                  {getStatusBadge(req.status)}
                </td>

                {/* Actions */}
                <td className="px-4 py-3.5 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => showToast(`Viewing details for ${req.employeeName}`)}
                      className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
                      title="View Details"
                    >
                      <Eye className="h-4 w-4" />
                    </button>

                    {req.status === 'Pending' && (
                      <>
                        <button
                          onClick={() => handleAction(req.id, 'Approved', req.employeeName)}
                          className="flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-100"
                          title="Approve Leave"
                        >
                          <Check className="h-3.5 w-3.5" /> Approve
                        </button>

                        <button
                          onClick={() => handleAction(req.id, 'Rejected', req.employeeName)}
                          className="flex items-center gap-1 rounded-lg bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 transition-colors hover:bg-rose-100"
                          title="Reject Leave"
                        >
                          <X className="h-3.5 w-3.5" /> Reject
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
