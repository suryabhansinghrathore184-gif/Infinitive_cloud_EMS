'use client';

import React, { useState, useEffect } from 'react';
import { X, Briefcase, Eye, Save, Send, DollarSign, Globe, Lock } from 'lucide-react';
import { JobOpening } from '@/types/admin';

interface CreateJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (job: Partial<JobOpening>) => void;
  onPreview?: (job: Partial<JobOpening>) => void;
  initialData?: JobOpening | null;
}

export const CreateJobModal: React.FC<CreateJobModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onPreview,
  initialData,
}) => {
  const [jobTitle, setJobTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [department, setDepartment] = useState('Engineering & IT');
  const [location, setLocation] = useState('Mumbai HQ');
  const [employmentType, setEmploymentType] = useState<'Full-time' | 'Part-time' | 'Contract' | 'Intern' | 'Temporary'>('Full-time');
  const [experience, setExperience] = useState('1-3 Years');
  const [openings, setOpenings] = useState(1);
  const [skills, setSkills] = useState('');
  const [salary, setSalary] = useState('');
  const [showSalaryPublicly, setShowSalaryPublicly] = useState(false);
  const [description, setDescription] = useState('');
  const [responsibilities, setResponsibilities] = useState('');
  const [requirements, setRequirements] = useState('');
  const [benefits, setBenefits] = useState('');
  const [applicationDeadline, setApplicationDeadline] = useState('');
  const [visibility, setVisibility] = useState<'Internal Only' | 'Public Website'>('Public Website');
  const [status, setStatus] = useState<'Draft' | 'Published' | 'Expired' | 'Archived'>('Published');

  useEffect(() => {
    if (initialData) {
      setJobTitle(initialData.jobTitle || '');
      setSlug(initialData.slug || '');
      setDepartment(initialData.department || 'Engineering & IT');
      setLocation(initialData.location || 'Mumbai HQ');
      setEmploymentType((initialData.employmentType || initialData.type || 'Full-time') as any);
      setExperience(initialData.experience || '1-3 Years');
      setOpenings(initialData.openings || 1);
      setSkills(Array.isArray(initialData.skills) ? initialData.skills.join(', ') : initialData.skills || '');
      setSalary(initialData.salary || '');
      setShowSalaryPublicly(initialData.showSalaryPublicly || false);
      setDescription(initialData.description || '');
      setResponsibilities(initialData.responsibilities || '');
      setRequirements(initialData.requirements || '');
      setBenefits(initialData.benefits || '');
      setApplicationDeadline(initialData.applicationDeadline || '');
      setVisibility(initialData.visibility || 'Public Website');
      setStatus((initialData.status as any) || 'Published');
    } else {
      setJobTitle('');
      setSlug('');
      setDepartment('Engineering & IT');
      setLocation('Mumbai HQ');
      setEmploymentType('Full-time');
      setExperience('1-3 Years');
      setOpenings(1);
      setSkills('');
      setSalary('');
      setShowSalaryPublicly(false);
      setDescription('');
      setResponsibilities('');
      setRequirements('');
      setBenefits('');
      setApplicationDeadline('');
      setVisibility('Public Website');
      setStatus('Published');
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleTitleChange = (val: string) => {
    setJobTitle(val);
    if (!initialData) {
      const generated = val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      setSlug(generated);
    }
  };

  const getPayload = (targetStatus: 'Draft' | 'Published' | 'Expired' | 'Archived'): Partial<JobOpening> => {
    const skillsList = skills
      ? skills.split(',').map((s) => s.trim()).filter(Boolean)
      : [];

    return {
      id: initialData?.id,
      jobTitle: jobTitle.trim(),
      slug: slug.trim() || jobTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      department,
      location,
      employmentType,
      type: employmentType,
      experience,
      openings: Number(openings) || 1,
      skills: skillsList,
      salary: salary.trim(),
      showSalaryPublicly,
      description: description.trim(),
      responsibilities: responsibilities.trim(),
      requirements: requirements.trim(),
      benefits: benefits.trim(),
      applicationDeadline,
      visibility,
      status: targetStatus,
    };
  };

  const handleSubmit = (e: React.FormEvent, targetStatus: 'Draft' | 'Published' | 'Expired' | 'Archived' = 'Published') => {
    e.preventDefault();
    if (!jobTitle.trim()) {
      alert('Job Title is required.');
      return;
    }
    const payload = getPayload(targetStatus);
    onSave(payload);
    onClose();
  };

  const handlePreviewClick = () => {
    if (!jobTitle.trim()) {
      alert('Please fill Job Title before previewing.');
      return;
    }
    if (onPreview) {
      onPreview(getPayload(status));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl text-xs text-slate-800 animate-fade-in max-h-[90vh] flex flex-col justify-between">
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-3 font-bold text-sm text-slate-900">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <Briefcase className="h-4 w-4" />
            </div>
            <span>{initialData ? 'Edit Hiring Requirement' : 'Create & Publish Job Requirement'}</span>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={(e) => handleSubmit(e, status)} className="my-4 flex-1 overflow-y-auto space-y-4 pr-1">
          <div>
            <label className="font-bold text-slate-900">Job Title / Requirement Position *</label>
            <input
              type="text"
              required
              placeholder="e.g. Lead Full Stack Software Engineer"
              value={jobTitle}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-slate-50 font-medium focus:border-blue-500 focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-900">Public Visibility Setting *</label>
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as any)}
                className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-slate-50 font-semibold text-slate-800 focus:border-blue-500 focus:bg-white"
              >
                <option value="Public Website">Public Website (Visible on Careers Page)</option>
                <option value="Internal Only">Internal Only (HR Internal Pipeline)</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-900">SEO URL Slug</label>
              <input
                type="text"
                placeholder="e.g. lead-full-stack-software-engineer"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-slate-50 font-mono text-[11px]"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="font-bold text-slate-900">Department</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-slate-50"
              >
                <option value="Engineering & IT">Engineering & IT</option>
                <option value="Human Resources">Human Resources</option>
                <option value="Finance & Accounts">Finance & Accounts</option>
                <option value="Sales & Marketing">Sales & Marketing</option>
                <option value="Product & Design">Product & Design</option>
                <option value="Operations & Logistics">Operations & Logistics</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-900">Location</label>
              <input
                type="text"
                placeholder="e.g. Mumbai HQ / Remote / Hybrid"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-slate-50"
              />
            </div>

            <div>
              <label className="font-bold text-slate-900">Employment Type</label>
              <select
                value={employmentType}
                onChange={(e) => setEmploymentType(e.target.value as any)}
                className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-slate-50"
              >
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Contract">Contract</option>
                <option value="Intern">Internship</option>
                <option value="Temporary">Temporary</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="font-bold text-slate-900">Experience Required</label>
              <select
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-slate-50"
              >
                <option value="Freshers / Entry Level">Freshers / Entry Level</option>
                <option value="1-3 Years">1-3 Years</option>
                <option value="3-5 Years">3-5 Years</option>
                <option value="5-8 Years">5-8 Years</option>
                <option value="8+ Senior Level">8+ Senior Level</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-900">Number of Openings</label>
              <input
                type="number"
                min={1}
                value={openings}
                onChange={(e) => setOpenings(parseInt(e.target.value) || 1)}
                className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-slate-50 font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="font-bold text-slate-900">Application Deadline</label>
              <input
                type="date"
                value={applicationDeadline}
                onChange={(e) => setApplicationDeadline(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-slate-50"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-900">Salary Range / Package (Optional)</label>
              <input
                type="text"
                placeholder="e.g. ₹12,00,000 - ₹18,00,000 P.A."
                value={salary}
                onChange={(e) => setSalary(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-slate-50"
              />
            </div>

            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                id="showSalaryPublicly"
                checked={showSalaryPublicly}
                onChange={(e) => setShowSalaryPublicly(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="showSalaryPublicly" className="font-bold text-slate-800 cursor-pointer">
                Display Salary Publicly on Website
              </label>
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-900">Required Technical Skills (Comma separated)</label>
            <input
              type="text"
              placeholder="React, Next.js, Node.js, MongoDB, TypeScript, TailwindCSS"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-slate-50"
            />
          </div>

          <div>
            <label className="font-bold text-slate-900">Job Description Overview</label>
            <textarea
              rows={3}
              placeholder="High-level overview of the role..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-slate-50"
            />
          </div>

          <div>
            <label className="font-bold text-slate-900">Key Responsibilities</label>
            <textarea
              rows={3}
              placeholder="List daily duties and project responsibilities..."
              value={responsibilities}
              onChange={(e) => setResponsibilities(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-slate-50"
            />
          </div>

          <div>
            <label className="font-bold text-slate-900">Requirements & Qualifications</label>
            <textarea
              rows={3}
              placeholder="Degree requirements, experience, technical prerequisites..."
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-slate-50"
            />
          </div>

          <div>
            <label className="font-bold text-slate-900">Benefits & Employee Perks</label>
            <textarea
              rows={2}
              placeholder="Health insurance, flexible working, bonuses, learning stipends..."
              value={benefits}
              onChange={(e) => setBenefits(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-slate-50"
            />
          </div>
        </form>

        {/* Footer Action Buttons */}
        <div className="flex items-center justify-between border-t pt-3">
          <button
            type="button"
            onClick={handlePreviewClick}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 font-bold text-slate-700 hover:bg-slate-100"
          >
            <Eye className="h-4 w-4 text-blue-600" />
            <span>Preview on Website</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={(e) => handleSubmit(e, 'Draft')}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 font-semibold text-slate-700 hover:bg-slate-50"
            >
              <Save className="h-3.5 w-3.5 text-amber-600" />
              <span>Save Draft</span>
            </button>

            <button
              type="button"
              onClick={(e) => handleSubmit(e, 'Published')}
              className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 font-bold text-white shadow-md hover:bg-blue-700"
            >
              <Send className="h-3.5 w-3.5 fill-white" />
              <span>{initialData ? 'Update & Publish' : 'Publish Opportunity'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
