'use client';

import React from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Bell, Mail, MessageSquare, Smartphone, Send, CheckCircle2 } from 'lucide-react';

export default function NotificationsPage() {
  return (
    <AdminLayout
      pageTitle="Notification Center & Preferences"
      breadcrumbs={[{ label: 'Notifications', href: '/admin/notifications' }]}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Notification Settings & Event Triggers</h2>
          <p className="text-xs text-slate-500">
            Configure multi-channel notifications (In-App, Email, SMS, WhatsApp Business API)
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Active Delivery Channels</h3>
          {[
            { channel: 'In-App Alerts', desc: 'Real-time header bell notification feed', enabled: true },
            { channel: 'Email Dispatch (SMTP)', desc: 'Payslip PDFs, official letters, leave digests', enabled: true },
            { channel: 'WhatsApp Business API', desc: 'Instant WhatsApp message triggers for approvals', enabled: true },
            { channel: 'SMS Service', desc: 'Urgent OTPs & critical emergency broadcasts', enabled: false },
          ].map((ch, idx) => (
            <div key={idx} className="flex items-center justify-between border-b border-slate-100 pb-3 text-xs">
              <div>
                <p className="font-bold text-slate-900">{ch.channel}</p>
                <p className="text-[11px] text-slate-400">{ch.desc}</p>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full font-bold ${ch.enabled ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                {ch.enabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
