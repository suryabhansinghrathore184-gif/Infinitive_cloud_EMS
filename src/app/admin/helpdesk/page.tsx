'use client';

import React, { useState } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { HrTicket } from '@/types/admin';
import { HelpCircle, CheckCircle2 } from 'lucide-react';

export default function HelpdeskPage() {
  const [tickets, setTickets] = useState<HrTicket[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleStatusChange = (id: string, newStatus: HrTicket['status']) => {
    setTickets((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: newStatus } : t))
    );
    showToast(`Ticket ${id} status updated to ${newStatus}`);
  };

  return (
    <AdminLayout
      pageTitle="HR Helpdesk & Ticketing"
      breadcrumbs={[{ label: 'Helpdesk', href: '/admin/helpdesk' }]}
    >
      {/* Toast */}
      {toastMessage && (
        <div className="fixed right-6 top-20 z-50 flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs text-white shadow-xl">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Employee Support Tickets</h2>
          <p className="text-xs text-slate-500">
            Resolve salary queries, attendance corrections, IT requests, and general HR tickets
          </p>
        </div>
      </div>

      {/* Ticket Lifecycle Flow */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm text-xs">
        <h4 className="font-bold text-slate-900 mb-2">Ticket Resolution Lifecycle</h4>
        <div className="flex flex-wrap items-center gap-2 font-semibold text-slate-600">
          <span className="rounded-lg bg-slate-100 px-3 py-1.5 border border-slate-200">Open (0)</span>
          <span>→</span>
          <span className="rounded-lg bg-slate-100 px-3 py-1.5 border border-slate-200">Assigned (0)</span>
          <span>→</span>
          <span className="rounded-lg bg-slate-100 px-3 py-1.5 border border-slate-200">In Progress (0)</span>
          <span>→</span>
          <span className="rounded-lg bg-slate-100 px-3 py-1.5 border border-slate-200">Resolved (0)</span>
          <span>→</span>
          <span className="rounded-lg bg-slate-100 px-3 py-1.5 border border-slate-200">Closed</span>
        </div>
      </div>

      {/* Tickets Table vs Empty State */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {tickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <HelpCircle className="h-6 w-6" />
            </div>
            <h4 className="mt-3 text-sm font-bold text-slate-800">No HR requests yet</h4>
            <p className="mt-1 max-w-xs text-xs text-slate-500">
              Support requests and tickets submitted by employees or managers will display here.
            </p>
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-slate-500 font-semibold">
                <th className="px-4 py-3.5">Ticket ID</th>
                <th className="px-4 py-3.5">Employee</th>
                <th className="px-4 py-3.5">Category</th>
                <th className="px-4 py-3.5">Subject</th>
                <th className="px-4 py-3.5">Assignee</th>
                <th className="px-4 py-3.5">Priority</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tickets.map((tck) => (
                <tr key={tck.id} className="hover:bg-slate-50/60">
                  <td className="px-4 py-3.5 font-mono font-bold text-blue-600">{tck.ticketNo}</td>
                  <td className="px-4 py-3.5 font-bold text-slate-900">{tck.creatorName}</td>
                  <td className="px-4 py-3.5">
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                      {tck.category}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-slate-700 max-w-xs truncate">{tck.subject}</td>
                  <td className="px-4 py-3.5 text-slate-600">{tck.assignee}</td>
                  <td className="px-4 py-3.5 font-bold text-rose-600">{tck.priority}</td>
                  <td className="px-4 py-3.5">{tck.status}</td>
                  <td className="px-4 py-3.5 text-right">
                    <button
                      onClick={() => handleStatusChange(tck.id, 'Resolved')}
                      className="rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                    >
                      Mark Resolved
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AdminLayout>
  );
}
