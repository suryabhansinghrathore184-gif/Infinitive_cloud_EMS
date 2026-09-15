'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  Search,
  X,
  History,
  RotateCcw,
  SlidersHorizontal,
  Eye,
  CheckSquare,
  Square,
  AlertTriangle,
  User,
  Building2,
  ChevronDown,
  ChevronRight,
  ShieldAlert,
  Check,
} from 'lucide-react';

interface RoleModulePermission {
  category: string;
  module: string;
  key: string;
  SUPER_ADMIN: string;
  ADMIN: string;
  HR: string;
  MANAGER: string;
  EMPLOYEE: string;
}

interface AuditLog {
  id: string;
  action: string;
  performedBy: string;
  performedByName: string;
  role: string;
  details: any;
  timestamp: string;
}

const ROLES = [
  { key: 'SUPER_ADMIN', label: 'Super Admin', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  { key: 'ADMIN', label: 'Admin (Tenant)', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  { key: 'HR', label: 'HR Admin', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  { key: 'MANAGER', label: 'Manager', color: 'bg-teal-100 text-teal-800 border-teal-200' },
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
  const [originalMatrix, setOriginalMatrix] = useState<RoleModulePermission[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [version, setVersion] = useState<number>(1);
  const [updatedAt, setUpdatedAt] = useState<string>('');
  const [updatedBy, setUpdatedBy] = useState<string>('');
  const [auditHistory, setAuditHistory] = useState<AuditLog[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Filters & Controls
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [roleFocusFilter, setRoleFocusFilter] = useState('All');
  const [permissionFilter, setPermissionFilter] = useState('All');

  // Bulk Selection
  const [selectedModuleKeys, setSelectedModuleKeys] = useState<Set<string>>(new Set());
  const [bulkRole, setBulkRole] = useState('ADMIN');
  const [bulkPermission, setBulkPermission] = useState('READ_WRITE');

  // Modals
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showRestoreDefaultsModal, setShowRestoreDefaultsModal] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Preview State
  const [previewRole, setPreviewRole] = useState('MANAGER');
  const [previewModuleKey, setPreviewModuleKey] = useState('leave');
  const [previewUserList, setPreviewUserList] = useState<any[]>([]);
  const [previewSelectedUser, setPreviewSelectedUser] = useState<any | null>(null);

  // Fetch Matrix Data from Backend
  const fetchMatrix = useCallback(async () => {
    setIsLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/v1/super-admin/roles');
      const result = await res.json();
      if (res.ok && result.success && result.data) {
        setMatrix(result.data.matrix);
        setOriginalMatrix(result.data.matrix);
        setCategories(result.data.categories || []);
        setVersion(result.data.version || 1);
        setUpdatedAt(result.data.updatedAt || '');
        setUpdatedBy(result.data.updatedBy || '');
        setAuditHistory(result.data.auditHistory || []);
        setSelectedModuleKeys(new Set());
      }
    } catch (err: any) {
      console.error('Error fetching role matrix:', err);
      setMessage({ type: 'error', text: 'Failed to connect to RBAC permissions service.' });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMatrix();
  }, [fetchMatrix]);

  // Fetch system users for User Access Preview Modal
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch('/api/v1/super-admin/users?limit=50');
        const result = await res.json();
        if (res.ok && result.success && result.data?.users) {
          setPreviewUserList(result.data.users);
          if (result.data.users.length > 0) {
            setPreviewSelectedUser(result.data.users[0]);
          }
        }
      } catch (err) {
        console.error('Error fetching preview users:', err);
      }
    };
    fetchUsers();
  }, []);

  // Change Detection & Dirty State Calculation
  const modifiedChanges = useMemo(() => {
    const changes: { module: string; role: string; oldVal: string; newVal: string }[] = [];
    if (originalMatrix.length === 0 || matrix.length === 0) return changes;

    matrix.forEach((row, i) => {
      const origRow = originalMatrix[i];
      if (!origRow) return;
      ['ADMIN', 'HR', 'MANAGER', 'EMPLOYEE'].forEach((rKey) => {
        const currentVal = (row as any)[rKey];
        const origVal = (origRow as any)[rKey];
        if (currentVal !== origVal) {
          changes.push({
            module: row.module,
            role: rKey,
            oldVal: origVal,
            newVal: currentVal,
          });
        }
      });
    });

    return changes;
  }, [matrix, originalMatrix]);

  const isDirty = modifiedChanges.length > 0;

  // Dirty State Page Unload Protection
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = 'Unsaved permission changes will be lost.';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  // Handle cell edit
  const handleCellChange = (moduleKey: string, roleKey: string, newValue: string) => {
    if (roleKey === 'SUPER_ADMIN') return; // Hard locked

    setMatrix((prev) =>
      prev.map((row) => (row.key === moduleKey ? { ...row, [roleKey]: newValue } : row))
    );
  };

  // Save Permissions to Backend API
  const handleConfirmSave = async (actionType = 'SAVE_POLICY') => {
    setIsSaving(true);
    setShowSaveModal(false);
    setShowRestoreDefaultsModal(false);
    setMessage(null);

    try {
      const res = await fetch('/api/v1/super-admin/roles', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matrix, actionType }),
      });

      const result = await res.json();
      if (res.ok && result.success) {
        setMessage({ type: 'success', text: result.message || 'Permission policies saved successfully.' });
        fetchMatrix();
      } else {
        setMessage({ type: 'error', text: result.message || 'Failed to save roles matrix policies.' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Network error occurred while saving.' });
    } finally {
      setIsSaving(false);
    }
  };

  // Bulk Apply Permission Level
  const handleApplyBulkPermission = () => {
    if (selectedModuleKeys.size === 0 || bulkRole === 'SUPER_ADMIN') return;

    setMatrix((prev) =>
      prev.map((row) => (selectedModuleKeys.has(row.key) ? { ...row, [bulkRole]: bulkPermission } : row))
    );

    setSelectedModuleKeys(new Set());
  };

  const toggleSelectModule = (key: string) => {
    setSelectedModuleKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleSelectAllVisible = () => {
    if (selectedModuleKeys.size === filteredMatrix.length) {
      setSelectedModuleKeys(new Set());
    } else {
      setSelectedModuleKeys(new Set(filteredMatrix.map((m) => m.key)));
    }
  };

  // Filtered Rows Calculation
  const filteredMatrix = useMemo(() => {
    return matrix.filter((row) => {
      if (categoryFilter !== 'All' && row.category !== categoryFilter) return false;
      if (search.trim()) {
        const term = search.toLowerCase();
        const matchesName = row.module.toLowerCase().includes(term) || row.key.toLowerCase().includes(term);
        const matchesCategory = row.category.toLowerCase().includes(term);
        if (!matchesName && !matchesCategory) return false;
      }
      if (permissionFilter !== 'All') {
        const rolesToCheck = roleFocusFilter !== 'All' ? [roleFocusFilter] : ['ADMIN', 'HR', 'MANAGER', 'EMPLOYEE'];
        const hasPermission = rolesToCheck.some((r) => (row as any)[r] === permissionFilter);
        if (!hasPermission) return false;
      }
      return true;
    });
  }, [matrix, categoryFilter, search, permissionFilter, roleFocusFilter]);

  // Group filtered matrix by Category
  const groupedMatrix = useMemo(() => {
    const map = new Map<string, RoleModulePermission[]>();
    filteredMatrix.forEach((row) => {
      const cat = row.category || 'GENERAL';
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(row);
    });
    return map;
  }, [filteredMatrix]);

  // Compute KPI Summaries
  const kpis = useMemo(() => {
    let fullCount = 0;
    let readWriteCount = 0;
    let readCount = 0;
    let noneCount = 0;

    matrix.forEach((row) => {
      ['SUPER_ADMIN', 'ADMIN', 'HR', 'MANAGER', 'EMPLOYEE'].forEach((r) => {
        const val = (row as any)[r];
        if (val === 'FULL') fullCount++;
        else if (val === 'READ_WRITE') readWriteCount++;
        else if (val === 'READ') readCount++;
        else if (val === 'NONE') noneCount++;
      });
    });

    return {
      totalRoles: 5,
      totalModules: matrix.length,
      fullCount,
      readWriteCount,
      readCount,
      noneCount,
      dirtyCount: modifiedChanges.length,
    };
  }, [matrix, modifiedChanges]);

  const renderBadgeClass = (perm: string) => {
    switch (perm) {
      case 'FULL':
        return 'bg-emerald-50 text-emerald-700 border-emerald-300 font-bold';
      case 'READ_WRITE':
        return 'bg-blue-50 text-blue-700 border-blue-300 font-bold';
      case 'READ':
        return 'bg-amber-50 text-amber-700 border-amber-300 font-semibold';
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
      {/* 1. Header Toolbar */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Roles & Module Permission Matrix</h2>
            <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 border border-indigo-200">
              POLICY VERSION v{version}
            </span>
            {isDirty && (
              <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-extrabold text-amber-800 border border-amber-300 animate-pulse">
                UNSAVED CHANGES ({modifiedChanges.length})
              </span>
            )}
          </div>
          <p className="text-xs font-medium text-slate-500 mt-0.5">
            Define and manage role-based access control policies across all EMS/HRMS modules and user tiers.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowPreviewModal(true)}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50"
          >
            <Eye className="h-3.5 w-3.5 text-indigo-600" />
            <span>Preview Access</span>
          </button>

          <button
            onClick={() => setShowAuditModal(true)}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50"
          >
            <History className="h-3.5 w-3.5 text-purple-600" />
            <span>Audit History</span>
          </button>

          <button
            onClick={() => setShowRestoreDefaultsModal(true)}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50"
          >
            <RotateCcw className="h-3.5 w-3.5 text-slate-500" />
            <span>Restore Defaults</span>
          </button>

          <button
            onClick={() => setMatrix(originalMatrix)}
            disabled={!isDirty}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Reset Matrix</span>
          </button>

          <button
            onClick={() => setShowSaveModal(true)}
            disabled={!isDirty || isSaving}
            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {isSaving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            <span>Save Permission Policies</span>
          </button>
        </div>
      </div>

      {/* 2. Executive KPI Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Total Roles</span>
          <p className="mt-1 text-2xl font-extrabold text-slate-900">{kpis.totalRoles}</p>
          <span className="mt-1 inline-block text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
            SUPER_ADMIN to EMPLOYEE
          </span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">System Modules</span>
          <p className="mt-1 text-2xl font-extrabold text-slate-900">{kpis.totalModules}</p>
          <span className="mt-1 inline-block text-[10px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
            Protected Services
          </span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Full Control</span>
          <p className="mt-1 text-2xl font-extrabold text-emerald-600">{kpis.fullCount}</p>
          <span className="mt-1 inline-block text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
            CRUD Allowed
          </span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Read & Write</span>
          <p className="mt-1 text-2xl font-extrabold text-indigo-600">{kpis.readWriteCount}</p>
          <span className="mt-1 inline-block text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
            Operational
          </span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Read Only</span>
          <p className="mt-1 text-2xl font-extrabold text-amber-600">{kpis.readCount}</p>
          <span className="mt-1 inline-block text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
            View Scope
          </span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Restricted Cells</span>
          <p className="mt-1 text-2xl font-extrabold text-slate-700">{kpis.noneCount}</p>
          <span className="mt-1 inline-block text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
            No Access
          </span>
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

      {/* 3. Role Tier Summary Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5 text-xs">
        <div className="rounded-2xl border border-indigo-200 bg-indigo-50/50 p-3 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="font-extrabold text-indigo-900">SUPER ADMIN</span>
            <span className="rounded bg-indigo-600 px-1.5 py-0.5 text-[9px] font-bold text-white">LOCKED</span>
          </div>
          <p className="mt-1 text-[11px] text-indigo-700">System-wide platform root access & policy governance.</p>
        </div>

        <div className="rounded-2xl border border-purple-200 bg-purple-50/50 p-3 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="font-extrabold text-purple-900">ADMIN</span>
            <span className="rounded bg-purple-200 px-1.5 py-0.5 text-[9px] font-bold text-purple-800">TENANT</span>
          </div>
          <p className="mt-1 text-[11px] text-purple-700">Tenant-level organization administration & oversight.</p>
        </div>

        <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-3 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="font-extrabold text-blue-900">HR ADMIN</span>
            <span className="rounded bg-blue-200 px-1.5 py-0.5 text-[9px] font-bold text-blue-800">OPERATIONS</span>
          </div>
          <p className="mt-1 text-[11px] text-blue-700">Workforce management, attendance, leave & payroll ops.</p>
        </div>

        <div className="rounded-2xl border border-teal-200 bg-teal-50/50 p-3 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="font-extrabold text-teal-900">MANAGER</span>
            <span className="rounded bg-teal-200 px-1.5 py-0.5 text-[9px] font-bold text-teal-800">TEAM</span>
          </div>
          <p className="mt-1 text-[11px] text-teal-700">Team approvals, shift reviews & goal performance.</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="font-extrabold text-slate-900">EMPLOYEE</span>
            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-600">SELF</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">Personal workspace, leave requests & payslip viewing.</p>
        </div>
      </div>

      {/* 4. Controls & Filters Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs lg:flex-row lg:items-center lg:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search system modules by name or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2 text-xs font-medium text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-hidden"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Category Filter */}
          <div className="flex items-center gap-1">
            <span className="text-slate-500 font-medium hidden md:inline">Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 font-semibold text-slate-700 shadow-2xs focus:border-indigo-500 focus:outline-hidden"
            >
              <option value="All">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Role Focus Filter */}
          <div className="flex items-center gap-1">
            <span className="text-slate-500 font-medium hidden md:inline">Role Focus:</span>
            <select
              value={roleFocusFilter}
              onChange={(e) => setRoleFocusFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 font-semibold text-slate-700 shadow-2xs focus:border-indigo-500 focus:outline-hidden"
            >
              <option value="All">All Roles</option>
              {ROLES.map((r) => (
                <option key={r.key} value={r.key}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          {/* Permission Filter */}
          <div className="flex items-center gap-1">
            <span className="text-slate-500 font-medium hidden md:inline">Permission:</span>
            <select
              value={permissionFilter}
              onChange={(e) => setPermissionFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 font-semibold text-slate-700 shadow-2xs focus:border-indigo-500 focus:outline-hidden"
            >
              <option value="All">All Levels</option>
              <option value="FULL">Full Control</option>
              <option value="READ_WRITE">Read & Write</option>
              <option value="READ">Read Only</option>
              <option value="NONE">No Access</option>
            </select>
          </div>

          {(search || categoryFilter !== 'All' || roleFocusFilter !== 'All' || permissionFilter !== 'All') && (
            <button
              onClick={() => {
                setSearch('');
                setCategoryFilter('All');
                setRoleFocusFilter('All');
                setPermissionFilter('All');
              }}
              className="flex items-center gap-1 rounded-xl bg-slate-100 px-3 py-1.5 font-bold text-slate-600 hover:bg-slate-200"
            >
              <X className="h-3.5 w-3.5" />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* 5. Matrix Legend Bar & Bulk Action */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs sm:flex-row sm:items-center sm:justify-between text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Policy Legend:</span>
          <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-700 border border-emerald-300">
            FULL CONTROL (CRUD)
          </span>
          <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-extrabold text-blue-700 border border-blue-300">
            READ & WRITE
          </span>
          <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-semibold text-amber-700 border border-amber-300">
            READ ONLY
          </span>
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-semibold text-slate-500 border border-slate-200">
            NO ACCESS
          </span>
          <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-[10px] font-extrabold text-indigo-700 border border-indigo-200">
            SUPER_ADMIN (LOCKED)
          </span>
        </div>

        {/* Bulk Editing Tools */}
        {selectedModuleKeys.size > 0 && (
          <div className="flex items-center gap-2 bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-200">
            <span className="font-bold text-indigo-900 text-[11px]">{selectedModuleKeys.size} Selected</span>
            <select
              value={bulkRole}
              onChange={(e) => setBulkRole(e.target.value)}
              className="rounded-lg border border-indigo-200 bg-white px-2 py-0.5 text-[11px] font-bold text-indigo-800"
            >
              <option value="ADMIN">ADMIN</option>
              <option value="HR">HR</option>
              <option value="MANAGER">MANAGER</option>
              <option value="EMPLOYEE">EMPLOYEE</option>
            </select>

            <select
              value={bulkPermission}
              onChange={(e) => setBulkPermission(e.target.value)}
              className="rounded-lg border border-indigo-200 bg-white px-2 py-0.5 text-[11px] font-bold text-indigo-800"
            >
              <option value="FULL">Full Control</option>
              <option value="READ_WRITE">Read & Write</option>
              <option value="READ">Read Only</option>
              <option value="NONE">No Access</option>
            </select>

            <button
              onClick={handleApplyBulkPermission}
              className="rounded-lg bg-indigo-600 px-2.5 py-0.5 text-[11px] font-bold text-white hover:bg-indigo-700"
            >
              Apply
            </button>
          </div>
        )}
      </div>

      {/* 6. Categorized Matrix Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <RefreshCw className="h-8 w-8 animate-spin text-indigo-600" />
            <p className="mt-3 text-xs font-medium text-slate-600">Loading RBAC permissions matrix...</p>
          </div>
        ) : filteredMatrix.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-500">
            <Layers className="mx-auto h-10 w-10 text-slate-300" />
            <p className="mt-2 font-bold text-slate-700">No modules match search criteria</p>
            <p className="text-slate-400">Try clearing your module search or category filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 sticky top-0 z-20 border-b border-slate-200 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-4 px-4 w-10 text-center">
                    <button onClick={toggleSelectAllVisible} className="text-slate-400 hover:text-indigo-600">
                      {selectedModuleKeys.size === filteredMatrix.length ? (
                        <CheckSquare className="h-4 w-4 text-indigo-600" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </button>
                  </th>
                  <th className="py-4 px-4 min-w-[240px]">System Module</th>
                  {ROLES.map((r) => (
                    <th
                      key={r.key}
                      className={`py-4 px-3 text-center transition-colors ${
                        roleFocusFilter === r.key ? 'bg-indigo-50/80 border-x border-indigo-200' : ''
                      }`}
                    >
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-extrabold border ${r.color}`}>
                        {r.label}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {Array.from(groupedMatrix.entries()).map(([catName, rows]) => (
                  <React.Fragment key={catName}>
                    {/* Category Header Row */}
                    <tr className="bg-slate-100/70 border-y border-slate-200">
                      <td colSpan={2 + ROLES.length} className="py-2 px-4 font-extrabold text-slate-800 text-[11px] tracking-wide uppercase">
                        <div className="flex items-center gap-2">
                          <Layers className="h-3.5 w-3.5 text-indigo-600" />
                          <span>{catName}</span>
                          <span className="text-[10px] font-semibold text-slate-500 font-mono">({rows.length} Modules)</span>
                        </div>
                      </td>
                    </tr>

                    {/* Module Rows */}
                    {rows.map((row) => {
                      const isSelected = selectedModuleKeys.has(row.key);

                      return (
                        <tr key={row.key} className={`hover:bg-slate-50/80 transition-colors ${isSelected ? 'bg-indigo-50/30' : ''}`}>
                          <td className="py-3 px-4 text-center">
                            <button onClick={() => toggleSelectModule(row.key)} className="text-slate-400 hover:text-indigo-600">
                              {isSelected ? <CheckSquare className="h-4 w-4 text-indigo-600" /> : <Square className="h-4 w-4" />}
                            </button>
                          </td>

                          <td className="py-3 px-4 font-bold text-slate-900">
                            <div>
                              <p className="text-xs font-bold text-slate-900">{row.module}</p>
                              <span className="text-[10px] font-mono text-slate-400">{row.key}</span>
                            </div>
                          </td>

                          {ROLES.map((r) => {
                            const currentVal = (row as any)[r.key] || 'NONE';
                            const isSuperAdminRole = r.key === 'SUPER_ADMIN';
                            const isHighlighted = roleFocusFilter === r.key;

                            return (
                              <td
                                key={r.key}
                                className={`py-2.5 px-3 text-center transition-colors ${
                                  isHighlighted ? 'bg-indigo-50/50 border-x border-indigo-200' : ''
                                }`}
                              >
                                {isSuperAdminRole ? (
                                  <span
                                    title="Super Admin permissions are system-protected"
                                    className="inline-flex items-center gap-1 rounded-lg bg-emerald-100 px-3 py-1 text-[10px] font-extrabold text-emerald-800 border border-emerald-300"
                                  >
                                    <Lock className="h-3 w-3" />
                                    FULL (LOCKED)
                                  </span>
                                ) : (
                                  <select
                                    value={currentVal}
                                    onChange={(e) => handleCellChange(row.key, r.key, e.target.value)}
                                    className={`w-full rounded-xl border px-2 py-1 text-[11px] font-semibold transition-colors focus:outline-hidden ${renderBadgeClass(
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
                      );
                    })}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Synchronized Footer Meta */}
        <div className="flex flex-col gap-2 bg-slate-50 border-t border-slate-200 px-5 py-3 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <div>
            Last synchronized:{' '}
            <strong className="text-slate-800">{updatedAt ? new Date(updatedAt).toLocaleString() : 'N/A'}</strong> by{' '}
            <strong className="text-indigo-700">{updatedBy || 'Super Admin'}</strong>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">Policy Version v{version}</span>
            <span>&bull;</span>
            <span className="font-bold text-emerald-600">Server-Side Enforced</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODALS SECTION */}
      {/* ========================================================================= */}

      {/* 1. Save Policy Confirmation Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-indigo-600" />
                <h3 className="text-sm font-extrabold text-slate-900">Save RBAC Policy Changes?</h3>
              </div>
              <button onClick={() => setShowSaveModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              You are about to save modified role-based authorization policies to the live database. These policy changes take effect immediately across all API authorization checks.
            </p>

            <div className="rounded-xl bg-indigo-50 p-3.5 border border-indigo-200 text-xs space-y-1.5">
              <div className="flex justify-between font-bold text-indigo-900">
                <span>Total Modifications:</span>
                <span>{modifiedChanges.length} Cell(s)</span>
              </div>
              <div className="flex justify-between text-indigo-700">
                <span>Next Policy Version:</span>
                <span className="font-mono">v{version + 1}</span>
              </div>
            </div>

            {/* List of modifications preview */}
            <div className="max-h-40 overflow-y-auto space-y-1.5 text-[11px] bg-slate-50 p-3 rounded-xl border border-slate-200">
              {modifiedChanges.map((c, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="font-semibold text-slate-800">{c.module} ({c.role}):</span>
                  <span className="font-mono text-slate-500">{c.oldVal} &rarr; <strong className="text-indigo-600">{c.newVal}</strong></span>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowSaveModal(false)}
                className="rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleConfirmSave('SAVE_POLICY')}
                disabled={isSaving}
                className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
              >
                {isSaving ? 'Saving Policy...' : 'Confirm & Save Policies'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Restore Defaults Modal */}
      {showRestoreDefaultsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <RotateCcw className="h-5 w-5 text-amber-600" />
                <h3 className="text-sm font-extrabold text-slate-900">Restore Factory Default Policies?</h3>
              </div>
              <button onClick={() => setShowRestoreDefaultsModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              This action will reset all role-module permission policies to system factory defaults and update the database policy version.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowRestoreDefaultsModal(false)}
                className="rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleConfirmSave('RESTORE_DEFAULTS')}
                disabled={isSaving}
                className="rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-amber-700 disabled:opacity-50"
              >
                {isSaving ? 'Restoring...' : 'Confirm Restore Defaults'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Audit History Modal */}
      {showAuditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <History className="h-5 w-5 text-purple-600" />
                <h3 className="text-sm font-extrabold text-slate-900">RBAC Permission Audit History</h3>
              </div>
              <button onClick={() => setShowAuditModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto text-xs">
              {auditHistory.length === 0 ? (
                <p className="py-6 text-center text-slate-500">No RBAC audit history logs recorded yet.</p>
              ) : (
                auditHistory.map((log) => (
                  <div key={log.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-slate-900">{log.action}</span>
                      <span className="text-[10px] font-mono text-slate-500">{new Date(log.timestamp).toLocaleString()}</span>
                    </div>
                    <p className="text-slate-600">
                      Performed by: <strong className="text-indigo-700">{log.performedByName}</strong> ({log.performedBy})
                    </p>
                    {log.details?.version && (
                      <span className="inline-block font-mono text-[10px] text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
                        Version v{log.details.version}
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowAuditModal(false)}
                className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800"
              >
                Close Audit History
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Preview Effective Access Modal */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-indigo-600" />
                <h3 className="text-sm font-extrabold text-slate-900">Effective Access Preview</h3>
              </div>
              <button onClick={() => setShowPreviewModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Role & Module Selector */}
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Target Role</label>
                  <select
                    value={previewRole}
                    onChange={(e) => setPreviewRole(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white p-2 font-semibold text-slate-800"
                  >
                    {ROLES.map((r) => (
                      <option key={r.key} value={r.key}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Target Module</label>
                  <select
                    value={previewModuleKey}
                    onChange={(e) => setPreviewModuleKey(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white p-2 font-semibold text-slate-800"
                  >
                    {matrix.map((m) => (
                      <option key={m.key} value={m.key}>
                        {m.module}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Effective Access Result Card */}
              {(() => {
                const targetRow = matrix.find((m) => m.key === previewModuleKey);
                const effectiveLevel = targetRow ? (targetRow as any)[previewRole] || 'NONE' : 'NONE';

                return (
                  <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-slate-900 text-sm">
                        {targetRow?.module || 'Module'} Access Result
                      </span>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-extrabold border ${renderBadgeClass(
                          effectiveLevel
                        )}`}
                      >
                        {effectiveLevel === 'FULL'
                          ? 'FULL CONTROL (CRUD)'
                          : effectiveLevel === 'READ_WRITE'
                          ? 'READ & WRITE'
                          : effectiveLevel === 'READ'
                          ? 'READ ONLY'
                          : 'NO ACCESS'}
                      </span>
                    </div>

                    <p className="text-slate-600 text-[11px]">
                      Users assigned the <strong className="text-indigo-900">{previewRole}</strong> role have{' '}
                      <strong className="text-indigo-900">{effectiveLevel}</strong> access to this module.
                    </p>

                    <p className="text-[10px] text-slate-500 italic border-t border-indigo-200/60 pt-2">
                      Note: Resource-level security filters records server-side according to organization and team boundaries.
                    </p>
                  </div>
                );
              })()}

              {/* User Selector Preview */}
              {previewUserList.length > 0 && (
                <div className="space-y-2">
                  <label className="block font-bold text-slate-700">Select System User to Inspect</label>
                  <select
                    onChange={(e) => {
                      const found = previewUserList.find((u) => u.id === e.target.value);
                      if (found) setPreviewSelectedUser(found);
                    }}
                    className="w-full rounded-xl border border-slate-200 bg-white p-2 font-semibold text-slate-800"
                  >
                    {previewUserList.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.email}) - {u.role}
                      </option>
                    ))}
                  </select>

                  {previewSelectedUser && (
                    <div className="rounded-xl bg-slate-50 p-3 border border-slate-200 text-slate-700 space-y-1">
                      <p className="font-bold text-slate-900">{previewSelectedUser.name}</p>
                      <p className="text-[11px] text-slate-500">
                        Role: <strong className="text-indigo-700">{previewSelectedUser.role}</strong> &bull; Organization:{' '}
                        {previewSelectedUser.organizationName} ({previewSelectedUser.organizationId})
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowPreviewModal(false)}
                className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </SuperAdminLayout>
  );
}
