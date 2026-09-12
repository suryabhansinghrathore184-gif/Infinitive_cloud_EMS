'use client';

import React, { useState, useEffect } from 'react';
import { X, Building2 } from 'lucide-react';
import { Department, Employee } from '@/types/admin';

interface EditDepartmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  department: Department | null;
  employees?: Employee[];
  onSave: (id: string, updated: Partial<Department>) => void;
}

export const EditDepartmentModal: React.FC<EditDepartmentModalProps> = ({
  isOpen,
  onClose,
  department,
  employees = [],
  onSave,
}) => {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [head, setHead] = useState('');
  const [isCustomHead, setIsCustomHead] = useState(false);
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');

  useEffect(() => {
    if (department) {
      setName(department.name || '');
      setCode(department.code || '');
      setHead(department.head || '');
      setDescription(department.description || '');
      setStatus(department.status || 'Active');

      // Check if existing head is in employee list
      const matchesEmp = employees.some(
        (e) => `${e.firstName} ${e.lastName}`.toLowerCase() === (department.head || '').toLowerCase()
      );
      if (department.head && department.head !== 'Unassigned' && !matchesEmp) {
        setIsCustomHead(true);
      } else {
        setIsCustomHead(false);
      }
    }
  }, [department, employees]);

  if (!isOpen || !department) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave(department.id, {
      name: name.trim(),
      code: code.trim().toUpperCase() || name.substring(0, 3).toUpperCase(),
      head: head.trim() || 'Unassigned',
      description: description.trim(),
      status,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl text-xs text-slate-800 animate-fade-in">
        <div className="flex items-center justify-between border-b pb-3 font-bold text-sm text-slate-900">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-blue-600" />
            <span>Edit Department</span>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:text-slate-700">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div>
            <label className="font-bold text-slate-900">Department Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Information Technology"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-xl border p-2.5 bg-slate-50 focus:border-blue-500 focus:bg-white font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-900">Department Code</label>
              <input
                type="text"
                placeholder="e.g. ENG"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="mt-1 w-full rounded-xl border p-2.5 bg-slate-50 focus:border-blue-500 focus:bg-white uppercase font-mono"
              />
            </div>
            <div>
              <label className="font-bold text-slate-900">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'Active' | 'Inactive')}
                className="mt-1 w-full rounded-xl border p-2.5 bg-slate-50 focus:border-blue-500 focus:bg-white font-medium"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-900">Department Head</label>
              <button
                type="button"
                onClick={() => setIsCustomHead(!isCustomHead)}
                className="text-[10px] text-blue-600 hover:underline font-semibold"
              >
                {isCustomHead ? 'Select from employees' : 'Type custom name'}
              </button>
            </div>
            {isCustomHead ? (
              <input
                type="text"
                placeholder="e.g. Suryabhan Singh Rathore"
                value={head}
                onChange={(e) => setHead(e.target.value)}
                className="mt-1 w-full rounded-xl border p-2.5 bg-slate-50 focus:border-blue-500 focus:bg-white"
              />
            ) : (
              <select
                value={head}
                onChange={(e) => setHead(e.target.value)}
                className="mt-1 w-full rounded-xl border p-2.5 bg-slate-50 focus:border-blue-500 focus:bg-white font-medium"
              >
                <option value="Unassigned">Unassigned</option>
                {employees.map((emp) => {
                  const empName = `${emp.firstName} ${emp.lastName}`;
                  return (
                    <option key={emp.id} value={empName}>
                      {empName} ({emp.employeeId} - {emp.designation || 'Staff'})
                    </option>
                  );
                })}
              </select>
            )}
          </div>

          <div>
            <label className="font-bold text-slate-900">Description</label>
            <textarea
              placeholder="Brief description of department scope..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-xl border p-2.5 bg-slate-50 focus:border-blue-500 focus:bg-white"
            />
          </div>

          <div className="flex justify-end gap-2 border-t pt-3 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border px-3 py-1.5 font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-blue-600 px-4 py-1.5 font-bold text-white shadow-xs hover:bg-blue-700"
            >
              Update Department
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
