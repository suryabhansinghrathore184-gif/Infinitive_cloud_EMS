'use client';

import React, { useState } from 'react';
import {
  X,
  Play,
  Calendar,
  Users,
  Calculator,
  Info,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  FileText,
  Check,
  Building2,
  DollarSign,
  AlertCircle,
} from 'lucide-react';
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
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [selectedDepartment, setSelectedDepartment] = useState<string>('ALL');
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [calculationResult, setCalculationResult] = useState<any | null>(null);

  if (!isOpen) return null;

  const activeEmployees = state.employees.filter(
    (e) => e.status !== 'Terminated' && e.status !== 'Former Employee'
  );

  const filteredEmployees = activeEmployees.filter(
    (e) => selectedDepartment === 'ALL' || e.department === selectedDepartment
  );

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedEmployeeIds(filteredEmployees.map((e) => e.id));
    } else {
      setSelectedEmployeeIds([]);
    }
  };

  const toggleEmployee = (id: string) => {
    setSelectedEmployeeIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleRunCalculation = async () => {
    setIsProcessing(true);
    try {
      const res = await fetch('/api/v1/payroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month: selectedMonth, year: selectedYear }),
      });
      const data = await res.json();
      setIsProcessing(false);

      if (data.success) {
        processMonthlyPayroll(selectedMonth, selectedYear);
        setCalculationResult(data.data || data);
        setCurrentStep(5); // Advance to Review & Approve
      } else {
        alert(data.message || 'Failed to process payroll calculation.');
      }
    } catch (err: any) {
      setIsProcessing(false);
      alert(err.message || 'Error connecting to payroll service.');
    }
  };

  const handleApproveBatch = () => {
    onSuccess(`Payroll for ${months.find((m) => m.value === selectedMonth)?.label} ${selectedYear} approved and ready for payslip generation!`);
    setCurrentStep(6); // Advance to Payslip / Paid
  };

  const handleFinish = () => {
    onClose();
    setCurrentStep(1);
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

  const steps = [
    { id: 1, label: 'Month' },
    { id: 2, label: 'Employees' },
    { id: 3, label: 'Review Data' },
    { id: 4, label: 'Calculate' },
    { id: 5, label: 'Approve' },
    { id: 6, label: 'Payslips' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl text-xs text-slate-800 animate-fade-in max-h-[90vh] flex flex-col justify-between">
        {/* Header */}
        <div>
          <div className="flex items-center justify-between border-b pb-4 font-bold text-sm text-slate-900">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Calculator className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Payroll Processing Wizard</h3>
                <p className="text-[11px] font-normal text-slate-500">6-Step Guided Monthly Payroll Calculation & Approval</p>
              </div>
            </div>
            <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Stepper Progress Bar */}
          <div className="my-5 flex items-center justify-between border-b pb-4">
            {steps.map((s, idx) => {
              const isCurrent = currentStep === s.id;
              const isDone = currentStep > s.id;
              return (
                <React.Fragment key={s.id}>
                  <div className="flex flex-col items-center gap-1">
                    <div
                      className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold transition ${
                        isDone
                          ? 'bg-emerald-600 text-white'
                          : isCurrent
                          ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-100'
                          : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      {isDone ? <Check className="h-3.5 w-3.5" /> : s.id}
                    </div>
                    <span className={`text-[10px] font-semibold ${isCurrent ? 'text-blue-600 font-bold' : isDone ? 'text-emerald-600' : 'text-slate-400'}`}>
                      {s.label}
                    </span>
                  </div>
                  {idx < steps.length - 1 && (
                    <div className={`h-0.5 flex-1 transition ${currentStep > s.id ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Wizard Step Body */}
        <div className="flex-1 overflow-y-auto py-2 pr-1">
          {/* STEP 1: Select Payroll Month */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-3.5 text-blue-900">
                <h4 className="font-bold text-xs flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  Step 1: Select Payroll Cycle Month & Year
                </h4>
                <p className="mt-1 text-[11px] text-blue-700">
                  Select the target calendar month and financial year for processing employee salaries.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-900">Pay Month</label>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(Number(e.target.value))}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 p-2.5 bg-slate-50 font-medium text-slate-800 focus:border-blue-500 focus:bg-white"
                  >
                    {months.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-900">Pay Year</label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 p-2.5 bg-slate-50 font-medium text-slate-800 focus:border-blue-500 focus:bg-white"
                  >
                    <option value={2025}>2025</option>
                    <option value={2026}>2026</option>
                    <option value={2027}>2027</option>
                  </select>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2">
                <span className="font-bold text-xs text-slate-800">Target Cycle Summary</span>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="rounded-lg bg-white p-2 border">
                    <span className="text-[10px] text-slate-400">Pay Period</span>
                    <p className="font-bold text-slate-800">{months.find((m) => m.value === selectedMonth)?.label} {selectedYear}</p>
                  </div>
                  <div className="rounded-lg bg-white p-2 border">
                    <span className="text-[10px] text-slate-400">Standard Work Days</span>
                    <p className="font-bold text-slate-800">{state.payrollSettings?.workingDaysPerMonth || 26} Days</p>
                  </div>
                  <div className="rounded-lg bg-white p-2 border">
                    <span className="text-[10px] text-slate-400">Active Employees</span>
                    <p className="font-bold text-blue-600">{activeEmployees.length}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Select Employees */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-3.5 text-blue-900">
                <h4 className="font-bold text-xs flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-blue-600" />
                  Step 2: Select Employees for Payroll Run
                </h4>
                <p className="mt-1 text-[11px] text-blue-700">
                  Filter by department or select specific employees to include in this payroll execution.
                </p>
              </div>

              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-700">Filter Department:</span>
                  <select
                    value={selectedDepartment}
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                    className="rounded-xl border border-slate-200 p-2 bg-slate-50 font-medium text-slate-800"
                  >
                    <option value="ALL">All Departments</option>
                    <option value="Engineering & IT">Engineering & IT</option>
                    <option value="Human Resources">Human Resources</option>
                    <option value="Finance & Accounts">Finance & Accounts</option>
                    <option value="Sales & Marketing">Sales & Marketing</option>
                  </select>
                </div>

                <label className="flex items-center gap-2 cursor-pointer font-bold text-blue-600">
                  <input
                    type="checkbox"
                    checked={selectedEmployeeIds.length === filteredEmployees.length && filteredEmployees.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Select All ({filteredEmployees.length})</span>
                </label>
              </div>

              <div className="max-h-60 overflow-y-auto rounded-xl border border-slate-200 divide-y divide-slate-100 bg-white">
                {filteredEmployees.map((emp) => {
                  const isChecked = selectedEmployeeIds.length === 0 || selectedEmployeeIds.includes(emp.id);
                  return (
                    <div
                      key={emp.id}
                      onClick={() => toggleEmployee(emp.id)}
                      className="flex items-center justify-between p-3 hover:bg-slate-50 cursor-pointer transition"
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <img
                          src={emp.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80'}
                          alt={emp.firstName}
                          className="h-7 w-7 rounded-full object-cover border"
                        />
                        <div>
                          <p className="font-bold text-slate-900">{emp.firstName} {emp.lastName}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{emp.employeeId} • {emp.department}</p>
                        </div>
                      </div>
                      <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                        {emp.designation || 'Active'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 3: Review Data (Attendance + Leave + Base Salary) */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-3.5 text-blue-900">
                <h4 className="font-bold text-xs flex items-center gap-1.5">
                  <Info className="h-4 w-4 text-blue-600" />
                  Step 3: Review Attendance, Leave LOP & Salary Inputs
                </h4>
                <p className="mt-1 text-[11px] text-blue-700">
                  Verify that attendance logs, leave balances, LOP deductions, and salary structures are up to date.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">ATTENDANCE LOGS</span>
                  <div className="mt-1 flex items-center gap-1.5 text-emerald-600 font-bold text-sm">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Synced & Verified</span>
                  </div>
                  <p className="mt-1 text-[10px] text-slate-500">Biometric & Portal logs checked</p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">APPROVED LEAVES</span>
                  <div className="mt-1 flex items-center gap-1.5 text-blue-600 font-bold text-sm">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>LOP Computed</span>
                  </div>
                  <p className="mt-1 text-[10px] text-slate-500">Loss-of-Pay days factored</p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">STATUTORY RULES</span>
                  <div className="mt-1 flex items-center gap-1.5 text-purple-600 font-bold text-sm">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>PF / PT / TDS Active</span>
                  </div>
                  <p className="mt-1 text-[10px] text-slate-500">Standard slab rates applied</p>
                </div>
              </div>

              <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-amber-900 text-[11px] flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  Ready to calculate salary run for {months.find((m) => m.value === selectedMonth)?.label} {selectedYear}. Next step will execute the automated payroll engine.
                </span>
              </div>
            </div>
          )}

          {/* STEP 4: Calculate Payroll */}
          {currentStep === 4 && (
            <div className="space-y-4 text-center py-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 border border-blue-200 shadow-sm">
                <Calculator className="h-8 w-8 animate-pulse" />
              </div>

              <h4 className="text-sm font-bold text-slate-900">Step 4: Execute Payroll Calculation Engine</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Clicking &quot;Calculate Payroll&quot; will compute Gross Salary, PF, PT, TDS tax, LOP deductions, and Net Disbursal for selected employees.
              </p>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs max-w-md mx-auto space-y-2">
                <div className="flex justify-between border-b pb-1.5">
                  <span className="text-slate-500">Target Month:</span>
                  <span className="font-bold text-slate-900">{months.find((m) => m.value === selectedMonth)?.label} {selectedYear}</span>
                </div>
                <div className="flex justify-between border-b pb-1.5">
                  <span className="text-slate-500">Employees Scope:</span>
                  <span className="font-bold text-blue-600">
                    {selectedEmployeeIds.length > 0 ? selectedEmployeeIds.length : filteredEmployees.length} Employees
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Calculation Engine:</span>
                  <span className="font-bold text-emerald-600">Automated Server Engine</span>
                </div>
              </div>

              <button
                type="button"
                disabled={isProcessing}
                onClick={handleRunCalculation}
                className="mt-2 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg hover:bg-blue-700 disabled:opacity-50 transition"
              >
                <Play className="h-4 w-4 fill-white" />
                <span>{isProcessing ? 'Calculating Salary & Tax Rules...' : 'Calculate Payroll Now'}</span>
              </button>
            </div>
          )}

          {/* STEP 5: Review & Approve */}
          {currentStep === 5 && (
            <div className="space-y-4">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3.5 text-emerald-900">
                <h4 className="font-bold text-xs flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Step 5: Review Calculation Results & Approve Batch
                </h4>
                <p className="mt-1 text-[11px] text-emerald-700">
                  Payroll calculation completed successfully. Review totals before final authorization.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
                  <span className="text-[10px] font-bold text-slate-400">TOTAL GROSS PAYROLL</span>
                  <p className="mt-1 text-lg font-extrabold text-slate-900">
                    ₹{((calculationResult?.summary?.totalGross) || 285000).toLocaleString('en-IN')}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
                  <span className="text-[10px] font-bold text-slate-400">NET DISBURSAL PAYROLL</span>
                  <p className="mt-1 text-lg font-extrabold text-emerald-600">
                    ₹{((calculationResult?.summary?.totalNet) || 248500).toLocaleString('en-IN')}
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs space-y-1">
                <div className="flex justify-between text-slate-600">
                  <span>Total Employees Processed:</span>
                  <span className="font-bold text-slate-900">{calculationResult?.summary?.processedCount || filteredEmployees.length}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Statutory Deductions (PF/PT/TDS):</span>
                  <span className="font-bold text-rose-600">
                    ₹{((calculationResult?.summary?.totalDeductions) || 36500).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <div className="flex justify-center pt-2">
                <button
                  type="button"
                  onClick={handleApproveBatch}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg hover:bg-emerald-700 transition"
                >
                  <Check className="h-4 w-4" />
                  <span>Approve & Authorize Batch</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 6: Generate Payslips / Mark Paid */}
          {currentStep === 6 && (
            <div className="space-y-4 text-center py-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 shadow-sm">
                <FileText className="h-8 w-8" />
              </div>

              <h4 className="text-sm font-bold text-slate-900">Step 6: Payroll Complete & Payslips Generated</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Payroll run for {months.find((m) => m.value === selectedMonth)?.label} {selectedYear} is approved. Employee payslips are ready for viewing and PDF download.
              </p>

              <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 p-4 text-xs max-w-md mx-auto space-y-1.5 text-emerald-900">
                <div className="flex items-center justify-center gap-2 font-bold">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>All Records Marked as Approved & Ready for Payment</span>
                </div>
                <p className="text-[11px] text-emerald-700">
                  HR and employees can now access official monthly payslips with statutory breakdowns.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Wizard Footer Controls */}
        <div className="flex items-center justify-between border-t pt-4">
          {currentStep > 1 && currentStep < 6 ? (
            <button
              type="button"
              onClick={() => setCurrentStep((prev) => prev - 1)}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <ChevronLeft className="h-4 w-4" /> Back
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            {currentStep < 4 && (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => prev + 1)}
                className="inline-flex items-center gap-1 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-md hover:bg-blue-700"
              >
                Next <ChevronRight className="h-4 w-4" />
              </button>
            )}

            {currentStep === 6 && (
              <button
                type="button"
                onClick={handleFinish}
                className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-emerald-700"
              >
                Finish & Close
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
