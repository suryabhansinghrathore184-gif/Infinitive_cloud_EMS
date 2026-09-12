'use client';

import React, { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import {
  Briefcase,
  Star,
  CheckCircle2,
  Plus,
  Users,
  MapPin,
  Building,
  Globe,
  Lock,
  Edit3,
  Trash2,
  Eye,
  Search,
  FileText,
} from 'lucide-react';
import { useEmsStore } from '@/store/emsStore';
import { JobOpening, Candidate } from '@/types/admin';

// Modals
import { CreateJobModal } from '@/components/modals/CreateJobModal';
import { PreviewRequirementModal } from '@/components/modals/PreviewRequirementModal';

export default function RecruitmentPage() {
  const { state, setJobs, addJobOpening, updateJobOpening, deleteJobOpening } = useEmsStore();

  const [activeTab, setActiveTab] = useState<'ALL' | 'PUBLISHED' | 'DRAFT' | 'EXPIRED' | 'ARCHIVED'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<JobOpening | null>(null);
  const [previewRequirement, setPreviewRequirement] = useState<Partial<JobOpening> | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const fetchLiveRecruitment = async () => {
    try {
      const res = await fetch('/api/v1/recruitment');
      const data = await res.json();
      if (data.success && data.data?.jobs) {
        setJobs(data.data.jobs, data.data.candidates);
      }
    } catch (e) {
      console.error('Failed to load recruitment data from server', e);
    }
  };

  useEffect(() => {
    fetchLiveRecruitment();
  }, []);

  const jobs = state.jobs || [];
  const candidates = state.candidates || [];

  const handleSaveJob = async (jobData: Partial<JobOpening>) => {
    try {
      const res = await fetch('/api/v1/recruitment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entityType: 'job', data: jobData }),
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setJobs(data.data);
        showToast(data.message || `Job requirement "${jobData.jobTitle}" saved successfully.`);
      } else {
        addJobOpening(jobData);
        showToast(`Saved job requirement "${jobData.jobTitle}".`);
      }
    } catch (e) {
      addJobOpening(jobData);
      showToast(`Saved job requirement "${jobData.jobTitle}".`);
    }
    setEditingJob(null);
  };

  const handleDeleteJob = async (id: string) => {
    if (!confirm('Are you sure you want to delete this hiring requirement?')) return;
    try {
      await fetch(`/api/v1/recruitment/${id}?entityType=job`, { method: 'DELETE' });
    } catch (e) {
      console.error(e);
    }
    deleteJobOpening(id);
    showToast('Requirement deleted successfully.');
  };

  // Pipeline stage counters
  const appliedCount = candidates.filter((c) => c.stage === 'Applied').length;
  const screeningCount = candidates.filter((c) => c.stage === 'Screening').length;
  const interviewCount = candidates.filter((c) => c.stage === 'Interview').length;
  const techRoundCount = candidates.filter((c) => c.stage === 'Technical Round').length;
  const offerCount = candidates.filter((c) => c.stage === 'Offer' || c.stage === 'Selected').length;

  // Filtered Job Requirements
  const filteredJobs = jobs.filter((job) => {
    const matchSearch =
      job.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.location.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchSearch) return false;

    if (activeTab === 'PUBLISHED') return job.status === 'Published' || job.status === 'Active';
    if (activeTab === 'DRAFT') return job.status === 'Draft';
    if (activeTab === 'EXPIRED') return job.status === 'Expired';
    if (activeTab === 'ARCHIVED') return job.status === 'Archived';
    return true;
  });

  return (
    <AdminLayout
      pageTitle="Recruitment & Hiring Requirements"
      breadcrumbs={[{ label: 'Recruitment', href: '/admin/recruitment' }]}
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed right-6 top-20 z-50 flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs text-white shadow-xl">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Active Hiring Requirements & Opportunities</h2>
          <p className="text-xs text-slate-500">
            Manage company job openings, internship requisitions, candidate applications, and public website listings
          </p>
        </div>
        <button
          onClick={() => {
            setEditingJob(null);
            setIsModalOpen(true);
          }}
          className="flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-blue-700 transition"
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

      {/* Filters & Search Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-200 bg-white p-3 shadow-sm text-xs">
        <div className="flex items-center gap-2 font-bold text-xs border-b sm:border-b-0 pb-2 sm:pb-0">
          <button
            onClick={() => setActiveTab('ALL')}
            className={`rounded-xl px-3 py-1.5 transition ${
              activeTab === 'ALL' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            All ({jobs.length})
          </button>
          <button
            onClick={() => setActiveTab('PUBLISHED')}
            className={`flex items-center gap-1 rounded-xl px-3 py-1.5 transition ${
              activeTab === 'PUBLISHED' ? 'bg-emerald-600 text-white' : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
            }`}
          >
            <Globe className="h-3.5 w-3.5" />
            <span>Published ({jobs.filter((j) => j.status === 'Published' || j.status === 'Active').length})</span>
          </button>
          <button
            onClick={() => setActiveTab('DRAFT')}
            className={`rounded-xl px-3 py-1.5 transition ${
              activeTab === 'DRAFT' ? 'bg-amber-600 text-white' : 'text-amber-700 bg-amber-50 hover:bg-amber-100'
            }`}
          >
            Drafts ({jobs.filter((j) => j.status === 'Draft').length})
          </button>
          <button
            onClick={() => setActiveTab('EXPIRED')}
            className={`rounded-xl px-3 py-1.5 transition ${
              activeTab === 'EXPIRED' ? 'bg-rose-600 text-white' : 'text-rose-700 bg-rose-50 hover:bg-rose-100'
            }`}
          >
            Expired ({jobs.filter((j) => j.status === 'Expired').length})
          </button>
        </div>

        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search job title, department, location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-4 bg-slate-50 text-xs focus:border-blue-500 focus:bg-white"
          />
        </div>
      </div>

      {/* Active Job Requirements Grid */}
      <div className="space-y-3">
        {filteredJobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center rounded-2xl border border-slate-200 bg-white">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <Briefcase className="h-6 w-6" />
            </div>
            <h4 className="mt-3 text-sm font-bold text-slate-800">No hiring requirements match filter</h4>
            <p className="mt-1 max-w-xs text-xs text-slate-500">
              Create a job opening to publish opportunities to the public company website.
            </p>
            <button
              onClick={() => {
                setEditingJob(null);
                setIsModalOpen(true);
              }}
              className="mt-4 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-md hover:bg-blue-700"
            >
              + Create First Job Requisition
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredJobs.map((job) => (
              <div key={job.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:border-blue-300 transition flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{job.jobTitle}</h4>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-1 font-medium">
                        <Building className="h-3 w-3" /> {job.department}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${
                          job.status === 'Active' || job.status === 'Published'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                            : job.status === 'Draft'
                            ? 'bg-amber-100 text-amber-800 border-amber-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        {job.status}
                      </span>
                      <span className="text-[10px] font-bold text-blue-600 flex items-center gap-1">
                        {job.visibility === 'Public Website' ? <Globe className="h-3 w-3 text-emerald-600" /> : <Lock className="h-3 w-3 text-slate-400" />}
                        {job.visibility || 'Internal Only'}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-slate-400" /> {job.location}
                    </span>
                    <span className="flex items-center gap-1 font-semibold text-slate-700">
                      <Users className="h-3 w-3 text-blue-600" /> {job.openings} Openings
                    </span>
                    <span className="col-span-2 text-[10px] text-slate-400">
                      Type: {job.employmentType || job.type || 'Full-time'} • Exp: {job.experience || '1-3 Yrs'}
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between text-xs border-t pt-3 border-slate-100">
                  <span className="text-[10px] text-slate-400 font-mono">
                    {job.applicationDeadline ? `Deadline: ${job.applicationDeadline}` : 'No Deadline'}
                  </span>

                  <div className="flex items-center gap-1">
                    {job.visibility === 'Public Website' && (
                      <button
                        title="Preview on Public Careers Page"
                        onClick={() => setPreviewRequirement(job)}
                        className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 hover:text-blue-600"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      title="Edit Job Requirement"
                      onClick={() => {
                        setEditingJob(job);
                        setIsModalOpen(true);
                      }}
                      className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 hover:text-blue-600"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      title="Delete Requirement"
                      onClick={() => handleDeleteJob(job.id)}
                      className="rounded-lg p-1 text-slate-500 hover:bg-rose-50 hover:text-rose-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Candidates Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm mt-6">
        <div className="p-4 border-b border-slate-100 font-bold text-sm text-slate-900 flex items-center justify-between">
          <span>Active Applicants & Candidate Pipeline ({candidates.length})</span>
        </div>
        {candidates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Briefcase className="h-8 w-8 text-slate-300" />
            <h4 className="mt-2 text-xs font-bold text-slate-700">No applicant submissions recorded yet</h4>
            <p className="mt-1 max-w-xs text-[11px] text-slate-500">
              When candidates click &quot;Apply Now&quot; on published public website opportunities, their applications will display here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-slate-500 font-semibold">
                  <th className="px-4 py-3.5">Candidate Name</th>
                  <th className="px-4 py-3.5">Applied Position</th>
                  <th className="px-4 py-3.5">Contact Email</th>
                  <th className="px-4 py-3.5">Phone</th>
                  <th className="px-4 py-3.5">Stage</th>
                  <th className="px-4 py-3.5 text-right">Resume</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {candidates.map((cand) => (
                  <tr key={cand.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3.5 font-bold text-slate-900">{cand.name}</td>
                    <td className="px-4 py-3.5 text-slate-700 font-medium">{cand.jobTitle}</td>
                    <td className="px-4 py-3.5 text-slate-500">{cand.email}</td>
                    <td className="px-4 py-3.5 text-slate-500 font-mono">{cand.phone || 'N/A'}</td>
                    <td className="px-4 py-3.5">
                      <span className="rounded-md bg-blue-50 px-2 py-1 text-blue-700 font-medium text-[10px]">
                        {cand.stage}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      {cand.resumeFileId ? (
                        <a
                          href={`/api/v1/documents/${cand.resumeFileId}/file`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 font-bold text-blue-600 hover:underline"
                        >
                          <FileText className="h-3.5 w-3.5" /> View Resume
                        </a>
                      ) : (
                        <span className="text-slate-400">No file</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateJobModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingJob(null);
        }}
        onSave={handleSaveJob}
        onPreview={(job) => setPreviewRequirement(job)}
        initialData={editingJob}
      />

      <PreviewRequirementModal
        isOpen={!!previewRequirement}
        onClose={() => setPreviewRequirement(null)}
        requirement={previewRequirement}
      />
    </AdminLayout>
  );
}
