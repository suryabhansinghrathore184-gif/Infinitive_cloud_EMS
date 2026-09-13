'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { SuperAdminLayout } from '@/components/layout/SuperAdminLayout';
import { formatRoleLabel } from '@/lib/roleUtils';
import {
  ShieldAlert,
  Search,
  Filter,
  RefreshCw,
  Clock,
  User,
  Building2,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
  FileText,
} from 'lucide-react';

interface AuditLog {
  id: string;
  action: string;
  module?: string;
  performedBy: string;
  performedByName: string;
  role: string;
  organizationId: string;
  details: any;
  timestamp: string;
  ipAddress?: string;
}

export default function SuperAdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);

  // Detail Modal
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '20',
        search,
        module: moduleFilter,
      });

      const res = await fetch(`/api/v1/super-admin/audit-logs?${params.toString()}`);
      if (res.ok) {
        const result = await res.json();
        if (result.success && result.data) {
          setLogs(result.data.logs);
          setTotalPages(result.data.pagination.totalPages);
          setTotalLogs(result.data.pagination.total);
        }
      }
    } catch (err) {
      console.error('Error fetching audit logs:', err);
    } finally {
      setIsLoading(false);
    }
  }, [page, search, moduleFilter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return (
    <SuperAdminLayout
      pageTitle="Global Audit Trail & Compliance Stream"
      breadcrumbs={[
        { label: 'Executive Dashboard', href: '/super-admin/dashboard' },
        { label: 'Audit Logs', href: '/super-admin/audit-logs' },
      ]}
    >
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-slate-900">System Activity Stream</h2>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-extrabold text-slate-800 border border-slate-300">
              {totalLogs} AUDIT EVENTS RECORDED
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Immutable system audit logs tracking user actions, administrative overrides, organization provisioning, and security events
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Audit Stream</span>
        </button>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by action, actor email, employee name, or details..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-4 py-2 text-xs font-medium text-slate-800 focus:border-indigo-500 focus:bg-white focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <span>Module Filter:</span>
            <select
              value={moduleFilter}
              onChange={(e) => {
                setModuleFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 focus:outline-hidden"
            >
              <option value="All">All System Modules</option>
              <option value="ORGANIZATIONS">Organizations</option>
              <option value="USERS">User Access</option>
              <option value="EMPLOYEES">Employees</option>
              <option value="ATTENDANCE">Attendance</option>
              <option value="LEAVE">Leave</option>
              <option value="PAYROLL">Payroll</option>
              <option value="NOTIFICATIONS">Notifications</option>
              <option value="SECURITY">Security & Settings</option>
            </select>
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <RefreshCw className="h-8 w-8 animate-spin text-indigo-600" />
            <p className="mt-3 text-xs font-medium text-slate-600">Streaming audit logs...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-500">
            <ShieldAlert className="mx-auto h-10 w-10 text-slate-300" />
            <p className="mt-2 font-bold text-slate-700">No audit logs found</p>
            <p className="text-slate-400">Try adjusting your search terms</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Action Event</th>
                  <th className="py-3.5 px-4">Actor</th>
                  <th className="py-3.5 px-4">Role & Org</th>
                  <th className="py-3.5 px-4">Timestamp</th>
                  <th className="py-3.5 px-4 text-right">Payload</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 font-bold text-[10px]">
                          LOG
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{log.action}</p>
                          {log.module && <span className="text-[10px] text-indigo-600 font-semibold">{log.module}</span>}
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-800">{log.performedByName || log.performedBy || 'System'}</p>
                      <p className="text-[10px] text-slate-400">{log.performedBy}</p>
                    </td>

                    <td className="py-3 px-4">
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                        {formatRoleLabel(log.role)}
                      </span>
                      <p className="text-[10px] font-mono text-slate-400 mt-0.5">{log.organizationId || 'GLOBAL'}</p>
                    </td>

                    <td className="py-3 px-4 text-slate-500 text-[11px] font-mono">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-slate-400" />
                        <span>{new Date(log.timestamp).toLocaleString()}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-100 hover:border-slate-300"
                      >
                        <Eye className="h-3 w-3 text-slate-500" />
                        <span>Inspect Payload</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/50 px-4 py-3 text-xs">
            <span className="text-slate-500">
              Page <strong className="text-slate-900">{page}</strong> of <strong className="text-slate-900">{totalPages}</strong>
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Next
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* JSON Payload Inspector Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-indigo-600" />
                <h3 className="text-base font-extrabold text-slate-900">Audit Payload Event Inspector</h3>
              </div>
              <button onClick={() => setSelectedLog(null)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs rounded-xl bg-slate-50 p-3 border border-slate-200">
              <div>
                <p className="text-slate-500 font-medium">Action Event:</p>
                <p className="font-bold text-slate-900">{selectedLog.action}</p>
              </div>
              <div>
                <p className="text-slate-500 font-medium">Actor Email:</p>
                <p className="font-bold text-slate-900">{selectedLog.performedBy}</p>
              </div>
              <div>
                <p className="text-slate-500 font-medium">Role:</p>
                <p className="font-bold text-slate-900">{selectedLog.role}</p>
              </div>
              <div>
                <p className="text-slate-500 font-medium">Timestamp:</p>
                <p className="font-mono text-slate-900">{new Date(selectedLog.timestamp).toISOString()}</p>
              </div>
            </div>

            <div>
              <p className="text-xs font-bold text-slate-700 mb-1.5">JSON Details Payload</p>
              <pre className="max-h-80 overflow-y-auto rounded-xl bg-slate-950 p-4 font-mono text-[11px] text-emerald-400 shadow-inner scrollbar-thin scrollbar-thumb-slate-800">
                {JSON.stringify(selectedLog.details || {}, null, 2)}
              </pre>
            </div>

            <div className="flex justify-end pt-2 border-t">
              <button
                onClick={() => setSelectedLog(null)}
                className="rounded-xl bg-slate-900 px-5 py-2 text-xs font-bold text-white hover:bg-slate-800"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </SuperAdminLayout>
  );
}
