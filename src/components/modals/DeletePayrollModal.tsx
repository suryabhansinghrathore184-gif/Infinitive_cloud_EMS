'use client';

import React, { useState } from 'react';
import { X, AlertTriangle, Trash2 } from 'lucide-react';
import { PayrollRecord } from '@/types/admin';
import { useEmsStore } from '@/store/emsStore';

interface DeletePayrollModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (msg: string) => void;
  record: PayrollRecord | null;
}

export const DeletePayrollModal: React.FC<DeletePayrollModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  record,
}) => {
  const { deletePayrollRecord } = useEmsStore();
  const [reason, setReason] = useState<string>('');

  if (!isOpen || !record) return null;

  const handleDelete = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;

    const res = deletePayrollRecord(record.id, reason.trim());
    if (res.success) {
      onSuccess(res.message);
      setReason('');
      onClose();
    } else {
      alert(res.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl text-xs text-slate-800 animate-fade-in">
        <div className="flex items-center justify-between border-b pb-3 font-bold text-sm text-rose-600">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            <span>Confirm Delete Payroll Record</span>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:text-slate-700">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleDelete} className="mt-4 space-y-4">
          <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-3 text-rose-900">
            <p className="font-bold text-xs">
              Are you sure you want to delete payroll for {record.employeeName} ({record.payPeriod})?
            </p>
            <p className="text-[11px] text-rose-700 mt-1">
              Net Amount: ₹{record.netSalary.toLocaleString('en-IN')} | Status: {record.status}
            </p>
          </div>

          <div>
            <label className="font-bold text-slate-900">Reason for Deletion *</label>
            <textarea
              required
              rows={3}
              placeholder="Provide justification for removing this payroll record..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="mt-1 w-full rounded-xl border p-2.5 bg-slate-50 focus:border-rose-500 focus:bg-white text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!reason.trim()}
              className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-md hover:bg-rose-700 disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Delete Payroll</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
