'use client';

import React, { useState, useEffect } from 'react';
import { CalendarDays, RefreshCw, CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react';

export default function ManagerLeavePage() {
  const [leaves, setLeaves] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');

  const fetchLeaves = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/v1/leave?status=${encodeURIComponent(statusFilter)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setLeaves(data.data || []);
        }
      }
    } catch (err) {
      console.error('Error fetching team leave requests:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, [statusFilter]);

  const handleAction = async (leaveId: string, status: 'Approved' | 'Rejected') => {
    try {
      const res = await fetch(`/api/v1/leave/${leaveId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        fetchLeaves();
      }
    } catch (err) {
      console.error('Error processing leave action:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Team Leave Requests</h1>
          <p className="text-sm text-slate-500 mt-1">Review and approve leave applications submitted by your direct reports.</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:border-indigo-500 focus:outline-hidden"
          >
            <option value="All">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
          <button
            onClick={fetchLeaves}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition-all cursor-pointer"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-500">
            <RefreshCw className="h-5 w-5 animate-spin text-indigo-600 mx-auto mb-2" />
            <span>Loading team leave applications...</span>
          </div>
        ) : leaves.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            No leave requests found for direct reports.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Employee</th>
                  <th className="py-3.5 px-4">Leave Type</th>
                  <th className="py-3.5 px-4">Dates</th>
                  <th className="py-3.5 px-4">Reason</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leaves.map((item) => (
                  <tr key={item._id || item.id} className="hover:bg-slate-50/80">
                    <td className="py-3.5 px-4 font-semibold text-slate-900">{item.employeeName || item.employeeId}</td>
                    <td className="py-3.5 px-4">{item.leaveType}</td>
                    <td className="py-3.5 px-4">{item.startDate} to {item.endDate}</td>
                    <td className="py-3.5 px-4 truncate max-w-xs">{item.reason || 'N/A'}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          item.status === 'Approved'
                            ? 'bg-emerald-50 text-emerald-700'
                            : item.status === 'Rejected'
                            ? 'bg-rose-50 text-rose-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {item.status || 'Pending'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      {item.status === 'Pending' && (
                        <>
                          <button
                            onClick={() => handleAction(item._id || item.id, 'Approved')}
                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-emerald-500 cursor-pointer"
                          >
                            <CheckCircle2 className="h-3 w-3" />
                            <span>Approve</span>
                          </button>
                          <button
                            onClick={() => handleAction(item._id || item.id, 'Rejected')}
                            className="inline-flex items-center gap-1 rounded-lg bg-rose-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-rose-500 cursor-pointer"
                          >
                            <XCircle className="h-3 w-3" />
                            <span>Reject</span>
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
