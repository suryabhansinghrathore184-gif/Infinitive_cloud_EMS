'use client';

import React, { useState, useMemo } from 'react';
import {
  Building2,
  ChevronDown,
  ChevronRight,
  User,
  Users,
  Search,
  Maximize2,
  Minimize2,
  Briefcase,
  Layers,
  MapPin,
} from 'lucide-react';
import { Department, Designation, Employee } from '@/types/admin';

interface OrgHierarchyTreeProps {
  companyName: string;
  departments: Department[];
  designations: Designation[];
  employees: Employee[];
}

export const OrgHierarchyTree: React.FC<OrgHierarchyTreeProps> = ({
  companyName,
  departments,
  designations,
  employees,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({
    root: true,
  });

  // Automatically expand all departments initially
  const allDeptIds = useMemo(() => departments.map((d) => `dept-${d.id}`), [departments]);

  const isAllExpanded = useMemo(() => {
    return allDeptIds.every((id) => expandedNodes[id]);
  }, [allDeptIds, expandedNodes]);

  const toggleNode = (nodeId: string) => {
    setExpandedNodes((prev) => ({
      ...prev,
      [nodeId]: !prev[nodeId],
    }));
  };

  const handleExpandAll = () => {
    const nextState: Record<string, boolean> = { root: true };
    departments.forEach((d) => {
      nextState[`dept-${d.id}`] = true;
      designations
        .filter((des) => des.department.toLowerCase() === d.name.toLowerCase())
        .forEach((des) => {
          nextState[`desg-${des.id}`] = true;
        });
    });
    setExpandedNodes(nextState);
  };

  const handleCollapseAll = () => {
    setExpandedNodes({ root: true });
  };

  // Group employees by department and designation
  const hierarchyData = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return departments.map((dept) => {
      // Find designations in this department
      const deptDesignations = designations.filter(
        (des) => des.department.toLowerCase() === dept.name.toLowerCase()
      );

      // Find employees in this department
      const deptEmployees = employees.filter(
        (emp) => emp.department?.toLowerCase() === dept.name.toLowerCase() || emp.department === dept.id
      );

      // Group employees by designation
      const desGroups = deptDesignations.map((des) => {
        const desEmployees = deptEmployees.filter(
          (emp) => emp.designation?.toLowerCase() === des.title.toLowerCase() || emp.designation === des.id
        );
        const filteredDesEmployees = term
          ? desEmployees.filter(
              (emp) =>
                emp.firstName.toLowerCase().includes(term) ||
                emp.lastName.toLowerCase().includes(term) ||
                emp.employeeId.toLowerCase().includes(term) ||
                emp.email.toLowerCase().includes(term)
            )
          : desEmployees;

        return {
          designation: des,
          employees: filteredDesEmployees,
          totalCount: desEmployees.length,
        };
      });

      // Employees in department without matching listed designation
      const knownDesTitles = deptDesignations.map((d) => d.title.toLowerCase());
      const otherEmployees = deptEmployees.filter(
        (emp) => !knownDesTitles.includes((emp.designation || '').toLowerCase())
      );
      const filteredOtherEmployees = term
        ? otherEmployees.filter(
            (emp) =>
              emp.firstName.toLowerCase().includes(term) ||
              emp.lastName.toLowerCase().includes(term) ||
              emp.employeeId.toLowerCase().includes(term)
          )
        : otherEmployees;

      const isDeptMatch =
        term === '' ||
        dept.name.toLowerCase().includes(term) ||
        dept.head.toLowerCase().includes(term) ||
        desGroups.some(
          (g) =>
            g.designation.title.toLowerCase().includes(term) || g.employees.length > 0
        ) ||
        filteredOtherEmployees.length > 0;

      return {
        department: dept,
        desGroups,
        otherEmployees: filteredOtherEmployees,
        totalDeptEmployees: deptEmployees.length,
        isDeptMatch,
      };
    });
  }, [departments, designations, employees, searchTerm]);

  // Unassigned employees (no department assigned or department not found)
  const knownDeptNames = departments.map((d) => d.name.toLowerCase());
  const unassignedEmployees = useMemo(() => {
    return employees.filter(
      (emp) => !emp.department || !knownDeptNames.includes(emp.department.toLowerCase())
    );
  }, [employees, knownDeptNames]);

  return (
    <div className="space-y-4">
      {/* Controls Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search hierarchy by name, title, department..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={isAllExpanded ? handleCollapseAll : handleExpandAll}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-2xs"
          >
            {isAllExpanded ? (
              <>
                <Minimize2 className="h-3.5 w-3.5 text-slate-500" />
                <span>Collapse All</span>
              </>
            ) : (
              <>
                <Maximize2 className="h-3.5 w-3.5 text-slate-500" />
                <span>Expand All</span>
              </>
            )}
          </button>
          <div className="rounded-xl bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 border border-blue-100">
            {employees.length} Active Personnel
          </div>
        </div>
      </div>

      {/* Visual Reporting Tree */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm overflow-x-auto">
        {/* Tier 1: Organization Root */}
        <div className="space-y-4">
          <div className="inline-flex items-center gap-3 rounded-2xl border-2 border-blue-600 bg-blue-50/60 px-5 py-3 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">{companyName}</h3>
                <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-extrabold text-white">
                  HQ
                </span>
              </div>
              <p className="text-[11px] font-medium text-slate-500 flex items-center gap-2 mt-0.5">
                <span>{departments.length} Departments</span> • <span>{employees.length} Total Staff</span>
              </p>
            </div>
          </div>

          {/* Tier 2: Departments Tree */}
          <div className="pl-6 border-l-2 border-slate-200 space-y-4 ml-5">
            {hierarchyData
              .filter((item) => item.isDeptMatch)
              .map(({ department: dept, desGroups, otherEmployees, totalDeptEmployees }) => {
                const deptNodeId = `dept-${dept.id}`;
                const isDeptExpanded = expandedNodes[deptNodeId] ?? true;

                return (
                  <div key={dept.id} className="relative pt-2">
                    {/* Horizontal Connector Line */}
                    <div className="absolute -left-6 top-6 h-0.5 w-6 bg-slate-200" />

                    {/* Department Card Node */}
                    <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3.5 shadow-2xs hover:border-slate-300 transition-all">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => toggleNode(deptNodeId)}
                            className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                          >
                            {isDeptExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </button>
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-xs">
                            {dept.code}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-xs font-bold text-slate-900">{dept.name}</h4>
                              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-700 border border-emerald-200">
                                {dept.status}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-500">
                              Head of Dept: <span className="font-semibold text-slate-700">{dept.head}</span>
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="rounded-lg bg-white px-2.5 py-1 text-[11px] font-bold text-slate-700 border border-slate-200 shadow-2xs">
                            {totalDeptEmployees} Staff
                          </span>
                        </div>
                      </div>

                      {/* Tier 3: Designations & Employees inside Department */}
                      {isDeptExpanded && (
                        <div className="mt-3 pl-6 border-l-2 border-blue-200 space-y-3 ml-3 pt-2">
                          {desGroups.map(({ designation: des, employees: desEmps, totalCount }) => {
                            const desgNodeId = `desg-${des.id}`;
                            const isDesgExpanded = expandedNodes[desgNodeId] ?? true;

                            return (
                              <div key={des.id} className="relative">
                                {/* Connector line */}
                                <div className="absolute -left-6 top-4 h-0.5 w-6 bg-blue-200" />

                                <div className="rounded-lg border border-purple-100 bg-white p-2.5 shadow-2xs">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={() => toggleNode(desgNodeId)}
                                        className="flex h-5 w-5 items-center justify-center rounded bg-slate-100 text-slate-500 hover:text-slate-800"
                                      >
                                        {isDesgExpanded ? (
                                          <ChevronDown className="h-3 w-3" />
                                        ) : (
                                          <ChevronRight className="h-3 w-3" />
                                        )}
                                      </button>
                                      <Layers className="h-3.5 w-3.5 text-purple-600" />
                                      <span className="text-xs font-bold text-slate-800">{des.title}</span>
                                      <span className="rounded bg-purple-50 px-1.5 py-0.5 text-[9px] font-extrabold text-purple-700 font-mono">
                                        {des.level}
                                      </span>
                                    </div>
                                    <span className="text-[10px] font-semibold text-slate-500">
                                      {totalCount} Assigned
                                    </span>
                                  </div>

                                  {/* Tier 4: Employee Node Cards */}
                                  {isDesgExpanded && desEmps.length > 0 && (
                                    <div className="mt-2.5 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 pl-4 border-l border-purple-200">
                                      {desEmps.map((emp) => (
                                        <div
                                          key={emp.id}
                                          className="flex items-center gap-2.5 rounded-lg border border-slate-100 bg-slate-50 p-2 text-xs"
                                        >
                                          <img
                                            src={emp.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100'}
                                            alt={emp.firstName}
                                            className="h-7 w-7 rounded-full object-cover border border-slate-300"
                                          />
                                          <div className="min-w-0 flex-1">
                                            <p className="font-bold text-slate-900 truncate">
                                              {emp.firstName} {emp.lastName}
                                            </p>
                                            <p className="text-[10px] text-slate-400 font-mono truncate">
                                              {emp.employeeId} • {emp.status}
                                            </p>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}

                          {/* Other Employees in Dept */}
                          {otherEmployees.length > 0 && (
                            <div className="relative pt-1">
                              <div className="absolute -left-6 top-3 h-0.5 w-6 bg-blue-200" />
                              <div className="rounded-lg border border-slate-200 bg-white p-2.5">
                                <span className="text-xs font-bold text-slate-700">Additional Team Members</span>
                                <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                  {otherEmployees.map((emp) => (
                                    <div
                                      key={emp.id}
                                      className="flex items-center gap-2.5 rounded-lg border border-slate-100 bg-slate-50 p-2 text-xs"
                                    >
                                      <img
                                        src={emp.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100'}
                                        alt={emp.firstName}
                                        className="h-7 w-7 rounded-full object-cover border border-slate-300"
                                      />
                                      <div className="min-w-0 flex-1">
                                        <p className="font-bold text-slate-900 truncate">
                                          {emp.firstName} {emp.lastName}
                                        </p>
                                        <p className="text-[10px] text-slate-400 truncate">
                                          {emp.designation || 'Staff'}
                                        </p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

            {/* Unassigned Tier */}
            {unassignedEmployees.length > 0 && (
              <div className="relative pt-2">
                <div className="absolute -left-6 top-6 h-0.5 w-6 bg-slate-200" />
                <div className="rounded-xl border border-dashed border-amber-300 bg-amber-50/50 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-amber-600" />
                      <h4 className="text-xs font-bold text-amber-900">Unassigned Personnel</h4>
                    </div>
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                      {unassignedEmployees.length} Staff
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {unassignedEmployees.map((emp) => (
                      <div
                        key={emp.id}
                        className="flex items-center gap-2.5 rounded-lg border border-amber-200 bg-white p-2 text-xs"
                      >
                        <img
                          src={emp.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100'}
                          alt={emp.firstName}
                          className="h-7 w-7 rounded-full object-cover border border-slate-300"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-slate-900 truncate">
                            {emp.firstName} {emp.lastName}
                          </p>
                          <p className="text-[10px] text-slate-500 font-mono truncate">
                            {emp.employeeId}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
