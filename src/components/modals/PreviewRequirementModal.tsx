'use client';

import React from 'react';
import { X, Briefcase, MapPin, Building, Calendar, Users, Globe, Eye, ArrowLeft, CheckCircle2, DollarSign } from 'lucide-react';
import { JobOpening } from '@/types/admin';

interface PreviewRequirementModalProps {
  isOpen: boolean;
  onClose: () => void;
  requirement: Partial<JobOpening> | null;
}

export const PreviewRequirementModal: React.FC<PreviewRequirementModalProps> = ({
  isOpen,
  onClose,
  requirement,
}) => {
  if (!isOpen || !requirement) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-xs">
      <div className="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-2xl text-xs text-slate-800 animate-fade-in max-h-[90vh] flex flex-col justify-between">
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-3 font-bold text-sm text-slate-900">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <Eye className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Careers Live Preview</h3>
              <p className="text-[11px] font-normal text-slate-500">Previewing how this job requirement will appear on the public careers page</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${
                requirement.visibility === 'Public Website'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}
            >
              {requirement.visibility || 'Internal Only'}
            </span>
            <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="my-4 flex-1 overflow-y-auto space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b pb-4">
              <div>
                <span className="rounded-md bg-blue-50 px-2.5 py-1 text-[10px] font-bold text-blue-700 border border-blue-200">
                  {requirement.department || 'Engineering'}
                </span>
                <h1 className="mt-2 text-xl font-extrabold text-slate-900">{requirement.jobTitle || 'Position Title'}</h1>
                <div className="mt-2 flex flex-wrap items-center gap-4 text-slate-600 font-medium">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" /> {requirement.location || 'Headquarters'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Briefcase className="h-3.5 w-3.5 text-slate-400" /> {requirement.employmentType || 'Full-time'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5 text-slate-400" /> {requirement.openings || 1} Openings
                  </span>
                </div>
              </div>

              <div className="flex flex-col items-end gap-2">
                {requirement.showSalaryPublicly && requirement.salary && (
                  <span className="rounded-xl bg-emerald-50 px-3 py-1.5 font-extrabold text-emerald-700 border border-emerald-200">
                    ₹{requirement.salary}
                  </span>
                )}
                <button
                  type="button"
                  className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-blue-700 cursor-default"
                >
                  Apply Now
                </button>
              </div>
            </div>

            {/* Description */}
            {requirement.description && (
              <div>
                <h4 className="font-bold text-slate-900 text-xs uppercase text-slate-400">Position Overview</h4>
                <p className="mt-1 leading-relaxed text-slate-700 whitespace-pre-line">{requirement.description}</p>
              </div>
            )}

            {/* Responsibilities */}
            {requirement.responsibilities && (
              <div>
                <h4 className="font-bold text-slate-900 text-xs uppercase text-slate-400">Key Responsibilities</h4>
                <p className="mt-1 leading-relaxed text-slate-700 whitespace-pre-line">{requirement.responsibilities}</p>
              </div>
            )}

            {/* Requirements / Skills */}
            {requirement.requirements && (
              <div>
                <h4 className="font-bold text-slate-900 text-xs uppercase text-slate-400">Requirements & Qualifications</h4>
                <p className="mt-1 leading-relaxed text-slate-700 whitespace-pre-line">{requirement.requirements}</p>
              </div>
            )}

            {/* Benefits */}
            {requirement.benefits && (
              <div>
                <h4 className="font-bold text-slate-900 text-xs uppercase text-slate-400">Benefits & Perks</h4>
                <p className="mt-1 leading-relaxed text-slate-700 whitespace-pre-line">{requirement.benefits}</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t pt-3">
          <p className="text-[11px] text-slate-500">
            Public Link: <code className="font-mono text-blue-600">/careers/{requirement.slug || 'job-slug'}</code>
          </p>
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-slate-800"
          >
            <ArrowLeft className="h-4 w-4" /> Close Preview
          </button>
        </div>
      </div>
    </div>
  );
};
