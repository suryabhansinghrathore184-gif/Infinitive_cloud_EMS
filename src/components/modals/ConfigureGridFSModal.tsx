'use client';

import React, { useState } from 'react';
import { X, Cloud, CheckCircle2, AlertCircle, Loader2, Play, Database, ShieldCheck, FileText, Image as ImageIcon } from 'lucide-react';

interface ConfigureGridFSModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialConfig?: any;
  onConfigSaved: () => void;
}

export const ConfigureGridFSModal: React.FC<ConfigureGridFSModalProps> = ({
  isOpen,
  onClose,
  initialConfig,
  onConfigSaved,
}) => {
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<any | null>(null);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/v1/integrations/gridfs/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();
      setTestResult(data.result);
      onConfigSaved();
    } catch (err: any) {
      setTestResult({
        status: 'CONNECTION_FAILED',
        message: err.message || 'GridFS health check failed',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const photosCount = initialConfig?.photosCount || testResult?.photosCount || 0;
  const documentsCount = initialConfig?.documentsCount || testResult?.documentsCount || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-700 font-bold">
              <Cloud className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">MongoDB GridFS Storage Driver</h3>
              <p className="text-xs text-slate-500">Native Encrypted Binary Vault for Employee Files & Photos</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Storage Info Card */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
              <Database className="h-4 w-4 text-blue-600" />
              <span>Storage Driver Details</span>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
              <ShieldCheck className="h-3.5 w-3.5" /> Connected
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 text-xs">
                <span className="font-semibold text-slate-700 flex items-center gap-1">
                  <ImageIcon className="h-3.5 w-3.5 text-purple-600" /> Photos Bucket
                </span>
                <span className="text-[10px] bg-purple-50 text-purple-700 font-bold px-1.5 py-0.5 rounded">
                  photos
                </span>
              </div>
              <p className="mt-2 text-xl font-black text-slate-900">{photosCount}</p>
              <p className="text-[10px] text-slate-400">Employee profile portraits & extractions</p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 text-xs">
                <span className="font-semibold text-slate-700 flex items-center gap-1">
                  <FileText className="h-3.5 w-3.5 text-blue-600" /> Documents Bucket
                </span>
                <span className="text-[10px] bg-blue-50 text-blue-700 font-bold px-1.5 py-0.5 rounded">
                  documents
                </span>
              </div>
              <p className="mt-2 text-xl font-black text-slate-900">{documentsCount}</p>
              <p className="text-[10px] text-slate-400">Contracts, identity proofs & HR attachments</p>
            </div>
          </div>
        </div>

        {testResult && (
          <div
            className={`rounded-xl border p-3 text-xs flex items-center gap-2 ${
              testResult.status === 'CONNECTED' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-rose-200 bg-rose-50 text-rose-800'
            }`}
          >
            {testResult.status === 'CONNECTED' ? <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" /> : <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />}
            <span>{testResult.message}</span>
          </div>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-500">
          <span>Uses MongoDB GridFS protocol. No external S3 API keys required.</span>

          <button
            type="button"
            onClick={handleTestConnection}
            disabled={isTesting}
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isTesting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
            Run Health Check
          </button>
        </div>
      </div>
    </div>
  );
};
