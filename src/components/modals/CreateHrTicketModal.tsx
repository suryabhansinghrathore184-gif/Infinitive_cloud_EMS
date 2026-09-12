'use client';

import React, { useState } from 'react';
import { X, HelpCircle, Paperclip, Send, User, Loader2, AlertCircle } from 'lucide-react';
import { Employee, HrTicket, HrTicketRequestType } from '@/types/admin';

interface CreateHrTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees?: Employee[];
  isHrUser?: boolean;
  onTicketCreated: (ticket: HrTicket) => void;
}

const REQUEST_TYPES: HrTicketRequestType[] = [
  'Salary Issue',
  'Attendance Correction',
  'Leave Issue',
  'Document Request',
  'Payroll Issue',
  'Profile Correction',
  'IT/Asset Request',
  'General HR Query',
];

export const CreateHrTicketModal: React.FC<CreateHrTicketModalProps> = ({
  isOpen,
  onClose,
  employees = [],
  isHrUser = false,
  onTicketCreated,
}) => {
  const [targetEmployeeId, setTargetEmployeeId] = useState('');
  const [requestType, setRequestType] = useState<HrTicketRequestType>('General HR Query');
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High' | 'Urgent'>('Medium');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (selected.size > 10 * 1024 * 1024) {
        setErrorMsg('File size must be under 10MB.');
        return;
      }
      setFile(selected);
      setErrorMsg('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim()) {
      setErrorMsg('Please enter a ticket subject title.');
      return;
    }
    if (!description.trim()) {
      setErrorMsg('Please enter ticket description details.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const formData = new FormData();
      if (targetEmployeeId) formData.append('employeeId', targetEmployeeId);
      formData.append('requestType', requestType);
      formData.append('priority', priority);
      formData.append('subject', subject.trim());
      formData.append('description', description.trim());
      if (file) formData.append('file', file);

      const res = await fetch('/api/v1/hr-requests', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to submit HR support request');
      }

      // Reset
      setTargetEmployeeId('');
      setRequestType('General HR Query');
      setPriority('Medium');
      setSubject('');
      setDescription('');
      setFile(null);

      onTicketCreated(data.ticket);
      onClose();
    } catch (err: any) {
      console.error('Error submitting HR request:', err);
      setErrorMsg(err.message || 'Failed to submit HR request');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600/30 rounded-xl border border-indigo-400/30">
              <HelpCircle className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h2 className="font-semibold text-lg text-white">Create HR Support Request</h2>
              <p className="text-xs text-slate-400">Submit a support ticket to HR administration</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {errorMsg && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Select Employee (Only shown to HR/Admin) */}
          {isHrUser && employees.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                On Behalf of Employee (Optional)
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <select
                  value={targetEmployeeId}
                  onChange={(e) => setTargetEmployeeId(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                >
                  <option value="">-- Submit for Self / General --</option>
                  {employees.map((emp) => {
                    const empIdStr = emp.employeeId || emp.id;
                    const name = `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || 'Employee';
                    return (
                      <option key={empIdStr} value={empIdStr}>
                        {name} ({empIdStr}) - {emp.department || 'General'}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>
          )}

          {/* Grid: Request Type & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Request Type <span className="text-red-500">*</span>
              </label>
              <select
                value={requestType}
                onChange={(e) => setRequestType(e.target.value as HrTicketRequestType)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                required
              >
                {REQUEST_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Priority <span className="text-red-500">*</span>
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                required
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Subject Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Missing Attendance Check-In on 10 Sept"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Detailed Explanation <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={4}
              placeholder="Explain the request or issue in detail..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white resize-none"
              required
            />
          </div>

          {/* Attachment */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Attachment (Optional)
            </label>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl cursor-pointer text-sm font-medium border border-slate-200 transition-colors">
                <Paperclip className="w-4 h-4 text-slate-500" />
                <span>{file ? 'Change File' : 'Attach File'}</span>
                <input type="file" onChange={handleFileChange} className="hidden" />
              </label>
              {file && (
                <div className="flex items-center gap-2 text-xs bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg border border-indigo-100 font-medium">
                  <span className="truncate max-w-[200px]">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => setFile(null)}
                    className="text-indigo-400 hover:text-indigo-700 font-bold"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-md shadow-indigo-600/20 disabled:opacity-50 transition-all"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Submit Request</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
