'use client';

import React, { useState } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { useEmsStore } from '@/store/emsStore';
import { Employee, EmploymentStatus } from '@/types/admin';
import { AddEmployeeModal } from '@/components/employees/AddEmployeeModal';
import { ImportEmployeesModal } from '@/components/employees/ImportEmployeesModal';
import {
  Search,
  Filter,
  UserPlus,
  FileSpreadsheet,
  Eye,
  Lock,
  X,
  CheckCircle2,
  Trash2,
  Sparkles,
  FileText,
  ShieldCheck,
} from 'lucide-react';

export default function EmployeesPage() {
  const {
    state,
    addEmployee,
    deactivateEmployee,
    importEmployees,
  } = useEmsStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'personal' | 'employment' | 'emergency' | 'bank' | 'govt' | 'documents'>('personal');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const departmentNames = state.departments.map((d) => d.name);
  const designationNames = state.designations.map((d) => d.title);
  const existingEmployeeIds = new Set(state.employees.map((e) => e.employeeId.trim().toLowerCase()));

  const filteredEmployees = state.employees.filter((emp) => {
    const matchesSearch =
      emp.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = selectedDept === 'All' || emp.department === selectedDept;
    const matchesStatus = selectedStatus === 'All' || emp.status === selectedStatus;
    return matchesSearch && matchesDept && matchesStatus;
  });

  const getStatusBadge = (status: EmploymentStatus) => {
    switch (status) {
      case 'Active':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Probation':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'On Leave':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Suspended':
      case 'Terminated':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'Resigned':
      case 'Former Employee':
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getInitials = (emp: Employee) => {
    const f = emp.firstName.trim().charAt(0).toUpperCase();
    const l = emp.lastName.trim().charAt(0).toUpperCase();
    return f && l ? `${f}${l}` : f || 'EMP';
  };

  return (
    <AdminLayout
      pageTitle="Employee Management"
      breadcrumbs={[{ label: 'Employees', href: '/admin/employees' }]}
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed right-6 top-20 z-50 flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs text-white shadow-xl animate-fade-in border border-slate-700">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Action Header Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Employee Master Directory</h2>
          <p className="text-xs text-slate-500">
            Source of Truth for organization staff ({filteredEmployees.length} total registered)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700 active:scale-95 transition-all cursor-pointer"
          >
            <UserPlus className="h-4 w-4" />
            <span>Add New Employee</span>
          </button>
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-3.5 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 transition-all cursor-pointer"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
            <span>Import CSV</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, ID, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none font-medium"
          />
        </div>

        {/* Department Filter */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 focus:border-indigo-500 focus:outline-none font-semibold"
          >
            <option value="All">All Departments</option>
            {departmentNames.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 focus:border-indigo-500 focus:outline-none font-semibold"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Probation">Probation</option>
            <option value="On Leave">On Leave</option>
            <option value="Terminated">Terminated</option>
          </select>
        </div>
      </div>

      {/* Employees Data Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        {filteredEmployees.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500">
                  <th className="px-4 py-3.5 font-bold uppercase tracking-wider">Employee</th>
                  <th className="px-4 py-3.5 font-bold uppercase tracking-wider">Department & Role</th>
                  <th className="px-4 py-3.5 font-bold uppercase tracking-wider">Location</th>
                  <th className="px-4 py-3.5 font-bold uppercase tracking-wider">Joining Date</th>
                  <th className="px-4 py-3.5 font-bold uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3.5 font-bold uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEmployees.map((emp) => (
                  <tr key={emp.id} className="transition-colors hover:bg-slate-50/60">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        {emp.avatar ? (
                          <img
                            src={emp.avatar}
                            alt={emp.firstName}
                            className="h-9 w-9 rounded-full object-cover ring-2 ring-indigo-500/20 shadow-xs shrink-0"
                          />
                        ) : (
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-600 font-extrabold text-white text-xs shadow-xs">
                            {getInitials(emp)}
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-slate-900">
                            {emp.firstName} {emp.lastName}
                          </p>
                          <p className="text-[10px] text-slate-400 font-mono">{emp.employeeId} • {emp.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="font-bold text-slate-800">{emp.designation}</p>
                      <p className="text-[10px] text-slate-400">{emp.department}</p>
                    </td>
                    <td className="px-4 py-3.5 text-slate-700 font-medium">{emp.location}</td>
                    <td className="px-4 py-3.5 text-slate-700 font-medium">{emp.joiningDate}</td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${getStatusBadge(
                          emp.status
                        )}`}
                      >
                        {emp.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setSelectedEmployee(emp)}
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                          title="View Full Profile"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            deactivateEmployee(emp.id);
                            showToast(`Deactivated employee ${emp.firstName} ${emp.lastName}`);
                          }}
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                          title="Deactivate Employee"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-slate-500">
            No employees registered yet. Click &quot;Add New Employee&quot; or &quot;Import CSV&quot; to populate your database.
          </div>
        )}
      </div>

      {/* ADD EMPLOYEE MODAL */}
      <AddEmployeeModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={(newEmp) => {
          const res = addEmployee(newEmp);
          if (res.success) {
            showToast(res.message);
          }
          return res;
        }}
        departments={departmentNames}
        designations={designationNames}
      />

      {/* IMPORT EMPLOYEES MODAL */}
      <ImportEmployeesModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onConfirmImport={(incoming) => {
          const res = importEmployees(incoming);
          showToast(res.message);
          return res;
        }}
        existingEmployeeIds={existingEmployeeIds}
      />

      {/* VIEW PROFILE & EXTRACTED PHOTO MODAL */}
      {selectedEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl animate-fade-in text-xs">
            {/* Header with Photo & Source Badge */}
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-950 p-4 text-white">
              <div className="flex items-center gap-3">
                {selectedEmployee.avatar ? (
                  <img
                    src={selectedEmployee.avatar}
                    alt={selectedEmployee.firstName}
                    className="h-12 w-12 rounded-full object-cover ring-2 ring-indigo-500/40 shadow-md"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600 font-extrabold text-white text-base ring-2 ring-white/20 shadow-md">
                    {getInitials(selectedEmployee)}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold">
                      {selectedEmployee.firstName} {selectedEmployee.lastName}
                    </h3>
                    <span className="flex items-center gap-1 rounded-md bg-indigo-500/20 px-2 py-0.5 text-[10px] font-bold text-indigo-300 border border-indigo-500/30">
                      <Sparkles className="h-3 w-3 text-indigo-400" />
                      {selectedEmployee.profilePhoto?.source === 'document-extraction'
                        ? 'Photo from identity document'
                        : 'Uploaded profile photo'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">
                    {selectedEmployee.employeeId} • {selectedEmployee.designation} ({selectedEmployee.department})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedEmployee(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex border-b border-slate-200 bg-slate-50 px-4 text-xs font-semibold overflow-x-auto">
              {[
                { key: 'personal', label: 'Personal Info' },
                { key: 'employment', label: 'Employment' },
                { key: 'emergency', label: 'Emergency Contact' },
                { key: 'bank', label: 'Bank Details' },
                { key: 'govt', label: 'Govt Identity' },
                { key: 'documents', label: 'Identity Documents' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`border-b-2 px-4 py-3 transition-colors whitespace-nowrap ${
                    activeTab === tab.key
                      ? 'border-indigo-600 text-indigo-600 font-bold'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="p-6 text-xs text-slate-700">
              {activeTab === 'personal' && (
                <div className="grid grid-cols-2 gap-4">
                  <div><span className="font-bold text-slate-900">Date of Birth:</span> {selectedEmployee.dateOfBirth}</div>
                  <div><span className="font-bold text-slate-900">Gender:</span> {selectedEmployee.gender}</div>
                  <div><span className="font-bold text-slate-900">Blood Group:</span> {selectedEmployee.bloodGroup}</div>
                  <div><span className="font-bold text-slate-900">Phone:</span> {selectedEmployee.phone}</div>
                  <div className="col-span-2"><span className="font-bold text-slate-900">Address:</span> {selectedEmployee.address}, {selectedEmployee.city}, {selectedEmployee.state}, {selectedEmployee.country}</div>
                </div>
              )}

              {activeTab === 'employment' && (
                <div className="grid grid-cols-2 gap-4">
                  <div><span className="font-bold text-slate-900">Department:</span> {selectedEmployee.department}</div>
                  <div><span className="font-bold text-slate-900">Designation:</span> {selectedEmployee.designation}</div>
                  <div><span className="font-bold text-slate-900">Reporting Manager:</span> {selectedEmployee.manager}</div>
                  <div><span className="font-bold text-slate-900">Location:</span> {selectedEmployee.location}</div>
                  <div><span className="font-bold text-slate-900">Shift:</span> {selectedEmployee.shift}</div>
                  <div><span className="font-bold text-slate-900">Grade:</span> {selectedEmployee.grade}</div>
                </div>
              )}

              {activeTab === 'emergency' && (
                <div className="grid grid-cols-2 gap-4">
                  <div><span className="font-bold text-slate-900">Contact Person:</span> {selectedEmployee.emergencyContactName}</div>
                  <div><span className="font-bold text-slate-900">Relationship:</span> {selectedEmployee.emergencyRelationship}</div>
                  <div><span className="font-bold text-slate-900">Phone:</span> {selectedEmployee.emergencyPhone}</div>
                  <div className="col-span-2"><span className="font-bold text-slate-900">Address:</span> {selectedEmployee.emergencyAddress}</div>
                </div>
              )}

              {activeTab === 'bank' && (
                <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4">
                  <div className="flex items-center gap-2 font-bold text-amber-900 mb-2">
                    <Lock className="h-4 w-4 text-amber-600" />
                    <span>Confidential Bank Information</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-slate-800">
                    <div><span className="font-bold">Bank Name:</span> {selectedEmployee.bankName}</div>
                    <div><span className="font-bold">Account Number:</span> {selectedEmployee.accountNumber}</div>
                    <div><span className="font-bold">IFSC Code:</span> {selectedEmployee.ifscCode}</div>
                    <div><span className="font-bold">Account Holder:</span> {selectedEmployee.accountHolder}</div>
                  </div>
                </div>
              )}

              {activeTab === 'govt' && (
                <div className="grid grid-cols-2 gap-4">
                  <div><span className="font-bold text-slate-900">PAN Number:</span> {selectedEmployee.panNumber}</div>
                  <div><span className="font-bold text-slate-900">Aadhaar Number:</span> {selectedEmployee.aadhaarNo}</div>
                  <div><span className="font-bold text-slate-900">Passport Number:</span> {selectedEmployee.passportNo}</div>
                </div>
              )}

              {activeTab === 'documents' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b pb-2">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-indigo-600" />
                      <span className="font-bold text-slate-900">Identity Document (Source)</span>
                    </div>
                    <span className="rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                      Verified
                    </span>
                  </div>
                  <p className="text-slate-500 text-xs">
                    Original identity document uploaded during onboarding. Profile photograph was extracted from this file.
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end border-t border-slate-100 p-4">
              <button
                onClick={() => setSelectedEmployee(null)}
                className="rounded-xl bg-slate-950 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-slate-900"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
