'use client';

import React, { useState, useEffect } from 'react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { useAuthStore } from '@/store/authStore';
import { User, Mail, Phone, Building2, ShieldCheck, RefreshCw, Calendar, MapPin, Briefcase } from 'lucide-react';

export default function EmployeeProfilePage() {
  const { user } = useAuthStore();
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/v1/auth/me');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setProfile(data.data || user);
        }
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      setProfile(user);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const activeUser = profile || user;

  return (
    <AuthGuard allowedRoles={['EMPLOYEE', 'SUPER_ADMIN', 'ADMIN', 'HR', 'MANAGER']}>
      <AdminLayout
        allowedRoles={['EMPLOYEE', 'SUPER_ADMIN', 'ADMIN', 'HR', 'MANAGER']}
        pageTitle="My Profile"
        breadcrumbs={[
          { label: 'My Workspace', href: '/employee/dashboard' },
          { label: 'My Profile', href: '/employee/profile' },
        ]}
      >
        <div className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">My Personal & Employment Profile</h1>
              <p className="text-xs text-slate-500 mt-1">
                View your personal information, employment classification, manager assignment, and account security.
              </p>
            </div>
            <button
              onClick={fetchProfile}
              disabled={isLoading}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh Profile</span>
            </button>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row items-center gap-6 border-b border-slate-100 pb-6">
              <div className="relative flex h-24 w-24 shrink-0 items-center justify-center rounded-3xl bg-indigo-600 text-3xl font-extrabold text-white shadow-xl shadow-indigo-600/30 overflow-hidden border-2 border-indigo-100">
                {activeUser?.photoUrl ? (
                  <img src={activeUser.photoUrl} alt={activeUser.name} className="h-full w-full object-cover" />
                ) : (
                  (activeUser?.name || 'E').charAt(0).toUpperCase()
                )}
              </div>
              <div className="text-center sm:text-left space-y-1">
                <h2 className="text-xl font-extrabold text-slate-900">{activeUser?.name || 'Employee'}</h2>
                <p className="text-xs font-semibold text-indigo-600">{activeUser?.designation || 'Staff Member'}</p>
                <div className="mt-2 flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs">
                  <span className="rounded-full bg-slate-100 px-3 py-1 font-mono font-bold text-slate-700">
                    ID: {activeUser?.employeeId || 'N/A'}
                  </span>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 font-bold text-emerald-700 border border-emerald-200">
                    {activeUser?.status || 'Active Employee'}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Employment Information */}
              <div className="space-y-4">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Briefcase className="h-4 w-4 text-indigo-600" />
                  <span>Employment Details</span>
                </h3>
                <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 space-y-3 text-xs font-medium text-slate-700">
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-slate-500">Employee ID:</span>
                    <span className="font-bold text-slate-900 font-mono">{activeUser?.employeeId || '--'}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-slate-500">Department:</span>
                    <span className="font-bold text-slate-900">{activeUser?.department || '--'}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-slate-500">Designation:</span>
                    <span className="font-bold text-slate-900">{activeUser?.designation || '--'}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-slate-500">Manager / Reporting To:</span>
                    <span className="font-bold text-slate-900">{activeUser?.managerName || activeUser?.reportingToName || 'HR Administration'}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-slate-500">System Role:</span>
                    <span className="font-bold text-indigo-600 font-mono">{activeUser?.role || 'EMPLOYEE'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Joining Date:</span>
                    <span className="font-bold text-slate-900">{activeUser?.joiningDate || activeUser?.createdAt ? new Date(activeUser.joiningDate || activeUser.createdAt).toLocaleDateString() : '--'}</span>
                  </div>
                </div>
              </div>

              {/* Personal & Contact Information */}
              <div className="space-y-4">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <User className="h-4 w-4 text-indigo-600" />
                  <span>Personal & Contact Information</span>
                </h3>
                <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 space-y-3 text-xs font-medium text-slate-700">
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-slate-500">Email Address:</span>
                    <span className="font-bold text-slate-900">{activeUser?.email || '--'}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-slate-500">Phone Number:</span>
                    <span className="font-bold text-slate-900">{activeUser?.phone || activeUser?.mobile || '--'}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-slate-500">Date of Birth:</span>
                    <span className="font-bold text-slate-900">{activeUser?.dob || activeUser?.dateOfBirth || '--'}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-slate-500">Residential Address:</span>
                    <span className="font-bold text-slate-900">{activeUser?.address || '--'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Organization ID:</span>
                    <span className="font-bold text-slate-900 font-mono">{activeUser?.organizationId || '--'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AdminLayout>
    </AuthGuard>
  );
}
