'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Edit3, FileText, FileImage, ShieldCheck, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { EmployeeDocument, DocumentCategory, DocumentAccessRole } from '@/types/admin';

interface EditDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: EmployeeDocument | null;
  employees: { id: string; firstName: string; lastName: string; employeeId: string }[];
  onSuccess: (updatedDoc: EmployeeDocument) => void;
}

const CATEGORIES: DocumentCategory[] = [
  'Offer Letter',
  'Appointment Letter',
  'Identity Proof',
  'Payslip',
  'Resume',
  'Experience Letter',
  'Contract',
  'Other',
];

const ACCESS_ROLES: DocumentAccessRole[] = [
  'HR Only',
  'Admin Only',
  'HR & Admin',
  'Employee',
  'Public',
];

const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15 MB
const ALLOWED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

export const EditDocumentModal: React.FC<EditDocumentModalProps> = ({
  isOpen,
  onClose,
  document,
  employees,
  onSuccess,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [employeeName, setEmployeeName] = useState('');
  const [category, setCategory] = useState<DocumentCategory>('Offer Letter');
  const [accessRole, setAccessRole] = useState<DocumentAccessRole>('HR Only');

  const [replacementFile, setReplacementFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (document) {
      setTitle(document.title || '');
      setEmployeeId(document.employeeId || '');
      setEmployeeName(document.employeeName || '');
      setCategory(document.category || 'Offer Letter');
      setAccessRole(document.accessRole || 'HR Only');
      setReplacementFile(null);
      setErrorMsg(null);
    }
  }, [document]);

  if (!isOpen || !document) return null;

  const handleEmployeeSelect = (empId: string) => {
    setEmployeeId(empId);
    const target = employees.find((e) => e.employeeId === empId || e.id === empId);
    if (target) {
      setEmployeeName(`${target.firstName} ${target.lastName}`);
    } else {
      setEmployeeName('');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type.toLowerCase()) && !file.name.endsWith('.pdf')) {
      setErrorMsg('Invalid replacement file type. Allowed: PDF, PNG, JPG, WEBP, DOC, DOCX.');
      setReplacementFile(null);
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      setErrorMsg(`Selected file (${sizeMb} MB) exceeds the maximum 15 MB limit.`);
      setReplacementFile(null);
      return;
    }

    setReplacementFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!title.trim()) {
      setErrorMsg('Document Title is required.');
      return;
    }

    setIsSaving(true);

    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('employeeId', employeeId || 'EMP-GEN');
      formData.append('employeeName', employeeName.trim() || 'General Enterprise Record');
      formData.append('category', category);
      formData.append('accessRole', accessRole);

      if (replacementFile) {
        formData.append('file', replacementFile);
      }

      const res = await fetch(`/api/v1/documents/${document.id}`, {
        method: 'PUT',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to update document details.');
      }

      onSuccess(data.document);
      onClose();
    } catch (err: any) {
      console.error('Edit document error:', err);
      setErrorMsg(err.message || 'An error occurred while saving changes.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl text-xs text-slate-800 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 font-bold text-sm text-slate-900">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-indigo-50 p-1.5 text-indigo-600 border border-indigo-200">
              <Edit3 className="h-4 w-4" />
            </div>
            <span>Edit Document Details</span>
          </div>
          <button
            onClick={() => {
              if (!isSaving) onClose();
            }}
            disabled={isSaving}
            className="rounded-lg p-1 text-slate-400 hover:text-slate-700 disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mt-3 flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-rose-700 text-xs">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Title */}
          <div>
            <label className="font-bold text-slate-900">Document Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-slate-50 focus:border-indigo-500 focus:bg-white font-medium"
            />
          </div>

          {/* Employee & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-900">Select Employee</label>
              <select
                value={employeeId}
                onChange={(e) => handleEmployeeSelect(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-slate-50 focus:border-indigo-500 focus:bg-white font-medium"
              >
                <option value="">-- General / Company Wide --</option>
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
                onChange={(e) => setCategory(e.target.value as DocumentCategory)}
                className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-slate-50 focus:border-indigo-500 focus:bg-white font-medium"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Access Role */}
          <div>
            <label className="font-bold text-slate-900">Access Permission Role *</label>
            <select
              value={accessRole}
              onChange={(e) => setAccessRole(e.target.value as DocumentAccessRole)}
              className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-slate-50 focus:border-indigo-500 focus:bg-white font-medium"
            >
              {ACCESS_ROLES.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>

          {/* Replace File Section (Optional) */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 flex items-center gap-1.5">
                <RefreshCw className="h-3.5 w-3.5 text-indigo-600" /> Replace Stored File (Optional)
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Current: {document.fileName}</span>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx"
              onChange={handleFileChange}
              className="hidden"
            />

            {replacementFile ? (
              <div className="flex items-center justify-between rounded-xl bg-white border border-indigo-200 p-2.5">
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="h-4 w-4 text-indigo-600 shrink-0" />
                  <span className="font-bold text-slate-900 truncate">{replacementFile.name}</span>
                  <span className="text-[10px] text-slate-500">
                    ({(replacementFile.size / (1024 * 1024)).toFixed(2)} MB)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setReplacementFile(null)}
                  className="rounded p-1 text-rose-500 hover:bg-rose-50"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full rounded-xl border border-dashed border-slate-300 bg-white py-2 text-center text-slate-600 font-semibold hover:border-indigo-400 hover:text-indigo-600 transition"
              >
                Click to choose new file to replace existing binary
              </button>
            )}
          </div>

          {/* Modal Actions */}
          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="rounded-xl border border-slate-200 px-4 py-2 font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2 font-bold text-white shadow-md hover:bg-indigo-700 disabled:opacity-50 transition-all active:scale-95"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Saving Changes...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" />
                  <span>Save Document</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
