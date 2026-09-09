'use client';

import React from 'react';
import { X, AlertTriangle, Trash2, Ban } from 'lucide-react';
import { SalaryStructure, EmployeeSalaryProfile, EmployeeSalaryAssignment } from '@/types/admin';
import { useEmsStore } from '@/store/emsStore';

interface DeleteSalaryStructureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (msg: string) => void;
  targetStructure?: SalaryStructure | null;
  targetProfile?: EmployeeSalaryProfile | null;
  targetAssignment?: EmployeeSalaryAssignment | null;
}

export const DeleteSalaryStructureModal: React.FC<DeleteSalaryStructureModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  targetStructure,
  targetProfile,
  targetAssignment,
}) => {
  const {
    state,
    deleteSalaryStructure,
    updateSalaryStructure,
    deleteSalaryAssignment,
    deactivateSalaryAssignment,
  } = useEmsStore();

  if (!isOpen || (!targetStructure && !targetProfile && !targetAssignment)) return null;

  const targetEmpId = targetAssignment?.employeeId || targetProfile?.employeeId;
  const targetEmp = targetEmpId ? state.employees.find((e) => e.id === targetEmpId || e.employeeId === targetEmpId) : null;
  const empName = targetAssignment?.employeeName || (targetEmp ? `${targetEmp.firstName} ${targetEmp.lastName}` : targetEmpId || '');

  // Check if linked to finalized payroll (Approved, Processed, Paid)
  const isUsedInFinalizedPayroll = (state.payrollRecords || []).some(
    (p) =>
      (p.employeeId === targetEmpId || p.employeeId === targetEmp?.id || p.employeeId === targetEmp?.employeeId) &&
      (p.status === 'Approved' || p.status === 'Processed' || p.status === 'Paid')
  );

  const handleDelete = () => {
    if (targetAssignment) {
      const res = deleteSalaryAssignment(targetAssignment.id);
      if (res.success) {
        onSuccess(res.message);
        onClose();
      } else {
        alert(res.message);
      }
    } else if (targetStructure) {
      const res = deleteSalaryStructure(targetStructure.id);
      if (res.success) {
        onSuccess(res.message);
        onClose();
      } else {
        alert(res.message);
      }
    } else if (targetProfile && targetEmp) {
      if (isUsedInFinalizedPayroll) {
        alert('This salary structure is linked to historical payroll and cannot be deleted. You can deactivate it instead.');
        return;
      }
      delete state.employeeSalaryProfiles[targetEmp.id];
      delete state.employeeSalaryProfiles[targetEmp.employeeId];
      onSuccess(`Salary structure assignment for ${empName} deleted successfully.`);
      onClose();
    }
  };

  const handleDeactivate = () => {
    if (targetAssignment) {
      deactivateSalaryAssignment(targetAssignment.id, 'Historical payroll conflict deactivation');
      onSuccess(`Salary structure assignment for ${empName} deactivated.`);
      onClose();
    } else if (targetStructure) {
      updateSalaryStructure(targetStructure.id, { status: 'Inactive' });
      onSuccess(`Salary structure "${targetStructure.title}" deactivated.`);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl text-xs text-slate-800 animate-fade-in">
        <div className="flex items-center justify-between border-b pb-3 font-bold text-sm text-rose-600">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            <span>Delete Salary Structure?</span>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:text-slate-700">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          {isUsedInFinalizedPayroll ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-amber-900 space-y-2 text-xs">
              <p className="font-bold">Notice: Historical Payroll Conflict</p>
              <p className="text-[11px] text-amber-800">
                This salary structure is linked to historical finalized payroll for <strong className="text-slate-900">{empName}</strong> and cannot be deleted. You can deactivate it instead to preserve historical audit logs.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-slate-900 space-y-1.5 text-xs">
              <p className="font-bold">Are you sure you want to delete this salary structure record?</p>
              {targetAssignment && (
                <div className="text-[11px] text-slate-600 space-y-1 pt-1 border-t mt-1">
                  <div><span className="font-semibold text-slate-500">Employee:</span> {targetAssignment.employeeName} ({targetAssignment.employeeId})</div>
                  <div><span className="font-semibold text-slate-500">Structure:</span> {targetAssignment.structureTitle}</div>
                  <div><span className="font-semibold text-slate-500">Effective Date:</span> {targetAssignment.effectiveDate}</div>
                  <div><span className="font-semibold text-slate-500">Basic Salary:</span> ₹{targetAssignment.basicSalary.toLocaleString('en-IN')}</div>
                </div>
              )}
              {targetProfile && !targetAssignment && (
                <div className="text-[11px] text-slate-600 space-y-1 pt-1 border-t mt-1">
                  <div><span className="font-semibold text-slate-500">Employee:</span> {empName} ({targetProfile.employeeId})</div>
                  <div><span className="font-semibold text-slate-500">Structure:</span> {targetProfile.structureTitle}</div>
                  <div><span className="font-semibold text-slate-500">Effective Date:</span> {targetProfile.effectiveDate}</div>
                  <div><span className="font-semibold text-slate-500">Basic Salary:</span> ₹{targetProfile.basicSalary.toLocaleString('en-IN')}</div>
                </div>
              )}
              {targetStructure && (
                <div className="text-[11px] text-slate-600 space-y-1 pt-1 border-t mt-1">
                  <div><span className="font-semibold text-slate-500">Structure Title:</span> {targetStructure.title}</div>
                  <div><span className="font-semibold text-slate-500">Basic Salary:</span> ₹{targetStructure.basicSalary.toLocaleString('en-IN')}</div>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>

            {isUsedInFinalizedPayroll ? (
              <button
                type="button"
                onClick={handleDeactivate}
                className="flex items-center gap-1.5 rounded-xl bg-amber-600 px-4 py-2 text-xs font-semibold text-white shadow-md hover:bg-amber-700"
              >
                <Ban className="h-3.5 w-3.5" />
                <span>Deactivate</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleDelete}
                className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-md hover:bg-rose-700"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

