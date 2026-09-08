'use client';

import React from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { mockAuditLogs } from '@/data/modulesData';
import { ShieldAlert, Lock, Search, Filter } from 'lucide-react';

export default function AuditLogsPage() {
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

      {/* Audit Log Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-900 text-slate-200 font-semibold">
              <th className="px-4 py-3.5">Timestamp</th>
              <th className="px-4 py-3.5">User</th>
              <th className="px-4 py-3.5">Action & Module</th>
              <th className="px-4 py-3.5">Target Entity</th>
              <th className="px-4 py-3.5">Change Value (Old → New)</th>
              <th className="px-4 py-3.5 text-right">IP Address</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {mockAuditLogs.map((log) => (
              <tr key={log.id} className="hover:bg-slate-50/60 font-mono text-[11px]">
                <td className="px-4 py-3.5 text-slate-500">{log.timestamp}</td>
                <td className="px-4 py-3.5 font-bold text-slate-900">{log.user}</td>
                <td className="px-4 py-3.5">
                  <p className="font-bold text-blue-600">{log.action}</p>
                  <p className="text-[10px] text-slate-400 font-sans">{log.module}</p>
                </td>
                <td className="px-4 py-3.5 text-slate-800 font-sans font-medium">{log.entity}</td>
                <td className="px-4 py-3.5">
                  {log.oldValue ? (
                    <span className="text-slate-600">
                      <span className="text-rose-600">{log.oldValue}</span> → <span className="text-emerald-600">{log.newValue}</span>
                    </span>
                  ) : (
                    <span className="text-slate-400 font-sans italic">Read/Access Event</span>
                  )}
                </td>
                <td className="px-4 py-3.5 text-right text-slate-500">{log.ipAddress}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
