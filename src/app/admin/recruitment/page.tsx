'use client';

import React, { useState } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Briefcase, Star, CheckCircle2, Plus, Users, MapPin, Building } from 'lucide-react';
import { useEmsStore } from '@/store/emsStore';
import { CreateJobModal } from '@/components/modals/CreateJobModal';

export default function RecruitmentPage() {
  const { state, addJobOpening } = useEmsStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const jobs = state.jobs || [];
  const candidates = state.candidates || [];

  const handleSaveJob = (jobData: any) => {
    addJobOpening(jobData);
    showToast(`Job requisition "${jobData.jobTitle}" created successfully!`);
  };

  // Pipeline stage counters
  const appliedCount = candidates.filter((c) => c.stage === 'Applied').length;
  const screeningCount = candidates.filter((c) => c.stage === 'Screening').length;
  const interviewCount = candidates.filter((c) => c.stage === 'Interview').length;
  const techRoundCount = candidates.filter((c) => c.stage === 'Technical Round').length;
  const offerCount = candidates.filter((c) => c.stage === 'Offer' || c.stage === 'Selected').length;

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
            Track job postings, candidate submissions, interview scheduling, and offer letters
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-md hover:bg-blue-700 transition"
        >
          <Plus className="h-4 w-4" />
          <span>+ Create Job Requisition</span>
        </button>
      </div>

      {/* Candidate Pipeline Stages Flow */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm text-xs">
        <h4 className="font-bold text-slate-900 mb-3">Candidate Recruitment Pipeline</h4>
        <div className="flex flex-wrap items-center gap-2 font-semibold text-slate-600">
          <span className="rounded-lg bg-blue-50 text-blue-700 px-3 py-1.5 border border-blue-200">
            Applied ({appliedCount})
          </span>
          <span>→</span>
          <span className="rounded-lg bg-amber-50 text-amber-700 px-3 py-1.5 border border-amber-200">
            Screening ({screeningCount})
          </span>
          <span>→</span>
          <span className="rounded-lg bg-purple-50 text-purple-700 px-3 py-1.5 border border-purple-200">
            Interview ({interviewCount})
          </span>
          <span>→</span>
          <span className="rounded-lg bg-indigo-50 text-indigo-700 px-3 py-1.5 border border-indigo-200">
            Technical Round ({techRoundCount})
          </span>
          <span>→</span>
          <span className="rounded-lg bg-emerald-50 text-emerald-700 px-3 py-1.5 border border-emerald-200">
            Offer Sent ({offerCount})
          </span>
        </div>
      </div>

      {/* Active Job Openings Grid */}
      {jobs.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-900">Job Openings ({jobs.length})</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {jobs.map((job) => (
              <div key={job.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:border-blue-300 transition">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{job.jobTitle}</h4>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                      <Building className="h-3 w-3" /> {job.department}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                      job.status === 'Active'
                        ? 'bg-emerald-100 text-emerald-700'
                        : job.status === 'Draft'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {job.status}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-slate-500 border-t pt-3 border-slate-100">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {job.location}
                  </span>
                  <span className="flex items-center gap-1 font-semibold text-slate-700">
                    <Users className="h-3 w-3 text-blue-600" /> {job.openings} Openings
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Candidates Table vs Empty State */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="p-4 border-b border-slate-100 font-bold text-sm text-slate-900 flex items-center justify-between">
          <span>Active Candidates ({candidates.length})</span>
        </div>
        {candidates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <Briefcase className="h-6 w-6" />
            </div>
            <h4 className="mt-3 text-sm font-bold text-slate-800">No job openings or candidates yet</h4>
            <p className="mt-1 max-w-xs text-xs text-slate-500">
              Create a job opening to start receiving and screening applicant resumes.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-4 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-md hover:bg-blue-700"
            >
              + Create First Job Requisition
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
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
                    <td className="px-4 py-3.5">
                      <span className="rounded-md bg-blue-50 px-2 py-1 text-blue-700 font-medium">
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
        )}
      </div>

      <CreateJobModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveJob}
      />
    </AdminLayout>
  );
}
