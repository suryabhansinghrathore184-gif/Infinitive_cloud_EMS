'use client';

import React from 'react';
import { mockAnnouncements } from '@/data/dashboard';
import { Megaphone, Pin, ArrowRight } from 'lucide-react';

export const Announcements: React.FC = () => {
  return (
    <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <Megaphone className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Announcements</h3>
            <p className="text-xs text-slate-500">Company broadcast & policy alerts</p>
          </div>
        </div>
        <button className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700">
          View All <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Cards List */}
      <div className="mt-4 space-y-3">
        {mockAnnouncements.map((ann) => (
          <div
            key={ann.id}
            className={`relative rounded-xl border p-4 transition-all hover:shadow-md ${
              ann.isImportant
                ? 'border-blue-200 bg-blue-50/40'
                : 'border-slate-100 bg-slate-50/50'
            }`}
          >
            {ann.isImportant && (
              <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-semibold text-white">
                <Pin className="h-2.5 w-2.5" /> Pinned
              </span>
            )}

            <div className="flex items-center gap-2">
              <span className="rounded-md bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-600 border border-slate-200">
                {ann.category}
              </span>
              <span className="text-[11px] text-slate-400">{ann.date}</span>
            </div>

            <h4 className="mt-2 text-sm font-bold text-slate-900">{ann.title}</h4>
            <p className="mt-1 text-xs text-slate-600 line-clamp-2">{ann.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
