'use client';

import React from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { mockJobOpenings, mockCandidates } from '@/data/modulesData';
import { UserPlus, Briefcase, Users, Star, ArrowRight } from 'lucide-react';

export default function RecruitmentPage() {
  return (
    <AdminLayout
      pageTitle="Recruitment & Hiring Pipeline"
      breadcrumbs={[{ label: 'Recruitment', href: '/admin/recruitment' }]}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Active Requisitions & Candidates</h2>
          <p className="text-xs text-slate-500">
            Track job postings, resume uploads, interview scheduling, and offer letters
          </p>
        </div>
        <button className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-md hover:bg-blue-700">
          + Create Job Requisition
        </button>
      </div>

      {/* Candidate Pipeline Stages Flow */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm text-xs">
        <h4 className="font-bold text-slate-900 mb-2">Candidate Recruitment Pipeline</h4>
        <div className="flex flex-wrap items-center gap-2 font-semibold">
          <span className="rounded-lg bg-slate-100 px-3 py-1.5 border border-slate-200">Applied (38)</span>
          <span>→</span>
          <span className="rounded-lg bg-blue-50 text-blue-700 px-3 py-1.5 border border-blue-200">Screening (14)</span>
          <span>→</span>
          <span className="rounded-lg bg-purple-50 text-purple-700 px-3 py-1.5 border border-purple-200">Interview (8)</span>
          <span>→</span>
          <span className="rounded-lg bg-amber-50 text-amber-700 px-3 py-1.5 border border-amber-200">Technical Round (4)</span>
          <span>→</span>
          <span className="rounded-lg bg-emerald-50 text-emerald-700 px-3 py-1.5 border border-emerald-200">Offer Sent (2)</span>
        </div>
      </div>

      {/* Candidates Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="p-4 border-b border-slate-100 font-bold text-sm text-slate-900">Active Candidates</div>
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
            {mockCandidates.map((cand) => (
              <tr key={cand.id} className="hover:bg-slate-50/60">
                <td className="px-4 py-3.5 font-bold text-slate-900">{cand.name}</td>
                <td className="px-4 py-3.5 text-slate-700">{cand.jobTitle}</td>
                <td className="px-4 py-3.5 text-slate-500">{cand.email}</td>
                <td className="px-4 py-3.5">
                  <span className="rounded-full bg-purple-50 px-2.5 py-0.5 text-[10px] font-semibold text-purple-700 border border-purple-200">
                    {cand.stage}
                  </span>
                </td>
                <td className="px-4 py-3.5 font-bold text-amber-600 flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" /> {cand.rating}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
