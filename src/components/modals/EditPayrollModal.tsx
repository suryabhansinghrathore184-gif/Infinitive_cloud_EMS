'use client';

import React, { useState } from 'react';
import { X, Edit3, ArrowRight, Save, Info } from 'lucide-react';
import { PayrollRecord } from '@/types/admin';
import { useEmsStore } from '@/store/emsStore';

interface EditPayrollModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (msg: string) => void;
  record: PayrollRecord | null;
}

export const EditPayrollModal: React.FC<EditPayrollModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  record,
}) => {
  const { updatePayrollRecord } = useEmsStore();

  const [bonus, setBonus] = useState<number>(record?.bonus || 0);
  const [overtimePay, setOvertimePay] = useState<number>(record?.overtimePay || 0);
  const [otherEarnings, setOtherEarnings] = useState<number>(record?.otherEarnings || 0);
  const [lopDeduction, setLopDeduction] = useState<number>(record?.lopDeduction || 0);
  const [taxDeduction, setTaxDeduction] = useState<number>(record?.taxDeduction || 0);
  const [otherDeductions, setOtherDeductions] = useState<number>(record?.otherDeductions || 0);
  const [reason, setReason] = useState<string>('Performance bonus & manual tax adjustment');

  if (!isOpen || !record) return null;

  const basic = record.basicSalary || 0;
  const hra = record.hra || 0;
  const conveyance = record.conveyance || 0;
  const medical = record.medical || 0;
  const specialAllowance = record.specialAllowance || 0;
  const otherAllowances = record.otherAllowances || 0;
  const pf = record.pfDeduction || 0;
  const pt = record.ptDeduction || 0;
  const esi = record.esiDeduction || 0;
  const loan = record.loanDeduction || 0;

  const originalGross = record.grossSalary;
  const originalDeductions = record.totalDeductions;
  const originalNet = record.netSalary;

  const newGross = basic + hra + conveyance + medical + specialAllowance + otherAllowances + Number(overtimePay) + Number(bonus) + Number(otherEarnings);
  const newDeductions = Number(lopDeduction) + pf + pt + Number(taxDeduction) + esi + loan + Number(otherDeductions);
  const newNet = Math.max(0, newGross - newDeductions);

  const diffNet = newNet - originalNet;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;

    updatePayrollRecord(
      record.id,
      {
        bonus: Number(bonus),
        overtimePay: Number(overtimePay),
        otherEarnings: Number(otherEarnings),
        lopDeduction: Number(lopDeduction),
        taxDeduction: Number(taxDeduction),
        otherDeductions: Number(otherDeductions),
      },
      reason.trim()
    );

    onSuccess(`Updated payroll for ${record.employeeName}. Net Salary updated: ₹${newNet.toLocaleString('en-IN')}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl text-xs text-slate-800 animate-fade-in max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b pb-3 font-bold text-sm text-slate-900">
          <div className="flex items-center gap-2">
            <Edit3 className="h-4 w-4 text-blue-600" />
            <span>Edit Payroll Entry: {record.employeeName} ({record.payPeriod})</span>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:text-slate-700">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2 text-[11px]">
            <div className="grid grid-cols-3 gap-2 text-center font-bold text-slate-700 border-b pb-2">
              <div>Metric</div>
              <div>Original</div>
              <div>Adjusted</div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <span className="font-semibold text-slate-600 text-left">Gross Salary:</span>
              <span className="text-slate-500">₹{originalGross.toLocaleString('en-IN')}</span>
              <span className="font-bold text-blue-700">₹{newGross.toLocaleString('en-IN')}</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <span className="font-semibold text-slate-600 text-left">Total Deductions:</span>
              <span className="text-slate-500">₹{originalDeductions.toLocaleString('en-IN')}</span>
              <span className="font-bold text-rose-700">₹{newDeductions.toLocaleString('en-IN')}</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center font-extrabold pt-1 border-t">
              <span className="text-left text-slate-900">Net Salary:</span>
              <span className="text-slate-500">₹{originalNet.toLocaleString('en-IN')}</span>
              <span className="text-emerald-600">₹{newNet.toLocaleString('en-IN')}</span>
            </div>
            <div className="text-right text-[10px] font-bold">
              Difference:{' '}
              <span className={diffNet >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                {diffNet >= 0 ? `+₹${diffNet.toLocaleString('en-IN')}` : `-₹${Math.abs(diffNet).toLocaleString('en-IN')}`}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 border-b pb-1 text-xs text-blue-700">Adjustable Earnings</h4>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="font-bold text-slate-800">Bonus (₹)</label>
                <input
                  type="number"
                  min={0}
                  value={bonus}
                  onChange={(e) => setBonus(Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border p-2 bg-slate-50 focus:bg-white"
                />
              </div>

              <div>
                <label className="font-bold text-slate-800">Overtime Pay (₹)</label>
                <input
                  type="number"
                  min={0}
                  value={overtimePay}
                  onChange={(e) => setOvertimePay(Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border p-2 bg-slate-50 focus:bg-white"
                />
              </div>

              <div>
                <label className="font-bold text-slate-800">Other Earnings (₹)</label>
                <input
                  type="number"
                  min={0}
                  value={otherEarnings}
                  onChange={(e) => setOtherEarnings(Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border p-2 bg-slate-50 focus:bg-white"
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 border-b pb-1 text-xs text-rose-700">Adjustable Deductions</h4>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="font-bold text-slate-800">LOP Deduction (₹)</label>
                <input
                  type="number"
                  min={0}
                  value={lopDeduction}
                  onChange={(e) => setLopDeduction(Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border p-2 bg-slate-50 focus:bg-white"
                />
              </div>

              <div>
                <label className="font-bold text-slate-800">TDS Income Tax (₹)</label>
                <input
                  type="number"
                  min={0}
                  value={taxDeduction}
                  onChange={(e) => setTaxDeduction(Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border p-2 bg-slate-50 focus:bg-white"
                />
              </div>

              <div>
                <label className="font-bold text-slate-800">Other Deductions (₹)</label>
                <input
                  type="number"
                  min={0}
                  value={otherDeductions}
                  onChange={(e) => setOtherDeductions(Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border p-2 bg-slate-50 focus:bg-white"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-900">Mandatory Adjustment Reason *</label>
            <input
              type="text"
              required
              placeholder="State rationale for modifying payroll figures"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="mt-1 w-full rounded-xl border p-2.5 bg-slate-50 focus:border-blue-500 focus:bg-white"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-md hover:bg-blue-700"
            >
              <Save className="h-3.5 w-3.5" />
              <span>Save Adjustment</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
