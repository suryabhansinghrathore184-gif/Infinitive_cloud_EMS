'use client';

import React, { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import {
  Puzzle,
  CheckCircle2,
  XCircle,
  Settings,
  Power,
  RefreshCw,
  MessageSquare,
  Fingerprint,
  Building,
  Cloud,
  Play,
  AlertCircle,
  ShieldCheck,
  Clock,
  Activity,
  Loader2,
} from 'lucide-react';

// Modals
import { ConfigureWhatsAppModal } from '@/components/modals/ConfigureWhatsAppModal';
import { ConfigureBiometricModal } from '@/components/modals/ConfigureBiometricModal';
import { ConfigureMicrosoftModal } from '@/components/modals/ConfigureMicrosoftModal';
import { ConfigureGridFSModal } from '@/components/modals/ConfigureGridFSModal';

interface IntegrationItem {
  id: string;
  provider: 'whatsapp' | 'biometric' | 'microsoft' | 'gridfs';
  name: string;
  category: string;
  description: string;
  status: 'CONNECTED' | 'NOT_CONFIGURED' | 'CONNECTION_FAILED' | 'DISABLED' | 'CONFIGURATION_REQUIRED';
  statusText: string;
  lastTestedAt?: string;
  config?: any;
}

export default function IntegrationsPage() {
  const [metrics, setMetrics] = useState({
    total: 4,
    connected: 0,
    notConfigured: 0,
    connectionFailed: 0,
    disabled: 0,
  });

  const [integrations, setIntegrations] = useState<IntegrationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Active Modals
  const [activeModal, setActiveModal] = useState<'whatsapp' | 'biometric' | 'microsoft' | 'gridfs' | null>(null);
  const [selectedIntegrationConfig, setSelectedIntegrationConfig] = useState<any>(null);

  // Testing & Action Loading states
  const [actionLoadingMap, setActionLoadingMap] = useState<Record<string, boolean>>({});

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchIntegrations = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/v1/integrations');
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to fetch integrations status');
      }

      setMetrics(data.metrics || { total: 4, connected: 0, notConfigured: 0, connectionFailed: 0, disabled: 0 });
      setIntegrations(data.integrations || []);
    } catch (err: any) {
      console.error('Error fetching integrations:', err);
      setErrorMsg(err.message || 'Unable to load third-party integrations status');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const handleTestConnection = async (provider: string) => {
    setActionLoadingMap((prev) => ({ ...prev, [provider]: true }));
    try {
      const res = await fetch(`/api/v1/integrations/${provider}/test`, { method: 'POST' });
      const data = await res.json();

      if (data.success) {
        showToast(`✓ ${provider.toUpperCase()} connection test successful!`);
      } else {
        showToast(`✕ ${provider.toUpperCase()} connection test failed.`);
      }
      fetchIntegrations();
    } catch (err: any) {
      showToast(`✕ Connection test error: ${err.message}`);
    } finally {
      setActionLoadingMap((prev) => ({ ...prev, [provider]: false }));
    }
  };

  const handleToggleEnable = async (provider: string, currentEnabled: boolean) => {
    setActionLoadingMap((prev) => ({ ...prev, [provider]: true }));
    try {
      const endpoint = currentEnabled ? `/api/v1/integrations/${provider}/disable` : `/api/v1/integrations/${provider}/enable`;
      const res = await fetch(endpoint, { method: 'POST' });
      const data = await res.json();

      if (res.ok && data.success) {
        showToast(data.message);
        fetchIntegrations();
      } else {
        throw new Error(data.message || 'Failed to update integration state');
      }
    } catch (err: any) {
      showToast(`✕ Action failed: ${err.message}`);
    } finally {
      setActionLoadingMap((prev) => ({ ...prev, [provider]: false }));
    }
  };

  const openConfigModal = (item: IntegrationItem) => {
    setSelectedIntegrationConfig(item.config || {});
    setActiveModal(item.provider);
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'whatsapp':
        return <MessageSquare className="h-5 w-5 text-emerald-600" />;
      case 'biometric':
        return <Fingerprint className="h-5 w-5 text-purple-600" />;
      case 'microsoft':
        return <Building className="h-5 w-5 text-blue-600" />;
      case 'gridfs':
        return <Cloud className="h-5 w-5 text-indigo-600" />;
      default:
        return <Puzzle className="h-5 w-5 text-slate-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONNECTED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            CONNECTED
          </span>
        );
      case 'DISABLED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-600 border border-slate-300">
            DISABLED
          </span>
        );
      case 'CONNECTION_FAILED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-[10px] font-bold text-rose-700 border border-rose-200">
            CONNECTION FAILED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200">
            NOT CONFIGURED
          </span>
        );
    }
  };

  return (
    <AdminLayout
      pageTitle="Integrations & Gateways"
      breadcrumbs={[{ label: 'Integrations', href: '/admin/integrations' }]}
    >
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed right-6 bottom-6 z-50 flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-xs text-white shadow-2xl animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Puzzle className="h-6 w-6 text-indigo-600" />
            Third-Party External Service Drivers
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Connect biometric hardware, WhatsApp API, cloud document vaults, and enterprise SSO
          </p>
        </div>
        <button
          onClick={fetchIntegrations}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh Drivers
        </button>
      </div>

      {/* Dynamic Summary Metrics Bar */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold text-slate-500">Total Integrations</span>
            <Puzzle className="h-4 w-4 text-slate-400" />
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900">{metrics.total}</p>
          <p className="mt-0.5 text-[10px] text-slate-400">Registered service drivers</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold text-emerald-600">Connected</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900">{metrics.connected}</p>
          <p className="mt-0.5 text-[10px] text-slate-400">Verified & active health</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold text-amber-600">Not Configured</span>
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900">{metrics.notConfigured}</p>
          <p className="mt-0.5 text-[10px] text-slate-400">Credentials missing</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold text-rose-600">Connection Failed</span>
            <XCircle className="h-4 w-4 text-rose-500" />
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900">{metrics.connectionFailed}</p>
          <p className="mt-0.5 text-[10px] text-slate-400">Authentication errors</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold text-slate-600">Disabled</span>
            <Power className="h-4 w-4 text-slate-400" />
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900">{metrics.disabled}</p>
          <p className="mt-0.5 text-[10px] text-slate-400">Deactivated drivers</p>
        </div>
      </div>

      {/* Error Alert */}
      {errorMsg && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Integration Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {integrations.map((card) => {
          const isBusy = Boolean(actionLoadingMap[card.provider]);
          const isEnabled = card.status !== 'DISABLED';

          return (
            <div key={card.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 font-bold">
                    {getProviderIcon(card.provider)}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{card.name}</h3>
                    <p className="text-[10px] text-slate-400">{card.category}</p>
                  </div>
                </div>
                {getStatusBadge(card.status)}
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">{card.description}</p>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100">
                <span>{card.statusText}</span>
                {card.lastTestedAt && (
                  <span className="text-[10px]">
                    Last tested: {new Date(card.lastTestedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>

              {/* Action Toolbar */}
              <div className="flex items-center justify-between pt-2">
                {card.provider !== 'gridfs' && (
                  <button
                    onClick={() => handleToggleEnable(card.provider, isEnabled)}
                    disabled={isBusy}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg border ${
                      isEnabled
                        ? 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                        : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    }`}
                  >
                    <Power className="h-3.5 w-3.5" />
                    {isEnabled ? 'Disable' : 'Enable'}
                  </button>
                )}

                <div className="flex items-center gap-2 ml-auto">
                  {card.provider !== 'gridfs' && (
                    <button
                      onClick={() => handleTestConnection(card.provider)}
                      disabled={isBusy}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs disabled:opacity-40"
                    >
                      {isBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5 text-indigo-600" />}
                      Test Connection
                    </button>
                  )}

                  <button
                    onClick={() => openConfigModal(card)}
                    className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-md hover:bg-indigo-700"
                  >
                    <Settings className="h-3.5 w-3.5" />
                    Configure
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Integration Activity History Section */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">Integration Activity & Diagnostic Log</h3>
          </div>
          <span className="text-[11px] text-slate-400">Server-Side Verified Events</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3">Integration</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Health Status</th>
                <th className="px-4 py-3">Last Verified Time</th>
                <th className="px-4 py-3">Security Protocol</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {integrations.map((i) => (
                <tr key={i.id} className="hover:bg-slate-50/80">
                  <td className="px-4 py-3 font-semibold text-slate-900 flex items-center gap-2">
                    {getProviderIcon(i.provider)}
                    <span>{i.name}</span>
                  </td>
                  <td className="px-4 py-3 font-mono text-[11px] text-slate-600">HEALTH_CHECK</td>
                  <td className="px-4 py-3">{getStatusBadge(i.status)}</td>
                  <td className="px-4 py-3 text-slate-500 text-[11px]">
                    {i.lastTestedAt ? new Date(i.lastTestedAt).toLocaleString() : 'Not checked yet'}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                      {i.provider === 'gridfs'
                        ? 'GridFS Binary Vault'
                        : i.provider === 'microsoft'
                        ? 'MSAL OAuth 2.0'
                        : 'AES-256-GCM Encrypted'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <ConfigureWhatsAppModal
        isOpen={activeModal === 'whatsapp'}
        onClose={() => setActiveModal(null)}
        initialConfig={selectedIntegrationConfig}
        onConfigSaved={() => {
          showToast('WhatsApp Business API configuration saved!');
          fetchIntegrations();
        }}
      />

      <ConfigureBiometricModal
        isOpen={activeModal === 'biometric'}
        onClose={() => setActiveModal(null)}
        initialConfig={selectedIntegrationConfig}
        onConfigSaved={() => {
          showToast('Biometric Attendance Gateway configuration saved!');
          fetchIntegrations();
        }}
      />

      <ConfigureMicrosoftModal
        isOpen={activeModal === 'microsoft'}
        onClose={() => setActiveModal(null)}
        initialConfig={selectedIntegrationConfig}
        onConfigSaved={() => {
          showToast('Microsoft 365 configuration saved!');
          fetchIntegrations();
        }}
      />

      <ConfigureGridFSModal
        isOpen={activeModal === 'gridfs'}
        onClose={() => setActiveModal(null)}
        initialConfig={selectedIntegrationConfig}
        onConfigSaved={() => {
          showToast('MongoDB GridFS health check completed!');
          fetchIntegrations();
        }}
      />
    </AdminLayout>
  );
}
