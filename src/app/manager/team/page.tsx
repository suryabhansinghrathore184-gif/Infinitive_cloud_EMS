'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Filter,
  RefreshCw,
  Mail,
  Phone,
  Building2,
  CheckCircle2,
  Clock,
  UserCheck,
  UserX,
  ChevronRight,
  User,
} from 'lucide-react';

interface TeamMember {
  id: string;
  employeeId: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  email: string;
  phone?: string;
  department: string;
  designation: string;
  status: string;
  avatar?: string;
  joiningDate?: string;
}

export default function ManagerTeamPage() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);

  const fetchTeam = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/v1/employees?search=${encodeURIComponent(search)}&department=${encodeURIComponent(departmentFilter)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setTeamMembers(data.data || []);
        }
      }
    } catch (err) {
      console.error('Error fetching team members:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTeam();
  }, [search, departmentFilter]);

  const activeCount = teamMembers.filter((m) => m.status === 'Active' || m.status === 'ACTIVE').length;
  const onLeaveCount = teamMembers.filter((m) => m.status === 'On Leave' || m.status === 'LEAVE').length;
  const departments = Array.from(new Set(teamMembers.map((m) => m.department).filter(Boolean)));

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">My Team Directory</h1>
          <p className="text-sm text-slate-500 mt-1">Manage direct reports, team structure, and contact information.</p>
        </div>
        <button
          onClick={fetchTeam}
          className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 transition-all cursor-pointer"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Team</span>
        </button>
      </div>

      {/* Team KPI Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Direct Reports</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-extrabold text-slate-900">{teamMembers.length}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Active Working</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <UserCheck className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-extrabold text-emerald-600">{activeCount}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">On Leave / Away</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-extrabold text-amber-600">{onLeaveCount}</p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search team member by name, ID, or title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-10 pr-4 text-xs font-medium text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50/50 py-2 px-3 text-xs font-medium text-slate-700 focus:border-indigo-500 focus:outline-hidden"
          >
            <option value="All">All Departments</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Team Member Cards Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <RefreshCw className="h-6 w-6 animate-spin text-indigo-600" />
          <span className="ml-3 text-xs font-semibold text-slate-500">Loading team members...</span>
        </div>
      ) : teamMembers.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <Users className="h-10 w-10 text-slate-300" />
          <p className="mt-3 text-sm font-bold text-slate-800">No Team Members Found</p>
          <p className="mt-1 text-xs text-slate-500">No direct reports matched your current search parameters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {teamMembers.map((member) => {
            const fullName = member.name || `${member.firstName || ''} ${member.lastName || ''}`.trim() || 'Employee';
            return (
              <div
                key={member.id || member.employeeId}
                className="group relative rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-all hover:border-indigo-300 hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-base font-bold text-white shadow-md shadow-indigo-600/20">
                      {fullName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{fullName}</h3>
                      <p className="text-xs font-medium text-indigo-600">{member.designation}</p>
                      <span className="inline-block font-mono text-[10px] text-slate-400">{member.employeeId}</span>
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                      member.status === 'Active' || member.status === 'ACTIVE'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-amber-50 text-amber-700'
                    }`}
                  >
                    {member.status}
                  </span>
                </div>

                <div className="mt-4 space-y-2 border-t border-slate-100 pt-3 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-3.5 w-3.5 text-slate-400" />
                    <span>{member.department}</span>
                  </div>
                  <div className="flex items-center gap-2 truncate">
                    <Mail className="h-3.5 w-3.5 text-slate-400" />
                    <span className="truncate">{member.email}</span>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedMember(member)}
                  className="mt-4 flex w-full items-center justify-center gap-1 rounded-xl bg-slate-50 py-2 text-xs font-bold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors cursor-pointer"
                >
                  <span>View Member Details</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Member Details Modal */}
      {selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 font-bold text-white">
                  {(selectedMember.name || selectedMember.firstName || 'E').charAt(0)}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {selectedMember.name || `${selectedMember.firstName || ''} ${selectedMember.lastName || ''}`}
                  </h3>
                  <p className="text-xs text-slate-500">{selectedMember.employeeId}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedMember(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div>
                <span className="font-bold text-slate-500">Designation:</span>
                <p className="text-slate-800 font-semibold">{selectedMember.designation}</p>
              </div>
              <div>
                <span className="font-bold text-slate-500">Department:</span>
                <p className="text-slate-800 font-semibold">{selectedMember.department}</p>
              </div>
              <div>
                <span className="font-bold text-slate-500">Email Address:</span>
                <p className="text-slate-800 font-semibold">{selectedMember.email}</p>
              </div>
              <div>
                <span className="font-bold text-slate-500">Employment Status:</span>
                <p className="text-emerald-600 font-bold">{selectedMember.status}</p>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedMember(null)}
                className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
