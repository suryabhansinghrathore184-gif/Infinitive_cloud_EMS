'use client';

import React from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { useEmsStore } from '@/store/emsStore';
import { Lock, Inbox } from 'lucide-react';

export default function AuditLogsPage() {
  const { state } = useEmsStore();
  const activities = state.activities || [];

  return (
    <AdminLayout
      pageTitle="System Audit Logs"
      breadcrumbs={[{ label: 'Audit Logs', href: '/admin/audit-logs' }]}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900">Security & Activity Audit Stream</h2>
            <span className="flex items-center gap-1 rounded-md bg-slate-900 px-2 py-0.5 text-[10px] font-semibold text-white">
              <Lock className="h-3 w-3 text-emerald-400" /> Read-Only Admin Log
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Immutable log record of all user actions, profile updates, payroll approvals, and document downloads
          </p>
        </div>
      </div>

      {/* Audit Log Table vs Empty State */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <Inbox className="h-6 w-6" />
            </div>
            <h4 className="mt-3 text-sm font-bold text-slate-800">No activity recorded yet</h4>
            <p className="mt-1 max-w-xs text-xs text-slate-500">
              Admin operations, employee data changes, and system audit events will stream live here.
            </p>
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-900 text-slate-200 font-semibold">
                <th className="px-4 py-3.5">Timestamp</th>
                <th className="px-4 py-3.5">User</th>
                <th className="px-4 py-3.5">Action & Module</th>
                <th className="px-4 py-3.5">Category</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {activities.map((act) => (
                <tr key={act.id} className="hover:bg-slate-50/60 font-mono text-[11px]">
                  <td className="px-4 py-3.5 text-slate-500">{act.timestamp}</td>
                  <td className="px-4 py-3.5 font-bold text-slate-900">{act.user}</td>
                  <td className="px-4 py-3.5 font-bold text-blue-600 font-sans">{act.action}</td>
                  <td className="px-4 py-3.5 text-slate-500 font-sans uppercase text-[10px]">{act.category}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AdminLayout>
  );
}
