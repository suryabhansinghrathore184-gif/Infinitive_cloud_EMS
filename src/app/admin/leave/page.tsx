'use client';

import React, { useState } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { mockAdminLeaveRequests } from '@/data/attendance';
import { LeaveRequestAdmin } from '@/types/admin';
import { CalendarDays, Check, X, Clock, HelpCircle, CheckCircle2, Plus } from 'lucide-react';

export default function LeavePage() {
  const [requests, setRequests] = useState<LeaveRequestAdmin[]>(mockAdminLeaveRequests);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleAction = (id: string, newStatus: LeaveRequestAdmin['status'], name: string) => {
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
    );
    showToast(`Leave request for ${name} updated to ${newStatus}`);
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
          onClick={() => showToast('Opening leave policy settings...')}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-md hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          <span>Configure Policy</span>
        </button>
      </div>

      {/* Leave Types Overview */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { name: 'Casual Leave (CL)', allocated: '12 Days/Yr', carryOver: 'No' },
          { name: 'Sick Leave (SL)', allocated: '10 Days/Yr', carryOver: 'No' },
          { name: 'Earned Leave (EL)', allocated: '18 Days/Yr', carryOver: 'Yes (Max 30)' },
          { name: 'Maternity/Paternity', allocated: '26 Weeks / 15 Days', carryOver: 'No' },
        ].map((type, idx) => (
          <div key={idx} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h4 className="text-xs font-bold text-slate-900">{type.name}</h4>
            <p className="mt-1 text-sm font-extrabold text-blue-600">{type.allocated}</p>
            <span className="text-[10px] text-slate-400">Carry Forward: {type.carryOver}</span>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-4">
          <h3 className="text-sm font-bold text-slate-900">Pending & Recent Applications</h3>
        </div>
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
                    <img src={req.avatar} alt={req.employeeName} className="h-8 w-8 rounded-full object-cover" />
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
                  <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-semibold text-amber-700 border border-amber-200">
                    {req.status}
                  </span>
                </td>
                <td className="px-4 py-3.5 text-right">
                  {req.status === 'Pending' && (
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleAction(req.id, 'Approved', req.employeeName)}
                        className="rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleAction(req.id, 'Rejected', req.employeeName)}
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
      </div>
    </AdminLayout>
  );
}
