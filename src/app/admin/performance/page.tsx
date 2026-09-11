'use client';

import React, { useState } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { useEmsStore } from '@/store/emsStore';
import { Star, Target, CheckCircle2, Trash2, Plus } from 'lucide-react';
import { LaunchPerformanceCycleModal } from '@/components/modals/LaunchPerformanceCycleModal';

export default function PerformancePage() {
  const { state, addPerformanceReview, deletePerformanceReview } = useEmsStore();
  const [isLaunchModalOpen, setIsLaunchModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const reviews = state.performanceReviews || [];
  const employees = state.employees || [];

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Manager Review':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Self Review':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Goal Setting':
      default:
        return 'bg-amber-50 text-amber-700 border-amber-200';
    }
  };

  return (
    <AdminLayout
      pageTitle="Performance Management"
      breadcrumbs={[{ label: 'Performance', href: '/admin/performance' }]}
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed right-6 top-20 z-50 flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs text-white shadow-xl">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Performance Cycles & OKRs</h2>
          <p className="text-xs text-slate-500">
            Track employee OKRs, KPIs, 360-degree review cycles, and annual ratings
          </p>
        </div>
        <button
          onClick={() => setIsLaunchModalOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-md hover:bg-blue-700 transition-all cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>+ Launch New Review Cycle</span>
        </button>
      </div>

      {/* Performance Review Workflow */}
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
              Click &quot;+ Launch New Review Cycle&quot; above to initiate a performance evaluation cycle.
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
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reviews.map((rev) => (
                <tr key={rev.id} className="hover:bg-slate-50/60">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <img
                        src={rev.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80'}
                        alt={rev.employeeName}
                        className="h-8 w-8 rounded-full object-cover"
                      />
                      <div>
                        <p className="font-bold text-slate-900">{rev.employeeName}</p>
                        <p className="text-[10px] text-slate-400">{rev.department}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 font-semibold text-slate-800">{rev.cycle}</td>
                  <td className="px-4 py-3.5 text-slate-700 font-medium">{rev.selfRating} / 5.0</td>
                  <td className="px-4 py-3.5 text-slate-700 font-medium">{rev.managerRating} / 5.0</td>
                  <td className="px-4 py-3.5 font-extrabold text-emerald-600">
                    <div className="flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 fill-emerald-600 text-emerald-600" />
                      <span>{rev.finalRating}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold border ${getStatusBadge(rev.status)}`}>
                      {rev.status}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <button
                      onClick={() => setDeleteConfirmId(rev.id)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                      title="Delete Record"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Launch Modal */}
      <LaunchPerformanceCycleModal
        isOpen={isLaunchModalOpen}
        onClose={() => setIsLaunchModalOpen(false)}
        employees={employees}
        onSave={(data) => {
          addPerformanceReview(data);
          showToast(`Performance cycle launched for ${data.employeeName}`);
        }}
      />

      {/* Delete Confirmation Dialog */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl space-y-4 text-xs">
            <h3 className="text-sm font-bold text-slate-900">Delete Performance Record?</h3>
            <p className="text-slate-600">
              Are you sure you want to remove this performance review record? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deletePerformanceReview(deleteConfirmId);
                  setDeleteConfirmId(null);
                  showToast('Performance record deleted successfully');
                }}
                className="rounded-xl bg-rose-600 px-4 py-2 font-semibold text-white shadow-md hover:bg-rose-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
