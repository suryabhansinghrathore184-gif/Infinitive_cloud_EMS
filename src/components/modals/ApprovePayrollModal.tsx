'use client';

import React from 'react';
import { X, CheckCircle2, ShieldCheck } from 'lucide-react';
import { PayrollRecord } from '@/types/admin';
import { useEmsStore } from '@/store/emsStore';

interface ApprovePayrollModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (msg: string) => void;
  record: PayrollRecord | null;
}

export const ApprovePayrollModal: React.FC<ApprovePayrollModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  record,
}) => {
  const { updatePayrollStatus } = useEmsStore();

  if (!isOpen || !record) return null;

  const handleApprove = () => {
    updatePayrollStatus(record.id, 'Approved');
    onSuccess(`Payroll for ${record.employeeName} approved successfully.`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl text-xs text-slate-800 animate-fade-in">
        <div className="flex items-center justify-between border-b pb-3 font-bold text-sm text-blue-600">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            <span>Approve Payroll Run</span>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:text-slate-700">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-3 text-blue-900 space-y-1.5 text-xs">
            <p className="font-bold">Are you sure you want to approve payroll for {record.employeeName}?</p>
            <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
              <div>
                <span className="text-slate-500">Pay Period:</span> <span className="font-semibold text-slate-900">{record.payPeriod}</span>
              </div>
              <div>
                <span className="text-slate-500">Gross Salary:</span> <span className="font-semibold text-slate-900">₹{record.grossSalary.toLocaleString('en-IN')}</span>
              </div>
              <div>
                <span className="text-slate-500">Deductions:</span> <span className="font-semibold text-rose-600">₹{record.totalDeductions.toLocaleString('en-IN')}</span>
              </div>
              <div>
                <span className="text-slate-500">Net Payable:</span> <span className="font-extrabold text-emerald-600">₹{record.netSalary.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-slate-500">
            Once approved, the status will change to <strong className="text-slate-700">Approved</strong> and official PDF payslips can be generated.
          </p>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApprove}
              className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-md hover:bg-blue-700"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Approve Payroll</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
