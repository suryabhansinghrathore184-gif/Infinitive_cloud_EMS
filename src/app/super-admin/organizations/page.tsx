'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { SuperAdminLayout } from '@/components/layout/SuperAdminLayout';
import { formatRoleLabel } from '@/lib/roleUtils';
import {
  Building2,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Eye,
  Edit,
  CheckCircle2,
  AlertCircle,
  X,
  Users,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  Globe,
  Mail,
  Phone,
  MapPin,
  ShieldAlert,
  AlertTriangle,
  RotateCcw,
  Check,
  Layers,
  Calendar,
} from 'lucide-react';

interface OrganizationRecord {
  id: string;
  organizationId: string;
  name: string;
  legalName: string;
  code: string;
  industry: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  country: string;
  timezone: string;
  currency: string;
  status: string;
  employeeCount: number;
  userCount: number;
  createdAt: string;
  updatedAt: string;
}

interface OrganizationDetailsData {
  id: string;
  organizationId: string;
  name: string;
  status: string;
  details: {
    name?: string;
    legalName?: string;
    code?: string;
    industry?: string;
    email?: string;
    phone?: string;
    city?: string;
    state?: string;
    country?: string;
    timezone?: string;
    currency?: string;
  };
  employeeCount: number;
  activeEmployeeCount: number;
  inactiveEmployeeCount: number;
  userCount: number;
  departments: any[];
  locations: any[];
  createdAt: string;
  updatedAt: string;
}

interface SummaryKpis {
  totalOrganizations: number;
  activeOrganizations: number;
  inactiveOrganizations: number;
  totalWorkforce: number;
  totalSystemUsers: number;
}

export default function SuperAdminOrganizationsPage() {
  const [organizations, setOrganizations] = useState<OrganizationRecord[]>([]);
  const [kpis, setKpis] = useState<SummaryKpis>({
    totalOrganizations: 0,
    activeOrganizations: 0,
    inactiveOrganizations: 0,
    totalWorkforce: 0,
    totalSystemUsers: 0,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Search & Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [industryFilter, setIndustryFilter] = useState('All');
  const [locationFilter, setLocationFilter] = useState('All');

  // Toasts
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<OrganizationRecord | null>(null);
  const [orgDetails, setOrgDetails] = useState<OrganizationDetailsData | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Status Change Confirmation Modal State
  const [statusConfirmOrg, setStatusConfirmOrg] = useState<OrganizationRecord | null>(null);
  const [isStatusConfirmModalOpen, setIsStatusConfirmModalOpen] = useState(false);

  // New Organization Form State
  const [formData, setFormData] = useState({
    name: '',
    legalName: '',
    code: '',
    industry: 'Software & Technology',
    email: '',
    phone: '',
    city: 'Mumbai',
    state: 'Maharashtra',
    country: 'India',
    timezone: 'Asia/Kolkata (IST +05:30)',
    currency: 'INR (₹)',
  });

  // Edit Organization Form State
  const [editFormData, setEditFormData] = useState({
    name: '',
    legalName: '',
    industry: '',
    email: '',
    phone: '',
    city: '',
    state: '',
    country: '',
    timezone: '',
    currency: '',
  });

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchOrganizations = useCallback(async () => {
    setIsRefreshing(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams({
        page: String(page),
        limit: '10',
      });
      if (searchTerm.trim()) queryParams.set('search', searchTerm.trim());
      if (statusFilter !== 'All') queryParams.set('status', statusFilter);
      if (industryFilter !== 'All') queryParams.set('industry', industryFilter);
      if (locationFilter !== 'All') queryParams.set('location', locationFilter);

      const res = await fetch(`/api/v1/super-admin/organizations?${queryParams.toString()}`);
      if (res.ok) {
        const result = await res.json();
        if (result.success && result.data) {
          setOrganizations(result.data.organizations || []);
          if (result.data.summaryKpis) {
            setKpis(result.data.summaryKpis);
          }
          setTotalPages(result.data.pagination?.totalPages || 1);
          setTotalCount(result.data.pagination?.total || 0);
        } else {
          throw new Error(result.message || 'Failed to parse response');
        }
      } else {
        throw new Error(`Server returned HTTP ${res.status}`);
      }
    } catch (err: any) {
      console.error('Error fetching organizations:', err);
      setError(err.message || 'Unable to load organization records');
      showToast('Failed to load organization directory.', 'error');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [page, searchTerm, statusFilter, industryFilter, locationFilter]);

  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);

  // Handle Add Organization Submit
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast('Organization name is required.', 'error');
      return;
    }
    if (!formData.code.trim()) {
      showToast('Organization code is required.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/v1/super-admin/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message || `Organization "${formData.name}" created successfully!`);
        setIsAddModalOpen(false);
        setFormData({
          name: '',
          legalName: '',
          code: '',
          industry: 'Software & Technology',
          email: '',
          phone: '',
          city: 'Mumbai',
          state: 'Maharashtra',
          country: 'India',
          timezone: 'Asia/Kolkata (IST +05:30)',
          currency: 'INR (₹)',
        });
        fetchOrganizations();
      } else {
        showToast(data.message || 'Failed to create organization.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error creating organization.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (org: OrganizationRecord) => {
    setSelectedOrg(org);
    setEditFormData({
      name: org.name || '',
      legalName: org.legalName || org.name || '',
      industry: org.industry || '',
      email: org.email || '',
      phone: org.phone || '',
      city: org.city || '',
      state: org.state || '',
      country: org.country || '',
      timezone: org.timezone || '',
      currency: org.currency || '',
    });
    setIsEditModalOpen(true);
  };

  // Handle Edit Submit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrg) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/v1/super-admin/organizations/${selectedOrg.organizationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`Organization "${selectedOrg.name}" updated successfully!`);
        setIsEditModalOpen(false);
        fetchOrganizations();
      } else {
        showToast(data.message || 'Failed to update organization.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error updating organization.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open View Details Drawer/Modal
  const handleOpenViewDetails = async (org: OrganizationRecord) => {
    setSelectedOrg(org);
    setIsDetailModalOpen(true);
    setIsLoadingDetails(true);
    try {
      const res = await fetch(`/api/v1/super-admin/organizations/${org.organizationId}`);
      if (res.ok) {
        const result = await res.json();
        if (result.success && result.data) {
          setOrgDetails(result.data);
        }
      }
    } catch (err) {
      console.error('Error fetching org details:', err);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  // Prompt Status Change Confirmation
  const promptStatusChange = (org: OrganizationRecord) => {
    setStatusConfirmOrg(org);
    setIsStatusConfirmModalOpen(true);
  };

  // Confirm Status Change
  const handleConfirmStatusChange = async () => {
    if (!statusConfirmOrg) return;
    const nextStatus = statusConfirmOrg.status === 'Active' ? 'Inactive' : 'Active';

    try {
      const res = await fetch(`/api/v1/super-admin/organizations/${statusConfirmOrg.organizationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`Organization "${statusConfirmOrg.name}" status updated to ${nextStatus}.`);
        fetchOrganizations();
      } else {
        showToast(data.message || 'Failed to update organization status.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error updating organization status.', 'error');
    } finally {
      setIsStatusConfirmModalOpen(false);
      setStatusConfirmOrg(null);
    }
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('All');
    setIndustryFilter('All');
    setLocationFilter('All');
    setPage(1);
  };

  return (
    <SuperAdminLayout
      pageTitle="Organization Management"
      breadcrumbs={[{ label: 'Organization Management', href: '/super-admin/organizations' }]}
    >
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div
          className={`fixed right-6 top-20 z-50 flex items-center gap-2 rounded-xl px-4 py-3 text-xs text-white shadow-2xl animate-fade-in border ${
            toastType === 'success' ? 'bg-slate-900 border-emerald-500/40' : 'bg-rose-950 border-rose-500/40'
          }`}
        >
          {toastType === 'success' ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
          )}
          <span className="font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* 1. PAGE HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-slate-900 sm:text-2xl tracking-tight">Organization Management</h2>
            <span className="rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 font-semibold px-2.5 py-0.5 text-xs">
              Super Admin
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Create, manage, and monitor organizations across the EMS/HRMS platform.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchOrganizations}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 disabled:opacity-50 transition-colors cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-slate-500 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700 transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>+ Add Organization</span>
          </button>
        </div>
      </div>

      {/* ERROR STATE BANNER */}
      {error && (
        <div className="flex items-center justify-between rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-800 shadow-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
            <span>Unable to load organizations: {error}</span>
          </div>
          <button
            onClick={fetchOrganizations}
            className="rounded-lg bg-rose-600 px-3 py-1 font-bold text-white hover:bg-rose-700 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* 2. ORGANIZATION SUMMARY KPI CARDS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Orgs</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
              <Building2 className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-extrabold text-slate-900">{kpis.totalOrganizations}</p>
          <p className="text-[10px] font-semibold text-slate-500 mt-1">Multi-Tenant Baseline</p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Active Orgs</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-extrabold text-slate-900">{kpis.activeOrganizations}</p>
          <span className="inline-block mt-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
            Operational
          </span>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Inactive Orgs</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-500 border border-slate-200">
              <ShieldAlert className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-extrabold text-slate-900">{kpis.inactiveOrganizations}</p>
          <span className="inline-block mt-1 text-[10px] font-semibold text-slate-500">
            Deactivated/Suspended
          </span>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Workforce</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <UserCheck className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-extrabold text-slate-900">{kpis.totalWorkforce}</p>
          <p className="text-[10px] font-semibold text-slate-500 mt-1">Staff Across Tenants</p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">System Users</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-50 text-purple-600 border border-purple-100">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-extrabold text-slate-900">{kpis.totalSystemUsers}</p>
          <p className="text-[10px] font-semibold text-slate-500 mt-1">Authenticated Accounts</p>
        </div>
      </div>

      {/* 3. SEARCH & FILTER TOOLBAR */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs lg:flex-row lg:items-center lg:justify-between text-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search organizations by name, code, industry..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-3 py-2 font-medium text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-hidden"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 font-semibold text-slate-600 shadow-2xs">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <span>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="bg-transparent font-bold text-slate-800 focus:outline-hidden"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 font-semibold text-slate-600 shadow-2xs">
            <span>Industry:</span>
            <select
              value={industryFilter}
              onChange={(e) => {
                setIndustryFilter(e.target.value);
                setPage(1);
              }}
              className="bg-transparent font-bold text-slate-800 focus:outline-hidden"
            >
              <option value="All">All Industries</option>
              <option value="Software & Technology">Software & Technology</option>
              <option value="Healthcare">Healthcare & Life Sciences</option>
              <option value="Finance">Finance & Banking</option>
              <option value="Manufacturing">Manufacturing & Logistics</option>
              <option value="Services">Services & Consulting</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 font-semibold text-slate-600 shadow-2xs">
            <span>Location:</span>
            <select
              value={locationFilter}
              onChange={(e) => {
                setLocationFilter(e.target.value);
                setPage(1);
              }}
              className="bg-transparent font-bold text-slate-800 focus:outline-hidden"
            >
              <option value="All">All Locations</option>
              <option value="India">India</option>
              <option value="United States">United States</option>
              <option value="United Kingdom">United Kingdom</option>
              <option value="Singapore">Singapore</option>
            </select>
          </div>

          <button
            onClick={handleResetFilters}
            className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-bold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5 text-slate-500" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* 4. ORGANIZATION TABLE FEED */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 p-4">
          <h3 className="text-sm font-extrabold text-slate-900">
            Registered Enterprise Organizations ({totalCount})
          </h3>
        </div>

        {isLoading ? (
          <div className="space-y-3 p-6 animate-pulse">
            {Array.from({ length: 5 }).map((_, idx) => (
              <div key={idx} className="h-12 w-full rounded-xl bg-slate-100" />
            ))}
          </div>
        ) : organizations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <Building2 className="h-6 w-6" />
            </div>
            <h4 className="mt-3 text-sm font-bold text-slate-800">
              {searchTerm || statusFilter !== 'All' || industryFilter !== 'All' || locationFilter !== 'All'
                ? 'No organizations match your search.'
                : 'No organizations found'}
            </h4>
            <p className="mt-1 max-w-xs text-xs text-slate-500 font-medium">
              {searchTerm || statusFilter !== 'All' || industryFilter !== 'All' || locationFilter !== 'All'
                ? 'Try modifying your search filter keywords or clearing filters.'
                : 'Click "+ Add Organization" above to provision a new tenant.'}
            </p>
            <button
              onClick={handleResetFilters}
              className="mt-3 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-2xs"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200/80 bg-slate-50 text-[11px] font-bold uppercase text-slate-500 tracking-wider">
                    <th className="px-4 py-3.5">Organization</th>
                    <th className="px-4 py-3.5">Code & Industry</th>
                    <th className="px-4 py-3.5">Location</th>
                    <th className="px-4 py-3.5">Workforce</th>
                    <th className="px-4 py-3.5">Users</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-4 py-3.5">Created Date</th>
                    <th className="px-4 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {organizations.map((org) => (
                    <tr key={org.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 font-extrabold text-indigo-600 border border-indigo-100 shrink-0">
                            {org.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{org.name}</p>
                            <p className="text-[10px] text-slate-500 font-medium">{org.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="font-extrabold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded text-[11px]">
                          {org.code}
                        </span>
                        <p className="text-[10px] text-slate-500 mt-0.5 font-medium">{org.industry}</p>
                      </td>

                      <td className="px-4 py-3.5 text-slate-700">
                        <p className="font-bold">{org.city}, {org.country}</p>
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="font-extrabold text-emerald-600">{org.employeeCount}</span>{' '}
                        <span className="text-[10px] text-slate-500 font-medium">Employees</span>
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="font-extrabold text-blue-600">{org.userCount}</span>{' '}
                        <span className="text-[10px] text-slate-500 font-medium">Accounts</span>
                      </td>

                      <td className="px-4 py-3.5">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold border ${
                            org.status === 'Active'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {org.status}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-slate-500 font-mono text-[11px]">{org.createdAt}</td>

                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenViewDetails(org)}
                            className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
                            title="View Organization Details"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>

                          <button
                            onClick={() => handleOpenEdit(org)}
                            className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
                            title="Edit Organization"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>

                          <button
                            onClick={() => promptStatusChange(org)}
                            className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-colors cursor-pointer ${
                              org.status === 'Active'
                                ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                            }`}
                          >
                            {org.status === 'Active' ? 'Deactivate' : 'Activate'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-xs">
              <p className="text-slate-500">
                Showing <span className="font-bold text-slate-800">{organizations.length}</span> of{' '}
                <span className="font-bold text-slate-800">{totalCount}</span> organizations
              </p>
              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1 font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors cursor-pointer"
                >
                  <ChevronLeft className="h-3.5 w-3.5" /> Previous
                </button>
                <span className="text-slate-700 font-bold">
                  Page {page} of {totalPages}
                </span>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1 font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors cursor-pointer"
                >
                  Next <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* 6. ADD ORGANIZATION MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl text-xs text-slate-800 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between border-b pb-3 font-bold text-sm text-slate-900">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-indigo-600" />
                <span>Provision New Enterprise Tenant</span>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="rounded-lg p-1 text-slate-400 hover:text-slate-700">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3 font-medium">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 font-bold text-slate-900">Company Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Acme Enterprise Global"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 focus:border-indigo-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block mb-1 font-bold text-slate-900">Legal Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Acme Enterprise Pvt Ltd"
                    value={formData.legalName}
                    onChange={(e) => setFormData({ ...formData, legalName: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 focus:border-indigo-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 font-bold text-slate-900">Organization Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ACME"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 focus:border-indigo-500 focus:bg-white uppercase font-bold"
                  />
                </div>

                <div>
                  <label className="block mb-1 font-bold text-slate-900">Industry Segment</label>
                  <select
                    value={formData.industry}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 focus:border-indigo-500 focus:bg-white"
                  >
                    <option value="Software & Technology">Software & Technology</option>
                    <option value="Healthcare & Life Sciences">Healthcare & Life Sciences</option>
                    <option value="Finance & Banking">Finance & Banking</option>
                    <option value="Manufacturing & Logistics">Manufacturing & Logistics</option>
                    <option value="Services & Consulting">Services & Consulting</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 font-bold text-slate-900">Contact Email</label>
                  <input
                    type="email"
                    placeholder="admin@acme.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 focus:border-indigo-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block mb-1 font-bold text-slate-900">Contact Phone</label>
                  <input
                    type="text"
                    placeholder="+91 22 1000 2000"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 focus:border-indigo-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block mb-1 font-bold text-slate-900">City</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 focus:border-indigo-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block mb-1 font-bold text-slate-900">State</label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 focus:border-indigo-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block mb-1 font-bold text-slate-900">Country</label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 focus:border-indigo-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t pt-3 mt-4">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 font-bold text-white shadow-md hover:bg-indigo-700 disabled:opacity-50 transition-colors cursor-pointer"
                >
                  {isSubmitting ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                  <span>Provision Tenant</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. EDIT ORGANIZATION MODAL */}
      {isEditModalOpen && selectedOrg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl text-xs text-slate-800 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between border-b pb-3 font-bold text-sm text-slate-900">
              <div className="flex items-center gap-2">
                <Edit className="h-4 w-4 text-indigo-600" />
                <span>Edit Organization Parameters</span>
              </div>
              <button onClick={() => setIsEditModalOpen(false)} className="rounded-lg p-1 text-slate-400 hover:text-slate-700">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-3 font-medium">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 font-bold text-slate-900">Company Name</label>
                  <input
                    type="text"
                    required
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 focus:border-indigo-500 focus:bg-white font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block mb-1 font-bold text-slate-900">Legal Name</label>
                  <input
                    type="text"
                    value={editFormData.legalName}
                    onChange={(e) => setEditFormData({ ...editFormData, legalName: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 focus:border-indigo-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 font-bold text-slate-900">Industry</label>
                  <input
                    type="text"
                    value={editFormData.industry}
                    onChange={(e) => setEditFormData({ ...editFormData, industry: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 focus:border-indigo-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block mb-1 font-bold text-slate-900">Contact Email</label>
                  <input
                    type="email"
                    value={editFormData.email}
                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 focus:border-indigo-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block mb-1 font-bold text-slate-900">City</label>
                  <input
                    type="text"
                    value={editFormData.city}
                    onChange={(e) => setEditFormData({ ...editFormData, city: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 focus:border-indigo-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block mb-1 font-bold text-slate-900">State</label>
                  <input
                    type="text"
                    value={editFormData.state}
                    onChange={(e) => setEditFormData({ ...editFormData, state: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 focus:border-indigo-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block mb-1 font-bold text-slate-900">Country</label>
                  <input
                    type="text"
                    value={editFormData.country}
                    onChange={(e) => setEditFormData({ ...editFormData, country: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 focus:border-indigo-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t pt-3 mt-4">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 font-bold text-white shadow-md hover:bg-indigo-700 disabled:opacity-50 transition-colors cursor-pointer"
                >
                  {isSubmitting ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. ORGANIZATION DETAILS VIEW MODAL */}
      {isDetailModalOpen && selectedOrg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl text-xs text-slate-800 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 font-extrabold text-indigo-600 text-sm border border-indigo-100 shrink-0">
                  {selectedOrg.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">{selectedOrg.name}</h3>
                  <p className="text-[10px] text-slate-400 font-mono">ID: {selectedOrg.organizationId}</p>
                </div>
              </div>
              <button onClick={() => setIsDetailModalOpen(false)} className="rounded-lg p-1 text-slate-400 hover:text-slate-700">
                <X className="h-4 w-4" />
              </button>
            </div>

            {isLoadingDetails ? (
              <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                <RefreshCw className="h-6 w-6 animate-spin text-indigo-600" />
                <p className="mt-2 text-xs font-medium text-slate-600">Loading tenant details...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Organization Overview Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Code</span>
                    <p className="font-extrabold text-indigo-600 mt-0.5 text-sm font-mono">{selectedOrg.code}</p>
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Status</span>
                    <p className="font-extrabold text-emerald-600 mt-0.5">{selectedOrg.status}</p>
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Workforce</span>
                    <p className="font-extrabold text-slate-900 mt-0.5">
                      {orgDetails?.employeeCount ?? selectedOrg.employeeCount} Employees
                    </p>
                    {orgDetails && (
                      <p className="text-[10px] text-emerald-600 font-semibold">
                        {orgDetails.activeEmployeeCount} Active / {orgDetails.inactiveEmployeeCount} Inactive
                      </p>
                    )}
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Users</span>
                    <p className="font-extrabold text-slate-900 mt-0.5">
                      {orgDetails?.userCount ?? selectedOrg.userCount} Accounts
                    </p>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="rounded-xl bg-slate-50 p-4 space-y-2 border border-slate-200">
                  <h4 className="font-bold text-slate-900 text-xs mb-1">Contact & Regional Info</h4>
                  <p className="flex items-center gap-2"><Globe className="h-3.5 w-3.5 text-slate-400" /> <span className="font-bold text-slate-700">Industry:</span> {selectedOrg.industry}</p>
                  <p className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-slate-400" /> <span className="font-bold text-slate-700">Email:</span> {selectedOrg.email || 'N/A'}</p>
                  <p className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-slate-400" /> <span className="font-bold text-slate-700">Phone:</span> {selectedOrg.phone || 'N/A'}</p>
                  <p className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 text-slate-400" /> <span className="font-bold text-slate-700">Location:</span> {selectedOrg.city}, {selectedOrg.state}, {selectedOrg.country}</p>
                  <p className="flex items-center gap-2"><Calendar className="h-3.5 w-3.5 text-slate-400" /> <span className="font-bold text-slate-700">Provisioned Date:</span> {selectedOrg.createdAt}</p>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 border-t pt-3">
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 font-semibold text-slate-600 hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 9. STATUS DEACTIVATION / ACTIVATION CONFIRMATION MODAL */}
      {isStatusConfirmModalOpen && statusConfirmOrg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600 border-b pb-3">
              <AlertTriangle className="h-6 w-6 shrink-0 text-rose-600" />
              <h3 className="text-base font-extrabold text-slate-900">
                {statusConfirmOrg.status === 'Active' ? 'Deactivate Organization?' : 'Activate Organization?'}
              </h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              {statusConfirmOrg.status === 'Active'
                ? `Deactivating organization "${statusConfirmOrg.name}" will temporarily disable user and employee access belonging to this tenant according to organization status rules.`
                : `Activating organization "${statusConfirmOrg.name}" will restore active governance and access for all users belonging to this tenant.`}
            </p>

            <div className="flex items-center justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => {
                  setIsStatusConfirmModalOpen(false);
                  setStatusConfirmOrg(null);
                }}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmStatusChange}
                className={`rounded-xl px-4 py-2 text-xs font-bold text-white shadow-md transition-colors cursor-pointer ${
                  statusConfirmOrg.status === 'Active' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {statusConfirmOrg.status === 'Active' ? 'Confirm Deactivate' : 'Confirm Activate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </SuperAdminLayout>
  );
}
