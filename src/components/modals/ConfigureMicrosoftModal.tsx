'use client';

import React, { useState, useEffect } from 'react';
import { X, Building, ShieldAlert, CheckCircle2, AlertCircle, Loader2, Play, LogOut } from 'lucide-react';

interface ConfigureMicrosoftModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialConfig?: any;
  onConfigSaved: () => void;
}

export const ConfigureMicrosoftModal: React.FC<ConfigureMicrosoftModalProps> = ({
  isOpen,
  onClose,
  initialConfig,
  onConfigSaved,
}) => {
  const [tenantId, setTenantId] = useState('');
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [accountEmail, setAccountEmail] = useState('');
  const [tenantName, setTenantName] = useState('');
  const [isEnabled, setIsEnabled] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    if (initialConfig) {
      setTenantId(initialConfig.tenantId || '');
      setClientId(initialConfig.clientId || '');
      setAccountEmail(initialConfig.accountEmail || '');
      setTenantName(initialConfig.tenantName || '');
      setIsEnabled(initialConfig.enabled !== false);
    }
  }, [initialConfig, isOpen]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId.trim() || !clientId.trim()) {
      setErrorMsg('Please enter Microsoft Tenant ID and Client ID.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    setTestResult(null);

    try {
      const res = await fetch('/api/v1/integrations/microsoft/configure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: tenantId.trim(),
          clientId: clientId.trim(),
          clientSecret: clientSecret.trim(),
          accountEmail: accountEmail.trim(),
          tenantName: tenantName.trim(),
          enabled: isEnabled,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to save Microsoft configuration');
      }

      onConfigSaved();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save configuration');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setErrorMsg('');
    setTestResult(null);

    try {
      const res = await fetch('/api/v1/integrations/microsoft/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();
      if (data.success) {
        setTestResult({ success: true, message: data.result?.message || '✓ Microsoft 365 Connected!' });
      } else {
        setTestResult({ success: false, message: data.result?.message || data.message || '✕ Microsoft OAuth authorization incomplete.' });
      }
      onConfigSaved();
    } catch (err: any) {
      setTestResult({ success: false, message: err.message || 'Unable to authenticate with Microsoft 365.' });
    } finally {
      setIsTesting(false);
    }
  };

  const handleConnectOAuth = () => {
    window.location.href = '/api/v1/integrations/microsoft/connect';
  };

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect Microsoft 365 integration and revoke tokens?')) return;
    setIsDisconnecting(true);
    try {
      await fetch('/api/v1/integrations/microsoft/disconnect', { method: 'POST' });
      onConfigSaved();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to disconnect');
    } finally {
      setIsDisconnecting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-700 font-bold">
              <Building className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Configure Microsoft 365 / Teams</h3>
              <p className="text-xs text-slate-500">Enterprise Entra ID OAuth 2.0 & MSAL Gateway</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Security Alert */}
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-xs text-blue-800 flex items-start gap-2">
          <ShieldAlert className="h-4 w-4 shrink-0 text-blue-600 mt-0.5" />
          <span>
            OAuth tokens are managed strictly server-side and stored encrypted at rest. Never expose tokens to React client bundle.
          </span>
        </div>

        {errorMsg && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-rose-500 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {testResult && (
          <div
            className={`rounded-xl border p-3 text-xs flex items-center gap-2 ${
              testResult.success ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-rose-200 bg-rose-50 text-rose-800'
            }`}
          >
            {testResult.success ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <AlertCircle className="h-4 w-4 text-rose-600" />}
            <span>{testResult.message}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Directory (Tenant) ID *</label>
              <input
                type="text"
                required
                placeholder="e.g. 8f920195-..."
                value={tenantId}
                onChange={(e) => setTenantId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono text-slate-800 focus:bg-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Application (Client) ID *</label>
              <input
                type="text"
                required
                placeholder="e.g. 4d820192-..."
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono text-slate-800 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Client Secret (Optional if using OAuth PKCE)</label>
            <input
              type="password"
              placeholder="Paste Client Secret Value or leave masked"
              value={clientSecret}
              onChange={(e) => setClientSecret(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono text-slate-800 focus:bg-white focus:outline-none"
            />
          </div>

          {accountEmail && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs">
              <span className="text-slate-500">Connected Microsoft Account: </span>
              <span className="font-bold text-slate-900">{accountEmail}</span>
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={isEnabled}
                onChange={(e) => setIsEnabled(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span>Enable Microsoft 365 Integration</span>
            </label>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleConnectOAuth}
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700"
              >
                <Building className="h-3.5 w-3.5" />
                Connect Microsoft 365
              </button>

              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTesting}
                className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-800 hover:bg-blue-100 disabled:opacity-50"
              >
                {isTesting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
                Test Connection
              </button>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            {accountEmail ? (
              <button
                type="button"
                onClick={handleDisconnect}
                disabled={isDisconnecting}
                className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-800"
              >
                <LogOut className="h-3.5 w-3.5" /> Disconnect
              </button>
            ) : (
              <div></div>
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2 text-xs font-semibold text-white shadow-md hover:bg-blue-700 disabled:opacity-50"
              >
                {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Save Configuration
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
