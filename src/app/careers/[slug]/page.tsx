'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { PublicHeader } from '@/components/layout/PublicHeader';
import { Briefcase, MapPin, Building, Calendar, Users, ArrowLeft, Upload, Send, CheckCircle2, AlertCircle, X, FileText } from 'lucide-react';
import { JobOpening } from '@/types/admin';

export default function CareerDetailPage({ params }: { params: { slug: string } }) {
  const [data, setData] = useState<{ job: JobOpening; related: JobOpening[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Apply Now Modal State
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [applicantName, setApplicantName] = useState('');
  const [applicantEmail, setApplicantEmail] = useState('');
  const [applicantPhone, setApplicantPhone] = useState('');
  const [coverLetter, setCoverLetter] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDetail() {
      setLoading(true);
      try {
        const res = await fetch(`/api/v1/public/careers/${params.slug}`);
        const json = await res.json();
        if (json.success && json.data?.job) {
          setData(json.data);
        } else {
          setErrorMsg(json.message || 'Requirement position not found.');
        }
      } catch (err) {
        setErrorMsg('Failed to retrieve requirement details.');
      } finally {
        setLoading(false);
      }
    }
    fetchDetail();
  }, [params.slug]);

  const job = data?.job;
  const related = data?.related || [];

  const handleApplicationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applicantName.trim() || !applicantEmail.trim()) {
      alert('Full Name and Email Address are required.');
      return;
    }
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('name', applicantName.trim());
      formData.append('email', applicantEmail.trim());
      formData.append('phone', applicantPhone.trim());
      formData.append('coverLetter', coverLetter.trim());
      formData.append('linkedinUrl', linkedinUrl.trim());
      formData.append('portfolioUrl', portfolioUrl.trim());
      if (resumeFile) {
        formData.append('resume', resumeFile);
      }

      const res = await fetch(`/api/v1/public/careers/${params.slug}/apply`, {
        method: 'POST',
        body: formData,
      });

      const json = await res.json();
      setIsSubmitting(false);

      if (json.success) {
        setSubmissionSuccess(json.message || 'Application submitted successfully!');
        setApplicantName('');
        setApplicantEmail('');
        setApplicantPhone('');
        setCoverLetter('');
        setLinkedinUrl('');
        setPortfolioUrl('');
        setResumeFile(null);
      } else {
        alert(json.message || 'Failed to submit application.');
      }
    } catch (err: any) {
      setIsSubmitting(false);
      alert(err.message || 'Error submitting application.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <PublicHeader />

      <main className="mx-auto max-w-4xl w-full flex-1 px-4 py-8 sm:px-6 space-y-6">
        {/* Back Link */}
        <Link
          href="/careers"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-blue-400 transition"
        >
          <ArrowLeft className="h-4 w-4" /> Back to All Opportunities
        </Link>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
            <p className="mt-3 text-xs text-slate-400 font-semibold">Loading position requirement...</p>
          </div>
        ) : errorMsg || !job ? (
          <div className="rounded-3xl border border-slate-800 bg-slate-900/50 p-12 text-center text-xs text-slate-400">
            <Briefcase className="h-10 w-10 text-slate-600 mx-auto" />
            <h3 className="mt-3 text-sm font-bold text-slate-200">Position Unavailable</h3>
            <p className="mt-1 text-slate-400">{errorMsg || 'This hiring requirement is no longer active.'}</p>
            <Link
              href="/careers"
              className="mt-4 inline-block rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-blue-700"
            >
              Return to Careers
            </Link>
          </div>
        ) : (
          <article className="space-y-6">
            {/* Header Section Card */}
            <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 sm:p-8 space-y-4 shadow-xl">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-800 pb-5">
                <div>
                  <span className="rounded-md bg-blue-500/10 px-3 py-1 text-xs font-bold text-blue-400 border border-blue-500/20">
                    {job.department}
                  </span>
                  <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold text-white leading-tight">
                    {job.jobTitle}
                  </h1>

                  <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-400 font-medium">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="h-4 w-4 text-slate-500" /> {job.location}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Briefcase className="h-4 w-4 text-slate-500" /> {job.employmentType || job.type || 'Full-time'}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Users className="h-4 w-4 text-blue-400" /> {job.openings} Openings
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-4 w-4 text-slate-500" /> Exp: {job.experience || '1-3 Yrs'}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  {job.showSalaryPublicly && job.salary && (
                    <span className="rounded-2xl bg-emerald-500/10 border border-emerald-500/30 px-4 py-2 font-extrabold text-emerald-400 text-sm">
                      ₹{job.salary}
                    </span>
                  )}
                  <button
                    onClick={() => {
                      setSubmissionSuccess(null);
                      setIsApplyModalOpen(true);
                    }}
                    className="rounded-2xl bg-blue-600 px-6 py-2.5 text-xs font-extrabold text-white shadow-lg hover:bg-blue-500 transition"
                  >
                    Apply Now
                  </button>
                </div>
              </div>

              {/* Skills Badges */}
              {Array.isArray(job.skills) && job.skills.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-xs font-bold text-slate-400 mr-1">Required Skills:</span>
                  {job.skills.map((skill, i) => (
                    <span
                      key={i}
                      className="rounded-lg bg-slate-800 px-2.5 py-1 text-[11px] font-semibold text-slate-200 border border-slate-700"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Description & Detail Sections */}
            <div className="space-y-6 text-xs sm:text-sm text-slate-300 leading-relaxed">
              {job.description && (
                <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 space-y-2">
                  <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider">Position Overview</h3>
                  <p className="whitespace-pre-line">{job.description}</p>
                </div>
              )}

              {job.responsibilities && (
                <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 space-y-2">
                  <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider">Key Responsibilities</h3>
                  <p className="whitespace-pre-line">{job.responsibilities}</p>
                </div>
              )}

              {job.requirements && (
                <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 space-y-2">
                  <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider">Qualifications & Requirements</h3>
                  <p className="whitespace-pre-line">{job.requirements}</p>
                </div>
              )}

              {job.benefits && (
                <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 space-y-2">
                  <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider">Benefits & Perks</h3>
                  <p className="whitespace-pre-line">{job.benefits}</p>
                </div>
              )}
            </div>

            {/* Apply Action Banner */}
            <div className="rounded-3xl border border-blue-500/30 bg-gradient-to-r from-blue-900/40 to-indigo-900/40 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-extrabold text-white">Interested in this position?</h3>
                <p className="text-xs text-slate-300">Submit your resume and candidate details directly to our HR team.</p>
              </div>
              <button
                onClick={() => {
                  setSubmissionSuccess(null);
                  setIsApplyModalOpen(true);
                }}
                className="rounded-2xl bg-blue-600 px-6 py-3 text-xs font-extrabold text-white shadow-lg hover:bg-blue-500 transition shrink-0"
              >
                Apply Now For This Position
              </button>
            </div>
          </article>
        )}
      </main>

      {/* Candidate Application Modal */}
      {isApplyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl text-xs text-slate-200 animate-fade-in max-h-[90vh] flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 font-bold text-sm text-white">
              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-blue-400" />
                <span>Apply for {job?.jobTitle}</span>
              </div>
              <button onClick={() => setIsApplyModalOpen(false)} className="rounded-lg p-1 text-slate-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            {submissionSuccess ? (
              <div className="my-6 text-center space-y-4 py-4">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <h3 className="text-base font-extrabold text-white">Application Submitted!</h3>
                <p className="text-xs text-slate-300 max-w-xs mx-auto">{submissionSuccess}</p>
                <button
                  onClick={() => setIsApplyModalOpen(false)}
                  className="mt-4 rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-emerald-700"
                >
                  Close & Return
                </button>
              </div>
            ) : (
              <form onSubmit={handleApplicationSubmit} className="my-4 flex-1 overflow-y-auto space-y-3.5 pr-1">
                <div>
                  <label className="font-bold text-slate-200">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Sharma"
                    value={applicantName}
                    onChange={(e) => setApplicantName(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-200">Email Address *</label>
                    <input
                      type="email"
                      required
                      placeholder="rahul@example.com"
                      value={applicantEmail}
                      onChange={(e) => setApplicantEmail(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-200">Phone Number *</label>
                    <input
                      type="tel"
                      required
                      placeholder="+91 98765 43210"
                      value={applicantPhone}
                      onChange={(e) => setApplicantPhone(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-200">Upload Resume / CV (PDF or Docx)</label>
                  <div className="mt-1 flex items-center gap-3 rounded-xl border border-dashed border-slate-700 bg-slate-950 p-3">
                    <Upload className="h-5 w-5 text-blue-400 shrink-0" />
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                      className="text-xs text-slate-400 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-600 file:px-3 file:py-1 file:text-xs file:font-bold file:text-white hover:file:bg-blue-500 cursor-pointer"
                    />
                  </div>
                  {resumeFile && (
                    <p className="mt-1 text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
                      <FileText className="h-3 w-3" /> Selected: {resumeFile.name} ({Math.round(resumeFile.size / 1024)} KB)
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-200">LinkedIn Profile URL</label>
                    <input
                      type="url"
                      placeholder="https://linkedin.com/in/..."
                      value={linkedinUrl}
                      onChange={(e) => setLinkedinUrl(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-200">Portfolio / GitHub URL</label>
                    <input
                      type="url"
                      placeholder="https://github.com/..."
                      value={portfolioUrl}
                      onChange={(e) => setPortfolioUrl(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-200">Cover Letter / Note to HR</label>
                  <textarea
                    rows={3}
                    placeholder="Introduce yourself and explain why you're a great fit..."
                    value={coverLetter}
                    onChange={(e) => setCoverLetter(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div className="flex justify-end gap-2 border-t border-slate-800 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsApplyModalOpen(false)}
                    className="rounded-xl border border-slate-800 px-4 py-2 text-xs font-semibold text-slate-400 hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-blue-500 disabled:opacity-50"
                  >
                    <Send className="h-3.5 w-3.5 fill-white" />
                    <span>{isSubmitting ? 'Submitting Application...' : 'Submit Application'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <footer className="border-t border-slate-800 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <p>© 2026 Enterprise Organization. Careers Portal.</p>
      </footer>
    </div>
  );
}
