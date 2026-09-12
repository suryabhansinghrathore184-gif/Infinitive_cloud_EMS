'use client';

import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  title: string;
  itemName: string;
  itemType: 'department' | 'designation' | 'location';
  assignedEmployeeCount: number;
  onClose: () => void;
  onConfirm: () => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  title,
  itemName,
  itemType,
  assignedEmployeeCount,
  onClose,
  onConfirm,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl text-xs text-slate-800 animate-fade-in">
        <div className="flex items-center justify-between border-b pb-3 font-bold text-sm text-slate-900">
          <div className="flex items-center gap-2 text-rose-600">
            <AlertTriangle className="h-5 w-5" />
            <span>{title}</span>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:text-slate-700">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 space-y-3">
          <p className="text-slate-700 font-medium">
            Are you sure you want to delete or deactivate <strong className="text-slate-900 font-bold">&quot;{itemName}&quot;</strong>?
          </p>

          {assignedEmployeeCount > 0 ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-amber-900">
              <p className="font-bold flex items-center gap-1.5 text-xs text-amber-800">
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
                Safety Check Warning:
              </p>
              <p className="mt-1 text-[11px]">
                This {itemType} is currently assigned to <strong className="font-bold">{assignedEmployeeCount} employee(s)</strong>.
              </p>
              <p className="mt-1 text-[11px] text-amber-700">
                To preserve organizational historical data and employee contracts, proceeding will set this {itemType} to <strong className="font-bold">Inactive</strong> status instead of performing a hard deletion.
              </p>
            </div>
          ) : (
            <p className="text-slate-500 text-xs">
              No employees are currently assigned to this {itemType}. This item will be permanently removed.
            </p>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t pt-3 mt-5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border px-3.5 py-2 font-semibold text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 font-bold text-white shadow-xs hover:bg-rose-700"
          >
            <Trash2 className="h-4 w-4" />
            <span>{assignedEmployeeCount > 0 ? 'Deactivate Entity' : 'Delete Permanently'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
