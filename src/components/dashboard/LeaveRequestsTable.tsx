'use client';

import React, { useState } from 'react';
import { useEmsStore } from '@/store/emsStore';
import { LeaveStatus } from '@/types/dashboard';
import { Eye, Check, X, Clock, CalendarOff } from 'lucide-react';

export const LeaveRequestsTable: React.FC = () => {
  const { state } = useEmsStore();
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const requests = state.leaves;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const getStatusBadge = (status: string) => {
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
    <div className="relative flex h-full w-full flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
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

      {/* Empty State vs Table Container */}
      {requests.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center py-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
            <CalendarOff className="h-6 w-6" />
          </div>
          <h4 className="mt-3 text-sm font-bold text-slate-800">No leave requests yet</h4>
          <p className="mt-1 max-w-xs text-xs text-slate-500">
            Submitted employee leave applications and time-off requests will appear here.
          </p>
        </div>
      ) : (
        <div className="mt-4 flex-1 overflow-x-auto">
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
                        src={req.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80'}
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
                      <span className="font-medium">{req.startDate}</span> to <span className="font-medium">{req.endDate}</span>
                    </div>
                    <span className="text-[10px] text-slate-400">({req.durationDays} Days)</span>
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
                            onClick={() => showToast(`Approved leave for ${req.employeeName}`)}
                            className="flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-100"
                            title="Approve Leave"
                          >
                            <Check className="h-3.5 w-3.5" /> Approve
                          </button>

                          <button
                            onClick={() => showToast(`Rejected leave for ${req.employeeName}`)}
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
      )}
    </div>
  );
};
