'use client';

import React, { useState } from 'react';
import { AlertTriangle, Trash2, X, Loader2 } from 'lucide-react';
import { EmployeeDocument } from '@/types/admin';

interface DeleteDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: EmployeeDocument | null;
  onSuccess: (deletedId: string) => void;
}

export const DeleteDocumentModal: React.FC<DeleteDocumentModalProps> = ({
  isOpen,
  onClose,
  document,
  onSuccess,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !document) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/v1/documents/${document.id}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to delete document from database.');
      }

      onSuccess(document.id);
      onClose();
    } catch (err: any) {
      console.error('Delete document error:', err);
      setErrorMsg(err.message || 'An error occurred while deleting the document.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl text-xs text-slate-800 animate-fade-in">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 border border-rose-200">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">Delete Document?</h3>
              <p className="text-slate-500 text-xs">This action cannot be undone.</p>
            </div>
          </div>
          <button
            onClick={() => {
              if (!isDeleting) onClose();
            }}
            disabled={isDeleting}
            className="rounded-lg p-1 text-slate-400 hover:text-slate-700 disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mt-3 rounded-xl bg-rose-50 border border-rose-200 p-3 text-rose-700 text-xs">
            {errorMsg}
          </div>
        )}

        {/* Target Details Card */}
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-1.5 font-medium">
          <p className="text-slate-900 font-bold">{document.title}</p>
          <p className="text-[11px] text-slate-600">
            Employee: <span className="font-semibold text-slate-800">{document.employeeName} ({document.employeeId})</span>
          </p>
          <p className="text-[11px] text-slate-500 font-mono">
            File: {document.fileName} • {document.fileSize}
          </p>
        </div>

        <p className="mt-3 text-slate-600 leading-relaxed">
          Deleting this record will remove the document metadata from MongoDB and clean up the binary file stored in MongoDB GridFS.
        </p>

        {/* Actions */}
        <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 mt-5">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="rounded-xl border border-slate-200 px-4 py-2 font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-2 font-bold text-white shadow-md hover:bg-rose-700 disabled:opacity-50 transition-all active:scale-95"
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Deleting File...</span>
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                <span>Permanently Delete</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
