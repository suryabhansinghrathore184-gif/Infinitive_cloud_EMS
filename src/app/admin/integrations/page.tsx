'use client';

import React, { useState } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { mockIntegrationCards } from '@/data/modulesData';
import { Puzzle, CheckCircle2, XCircle, Settings, Power } from 'lucide-react';

export default function IntegrationsPage() {
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <AdminLayout
      pageTitle="Integrations & Gateways"
      breadcrumbs={[{ label: 'Integrations', href: '/admin/integrations' }]}
    >
      {/* Toast */}
      {toastMessage && (
        <div className="fixed right-6 top-20 z-50 flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs text-white shadow-xl">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Third-Party External Service Drivers</h2>
          <p className="text-xs text-slate-500">
            Connect biometric hardware, WhatsApp API, cloud document vaults, and enterprise SSO
          </p>
        </div>
      </div>

      {/* Integration Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {mockIntegrationCards.map((card) => (
          <div key={card.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 font-bold">
                  <Puzzle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{card.name}</h3>
                  <p className="text-[10px] text-slate-400">{card.category}</p>
                </div>
              </div>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                  card.isConnected
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-slate-100 text-slate-500 border border-slate-200'
                }`}
              >
                {card.isConnected ? 'Connected' : 'Not Connected'}
              </span>
            </div>

            <p className="mt-3 text-xs text-slate-600">{card.description}</p>

            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
              <span className="text-[11px] font-medium text-slate-500">{card.statusText}</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => showToast(`Opening configuration for ${card.name}...`)}
                  className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1 font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <Settings className="h-3.5 w-3.5" /> Configure
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
}
