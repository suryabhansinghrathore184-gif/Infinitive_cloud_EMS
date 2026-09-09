'use client';

import React, { useState } from 'react';
import { X, Play, Calendar, Users, Calculator, Info } from 'lucide-react';
import { useEmsStore } from '@/store/emsStore';

interface ProcessPayrollModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

export const ProcessPayrollModal: React.FC<ProcessPayrollModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { state, processMonthlyPayroll } = useEmsStore();

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const activeEmployees = state.employees.filter(
    (e) => e.status !== 'Terminated' && e.status !== 'Former Employee'
  );

  const existingRecords = (state.payrollRecords || []).filter(
    (p) => p.payMonth === selectedMonth && p.payYear === selectedYear
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    setTimeout(() => {
      const res = processMonthlyPayroll(selectedMonth, selectedYear);
      setIsProcessing(false);

      if (res.success) {
        onSuccess(res.message);
        onClose();
      } else {
        alert(res.message);
      }
    }, 600);
  };

  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl text-xs text-slate-800 animate-fade-in">
        <div className="flex items-center justify-between border-b pb-3 font-bold text-sm text-slate-900">
          <div className="flex items-center gap-2">
            <Calculator className="h-4 w-4 text-blue-600" />
            <span>Process Monthly Payroll Run</span>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:text-slate-700">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-900">Select Pay Month</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="mt-1 w-full rounded-xl border p-2.5 bg-slate-50 focus:border-blue-500 focus:bg-white"
              >
                {months.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-900">Select Pay Year</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="mt-1 w-full rounded-xl border p-2.5 bg-slate-50 focus:border-blue-500 focus:bg-white"
              >
                <option value={2025}>2025</option>
                <option value={2026}>2026</option>
                <option value={2027}>2027</option>
              </select>
            </div>
          </div>

          <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-3 text-blue-900 space-y-2">
            <div className="flex items-center gap-2 font-bold text-xs">
              <Users className="h-4 w-4 text-blue-600" />
              <span>Payroll Processing Scope</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
              <div>
                <span className="text-slate-500">Active Employees:</span>
                <p className="font-extrabold text-slate-900">{activeEmployees.length}</p>
              </div>
              <div>
                <span className="text-slate-500">Existing Records:</span>
                <p className="font-extrabold text-slate-900">{existingRecords.length}</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-[11px] text-slate-600 flex items-start gap-2">
            <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
            <span>
              The Payroll Calculation Engine will fetch employee salary profiles, attendance, approved leaves (LOP), statutory rules (PF, PT, TDS), and compute net salary.
            </span>
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
              disabled={isProcessing}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-md hover:bg-blue-700 disabled:opacity-50"
            >
              <Play className="h-3.5 w-3.5 fill-white" />
              <span>{isProcessing ? 'Calculating...' : 'Run Calculation Engine'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
