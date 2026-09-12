'use client';

import React, { useState } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { useEmsStore } from '@/store/emsStore';
import {
  Building2,
  Layers,
  MapPin,
  Network,
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
  Search,
  Filter,
  AlertCircle,
} from 'lucide-react';

import { Department, Designation, Location } from '@/types/admin';
import { AddDepartmentModal } from '@/components/modals/AddDepartmentModal';
import { EditDepartmentModal } from '@/components/modals/EditDepartmentModal';
import { AddDesignationModal } from '@/components/modals/AddDesignationModal';
import { EditDesignationModal } from '@/components/modals/EditDesignationModal';
import { AddLocationModal } from '@/components/modals/AddLocationModal';
import { EditLocationModal } from '@/components/modals/EditLocationModal';
import { DeleteConfirmModal } from '@/components/modals/DeleteConfirmModal';
import { OrgHierarchyTree } from '@/components/organization/OrgHierarchyTree';

export default function OrganizationPage() {
  const {
    state,
    addDepartment,
    updateDepartment,
    deleteDepartment,
    addDesignation,
    updateDesignation,
    deleteDesignation,
    addLocation,
    updateLocation,
    deleteLocation,
  } = useEmsStore();

  const [activeTab, setActiveTab] = useState<'departments' | 'designations' | 'locations' | 'hierarchy'>('departments');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Search and Filter States
  const [deptSearch, setDeptSearch] = useState('');
  const [deptStatusFilter, setDeptStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');

  const [desgSearch, setDesgSearch] = useState('');
  const [desgDeptFilter, setDesgDeptFilter] = useState<string>('All');
  const [desgStatusFilter, setDesgStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');

  const [locSearch, setLocSearch] = useState('');
  const [locStatusFilter, setLocStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');

  // Modal States
  const [isAddDeptOpen, setIsAddDeptOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);

  const [isAddDesgOpen, setIsAddDesgOpen] = useState(false);
  const [editingDesg, setEditingDesg] = useState<Designation | null>(null);

  const [isAddLocOpen, setIsAddLocOpen] = useState(false);
  const [editingLoc, setEditingLoc] = useState<Location | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    name: string;
    type: 'department' | 'designation' | 'location';
    assignedCount: number;
  } | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const departments = state.departments || [];
  const designations = state.designations || [];
  const locations = state.locations || [];
  const employees = state.employees || [];

  // Filtered Lists
  const filteredDepartments = departments.filter((d) => {
    const matchesSearch =
      d.name.toLowerCase().includes(deptSearch.toLowerCase()) ||
      d.code.toLowerCase().includes(deptSearch.toLowerCase()) ||
      d.head.toLowerCase().includes(deptSearch.toLowerCase());
    const matchesStatus = deptStatusFilter === 'All' || d.status === deptStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredDesignations = designations.filter((d) => {
    const matchesSearch =
      d.title.toLowerCase().includes(desgSearch.toLowerCase()) ||
      d.code.toLowerCase().includes(desgSearch.toLowerCase());
    const matchesDept = desgDeptFilter === 'All' || d.department.toLowerCase() === desgDeptFilter.toLowerCase();
    const matchesStatus = desgStatusFilter === 'All' || (d.status || 'Active') === desgStatusFilter;
    return matchesSearch && matchesDept && matchesStatus;
  });

  const filteredLocations = locations.filter((l) => {
    const matchesSearch =
      l.name.toLowerCase().includes(locSearch.toLowerCase()) ||
      l.code.toLowerCase().includes(locSearch.toLowerCase()) ||
      l.city.toLowerCase().includes(locSearch.toLowerCase()) ||
      l.country.toLowerCase().includes(locSearch.toLowerCase());
    const matchesStatus = locStatusFilter === 'All' || (l.status || 'Active') === locStatusFilter;
    return matchesSearch && matchesStatus;
  });

  // Handle Delete Confirmation
  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    const { id, name, type } = deleteTarget;

    let result = { success: true, message: '' };
    if (type === 'department') {
      result = deleteDepartment(id);
    } else if (type === 'designation') {
      result = deleteDesignation(id);
    } else if (type === 'location') {
      result = deleteLocation(id);
    }

    if (result.success) {
      showToast(result.message);
    }
    setDeleteTarget(null);
  };

  return (
    <AdminLayout
      pageTitle="Organization Management"
      breadcrumbs={[{ label: 'Organization', href: '/admin/organization' }]}
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed right-6 top-20 z-50 flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-xs text-white shadow-2xl animate-fade-in border border-slate-700">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Organization Structure</h2>
          <p className="text-xs text-slate-500">
            Manage company departments, job designations, office locations, and multi-tier reporting tree
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsAddDeptOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-md hover:bg-blue-700 transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>+ Add Department</span>
          </button>

          <button
            onClick={() => setIsAddDesgOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-purple-600 px-3.5 py-2 text-xs font-semibold text-white shadow-md hover:bg-purple-700 transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>+ Add Designation</span>
          </button>

          <button
            onClick={() => setIsAddLocOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-md hover:bg-emerald-700 transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>+ Add Location</span>
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200 bg-white rounded-xl p-1 shadow-2xs text-xs font-semibold text-slate-600 overflow-x-auto">
        {[
          { key: 'departments', label: `Departments (${departments.length})`, icon: Building2 },
          { key: 'designations', label: `Designations (${designations.length})`, icon: Layers },
          { key: 'locations', label: `Locations (${locations.length})`, icon: MapPin },
          { key: 'hierarchy', label: 'Organization Hierarchy', icon: Network },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2.5 transition-all whitespace-nowrap ${
                activeTab === tab.key
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: DEPARTMENTS */}
      {activeTab === 'departments' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search department name, code, head..."
                value={deptSearch}
                onChange={(e) => setDeptSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2 text-xs font-medium text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                <Filter className="h-3.5 w-3.5 text-slate-400" /> Status:
              </span>
              <select
                value={deptStatusFilter}
                onChange={(e) => setDeptStatusFilter(e.target.value as any)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 focus:border-blue-500 focus:bg-white"
              >
                <option value="All">All Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* Department Cards Grid */}
          {filteredDepartments.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-xs text-slate-500">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 mx-auto">
                <Building2 className="h-6 w-6" />
              </div>
              <h4 className="mt-3 text-sm font-bold text-slate-800">No departments match your query</h4>
              <p className="mt-1 max-w-xs mx-auto text-xs text-slate-500">
                Try adjusting your search criteria or click &quot;+ Add Department&quot; above.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredDepartments.map((dept) => (
                <div
                  key={dept.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs hover:border-slate-300 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700 font-extrabold text-xs border border-blue-100 shrink-0">
                          {dept.code}
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-slate-900">{dept.name}</h3>
                          <p className="text-[10px] text-slate-500">
                            Head: <span className="font-semibold text-slate-700">{dept.head}</span>
                          </p>
                        </div>
                      </div>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold border ${
                          dept.status === 'Active'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        {dept.status}
                      </span>
                    </div>

                    <p className="mt-3 text-xs text-slate-600 line-clamp-2">{dept.description || 'Department unit'}</p>
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
                    <span className="font-bold text-slate-900">{dept.employeeCount} Employees</span>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setEditingDept(dept)}
                        className="flex items-center gap-1 font-semibold text-blue-600 hover:text-blue-800"
                      >
                        <Edit className="h-3.5 w-3.5" /> Edit
                      </button>
                      <button
                        onClick={() =>
                          setDeleteTarget({
                            id: dept.id,
                            name: dept.name,
                            type: 'department',
                            assignedCount: dept.employeeCount,
                          })
                        }
                        className="flex items-center gap-1 font-semibold text-rose-600 hover:text-rose-800"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: DESIGNATIONS */}
      {activeTab === 'designations' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search designation title or code..."
                value={desgSearch}
                onChange={(e) => setDesgSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2 text-xs font-medium text-slate-900 focus:border-purple-500 focus:bg-white focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Department:</span>
              <select
                value={desgDeptFilter}
                onChange={(e) => setDesgDeptFilter(e.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 focus:border-purple-500 focus:bg-white"
              >
                <option value="All">All Departments</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.name}>
                    {d.name}
                  </option>
                ))}
              </select>

              <span className="text-xs font-semibold text-slate-500 ml-2">Status:</span>
              <select
                value={desgStatusFilter}
                onChange={(e) => setDesgStatusFilter(e.target.value as any)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 focus:border-purple-500 focus:bg-white"
              >
                <option value="All">All Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* Designations Table */}
          {filteredDesignations.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-xs text-slate-500">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 text-purple-600 mx-auto">
                <Layers className="h-6 w-6" />
              </div>
              <h4 className="mt-3 text-sm font-bold text-slate-800">No designations found</h4>
              <p className="mt-1 max-w-xs mx-auto text-xs text-slate-500">
                Click &quot;+ Add Designation&quot; above to create employee titles.
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/80 text-slate-500">
                    <th className="px-4 py-3 font-semibold">Designation Title</th>
                    <th className="px-4 py-3 font-semibold">Code</th>
                    <th className="px-4 py-3 font-semibold">Department</th>
                    <th className="px-4 py-3 font-semibold">Grade Level</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Employees</th>
                    <th className="px-4 py-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredDesignations.map((des) => (
                    <tr key={des.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-4 py-3 font-bold text-slate-900">{des.title}</td>
                      <td className="px-4 py-3 font-mono font-bold text-slate-600">{des.code}</td>
                      <td className="px-4 py-3 text-slate-700 font-medium">{des.department}</td>
                      <td className="px-4 py-3">
                        <span className="rounded bg-purple-50 px-2 py-0.5 text-[10px] font-extrabold text-purple-700 border border-purple-200 font-mono">
                          {des.level || 'L3'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold border ${
                            (des.status || 'Active') === 'Active'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          {des.status || 'Active'}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-900">{des.employeeCount} Staff</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setEditingDesg(des)}
                            className="flex items-center gap-1 font-semibold text-blue-600 hover:text-blue-800"
                          >
                            <Edit className="h-3.5 w-3.5" /> Edit
                          </button>
                          <button
                            onClick={() =>
                              setDeleteTarget({
                                id: des.id,
                                name: des.title,
                                type: 'designation',
                                assignedCount: des.employeeCount,
                              })
                            }
                            className="flex items-center gap-1 font-semibold text-rose-600 hover:text-rose-800"
                          >
                            <Trash2 className="h-3.5 w-3.5" /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: LOCATIONS */}
      {activeTab === 'locations' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search location name, code, city..."
                value={locSearch}
                onChange={(e) => setLocSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2 text-xs font-medium text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                <Filter className="h-3.5 w-3.5 text-slate-400" /> Status:
              </span>
              <select
                value={locStatusFilter}
                onChange={(e) => setLocStatusFilter(e.target.value as any)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 focus:border-emerald-500 focus:bg-white"
              >
                <option value="All">All Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* Location Cards */}
          {filteredLocations.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-xs text-slate-500">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 mx-auto">
                <MapPin className="h-6 w-6" />
              </div>
              <h4 className="mt-3 text-sm font-bold text-slate-800">No company locations found</h4>
              <p className="mt-1 max-w-xs mx-auto text-xs text-slate-500">
                Click &quot;+ Add Location&quot; above to configure office branches.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredLocations.map((loc) => (
                <div
                  key={loc.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs hover:border-slate-300 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 shrink-0 border border-emerald-100">
                          <MapPin className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-slate-900">{loc.name}</h3>
                          <p className="text-xs text-slate-500">
                            {loc.city}, {loc.country}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold border ${
                          (loc.status || 'Active') === 'Active'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        {loc.status || 'Active'}
                      </span>
                    </div>

                    {loc.address && (
                      <p className="mt-3 text-xs text-slate-600 line-clamp-2">{loc.address}</p>
                    )}
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
                    <span className="font-mono font-bold text-slate-600">Code: {loc.code}</span>
                    <span className="font-bold text-blue-600">{loc.employeeCount} Staff</span>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setEditingLoc(loc)}
                        className="flex items-center gap-1 font-semibold text-blue-600 hover:text-blue-800"
                      >
                        <Edit className="h-3.5 w-3.5" /> Edit
                      </button>
                      <button
                        onClick={() =>
                          setDeleteTarget({
                            id: loc.id,
                            name: loc.name,
                            type: 'location',
                            assignedCount: loc.employeeCount,
                          })
                        }
                        className="flex items-center gap-1 font-semibold text-rose-600 hover:text-rose-800"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: HIERARCHY DIAGRAM */}
      {activeTab === 'hierarchy' && (
        <OrgHierarchyTree
          companyName={state.company.name || 'Infinitive Cloud Enterprise Solutions'}
          departments={departments}
          designations={designations}
          employees={employees}
        />
      )}

      {/* MODALS */}

      {/* 1. Add Department Modal */}
      <AddDepartmentModal
        isOpen={isAddDeptOpen}
        onClose={() => setIsAddDeptOpen(false)}
        employees={employees}
        onSave={(dept) => {
          addDepartment(dept);
          showToast(`Department "${dept.name}" created successfully!`);
        }}
      />

      {/* 2. Edit Department Modal */}
      <EditDepartmentModal
        isOpen={!!editingDept}
        onClose={() => setEditingDept(null)}
        department={editingDept}
        employees={employees}
        onSave={(id, updated) => {
          updateDepartment(id, updated);
          showToast(`Department "${updated.name || 'record'}" updated successfully!`);
        }}
      />

      {/* 3. Add Designation Modal */}
      <AddDesignationModal
        isOpen={isAddDesgOpen}
        onClose={() => setIsAddDesgOpen(false)}
        departments={departments}
        onSave={(desg) => {
          addDesignation(desg);
          showToast(`Designation "${desg.title}" created successfully!`);
        }}
      />

      {/* 4. Edit Designation Modal */}
      <EditDesignationModal
        isOpen={!!editingDesg}
        onClose={() => setEditingDesg(null)}
        designation={editingDesg}
        departments={departments}
        onSave={(id, updated) => {
          updateDesignation(id, updated);
          showToast(`Designation "${updated.title || 'record'}" updated successfully!`);
        }}
      />

      {/* 5. Add Location Modal */}
      <AddLocationModal
        isOpen={isAddLocOpen}
        onClose={() => setIsAddLocOpen(false)}
        onSave={(loc) => {
          addLocation(loc);
          showToast(`Location "${loc.name}" created successfully!`);
        }}
      />

      {/* 6. Edit Location Modal */}
      <EditLocationModal
        isOpen={!!editingLoc}
        onClose={() => setEditingLoc(null)}
        location={editingLoc}
        onSave={(id, updated) => {
          updateLocation(id, updated);
          showToast(`Location "${updated.name || 'record'}" updated successfully!`);
        }}
      />

      {/* 7. Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        title={`Delete ${deleteTarget?.type}`}
        itemName={deleteTarget?.name || ''}
        itemType={deleteTarget?.type || 'department'}
        assignedEmployeeCount={deleteTarget?.assignedCount || 0}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
      />
    </AdminLayout>
  );
}
