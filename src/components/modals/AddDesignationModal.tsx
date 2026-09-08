'use client';

import React, { useState } from 'react';
import { X, Briefcase } from 'lucide-react';

interface AddDesignationModalProps {
  isOpen: boolean;
  onClose: () => void;
  departments: { id: string; name: string }[];
  onSave: (desg: { title: string; department: string }) => void;
}

export const AddDesignationModal: React.FC<AddDesignationModalProps> = ({
  isOpen,
  onClose,
  departments,
  onSave,
}) => {
  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({ title: title.trim(), department: department || 'General' });
    setTitle('');
    setDepartment('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl text-xs text-slate-800 animate-fade-in">
        <div className="flex items-center justify-between border-b pb-3 font-bold text-sm text-slate-900">
          <div className="flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-purple-600" />
            <span>Add Designation</span>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:text-slate-700">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div>
            <label className="font-bold text-slate-900">Designation / Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Senior Software Engineer"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full rounded-xl border p-2.5 bg-slate-50 focus:border-purple-500 focus:bg-white"
            />
          </div>

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
              Save Designation
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
