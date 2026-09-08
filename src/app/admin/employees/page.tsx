'use client';

import React, { useState } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { mockEmployees } from '@/data/employees';
import { Employee, EmploymentStatus } from '@/types/admin';
import {
  Search,
  Filter,
  UserPlus,
  Download,
  Eye,
  Edit,
  Trash2,
  Lock,
  ChevronLeft,
  ChevronRight,
  X,
  CheckCircle2,
  ShieldAlert,
} from 'lucide-react';

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>(mockEmployees);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'personal' | 'employment' | 'emergency' | 'bank' | 'govt'>('personal');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const filteredEmployees = employees.filter((emp) => {
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

  return (
    <AdminLayout
      pageTitle="Employee Management"
      breadcrumbs={[{ label: 'Employees', href: '/admin/employees' }]}
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed right-6 top-20 z-50 flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs text-white shadow-xl">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Action Header Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Employee Directory</h2>
          <p className="text-xs text-slate-500">
            Manage organization staff, profiles, and employment status ({filteredEmployees.length} total)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-blue-600/20 transition-all hover:bg-blue-700 active:scale-95"
          >
            <UserPlus className="h-4 w-4" />
            <span>Add New Employee</span>
          </button>
          <button className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-sm transition-all hover:bg-slate-50">
            <Download className="h-4 w-4 text-slate-500" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, ID, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-xs text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none"
          />
        </div>

        {/* Department Filter */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 focus:border-blue-500 focus:outline-none"
          >
            <option value="All">All Departments</option>
            <option value="Engineering & IT">Engineering & IT</option>
            <option value="Human Resources">Human Resources</option>
            <option value="Finance & Accounts">Finance & Accounts</option>
            <option value="Sales & Business Dev">Sales & Business Dev</option>
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 focus:border-blue-500 focus:outline-none"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Probation">Probation</option>
            <option value="On Leave">On Leave</option>
            <option value="Resigned">Resigned</option>
          </select>
        </div>
      </div>

      {/* Employees Data Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500">
                <th className="px-4 py-3.5 font-semibold">Employee</th>
                <th className="px-4 py-3.5 font-semibold">Department & Role</th>
                <th className="px-4 py-3.5 font-semibold">Location</th>
                <th className="px-4 py-3.5 font-semibold">Joining Date</th>
                <th className="px-4 py-3.5 font-semibold">Status</th>
                <th className="px-4 py-3.5 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEmployees.map((emp) => (
                <tr key={emp.id} className="transition-colors hover:bg-slate-50/60">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <img
                        src={emp.avatar}
                        alt={emp.firstName}
                        className="h-9 w-9 rounded-full object-cover ring-1 ring-slate-200"
                      />
                      <div>
                        <p className="font-bold text-slate-900">
                          {emp.firstName} {emp.lastName}
                        </p>
                        <p className="text-[10px] text-slate-400">{emp.employeeId} • {emp.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="font-semibold text-slate-800">{emp.designation}</p>
                    <p className="text-[10px] text-slate-400">{emp.department}</p>
                  </td>
                  <td className="px-4 py-3.5 text-slate-700 font-medium">
                    {emp.location}
                  </td>
                  <td className="px-4 py-3.5 text-slate-700 font-medium">
                    {emp.joiningDate}
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${getStatusBadge(
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
                        className="rounded-lg p-1.5 text-slate-500 hover:bg-blue-50 hover:text-blue-600"
                        title="View Full Profile"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => showToast(`Editing ${emp.firstName}'s profile`)}
                        className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                        title="Edit Profile"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-xs text-slate-500">
          <span>Showing 1 to {filteredEmployees.length} of {employees.length} entries</span>
          <div className="flex items-center gap-1">
            <button className="rounded-lg border border-slate-200 px-2 py-1 hover:bg-slate-50 disabled:opacity-50">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button className="rounded-lg bg-blue-600 px-3 py-1 font-semibold text-white">1</button>
            <button className="rounded-lg border border-slate-200 px-2 py-1 hover:bg-slate-50">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* VIEW PROFILE MODAL */}
      {selectedEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl animate-fade-in">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-900 p-4 text-white">
              <div className="flex items-center gap-3">
                <img
                  src={selectedEmployee.avatar}
                  alt={selectedEmployee.firstName}
                  className="h-10 w-10 rounded-full object-cover ring-2 ring-white/20"
                />
                <div>
                  <h3 className="text-base font-bold">
                    {selectedEmployee.firstName} {selectedEmployee.lastName}
                  </h3>
                  <p className="text-xs text-slate-300">
                    {selectedEmployee.employeeId} • {selectedEmployee.designation}
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

            {/* Profile Navigation Tabs */}
            <div className="flex border-b border-slate-200 bg-slate-50 px-4 text-xs font-semibold">
              {[
                { key: 'personal', label: 'Personal Info' },
                { key: 'employment', label: 'Employment' },
                { key: 'emergency', label: 'Emergency Contact' },
                { key: 'bank', label: 'Bank Details (Restricted)' },
                { key: 'govt', label: 'Govt Identity' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`border-b-2 px-4 py-3 transition-colors ${
                    activeTab === tab.key
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Modal Tab Content */}
            <div className="p-6 text-xs text-slate-700">
              {activeTab === 'personal' && (
                <div className="grid grid-cols-2 gap-4">
                  <div><span className="font-semibold text-slate-500">Date of Birth:</span> {selectedEmployee.dateOfBirth}</div>
                  <div><span className="font-semibold text-slate-500">Gender:</span> {selectedEmployee.gender}</div>
                  <div><span className="font-semibold text-slate-500">Blood Group:</span> {selectedEmployee.bloodGroup}</div>
                  <div><span className="font-semibold text-slate-500">Phone:</span> {selectedEmployee.phone}</div>
                  <div className="col-span-2"><span className="font-semibold text-slate-500">Address:</span> {selectedEmployee.address}, {selectedEmployee.city}, {selectedEmployee.state}, {selectedEmployee.country}</div>
                </div>
              )}

              {activeTab === 'employment' && (
                <div className="grid grid-cols-2 gap-4">
                  <div><span className="font-semibold text-slate-500">Department:</span> {selectedEmployee.department}</div>
                  <div><span className="font-semibold text-slate-500">Designation:</span> {selectedEmployee.designation}</div>
                  <div><span className="font-semibold text-slate-500">Reporting Manager:</span> {selectedEmployee.manager}</div>
                  <div><span className="font-semibold text-slate-500">Location:</span> {selectedEmployee.location}</div>
                  <div><span className="font-semibold text-slate-500">Shift:</span> {selectedEmployee.shift}</div>
                  <div><span className="font-semibold text-slate-500">Grade:</span> {selectedEmployee.grade}</div>
                </div>
              )}

              {activeTab === 'emergency' && (
                <div className="grid grid-cols-2 gap-4">
                  <div><span className="font-semibold text-slate-500">Contact Person:</span> {selectedEmployee.emergencyContactName}</div>
                  <div><span className="font-semibold text-slate-500">Relationship:</span> {selectedEmployee.emergencyRelationship}</div>
                  <div><span className="font-semibold text-slate-500">Phone:</span> {selectedEmployee.emergencyPhone}</div>
                  <div className="col-span-2"><span className="font-semibold text-slate-500">Address:</span> {selectedEmployee.emergencyAddress}</div>
                </div>
              )}

              {activeTab === 'bank' && (
                <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4">
                  <div className="flex items-center gap-2 font-bold text-amber-900 mb-2">
                    <Lock className="h-4 w-4 text-amber-600" />
                    <span>Confidential Salary & Bank Information</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-slate-800">
                    <div><span className="font-semibold">Bank Name:</span> {selectedEmployee.bankName}</div>
                    <div><span className="font-semibold">Account Number:</span> {selectedEmployee.accountNumber}</div>
                    <div><span className="font-semibold">IFSC Code:</span> {selectedEmployee.ifscCode}</div>
                    <div><span className="font-semibold">Account Holder:</span> {selectedEmployee.accountHolder}</div>
                  </div>
                </div>
              )}

              {activeTab === 'govt' && (
                <div className="grid grid-cols-2 gap-4">
                  <div><span className="font-semibold text-slate-500">PAN Number:</span> {selectedEmployee.panNumber}</div>
                  <div><span className="font-semibold text-slate-500">Aadhaar Number:</span> {selectedEmployee.aadhaarNo}</div>
                  <div><span className="font-semibold text-slate-500">Passport Number:</span> {selectedEmployee.passportNo}</div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end border-t border-slate-100 p-4">
              <button
                onClick={() => setSelectedEmployee(null)}
                className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white"
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
