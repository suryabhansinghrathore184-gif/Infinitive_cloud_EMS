'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { SuperAdminLayout } from '@/components/layout/SuperAdminLayout';
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
}

export default function SuperAdminOrganizationsPage() {
  const [organizations, setOrganizations] = useState<OrganizationRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Toasts
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<OrganizationRecord | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchOrganizations = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const queryParams = new URLSearchParams({
        page: String(page),
        limit: '10',
      });
      if (searchTerm) queryParams.set('search', searchTerm);
      if (statusFilter !== 'All') queryParams.set('status', statusFilter);

      const res = await fetch(`/api/v1/super-admin/organizations?${queryParams.toString()}`);
      if (res.ok) {
        const result = await res.json();
        if (result.success && result.data) {
          setOrganizations(result.data.organizations || []);
          setTotalPages(result.data.pagination?.totalPages || 1);
          setTotalCount(result.data.pagination?.total || 0);
        }
      }
    } catch (err) {
      console.error('Error fetching organizations:', err);
      showToast('Failed to load organizations.', 'error');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [page, searchTerm, statusFilter]);

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

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/v1/super-admin/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (data.success) {
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

  // Handle Toggle Status
  const handleToggleStatus = async (org: OrganizationRecord) => {
    const nextStatus = org.status === 'Active' ? 'Inactive' : 'Active';
    if (!confirm(`Are you sure you want to set organization "${org.name}" status to ${nextStatus}?`)) return;

    try {
      const res = await fetch(`/api/v1/super-admin/organizations/${org.organizationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });

      const data = await res.json();
      if (data.success) {
        showToast(`Organization status updated to ${nextStatus}.`);
        fetchOrganizations();
      } else {
        showToast(data.message || 'Failed to update organization status.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error updating organization.', 'error');
    }
  };

  return (
    <SuperAdminLayout
      pageTitle="Organization Management"
      breadcrumbs={[{ label: 'Organizations', href: '/super-admin/organizations' }]}
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed right-6 top-20 z-50 flex items-center gap-2 rounded-xl px-4 py-3 text-xs text-white shadow-2xl animate-fade-in ${
            toastType === 'success' ? 'bg-slate-900 border border-emerald-500/40' : 'bg-rose-950 border border-rose-500/40'
          }`}
        >
          {toastType === 'success' ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          ) : (
            <AlertCircle className="h-4 w-4 text-rose-400" />
          )}
          <span className="font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Header Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Multi-Tenant Organizations</h2>
          <p className="text-xs text-slate-500">
            Provision, inspect, and manage enterprise client organizations and tenant isolations
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchOrganizations}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-xs hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:from-amber-600 hover:to-indigo-700"
          >
            <Plus className="h-4 w-4" />
            <span>+ Add Organization</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Company Name, Code, or Industry..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-xs focus:border-indigo-500 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs">
            <Filter className="h-3.5 w-3.5 text-slate-500" />
            <span className="font-semibold text-slate-600">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="bg-transparent font-bold text-slate-800 focus:outline-none"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Organizations Feed Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 p-4">
          <h3 className="text-sm font-bold text-slate-900">
            Registered System Organizations ({totalCount})
          </h3>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <RefreshCw className="h-8 w-8 animate-spin text-indigo-600" />
            <p className="mt-2 text-xs font-medium text-slate-600">Loading organizations...</p>
          </div>
        ) : organizations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <Building2 className="h-6 w-6" />
            </div>
            <h4 className="mt-3 text-sm font-bold text-slate-800">No organizations found</h4>
            <p className="mt-1 max-w-xs text-xs text-slate-500">
              {searchTerm ? 'No matching organizations for your search.' : 'Click "+ Add Organization" above to register a new tenant.'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-slate-500 font-semibold">
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
                <tbody className="divide-y divide-slate-100">
                  {organizations.map((org) => (
                    <tr key={org.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 font-bold text-indigo-600 border border-indigo-100 shrink-0">
                            {org.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{org.name}</p>
                            <p className="text-[10px] text-slate-400">{org.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="font-extrabold text-indigo-600">{org.code}</span>
                        <p className="text-[10px] text-slate-500">{org.industry}</p>
                      </td>

                      <td className="px-4 py-3.5 text-slate-700">
                        <p className="font-medium">{org.city}, {org.country}</p>
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="font-bold text-emerald-600">{org.employeeCount}</span> <span className="text-[10px] text-slate-400">Employees</span>
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="font-bold text-blue-600">{org.userCount}</span> <span className="text-[10px] text-slate-400">Users</span>
                      </td>

                      <td className="px-4 py-3.5">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold border ${
                            org.status === 'Active'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                        >
                          {org.status}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-slate-500 font-mono text-[11px]">{org.createdAt}</td>

                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedOrg(org);
                              setIsDetailModalOpen(true);
                            }}
                            className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                            title="View Details"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>

                          <button
                            onClick={() => handleToggleStatus(org)}
                            className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${
                              org.status === 'Active'
                                ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
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
                  className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1 font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                >
                  <ChevronLeft className="h-3.5 w-3.5" /> Previous
                </button>
                <span className="text-slate-700 font-bold">
                  Page {page} of {totalPages}
                </span>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1 font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                >
                  Next <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Add Organization Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl text-xs text-slate-800 animate-fade-in">
            <div className="flex items-center justify-between border-b pb-3 font-bold text-sm text-slate-900">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-indigo-600" />
                <span>Provision New System Organization</span>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="rounded-lg p-1 text-slate-400 hover:text-slate-700">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="mt-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-900">Company Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Acme Enterprise Global"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 focus:border-indigo-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-900">Legal Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Acme Enterprise Pvt Ltd"
                    value={formData.legalName}
                    onChange={(e) => setFormData({ ...formData, legalName: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 focus:border-indigo-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-900">Organization Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ACME"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 focus:border-indigo-500 focus:bg-white uppercase font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-900">Industry Segment</label>
                  <input
                    type="text"
                    placeholder="e.g. Technology / Healthcare"
                    value={formData.industry}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 focus:border-indigo-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-900">Contact Email</label>
                  <input
                    type="email"
                    placeholder="admin@acme.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 focus:border-indigo-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-900">Contact Phone</label>
                  <input
                    type="text"
                    placeholder="+91 22 1000 2000"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 focus:border-indigo-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-900">City</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 focus:border-indigo-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-900">State</label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 focus:border-indigo-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-900">Country</label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 focus:border-indigo-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t pt-3 mt-4">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-xl border px-3 py-1.5 font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-xl bg-gradient-to-r from-amber-500 to-indigo-600 px-4 py-1.5 font-bold text-white shadow-xs hover:from-amber-600 hover:to-indigo-700 disabled:opacity-50"
                >
                  {isSubmitting ? 'Provisioning...' : 'Provision Organization'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Organization Details Modal */}
      {isDetailModalOpen && selectedOrg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl text-xs text-slate-800">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">{selectedOrg.name} Details</h3>
                <p className="text-[10px] text-slate-400">Org ID: {selectedOrg.organizationId}</p>
              </div>
              <button onClick={() => setIsDetailModalOpen(false)} className="rounded-lg p-1 text-slate-400 hover:text-slate-700">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Code</span>
                  <p className="font-extrabold text-indigo-600 mt-0.5 text-sm">{selectedOrg.code}</p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Status</span>
                  <p className="font-extrabold text-emerald-600 mt-0.5">{selectedOrg.status}</p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Employees</span>
                  <p className="font-bold text-slate-900 mt-0.5">{selectedOrg.employeeCount} Staff</p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Users</span>
                  <p className="font-bold text-slate-900 mt-0.5">{selectedOrg.userCount} Accounts</p>
                </div>
              </div>

              <div className="rounded-xl bg-slate-50 p-3.5 space-y-1.5 border border-slate-200">
                <p className="flex items-center gap-2"><Globe className="h-3.5 w-3.5 text-slate-400" /> <span className="font-bold">Industry:</span> {selectedOrg.industry}</p>
                <p className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-slate-400" /> <span className="font-bold">Email:</span> {selectedOrg.email || 'N/A'}</p>
                <p className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-slate-400" /> <span className="font-bold">Phone:</span> {selectedOrg.phone || 'N/A'}</p>
                <p className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 text-slate-400" /> <span className="font-bold">Location:</span> {selectedOrg.city}, {selectedOrg.state}, {selectedOrg.country}</p>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t pt-4 mt-4">
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="rounded-xl border px-4 py-1.5 font-semibold text-slate-600 hover:bg-slate-50"
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
