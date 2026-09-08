'use client';

import React, { useState } from 'react';
import { X, Upload, FileText } from 'lucide-react';
import { EmployeeDocument } from '@/types/admin';

interface UploadDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: { id: string; firstName: string; lastName: string; employeeId: string }[];
  onSave: (doc: Omit<EmployeeDocument, 'id' | 'uploadDate'>) => void;
}

export const UploadDocumentModal: React.FC<UploadDocumentModalProps> = ({
  isOpen,
  onClose,
  employees,
  onSave,
}) => {
  const [title, setTitle] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [employeeName, setEmployeeName] = useState('');
  const [category, setCategory] = useState<EmployeeDocument['category']>('Offer Letter');
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState('1.4 MB');
  const [accessRole, setAccessRole] = useState<EmployeeDocument['accessRole']>('HR Only');

  if (!isOpen) return null;

  const handleEmployeeSelect = (empId: string) => {
    setEmployeeId(empId);
    const target = employees.find((e) => e.employeeId === empId);
    if (target) {
      setEmployeeName(`${target.firstName} ${target.lastName}`);
    } else {
      setEmployeeName('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !fileName.trim()) return;

    onSave({
      employeeId: employeeId || 'EMP-GEN',
      employeeName: employeeName.trim() || 'General Enterprise Record',
      title: title.trim(),
      category,
      fileName: fileName.trim(),
      fileSize: fileSize || '1.0 MB',
      accessRole,
    });

    setTitle('');
    setEmployeeId('');
    setEmployeeName('');
    setFileName('');
    setCategory('Offer Letter');
    setAccessRole('HR Only');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl text-xs text-slate-800 animate-fade-in">
        <div className="flex items-center justify-between border-b pb-3 font-bold text-sm text-slate-900">
          <div className="flex items-center gap-2">
            <Upload className="h-4 w-4 text-blue-600" />
            <span>Upload Document to Vault</span>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:text-slate-700">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div>
            <label className="font-bold text-slate-900">Document Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Offer Letter - Rahul Sharma"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full rounded-xl border p-2.5 bg-slate-50 focus:border-blue-500 focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-900">Select Employee</label>
              <select
                value={employeeId}
                onChange={(e) => handleEmployeeSelect(e.target.value)}
                className="mt-1 w-full rounded-xl border p-2.5 bg-slate-50 focus:border-blue-500 focus:bg-white"
              >
                <option value="">-- General / Unassigned --</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.employeeId}>
                    {emp.firstName} {emp.lastName} ({emp.employeeId})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-900">Document Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as EmployeeDocument['category'])}
                className="mt-1 w-full rounded-xl border p-2.5 bg-slate-50 focus:border-blue-500 focus:bg-white"
              >
                <option value="Offer Letter">Offer Letter</option>
                <option value="Appointment Letter">Appointment Letter</option>
                <option value="ID Proof">ID Proof</option>
                <option value="Certificate">Certificate</option>
                <option value="Salary Slip">Salary Slip</option>
                <option value="Experience Letter">Experience Letter</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-900">File Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. rahul_offer.pdf"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                className="mt-1 w-full rounded-xl border p-2.5 bg-slate-50 focus:border-blue-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="font-bold text-slate-900">Access Permission</label>
              <select
                value={accessRole}
                onChange={(e) => setAccessRole(e.target.value as EmployeeDocument['accessRole'])}
                className="mt-1 w-full rounded-xl border p-2.5 bg-slate-50 focus:border-blue-500 focus:bg-white"
              >
                <option value="HR Only">HR Only</option>
                <option value="Employee & HR">Employee & HR</option>
                <option value="Public">Public</option>
              </select>
            </div>
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
              Upload Document
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
