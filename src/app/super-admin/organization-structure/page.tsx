'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { SuperAdminLayout } from '@/components/layout/SuperAdminLayout';
import {
  FolderTree,
  Building2,
  Users,
  Briefcase,
  Search,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  UserCheck,
  Layers,
} from 'lucide-react';

interface EmployeeNode {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  designation: string;
  role: string;
  status: string;
}

interface DesignationNode {
  designation: string;
  count: number;
  employees: EmployeeNode[];
}

interface DepartmentNode {
  department: string;
  count: number;
  designations: DesignationNode[];
}

interface OrganizationTree {
  id: string;
  name: string;
  code: string;
  status: string;
  employeeCount: number;
  departments: DepartmentNode[];
}

export default function OrganizationStructurePage() {
  const [organizations, setOrganizations] = useState<OrganizationTree[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedOrgs, setExpandedOrgs] = useState<Record<string, boolean>>({});
  const [expandedDepts, setExpandedDepts] = useState<Record<string, boolean>>({});
  const [expandedDesigs, setExpandedDesigs] = useState<Record<string, boolean>>({});

  const fetchStructure = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/v1/super-admin/organization-structure');
      if (res.ok) {
        const result = await res.json();
        if (result.success && Array.isArray(result.data)) {
          setOrganizations(result.data);
          // Expand first org by default
          if (result.data.length > 0) {
            setExpandedOrgs({ [result.data[0].id]: true });
          }
        }
      }
    } catch (err) {
      console.error('Error fetching org structure:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStructure();
  }, [fetchStructure]);

  const toggleOrg = (id: string) => {
    setExpandedOrgs((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleDept = (key: string) => {
    setExpandedDepts((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleDesig = (key: string) => {
    setExpandedDesigs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const expandAll = () => {
    const orgsMap: Record<string, boolean> = {};
    const deptsMap: Record<string, boolean> = {};
    const desigsMap: Record<string, boolean> = {};

    organizations.forEach((org) => {
      orgsMap[org.id] = true;
      org.departments.forEach((dept) => {
        const deptKey = `${org.id}-${dept.department}`;
        deptsMap[deptKey] = true;
        dept.designations.forEach((desig) => {
          desigsMap[`${deptKey}-${desig.designation}`] = true;
        });
      });
    });

    setExpandedOrgs(orgsMap);
    setExpandedDepts(deptsMap);
    setExpandedDesigs(desigsMap);
  };

  const collapseAll = () => {
    setExpandedOrgs({});
    setExpandedDepts({});
    setExpandedDesigs({});
  };

  // Filter organizations by search
  const filteredOrgs = organizations.filter((org) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    if (org.name.toLowerCase().includes(term) || org.code.toLowerCase().includes(term)) return true;
    return org.departments.some(
      (dept) =>
        dept.department.toLowerCase().includes(term) ||
        dept.designations.some(
          (desig) =>
            desig.designation.toLowerCase().includes(term) ||
            desig.employees.some(
              (emp) => emp.name.toLowerCase().includes(term) || emp.employeeId.toLowerCase().includes(term)
            )
        )
    );
  });

  return (
    <SuperAdminLayout
      pageTitle="Organization Structure Hierarchy"
      breadcrumbs={[
        { label: 'Executive Dashboard', href: '/super-admin/dashboard' },
        { label: 'Org Hierarchy', href: '/super-admin/organization-structure' },
      ]}
    >
      {/* Header & Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">Multi-Tenant Company Tree</h2>
          <p className="text-xs text-slate-500">
            Interactive multi-level organization hierarchy: Organization &rarr; Departments &rarr; Designations &rarr; Workforce
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={expandAll}
            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50"
          >
            Expand All
          </button>
          <button
            onClick={collapseAll}
            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50"
          >
            Collapse All
          </button>
          <button
            onClick={fetchStructure}
            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-indigo-700"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh Tree</span>
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search by company, department, title, or employee name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 py-2 text-xs font-medium text-slate-800 focus:border-indigo-500 focus:outline-hidden"
        />
      </div>

      {/* Main Hierarchy Tree View */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-12 text-slate-400">
          <RefreshCw className="h-8 w-8 animate-spin text-indigo-600" />
          <p className="mt-3 text-xs font-medium text-slate-600">Building organization tree structure...</p>
        </div>
      ) : filteredOrgs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-slate-500">
          <FolderTree className="h-10 w-10 text-slate-400" />
          <p className="mt-2 font-bold text-slate-800">No matching structure found</p>
          <p className="text-xs text-slate-500">Try adjusting your search query</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrgs.map((org) => {
            const isOrgExpanded = !!expandedOrgs[org.id];

            return (
              <div key={org.id} className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
                {/* Level 1: Organization Header */}
                <div
                  onClick={() => toggleOrg(org.id)}
                  className="flex cursor-pointer items-center justify-between bg-slate-900 px-5 py-4 text-white transition-colors hover:bg-slate-950"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 to-indigo-600 font-bold text-white shadow-md">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-extrabold">{org.name}</h3>
                        <span className="rounded bg-indigo-500/20 px-2 py-0.5 text-[10px] font-bold text-indigo-300 border border-indigo-500/30">
                          {org.code}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${
                            org.status === 'Active' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                          }`}
                        >
                          {org.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        {org.departments.length} Departments &bull; {org.employeeCount} Total Workforce
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-xs text-amber-400 font-semibold bg-slate-800/80 px-3 py-1 rounded-lg border border-slate-700">
                      <UserCheck className="h-3.5 w-3.5" />
                      <span>{org.employeeCount} Staff</span>
                    </div>
                    {isOrgExpanded ? (
                      <ChevronDown className="h-5 w-5 text-slate-400" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-slate-400" />
                    )}
                  </div>
                </div>

                {/* Level 2: Departments List */}
                {isOrgExpanded && (
                  <div className="p-4 space-y-3 bg-slate-50/50">
                    {org.departments.length === 0 ? (
                      <div className="px-4 py-3 text-xs text-slate-500 italic">No departments registered for this organization yet.</div>
                    ) : (
                      org.departments.map((dept) => {
                        const deptKey = `${org.id}-${dept.department}`;
                        const isDeptExpanded = !!expandedDepts[deptKey];

                        return (
                          <div key={deptKey} className="ml-2 border-l-2 border-indigo-200 pl-4 space-y-2">
                            {/* Department Header */}
                            <div
                              onClick={() => toggleDept(deptKey)}
                              className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 bg-white p-3 hover:bg-slate-50 shadow-2xs"
                            >
                              <div className="flex items-center gap-2.5">
                                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 font-bold text-xs">
                                  <Layers className="h-4 w-4" />
                                </div>
                                <div>
                                  <span className="text-xs font-bold text-slate-900">{dept.department}</span>
                                  <span className="ml-2 text-[10px] text-slate-500 font-medium">({dept.count} employees)</span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 text-slate-400">
                                <span className="text-[10px] font-semibold text-slate-500">{dept.designations.length} Designations</span>
                                {isDeptExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                              </div>
                            </div>

                            {/* Level 3: Designations */}
                            {isDeptExpanded && (
                              <div className="ml-4 border-l-2 border-slate-200 pl-4 space-y-2 py-1">
                                {dept.designations.map((desig) => {
                                  const desigKey = `${deptKey}-${desig.designation}`;
                                  const isDesigExpanded = !!expandedDesigs[desigKey];

                                  return (
                                    <div key={desigKey} className="space-y-1">
                                      {/* Designation Item */}
                                      <div
                                        onClick={() => toggleDesig(desigKey)}
                                        className="flex cursor-pointer items-center justify-between rounded-lg border border-slate-200/80 bg-white px-3 py-2 text-xs hover:bg-slate-50"
                                      >
                                        <div className="flex items-center gap-2">
                                          <Briefcase className="h-3.5 w-3.5 text-slate-400" />
                                          <span className="font-semibold text-slate-800">{desig.designation}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-slate-400">
                                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-bold text-slate-600">
                                            {desig.count} {desig.count === 1 ? 'Person' : 'People'}
                                          </span>
                                          {isDesigExpanded ? (
                                            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                                          ) : (
                                            <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                                          )}
                                        </div>
                                      </div>

                                      {/* Level 4: Employee Cards */}
                                      {isDesigExpanded && (
                                        <div className="ml-4 grid grid-cols-1 gap-2 pt-1 sm:grid-cols-2 lg:grid-cols-3">
                                          {desig.employees.map((emp) => (
                                            <div
                                              key={emp.id}
                                              className="flex items-center gap-2.5 rounded-lg border border-slate-200 bg-white p-2.5 shadow-2xs hover:border-indigo-300"
                                            >
                                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-bold text-xs">
                                                {emp.name.charAt(0)}
                                              </div>
                                              <div className="min-w-0 flex-1">
                                                <div className="flex items-center justify-between">
                                                  <p className="truncate text-xs font-bold text-slate-900">{emp.name}</p>
                                                  <span className="text-[9px] font-mono text-indigo-600 bg-indigo-50 px-1 rounded">
                                                    {emp.employeeId}
                                                  </span>
                                                </div>
                                                <p className="truncate text-[10px] text-slate-500">{emp.email}</p>
                                                <div className="mt-1 flex items-center justify-between text-[9px]">
                                                  <span className="text-slate-400">{emp.role}</span>
                                                  <span className="font-semibold text-emerald-600">{emp.status}</span>
                                                </div>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </SuperAdminLayout>
  );
}
