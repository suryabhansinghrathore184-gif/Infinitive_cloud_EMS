'use client';

import React, { useState } from 'react';
import { X, Code2 } from 'lucide-react';
import { SalaryRule } from '@/types/admin';

interface AddEditSalaryRuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (rule: Omit<SalaryRule, 'id'>) => void;
  initialData?: SalaryRule | null;
}

export const AddEditSalaryRuleModal: React.FC<AddEditSalaryRuleModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}) => {
  const [name, setName] = useState(initialData?.name || '');
  const [code, setCode] = useState(initialData?.code || '');
  const [type, setType] = useState<'Earning' | 'Deduction'>(initialData?.type || 'Earning');
  const [calcType, setCalcType] = useState<'Fixed Amount' | 'Percentage of Basic' | 'Percentage of Gross' | 'Formula'>(
    initialData?.calcType || 'Percentage of Basic'
  );
  const [value, setValue] = useState<string | number>(initialData?.value ?? 10);
  const [appliesTo, setAppliesTo] = useState<'All Employees' | 'Department' | 'Designation' | 'Specific Employee'>(
    initialData?.appliesTo || 'All Employees'
  );
  const [targetValue, setTargetValue] = useState(initialData?.targetValue || '');
  const [effectiveFrom, setEffectiveFrom] = useState(initialData?.effectiveFrom || new Date().toISOString().split('T')[0]);
  const [active, setActive] = useState<boolean>(initialData?.active ?? true);
  const [description, setDescription] = useState(initialData?.description || '');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) return;

    onSave({
      name: name.trim(),
      code: code.trim().toUpperCase(),
      type,
      calcType,
      value: calcType === 'Formula' ? String(value) : Number(value) || 0,
      appliesTo,
      targetValue: appliesTo === 'All Employees' ? '' : targetValue.trim(),
      effectiveFrom,
      active,
      description: description.trim(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl text-xs text-slate-800 animate-fade-in max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b pb-3 font-bold text-sm text-slate-900">
          <div className="flex items-center gap-2">
            <Code2 className="h-4 w-4 text-blue-600" />
            <span>{initialData ? 'Edit Salary Rule / Script' : 'Add Salary Rule / Script'}</span>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:text-slate-700">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div>
            <label className="font-bold text-slate-900">Rule Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Special Tech Allowance"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-xl border p-2.5 bg-slate-50 focus:border-blue-500 focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-900">Rule Code *</label>
              <input
                type="text"
                required
                placeholder="e.g. EARN_TECH"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="mt-1 w-full rounded-xl border p-2.5 bg-slate-50 focus:border-blue-500 focus:bg-white font-mono uppercase text-xs"
              />
            </div>

            <div>
              <label className="font-bold text-slate-900">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="mt-1 w-full rounded-xl border p-2.5 bg-slate-50 focus:border-blue-500 focus:bg-white"
              >
                <option value="Earning">Earning</option>
                <option value="Deduction">Deduction</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-900">Calculation Type</label>
              <select
                value={calcType}
                onChange={(e) => setCalcType(e.target.value as any)}
                className="mt-1 w-full rounded-xl border p-2.5 bg-slate-50 focus:border-blue-500 focus:bg-white"
              >
                <option value="Fixed Amount">Fixed Amount (₹)</option>
                <option value="Percentage of Basic">% of Basic Salary</option>
                <option value="Percentage of Gross">% of Gross Salary</option>
                <option value="Formula">Custom Formula</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-900">
                {calcType === 'Formula' ? 'Formula Script' : calcType.includes('%') ? 'Percentage (%)' : 'Amount (₹)'}
              </label>
              <input
                type={calcType === 'Formula' ? 'text' : 'number'}
                required
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={calcType === 'Formula' ? 'Basic * 0.15' : '10'}
                className="mt-1 w-full rounded-xl border p-2.5 bg-slate-50 focus:border-blue-500 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-900">Applies To Scope</label>
            <select
              value={appliesTo}
              onChange={(e) => setAppliesTo(e.target.value as any)}
              className="mt-1 w-full rounded-xl border p-2.5 bg-slate-50 focus:border-blue-500 focus:bg-white"
            >
              <option value="All Employees">All Employees</option>
              <option value="Department">Department</option>
              <option value="Designation">Designation</option>
              <option value="Specific Employee">Specific Employee ID</option>
            </select>
          </div>

          {appliesTo !== 'All Employees' && (
            <div>
              <label className="font-bold text-slate-900">Target Value *</label>
              <input
                type="text"
                required
                placeholder="e.g. Engineering & IT"
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                className="mt-1 w-full rounded-xl border p-2.5 bg-slate-50 focus:border-blue-500 focus:bg-white"
              />
            </div>
          )}

          <div>
            <label className="font-bold text-slate-900">Description</label>
            <input
              type="text"
              placeholder="Rule rationale and calculation notes"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 w-full rounded-xl border p-2.5 bg-slate-50 focus:border-blue-500 focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="activeRule"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="activeRule" className="font-bold text-slate-900 cursor-pointer">
              Enable Rule Immediately
            </label>
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
              className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-md hover:bg-blue-700"
            >
              Save Salary Rule
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
