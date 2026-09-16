'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { SuperAdminLayout } from '@/components/layout/SuperAdminLayout';
import {
  Puzzle,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Clock,
  Settings,
  ShieldCheck,
  Globe,
  Database,
  MessageSquare,
  Building2,
  Lock,
  ExternalLink,
  Power,
  Zap,
  Activity,
  Server,
  Key,
  Calendar,
  Layers,
  Check,
  X,
  Eye,
  EyeOff,
  Sliders,
  FileText,
  UserCheck,
} from 'lucide-react';

interface IntegrationProvider {
  id: string;
  provider: string;
  name: string;
  category: string;
  description: string;
  status: 'CONNECTED' | 'NOT_CONFIGURED' | 'CONNECTION_FAILED' | 'DISABLED';
  statusText?: string;
  lastTestedAt?: string | null;
  config?: Record<string, any>;
}

interface IntegrationMetrics {
  total: number;
  connected: number;
  notConfigured: number;
  connectionFailed: number;
  disabled: number;
}

interface ActivityItem {
  id: string;
  action: string;
  userEmail: string;
  timestamp: string;
  details?: Record<string, any>;
}

export default function SuperAdminIntegrationsPage() {
  const [integrations, setIntegrations] = useState<IntegrationProvider[]>([]);
  const [metrics, setMetrics] = useState<IntegrationMetrics>({
    total: 4,
    connected: 0,
    notConfigured: 4,
    connectionFailed: 0,
    disabled: 0,
  });
  const [activityStream, setActivityStream] = useState<ActivityItem[]>([]);
  const [lastHealthCheck, setLastHealthCheck] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [syncingBio, setSyncingBio] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Modal States
  const [activeModalProvider, setActiveModalProvider] = useState<string | null>(null);
  const [disableConfirmProvider, setDisableConfirmProvider] = useState<IntegrationProvider | null>(null);

  // Form States for Modals
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [waForm, setWaForm] = useState({
    phoneNumberId: '',
    businessAccountId: '',
    apiBaseUrl: 'https://graph.facebook.com',
    graphVersion: 'v19.0',
    accessToken: '',
    webhookVerifyToken: '',
  });

  const [bioForm, setBioForm] = useState({
    providerName: 'ZKTeco',
    deviceName: 'Main Entrance Gateway',
    deviceId: 'DEV-ZKT-01',
    connectorUrl: 'http://192.168.1.150:8088',
    apiKey: '',
    syncMode: 'Manual',
    syncIntervalMinutes: 15,
  });

  const [msForm, setMsForm] = useState({
    tenantId: '',
    clientId: '',
    tenantName: '',
    accountEmail: '',
    clientSecret: '',
  });

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const toggleShowSecret = (fieldKey: string) => {
    setShowSecrets((prev) => ({ ...prev, [fieldKey]: !prev[fieldKey] }));
  };

  const fetchIntegrations = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/v1/integrations');
      if (res.ok) {
        const result = await res.json();
        if (result.success) {
          const list = result.integrations || result.data || [];
          setIntegrations(list);
          if (result.metrics) {
            setMetrics(result.metrics);
          }
          if (result.activityStream) {
            setActivityStream(result.activityStream);
          }
          setLastHealthCheck(result.lastHealthCheck || new Date().toISOString());

          // Populate form defaults from backend configs
          const wa = list.find((i: any) => i.provider === 'whatsapp');
          if (wa && wa.config) {
            setWaForm((prev) => ({
              ...prev,
              phoneNumberId: wa.config.phoneNumberId || '',
              businessAccountId: wa.config.businessAccountId || '',
              apiBaseUrl: wa.config.apiBaseUrl || 'https://graph.facebook.com',
              graphVersion: wa.config.graphVersion || 'v19.0',
            }));
          }

          const bio = list.find((i: any) => i.provider === 'biometric');
          if (bio && bio.config) {
            setBioForm((prev) => ({
              ...prev,
              providerName: bio.config.provider || 'ZKTeco',
              deviceName: bio.config.deviceName || '',
              deviceId: bio.config.deviceId || '',
              connectorUrl: bio.config.connectorUrl || '',
              syncMode: bio.config.syncMode || 'Manual',
              syncIntervalMinutes: bio.config.syncIntervalMinutes || 15,
            }));
          }

          const ms = list.find((i: any) => i.provider === 'microsoft');
          if (ms && ms.config) {
            setMsForm((prev) => ({
              ...prev,
              tenantId: ms.config.tenantId || '',
              clientId: ms.config.clientId || '',
              tenantName: ms.config.tenantName || '',
              accountEmail: ms.config.accountEmail || '',
            }));
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch integrations:', err);
      showToast('Error connecting to integration gateway service', 'error');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchIntegrations();
  }, [fetchIntegrations]);

  const testConnection = async (provider: string) => {
    setTestingId(provider);
    try {
      const res = await fetch(`/api/v1/integrations/${provider}/test`, { method: 'POST' });
      const result = await res.json();
      if (res.ok && result.success) {
        showToast(`Health check for ${provider.toUpperCase()} succeeded: Connection ACTIVE`, 'success');
      } else {
        showToast(result.message || `Connection check for ${provider} failed`, 'error');
      }
    } catch {
      showToast(`Health test for ${provider} failed to respond`, 'error');
    } finally {
      setTestingId(null);
      fetchIntegrations();
    }
  };

  const syncBiometricNow = async () => {
    setSyncingBio(true);
    try {
      const res = await fetch('/api/v1/integrations/biometric/sync', { method: 'POST' });
      const result = await res.json();
      if (res.ok && result.success) {
        const count = result.syncResult?.importedCount || 0;
        showToast(`Biometric Sync Complete! ${count} punches processed & matched to employees.`, 'success');
      } else {
        showToast(result.message || 'Biometric sync failed', 'error');
      }
    } catch {
      showToast('Failed to trigger biometric sync', 'error');
    } finally {
      setSyncingBio(false);
      fetchIntegrations();
    }
  };

  const toggleEnableDisable = async (providerObj: IntegrationProvider) => {
    if (providerObj.status !== 'DISABLED') {
      // Prompt confirmation before disabling
      setDisableConfirmProvider(providerObj);
      return;
    }

    setTogglingId(providerObj.provider);
    try {
      const res = await fetch(`/api/v1/integrations/${providerObj.provider}/enable`, { method: 'POST' });
      const result = await res.json();
      if (res.ok && result.success) {
        showToast(`${providerObj.name} enabled successfully`, 'success');
      } else {
        showToast(result.message || `Failed to enable ${providerObj.name}`, 'error');
      }
    } catch {
      showToast('Operation failed', 'error');
    } finally {
      setTogglingId(null);
      fetchIntegrations();
    }
  };

  const confirmDisableIntegration = async () => {
    if (!disableConfirmProvider) return;
    const provider = disableConfirmProvider.provider;
    setTogglingId(provider);
    setDisableConfirmProvider(null);

    try {
      const res = await fetch(`/api/v1/integrations/${provider}/disable`, { method: 'POST' });
      const result = await res.json();
      if (res.ok && result.success) {
        showToast(`${disableConfirmProvider.name} disabled successfully`, 'success');
      } else {
        showToast(result.message || 'Failed to disable integration', 'error');
      }
    } catch {
      showToast('Operation failed', 'error');
    } finally {
      setTogglingId(null);
      fetchIntegrations();
    }
  };

  const disconnectIntegration = async (provider: string) => {
    if (!confirm(`Are you sure you want to disconnect ${provider.toUpperCase()}? This revokes all tokens.`)) return;

    try {
      const res = await fetch(`/api/v1/integrations/${provider}/disconnect`, { method: 'POST' });
      const result = await res.json();
      if (res.ok && result.success) {
        showToast(`${provider.toUpperCase()} integration disconnected and secrets revoked.`, 'success');
      } else {
        showToast(result.message || 'Disconnect failed', 'error');
      }
    } catch {
      showToast('Failed to disconnect integration', 'error');
    } finally {
      fetchIntegrations();
    }
  };

  const saveConfiguration = async (provider: string, payload: any) => {
    try {
      const res = await fetch(`/api/v1/integrations/${provider}/configure`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (res.ok && result.success) {
        showToast(`Configuration updated for ${provider.toUpperCase()}`, 'success');
        setActiveModalProvider(null);
        fetchIntegrations();
      } else {
        showToast(result.message || 'Failed to save configuration', 'error');
      }
    } catch {
      showToast('Configuration request failed', 'error');
    }
  };

  const renderStatusBadge = (status: IntegrationProvider['status']) => {
    switch (status) {
      case 'CONNECTED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-extrabold text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> CONNECTED
          </span>
        );
      case 'CONNECTION_FAILED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-3 py-1 text-xs font-extrabold text-rose-700 border border-rose-200">
            <XCircle className="h-3.5 w-3.5 text-rose-600" /> CONNECTION FAILED
          </span>
        );
      case 'DISABLED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-extrabold text-slate-600 border border-slate-300">
            <AlertCircle className="h-3.5 w-3.5 text-slate-500" /> DISABLED
          </span>
        );
      case 'NOT_CONFIGURED':
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-extrabold text-amber-700 border border-amber-200">
            <Clock className="h-3.5 w-3.5 text-amber-600" /> NOT CONFIGURED
          </span>
        );
    }
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'whatsapp':
        return <MessageSquare className="h-6 w-6 text-emerald-600" />;
      case 'biometric':
        return <Building2 className="h-6 w-6 text-indigo-600" />;
      case 'microsoft':
        return <Globe className="h-6 w-6 text-blue-600" />;
      case 'gridfs':
      default:
        return <Database className="h-6 w-6 text-purple-600" />;
    }
  };

  return (
    <SuperAdminLayout
      pageTitle="Super Admin Integration Hub"
      breadcrumbs={[{ label: 'Integrations', href: '/super-admin/integrations' }]}
    >
      {/* Toast Alert */}
      {toast && (
        <div
          className={`fixed right-6 top-20 z-50 flex items-center gap-2 rounded-xl px-4 py-3 text-xs font-bold text-white shadow-2xl transition-all border ${
            toast.type === 'success' ? 'bg-slate-900 border-slate-700' : 'bg-rose-900 border-rose-700'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          ) : (
            <AlertCircle className="h-4 w-4 text-rose-400" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      <div className="space-y-6">
        {/* Header Summary Banner */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-slate-900">System Integration Hub</h2>
              <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-[10px] font-extrabold text-indigo-800 border border-indigo-200">
                GATEWAYS & DRIVERS
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Monitor live health, configure credentials, and manage hardware gateways & enterprise connectors
            </p>
          </div>

          <div className="flex items-center gap-3">
            {lastHealthCheck && (
              <span className="text-[11px] font-mono text-slate-400 hidden sm:inline-block">
                Last checked: {new Date(lastHealthCheck).toLocaleTimeString()}
              </span>
            )}
            <button
              onClick={fetchIntegrations}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 text-indigo-600 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Refresh Health</span>
            </button>
          </div>
        </div>

        {/* Global Summary KPI Header Row */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Connected Services</span>
              <span className="rounded-lg bg-emerald-100 p-2 text-emerald-700">
                <CheckCircle2 className="h-4 w-4" />
              </span>
            </div>
            <div className="mt-2 text-2xl font-black text-slate-900">{metrics.connected}</div>
            <div className="mt-1 text-[10px] font-semibold text-emerald-600">Operational & Syncing</div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Not Configured</span>
              <span className="rounded-lg bg-amber-100 p-2 text-amber-700">
                <Clock className="h-4 w-4" />
              </span>
            </div>
            <div className="mt-2 text-2xl font-black text-slate-900">{metrics.notConfigured}</div>
            <div className="mt-1 text-[10px] font-semibold text-amber-600">Pending Setup</div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Connection Failed</span>
              <span className="rounded-lg bg-rose-100 p-2 text-rose-700">
                <XCircle className="h-4 w-4" />
              </span>
            </div>
            <div className="mt-2 text-2xl font-black text-slate-900">{metrics.connectionFailed}</div>
            <div className="mt-1 text-[10px] font-semibold text-rose-600">Requires Inspection</div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Disabled Services</span>
              <span className="rounded-lg bg-slate-100 p-2 text-slate-600">
                <Power className="h-4 w-4" />
              </span>
            </div>
            <div className="mt-2 text-2xl font-black text-slate-900">{metrics.disabled}</div>
            <div className="mt-1 text-[10px] font-semibold text-slate-500">Temporarily Paused</div>
          </div>
        </div>

        {/* Loading Spinner */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <RefreshCw className="h-8 w-8 animate-spin text-indigo-600" />
            <p className="mt-3 text-xs font-medium text-slate-600">Diagnosing system integration status...</p>
          </div>
        ) : (
          /* Integrations Grid */
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {(integrations || []).map((item) => (
              <div
                key={item.id}
                className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-xs transition-all hover:shadow-md"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3.5">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 border border-slate-100 shadow-xs">
                        {getProviderIcon(item.provider)}
                      </div>
                      <div>
                        <h3 className="text-base font-extrabold text-slate-900">{item.name}</h3>
                        <p className="text-[11px] font-semibold text-slate-400">{item.category}</p>
                      </div>
                    </div>
                    {renderStatusBadge(item.status)}
                  </div>

                  <p className="mt-4 text-xs text-slate-600 leading-relaxed">{item.description}</p>

                  {/* Provider Specific Configuration Breakdown */}
                  <div className="mt-4 rounded-xl bg-slate-50 p-3 border border-slate-100 text-xs space-y-1.5 font-mono">
                    {item.provider === 'whatsapp' && (
                      <>
                        <div className="flex justify-between text-slate-600">
                          <span className="text-slate-400">Phone Number ID:</span>
                          <span className="font-bold">{item.config?.phoneNumberId || 'Not Configured'}</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span className="text-slate-400">Graph API Version:</span>
                          <span>{item.config?.graphVersion || 'v19.0'}</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span className="text-slate-400">Access Token:</span>
                          <span>{item.config?.accessToken || '••••••••'}</span>
                        </div>
                      </>
                    )}

                    {item.provider === 'biometric' && (
                      <>
                        <div className="flex justify-between text-slate-600">
                          <span className="text-slate-400">Provider Hardware:</span>
                          <span className="font-bold text-indigo-700">{item.config?.provider || 'ZKTeco / ESSL'}</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span className="text-slate-400">Gateway Connector:</span>
                          <span>{item.config?.connectorUrl || 'Private Local Gateway'}</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span className="text-slate-400">Sync Mode:</span>
                          <span className="rounded bg-indigo-100 px-1.5 py-0.5 text-[10px] text-indigo-800 font-bold">
                            {item.config?.syncMode || 'Manual Batch'}
                          </span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span className="text-slate-400">Deployment Type:</span>
                          <span className="text-emerald-700 font-bold">Cloud Gateway + Local Device</span>
                        </div>
                      </>
                    )}

                    {item.provider === 'microsoft' && (
                      <>
                        <div className="flex justify-between text-slate-600">
                          <span className="text-slate-400">Entra Tenant ID:</span>
                          <span className="font-bold truncate max-w-[200px]">{item.config?.tenantId || 'Not Configured'}</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span className="text-slate-400">Client App ID:</span>
                          <span className="truncate max-w-[200px]">{item.config?.clientId || 'Not Configured'}</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span className="text-slate-400">Connected Account:</span>
                          <span className="text-blue-700 font-bold">{item.config?.accountEmail || 'None'}</span>
                        </div>
                      </>
                    )}

                    {item.provider === 'gridfs' && (
                      <>
                        <div className="flex justify-between text-slate-600">
                          <span className="text-slate-400">Storage Engine:</span>
                          <span className="font-bold text-purple-700">MongoDB GridFS Chunked Driver</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span className="text-slate-400">GridFS Buckets:</span>
                          <span className="text-slate-900 font-bold">photos & documents</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span className="text-slate-400">Media Stored:</span>
                          <span>
                            {item.config?.photosCount ?? 0} photos | {item.config?.documentsCount ?? 0} docs
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="mt-6 border-t border-slate-100 pt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-xs">
                  <span className="text-[10px] text-slate-400 font-mono">
                    {item.lastTestedAt ? `Verified: ${new Date(item.lastTestedAt).toLocaleTimeString()}` : 'Never verified'}
                  </span>

                  <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                    {/* Special Action Buttons */}
                    {item.provider === 'biometric' && (
                      <button
                        onClick={syncBiometricNow}
                        disabled={syncingBio || item.status === 'DISABLED'}
                        className="flex items-center gap-1 rounded-xl bg-indigo-50 border border-indigo-200 px-3 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100 disabled:opacity-50"
                      >
                        <Zap className={`h-3.5 w-3.5 text-indigo-600 ${syncingBio ? 'animate-spin' : ''}`} />
                        <span>Sync Now</span>
                      </button>
                    )}

                    {item.provider === 'microsoft' && item.status !== 'CONNECTED' && (
                      <a
                        href="/api/v1/integrations/microsoft/connect"
                        className="flex items-center gap-1 rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-700 shadow-xs"
                      >
                        <Globe className="h-3.5 w-3.5" />
                        <span>Connect MS 365</span>
                      </a>
                    )}

                    <button
                      onClick={() => testConnection(item.provider)}
                      disabled={testingId === item.provider || item.status === 'DISABLED'}
                      className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 hover:text-indigo-600 disabled:opacity-50"
                    >
                      {testingId === item.provider ? (
                        <RefreshCw className="h-3.5 w-3.5 animate-spin text-indigo-600" />
                      ) : (
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                      )}
                      <span>Test Connection</span>
                    </button>

                    {item.provider !== 'gridfs' && (
                      <>
                        <button
                          onClick={() => setActiveModalProvider(item.provider)}
                          className="flex items-center gap-1 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 text-xs font-bold text-white shadow-xs transition-colors"
                        >
                          <Settings className="h-3.5 w-3.5" />
                          <span>Configure</span>
                        </button>

                        <button
                          onClick={() => toggleEnableDisable(item)}
                          disabled={togglingId === item.provider}
                          className={`flex items-center gap-1 rounded-xl border px-2.5 py-1.5 text-xs font-bold transition-colors ${
                            item.status === 'DISABLED'
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                              : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200'
                          }`}
                        >
                          <Power className="h-3.5 w-3.5" />
                          <span>{item.status === 'DISABLED' ? 'Enable' : 'Disable'}</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Lower Row: Health Status List & Audit Activity Stream */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Health Summary List Widget */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs lg:col-span-1">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-indigo-600" />
                <h3 className="text-sm font-extrabold text-slate-900">Integration Health</h3>
              </div>
              <span className="text-[10px] font-bold text-slate-400">REALTIME</span>
            </div>

            <div className="mt-4 space-y-3">
              {(integrations || []).map((i) => (
                <div key={i.id} className="flex items-center justify-between rounded-xl bg-slate-50 p-3 border border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${
                        i.status === 'CONNECTED'
                          ? 'bg-emerald-500 animate-pulse'
                          : i.status === 'DISABLED'
                          ? 'bg-slate-400'
                          : i.status === 'CONNECTION_FAILED'
                          ? 'bg-rose-500'
                          : 'bg-amber-500'
                      }`}
                    />
                    <div>
                      <div className="text-xs font-extrabold text-slate-900">{i.name}</div>
                      <div className="text-[10px] text-slate-500">{i.statusText || i.status}</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">
                    {i.lastTestedAt ? new Date(i.lastTestedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Pending'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Activity Stream Widget */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs lg:col-span-2">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-indigo-600" />
                <h3 className="text-sm font-extrabold text-slate-900">Integration Activity Stream</h3>
              </div>
              <span className="text-[10px] font-bold text-slate-400">AUDIT LOG REPOSITORY</span>
            </div>

            <div className="mt-4 space-y-3 max-h-[280px] overflow-y-auto pr-1">
              {(activityStream || []).length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">No integration audit events recorded yet.</div>
              ) : (
                (activityStream || []).map((act) => (
                  <div key={act.id} className="flex items-start justify-between rounded-xl bg-slate-50 p-3 border border-slate-100 text-xs">
                    <div className="flex items-start gap-2.5">
                      <div className="mt-0.5 rounded-lg bg-indigo-100 p-1.5 text-indigo-700">
                        <Sliders className="h-3.5 w-3.5" />
                      </div>
                      <div>
                        <div className="font-extrabold text-slate-900 flex items-center gap-2">
                          <span>{act.action}</span>
                          {act.details?.provider && (
                            <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-mono text-slate-700">
                              {act.details.provider.toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Executed by <span className="font-semibold text-slate-700">{act.userEmail}</span>
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 whitespace-nowrap">
                      {new Date(act.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* WHATSAPP CONFIG MODAL */}
      {activeModalProvider === 'whatsapp' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-emerald-600" />
                <h3 className="text-base font-extrabold text-slate-900">Configure WhatsApp Business API</h3>
              </div>
              <button onClick={() => setActiveModalProvider(null)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                saveConfiguration('whatsapp', waForm);
              }}
              className="mt-4 space-y-4 text-xs"
            >
              <div>
                <label className="font-extrabold text-slate-700">Phone Number ID</label>
                <input
                  type="text"
                  value={waForm.phoneNumberId}
                  onChange={(e) => setWaForm({ ...waForm, phoneNumberId: e.target.value })}
                  placeholder="e.g. 1049283749281"
                  className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 font-mono focus:border-indigo-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="font-extrabold text-slate-700">Business Account ID</label>
                <input
                  type="text"
                  value={waForm.businessAccountId}
                  onChange={(e) => setWaForm({ ...waForm, businessAccountId: e.target.value })}
                  placeholder="e.g. 98472918472"
                  className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 font-mono focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-extrabold text-slate-700">Graph API Version</label>
                  <input
                    type="text"
                    value={waForm.graphVersion}
                    onChange={(e) => setWaForm({ ...waForm, graphVersion: e.target.value })}
                    placeholder="v19.0"
                    className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 font-mono focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-extrabold text-slate-700">API Base URL</label>
                  <input
                    type="text"
                    value={waForm.apiBaseUrl}
                    onChange={(e) => setWaForm({ ...waForm, apiBaseUrl: e.target.value })}
                    placeholder="https://graph.facebook.com"
                    className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 font-mono focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-extrabold text-slate-700">System User Access Token</label>
                <div className="relative mt-1">
                  <input
                    type={showSecrets['waToken'] ? 'text' : 'password'}
                    value={waForm.accessToken}
                    onChange={(e) => setWaForm({ ...waForm, accessToken: e.target.value })}
                    placeholder="EAA..."
                    className="w-full rounded-xl border border-slate-300 p-2.5 pr-10 font-mono focus:border-indigo-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => toggleShowSecret('waToken')}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                  >
                    {showSecrets['waToken'] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Leave unchanged to preserve existing encrypted token.</p>
              </div>

              <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setActiveModalProvider(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2 font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button type="submit" className="rounded-xl bg-indigo-600 px-4 py-2 font-bold text-white hover:bg-indigo-700 shadow-xs">
                  Save Credentials
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BIOMETRIC CONFIG MODAL */}
      {activeModalProvider === 'biometric' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-indigo-600" />
                <h3 className="text-base font-extrabold text-slate-900">Configure Biometric Gateway</h3>
              </div>
              <button onClick={() => setActiveModalProvider(null)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                saveConfiguration('biometric', bioForm);
              }}
              className="mt-4 space-y-4 text-xs"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-extrabold text-slate-700">Hardware Brand</label>
                  <select
                    value={bioForm.providerName}
                    onChange={(e) => setBioForm({ ...bioForm, providerName: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 font-bold focus:border-indigo-500 focus:outline-none bg-white"
                  >
                    <option value="ZKTeco">ZKTeco</option>
                    <option value="ESSL">ESSL Security</option>
                    <option value="Hikvision">Hikvision</option>
                    <option value="Matrix">Matrix COSEC</option>
                  </select>
                </div>

                <div>
                  <label className="font-extrabold text-slate-700">Sync Mode</label>
                  <select
                    value={bioForm.syncMode}
                    onChange={(e) => setBioForm({ ...bioForm, syncMode: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 font-bold focus:border-indigo-500 focus:outline-none bg-white"
                  >
                    <option value="Manual">Manual Trigger</option>
                    <option value="Realtime Webhook">Real-time Push Webhook</option>
                    <option value="Scheduled Polling">Scheduled Gateway Polling</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-extrabold text-slate-700">Device Name / Location</label>
                <input
                  type="text"
                  value={bioForm.deviceName}
                  onChange={(e) => setBioForm({ ...bioForm, deviceName: e.target.value })}
                  placeholder="Main HQ Turnstile Gate 1"
                  className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-extrabold text-slate-700">Connector Gateway URL</label>
                <input
                  type="text"
                  value={bioForm.connectorUrl}
                  onChange={(e) => setBioForm({ ...bioForm, connectorUrl: e.target.value })}
                  placeholder="http://192.168.1.150:8088/api/punches"
                  className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 font-mono focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-extrabold text-slate-700">Gateway API Key / Secret</label>
                <div className="relative mt-1">
                  <input
                    type={showSecrets['bioKey'] ? 'text' : 'password'}
                    value={bioForm.apiKey}
                    onChange={(e) => setBioForm({ ...bioForm, apiKey: e.target.value })}
                    placeholder="secret-key..."
                    className="w-full rounded-xl border border-slate-300 p-2.5 pr-10 font-mono focus:border-indigo-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => toggleShowSecret('bioKey')}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                  >
                    {showSecrets['bioKey'] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setActiveModalProvider(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2 font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button type="submit" className="rounded-xl bg-indigo-600 px-4 py-2 font-bold text-white hover:bg-indigo-700 shadow-xs">
                  Save Gateway Specs
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MICROSOFT 365 CONFIG MODAL */}
      {activeModalProvider === 'microsoft' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-blue-600" />
                <h3 className="text-base font-extrabold text-slate-900">Configure Microsoft 365 Entra ID</h3>
              </div>
              <button onClick={() => setActiveModalProvider(null)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                saveConfiguration('microsoft', msForm);
              }}
              className="mt-4 space-y-4 text-xs"
            >
              <div>
                <label className="font-extrabold text-slate-700">Directory (Tenant) ID</label>
                <input
                  type="text"
                  value={msForm.tenantId}
                  onChange={(e) => setMsForm({ ...msForm, tenantId: e.target.value })}
                  placeholder="00000000-0000-0000-0000-000000000000"
                  className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 font-mono focus:border-indigo-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="font-extrabold text-slate-700">Application (Client) ID</label>
                <input
                  type="text"
                  value={msForm.clientId}
                  onChange={(e) => setMsForm({ ...msForm, clientId: e.target.value })}
                  placeholder="00000000-0000-0000-0000-000000000000"
                  className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 font-mono focus:border-indigo-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="font-extrabold text-slate-700">Tenant / Company Name</label>
                <input
                  type="text"
                  value={msForm.tenantName}
                  onChange={(e) => setMsForm({ ...msForm, tenantName: e.target.value })}
                  placeholder="Contoso Corp"
                  className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-extrabold text-slate-700">Client Secret Value</label>
                <div className="relative mt-1">
                  <input
                    type={showSecrets['msSecret'] ? 'text' : 'password'}
                    value={msForm.clientSecret}
                    onChange={(e) => setMsForm({ ...msForm, clientSecret: e.target.value })}
                    placeholder="secret..."
                    className="w-full rounded-xl border border-slate-300 p-2.5 pr-10 font-mono focus:border-indigo-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => toggleShowSecret('msSecret')}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                  >
                    {showSecrets['msSecret'] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setActiveModalProvider(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2 font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button type="submit" className="rounded-xl bg-indigo-600 px-4 py-2 font-bold text-white hover:bg-indigo-700 shadow-xs">
                  Save Azure App Registration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DISABLE CONFIRMATION MODAL */}
      {disableConfirmProvider && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertCircle className="h-6 w-6" />
              <h3 className="text-base font-extrabold text-slate-900">Disable Integration?</h3>
            </div>
            <p className="mt-3 text-xs text-slate-600 leading-relaxed">
              Are you sure you want to disable <strong className="text-slate-900">{disableConfirmProvider.name}</strong>? Automated background sync and webhook delivery will pause until re-enabled. Your configuration details will remain safely saved.
            </p>
            <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-4">
              <button
                onClick={() => setDisableConfirmProvider(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDisableIntegration}
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700 shadow-xs"
              >
                Disable Integration
              </button>
            </div>
          </div>
        </div>
      )}
    </SuperAdminLayout>
  );
}
