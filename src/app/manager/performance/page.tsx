'use client';

import React, { useState, useEffect } from 'react';
import { TrendingUp, RefreshCw, Star } from 'lucide-react';

export default function ManagerPerformancePage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPerformance = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/v1/performance');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setReviews(data.data || []);
        }
      }
    } catch (err) {
      console.error('Error fetching team performance:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPerformance();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Team Performance Reviews</h1>
          <p className="text-sm text-slate-500 mt-1">Conduct appraisals and track KPI goals for direct reports.</p>
        </div>
        <button
          onClick={fetchPerformance}
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
            <span>Loading performance appraisals...</span>
          </div>
        ) : reviews.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            No performance appraisals recorded for team members.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Employee</th>
                  <th className="py-3.5 px-4">Cycle</th>
                  <th className="py-3.5 px-4">KPI Score</th>
                  <th className="py-3.5 px-4">Rating</th>
                  <th className="py-3.5 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reviews.map((rev) => (
                  <tr key={rev._id || rev.id} className="hover:bg-slate-50/80">
                    <td className="py-3.5 px-4 font-semibold text-slate-900">{rev.employeeName || rev.employeeId}</td>
                    <td className="py-3.5 px-4">{rev.cycle || '2026 Q1'}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-indigo-600">{rev.score || '85%'}</td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1 text-amber-500 font-bold">
                        <Star className="h-3.5 w-3.5 fill-amber-400" />
                        <span>{rev.rating || '4.5'}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
                        {rev.status || 'Completed'}
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
