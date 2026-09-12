'use client';

import React, { useState, useEffect } from 'react';
import { X, UserCheck } from 'lucide-react';
import { Employee, EmployeeSalaryAssignment } from '@/types/admin';
import { useEmsStore } from '@/store/emsStore';

interface AssignSalaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (msg: string) => void;
  selectedEmployee?: Employee | null;
  editingAssignment?: EmployeeSalaryAssignment | null;
}

export const AssignSalaryModal: React.FC<AssignSalaryModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  selectedEmployee,
  editingAssignment,
}) => {
  const { state, addSalaryAssignment, updateSalaryAssignment } = useEmsStore();

  const [employeeId, setEmployeeId] = useState<string>('');
  const [selectedStructureId, setSelectedStructureId] = useState<string>('struct-std');
  const [basicSalary, setBasicSalary] = useState<number>(60000);
  const [hra, setHra] = useState<number>(24000);
  const [conveyance, setConveyance] = useState<number>(3000);
  const [medical, setMedical] = useState<number>(2000);
  const [specialAllowance, setSpecialAllowance] = useState<number>(10000);
  const [bonus, setBonus] = useState<number>(0);
  const [pfEnabled, setPfEnabled] = useState<boolean>(true);
  const [ptEnabled, setPtEnabled] = useState<boolean>(true);
  const [tdsPercent, setTdsPercent] = useState<number>(10);
  const [effectiveDate, setEffectiveDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [changeReason, setChangeReason] = useState<string>('Annual Salary Revision / Assignment');

  useEffect(() => {
    if (editingAssignment) {
      setEmployeeId(editingAssignment.employeeId);
      if (editingAssignment.structureId) {
        setSelectedStructureId(editingAssignment.structureId);
      }
      setBasicSalary(editingAssignment.basicSalary);
      setHra(editingAssignment.hra);
      setConveyance(editingAssignment.conveyance);
      setMedical(editingAssignment.medical);
      setSpecialAllowance(editingAssignment.specialAllowance);
      setBonus(editingAssignment.bonus || 0);
      setPfEnabled(editingAssignment.pfEnabled);
      setPtEnabled(editingAssignment.ptEnabled);
      setTdsPercent(editingAssignment.tdsPercent || 10);
      setEffectiveDate(editingAssignment.effectiveDate || new Date().toISOString().split('T')[0]);
      setChangeReason(editingAssignment.revisionReason || 'Salary structure updated');
    } else if (selectedEmployee?.id) {
      setEmployeeId(selectedEmployee.id);
    } else if (state.employees && state.employees.length > 0 && !employeeId) {
      setEmployeeId(state.employees[0].id || state.employees[0].employeeId);
    }
  }, [editingAssignment, selectedEmployee, state.employees]);

  if (!isOpen) return null;

  const handleStructureSelect = (structId: string) => {
    setSelectedStructureId(structId);
    const struct = state.salaryStructures.find((s) => s.id === structId);
    if (struct) {
      setBasicSalary(struct.basicSalary);
      const computedHra = struct.hraType === 'PercentBasic' ? Math.round((struct.basicSalary * struct.hraValue) / 100) : struct.hraValue;
      setHra(computedHra);
      setConveyance(struct.conveyance);
      setMedical(struct.medical);
      setSpecialAllowance(struct.specialAllowance);
      setTdsPercent(struct.tdsPercent);
    }
  };

  const handleBasicSalaryChange = (newBasic: number) => {
    setBasicSalary(newBasic);
    const struct = state.salaryStructures.find((s) => s.id === selectedStructureId);
    if (struct && struct.hraType === 'PercentBasic') {
      setHra(Math.round((newBasic * struct.hraValue) / 100));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetEmpId = employeeId || selectedEmployee?.id || state.employees[0]?.id;
    if (!targetEmpId) {
      alert('Please select a valid employee.');
      return;
    }

    const empObj = state.employees.find((e) => e.id === targetEmpId || e.employeeId === targetEmpId);
    const empName = empObj ? `${empObj.firstName} ${empObj.lastName}` : 'Employee';
    const structObj = state.salaryStructures.find((s) => s.id === selectedStructureId);

    try {
      const res = await fetch('/api/v1/payroll/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: empObj?.employeeId || targetEmpId,
          salaryStructureId: selectedStructureId,
          basicSalary: Number(basicSalary) || 0,
          hra: Number(hra) || 0,
          conveyance: Number(conveyance) || 0,
          medical: Number(medical) || 0,
          specialAllowance: Number(specialAllowance) || 0,
          bonus: Number(bonus) || 0,
          effectiveFrom: effectiveDate,
        }),
      });
      const data = await res.json();

      if (data.success) {
        addSalaryAssignment({
          employeeId: targetEmpId,
          employeeName: empName,
          structureId: selectedStructureId,
          structureTitle: structObj?.title || 'Custom Structure',
          basicSalary: Number(basicSalary) || 0,
          hra: Number(hra) || 0,
          conveyance: Number(conveyance) || 0,
          medical: Number(medical) || 0,
          specialAllowance: Number(specialAllowance) || 0,
          otherAllowances: 0,
          bonus: Number(bonus) || 0,
          pfEnabled,
          pfPercent: state.payrollSettings?.pfDefaultPercent || 12,
          ptEnabled,
          ptAmount: state.payrollSettings?.ptDefaultAmount || 200,
          tdsPercent,
          esiEnabled: false,
          esiPercent: 0,
          effectiveDate,
          status: 'Active',
          revisionReason: changeReason,
          createdBy: 'Admin',
        });
        onSuccess(editingAssignment ? `Salary updated successfully for ${empName}` : `Salary assigned successfully to ${empName}`);
        onClose();
      } else {
        alert(data.message || 'Failed to assign salary structure.');
      }
    } catch (err: any) {
      alert(err.message || 'Error connecting to salary service.');
    }
  };

  const computedGross = Number(basicSalary) + Number(hra) + Number(conveyance) + Number(medical) + Number(specialAllowance) + Number(bonus);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl text-xs text-slate-800 animate-fade-in max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b pb-3 font-bold text-sm text-slate-900">
          <div className="flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-blue-600" />
            <span>{editingAssignment ? 'Edit Employee Salary Structure' : 'Assign / Change Employee Salary Structure'}</span>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:text-slate-700">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div>
            <label className="font-bold text-slate-900">Select Employee *</label>
            <select
              value={employeeId}
              disabled={!!editingAssignment}
              onChange={(e) => setEmployeeId(e.target.value)}
              className="mt-1 w-full rounded-xl border p-2.5 bg-slate-50 focus:border-blue-500 focus:bg-white disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {state.employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.firstName} {e.lastName} ({e.employeeId}) - {e.department}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-900">Preset Salary Structure</label>
              <select
                value={selectedStructureId}
                onChange={(e) => handleStructureSelect(e.target.value)}
                className="mt-1 w-full rounded-xl border p-2.5 bg-slate-50 focus:border-blue-500 focus:bg-white"
              >
                {state.salaryStructures.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-900">Effective Date *</label>
              <input
                type="date"
                required
                value={effectiveDate}
                onChange={(e) => setEffectiveDate(e.target.value)}
                className="mt-1 w-full rounded-xl border p-2.5 bg-slate-50 focus:border-blue-500 focus:bg-white"
              />
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3 space-y-3">
            <h4 className="font-bold text-slate-900 border-b pb-1 text-xs text-blue-700">Salary Earnings Breakdown</h4>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-800">Basic Salary (₹)</label>
                <input
                  type="number"
                  min={0}
                  required
                  value={basicSalary}
                  onChange={(e) => handleBasicSalaryChange(Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border p-2 bg-white"
                />
              </div>

              <div>
                <label className="font-bold text-slate-800">House Rent Allowance (HRA ₹)</label>
                <input
                  type="number"
                  min={0}
                  value={hra}
                  onChange={(e) => setHra(Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border p-2 bg-white"
                />
              </div>

              <div>
                <label className="font-bold text-slate-800">Conveyance (₹)</label>
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
                <label className="font-bold text-slate-800">Regular Monthly Bonus (₹)</label>
                <input
                  type="number"
                  min={0}
                  value={bonus}
                  onChange={(e) => setBonus(Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border p-2 bg-white"
                />
              </div>
            </div>

            <div className="rounded-lg bg-emerald-100/60 p-2 text-right font-bold text-emerald-900 text-xs">
              Configured Monthly Gross: ₹{computedGross.toLocaleString('en-IN')}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3 space-y-2">
            <h4 className="font-bold text-slate-900 border-b pb-1 text-xs text-rose-700">Deduction Options</h4>
            <div className="flex flex-wrap gap-4 pt-1">
              <label className="flex items-center gap-1.5 cursor-pointer font-bold text-slate-800">
                <input
                  type="checkbox"
                  checked={pfEnabled}
                  onChange={(e) => setPfEnabled(e.target.checked)}
                  className="h-4 w-4 text-blue-600 rounded"
                />
                Deduct PF (12%)
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer font-bold text-slate-800">
                <input
                  type="checkbox"
                  checked={ptEnabled}
                  onChange={(e) => setPtEnabled(e.target.checked)}
                  className="h-4 w-4 text-blue-600 rounded"
                />
                Deduct Professional Tax (₹200)
              </label>
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-900">Revision Reason / Audit Note</label>
            <input
              type="text"
              required
              value={changeReason}
              onChange={(e) => setChangeReason(e.target.value)}
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
              className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-md hover:bg-blue-700"
            >
              {editingAssignment ? 'Update Salary Structure' : 'Assign Salary Structure'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

