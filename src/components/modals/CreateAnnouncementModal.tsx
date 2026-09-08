'use client';

import React, { useState } from 'react';
import { X, Megaphone } from 'lucide-react';

interface CreateAnnouncementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (ann: { title: string; content: string; category: string; isImportant?: boolean }) => void;
}

export const CreateAnnouncementModal: React.FC<CreateAnnouncementModalProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('Company News');
  const [isImportant, setIsImportant] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    onSave({
      title: title.trim(),
      content: content.trim(),
      category,
      isImportant,
    });
    setTitle('');
    setContent('');
    setCategory('Company News');
    setIsImportant(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl text-xs text-slate-800 animate-fade-in">
        <div className="flex items-center justify-between border-b pb-3 font-bold text-sm text-slate-900">
          <div className="flex items-center gap-2">
            <Megaphone className="h-4 w-4 text-emerald-600" />
            <span>Publish Company Announcement</span>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:text-slate-700">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div>
            <label className="font-bold text-slate-900">Announcement Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Q3 Town Hall & Annual Strategy Meeting"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full rounded-xl border p-2.5 bg-slate-50 focus:border-emerald-500 focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-900">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-1 w-full rounded-xl border p-2.5 bg-slate-50 focus:border-emerald-500 focus:bg-white"
              >
                <option value="Company News">Company News</option>
                <option value="Policy Update">Policy Update</option>
                <option value="Holiday Notice">Holiday Notice</option>
                <option value="IT & Security">IT & Security</option>
                <option value="Event">Event & Celebration</option>
              </select>
            </div>

            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                id="isImportant"
                checked={isImportant}
                onChange={(e) => setIsImportant(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <label htmlFor="isImportant" className="font-bold text-slate-900 cursor-pointer">
                Mark as High Priority / Urgent
              </label>
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-900">Announcement Content *</label>
            <textarea
              required
              placeholder="Write full announcement details for all team members..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              className="mt-1 w-full rounded-xl border p-2.5 bg-slate-50 focus:border-emerald-500 focus:bg-white"
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
              className="rounded-xl bg-emerald-600 px-4 py-1.5 font-bold text-white shadow-xs hover:bg-emerald-700"
            >
              Publish Announcement
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
