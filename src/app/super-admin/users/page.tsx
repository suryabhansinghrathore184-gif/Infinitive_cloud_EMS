'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { SuperAdminLayout } from '@/components/layout/SuperAdminLayout';
import { formatRoleLabel } from '@/lib/roleUtils';
import { AddNewAccountCard } from '@/components/accounts/AddNewAccountCard';
import {
  Users,
  Search,
  Filter,
  RefreshCw,
  ShieldCheck,
  Building2,
  CheckCircle2,
  XCircle,
  Edit2,
  X,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  Lock,
  Mail,
  AlertTriangle,
  Key,
  Globe,
  Clock,
  LogOut,
  Eye,
  ShieldAlert,
  SlidersHorizontal,
  Check,
} from 'lucide-react';

interface SystemUser {
  id: string;
  userId: string;
  employeeId: string;
  name: string;
  email: string;
  role: string;
  organizationId: string;
  organizationName: string;
  organizationCode: string;
  status: string;
  emailVerificationStatus: string;
  emailVerified: boolean;
  isTwoFactorEnabled: boolean;
  activeSessionsCount: number;
  avatar: string;
  lastLogin: string;
  createdAt: string;
}

interface UserSummary {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  pendingVerify: number;
  lockedAccounts: number;
  activeSessions: number;
}

interface OrgOption {
  id: string;
  name: string;
  code: string;
}

export default function SuperAdminUsersPage() {
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [summary, setSummary] = useState<UserSummary>({
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    pendingVerify: 0,
    lockedAccounts: 0,
    activeSessions: 0,
  });
  const [organizations, setOrganizations] = useState<OrgOption[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filters & Controls
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [orgFilter, setOrgFilter] = useState('All');
  const [verificationFilter, setVerificationFilter] = useState('All');

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalFilteredUsers, setTotalFilteredUsers] = useState(0);

  // Modal States
  const [viewingUser, setViewingUser] = useState<SystemUser | null>(null);
  const [viewingUserFullDetails, setViewingUserFullDetails] = useState<any | null>(null);
  const [isDetailsLoading, setIsDetailsLoading] = useState(false);

  const [editingRoleUser, setEditingRoleUser] = useState<SystemUser | null>(null);
  const [newRole, setNewRole] = useState('');

  const [editingStatusUser, setEditingStatusUser] = useState<SystemUser | null>(null);
  const [newStatus, setNewStatus] = useState('');

  const [sessionUser, setSessionUser] = useState<SystemUser | null>(null);
  const [sessionsList, setSessionsList] = useState<any[]>([]);
  const [isSessionsLoading, setIsSessionsLoading] = useState(false);

  // Modal Action Feedback
  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [modalSuccess, setModalSuccess] = useState<string | null>(null);

  // Fetch paginated user accounts
  const fetchUsers = useCallback(async (isRefresh = false) => {
    if (isRefresh) setIsRefreshing(true);
    else setIsLoading(true);
    setErrorMessage(null);

    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '15',
        search,
        role: roleFilter,
        status: statusFilter,
        organizationId: orgFilter,
        verification: verificationFilter,
      });

      const res = await fetch(`/api/v1/super-admin/users?${params.toString()}`);
      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.message || 'Failed to fetch system users.');
      }

      const data = result.data;
      setUsers(data.users || []);
      setSummary(data.summary || {});
      setOrganizations(data.organizations || []);
      setTotalPages(data.pagination.totalPages || 1);
      setTotalFilteredUsers(data.pagination.total || 0);
    } catch (err: any) {
      console.error('Error fetching users:', err);
      setErrorMessage(err.message || 'Unable to load system users.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [page, search, roleFilter, statusFilter, orgFilter, verificationFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const resetFilters = () => {
    setSearch('');
    setRoleFilter('All');
    setStatusFilter('All');
    setOrgFilter('All');
    setVerificationFilter('All');
    setPage(1);
  };

  // Fetch full details for a single user
  const handleOpenDetails = async (user: SystemUser) => {
    setViewingUser(user);
    setViewingUserFullDetails(null);
    setIsDetailsLoading(true);

    try {
      const res = await fetch(`/api/v1/super-admin/users/${user.id}`);
      const result = await res.json();
      if (res.ok && result.success) {
        setViewingUserFullDetails(result.data);
      } else {
        setViewingUserFullDetails(user);
      }
    } catch (err) {
      setViewingUserFullDetails(user);
    } finally {
      setIsDetailsLoading(false);
    }
  };

  // Handle Role Change Submission
  const handleSaveRole = async () => {
    if (!editingRoleUser || !newRole) return;
    setModalSubmitting(true);
    setModalError(null);
    setModalSuccess(null);

    try {
      const res = await fetch(`/api/v1/super-admin/users/${editingRoleUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.message || 'Failed to update access role.');
      }

      setModalSuccess(`Role updated to ${newRole} successfully.`);
      setTimeout(() => {
        setEditingRoleUser(null);
        fetchUsers(true);
      }, 1000);
    } catch (err: any) {
      setModalError(err.message);
    } finally {
      setModalSubmitting(false);
    }
  };

  // Handle Account Status Change Submission
  const handleSaveStatus = async () => {
    if (!editingStatusUser || !newStatus) return;
    setModalSubmitting(true);
    setModalError(null);
    setModalSuccess(null);

    try {
      const res = await fetch(`/api/v1/super-admin/users/${editingStatusUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.message || 'Failed to update account status.');
      }

      setModalSuccess(`Account status changed to ${newStatus}.`);
      setTimeout(() => {
        setEditingStatusUser(null);
        fetchUsers(true);
      }, 1000);
    } catch (err: any) {
      setModalError(err.message);
    } finally {
      setModalSubmitting(false);
    }
  };

  // Handle Sessions View & Revoke
  const handleOpenSessions = async (user: SystemUser) => {
    setSessionUser(user);
    setIsSessionsLoading(true);
    setModalError(null);
    setModalSuccess(null);

    try {
      const res = await fetch(`/api/v1/super-admin/users/${user.id}`);
      const result = await res.json();
      if (res.ok && result.success && result.data.activeSessions) {
        setSessionsList(result.data.activeSessions);
      } else {
        setSessionsList([]);
      }
    } catch (err) {
      setSessionsList([]);
    } finally {
      setIsSessionsLoading(false);
    }
  };

  const handleRevokeSession = async (sessionId?: string, revokeAll = false) => {
    if (!sessionUser) return;
    setModalSubmitting(true);
    setModalError(null);
    setModalSuccess(null);

    try {
      const res = await fetch(`/api/v1/super-admin/users/${sessionUser.id}/revoke-sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, revokeAll }),
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.message || 'Failed to revoke session.');
      }

      setModalSuccess(result.message);
      setTimeout(() => {
        handleOpenSessions(sessionUser);
        fetchUsers(true);
      }, 1000);
    } catch (err: any) {
      setModalError(err.message);
    } finally {
      setModalSubmitting(false);
    }
  };

  // Resend Email Verification
  const handleResendVerification = async (user: SystemUser) => {
    setModalSubmitting(true);
    setModalError(null);
    setModalSuccess(null);

    try {
      const res = await fetch(`/api/v1/super-admin/users/${user.id}/resend-verification`, {
        method: 'POST',
      });
      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.message || 'Failed to resend verification.');
      }

      alert(`Verification token generated and sent to ${user.email}.`);
      fetchUsers(true);
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setModalSubmitting(false);
    }
  };

  return (
    <SuperAdminLayout
      pageTitle="System Users & Global Access Management"
      breadcrumbs={[
        { label: 'Executive Dashboard', href: '/super-admin/dashboard' },
        { label: 'System Users', href: '/super-admin/users' },
      ]}
    >
      {/* 1. Account Creation Workflow Card */}
      <div className="mb-6">
        <AddNewAccountCard userRole="SUPER_ADMIN" />
      </div>

      {/* 2. Header Title & Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">System Users & Global Access Control</h2>
          <p className="text-xs font-medium text-slate-500">
            Manage user accounts, roles, organization access, verification status, and account security across all tenants.
          </p>
        </div>

        <button
          onClick={() => fetchUsers(true)}
          className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 text-indigo-600 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>Refresh Users</span>
        </button>
      </div>

      {/* 3. Executive KPI Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {/* Total Users */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Users</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-extrabold text-slate-900">{summary.totalUsers}</p>
          <span className="mt-1 inline-block text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
            All Tenants
          </span>
        </div>

        {/* Active Users */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Active Accounts</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <UserCheck className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-extrabold text-slate-900">{summary.activeUsers}</p>
          <span className="mt-1 inline-block text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
            Authenticated
          </span>
        </div>

        {/* Inactive Users */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Inactive</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
              <XCircle className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-extrabold text-slate-900">{summary.inactiveUsers}</p>
          <span className="mt-1 inline-block text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
            Disabled Access
          </span>
        </div>

        {/* Pending Verification */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Pending Verify</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Mail className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-extrabold text-slate-900">{summary.pendingVerify}</p>
          <span className="mt-1 inline-block text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
            Unverified Email
          </span>
        </div>

        {/* Locked Accounts */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Locked</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
              <Lock className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-extrabold text-slate-900">{summary.lockedAccounts}</p>
          <span className="mt-1 inline-block text-[10px] font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded">
            Security Hold
          </span>
        </div>

        {/* Active Sessions */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Active Sessions</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              <Globe className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-extrabold text-slate-900">{summary.activeSessions}</p>
          <span className="mt-1 inline-block text-[10px] font-semibold text-purple-600 bg-purple-50 px-2 py-0.5 rounded">
            Live Tokens
          </span>
        </div>
      </div>

      {/* 4. Search & Filter Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs lg:flex-row lg:items-center lg:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, email, employee ID, organization, or role..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2 text-xs font-medium text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-hidden"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Role Filter */}
          <div className="flex items-center gap-1 text-xs">
            <span className="text-slate-500 font-medium hidden md:inline">Role:</span>
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs focus:border-indigo-500 focus:outline-hidden"
            >
              <option value="All">All Roles</option>
              <option value="SUPER_ADMIN">Super Admin</option>
              <option value="ADMIN">Admin</option>
              <option value="HR">HR Administrator</option>
              <option value="MANAGER">Manager</option>
              <option value="EMPLOYEE">Employee</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1 text-xs">
            <span className="text-slate-500 font-medium hidden md:inline">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs focus:border-indigo-500 focus:outline-hidden"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Locked">Locked / Suspended</option>
              <option value="Pending Verification">Pending Verify</option>
            </select>
          </div>

          {/* Organization Filter */}
          <div className="flex items-center gap-1 text-xs">
            <span className="text-slate-500 font-medium hidden md:inline">Org:</span>
            <select
              value={orgFilter}
              onChange={(e) => {
                setOrgFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs focus:border-indigo-500 focus:outline-hidden"
            >
              <option value="All">All Organizations</option>
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name} ({org.code})
                </option>
              ))}
            </select>
          </div>

          {/* Email Verification Filter */}
          <div className="flex items-center gap-1 text-xs">
            <span className="text-slate-500 font-medium hidden md:inline">Verify:</span>
            <select
              value={verificationFilter}
              onChange={(e) => {
                setVerificationFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs focus:border-indigo-500 focus:outline-hidden"
            >
              <option value="All">All Verification</option>
              <option value="Verified">Verified</option>
              <option value="Pending">Pending</option>
            </select>
          </div>

          {(search || roleFilter !== 'All' || statusFilter !== 'All' || orgFilter !== 'All' || verificationFilter !== 'All') && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-1 rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-200"
            >
              <X className="h-3.5 w-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* 5. User Data Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="space-y-3 p-6 animate-pulse">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 w-full rounded-xl bg-slate-100" />
            ))}
          </div>
        ) : errorMessage ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <XCircle className="h-10 w-10 text-rose-500" />
            <p className="mt-2 font-bold text-rose-900">{errorMessage}</p>
            <button onClick={() => fetchUsers(false)} className="mt-4 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-rose-700">
              Retry
            </button>
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center text-slate-500">
            <Users className="h-10 w-10 text-slate-300" />
            <p className="mt-2 font-bold text-slate-800">No user accounts found</p>
            <p className="text-xs text-slate-400">No system accounts match your search or filter options.</p>
            <button onClick={resetFilters} className="mt-4 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-700">
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">User Account</th>
                  <th className="py-3.5 px-4">Employee ID</th>
                  <th className="py-3.5 px-4">System Role</th>
                  <th className="py-3.5 px-4">Organization</th>
                  <th className="py-3.5 px-4">Verification</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Last Activity</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* User Details */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 font-bold text-white shadow-2xs">
                          {user.avatar ? (
                            <img src={user.avatar} alt={user.name} className="h-9 w-9 rounded-full object-cover" />
                          ) : (
                            user.name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 truncate">{user.name}</p>
                          <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Employee ID */}
                    <td className="py-3 px-4 font-mono text-[11px] text-indigo-600 font-bold">
                      <span className="bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                        {user.employeeId}
                      </span>
                    </td>

                    {/* System Role */}
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          user.role === 'SUPER_ADMIN'
                            ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                            : user.role === 'ADMIN'
                            ? 'bg-purple-100 text-purple-800 border border-purple-200'
                            : user.role === 'HR'
                            ? 'bg-blue-100 text-blue-800 border border-blue-200'
                            : user.role === 'MANAGER'
                            ? 'bg-teal-100 text-teal-800 border border-teal-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        <ShieldCheck className="h-3 w-3" />
                        {formatRoleLabel(user.role)}
                      </span>
                    </td>

                    {/* Organization */}
                    <td className="py-3 px-4 text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5 text-slate-400" />
                        <span className="font-bold text-slate-800">{user.organizationName}</span>
                        <span className="text-[10px] text-slate-400">({user.organizationCode})</span>
                      </div>
                    </td>

                    {/* Verification */}
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          user.emailVerified
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {user.emailVerified ? <CheckCircle2 className="h-3 w-3" /> : <Mail className="h-3 w-3" />}
                        {user.emailVerificationStatus}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          user.status === 'Active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : user.status === 'Locked'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {user.status === 'Active' ? (
                          <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                        ) : user.status === 'Locked' ? (
                          <Lock className="h-3 w-3 text-rose-600" />
                        ) : (
                          <XCircle className="h-3 w-3 text-slate-500" />
                        )}
                        {user.status}
                      </span>
                    </td>

                    {/* Last Activity */}
                    <td className="py-3 px-4 text-slate-500 text-[11px]">
                      {user.lastLogin !== 'Never' ? user.lastLogin : 'Never'}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenDetails(user)}
                          title="View Details"
                          className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setModalError(null);
                            setModalSuccess(null);
                            setEditingRoleUser(user);
                            setNewRole(user.role);
                          }}
                          title="Edit Role"
                          className="rounded-lg border border-indigo-200 bg-indigo-50 p-1.5 text-indigo-700 hover:bg-indigo-100"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setModalError(null);
                            setModalSuccess(null);
                            setEditingStatusUser(user);
                            setNewStatus(user.status);
                          }}
                          title="Account Status"
                          className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 hover:bg-slate-50"
                        >
                          <SlidersHorizontal className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenSessions(user)}
                          title="Active Sessions"
                          className="rounded-lg border border-purple-200 bg-purple-50 p-1.5 text-purple-700 hover:bg-purple-100"
                        >
                          <Globe className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-4 py-3 text-xs">
            <span className="text-slate-500">
              Showing <strong className="text-slate-900">{users.length}</strong> of <strong className="text-slate-900">{totalFilteredUsers}</strong> accounts
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Previous
              </button>
              <span className="font-semibold text-slate-700">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Next
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODALS SECTION */}
      {/* ========================================================================= */}

      {/* 1. View User Account Details Modal */}
      {viewingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-indigo-600" />
                <h3 className="text-sm font-extrabold text-slate-900">User Account & Security Profile</h3>
              </div>
              <button onClick={() => setViewingUser(null)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            {isDetailsLoading ? (
              <div className="py-8 text-center text-xs text-slate-500 animate-pulse">Fetching security profile...</div>
            ) : (
              <div className="space-y-4 text-xs">
                <div className="flex items-center gap-3.5 pb-3 border-b border-slate-100">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-bold text-base shadow-sm">
                    {viewingUserFullDetails?.avatar ? (
                      <img src={viewingUserFullDetails.avatar} alt={viewingUser.name} className="h-12 w-12 rounded-full object-cover" />
                    ) : (
                      viewingUser.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-sm">{viewingUserFullDetails?.name || viewingUser.name}</h4>
                    <p className="text-slate-500">{viewingUserFullDetails?.email || viewingUser.email}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="font-mono text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">
                        {viewingUserFullDetails?.employeeId || viewingUser.employeeId}
                      </span>
                      <span className="font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
                        {formatRoleLabel(viewingUserFullDetails?.role || viewingUser.role)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">Assigned Organization</span>
                    <span className="font-bold text-slate-800">
                      {viewingUserFullDetails?.organizationName || viewingUser.organizationName}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">Account Status</span>
                    <span
                      className={`font-bold ${
                        (viewingUserFullDetails?.status || viewingUser.status) === 'Active' ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {viewingUserFullDetails?.status || viewingUser.status}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">Email Verification</span>
                    <span className="font-bold text-slate-800">
                      {viewingUserFullDetails?.emailVerificationStatus || viewingUser.emailVerificationStatus}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">2FA Security Status</span>
                    <span className="font-bold text-slate-800">
                      {viewingUserFullDetails?.isTwoFactorEnabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">Account Created</span>
                    <span className="font-bold text-slate-800">{viewingUserFullDetails?.createdAt || viewingUser.createdAt}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">Active Session Tokens</span>
                    <span className="font-bold text-indigo-600">
                      {viewingUserFullDetails?.activeSessionsCount || viewingUser.activeSessionsCount} Live Token(s)
                    </span>
                  </div>
                </div>

                {!viewingUser.emailVerified && (
                  <div className="flex items-center justify-between rounded-xl bg-amber-50 p-3 border border-amber-200">
                    <span className="text-[11px] font-semibold text-amber-800">Email is pending verification.</span>
                    <button
                      onClick={() => handleResendVerification(viewingUser)}
                      className="rounded-lg bg-amber-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-amber-700"
                    >
                      Resend Link
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setViewingUser(null)}
                className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Edit Role Modal */}
      {editingRoleUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-indigo-600" />
                <h3 className="text-sm font-extrabold text-slate-900">Change User System Role</h3>
              </div>
              <button onClick={() => setEditingRoleUser(null)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="rounded-xl bg-slate-50 p-3 border border-slate-200 text-xs space-y-1">
              <p className="font-bold text-slate-900">{editingRoleUser.name}</p>
              <p className="text-slate-500">{editingRoleUser.email}</p>
              <p className="text-[11px] text-slate-600">
                Current Role: <strong className="text-indigo-700">{formatRoleLabel(editingRoleUser.role)}</strong> &bull; Org:{' '}
                {editingRoleUser.organizationName}
              </p>
            </div>

            {modalError && (
              <div className="rounded-xl bg-rose-50 p-3 text-xs font-semibold text-rose-700 border border-rose-200">
                {modalError}
              </div>
            )}

            {modalSuccess && (
              <div className="rounded-xl bg-emerald-50 p-3 text-xs font-semibold text-emerald-700 border border-emerald-200">
                {modalSuccess}
              </div>
            )}

            <div className="space-y-3 text-xs font-medium">
              <div>
                <label className="block mb-1 font-bold text-slate-700">Select New Role *</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white p-2.5 font-semibold text-slate-800 focus:border-indigo-500 focus:outline-hidden"
                >
                  <option value="SUPER_ADMIN">SUPER_ADMIN (Platform Super Administrator)</option>
                  <option value="ADMIN">ADMIN (Organization Administrator)</option>
                  <option value="HR">HR Administrator</option>
                  <option value="MANAGER">Manager</option>
                  <option value="EMPLOYEE">Employee</option>
                </select>
              </div>

              {/* High Risk Warning when escalating to SUPER_ADMIN */}
              {newRole === 'SUPER_ADMIN' && editingRoleUser.role !== 'SUPER_ADMIN' && (
                <div className="rounded-xl bg-rose-50 p-3 border border-rose-200 flex items-start gap-2 text-xs text-rose-800">
                  <ShieldAlert className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-bold">High-Risk Permission Warning</strong>
                    Granting Super Admin access provides system-wide administrative permissions across all tenant organizations.
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setEditingRoleUser(null)}
                className="rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveRole}
                disabled={modalSubmitting || newRole === editingRoleUser.role}
                className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
              >
                {modalSubmitting ? 'Saving...' : 'Confirm Role Update'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Change Account Status Modal */}
      {editingStatusUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-5 w-5 text-indigo-600" />
                <h3 className="text-sm font-extrabold text-slate-900">Change Account Access Status</h3>
              </div>
              <button onClick={() => setEditingStatusUser(null)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="rounded-xl bg-slate-50 p-3 border border-slate-200 text-xs space-y-1">
              <p className="font-bold text-slate-900">{editingStatusUser.name}</p>
              <p className="text-slate-500">{editingStatusUser.email}</p>
              <p className="text-[11px] text-slate-600">
                Current Status: <strong className="text-slate-800">{editingStatusUser.status}</strong>
              </p>
            </div>

            {modalError && (
              <div className="rounded-xl bg-rose-50 p-3 text-xs font-semibold text-rose-700 border border-rose-200">
                {modalError}
              </div>
            )}

            {modalSuccess && (
              <div className="rounded-xl bg-emerald-50 p-3 text-xs font-semibold text-emerald-700 border border-emerald-200">
                {modalSuccess}
              </div>
            )}

            <div className="space-y-3 text-xs font-medium">
              <div>
                <label className="block mb-1 font-bold text-slate-700">Account Status *</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white p-2.5 font-semibold text-slate-800 focus:border-indigo-500 focus:outline-hidden"
                >
                  <option value="Active">Active (Normal Access)</option>
                  <option value="Inactive">Inactive (Disabled)</option>
                  <option value="Locked">Locked (Suspended / Security Hold)</option>
                </select>
              </div>

              {newStatus !== 'Active' && (
                <p className="text-[11px] text-amber-700 font-medium bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                  Changing status to {newStatus} will prevent the user from logging in or using system services.
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setEditingStatusUser(null)}
                className="rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveStatus}
                disabled={modalSubmitting || newStatus === editingStatusUser.status}
                className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
              >
                {modalSubmitting ? 'Updating...' : 'Update Status'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Active Sessions Modal */}
      {sessionUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-purple-600" />
                <h3 className="text-sm font-extrabold text-slate-900">
                  Active Sessions: {sessionUser.name}
                </h3>
              </div>
              <button onClick={() => setSessionUser(null)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            {modalError && (
              <div className="rounded-xl bg-rose-50 p-3 text-xs font-semibold text-rose-700 border border-rose-200">
                {modalError}
              </div>
            )}

            {modalSuccess && (
              <div className="rounded-xl bg-emerald-50 p-3 text-xs font-semibold text-emerald-700 border border-emerald-200">
                {modalSuccess}
              </div>
            )}

            {isSessionsLoading ? (
              <div className="py-8 text-center text-xs text-slate-500 animate-pulse">Loading active sessions...</div>
            ) : sessionsList.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500">No active token sessions found for this user.</div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {sessionsList.map((s) => (
                  <div key={s.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs">
                    <div>
                      <p className="font-bold text-slate-900">{s.userAgent}</p>
                      <p className="text-[10px] text-slate-500">IP: {s.ipAddress} &bull; Created: {new Date(s.createdAt).toLocaleString()}</p>
                    </div>

                    <button
                      onClick={() => handleRevokeSession(s.id, false)}
                      disabled={modalSubmitting}
                      className="rounded-lg bg-rose-50 border border-rose-200 px-2.5 py-1 text-[11px] font-bold text-rose-700 hover:bg-rose-100"
                    >
                      Revoke
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              {sessionsList.length > 0 ? (
                <button
                  onClick={() => handleRevokeSession(undefined, true)}
                  disabled={modalSubmitting}
                  className="rounded-xl bg-rose-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-rose-700 disabled:opacity-50"
                >
                  Revoke All Sessions
                </button>
              ) : <div />}

              <button
                onClick={() => setSessionUser(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </SuperAdminLayout>
  );
}
