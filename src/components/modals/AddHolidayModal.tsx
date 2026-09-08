'use client';

import React, { useState } from 'react';
import { X, Calendar } from 'lucide-react';
import { HolidayEvent } from '@/types/dashboard';

interface AddHolidayModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (holiday: Omit<HolidayEvent, 'id'>) => void;
}

export const AddHolidayModal: React.FC<AddHolidayModalProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [category, setCategory] = useState<HolidayEvent['category']>('National Holiday');
  const [dayOfWeek, setDayOfWeek] = useState('');

  if (!isOpen) return null;

  const handleDateChange = (val: string) => {
    setDate(val);
    if (val) {
      const d = new Date(val);
      const dayName = d.toLocaleDateString('en-US', { weekday: 'long' });
      setDayOfWeek(dayName);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !date) return;
    onSave({
      name: name.trim(),
      date,
      dayOfWeek: dayOfWeek || 'Scheduled',
      category,
    });
    setName('');
    setDate('');
    setDayOfWeek('');
    setCategory('National Holiday');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl text-xs text-slate-800 animate-fade-in">
        <div className="flex items-center justify-between border-b pb-3 font-bold text-sm text-slate-900">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-indigo-600" />
            <span>Add Company Holiday / Event</span>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:text-slate-700">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div>
            <label className="font-bold text-slate-900">Holiday / Event Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Independence Day / Diwali"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-xl border p-2.5 bg-slate-50 focus:border-indigo-500 focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-900">Date *</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => handleDateChange(e.target.value)}
                className="mt-1 w-full rounded-xl border p-2.5 bg-slate-50 focus:border-indigo-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="font-bold text-slate-900">Category / Type</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as HolidayEvent['category'])}
                className="mt-1 w-full rounded-xl border p-2.5 bg-slate-50 focus:border-indigo-500 focus:bg-white"
              >
                <option value="National Holiday">National Holiday</option>
                <option value="Public Holiday">Public Holiday</option>
                <option value="Company Festival">Company Festival</option>
                <option value="Mandatory Holiday">Mandatory Holiday</option>
                <option value="Optional Holiday">Optional Holiday</option>
                <option value="Company Event">Company Event</option>
              </select>
            </div>
          </div>

          {dayOfWeek && (
            <p className="text-[11px] text-slate-500">
              Selected Day: <span className="font-semibold text-slate-800">{dayOfWeek}</span>
            </p>
          )}

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
              className="rounded-xl bg-indigo-600 px-4 py-1.5 font-bold text-white shadow-xs hover:bg-indigo-700"
            >
              Save Holiday
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
