'use client';

import React, { useState } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { useEmsStore } from '@/store/emsStore';
import { LeaveRequestAdmin } from '@/types/admin';
import { CalendarDays, CheckCircle2, Plus, CalendarOff } from 'lucide-react';
import { AddLeaveTypeModal } from '@/components/modals/AddLeaveTypeModal';

export default function LeavePage() {
  const { state, addLeaveType, updateLeaveRequestStatus } = useEmsStore();
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isAddLeaveTypeOpen, setIsAddLeaveTypeOpen] = useState(false);

  const requests = state.leaves;
  const leaveTypes = state.leaveTypes;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <AdminLayout
      pageTitle="Leave Management"
      breadcrumbs={[{ label: 'Leave', href: '/admin/leave' }]}
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed right-6 top-20 z-50 flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs text-white shadow-xl">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Leave Approvals & Policies</h2>
          <p className="text-xs text-slate-500">
            Manage employee leave applications, balances, and multi-tier approval workflows
          </p>
        </div>

        <button
          onClick={() => setIsAddLeaveTypeOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-md hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          <span>+ Add Leave Type</span>
        </button>
      </div>

      {/* Leave Types Overview */}
      {leaveTypes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center text-xs text-slate-500">
          <p className="font-semibold text-slate-700">No leave types configured yet.</p>
          <p className="mt-1">Click &quot;+ Add Leave Type&quot; above to configure company leave allowances.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {leaveTypes.map((type) => (
            <div key={type.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <h4 className="text-xs font-bold text-slate-900">{type.name}</h4>
              <p className="mt-1 text-sm font-extrabold text-blue-600">{type.allowanceDays} Days/Yr</p>
              <span className="text-[10px] text-slate-400">Type: {type.isPaid ? 'Paid Off' : 'Unpaid'}</span>
            </div>
          ))}
        </div>
      )}

      {/* Table vs Empty State */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-4">
          <h3 className="text-sm font-bold text-slate-900">Pending & Recent Applications</h3>
        </div>
        {requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <CalendarOff className="h-6 w-6" />
            </div>
            <h4 className="mt-3 text-sm font-bold text-slate-800">No leave requests yet</h4>
            <p className="mt-1 max-w-xs text-xs text-slate-500">
              Submitted employee leave applications and time-off requests will appear here.
            </p>
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-slate-500 font-semibold">
                <th className="px-4 py-3.5">Employee</th>
                <th className="px-4 py-3.5">Leave Type</th>
                <th className="px-4 py-3.5">Dates & Duration</th>
                <th className="px-4 py-3.5">Reason</th>
                <th className="px-4 py-3.5">Approver</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {requests.map((req) => (
                <tr key={req.id} className="hover:bg-slate-50/60">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <img src={req.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80'} alt={req.employeeName} className="h-8 w-8 rounded-full object-cover" />
                      <div>
                        <p className="font-bold text-slate-900">{req.employeeName}</p>
                        <p className="text-[10px] text-slate-400">{req.employeeId}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 font-semibold text-slate-800">{req.leaveType}</td>
                  <td className="px-4 py-3.5">
                    <p className="text-slate-800">{req.startDate} to {req.endDate}</p>
                    <span className="text-[10px] text-slate-400">({req.durationDays} Days)</span>
                  </td>
                  <td className="px-4 py-3.5 text-slate-600 max-w-xs truncate">{req.reason}</td>
                  <td className="px-4 py-3.5 text-slate-700">{req.approver}</td>
                  <td className="px-4 py-3.5">
                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold border ${
                      req.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      req.status === 'Rejected' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                      'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {req.status}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    {req.status === 'Pending' && (
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => {
                            updateLeaveRequestStatus(req.id, 'Approved');
                            showToast(`Leave approved for ${req.employeeName}`);
                          }}
                          className="rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => {
                            updateLeaveRequestStatus(req.id, 'Rejected');
                            showToast(`Leave rejected for ${req.employeeName}`);
                          }}
                          className="rounded-lg bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <AddLeaveTypeModal
        isOpen={isAddLeaveTypeOpen}
        onClose={() => setIsAddLeaveTypeOpen(false)}
        onSave={(lt) => {
          addLeaveType(lt);
          showToast(`Leave type "${lt.name}" added successfully!`);
        }}
      />
    </AdminLayout>
  );
}
