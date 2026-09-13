'use client';

import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Building2, ShieldCheck, RefreshCw, Calendar } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">My Profile</h1>
          <p className="text-sm text-slate-500 mt-1">View personal employment details, contact info, and department assignment.</p>
        </div>
        <button
          onClick={fetchProfile}
          className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 transition-all cursor-pointer"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row items-center gap-6 border-b border-slate-100 pb-6">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-indigo-600 text-2xl font-extrabold text-white shadow-lg shadow-indigo-600/30">
            {(activeUser?.name || 'E').charAt(0).toUpperCase()}
          </div>
          <div className="text-center sm:text-left">
            <h2 className="text-xl font-bold text-slate-900">{activeUser?.name || 'Employee'}</h2>
            <p className="text-xs font-semibold text-indigo-600 mt-0.5">{activeUser?.designation || 'Staff Member'}</p>
            <div className="mt-2 flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 font-mono text-[11px] font-bold text-slate-600">
                ID: {activeUser?.employeeId || 'EMP1001'}
              </span>
              <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
                Active Employee
              </span>
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="space-y-4">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Employment Details</h3>
            <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 space-y-3 text-xs">
              <div>
                <span className="text-slate-500 font-medium">Department:</span>
                <p className="font-bold text-slate-800">{activeUser?.department || 'General'}</p>
              </div>
              <div>
                <span className="text-slate-500 font-medium">Designation:</span>
                <p className="font-bold text-slate-800">{activeUser?.designation || 'Staff'}</p>
              </div>
              <div>
                <span className="text-slate-500 font-medium">Role:</span>
                <p className="font-bold text-indigo-600">{activeUser?.role || 'EMPLOYEE'}</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Contact & Account</h3>
            <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 space-y-3 text-xs">
              <div>
                <span className="text-slate-500 font-medium">Email Address:</span>
                <p className="font-bold text-slate-800">{activeUser?.email || 'employee@organization.com'}</p>
              </div>
              <div>
                <span className="text-slate-500 font-medium">Organization:</span>
                <p className="font-bold text-slate-800">{activeUser?.organizationId || 'Default Organization'}</p>
              </div>
              <div>
                <span className="text-slate-500 font-medium">2FA Protection:</span>
                <p className="font-bold text-emerald-600">Enabled</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
