'use client';

import React from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { mockAnnouncements } from '@/data/dashboard';
import { MessageSquare, Megaphone, Send, Bell, Mail } from 'lucide-react';

export default function CommunicationPage() {
  return (
    <AdminLayout
      pageTitle="Internal Communication"
      breadcrumbs={[{ label: 'Communication', href: '/admin/communication' }]}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Company Broadcasts & Announcements</h2>
          <p className="text-xs text-slate-500">
            Publish organization-wide notices, department broadcasts, and internal messages
          </p>
        </div>
        <button className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-md hover:bg-blue-700">
          + Create Announcement
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {mockAnnouncements.map((ann) => (
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
    </AdminLayout>
  );
}
