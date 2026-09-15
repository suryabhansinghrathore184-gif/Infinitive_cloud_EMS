'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  Plus,
  Edit3,
  Eye,
  AlertTriangle,
  X,
  Filter,
  CheckCircle2,
  XCircle,
  Activity,
  List,
  UserPlus,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Building,
  Check,
} from 'lucide-react';

interface EmployeeNode {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  avatar: string;
  role: string;
  status: string;
  department: string;
  designation: string;
  location: string;
  joiningDate: string;
}

interface DesignationNode {
  id: string;
  designationId: string;
  designation: string;
  title: string;
  code: string;
  level: string;
  status: string;
  count: number;
  employees: EmployeeNode[];
}

interface DepartmentNode {
  id: string;
  departmentId: string;
  department: string;
  name: string;
  code: string;
  head: string;
  status: string;
  count: number;
  designations: DesignationNode[];
  unassignedStaff: EmployeeNode[];
}

interface OrganizationTree {
  id: string;
  organizationId: string;
  name: string;
  code: string;
  industry: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  country: string;
  status: string;
  logoUrl: string;
  employeeCount: number;
  departmentCount: number;
  userCount: number;
  departments: DepartmentNode[];
}

interface SummaryMetrics {
  totalOrganizations: number;
  totalDepartments: number;
  totalDesignations: number;
  totalEmployees: number;
  activeEmployees: number;
  unassignedEmployees: number;
}

interface HealthMetrics {
  deptsWithoutOrg: number;
  desigsWithoutDept: number;
  empsWithoutDept: number;
  empsWithoutDesig: number;
  inactiveDepts: number;
  inactiveDesigs: number;
}

export default function OrganizationStructurePage() {
  const [organizations, setOrganizations] = useState<OrganizationTree[]>([]);
  const [summary, setSummary] = useState<SummaryMetrics>({
    totalOrganizations: 0,
    totalDepartments: 0,
    totalDesignations: 0,
    totalEmployees: 0,
    activeEmployees: 0,
    unassignedEmployees: 0,
  });
  const [health, setHealth] = useState<HealthMetrics>({
    deptsWithoutOrg: 0,
    desigsWithoutDept: 0,
    empsWithoutDept: 0,
    empsWithoutDesig: 0,
    inactiveDepts: 0,
    inactiveDesigs: 0,
  });
  const [unassignedList, setUnassignedList] = useState<any[]>([]);
  const [filterOptions, setFilterOptions] = useState<{
    organizations: { id: string; name: string; code: string }[];
    departments: { name: string }[];
  }>({ organizations: [], departments: [] });

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filters & Controls
  const [search, setSearch] = useState('');
  const [orgFilter, setOrgFilter] = useState('All');
  const [deptFilter, setDeptFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [viewMode, setViewMode] = useState<'tree' | 'list'>('tree');

  // Expanded Tree Node States
  const [expandedOrgs, setExpandedOrgs] = useState<Record<string, boolean>>({});
  const [expandedDepts, setExpandedDepts] = useState<Record<string, boolean>>({});
  const [expandedDesigs, setExpandedDesigs] = useState<Record<string, boolean>>({});

  // Modals
  const [addDeptModal, setAddDeptModal] = useState({ isOpen: false, organizationId: '' });
  const [editDeptModal, setEditDeptModal] = useState<{ isOpen: boolean; dept: any }>({ isOpen: false, dept: null });
  const [addDesigModal, setAddDesigModal] = useState({ isOpen: false, organizationId: '', department: '' });
  const [editDesigModal, setEditDesigModal] = useState<{ isOpen: boolean; desig: any }>({ isOpen: false, desig: null });
  const [assignEmpModal, setAssignEmpModal] = useState<{ isOpen: boolean; emp: any }>({ isOpen: false, emp: null });
  const [viewDetailsModal, setViewDetailsModal] = useState<{ isOpen: boolean; type: string; title: string; data: any }>({
    isOpen: false,
    type: 'emp',
    title: '',
    data: null,
  });

  // Modal Submitting States
  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [modalSuccess, setModalSuccess] = useState<string | null>(null);

  // Fetch complete structure from API
  const fetchStructure = useCallback(async (isRefresh = false) => {
    if (isRefresh) setIsRefreshing(true);
    else setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/v1/super-admin/organization-structure');
      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.message || 'Unable to load organization structure.');
      }

      const data = result.data;
      setSummary(data.summary || {});
      setHealth(data.health || {});
      setOrganizations(data.organizations || []);
      setUnassignedList(data.unassignedEmployeesList || []);
      setFilterOptions(data.filterOptions || { organizations: [], departments: [] });

      // Auto expand first org by default on initial load
      if (data.organizations && data.organizations.length > 0 && !isRefresh) {
        const firstOrg = data.organizations[0];
        setExpandedOrgs({ [firstOrg.id]: true });
        if (firstOrg.departments && firstOrg.departments.length > 0) {
          const firstDept = firstOrg.departments[0];
          setExpandedDepts({ [`${firstOrg.id}-${firstDept.id}`]: true });
        }
      }
    } catch (err: any) {
      console.error('Fetch structure error:', err);
      setErrorMessage(err.message || 'Unable to load organization structure.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStructure();
  }, [fetchStructure]);

  // Filtered Hierarchy Tree with Search Path Expansion
  const filteredOrgs = useMemo(() => {
    return organizations
      .filter((org) => {
        if (orgFilter !== 'All' && org.organizationId !== orgFilter && org.id !== orgFilter) return false;
        if (statusFilter !== 'All' && org.status !== statusFilter) return false;
        return true;
      })
      .map((org) => {
        const matchingDepts = org.departments
          .filter((dept) => {
            if (deptFilter !== 'All' && dept.department.toLowerCase() !== deptFilter.toLowerCase()) return false;
            if (statusFilter !== 'All' && dept.status !== statusFilter) return false;
            return true;
          })
          .map((dept) => {
            const matchingDesigs = dept.designations
              .filter((desig) => {
                if (statusFilter !== 'All' && desig.status !== statusFilter) return false;
                return true;
              })
              .map((desig) => {
                const matchingEmployees = desig.employees.filter((emp) => {
                  if (statusFilter !== 'All' && emp.status !== statusFilter) return false;
                  if (!search.trim()) return true;
                  const term = search.toLowerCase();
                  return (
                    emp.name.toLowerCase().includes(term) ||
                    emp.employeeId.toLowerCase().includes(term) ||
                    emp.email.toLowerCase().includes(term) ||
                    emp.role.toLowerCase().includes(term)
                  );
                });

                return { ...desig, employees: matchingEmployees };
              })
              .filter((desig) => {
                if (!search.trim()) return true;
                const term = search.toLowerCase();
                return (
                  desig.designation.toLowerCase().includes(term) ||
                  desig.code.toLowerCase().includes(term) ||
                  desig.employees.length > 0
                );
              });

            return { ...dept, designations: matchingDesigs };
          })
          .filter((dept) => {
            if (!search.trim()) return true;
            const term = search.toLowerCase();
            return (
              dept.department.toLowerCase().includes(term) ||
              dept.code.toLowerCase().includes(term) ||
              dept.head.toLowerCase().includes(term) ||
              dept.designations.length > 0
            );
          });

        return { ...org, departments: matchingDepts };
      })
      .filter((org) => {
        if (!search.trim()) return true;
        const term = search.toLowerCase();
        return (
          org.name.toLowerCase().includes(term) ||
          org.code.toLowerCase().includes(term) ||
          org.industry.toLowerCase().includes(term) ||
          org.departments.length > 0
        );
      });
  }, [organizations, orgFilter, deptFilter, statusFilter, search]);

  // Search Result Auto-Expand Path (Item 14 Requirement)
  useEffect(() => {
    if (!search.trim()) return;

    const newExpandedOrgs: Record<string, boolean> = {};
    const newExpandedDepts: Record<string, boolean> = {};
    const newExpandedDesigs: Record<string, boolean> = {};

    filteredOrgs.forEach((org) => {
      newExpandedOrgs[org.id] = true;
      org.departments.forEach((dept) => {
        const deptKey = `${org.id}-${dept.id}`;
        newExpandedDepts[deptKey] = true;
        dept.designations.forEach((desig) => {
          const desigKey = `${deptKey}-${desig.id}`;
          newExpandedDesigs[desigKey] = true;
        });
      });
    });

    setExpandedOrgs(newExpandedOrgs);
    setExpandedDepts(newExpandedDepts);
    setExpandedDesigs(newExpandedDesigs);
  }, [search, filteredOrgs]);

  // Tree Expansion Toggles
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

    filteredOrgs.forEach((org) => {
      orgsMap[org.id] = true;
      org.departments.forEach((dept) => {
        const deptKey = `${org.id}-${dept.id}`;
        deptsMap[deptKey] = true;
        dept.designations.forEach((desig) => {
          desigsMap[`${deptKey}-${desig.id}`] = true;
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

  const resetFilters = () => {
    setSearch('');
    setOrgFilter('All');
    setDeptFilter('All');
    setStatusFilter('All');
  };

  // Flattened List View Data
  const flatListItems = useMemo(() => {
    const list: any[] = [];
    filteredOrgs.forEach((org) => {
      org.departments.forEach((dept) => {
        dept.designations.forEach((desig) => {
          desig.employees.forEach((emp) => {
            list.push({
              orgName: org.name,
              orgCode: org.code,
              deptName: dept.department,
              desigTitle: desig.designation,
              employeeId: emp.employeeId,
              name: emp.name,
              email: emp.email,
              role: emp.role,
              status: emp.status,
              rawEmp: emp,
            });
          });
        });
      });
    });
    return list;
  }, [filteredOrgs]);

  // Handlers for Add Department API
  const handleAddDepartment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setModalSubmitting(true);
    setModalError(null);
    setModalSuccess(null);

    const formData = new FormData(e.currentTarget);
    const payload = {
      organizationId: formData.get('organizationId'),
      name: formData.get('name'),
      code: formData.get('code'),
      head: formData.get('head'),
      description: formData.get('description'),
      status: formData.get('status') || 'Active',
    };

    try {
      const res = await fetch('/api/v1/super-admin/organization-structure/department', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to create department');
      }
      setModalSuccess(data.message);
      setTimeout(() => {
        setAddDeptModal({ isOpen: false, organizationId: '' });
        fetchStructure(true);
      }, 1000);
    } catch (err: any) {
      setModalError(err.message);
    } finally {
      setModalSubmitting(false);
    }
  };

  // Handlers for Edit Department API
  const handleEditDepartment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setModalSubmitting(true);
    setModalError(null);
    setModalSuccess(null);

    const formData = new FormData(e.currentTarget);
    const payload = {
      id: editDeptModal.dept?.id || editDeptModal.dept?.departmentId,
      organizationId: formData.get('organizationId'),
      name: formData.get('name'),
      code: formData.get('code'),
      head: formData.get('head'),
      description: formData.get('description'),
      status: formData.get('status'),
    };

    try {
      const res = await fetch('/api/v1/super-admin/organization-structure/department', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to update department');
      }
      setModalSuccess(data.message);
      setTimeout(() => {
        setEditDeptModal({ isOpen: false, dept: null });
        fetchStructure(true);
      }, 1000);
    } catch (err: any) {
      setModalError(err.message);
    } finally {
      setModalSubmitting(false);
    }
  };

  // Handlers for Add Designation API
  const handleAddDesignation = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setModalSubmitting(true);
    setModalError(null);
    setModalSuccess(null);

    const formData = new FormData(e.currentTarget);
    const payload = {
      organizationId: formData.get('organizationId'),
      department: formData.get('department'),
      title: formData.get('title'),
      code: formData.get('code'),
      level: formData.get('level'),
      description: formData.get('description'),
      status: formData.get('status') || 'Active',
    };

    try {
      const res = await fetch('/api/v1/super-admin/organization-structure/designation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to create designation');
      }
      setModalSuccess(data.message);
      setTimeout(() => {
        setAddDesigModal({ isOpen: false, organizationId: '', department: '' });
        fetchStructure(true);
      }, 1000);
    } catch (err: any) {
      setModalError(err.message);
    } finally {
      setModalSubmitting(false);
    }
  };

  // Handlers for Edit Designation API
  const handleEditDesignation = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setModalSubmitting(true);
    setModalError(null);
    setModalSuccess(null);

    const formData = new FormData(e.currentTarget);
    const payload = {
      id: editDesigModal.desig?.id || editDesigModal.desig?.designationId,
      organizationId: formData.get('organizationId'),
      department: formData.get('department'),
      title: formData.get('title'),
      code: formData.get('code'),
      level: formData.get('level'),
      description: formData.get('description'),
      status: formData.get('status'),
    };

    try {
      const res = await fetch('/api/v1/super-admin/organization-structure/designation', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to update designation');
      }
      setModalSuccess(data.message);
      setTimeout(() => {
        setEditDesigModal({ isOpen: false, desig: null });
        fetchStructure(true);
      }, 1000);
    } catch (err: any) {
      setModalError(err.message);
    } finally {
      setModalSubmitting(false);
    }
  };

  // Handlers for Assign Employee API
  const handleAssignEmployee = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setModalSubmitting(true);
    setModalError(null);
    setModalSuccess(null);

    const formData = new FormData(e.currentTarget);
    const payload = {
      employeeId: assignEmpModal.emp?.employeeId || assignEmpModal.emp?.id,
      id: assignEmpModal.emp?.id,
      organizationId: formData.get('organizationId'),
      department: formData.get('department'),
      designation: formData.get('designation'),
    };

    try {
      const res = await fetch('/api/v1/super-admin/organization-structure/assign-employee', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to assign employee structure');
      }
      setModalSuccess(data.message);
      setTimeout(() => {
        setAssignEmpModal({ isOpen: false, emp: null });
        fetchStructure(true);
      }, 1000);
    } catch (err: any) {
      setModalError(err.message);
    } finally {
      setModalSubmitting(false);
    }
  };

  return (
    <SuperAdminLayout
      pageTitle="Organization Structure Control Center"
      breadcrumbs={[
        { label: 'Executive Dashboard', href: '/super-admin/dashboard' },
        { label: 'Org Structure', href: '/super-admin/organization-structure' },
      ]}
    >
      {/* 1. Header Toolbar */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Organization Structure Hierarchy</h2>
          <p className="text-xs font-medium text-slate-500">
            Manage multi-tenant organizations, departments, designations, and workforce hierarchy from one control center.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center rounded-xl border border-slate-200 bg-white p-1 shadow-2xs">
            <button
              onClick={() => setViewMode('tree')}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                viewMode === 'tree' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FolderTree className="h-3.5 w-3.5" />
              <span>Tree View</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                viewMode === 'list' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <List className="h-3.5 w-3.5" />
              <span>List View</span>
            </button>
          </div>

          <button
            onClick={expandAll}
            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50"
          >
            Expand All
          </button>
          <button
            onClick={collapseAll}
            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50"
          >
            Collapse All
          </button>
          <button
            onClick={() => fetchStructure(true)}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-indigo-600 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh Tree</span>
          </button>

          <button
            onClick={() => {
              setModalError(null);
              setModalSuccess(null);
              setAddDeptModal({
                isOpen: true,
                organizationId: organizations[0]?.organizationId || 'org-default',
              });
            }}
            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Department</span>
          </button>

          <button
            onClick={() => {
              setModalError(null);
              setModalSuccess(null);
              setAddDesigModal({
                isOpen: true,
                organizationId: organizations[0]?.organizationId || 'org-default',
                department: organizations[0]?.departments[0]?.department || 'General',
              });
            }}
            className="flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3.5 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Designation</span>
          </button>
        </div>
      </div>

      {/* 2. Executive KPI Summary Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {/* Organizations */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Organizations</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <Building2 className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-extrabold text-slate-900">{summary.totalOrganizations}</p>
          <span className="mt-1 inline-block text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
            Multi-Tenant Active
          </span>
        </div>

        {/* Departments */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Departments</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Layers className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-extrabold text-slate-900">{summary.totalDepartments}</p>
          <span className="mt-1 inline-block text-[10px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
            System Units
          </span>
        </div>

        {/* Designations */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Designations</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              <Briefcase className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-extrabold text-slate-900">{summary.totalDesignations}</p>
          <span className="mt-1 inline-block text-[10px] font-semibold text-purple-600 bg-purple-50 px-2 py-0.5 rounded">
            Job Titles
          </span>
        </div>

        {/* Total Workforce */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Employees</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-extrabold text-slate-900">{summary.totalEmployees}</p>
          <span className="mt-1 inline-block text-[10px] font-semibold text-teal-600 bg-teal-50 px-2 py-0.5 rounded">
            Total Roster
          </span>
        </div>

        {/* Active Employees */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Active Staff</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <UserCheck className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-extrabold text-slate-900">{summary.activeEmployees}</p>
          <span className="mt-1 inline-block text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
            Operational
          </span>
        </div>

        {/* Unassigned */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Unassigned</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-extrabold text-slate-900">{summary.unassignedEmployees}</p>
          <span className="mt-1 inline-block text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
            Requires Mapping
          </span>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search organizations, departments, designations, or employees..."
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

        <div className="flex flex-wrap items-center gap-2">
          {/* Organization Filter */}
          <div className="flex items-center gap-1 text-xs">
            <span className="text-slate-500 font-medium hidden md:inline">Org:</span>
            <select
              value={orgFilter}
              onChange={(e) => setOrgFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs focus:border-indigo-500 focus:outline-hidden"
            >
              <option value="All">All Organizations</option>
              {filterOptions.organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name} ({org.code})
                </option>
              ))}
            </select>
          </div>

          {/* Department Filter */}
          <div className="flex items-center gap-1 text-xs">
            <span className="text-slate-500 font-medium hidden md:inline">Dept:</span>
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs focus:border-indigo-500 focus:outline-hidden"
            >
              <option value="All">All Departments</option>
              {filterOptions.departments.map((dept, idx) => (
                <option key={idx} value={dept.name}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1 text-xs">
            <span className="text-slate-500 font-medium hidden md:inline">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs focus:border-indigo-500 focus:outline-hidden"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          {(search || orgFilter !== 'All' || deptFilter !== 'All' || statusFilter !== 'All') && (
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

      {/* 4. Structure Health Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-indigo-600" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Organization Structure Data Health</h3>
          </div>
          <span className="text-[11px] text-slate-500 font-medium">Real-time Relationship Quality Audit</span>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6 text-xs font-medium text-slate-700">
          <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-100">
            <span className="text-[10px] text-slate-500 block">Depts without Org</span>
            <span className="text-sm font-extrabold text-slate-800">{health.deptsWithoutOrg}</span>
          </div>
          <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-100">
            <span className="text-[10px] text-slate-500 block">Desigs without Dept</span>
            <span className="text-sm font-extrabold text-slate-800">{health.desigsWithoutDept}</span>
          </div>
          <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-100">
            <span className="text-[10px] text-slate-500 block">Employees without Dept</span>
            <span className={`text-sm font-extrabold ${health.empsWithoutDept > 0 ? 'text-amber-600' : 'text-slate-800'}`}>
              {health.empsWithoutDept}
            </span>
          </div>
          <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-100">
            <span className="text-[10px] text-slate-500 block">Employees without Desig</span>
            <span className={`text-sm font-extrabold ${health.empsWithoutDesig > 0 ? 'text-amber-600' : 'text-slate-800'}`}>
              {health.empsWithoutDesig}
            </span>
          </div>
          <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-100">
            <span className="text-[10px] text-slate-500 block">Inactive Departments</span>
            <span className="text-sm font-extrabold text-slate-800">{health.inactiveDepts}</span>
          </div>
          <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-100">
            <span className="text-[10px] text-slate-500 block">Inactive Designations</span>
            <span className="text-sm font-extrabold text-slate-800">{health.inactiveDesigs}</span>
          </div>
        </div>
      </div>

      {/* 5. Dedicated Unassigned Employees Section */}
      {unassignedList.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 shadow-2xs">
          <div className="flex items-center justify-between border-b border-amber-200/80 pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <h3 className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                Unassigned Staff Roster ({unassignedList.length})
              </h3>
            </div>
            <span className="text-[11px] text-amber-700 font-semibold">Employees missing Department or Designation mapping</span>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
            {unassignedList.map((emp) => (
              <div
                key={emp.id}
                className="flex items-center justify-between rounded-xl border border-amber-200 bg-white p-3 shadow-2xs hover:border-amber-300"
              >
                <div>
                  <p className="text-xs font-bold text-slate-900">{emp.name}</p>
                  <p className="text-[10px] text-slate-500 font-mono">{emp.employeeId}</p>
                  <div className="mt-1 flex items-center gap-1 text-[10px] text-amber-700 font-medium">
                    <span>Dept: {emp.department}</span>
                    <span>&bull;</span>
                    <span>Desig: {emp.designation}</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setModalError(null);
                    setModalSuccess(null);
                    setAssignEmpModal({ isOpen: true, emp });
                  }}
                  className="rounded-lg bg-amber-600 px-2.5 py-1 text-[11px] font-bold text-white shadow-2xs hover:bg-amber-700"
                >
                  Assign
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. Main Hierarchy Content: Skeleton / Error / Tree / List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="animate-pulse rounded-2xl border border-slate-200 bg-white p-6">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-slate-200" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-1/4 rounded bg-slate-200" />
                  <div className="h-3 w-1/3 rounded bg-slate-200" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : errorMessage ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-rose-200 bg-rose-50/40 p-12 text-center">
          <XCircle className="h-10 w-10 text-rose-500" />
          <p className="mt-3 font-bold text-rose-900">{errorMessage}</p>
          <p className="mt-1 text-xs text-rose-600">Check server logs or click below to retry fetching structure data.</p>
          <button
            onClick={() => fetchStructure(false)}
            className="mt-4 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-rose-700"
          >
            Retry Fetching
          </button>
        </div>
      ) : filteredOrgs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-slate-500 text-center">
          <FolderTree className="h-10 w-10 text-slate-400" />
          <p className="mt-2 font-bold text-slate-800">No matching structure nodes found</p>
          <p className="text-xs text-slate-500">No organizations, departments, or employees match your search filter criteria.</p>
          <button onClick={resetFilters} className="mt-4 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-700">
            Reset Filters
          </button>
        </div>
      ) : viewMode === 'list' ? (
        /* Flat List View Mode */
        <div className="rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Employee Name</th>
                  <th className="px-4 py-3">Employee ID</th>
                  <th className="px-4 py-3">Organization</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Designation</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {flatListItems.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 font-bold text-slate-900">{item.name}</td>
                    <td className="px-4 py-3 font-mono text-indigo-600">{item.employeeId}</td>
                    <td className="px-4 py-3">{item.orgName}</td>
                    <td className="px-4 py-3">{item.deptName}</td>
                    <td className="px-4 py-3">{item.desigTitle}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() =>
                          setViewDetailsModal({
                            isOpen: true,
                            type: 'emp',
                            title: `Employee Profile: ${item.name}`,
                            data: item.rawEmp,
                          })
                        }
                        className="rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-100"
                      >
                        View Profile
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Multi-Level Interactive Hierarchy Tree View */
        <div className="space-y-4">
          {filteredOrgs.map((org) => {
            const isOrgExpanded = !!expandedOrgs[org.id];

            return (
              <div key={org.id} className="rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
                {/* Level 1: Organization Header Node */}
                <div className="flex items-center justify-between bg-slate-50/80 border-b border-slate-200 px-5 py-4 transition-colors hover:bg-slate-100/60">
                  <div
                    onClick={() => toggleOrg(org.id)}
                    className="flex cursor-pointer items-center gap-3.5 flex-1 min-w-0"
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-600 font-bold text-white shadow-md shadow-indigo-600/20">
                      {org.logoUrl ? (
                        <img src={org.logoUrl} alt={org.name} className="h-8 w-8 object-contain rounded-lg" />
                      ) : (
                        <Building2 className="h-5 w-5" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-extrabold text-slate-900 truncate">{org.name}</h3>
                        <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 border border-indigo-200">
                          {org.code}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${
                            org.status === 'Active'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {org.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {org.industry} &bull; {org.city}, {org.country} &bull; {org.departmentCount} Depts &bull; {org.employeeCount} Workforce
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        setViewDetailsModal({
                          isOpen: true,
                          type: 'org',
                          title: `Organization Details: ${org.name}`,
                          data: org,
                        })
                      }
                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-50"
                    >
                      View
                    </button>
                    <button
                      onClick={() => {
                        setModalError(null);
                        setModalSuccess(null);
                        setAddDeptModal({ isOpen: true, organizationId: org.organizationId });
                      }}
                      className="rounded-lg bg-indigo-50 border border-indigo-200 px-2.5 py-1 text-[11px] font-bold text-indigo-700 hover:bg-indigo-100"
                    >
                      + Dept
                    </button>
                    <div onClick={() => toggleOrg(org.id)} className="cursor-pointer p-1 text-slate-400 hover:text-slate-600">
                      {isOrgExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                    </div>
                  </div>
                </div>

                {/* Level 2: Departments List */}
                {isOrgExpanded && (
                  <div className="p-4 space-y-3 bg-slate-50/40">
                    {org.departments.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-slate-200 bg-white p-4 text-center text-xs text-slate-500">
                        <span>No departments configured for this organization.</span>
                        <button
                          onClick={() => {
                            setModalError(null);
                            setModalSuccess(null);
                            setAddDeptModal({ isOpen: true, organizationId: org.organizationId });
                          }}
                          className="ml-2 font-bold text-indigo-600 underline"
                        >
                          Add Department
                        </button>
                      </div>
                    ) : (
                      org.departments.map((dept) => {
                        const deptKey = `${org.id}-${dept.id}`;
                        const isDeptExpanded = !!expandedDepts[deptKey];

                        return (
                          <div key={deptKey} className="ml-2 border-l-2 border-indigo-200/80 pl-4 space-y-2">
                            {/* Department Node Header */}
                            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 shadow-2xs hover:bg-slate-50/60">
                              <div
                                onClick={() => toggleDept(deptKey)}
                                className="flex cursor-pointer items-center gap-3 flex-1 min-w-0"
                              >
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 font-bold text-xs">
                                  <Layers className="h-4 w-4" />
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-slate-900">{dept.department}</span>
                                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-mono font-semibold text-slate-600">
                                      {dept.code}
                                    </span>
                                  </div>
                                  <p className="text-[10px] text-slate-500">
                                    Head: {dept.head} &bull; {dept.count} Employees &bull; {dept.designations.length} Designations
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => {
                                    setModalError(null);
                                    setModalSuccess(null);
                                    setAddDesigModal({
                                      isOpen: true,
                                      organizationId: org.organizationId,
                                      department: dept.department,
                                    });
                                  }}
                                  className="rounded-lg border border-purple-200 bg-purple-50 px-2 py-0.5 text-[10px] font-bold text-purple-700 hover:bg-purple-100"
                                >
                                  + Desig
                                </button>
                                <button
                                  onClick={() => {
                                    setModalError(null);
                                    setModalSuccess(null);
                                    setEditDeptModal({ isOpen: true, dept });
                                  }}
                                  className="rounded-lg border border-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-600 hover:bg-slate-100"
                                >
                                  Edit
                                </button>
                                <div onClick={() => toggleDept(deptKey)} className="cursor-pointer text-slate-400 hover:text-slate-600">
                                  {isDeptExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                </div>
                              </div>
                            </div>

                            {/* Level 3: Designations List */}
                            {isDeptExpanded && (
                              <div className="ml-4 border-l-2 border-slate-200/80 pl-4 space-y-2 py-1">
                                {dept.designations.length === 0 ? (
                                  <div className="py-2 text-[11px] text-slate-500 italic">
                                    No designations configured for this department yet.
                                  </div>
                                ) : (
                                  dept.designations.map((desig) => {
                                    const desigKey = `${deptKey}-${desig.id}`;
                                    const isDesigExpanded = !!expandedDesigs[desigKey];

                                    return (
                                      <div key={desigKey} className="space-y-2">
                                        {/* Designation Item */}
                                        <div className="flex items-center justify-between rounded-lg border border-slate-200/80 bg-white px-3 py-2 text-xs hover:bg-slate-50">
                                          <div
                                            onClick={() => toggleDesig(desigKey)}
                                            className="flex cursor-pointer items-center gap-2 flex-1 min-w-0"
                                          >
                                            <Briefcase className="h-3.5 w-3.5 text-purple-600 shrink-0" />
                                            <span className="font-bold text-slate-800">{desig.designation}</span>
                                            <span className="rounded bg-purple-50 px-1.5 py-0.5 text-[9px] font-semibold text-purple-700">
                                              {desig.level}
                                            </span>
                                            <span className="text-[10px] text-slate-400">({desig.count} Staff)</span>
                                          </div>

                                          <div className="flex items-center gap-2">
                                            <button
                                              onClick={() => {
                                                setModalError(null);
                                                setModalSuccess(null);
                                                setEditDesigModal({ isOpen: true, desig });
                                              }}
                                              className="rounded px-2 py-0.5 text-[10px] font-bold text-slate-600 hover:bg-slate-100"
                                            >
                                              Edit
                                            </button>
                                            <div onClick={() => toggleDesig(desigKey)} className="cursor-pointer text-slate-400 hover:text-slate-600">
                                              {isDesigExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                                            </div>
                                          </div>
                                        </div>

                                        {/* Level 4: Employee Roster Cards */}
                                        {isDesigExpanded && (
                                          <div className="ml-4 grid grid-cols-1 gap-2 pt-1 sm:grid-cols-2 lg:grid-cols-3">
                                            {desig.employees.length === 0 ? (
                                              <div className="col-span-full py-2 text-[10px] text-slate-400 italic">
                                                No employees currently assigned to this designation.
                                              </div>
                                            ) : (
                                              desig.employees.map((emp) => (
                                                <div
                                                  key={emp.id}
                                                  onClick={() =>
                                                    setViewDetailsModal({
                                                      isOpen: true,
                                                      type: 'emp',
                                                      title: `Employee Details: ${emp.name}`,
                                                      data: emp,
                                                    })
                                                  }
                                                  className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-slate-200 bg-white p-2.5 shadow-2xs transition-all hover:border-indigo-400 hover:shadow-xs"
                                                >
                                                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-bold text-xs">
                                                    {emp.avatar ? (
                                                      <img src={emp.avatar} alt={emp.name} className="h-8 w-8 rounded-full object-cover" />
                                                    ) : (
                                                      emp.name.charAt(0)
                                                    )}
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
                                                      <span className="text-slate-500 font-semibold">{emp.role}</span>
                                                      <span className="font-bold text-emerald-600">{emp.status}</span>
                                                    </div>
                                                  </div>
                                                </div>
                                              ))
                                            )}
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
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALS SECTION */}
      {/* ========================================================================= */}

      {/* 1. Add Department Modal */}
      {addDeptModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900">Add New Department</h3>
              <button onClick={() => setAddDeptModal({ isOpen: false, organizationId: '' })} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            {modalError && (
              <div className="mt-3 rounded-xl bg-rose-50 p-2.5 border border-rose-200 text-xs font-semibold text-rose-700">
                {modalError}
              </div>
            )}
            {modalSuccess && (
              <div className="mt-3 rounded-xl bg-emerald-50 p-2.5 border border-emerald-200 text-xs font-semibold text-emerald-700">
                {modalSuccess}
              </div>
            )}

            <form onSubmit={handleAddDepartment} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700">Organization *</label>
                <select
                  name="organizationId"
                  defaultValue={addDeptModal.organizationId}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800"
                  required
                >
                  {organizations.map((o) => (
                    <option key={o.id} value={o.organizationId}>
                      {o.name} ({o.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700">Department Name *</label>
                <input
                  type="text"
                  name="name"
                  placeholder="e.g. Finance & Accounting"
                  required
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700">Department Code</label>
                  <input
                    type="text"
                    name="code"
                    placeholder="e.g. FIN"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700">Department Head</label>
                  <input
                    type="text"
                    name="head"
                    placeholder="e.g. Jane Doe"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700">Description</label>
                <textarea
                  name="description"
                  rows={2}
                  placeholder="Department responsibilities..."
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAddDeptModal({ isOpen: false, organizationId: '' })}
                  className="rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalSubmitting}
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
                >
                  {modalSubmitting ? 'Saving...' : 'Save Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Edit Department Modal */}
      {editDeptModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900">Edit Department</h3>
              <button onClick={() => setEditDeptModal({ isOpen: false, dept: null })} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            {modalError && (
              <div className="mt-3 rounded-xl bg-rose-50 p-2.5 border border-rose-200 text-xs font-semibold text-rose-700">
                {modalError}
              </div>
            )}
            {modalSuccess && (
              <div className="mt-3 rounded-xl bg-emerald-50 p-2.5 border border-emerald-200 text-xs font-semibold text-emerald-700">
                {modalSuccess}
              </div>
            )}

            <form onSubmit={handleEditDepartment} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700">Department Name *</label>
                <input
                  type="text"
                  name="name"
                  defaultValue={editDeptModal.dept?.department || editDeptModal.dept?.name}
                  required
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700">Department Code</label>
                  <input
                    type="text"
                    name="code"
                    defaultValue={editDeptModal.dept?.code}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700">Status</label>
                  <select
                    name="status"
                    defaultValue={editDeptModal.dept?.status || 'Active'}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700">Department Head</label>
                <input
                  type="text"
                  name="head"
                  defaultValue={editDeptModal.dept?.head}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditDeptModal({ isOpen: false, dept: null })}
                  className="rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalSubmitting}
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
                >
                  {modalSubmitting ? 'Updating...' : 'Update Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Add Designation Modal */}
      {addDesigModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900">Add New Designation</h3>
              <button onClick={() => setAddDesigModal({ isOpen: false, organizationId: '', department: '' })} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            {modalError && (
              <div className="mt-3 rounded-xl bg-rose-50 p-2.5 border border-rose-200 text-xs font-semibold text-rose-700">
                {modalError}
              </div>
            )}
            {modalSuccess && (
              <div className="mt-3 rounded-xl bg-emerald-50 p-2.5 border border-emerald-200 text-xs font-semibold text-emerald-700">
                {modalSuccess}
              </div>
            )}

            <form onSubmit={handleAddDesignation} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700">Organization *</label>
                <select
                  name="organizationId"
                  defaultValue={addDesigModal.organizationId}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800"
                  required
                >
                  {organizations.map((o) => (
                    <option key={o.id} value={o.organizationId}>
                      {o.name} ({o.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700">Department *</label>
                <input
                  type="text"
                  name="department"
                  defaultValue={addDesigModal.department}
                  placeholder="e.g. Engineering & IT"
                  required
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700">Designation Title *</label>
                <input
                  type="text"
                  name="title"
                  placeholder="e.g. Senior DevOps Architect"
                  required
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700">Code</label>
                  <input
                    type="text"
                    name="code"
                    placeholder="e.g. DEVOPS"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700">Grade / Level</label>
                  <input
                    type="text"
                    name="level"
                    placeholder="e.g. L4 / Executive"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAddDesigModal({ isOpen: false, organizationId: '', department: '' })}
                  className="rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalSubmitting}
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
                >
                  {modalSubmitting ? 'Saving...' : 'Save Designation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Edit Designation Modal */}
      {editDesigModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900">Edit Designation</h3>
              <button onClick={() => setEditDesigModal({ isOpen: false, desig: null })} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            {modalError && (
              <div className="mt-3 rounded-xl bg-rose-50 p-2.5 border border-rose-200 text-xs font-semibold text-rose-700">
                {modalError}
              </div>
            )}
            {modalSuccess && (
              <div className="mt-3 rounded-xl bg-emerald-50 p-2.5 border border-emerald-200 text-xs font-semibold text-emerald-700">
                {modalSuccess}
              </div>
            )}

            <form onSubmit={handleEditDesignation} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700">Designation Title *</label>
                <input
                  type="text"
                  name="title"
                  defaultValue={editDesigModal.desig?.designation || editDesigModal.desig?.title}
                  required
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700">Grade / Level</label>
                  <input
                    type="text"
                    name="level"
                    defaultValue={editDesigModal.desig?.level}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700">Status</label>
                  <select
                    name="status"
                    defaultValue={editDesigModal.desig?.status || 'Active'}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditDesigModal({ isOpen: false, desig: null })}
                  className="rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalSubmitting}
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
                >
                  {modalSubmitting ? 'Updating...' : 'Update Designation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Assign Employee Modal */}
      {assignEmpModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900">
                Assign Employee Structure: {assignEmpModal.emp?.name}
              </h3>
              <button onClick={() => setAssignEmpModal({ isOpen: false, emp: null })} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            {modalError && (
              <div className="mt-3 rounded-xl bg-rose-50 p-2.5 border border-rose-200 text-xs font-semibold text-rose-700">
                {modalError}
              </div>
            )}
            {modalSuccess && (
              <div className="mt-3 rounded-xl bg-emerald-50 p-2.5 border border-emerald-200 text-xs font-semibold text-emerald-700">
                {modalSuccess}
              </div>
            )}

            <form onSubmit={handleAssignEmployee} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700">Organization *</label>
                <select
                  name="organizationId"
                  defaultValue={assignEmpModal.emp?.organizationId || 'org-default'}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800"
                >
                  {organizations.map((o) => (
                    <option key={o.id} value={o.organizationId}>
                      {o.name} ({o.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700">Department *</label>
                <input
                  type="text"
                  name="department"
                  defaultValue={assignEmpModal.emp?.department === 'Unassigned' ? '' : assignEmpModal.emp?.department}
                  placeholder="e.g. Engineering & IT"
                  required
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700">Designation *</label>
                <input
                  type="text"
                  name="designation"
                  defaultValue={assignEmpModal.emp?.designation === 'Unassigned' ? '' : assignEmpModal.emp?.designation}
                  placeholder="e.g. Senior Software Engineer"
                  required
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAssignEmpModal({ isOpen: false, emp: null })}
                  className="rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalSubmitting}
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
                >
                  {modalSubmitting ? 'Saving...' : 'Save Mapping'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. View Details Modal */}
      {viewDetailsModal.isOpen && viewDetailsModal.data && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900">{viewDetailsModal.title}</h3>
              <button onClick={() => setViewDetailsModal({ isOpen: false, type: 'emp', title: '', data: null })} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-2.5 text-xs text-slate-700">
              {viewDetailsModal.type === 'emp' && (
                <>
                  <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600 font-bold text-white text-base">
                      {viewDetailsModal.data.name?.charAt(0)}
                    </div>
                    <div>
                      <p className="font-extrabold text-slate-900 text-sm">{viewDetailsModal.data.name}</p>
                      <span className="font-mono text-[10px] text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded font-bold">
                        {viewDetailsModal.data.employeeId}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-slate-400 block">Department</span>
                      <span className="font-bold text-slate-800">{viewDetailsModal.data.department}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Designation</span>
                      <span className="font-bold text-slate-800">{viewDetailsModal.data.designation}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">System Role</span>
                      <span className="font-bold text-slate-800">{viewDetailsModal.data.role}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Status</span>
                      <span className="font-bold text-emerald-600">{viewDetailsModal.data.status}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Email</span>
                      <span className="font-bold text-slate-800 truncate block">{viewDetailsModal.data.email}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Location</span>
                      <span className="font-bold text-slate-800">{viewDetailsModal.data.location}</span>
                    </div>
                  </div>
                </>
              )}

              {viewDetailsModal.type === 'org' && (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Code:</span>
                    <span className="font-bold font-mono">{viewDetailsModal.data.code}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Industry:</span>
                    <span className="font-bold">{viewDetailsModal.data.industry}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Email:</span>
                    <span className="font-bold">{viewDetailsModal.data.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Phone:</span>
                    <span className="font-bold">{viewDetailsModal.data.phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Location:</span>
                    <span className="font-bold">
                      {viewDetailsModal.data.city}, {viewDetailsModal.data.country}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setViewDetailsModal({ isOpen: false, type: 'emp', title: '', data: null })}
                className="rounded-xl bg-slate-900 px-4 py-1.5 text-xs font-bold text-white hover:bg-slate-800"
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
