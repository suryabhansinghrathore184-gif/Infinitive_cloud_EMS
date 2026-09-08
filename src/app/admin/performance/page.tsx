'use client';

import React from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Star, Target } from 'lucide-react';

export default function PerformancePage() {
  const reviews: any[] = [];

  return (
    <AdminLayout
      pageTitle="Performance Management"
      breadcrumbs={[{ label: 'Performance', href: '/admin/performance' }]}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Performance Cycles & Goals</h2>
          <p className="text-xs text-slate-500">
            Track employee OKRs, KPIs, 360-degree review cycles, and ratings
          </p>
        </div>
        <button className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-md hover:bg-blue-700">
          + Launch New Review Cycle
        </button>
      </div>

      {/* Performance Overview Flow */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm text-xs">
        <h4 className="font-bold text-slate-900 mb-2">Performance Review Workflow</h4>
        <div className="flex flex-wrap items-center gap-2 font-medium text-slate-600">
          <span className="rounded-lg bg-slate-100 px-3 py-1.5 border border-slate-200">Set Goals & OKRs</span>
          <span>→</span>
          <span className="rounded-lg bg-slate-100 px-3 py-1.5 border border-slate-200">Progress Tracking</span>
          <span>→</span>
          <span className="rounded-lg bg-slate-100 px-3 py-1.5 border border-slate-200">Self Review</span>
          <span>→</span>
          <span className="rounded-lg bg-slate-100 px-3 py-1.5 border border-slate-200">Manager Assessment</span>
          <span>→</span>
          <span className="rounded-lg bg-emerald-50 text-emerald-700 px-3 py-1.5 border border-emerald-200 font-bold">Final Rating & Record</span>
        </div>
      </div>

      {/* Reviews Table vs Empty State */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {reviews.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <Target className="h-6 w-6" />
            </div>
            <h4 className="mt-3 text-sm font-bold text-slate-800">No performance records yet</h4>
            <p className="mt-1 max-w-xs text-xs text-slate-500">
              Goal assessments, performance reviews, and manager rating cycles created by HR will appear here.
            </p>
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-slate-500 font-semibold">
                <th className="px-4 py-3.5">Employee</th>
                <th className="px-4 py-3.5">Review Cycle</th>
                <th className="px-4 py-3.5">Self Rating</th>
                <th className="px-4 py-3.5">Manager Rating</th>
                <th className="px-4 py-3.5">Final Score</th>
                <th className="px-4 py-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reviews.map((rev) => (
                <tr key={rev.id} className="hover:bg-slate-50/60">
                  <td className="px-4 py-3.5 font-bold text-slate-900">{rev.employeeName}</td>
                  <td className="px-4 py-3.5 text-slate-700">{rev.cycle}</td>
                  <td className="px-4 py-3.5 text-slate-700 font-medium">{rev.selfRating} / 5.0</td>
                  <td className="px-4 py-3.5 text-slate-700 font-medium">{rev.managerRating} / 5.0</td>
                  <td className="px-4 py-3.5 font-extrabold text-emerald-600 flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 fill-emerald-600 text-emerald-600" /> {rev.finalRating}
                  </td>
                  <td className="px-4 py-3.5">{rev.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AdminLayout>
  );
}
