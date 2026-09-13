'use client';

import React, { useState, useEffect } from 'react';
import { HelpCircle, RefreshCw, AlertCircle } from 'lucide-react';

export default function ManagerHelpdeskPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTickets = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/v1/hr-requests');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setTickets(data.data || []);
        }
      }
    } catch (err) {
      console.error('Error fetching manager helpdesk tickets:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Team Helpdesk & Escalations</h1>
          <p className="text-sm text-slate-500 mt-1">Track support tickets and HR requests escalated by direct reports.</p>
        </div>
        <button
          onClick={fetchTickets}
          className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition-all cursor-pointer"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-500">
            <RefreshCw className="h-5 w-5 animate-spin text-indigo-600 mx-auto mb-2" />
            <span>Loading tickets...</span>
          </div>
        ) : tickets.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            No active helpdesk tickets for your team.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Ticket No</th>
                  <th className="py-3.5 px-4">Subject</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Priority</th>
                  <th className="py-3.5 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tickets.map((t) => (
                  <tr key={t._id || t.id} className="hover:bg-slate-50/80">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{t.ticketNo || t._id}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">{t.subject || t.title}</td>
                    <td className="py-3.5 px-4">{t.category || 'General'}</td>
                    <td className="py-3.5 px-4">
                      <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[9px] font-bold text-amber-700">
                        {t.priority || 'MEDIUM'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[9px] font-bold text-indigo-700">
                        {t.status || 'OPEN'}
                      </span>
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
