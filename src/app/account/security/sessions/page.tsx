'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import {
  Laptop,
  Globe,
  Clock,
  ShieldCheck,
  Trash2,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Lock,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';

interface SessionItem {
  id: string;
  sessionToken: string;
  userAgent: string;
  ipAddress: string;
  createdAt: string;
  lastActiveAt: string;
  expiresAt: string;
  isCurrent: boolean;
}

export default function UserSessionsPage() {
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRevokingAll, setIsRevokingAll] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchSessions = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/v1/auth/sessions');
      if (res.ok) {
        const result = await res.json();
        if (result.success && Array.isArray(result.data)) {
          setSessions(result.data);
        }
      }
    } catch (err) {
      console.error('Error fetching sessions:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const handleRevokeSingle = async (sessionId: string) => {
    setMessage(null);
    try {
      const res = await fetch(`/api/v1/auth/sessions/${sessionId}`, {
        method: 'DELETE',
      });
      const result = await res.json();
      if (res.ok && result.success) {
        setMessage({ type: 'success', text: 'Session revoked successfully.' });
        fetchSessions();
      } else {
        setMessage({ type: 'error', text: result.message || 'Failed to revoke session.' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Network error occurred.' });
    }
  };

  const handleRevokeAllOther = async () => {
    setIsRevokingAll(true);
    setMessage(null);
    try {
      const res = await fetch('/api/v1/auth/sessions/revoke-all', {
        method: 'POST',
      });
      const result = await res.json();
      if (res.ok && result.success) {
        setMessage({ type: 'success', text: result.message || 'All other active sessions revoked.' });
        fetchSessions();
      } else {
        setMessage({ type: 'error', text: result.message || 'Failed to revoke other sessions.' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Network error occurred.' });
    } finally {
      setIsRevokingAll(false);
    }
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-slate-950 p-4 text-slate-100 font-sans md:p-8">
        <div className="mx-auto max-w-4xl space-y-6">
          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-4">
            <div>
              <Link href="/super-admin/dashboard" className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-white mb-2">
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to Dashboard
              </Link>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold text-white">Active Device Sessions</h1>
                <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-400 border border-emerald-500/30">
                  {sessions.length} ACTIVE
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Manage your authenticated device sessions, inspect remote logins, and revoke unrecognized access tokens
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={fetchSessions}
                className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>

              <button
                onClick={handleRevokeAllOther}
                disabled={isRevokingAll || sessions.filter((s) => !s.isCurrent).length === 0}
                className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-rose-500 disabled:opacity-50"
              >
                {isRevokingAll ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                <span>Revoke All Other Sessions</span>
              </button>
            </div>
          </div>

          {/* Toast Message */}
          {message && (
            <div
              className={`flex items-center gap-2 rounded-xl p-3.5 text-xs font-semibold border ${
                message.type === 'success'
                  ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/30'
                  : 'bg-rose-950/40 text-rose-300 border-rose-500/30'
              }`}
            >
              {message.type === 'success' ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <AlertCircle className="h-4 w-4 text-rose-400" />}
              <span>{message.text}</span>
            </div>
          )}

          {/* Sessions List */}
          <div className="space-y-3">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/50 p-12 text-slate-400">
                <RefreshCw className="h-8 w-8 animate-spin text-indigo-500" />
                <p className="mt-3 text-xs font-medium text-slate-400">Fetching authenticated active sessions...</p>
              </div>
            ) : sessions.length === 0 ? (
              <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-12 text-center text-xs text-slate-500">
                No active sessions found.
              </div>
            ) : (
              sessions.map((s) => (
                <div
                  key={s.id}
                  className={`flex flex-col gap-3 rounded-2xl border p-4 shadow-sm transition-all sm:flex-row sm:items-center sm:justify-between ${
                    s.isCurrent
                      ? 'border-indigo-500/40 bg-indigo-950/20'
                      : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-indigo-400 font-bold">
                      <Laptop className="h-5 w-5" />
                    </div>
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white max-w-xs truncate">{s.userAgent}</span>
                        {s.isCurrent && (
                          <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[9px] font-extrabold text-emerald-400 border border-emerald-500/30">
                            THIS DEVICE
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 font-mono">
                        <span className="flex items-center gap-1">
                          <Globe className="h-3 w-3 text-slate-500" />
                          IP: {s.ipAddress}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-slate-500" />
                          Active: {new Date(s.lastActiveAt).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {!s.isCurrent && (
                    <button
                      onClick={() => handleRevokeSingle(s.id)}
                      className="flex items-center gap-1.5 self-end rounded-xl border border-rose-500/30 bg-rose-950/30 px-3 py-1.5 text-xs font-bold text-rose-300 hover:bg-rose-900/40 sm:self-center"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-rose-400" />
                      <span>Revoke</span>
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
