'use client';

import React, { useState, useEffect } from 'react';
import { X, MessageSquare, ShieldAlert, CheckCircle2, AlertCircle, Loader2, Play } from 'lucide-react';

interface ConfigureWhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialConfig?: any;
  onConfigSaved: () => void;
}

export const ConfigureWhatsAppModal: React.FC<ConfigureWhatsAppModalProps> = ({
  isOpen,
  onClose,
  initialConfig,
  onConfigSaved,
}) => {
  const [phoneNumberId, setPhoneNumberId] = useState('');
  const [businessAccountId, setBusinessAccountId] = useState('');
  const [apiBaseUrl, setApiBaseUrl] = useState('https://graph.facebook.com');
  const [graphVersion, setGraphVersion] = useState('v19.0');
  const [accessToken, setAccessToken] = useState('');
  const [webhookVerifyToken, setWebhookVerifyToken] = useState('');
  const [isEnabled, setIsEnabled] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    if (initialConfig) {
      setPhoneNumberId(initialConfig.phoneNumberId || '');
      setBusinessAccountId(initialConfig.businessAccountId || '');
      setApiBaseUrl(initialConfig.apiBaseUrl || 'https://graph.facebook.com');
      setGraphVersion(initialConfig.graphVersion || 'v19.0');
      setAccessToken(initialConfig.accessToken || '');
      setWebhookVerifyToken(initialConfig.webhookVerifyToken || '');
      setIsEnabled(initialConfig.enabled !== false);
    }
  }, [initialConfig, isOpen]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumberId.trim()) {
      setErrorMsg('Please enter WhatsApp Phone Number ID.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    setTestResult(null);

    try {
      const res = await fetch('/api/v1/integrations/whatsapp/configure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumberId: phoneNumberId.trim(),
          businessAccountId: businessAccountId.trim(),
          apiBaseUrl: apiBaseUrl.trim(),
          graphVersion: graphVersion.trim(),
          accessToken: accessToken.trim(),
          webhookVerifyToken: webhookVerifyToken.trim(),
          enabled: isEnabled,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to save WhatsApp configuration');
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
      const res = await fetch('/api/v1/integrations/whatsapp/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();
      if (data.success) {
        setTestResult({ success: true, message: data.result?.message || '✓ WhatsApp API Connection Successful!' });
      } else {
        setTestResult({ success: false, message: data.result?.message || data.message || '✕ WhatsApp API Connection Failed.' });
      }
      onConfigSaved();
    } catch (err: any) {
      setTestResult({ success: false, message: err.message || 'Unable to ping WhatsApp Meta API.' });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 font-bold">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Configure WhatsApp Business API</h3>
              <p className="text-xs text-slate-500">Automated payslip delivery & employee event alerts</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Security Warning Alert */}
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 flex items-start gap-2">
          <ShieldAlert className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
          <span>
            API tokens are encrypted at rest on the server using AES-256-GCM. GET responses return masked values only.
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
              <label className="block font-semibold text-slate-700 mb-1">Phone Number ID *</label>
              <input
                type="text"
                required
                placeholder="e.g. 10482910592810"
                value={phoneNumberId}
                onChange={(e) => setPhoneNumberId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Business Account ID</label>
              <input
                type="text"
                placeholder="e.g. 948201958201"
                value={businessAccountId}
                onChange={(e) => setBusinessAccountId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">API Base URL</label>
              <input
                type="text"
                value={apiBaseUrl}
                onChange={(e) => setApiBaseUrl(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Graph API Version</label>
              <input
                type="text"
                value={graphVersion}
                onChange={(e) => setGraphVersion(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Access Token (Permanent / System User Token)</label>
            <input
              type="password"
              placeholder="Paste Meta Graph Access Token or leave masked"
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <p className="text-[10px] text-slate-400 mt-1">Obtain from Meta Business Manager -&gt; System Users -&gt; Generate Token.</p>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Webhook Verify Token (Optional)</label>
            <input
              type="text"
              placeholder="Custom secret string for Webhook validation"
              value={webhookVerifyToken}
              onChange={(e) => setWebhookVerifyToken(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={isEnabled}
                onChange={(e) => setIsEnabled(e.target.checked)}
                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span>Enable WhatsApp Business Integration</span>
            </label>

            <button
              type="button"
              onClick={handleTestConnection}
              disabled={isTesting}
              className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 disabled:opacity-50"
            >
              {isTesting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
              Test Connection
            </button>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
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
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2 text-xs font-semibold text-white shadow-md hover:bg-emerald-700 disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Save Configuration
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
