'use client';

import React, { useState, useEffect } from 'react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { TrendingUp, RefreshCw, Star, CheckCircle2, Award } from 'lucide-react';

interface PerformanceReview {
  _id?: string;
  id?: string;
  cycle?: string;
  score?: string | number;
  rating?: string | number;
  feedback?: string;
  managerNotes?: string;
  status?: string;
  createdAt?: string;
}

export default function EmployeePerformancePage() {
  const [reviews, setReviews] = useState<PerformanceReview[]>([]);
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
      console.error('Error fetching personal performance:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPerformance();
  }, []);

  return (
    <AuthGuard allowedRoles={['EMPLOYEE', 'SUPER_ADMIN', 'ADMIN', 'HR', 'MANAGER']}>
      <AdminLayout
        allowedRoles={['EMPLOYEE', 'SUPER_ADMIN', 'ADMIN', 'HR', 'MANAGER']}
        pageTitle="My Performance & Goals"
        breadcrumbs={[
          { label: 'My Workspace', href: '/employee/dashboard' },
          { label: 'Performance', href: '/employee/performance' },
        ]}
      >
        <div className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">My Performance Reviews & Appraisal Goals</h1>
              <p className="text-xs text-slate-500 mt-1">
                View manager feedback ratings, performance cycle scores, self-assessments, and milestone accomplishments.
              </p>
            </div>
            <button
              onClick={fetchPerformance}
              disabled={isLoading}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh History</span>
            </button>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
            {isLoading ? (
              <div className="p-12 text-center text-xs text-slate-500">
                <RefreshCw className="h-5 w-5 animate-spin text-indigo-600 mx-auto mb-2" />
                <span>Loading performance appraisal records...</span>
              </div>
            ) : reviews.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-500">
                <Award className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                <p className="font-bold text-slate-700 text-sm">No appraisal records found</p>
                <p className="text-xs text-slate-400 mt-1">When manager performance reviews are published, your scores will appear here.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4">Cycle</th>
                      <th className="py-3.5 px-4">KPI Score</th>
                      <th className="py-3.5 px-4">Rating</th>
                      <th className="py-3.5 px-4">Manager Feedback</th>
                      <th className="py-3.5 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {reviews.map((rev) => (
                      <tr key={rev._id || rev.id} className="hover:bg-slate-50/80">
                        <td className="py-3.5 px-4 font-bold text-slate-900">{rev.cycle || 'N/A'}</td>
                        <td className="py-3.5 px-4 font-mono font-bold text-indigo-600">
                          {rev.score !== undefined ? `${rev.score}%` : '--'}
                        </td>
                        <td className="py-3.5 px-4">
                          {rev.rating !== undefined ? (
                            <div className="flex items-center gap-1 text-amber-500 font-bold">
                              <Star className="h-3.5 w-3.5 fill-amber-400" />
                              <span>{rev.rating}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 font-mono">--</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-slate-700 max-w-xs truncate">{rev.feedback || 'None'}</td>
                        <td className="py-3.5 px-4">
                          <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
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
      </AdminLayout>
    </AuthGuard>
  );
}
