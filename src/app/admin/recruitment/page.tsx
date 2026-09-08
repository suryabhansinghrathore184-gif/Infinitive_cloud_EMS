'use client';

import React, { useState } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Briefcase, Star, CheckCircle2 } from 'lucide-react';

export default function RecruitmentPage() {
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const candidates: any[] = [];

  return (
    <AdminLayout
      pageTitle="Recruitment & Hiring Pipeline"
      breadcrumbs={[{ label: 'Recruitment', href: '/admin/recruitment' }]}
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed right-6 top-20 z-50 flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs text-white shadow-xl">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Active Requisitions & Candidates</h2>
          <p className="text-xs text-slate-500">
            Track job postings, resume uploads, interview scheduling, and offer letters
          </p>
        </div>
        <button
          onClick={() => showToast('Opening job requisition form...')}
          className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-md hover:bg-blue-700"
        >
          + Create Job Requisition
        </button>
      </div>

      {/* Candidate Pipeline Stages Flow */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm text-xs">
        <h4 className="font-bold text-slate-900 mb-2">Candidate Recruitment Pipeline</h4>
        <div className="flex flex-wrap items-center gap-2 font-semibold text-slate-600">
          <span className="rounded-lg bg-slate-100 px-3 py-1.5 border border-slate-200">Applied (0)</span>
          <span>→</span>
          <span className="rounded-lg bg-slate-100 px-3 py-1.5 border border-slate-200">Screening (0)</span>
          <span>→</span>
          <span className="rounded-lg bg-slate-100 px-3 py-1.5 border border-slate-200">Interview (0)</span>
          <span>→</span>
          <span className="rounded-lg bg-slate-100 px-3 py-1.5 border border-slate-200">Technical Round (0)</span>
          <span>→</span>
          <span className="rounded-lg bg-slate-100 px-3 py-1.5 border border-slate-200">Offer Sent (0)</span>
        </div>
      </div>

      {/* Candidates Table vs Empty State */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="p-4 border-b border-slate-100 font-bold text-sm text-slate-900">Active Candidates</div>
        {candidates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <Briefcase className="h-6 w-6" />
            </div>
            <h4 className="mt-3 text-sm font-bold text-slate-800">No job openings or candidates yet</h4>
            <p className="mt-1 max-w-xs text-xs text-slate-500">
              Create a job opening to start receiving and screening applicant resumes.
            </p>
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-slate-500 font-semibold">
                <th className="px-4 py-3.5">Candidate Name</th>
                <th className="px-4 py-3.5">Applied Position</th>
                <th className="px-4 py-3.5">Contact Email</th>
                <th className="px-4 py-3.5">Pipeline Stage</th>
                <th className="px-4 py-3.5">Rating</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {candidates.map((cand) => (
                <tr key={cand.id} className="hover:bg-slate-50/60">
                  <td className="px-4 py-3.5 font-bold text-slate-900">{cand.name}</td>
                  <td className="px-4 py-3.5 text-slate-700">{cand.jobTitle}</td>
                  <td className="px-4 py-3.5 text-slate-500">{cand.email}</td>
                  <td className="px-4 py-3.5">{cand.stage}</td>
                  <td className="px-4 py-3.5 font-bold text-amber-600 flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" /> {cand.rating}
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
