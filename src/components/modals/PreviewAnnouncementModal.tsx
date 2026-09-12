'use client';

import React from 'react';
import { X, Calendar, Globe, Tag, Eye, Megaphone, ArrowLeft } from 'lucide-react';
import { AnnouncementItem } from '@/types/dashboard';

interface PreviewAnnouncementModalProps {
  isOpen: boolean;
  onClose: () => void;
  announcement: Partial<AnnouncementItem> | null;
}

export const PreviewAnnouncementModal: React.FC<PreviewAnnouncementModalProps> = ({
  isOpen,
  onClose,
  announcement,
}) => {
  if (!isOpen || !announcement) return null;

  const todayStr = new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-xs">
      <div className="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-2xl text-xs text-slate-800 animate-fade-in max-h-[90vh] flex flex-col justify-between">
        {/* Top Preview Banner Bar */}
        <div className="flex items-center justify-between border-b pb-3 font-bold text-sm text-slate-900">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <Eye className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Website Live Preview</h3>
              <p className="text-[11px] font-normal text-slate-500">Previewing how this announcement will render on the public website</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${
                announcement.visibility === 'Public Website'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}
            >
              {announcement.visibility || 'Internal Only'}
            </span>
            <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Public Website Preview Card Body */}
        <div className="my-4 flex-1 overflow-y-auto space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            {/* Header metadata */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-4">
              <div className="flex items-center gap-2">
                <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-700 border border-blue-200">
                  {announcement.category || 'Company News'}
                </span>
                <span className="flex items-center gap-1 text-[11px] text-slate-500">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                  {announcement.date || todayStr}
                </span>
              </div>
              <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                <Globe className="h-3.5 w-3.5" /> Public Website Broadcast
              </span>
            </div>

            {/* Featured Image if present */}
            {announcement.imageUrl && (
              <div className="overflow-hidden rounded-xl border border-slate-100 max-h-56">
                <img
                  src={announcement.imageUrl}
                  alt={announcement.title}
                  className="w-full object-cover"
                />
              </div>
            )}

            {/* Title & Short Desc */}
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 leading-snug">{announcement.title || 'Announcement Title'}</h1>
              {announcement.shortDescription && (
                <p className="mt-2 text-xs font-medium text-slate-600 italic border-l-2 border-emerald-500 pl-3">
                  {announcement.shortDescription}
                </p>
              )}
            </div>

            {/* Main Content Body */}
            <div className="prose prose-slate max-w-none text-xs leading-relaxed text-slate-700 whitespace-pre-line border-t pt-4">
              {announcement.content || 'Full announcement body content will be rendered here...'}
            </div>
          </div>
        </div>

        {/* Footer controls */}
        <div className="flex items-center justify-between border-t pt-3">
          <p className="text-[11px] text-slate-500">
            URL: <code className="font-mono text-blue-600">/announcements/{announcement.slug || 'announcement-slug'}</code>
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
