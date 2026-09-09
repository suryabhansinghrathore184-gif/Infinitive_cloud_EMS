'use client';

import React, { useState } from 'react';
import { X, Layers } from 'lucide-react';
import { SalaryStructure } from '@/types/admin';

interface AddEditSalaryStructureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (struct: Omit<SalaryStructure, 'id'>) => void;
  initialData?: SalaryStructure | null;
}

export const AddEditSalaryStructureModal: React.FC<AddEditSalaryStructureModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}) => {
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [basicSalary, setBasicSalary] = useState(initialData?.basicSalary || 50000);
  const [hraType, setHraType] = useState<'Fixed' | 'PercentBasic'>(initialData?.hraType || 'PercentBasic');
  const [hraValue, setHraValue] = useState(initialData?.hraValue || 40);
  const [conveyance, setConveyance] = useState(initialData?.conveyance || 3000);
  const [medical, setMedical] = useState(initialData?.medical || 2000);
  const [specialAllowance, setSpecialAllowance] = useState(initialData?.specialAllowance || 5000);
  const [otherAllowances, setOtherAllowances] = useState(initialData?.otherAllowances || 0);
  const [pfPercent, setPfPercent] = useState(initialData?.pfPercent || 12);
  const [ptAmount, setPtAmount] = useState(initialData?.ptAmount || 200);
  const [tdsPercent, setTdsPercent] = useState(initialData?.tdsPercent || 10);
  const [esiPercent, setEsiPercent] = useState(initialData?.esiPercent || 0);
  const [status, setStatus] = useState<'Active' | 'Inactive'>(initialData?.status || 'Active');

  if (!isOpen) return null;

  const computedHra = hraType === 'PercentBasic' ? Math.round((basicSalary * hraValue) / 100) : hraValue;
  const computedGross = basicSalary + computedHra + conveyance + medical + specialAllowance + otherAllowances;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSave({
      title: title.trim(),
      description: description.trim(),
      basicSalary: Number(basicSalary) || 0,
      hraType,
      hraValue: Number(hraValue) || 0,
      conveyance: Number(conveyance) || 0,
      medical: Number(medical) || 0,
      specialAllowance: Number(specialAllowance) || 0,
      otherAllowances: Number(otherAllowances) || 0,
      pfPercent: Number(pfPercent) || 0,
      ptAmount: Number(ptAmount) || 0,
      tdsPercent: Number(tdsPercent) || 0,
      esiPercent: Number(esiPercent) || 0,
      effectiveDate: new Date().toISOString().split('T')[0],
      status,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl text-xs text-slate-800 animate-fade-in max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b pb-3 font-bold text-sm text-slate-900">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-blue-600" />
            <span>{initialData ? 'Edit Salary Structure' : 'Add New Salary Structure'}</span>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:text-slate-700">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div>
            <label className="font-bold text-slate-900">Structure Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Senior Executive Salary Structure"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full rounded-xl border p-2.5 bg-slate-50 focus:border-blue-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="font-bold text-slate-900">Description</label>
            <input
              type="text"
              placeholder="Brief description of this salary template"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 w-full rounded-xl border p-2.5 bg-slate-50 focus:border-blue-500 focus:bg-white"
            />
          </div>

          {/* Earnings Component Group */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3 space-y-3">
            <h4 className="font-bold text-slate-900 border-b pb-1 text-xs text-blue-700">Earnings Components</h4>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-800">Basic Salary (₹) *</label>
                <input
                  type="number"
                  min={0}
                  required
                  value={basicSalary}
                  onChange={(e) => setBasicSalary(Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border p-2 bg-white"
                />
              </div>

              <div>
                <label className="font-bold text-slate-800">HRA Calculation</label>
                <div className="flex gap-1 mt-1">
                  <select
                    value={hraType}
                    onChange={(e) => setHraType(e.target.value as any)}
                    className="w-1/2 rounded-xl border p-2 bg-white text-[11px]"
                  >
                    <option value="PercentBasic">% of Basic</option>
                    <option value="Fixed">Fixed Amount</option>
                  </select>
                  <input
                    type="number"
                    min={0}
                    value={hraValue}
                    onChange={(e) => setHraValue(Number(e.target.value))}
                    className="w-1/2 rounded-xl border p-2 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-800">Conveyance Allowance (₹)</label>
                <input
                  type="number"
                  min={0}
                  value={conveyance}
                  onChange={(e) => setConveyance(Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border p-2 bg-white"
                />
              </div>

              <div>
                <label className="font-bold text-slate-800">Medical Allowance (₹)</label>
                <input
                  type="number"
                  min={0}
                  value={medical}
                  onChange={(e) => setMedical(Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border p-2 bg-white"
                />
              </div>

              <div>
                <label className="font-bold text-slate-800">Special Allowance (₹)</label>
                <input
                  type="number"
                  min={0}
                  value={specialAllowance}
                  onChange={(e) => setSpecialAllowance(Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border p-2 bg-white"
                />
              </div>

              <div>
                <label className="font-bold text-slate-800">Other Allowances (₹)</label>
                <input
                  type="number"
                  min={0}
                  value={otherAllowances}
                  onChange={(e) => setOtherAllowances(Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border p-2 bg-white"
                />
              </div>
            </div>

            <div className="rounded-lg bg-blue-100/60 p-2 text-right font-bold text-blue-900 text-xs">
              Estimated Gross Monthly Salary: ₹{computedGross.toLocaleString('en-IN')}
            </div>
          </div>

          {/* Deductions Group */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3 space-y-3">
            <h4 className="font-bold text-slate-900 border-b pb-1 text-xs text-rose-700">Statutory Deductions</h4>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-800">Provident Fund (PF %)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={pfPercent}
                  onChange={(e) => setPfPercent(Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border p-2 bg-white"
                />
              </div>

              <div>
                <label className="font-bold text-slate-800">Professional Tax (PT ₹)</label>
                <input
                  type="number"
                  min={0}
                  value={ptAmount}
                  onChange={(e) => setPtAmount(Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border p-2 bg-white"
                />
              </div>

              <div>
                <label className="font-bold text-slate-800">TDS / Income Tax (%)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={tdsPercent}
                  onChange={(e) => setTdsPercent(Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border p-2 bg-white"
                />
              </div>

              <div>
                <label className="font-bold text-slate-800">ESI Rate (%)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={esiPercent}
                  onChange={(e) => setEsiPercent(Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border p-2 bg-white"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-900">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="mt-1 w-full rounded-xl border p-2.5 bg-slate-50 focus:border-blue-500 focus:bg-white"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
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
              Save Structure
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
