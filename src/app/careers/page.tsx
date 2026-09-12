'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { PublicHeader } from '@/components/layout/PublicHeader';
import { Briefcase, Search, MapPin, Building, Users, Calendar, ArrowRight, CheckCircle2, ChevronRight, DollarSign } from 'lucide-react';
import { JobOpening } from '@/types/admin';

export default function PublicCareersPage() {
  const [jobs, setJobs] = useState<JobOpening[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('ALL');
  const [selectedLocation, setSelectedLocation] = useState('ALL');

  const fetchPublicCareers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/public/careers');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setJobs(data.data);
      }
    } catch (err) {
      console.error('Failed to load public career opportunities', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPublicCareers();
  }, []);

  const departments = ['ALL', 'Engineering & IT', 'Human Resources', 'Finance & Accounts', 'Sales & Marketing', 'Product & Design', 'Operations & Logistics'];

  const filteredJobs = jobs.filter((j) => {
    const matchDept = selectedDepartment === 'ALL' || j.department === selectedDepartment;
    const matchLoc = selectedLocation === 'ALL' || j.location === selectedLocation;
    const matchSearch =
      j.jobTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      j.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      j.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      j.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchDept && matchLoc && matchSearch;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <PublicHeader />

      {/* Hero Header Section */}
      <section className="border-b border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950 py-12 px-4 sm:px-6">
        <div className="mx-auto max-w-6xl text-center space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/10 px-3.5 py-1 text-xs font-bold text-blue-400 border border-blue-500/20">
            <Briefcase className="h-4 w-4" /> Career Opportunities
          </div>
          <h1 className="text-3xl font-extrabold sm:text-4xl text-white tracking-tight">
            Build Your Career With Our Organization
          </h1>
          <p className="mx-auto max-w-2xl text-xs sm:text-sm text-slate-400 leading-relaxed">
            Explore active hiring requirements, job openings, and internship opportunities across engineering, product, finance, and operations.
          </p>

          {/* Search Toolbar */}
          <div className="pt-4 mx-auto max-w-3xl space-y-3">
            <div className="relative">
              <Search className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search job title, skills, technologies, department..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-2xl border border-slate-800 bg-slate-900/90 py-3 pl-11 pr-4 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none shadow-xl"
              />
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-xs">
              {departments.map((dept) => (
                <button
                  key={dept}
                  onClick={() => setSelectedDepartment(dept)}
                  className={`rounded-xl px-3 py-1.5 font-bold transition ${
                    selectedDepartment === dept
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800'
                  }`}
                >
                  {dept}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Opportunities List Body */}
      <main className="mx-auto max-w-6xl w-full flex-1 px-4 py-10 sm:px-6 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-200">
            Open Positions ({filteredJobs.length})
          </h3>
          <span className="text-xs text-slate-400">Direct HR Application Gateway</span>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
            <p className="mt-3 text-xs text-slate-400 font-semibold">Loading open requirements...</p>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-12 text-center text-xs text-slate-400">
            <Briefcase className="h-10 w-10 text-slate-600 mx-auto" />
            <h3 className="mt-3 text-sm font-bold text-slate-200">No open requirements found</h3>
            <p className="mt-1 max-w-xs mx-auto text-slate-400">
              There are currently no active job openings matching your search criteria. Please check back later!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filteredJobs.map((job) => (
              <div
                key={job.id}
                className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-lg hover:border-blue-500/50 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs gap-2">
                    <span className="rounded-md bg-blue-500/10 px-2.5 py-1 font-bold text-blue-400 border border-blue-500/20 text-[10px]">
                      {job.department}
                    </span>
                    <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-[10px] font-semibold text-slate-300">
                      {job.employmentType || job.type || 'Full-time'}
                    </span>
                  </div>

                  <h3 className="mt-3 text-base font-extrabold text-white leading-snug">{job.jobTitle}</h3>

                  <div className="mt-3 space-y-1.5 text-xs text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-slate-500" />
                      <span>{job.location}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5 text-blue-400" />
                        <span className="font-semibold text-slate-300">{job.openings} Openings</span>
                      </span>
                      <span className="text-[11px] text-slate-400">Exp: {job.experience || '1-3 Yrs'}</span>
                    </div>
                  </div>

                  {job.showSalaryPublicly && job.salary && (
                    <div className="mt-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-2 text-center text-xs font-bold text-emerald-400">
                      Salary: ₹{job.salary}
                    </div>
                  )}

                  {job.shortDescription && (
                    <p className="mt-3 text-xs text-slate-400 line-clamp-3 leading-relaxed">
                      {job.shortDescription}
                    </p>
                  )}
                </div>

                <div className="mt-6 border-t border-slate-800 pt-4 flex items-center justify-between text-xs">
                  <span className="text-[10px] text-slate-500 font-mono">
                    {job.applicationDeadline ? `Deadline: ${job.applicationDeadline}` : 'Active Posting'}
                  </span>

                  <Link
                    href={`/careers/${job.slug}`}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-blue-500 transition"
                  >
                    <span>View & Apply</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <footer className="border-t border-slate-800 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <p>© 2026 Enterprise Organization. Official Careers & Hiring Portal.</p>
      </footer>
    </div>
  );
}
