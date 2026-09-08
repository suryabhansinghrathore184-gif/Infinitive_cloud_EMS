'use client';

import React, { useState } from 'react';
import { X, Briefcase } from 'lucide-react';
import { JobOpening } from '@/types/admin';

interface CreateJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (job: Omit<JobOpening, 'id' | 'postedDate' | 'candidatesCount'>) => void;
}

export const CreateJobModal: React.FC<CreateJobModalProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const [jobTitle, setJobTitle] = useState('');
  const [department, setDepartment] = useState('Engineering & IT');
  const [location, setLocation] = useState('Mumbai HQ');
  const [type, setType] = useState('Full-time');
  const [openings, setOpenings] = useState(1);
  const [status, setStatus] = useState<'Active' | 'Closed' | 'Draft'>('Active');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobTitle.trim()) return;

    onSave({
      jobTitle: jobTitle.trim(),
      department: department.trim(),
      location: location.trim(),
      type,
      openings: Number(openings) || 1,
      status,
    });

    setJobTitle('');
    setDepartment('Engineering & IT');
    setLocation('Mumbai HQ');
    setType('Full-time');
    setOpenings(1);
    setStatus('Active');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl text-xs text-slate-800 animate-fade-in">
        <div className="flex items-center justify-between border-b pb-3 font-bold text-sm text-slate-900">
          <div className="flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-blue-600" />
            <span>Create Job Requisition</span>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:text-slate-700">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div>
            <label className="font-bold text-slate-900">Job Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Senior Full Stack Developer"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              className="mt-1 w-full rounded-xl border p-2.5 bg-slate-50 focus:border-blue-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="font-bold text-slate-900">Department</label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="mt-1 w-full rounded-xl border p-2.5 bg-slate-50 focus:border-blue-500 focus:bg-white"
            >
              <option value="Engineering & IT">Engineering & IT</option>
              <option value="Human Resources">Human Resources</option>
              <option value="Finance & Accounts">Finance & Accounts</option>
              <option value="Sales & Marketing">Sales & Marketing</option>
              <option value="Operations & Logistics">Operations & Logistics</option>
            </select>
          </div>

          <div>
            <label className="font-bold text-slate-900">Location</label>
            <input
              type="text"
              required
              placeholder="e.g. Mumbai HQ / Remote"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="mt-1 w-full rounded-xl border p-2.5 bg-slate-50 focus:border-blue-500 focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-900">Employment Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="mt-1 w-full rounded-xl border p-2.5 bg-slate-50 focus:border-blue-500 focus:bg-white"
              >
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Contract">Contract</option>
                <option value="Internship">Internship</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-900">Number of Openings</label>
              <input
                type="number"
                min={1}
                required
                value={openings}
                onChange={(e) => setOpenings(parseInt(e.target.value) || 1)}
                className="mt-1 w-full rounded-xl border p-2.5 bg-slate-50 focus:border-blue-500 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-900">Posting Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="mt-1 w-full rounded-xl border p-2.5 bg-slate-50 focus:border-blue-500 focus:bg-white"
            >
              <option value="Active">Active (Publish Immediately)</option>
              <option value="Draft">Draft</option>
              <option value="Closed">Closed</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-md hover:bg-blue-700"
            >
              Save Requisition
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
