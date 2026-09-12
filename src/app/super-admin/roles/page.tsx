'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { SuperAdminLayout } from '@/components/layout/SuperAdminLayout';
import {
  ShieldCheck,
  RefreshCw,
  Save,
  CheckCircle2,
  AlertCircle,
  Lock,
  Layers,
  Info,
} from 'lucide-react';

interface RoleModulePermission {
  module: string;
  key: string;
  SUPER_ADMIN: string;
  ADMIN: string;
  HR: string;
  MANAGER: string;
  EMPLOYEE: string;
}

const ROLES = [
  { key: 'SUPER_ADMIN', label: 'Super Admin', color: 'bg-amber-100 text-amber-800 border-amber-300' },
  { key: 'ADMIN', label: 'Admin (Tenant)', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  { key: 'HR', label: 'HR Admin', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  { key: 'MANAGER', label: 'Manager', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  { key: 'EMPLOYEE', label: 'Employee', color: 'bg-slate-100 text-slate-700 border-slate-200' },
];

const PERMISSION_OPTIONS = [
  { value: 'FULL', label: 'Full Control (CRUD)' },
  { value: 'READ_WRITE', label: 'Read & Write' },
  { value: 'READ', label: 'Read Only' },
  { value: 'NONE', label: 'No Access' },
];

export default function SuperAdminRolesPage() {
  const [matrix, setMatrix] = useState<RoleModulePermission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [updatedAt, setUpdatedAt] = useState('');
  const [updatedBy, setUpdatedBy] = useState('');

  const fetchMatrix = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/v1/super-admin/roles');
      if (res.ok) {
        const result = await res.json();
        if (result.success && result.data) {
          setMatrix(result.data.matrix);
          setUpdatedAt(result.data.updatedAt);
          setUpdatedBy(result.data.updatedBy);
        }
      }
    } catch (err) {
      console.error('Error fetching role matrix:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMatrix();
  }, [fetchMatrix]);

  const handleCellChange = (moduleIndex: number, roleKey: string, newValue: string) => {
    setMatrix((prev) => {
      const copy = [...prev];
      copy[moduleIndex] = {
        ...copy[moduleIndex],
        [roleKey]: newValue,
      };
      return copy;
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/v1/super-admin/roles', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matrix }),
      });

      const result = await res.json();
      if (res.ok && result.success) {
        setMessage({ type: 'success', text: 'System roles and RBAC permission matrix saved successfully.' });
        fetchMatrix();
      } else {
        setMessage({ type: 'error', text: result.message || 'Failed to save roles matrix.' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Network error occurred.' });
    } finally {
      setIsSaving(false);
    }
  };

  const renderBadgeClass = (perm: string) => {
    switch (perm) {
      case 'FULL':
        return 'bg-emerald-50 text-emerald-700 border-emerald-300 font-bold';
      case 'READ_WRITE':
        return 'bg-blue-50 text-blue-700 border-blue-300 font-bold';
      case 'READ':
        return 'bg-amber-50 text-amber-700 border-amber-300 font-medium';
      case 'NONE':
      default:
        return 'bg-slate-100 text-slate-400 border-slate-200';
    }
  };

  return (
    <SuperAdminLayout
      pageTitle="Roles & Module Permission Matrix"
      breadcrumbs={[
        { label: 'Executive Dashboard', href: '/super-admin/dashboard' },
        { label: 'Roles & Matrix', href: '/super-admin/roles' },
      ]}
    >
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-slate-900">System Role Permission Matrix</h2>
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-800 border border-emerald-300">
              13 SYSTEM MODULES
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Define global Role-Based Access Control (RBAC) privileges across all EMS/HRMS modules and user tiers
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchMatrix}
            disabled={isLoading || isSaving}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Reset Matrix</span>
          </button>

          <button
            onClick={handleSave}
            disabled={isSaving || isLoading}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:from-amber-600 hover:to-indigo-700 disabled:opacity-50"
          >
            {isSaving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            <span>Save Matrix Policies</span>
          </button>
        </div>
      </div>

      {/* Notification Banner */}
      {message && (
        <div
          className={`flex items-center gap-2 rounded-xl p-3.5 text-xs font-semibold border ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          {message.type === 'success' ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <AlertCircle className="h-4 w-4 text-rose-600" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Info Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs flex items-start gap-3">
        <Info className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-600 space-y-1">
          <p className="font-bold text-slate-900">RBAC Enforcement Rules</p>
          <p>
            <strong className="text-amber-800 font-bold">SUPER_ADMIN</strong> maintains root system-level authorization. Adjusting module permissions updates server-side authorization enforcement across API routes. Last synchronized:{' '}
            <span className="font-mono text-slate-500">{updatedAt ? new Date(updatedAt).toLocaleString() : 'N/A'}</span> by{' '}
            <span className="font-semibold text-slate-700">{updatedBy}</span>.
          </p>
        </div>
      </div>

      {/* Matrix Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <RefreshCw className="h-8 w-8 animate-spin text-indigo-600" />
            <p className="mt-3 text-xs font-medium text-slate-600">Loading RBAC matrix...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-white text-[11px] font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-4 px-5 min-w-[220px]">System Module</th>
                  {ROLES.map((r) => (
                    <th key={r.key} className="py-4 px-4 text-center">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-extrabold border ${r.color}`}>
                        {r.label}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {matrix.map((row, idx) => (
                  <tr key={row.key} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-5 font-bold text-slate-900 flex items-center gap-2">
                      <Layers className="h-4 w-4 text-indigo-600 shrink-0" />
                      <span>{row.module}</span>
                    </td>

                    {ROLES.map((r) => {
                      const currentVal = (row as any)[r.key] || 'NONE';
                      const isSuperAdminRole = r.key === 'SUPER_ADMIN';

                      return (
                        <td key={r.key} className="py-3 px-3 text-center">
                          {isSuperAdminRole ? (
                            <span className="inline-block rounded-lg bg-emerald-100 px-3 py-1 text-[10px] font-extrabold text-emerald-800 border border-emerald-300">
                              FULL (LOCKED)
                            </span>
                          ) : (
                            <select
                              value={currentVal}
                              onChange={(e) => handleCellChange(idx, r.key, e.target.value)}
                              className={`w-full rounded-xl border px-2 py-1.5 text-[11px] transition-colors focus:outline-hidden ${renderBadgeClass(
                                currentVal
                              )}`}
                            >
                              {PERMISSION_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </SuperAdminLayout>
  );
}
