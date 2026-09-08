'use client';

import React, { useState } from 'react';
import { Employee, EmploymentStatus, EmploymentType } from '@/types/admin';
import { X, UserPlus, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface AddEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (emp: Omit<Employee, 'id'>) => { success: boolean; message: string };
  departments: string[];
  designations: string[];
}

export const AddEmployeeModal: React.FC<AddEmployeeModalProps> = ({
  isOpen,
  onClose,
  onSave,
  departments,
  designations,
}) => {
  const [formData, setFormData] = useState({
    employeeId: `EMP${Math.floor(1000 + Math.random() * 9000)}`,
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    dateOfBirth: '1995-01-01',
    gender: 'Male',
    bloodGroup: 'O+',
    address: '',
    city: '',
    state: '',
    country: 'India',
    department: departments[0] || 'Engineering & IT',
    designation: designations[0] || 'Senior Software Engineer',
    manager: 'Rajesh K.',
    location: 'Mumbai Tech Hub',
    employmentType: 'Full-time' as EmploymentType,
    joiningDate: new Date().toISOString().split('T')[0],
    status: 'Active' as EmploymentStatus,
    shift: 'Standard (09:00 - 18:00)',
    grade: 'Grade A3',
    emergencyContactName: '',
    emergencyRelationship: 'Spouse',
    emergencyPhone: '',
    emergencyAddress: '',
    bankName: 'HDFC Bank',
    accountNumber: '',
    ifscCode: '',
    accountHolder: '',
    panNumber: '',
    aadhaarNo: '',
    passportNo: '',
  });

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Form Validation
    if (!formData.employeeId.trim()) {
      setErrorMessage('Employee ID is required.');
      return;
    }
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setErrorMessage('First Name and Last Name are required.');
      return;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      setErrorMessage('Valid email address is required.');
      return;
    }
    if (!formData.joiningDate) {
      setErrorMessage('Joining Date is required.');
      return;
    }

    const res = onSave(formData);
    if (!res.success) {
      setErrorMessage(res.message);
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-3xl my-8 overflow-hidden rounded-2xl bg-white shadow-2xl animate-fade-in">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-900 p-4 text-white">
          <div className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-blue-400" />
            <h3 className="text-base font-bold">Add New Employee Master Record</h3>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Validation Error Banner */}
        {errorMessage && (
          <div className="flex items-center gap-2 bg-rose-50 p-3 text-xs font-semibold text-rose-700 border-b border-rose-200">
            <ShieldAlert className="h-4 w-4" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 text-xs text-slate-800 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="font-bold text-slate-900">Employee ID *</label>
              <input
                type="text"
                required
                value={formData.employeeId}
                onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-slate-50 focus:border-blue-500 focus:bg-white"
              />
            </div>
            <div>
              <label className="font-bold text-slate-900">First Name *</label>
              <input
                type="text"
                required
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="font-bold text-slate-900">Last Name *</label>
              <input
                type="text"
                required
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="font-bold text-slate-900">Official Email *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="font-bold text-slate-900">Phone Number</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="font-bold text-slate-900">Joining Date *</label>
              <input
                type="date"
                required
                value={formData.joiningDate}
                onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="font-bold text-slate-900">Department *</label>
              <select
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-white focus:border-blue-500"
              >
                {departments.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="font-bold text-slate-900">Designation *</label>
              <input
                type="text"
                value={formData.designation}
                onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="font-bold text-slate-900">Employment Type</label>
              <select
                value={formData.employmentType}
                onChange={(e) => setFormData({ ...formData, employmentType: e.target.value as EmploymentType })}
                className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-white focus:border-blue-500"
              >
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Contract">Contract</option>
                <option value="Intern">Intern</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="font-bold text-slate-900">Work Location</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="font-bold text-slate-900">Reporting Manager</label>
              <input
                type="text"
                value={formData.manager}
                onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="font-bold text-slate-900">Initial Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as EmploymentStatus })}
                className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-white focus:border-blue-500"
              >
                <option value="Active">Active</option>
                <option value="Probation">Probation</option>
              </select>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white shadow-md shadow-blue-600/20 hover:bg-blue-700"
            >
              Save & Register Employee
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
