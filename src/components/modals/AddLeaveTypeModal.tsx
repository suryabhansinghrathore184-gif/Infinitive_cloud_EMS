'use client';

import React, { useState } from 'react';
import { X, CalendarOff } from 'lucide-react';

interface AddLeaveTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (lt: { name: string; description: string; allowanceDays: number; isPaid: boolean }) => void;
}

export const AddLeaveTypeModal: React.FC<AddLeaveTypeModalProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [allowanceDays, setAllowanceDays] = useState(12);
  const [isPaid, setIsPaid] = useState(true);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      description: description.trim(),
      allowanceDays: Number(allowanceDays) || 0,
      isPaid,
    });
    setName('');
    setDescription('');
    setAllowanceDays(12);
    setIsPaid(true);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl text-xs text-slate-800 animate-fade-in">
        <div className="flex items-center justify-between border-b pb-3 font-bold text-sm text-slate-900">
          <div className="flex items-center gap-2">
            <CalendarOff className="h-4 w-4 text-amber-600" />
            <span>Add Leave Type</span>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:text-slate-700">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div>
            <label className="font-bold text-slate-900">Leave Type Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Earned Leave (EL) / Maternity Leave"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-xl border p-2.5 bg-slate-50 focus:border-amber-500 focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-900">Annual Allowance (Days) *</label>
              <input
                type="number"
                min={0}
                required
                value={allowanceDays}
                onChange={(e) => setAllowanceDays(parseInt(e.target.value) || 0)}
                className="mt-1 w-full rounded-xl border p-2.5 bg-slate-50 focus:border-amber-500 focus:bg-white"
              />
            </div>

            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                id="isPaidLeave"
                checked={isPaid}
                onChange={(e) => setIsPaid(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
              />
              <label htmlFor="isPaidLeave" className="font-bold text-slate-900 cursor-pointer">
                Paid Leave
              </label>
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-900">Description</label>
            <textarea
              placeholder="Policy description or terms for this leave type..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-xl border p-2.5 bg-slate-50 focus:border-amber-500 focus:bg-white"
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
              className="rounded-xl bg-amber-600 px-4 py-1.5 font-bold text-white shadow-xs hover:bg-amber-700"
            >
              Save Leave Type
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
