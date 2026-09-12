'use client';

import React, { useState, useEffect } from 'react';
import { X, Briefcase } from 'lucide-react';
import { Department, Designation } from '@/types/admin';

interface EditDesignationModalProps {
  isOpen: boolean;
  onClose: () => void;
  designation: Designation | null;
  departments: Department[];
  onSave: (id: string, updated: Partial<Designation>) => void;
}

export const EditDesignationModal: React.FC<EditDesignationModalProps> = ({
  isOpen,
  onClose,
  designation,
  departments,
  onSave,
}) => {
  const [title, setTitle] = useState('');
  const [code, setCode] = useState('');
  const [department, setDepartment] = useState('');
  const [level, setLevel] = useState('L3');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');

  useEffect(() => {
    if (designation) {
      setTitle(designation.title || '');
      setCode(designation.code || '');
      setDepartment(designation.department || '');
      setLevel(designation.level || 'L3');
      setDescription(designation.description || '');
      setStatus(designation.status || 'Active');
    }
  }, [designation]);

  if (!isOpen || !designation) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave(designation.id, {
      title: title.trim(),
      code: code.trim().toUpperCase() || title.substring(0, 3).toUpperCase(),
      department: department || 'General',
      level,
      description: description.trim(),
      status,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl text-xs text-slate-800 animate-fade-in">
        <div className="flex items-center justify-between border-b pb-3 font-bold text-sm text-slate-900">
          <div className="flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-purple-600" />
            <span>Edit Designation</span>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:text-slate-700">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div>
            <label className="font-bold text-slate-900">Designation Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Senior Software Engineer"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full rounded-xl border p-2.5 bg-slate-50 focus:border-purple-500 focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-900">Code</label>
              <input
                type="text"
                placeholder="e.g. SSE"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="mt-1 w-full rounded-xl border p-2.5 bg-slate-50 focus:border-purple-500 focus:bg-white uppercase font-mono"
              />
            </div>
            <div>
              <label className="font-bold text-slate-900">Grade Level</label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="mt-1 w-full rounded-xl border p-2.5 bg-slate-50 focus:border-purple-500 focus:bg-white font-medium"
              >
                <option value="L1">L1 (Entry Level)</option>
                <option value="L2">L2 (Junior)</option>
                <option value="L3">L3 (Mid-Level)</option>
                <option value="L4">L4 (Senior)</option>
                <option value="L5">L5 (Lead / Manager)</option>
                <option value="L6">L6 (Director / VP)</option>
                <option value="L7">L7 (Executive)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-900">Department</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="mt-1 w-full rounded-xl border p-2.5 bg-slate-50 focus:border-purple-500 focus:bg-white"
              >
                <option value="">-- Select Department --</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.name}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="font-bold text-slate-900">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'Active' | 'Inactive')}
                className="mt-1 w-full rounded-xl border p-2.5 bg-slate-50 focus:border-purple-500 focus:bg-white font-medium"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-900">Role Description (Optional)</label>
            <textarea
              placeholder="Responsibilities or qualifications..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="mt-1 w-full rounded-xl border p-2.5 bg-slate-50 focus:border-purple-500 focus:bg-white"
            />
          </div>

          <div className="flex justify-end gap-2 border-t pt-3 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border px-3 py-1.5 font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-purple-600 px-4 py-1.5 font-bold text-white shadow-xs hover:bg-purple-700"
            >
              Update Designation
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
