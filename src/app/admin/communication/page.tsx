'use client';

import React, { useState } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { useEmsStore } from '@/store/emsStore';
import { Megaphone, Plus, BellOff, CheckCircle2 } from 'lucide-react';
import { CreateAnnouncementModal } from '@/components/modals/CreateAnnouncementModal';

export default function CommunicationPage() {
  const { state, createAnnouncement } = useEmsStore();
  const [isAddAnnounceOpen, setIsAddAnnounceOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const announcements = state.announcements;

  return (
    <AdminLayout
      pageTitle="Internal Communication"
      breadcrumbs={[{ label: 'Communication', href: '/admin/communication' }]}
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed right-6 top-20 z-50 flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs text-white shadow-xl">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Company Broadcasts & Announcements</h2>
          <p className="text-xs text-slate-500">
            Publish organization-wide notices, department broadcasts, and internal messages
          </p>
        </div>
        <button
          onClick={() => setIsAddAnnounceOpen(true)}
          className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-md hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          <span>+ Create Announcement</span>
        </button>
      </div>

      {announcements.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-xs text-slate-500">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 mx-auto">
            <BellOff className="h-6 w-6" />
          </div>
          <h4 className="mt-3 text-sm font-bold text-slate-800">No announcements yet</h4>
          <p className="mt-1 max-w-xs mx-auto text-xs text-slate-500">
            HR notices, policy alerts, and broadcast updates published by Admin will display here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {announcements.map((ann) => (
            <div key={ann.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="rounded-md bg-blue-50 px-2 py-0.5 font-semibold text-blue-600">{ann.category}</span>
                <span>{ann.date}</span>
              </div>
              <h3 className="mt-3 text-sm font-bold text-slate-900">{ann.title}</h3>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">{ann.content}</p>
            </div>
          ))}
        </div>
      )}

      <CreateAnnouncementModal
        isOpen={isAddAnnounceOpen}
        onClose={() => setIsAddAnnounceOpen(false)}
        onSave={(ann) => {
          createAnnouncement(ann);
          showToast(`Announcement "${ann.title}" published!`);
        }}
      />
    </AdminLayout>
  );
}
