'use client';

import React, { useState, useEffect } from 'react';
import { X, Target, Star, User } from 'lucide-react';
import { Employee, PerformanceReview } from '@/types/admin';

interface LaunchPerformanceCycleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (review: Omit<PerformanceReview, 'id'>) => void;
  employees: Employee[];
}

export const LaunchPerformanceCycleModal: React.FC<LaunchPerformanceCycleModalProps> = ({
  isOpen,
  onClose,
  onSave,
  employees,
}) => {
  const [employeeId, setEmployeeId] = useState('');
  const [employeeName, setEmployeeName] = useState('');
  const [avatar, setAvatar] = useState('');
  const [department, setDepartment] = useState('');
  const [cycle, setCycle] = useState('H2 2026 Performance Cycle');
  const [status, setStatus] = useState<PerformanceReview['status']>('Goal Setting');
  const [selfRating, setSelfRating] = useState<number>(4.0);
  const [managerRating, setManagerRating] = useState<number>(4.2);

  useEffect(() => {
    if (employees.length > 0 && !employeeId) {
      const first = employees[0];
      setEmployeeId(first.employeeId);
      setEmployeeName(`${first.firstName} ${first.lastName}`);
      setAvatar(first.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80');
      setDepartment(first.department || 'Engineering & IT');
    }
  }, [employees, employeeId]);

  if (!isOpen) return null;

  const handleEmployeeChange = (empId: string) => {
    setEmployeeId(empId);
    const selected = employees.find((e) => e.employeeId === empId);
    if (selected) {
      setEmployeeName(`${selected.firstName} ${selected.lastName}`);
      setAvatar(selected.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80');
      setDepartment(selected.department || 'Engineering & IT');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalRating = parseFloat(((selfRating + managerRating) / 2).toFixed(1));

    onSave({
      employeeId: employeeId || 'EMP-DEF',
      employeeName: employeeName || 'Employee',
      avatar: avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
      department: department || 'Engineering & IT',
      cycle: cycle.trim() || 'H2 2026 Performance Cycle',
      selfRating: Number(selfRating) || 0,
      managerRating: Number(managerRating) || 0,
      finalRating,
      status,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl text-xs text-slate-800 animate-fade-in space-y-4">
        <div className="flex items-center justify-between border-b pb-3 font-bold text-sm text-slate-900">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-600" />
            <span>Launch New Review Cycle</span>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:text-slate-700">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="font-bold text-slate-900">Select Employee *</label>
            {employees.length > 0 ? (
              <select
                value={employeeId}
                onChange={(e) => handleEmployeeChange(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 bg-slate-50 text-slate-900 font-semibold focus:border-blue-500 focus:bg-white focus:outline-none"
              >
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.employeeId}>
                    {emp.firstName} {emp.lastName} ({emp.employeeId}) - {emp.department}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                required
                placeholder="Employee Name"
                value={employeeName}
                onChange={(e) => setEmployeeName(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 bg-slate-50 text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none"
              />
            )}
          </div>

          <div>
            <label className="font-bold text-slate-900">Performance Cycle Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. H2 2026 Performance Cycle / Annual OKR Appraisal"
              value={cycle}
              onChange={(e) => setCycle(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 bg-slate-50 text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-900">Department</label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 bg-slate-50 text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="font-bold text-slate-900">Review Stage / Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as PerformanceReview['status'])}
                className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 bg-slate-50 text-slate-900 font-semibold focus:border-blue-500 focus:bg-white focus:outline-none"
              >
                <option value="Goal Setting">Goal Setting</option>
                <option value="Self Review">Self Review</option>
                <option value="Manager Review">Manager Review</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-900">Self Rating (1 - 5)</label>
              <input
                type="number"
                step="0.1"
                min={1}
                max={5}
                required
                value={selfRating}
                onChange={(e) => setSelfRating(parseFloat(e.target.value) || 0)}
                className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 bg-slate-50 text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="font-bold text-slate-900">Manager Rating (1 - 5)</label>
              <input
                type="number"
                step="0.1"
                min={1}
                max={5}
                required
                value={managerRating}
                onChange={(e) => setManagerRating(parseFloat(e.target.value) || 0)}
                className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 bg-slate-50 text-slate-900 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t pt-3 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2 font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-blue-600 px-5 py-2 font-bold text-white shadow-md hover:bg-blue-700"
            >
              Launch Review Cycle
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
