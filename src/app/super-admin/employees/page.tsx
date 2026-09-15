'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { SuperAdminLayout } from '@/components/layout/SuperAdminLayout';
import {
  Users,
  Search,
  Filter,
  RefreshCw,
  Building2,
  Plus,
  Briefcase,
  Layers,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  UserX,
  Calendar,
  X,
  Download,
  AlertTriangle,
  CheckCircle2,
  Eye,
  Edit3,
  ShieldCheck,
  ShieldAlert,
  UserPlus,
  MapPin,
  Phone,
  Mail,
  Clock,
  BriefcaseIcon,
} from 'lucide-react';

interface Employee {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string;
  department: string;
  designation: string;
  systemRole: string | null;
  systemRoleTitle: string;
  hasIdentityMappingIssue: boolean;
  mappingIssueReason: string;
  status: string;
  employmentType: string;
  joiningDate: string;
  location: string;
  managerId: string;
  organizationId: string;
  organizationName: string;
  organizationCode: string;
  userId: string | null;
  userStatus: string;
  userLastLogin: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

interface KPIStats {
  totalEmployees: number;
  activeEmployees: number;
  inactiveEmployees: number;
  newEmployees: number;
  totalDepartments: number;
  totalOrganizations: number;
}

interface DirectoryHealth {
  employeesWithoutOrg: number;
  employeesWithoutDept: number;
  employeesWithoutDesig: number;
  employeesWithoutUserAccount: number;
  usersWithoutEmployeeProfile: number;
  roleMappingIssues: number;
  isHealthy: boolean;
}

interface FilterOptions {
  organizations: Array<{ id: string; name: string; code: string }>;
  departments: string[];
  designations: string[];
  roles: string[];
  statuses: string[];
  employmentTypes: string[];
}

export default function SuperAdminEmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [kpi, setKpi] = useState<KPIStats>({
    totalEmployees: 0,
    activeEmployees: 0,
    inactiveEmployees: 0,
    newEmployees: 0,
    totalDepartments: 0,
    totalOrganizations: 0,
  });
  const [health, setHealth] = useState<DirectoryHealth>({
    employeesWithoutOrg: 0,
    employeesWithoutDept: 0,
    employeesWithoutDesig: 0,
    employeesWithoutUserAccount: 0,
    usersWithoutEmployeeProfile: 0,
    roleMappingIssues: 0,
    isHealthy: true,
  });
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    organizations: [],
    departments: [],
    designations: [],
    roles: [],
    statuses: [],
    employmentTypes: [],
  });

  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [orgFilter, setOrgFilter] = useState('All');
  const [deptFilter, setDeptFilter] = useState('All');
  const [desigFilter, setDesigFilter] = useState('All');
  const [roleFilter, setRoleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [empTypeFilter, setEmpTypeFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalEmployees, setTotalEmployees] = useState(0);

  // Modals
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form States
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState('');
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    department: '',
    designation: '',
    organizationId: '',
    joiningDate: '',
    location: '',
    employmentType: 'Full Time',
    status: 'Active',
    managerId: '',
  });

  const [isCreating, setIsCreating] = useState(false);
  const [addError, setAddError] = useState('');
  const [addForm, setAddForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    department: 'Engineering',
    designation: 'Software Engineer',
    role: 'EMPLOYEE',
    organizationId: '',
    salary: '60000',
  });

  const fetchWorkforce = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '15',
        search,
        organizationId: orgFilter,
        department: deptFilter,
        designation: desigFilter,
        role: roleFilter,
        status: statusFilter,
        employmentType: empTypeFilter,
      });

      const res = await fetch(`/api/v1/super-admin/employees?${params.toString()}`);
      if (res.ok) {
        const result = await res.json();
        if (result.success && result.data) {
          setEmployees(result.data.employees || []);
          setKpi(result.data.kpi || {});
          setHealth(result.data.directoryHealth || {});
          setFilterOptions(result.data.filters || {});
          setTotalPages(result.data.pagination?.totalPages || 1);
          setTotalEmployees(result.data.pagination?.total || 0);
        }
      }
    } catch (err) {
      console.error('Error fetching workforce directory:', err);
    } finally {
      setIsLoading(false);
    }
  }, [page, search, orgFilter, deptFilter, desigFilter, roleFilter, statusFilter, empTypeFilter]);

  useEffect(() => {
    fetchWorkforce();
  }, [fetchWorkforce]);

  // CSV Export Trigger
  const handleExportCSV = async () => {
    try {
      const params = new URLSearchParams({
        search,
        organizationId: orgFilter,
        department: deptFilter,
        designation: desigFilter,
        role: roleFilter,
        status: statusFilter,
        employmentType: empTypeFilter,
        export: 'csv',
      });

      window.open(`/api/v1/super-admin/employees?${params.toString()}`, '_blank');
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  // Open Edit Modal
  const openEditModal = (emp: Employee) => {
    setEditingEmployee(emp);
    setEditForm({
      firstName: emp.firstName || '',
      lastName: emp.lastName || '',
      email: emp.email || '',
      phone: emp.phone || '',
      department: emp.department || 'General',
      designation: emp.designation || 'Staff',
      organizationId: emp.organizationId || '',
      joiningDate: emp.joiningDate !== 'N/A' ? emp.joiningDate : '',
      location: emp.location || 'Headquarters',
      employmentType: emp.employmentType || 'Full Time',
      status: emp.status || 'Active',
      managerId: emp.managerId || '',
    });
    setUpdateError('');
  };

  // Save Edit Employee
  const handleUpdateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmployee) return;

    setIsUpdating(true);
    setUpdateError('');

    try {
      const res = await fetch('/api/v1/super-admin/employees', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingEmployee.id,
          ...editForm,
        }),
      });

      const result = await res.json();
      if (res.ok && result.success) {
        setEditingEmployee(null);
        fetchWorkforce();
      } else {
        setUpdateError(result.message || 'Failed to update employee profile.');
      }
    } catch (err: any) {
      setUpdateError(err.message || 'Network error occurred.');
    } finally {
      setIsUpdating(false);
    }
  };

  // Create Employee
  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setAddError('');

    try {
      const res = await fetch('/api/v1/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addForm),
      });

      const result = await res.json();
      if (res.ok && result.success) {
        setShowAddModal(false);
        setAddForm({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          department: 'Engineering',
          designation: 'Software Engineer',
          role: 'EMPLOYEE',
          organizationId: '',
          salary: '60000',
        });
        fetchWorkforce();
      } else {
        setAddError(result.message || 'Failed to provision employee.');
      }
    } catch (err: any) {
      setAddError(err.message || 'Network error occurred.');
    } finally {
      setIsCreating(false);
    }
  };

  // Role Badge Renderer
  const renderRoleBadge = (emp: Employee) => {
    const roleKey = emp.systemRole?.toUpperCase();

    let colorClasses = 'bg-slate-100 text-slate-700 border-slate-200';
    if (roleKey === 'SUPER_ADMIN') {
      colorClasses = 'bg-purple-100 text-purple-800 border-purple-300';
    } else if (roleKey === 'ADMIN') {
      colorClasses = 'bg-blue-100 text-blue-800 border-blue-300';
    } else if (roleKey === 'HR') {
      colorClasses = 'bg-emerald-100 text-emerald-800 border-emerald-300';
    } else if (roleKey === 'MANAGER') {
      colorClasses = 'bg-amber-100 text-amber-800 border-amber-300';
    } else if (roleKey === 'EMPLOYEE') {
      colorClasses = 'bg-slate-100 text-slate-800 border-slate-300';
    } else {
      colorClasses = 'bg-rose-100 text-rose-800 border-rose-300';
    }

    return (
      <div className="flex flex-col gap-1">
        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${colorClasses}`}>
          <ShieldCheck className="h-3 w-3" />
          <span>{emp.systemRoleTitle}</span>
        </span>
        {emp.hasIdentityMappingIssue && (
          <span
            title={emp.mappingIssueReason}
            className="inline-flex items-center gap-1 rounded-md bg-rose-50 px-1.5 py-0.5 text-[9px] font-extrabold text-rose-700 border border-rose-200"
          >
            <AlertTriangle className="h-3 w-3 text-rose-600 shrink-0" />
            <span>Identity Mapping Issue</span>
          </span>
        )}
      </div>
    );
  };

  return (
    <SuperAdminLayout
      pageTitle="Global Workforce & Employee Directory"
      breadcrumbs={[
        { label: 'Executive Dashboard', href: '/super-admin/dashboard' },
        { label: 'Employees', href: '/super-admin/employees' },
      ]}
    >
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-slate-900">Global Workforce Directory</h2>
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-800 border border-emerald-300">
              {totalEmployees} WORKFORCE MEMBERS
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Cross-organization workforce directory, employee profiles, organizational assignments, roles, and employment status
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchWorkforce}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 transition-colors"
          >
            <Download className="h-3.5 w-3.5 text-slate-500" />
            <span>Export Directory</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-4 py-2 text-xs font-bold text-white shadow-md transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>+ Add Employee</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Workforce</p>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900">{kpi.totalEmployees}</span>
            <Users className="h-4 w-4 text-indigo-500" />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Active Employees</p>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-black text-emerald-600">{kpi.activeEmployees}</span>
            <UserCheck className="h-4 w-4 text-emerald-500" />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Inactive / Left</p>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-600">{kpi.inactiveEmployees}</span>
            <UserX className="h-4 w-4 text-slate-400" />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">New (30 Days)</p>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-black text-blue-600">{kpi.newEmployees}</span>
            <Calendar className="h-4 w-4 text-blue-500" />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Departments</p>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-black text-purple-600">{kpi.totalDepartments}</span>
            <Layers className="h-4 w-4 text-purple-500" />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Organizations</p>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-black text-amber-600">{kpi.totalOrganizations}</span>
            <Building2 className="h-4 w-4 text-amber-500" />
          </div>
        </div>
      </div>

      {/* Directory Health & Data Quality Panel */}
      <div className={`rounded-2xl border p-4 shadow-xs transition-all ${
        health.isHealthy ? 'border-emerald-200 bg-emerald-50/40' : 'border-amber-200 bg-amber-50/40'
      }`}>
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2.5">
            {health.isHealthy ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 animate-bounce" />
            )}
            <div>
              <h3 className="text-xs font-extrabold text-slate-900">
                Directory Health & Data Mapping Integrity: {health.isHealthy ? 'Healthy' : 'Action Required'}
              </h3>
              <p className="text-[11px] text-slate-600">
                Verifies canonical linkages between MongoDB <code className="font-bold">users</code> authentication records and <code className="font-bold">employees</code> workforce profiles.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold">
            <span className={`rounded-lg px-2.5 py-1 border ${
              health.roleMappingIssues > 0 ? 'bg-amber-100 text-amber-800 border-amber-300 font-extrabold' : 'bg-white text-slate-700 border-slate-200'
            }`}>
              Role Mapping Issues: {health.roleMappingIssues}
            </span>
            <span className={`rounded-lg px-2.5 py-1 border ${
              health.employeesWithoutUserAccount > 0 ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-white text-slate-700 border-slate-200'
            }`}>
              Employees without User: {health.employeesWithoutUserAccount}
            </span>
            <span className="rounded-lg bg-white px-2.5 py-1 border border-slate-200 text-slate-700">
              Users without Employee Profile: {health.usersWithoutEmployeeProfile}
            </span>
            <span className="rounded-lg bg-white px-2.5 py-1 border border-slate-200 text-slate-700">
              Without Dept: {health.employeesWithoutDept}
            </span>
          </div>
        </div>
      </div>

      {/* Multi-Parameter Search & Filter Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, employee ID (EMPxxxx), email, phone, department, designation, or role..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-4 py-2.5 text-xs font-medium text-slate-800 focus:border-indigo-500 focus:bg-white focus:outline-hidden"
          />
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-6">
          {/* Organization Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Organization</label>
            <select
              value={orgFilter}
              onChange={(e) => { setOrgFilter(e.target.value); setPage(1); }}
              className="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:outline-hidden"
            >
              <option value="All">All Organizations</option>
              {filterOptions.organizations?.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name} ({o.code})
                </option>
              ))}
            </select>
          </div>

          {/* Department Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Department</label>
            <select
              value={deptFilter}
              onChange={(e) => { setDeptFilter(e.target.value); setPage(1); }}
              className="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:outline-hidden"
            >
              <option value="All">All Departments</option>
              {filterOptions.departments?.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* Designation Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Designation</label>
            <select
              value={desigFilter}
              onChange={(e) => { setDesigFilter(e.target.value); setPage(1); }}
              className="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:outline-hidden"
            >
              <option value="All">All Designations</option>
              {filterOptions.designations?.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* System Role Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">System Role</label>
            <select
              value={roleFilter}
              onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
              className="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:outline-hidden"
            >
              <option value="All">All Roles</option>
              <option value="SUPER_ADMIN">Super Admin</option>
              <option value="ADMIN">Admin</option>
              <option value="HR">HR</option>
              <option value="MANAGER">Manager</option>
              <option value="EMPLOYEE">Employee</option>
              <option value="UNASSIGNED">Role Not Assigned</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:outline-hidden"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Pending">Pending</option>
              <option value="Suspended">Suspended</option>
            </select>
          </div>

          {/* Employment Type Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Employment Type</label>
            <select
              value={empTypeFilter}
              onChange={(e) => { setEmpTypeFilter(e.target.value); setPage(1); }}
              className="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:outline-hidden"
            >
              <option value="All">All Types</option>
              <option value="Full Time">Full Time</option>
              <option value="Part Time">Part Time</option>
              <option value="Contract">Contract</option>
              <option value="Intern">Intern</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Employee Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <RefreshCw className="h-8 w-8 animate-spin text-indigo-600" />
            <p className="mt-3 text-xs font-medium text-slate-600">Loading global workforce directory...</p>
          </div>
        ) : employees.length === 0 ? (
          <div className="py-20 text-center text-xs text-slate-500">
            <Users className="mx-auto h-12 w-12 text-slate-300" />
            <p className="mt-3 font-bold text-slate-800 text-sm">No employees found</p>
            <p className="text-slate-400 mt-1">Try resetting your search terms or filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Employee</th>
                  <th className="py-3.5 px-4">ID & Org</th>
                  <th className="py-3.5 px-4">Department & Designation</th>
                  <th className="py-3.5 px-4">System Role</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Joining Date</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Employee Profile */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        {emp.avatar ? (
                          <img
                            src={emp.avatar}
                            alt={emp.fullName}
                            className="h-9 w-9 rounded-full object-cover border border-slate-200 shadow-2xs shrink-0"
                          />
                        ) : (
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 font-bold text-white shadow-2xs text-xs">
                            {emp.fullName.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-slate-900 text-xs">{emp.fullName}</p>
                          <p className="text-[11px] text-slate-500">{emp.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Employee ID & Organization */}
                    <td className="py-3 px-4">
                      <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                        {emp.employeeId}
                      </span>
                      <div className="flex items-center gap-1 text-[10px] text-slate-500 mt-1">
                        <Building2 className="h-3 w-3 text-slate-400" />
                        <span className="font-semibold text-slate-700">{emp.organizationName}</span>
                        <span className="font-mono text-[9px] text-slate-400">({emp.organizationCode})</span>
                      </div>
                    </td>

                    {/* Department & Designation */}
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900">{emp.department}</p>
                      <p className="text-[11px] text-slate-500">{emp.designation}</p>
                    </td>

                    {/* System Role (Derived from users.role) */}
                    <td className="py-3 px-4">
                      {renderRoleBadge(emp)}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${
                          emp.status === 'Active'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${emp.status === 'Active' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                        {emp.status}
                      </span>
                    </td>

                    {/* Joining Date */}
                    <td className="py-3 px-4 text-slate-600 text-[11px] font-mono">
                      {emp.joiningDate}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedEmployee(emp)}
                          title="View Profile"
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-indigo-600 transition-colors"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(emp)}
                          title="Edit Profile"
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-indigo-600 transition-colors"
                        >
                          <Edit3 className="h-4 w-4" />
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
          <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/50 px-4 py-3 text-xs">
            <span className="text-slate-500 font-medium">
              Showing <strong className="text-slate-900">{((page - 1) * 15) + 1}</strong> to <strong className="text-slate-900">{Math.min(page * 15, totalEmployees)}</strong> of <strong className="text-slate-900">{totalEmployees}</strong> employees
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Previous
              </button>
              <span className="font-bold text-slate-700">Page {page} of {totalPages}</span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Next
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* View Employee Details Modal */}
      {selectedEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-indigo-600" />
                <h3 className="text-base font-extrabold text-slate-900">Employee Profile Overview</h3>
              </div>
              <button onClick={() => setSelectedEmployee(null)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex items-center gap-4 rounded-xl bg-slate-50 p-4 border border-slate-200">
              {selectedEmployee.avatar ? (
                <img src={selectedEmployee.avatar} alt={selectedEmployee.fullName} className="h-16 w-16 rounded-full object-cover border-2 border-indigo-500 shadow-md" />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-xl font-bold text-white shadow-md">
                  {selectedEmployee.fullName.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <h4 className="text-base font-extrabold text-slate-900">{selectedEmployee.fullName}</h4>
                <p className="text-xs font-medium text-slate-500">{selectedEmployee.designation} &bull; {selectedEmployee.department}</p>
                <div className="mt-1.5 flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                    {selectedEmployee.employeeId}
                  </span>
                  {renderRoleBadge(selectedEmployee)}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-xl border border-slate-200 p-3 bg-white space-y-1">
                <p className="text-slate-400 font-bold uppercase text-[10px]">Contact Details</p>
                <p className="font-semibold text-slate-800 flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-slate-400" /> {selectedEmployee.email}</p>
                <p className="font-semibold text-slate-800 flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-slate-400" /> {selectedEmployee.phone}</p>
                <p className="font-semibold text-slate-800 flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-slate-400" /> {selectedEmployee.location}</p>
              </div>

              <div className="rounded-xl border border-slate-200 p-3 bg-white space-y-1">
                <p className="text-slate-400 font-bold uppercase text-[10px]">Organizational Mapping</p>
                <p className="font-semibold text-slate-800 flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5 text-slate-400" /> {selectedEmployee.organizationName} ({selectedEmployee.organizationCode})</p>
                <p className="font-semibold text-slate-800 flex items-center gap-1.5"><BriefcaseIcon className="h-3.5 w-3.5 text-slate-400" /> Employment Type: {selectedEmployee.employmentType}</p>
                <p className="font-semibold text-slate-800 flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-slate-400" /> Joining Date: {selectedEmployee.joiningDate}</p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 p-3 bg-slate-50 text-xs space-y-1.5">
              <p className="text-slate-500 font-bold uppercase text-[10px]">User Account Audit Telemetry</p>
              <div className="grid grid-cols-2 gap-2 text-slate-700">
                <p>Associated User ID: <span className="font-mono font-bold">{selectedEmployee.userId || 'No Login Account'}</span></p>
                <p>System User Role: <span className="font-bold">{selectedEmployee.systemRoleTitle}</span></p>
                <p>Account Status: <span className="font-bold">{selectedEmployee.userStatus}</span></p>
                <p>Last Active Login: <span className="font-mono">{selectedEmployee.userLastLogin}</span></p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t">
              <button
                onClick={() => {
                  const emp = selectedEmployee;
                  setSelectedEmployee(null);
                  openEditModal(emp);
                }}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <Edit3 className="h-3.5 w-3.5 text-slate-500" />
                <span>Edit Profile</span>
              </button>

              <button
                onClick={() => setSelectedEmployee(null)}
                className="rounded-xl bg-slate-900 hover:bg-slate-800 px-5 py-2 text-xs font-bold text-white transition-colors"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Employee Modal */}
      {editingEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <Edit3 className="h-5 w-5 text-indigo-600" />
                <h3 className="text-base font-extrabold text-slate-900">Edit Employee Profile</h3>
              </div>
              <button onClick={() => setEditingEmployee(null)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            {updateError && (
              <div className="rounded-xl bg-rose-50 p-3 text-xs font-semibold text-rose-700 border border-rose-200">
                {updateError}
              </div>
            )}

            <form onSubmit={handleUpdateEmployee} className="space-y-3 text-xs font-medium">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 font-bold text-slate-700">First Name</label>
                  <input
                    type="text"
                    required
                    value={editForm.firstName}
                    onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 font-semibold text-slate-800 focus:border-indigo-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block mb-1 font-bold text-slate-700">Last Name</label>
                  <input
                    type="text"
                    required
                    value={editForm.lastName}
                    onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 font-semibold text-slate-800 focus:border-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 font-bold text-slate-700">Email Address</label>
                  <input
                    type="email"
                    required
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 font-semibold text-slate-800 focus:border-indigo-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block mb-1 font-bold text-slate-700">Phone Number</label>
                  <input
                    type="text"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 font-semibold text-slate-800 focus:border-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 font-bold text-slate-700">Department</label>
                  <input
                    type="text"
                    value={editForm.department}
                    onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 font-semibold text-slate-800 focus:border-indigo-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block mb-1 font-bold text-slate-700">Designation</label>
                  <input
                    type="text"
                    value={editForm.designation}
                    onChange={(e) => setEditForm({ ...editForm, designation: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 font-semibold text-slate-800 focus:border-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 font-bold text-slate-700">Employment Status</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 font-semibold text-slate-800 focus:border-indigo-500 focus:outline-hidden"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Pending">Pending</option>
                    <option value="Suspended">Suspended</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-1 font-bold text-slate-700">Employment Type</label>
                  <select
                    value={editForm.employmentType}
                    onChange={(e) => setEditForm({ ...editForm, employmentType: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 font-semibold text-slate-800 focus:border-indigo-500 focus:outline-hidden"
                  >
                    <option value="Full Time">Full Time</option>
                    <option value="Part Time">Part Time</option>
                    <option value="Contract">Contract</option>
                    <option value="Intern">Intern</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setEditingEmployee(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-5 py-2 text-xs font-bold text-white shadow-md transition-colors disabled:opacity-50"
                >
                  {isUpdating ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : null}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Employee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-indigo-600" />
                <h3 className="text-base font-extrabold text-slate-900">Provision New Employee Record</h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            {addError && (
              <div className="rounded-xl bg-rose-50 p-3 text-xs font-semibold text-rose-700 border border-rose-200">
                {addError}
              </div>
            )}

            <form onSubmit={handleCreateEmployee} className="space-y-3 text-xs font-medium">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 font-bold text-slate-700">First Name *</label>
                  <input
                    type="text"
                    required
                    value={addForm.firstName}
                    onChange={(e) => setAddForm({ ...addForm, firstName: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 font-semibold text-slate-800 focus:border-indigo-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block mb-1 font-bold text-slate-700">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={addForm.lastName}
                    onChange={(e) => setAddForm({ ...addForm, lastName: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 font-semibold text-slate-800 focus:border-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 font-bold text-slate-700">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={addForm.email}
                    onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 font-semibold text-slate-800 focus:border-indigo-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block mb-1 font-bold text-slate-700">Phone Number</label>
                  <input
                    type="text"
                    value={addForm.phone}
                    onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 font-semibold text-slate-800 focus:border-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 font-bold text-slate-700">Department</label>
                  <input
                    type="text"
                    value={addForm.department}
                    onChange={(e) => setAddForm({ ...addForm, department: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 font-semibold text-slate-800 focus:border-indigo-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block mb-1 font-bold text-slate-700">Designation</label>
                  <input
                    type="text"
                    value={addForm.designation}
                    onChange={(e) => setAddForm({ ...addForm, designation: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 font-semibold text-slate-800 focus:border-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 font-bold text-slate-700">System Role</label>
                  <select
                    value={addForm.role}
                    onChange={(e) => setAddForm({ ...addForm, role: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 font-semibold text-slate-800 focus:border-indigo-500 focus:outline-hidden"
                  >
                    <option value="EMPLOYEE">EMPLOYEE</option>
                    <option value="MANAGER">MANAGER</option>
                    <option value="HR">HR</option>
                    <option value="ADMIN">ADMIN</option>
                    <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-1 font-bold text-slate-700">Monthly Salary (₹)</label>
                  <input
                    type="number"
                    value={addForm.salary}
                    onChange={(e) => setAddForm({ ...addForm, salary: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 font-semibold text-slate-800 focus:border-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-5 py-2 text-xs font-bold text-white shadow-md transition-colors disabled:opacity-50"
                >
                  {isCreating ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : null}
                  <span>Create Employee Record</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </SuperAdminLayout>
  );
}
