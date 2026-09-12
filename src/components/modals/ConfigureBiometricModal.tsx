'use client';

import React, { useState, useEffect } from 'react';
import { X, Fingerprint, ShieldAlert, CheckCircle2, AlertCircle, Loader2, Play, RefreshCw, Plus, Trash2 } from 'lucide-react';

interface ConfigureBiometricModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialConfig?: any;
  onConfigSaved: () => void;
}

export const ConfigureBiometricModal: React.FC<ConfigureBiometricModalProps> = ({
  isOpen,
  onClose,
  initialConfig,
  onConfigSaved,
}) => {
  const [providerName, setProviderName] = useState<'ZKTeco' | 'Matrix' | 'Generic'>('ZKTeco');
  const [deviceName, setDeviceName] = useState('ZKTeco BioStation X2');
  const [deviceId, setDeviceId] = useState('DEV-ZKT-01');
  const [connectorUrl, setConnectorUrl] = useState('https://biometric-gateway.local.net:8443');
  const [apiKey, setApiKey] = useState('');
  const [syncMode, setSyncMode] = useState<'Realtime Push' | 'Scheduled Polling' | 'Manual'>('Scheduled Polling');
  const [syncIntervalMinutes, setSyncIntervalMinutes] = useState<number>(15);
  const [isEnabled, setIsEnabled] = useState(true);

  // Mappings State
  const [employeeMappings, setEmployeeMappings] = useState<Array<{ deviceUserId: string; emsEmployeeId: string; employeeName: string }>>([]);
  const [newDeviceUserId, setNewDeviceUserId] = useState('');
  const [newEmsEmpId, setNewEmsEmpId] = useState('');
  const [newEmpName, setNewEmpName] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [syncOutcome, setSyncOutcome] = useState<any | null>(null);

  useEffect(() => {
    if (initialConfig) {
      setProviderName(initialConfig.provider || 'ZKTeco');
      setDeviceName(initialConfig.deviceName || 'ZKTeco BioStation X2');
      setDeviceId(initialConfig.deviceId || 'DEV-ZKT-01');
      setConnectorUrl(initialConfig.connectorUrl || 'https://biometric-gateway.local.net:8443');
      setApiKey(initialConfig.apiKey || '');
      setSyncMode(initialConfig.syncMode || 'Scheduled Polling');
      setSyncIntervalMinutes(initialConfig.syncIntervalMinutes || 15);
      setEmployeeMappings(initialConfig.employeeMappings || []);
      setIsEnabled(initialConfig.enabled !== false);
    }
  }, [initialConfig, isOpen]);

  if (!isOpen) return null;

  const handleAddMapping = () => {
    if (!newDeviceUserId.trim() || !newEmsEmpId.trim()) return;
    setEmployeeMappings((prev) => [
      ...prev,
      {
        deviceUserId: newDeviceUserId.trim(),
        emsEmployeeId: newEmsEmpId.trim(),
        employeeName: newEmpName.trim() || newEmsEmpId.trim(),
      },
    ]);
    setNewDeviceUserId('');
    setNewEmsEmpId('');
    setNewEmpName('');
  };

  const handleRemoveMapping = (index: number) => {
    setEmployeeMappings((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!connectorUrl.trim()) {
      setErrorMsg('Please enter local Biometric Gateway Connector URL.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    setTestResult(null);

    try {
      const res = await fetch('/api/v1/integrations/biometric/configure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerName,
          deviceName: deviceName.trim(),
          deviceId: deviceId.trim(),
          connectorUrl: connectorUrl.trim(),
          apiKey: apiKey.trim(),
          syncMode,
          syncIntervalMinutes: Number(syncIntervalMinutes) || 15,
          employeeMappings,
          enabled: isEnabled,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to save biometric configuration');
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
      const res = await fetch('/api/v1/integrations/biometric/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();
      if (data.success) {
        setTestResult({ success: true, message: data.result?.message || '✓ Biometric Gateway Connection Successful!' });
      } else {
        setTestResult({ success: false, message: data.result?.message || data.message || '✕ Unable to connect to biometric device.' });
      }
      onConfigSaved();
    } catch (err: any) {
      setTestResult({ success: false, message: err.message || 'Unable to connect to biometric device.' });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSyncNow = async () => {
    setIsSyncing(true);
    setSyncOutcome(null);
    setErrorMsg('');

    try {
      const res = await fetch('/api/v1/integrations/biometric/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Biometric punch sync failed');
      }

      setSyncOutcome(data.syncResult);
      onConfigSaved();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to execute biometric sync');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-100 text-purple-700 font-bold">
              <Fingerprint className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Configure Biometric Attendance Gateway</h3>
              <p className="text-xs text-slate-500">ZKTeco & Matrix Local Hardware Gateway Architecture</p>
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
            The local connector authenticates via HTTPS API Key. Biometric passwords are never exposed to the client.
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

        {syncOutcome && (
          <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-3 text-xs text-indigo-900 space-y-1">
            <p className="font-bold flex items-center gap-1">
              <CheckCircle2 className="h-4 w-4 text-indigo-600" />
              Sync Outcome: {syncOutcome.message}
            </p>
            <p className="text-[11px] text-indigo-700">
              Imported: <span className="font-bold">{syncOutcome.importedCount}</span> | Duplicates Skipped:{' '}
              <span className="font-bold">{syncOutcome.duplicatesCount}</span> | Unmatched Employees:{' '}
              <span className="font-bold">{syncOutcome.unmatchedCount}</span>
            </p>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-3 text-xs">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Hardware Provider *</label>
              <select
                value={providerName}
                onChange={(e: any) => setProviderName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-800 focus:bg-white focus:outline-none"
              >
                <option value="ZKTeco">ZKTeco Biometric</option>
                <option value="Matrix">Matrix COSEC</option>
                <option value="Generic">Generic TCP/HTTP Device</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Device Name</label>
              <input
                type="text"
                placeholder="e.g. BioStation Main Gate"
                value={deviceName}
                onChange={(e) => setDeviceName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-800 focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Device Identifier</label>
              <input
                type="text"
                placeholder="e.g. DEV-ZKT-01"
                value={deviceId}
                onChange={(e) => setDeviceId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-800 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Connector Gateway URL (HTTPS) *</label>
              <input
                type="text"
                required
                placeholder="https://biometric-gateway.local.net:8443"
                value={connectorUrl}
                onChange={(e) => setConnectorUrl(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-800 focus:bg-white focus:outline-none"
              />
              <p className="text-[10px] text-slate-400 mt-1">Local agent endpoint transmitting punch logs to EMS serverless backend.</p>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Gateway API Secret Key</label>
              <input
                type="password"
                placeholder="Paste API Key or leave masked"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono text-slate-800 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Sync Mode</label>
              <select
                value={syncMode}
                onChange={(e: any) => setSyncMode(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-800 focus:bg-white focus:outline-none"
              >
                <option value="Realtime Push">Realtime Push (Webhook)</option>
                <option value="Scheduled Polling">Scheduled Polling</option>
                <option value="Manual">Manual Trigger Only</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Sync Interval (Minutes)</label>
              <input
                type="number"
                min="5"
                max="1440"
                value={syncIntervalMinutes}
                onChange={(e) => setSyncIntervalMinutes(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-800 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          {/* Device Employee Mapping Section */}
          <div className="border-t border-slate-200 pt-3 mt-3">
            <h4 className="font-bold text-slate-900 text-xs mb-1">Device Employee Mappings</h4>
            <p className="text-[10px] text-slate-500 mb-2">
              Map device user IDs (e.g. BIO-1024) to official EMS employee IDs (e.g. EMP-00025).
            </p>

            <div className="flex items-center gap-2 mb-2">
              <input
                type="text"
                placeholder="Device User ID (BIO-1024)"
                value={newDeviceUserId}
                onChange={(e) => setNewDeviceUserId(e.target.value)}
                className="w-1/3 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs"
              />
              <input
                type="text"
                placeholder="EMS Emp ID (EMP-00025)"
                value={newEmsEmpId}
                onChange={(e) => setNewEmsEmpId(e.target.value)}
                className="w-1/3 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs"
              />
              <input
                type="text"
                placeholder="Employee Name (Optional)"
                value={newEmpName}
                onChange={(e) => setNewEmpName(e.target.value)}
                className="w-1/3 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs"
              />
              <button
                type="button"
                onClick={handleAddMapping}
                className="rounded-lg bg-slate-800 px-3 py-1 text-xs font-semibold text-white hover:bg-slate-900 shrink-0 flex items-center gap-1"
              >
                <Plus className="h-3.5 w-3.5" /> Add
              </button>
            </div>

            {employeeMappings.length > 0 && (
              <div className="max-h-28 overflow-y-auto border border-slate-200 rounded-xl divide-y text-[11px]">
                {employeeMappings.map((m, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 hover:bg-slate-50">
                    <span className="font-mono text-purple-700 font-bold">{m.deviceUserId}</span>
                    <span className="font-mono text-slate-800">{m.emsEmployeeId}</span>
                    <span className="text-slate-600 truncate max-w-[120px]">{m.employeeName}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveMapping(idx)}
                      className="text-rose-500 hover:text-rose-700"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={isEnabled}
                onChange={(e) => setIsEnabled(e.target.checked)}
                className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
              />
              <span>Enable Biometric Gateway</span>
            </label>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSyncNow}
                disabled={isSyncing}
                className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-800 hover:bg-indigo-100 disabled:opacity-50"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                Sync Now
              </button>

              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTesting}
                className="inline-flex items-center gap-1.5 rounded-xl border border-purple-200 bg-purple-50 px-3 py-1.5 text-xs font-semibold text-purple-800 hover:bg-purple-100 disabled:opacity-50"
              >
                {isTesting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
                Test Connection
              </button>
            </div>
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
              className="inline-flex items-center gap-1.5 rounded-xl bg-purple-600 px-5 py-2 text-xs font-semibold text-white shadow-md hover:bg-purple-700 disabled:opacity-50"
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
