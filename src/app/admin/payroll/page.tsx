'use client';

import React, { useState } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { useEmsStore } from '@/store/emsStore';
import {
  Lock,
  CheckCircle2,
  FileText,
  Play,
  CreditCard,
  Search,
  Filter,
  Plus,
  Edit3,
  Trash2,
  Check,
  Building,
  Layers,
  Code2,
  Settings,
  History,
  Eye,
  Sliders,
  DollarSign,
  Download,
} from 'lucide-react';
import { PayrollRecord, SalaryStructure, SalaryRule, PayrollStatus } from '@/types/admin';

// Modals
import { ProcessPayrollModal } from '@/components/modals/ProcessPayrollModal';
import { AddEditSalaryStructureModal } from '@/components/modals/AddEditSalaryStructureModal';
import { AddEditSalaryRuleModal } from '@/components/modals/AddEditSalaryRuleModal';
import { AssignSalaryModal } from '@/components/modals/AssignSalaryModal';
import { EditPayrollModal } from '@/components/modals/EditPayrollModal';
import { DeletePayrollModal } from '@/components/modals/DeletePayrollModal';
import { ViewPayslipModal } from '@/components/modals/ViewPayslipModal';

export default function PayrollPage() {
  const {
    state,
    addSalaryStructure,
    updateSalaryStructure,
    deleteSalaryStructure,
    addSalaryRule,
    updateSalaryRule,
    deleteSalaryRule,
    updatePayrollStatus,
    updatePayrollSettings,
  } = useEmsStore();

  const [activeTab, setActiveTab] = useState<
    'processing' | 'structures' | 'rules' | 'settings' | 'audit'
  >('processing');

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Search & Filters for Payroll Run Table
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'name' | 'gross' | 'net' | 'status'>('net');

  // Modal States
  const [isProcessModalOpen, setIsProcessModalOpen] = useState(false);
  const [isStructureModalOpen, setIsStructureModalOpen] = useState(false);
  const [editingStructure, setEditingStructure] = useState<SalaryStructure | null>(null);

  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<SalaryRule | null>(null);

  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

  const [isEditPayrollOpen, setIsEditPayrollOpen] = useState(false);
  const [selectedPayrollRecord, setSelectedPayrollRecord] = useState<PayrollRecord | null>(null);

  const [isDeletePayrollOpen, setIsDeletePayrollOpen] = useState(false);
  const [payrollToDelete, setPayrollToDelete] = useState<PayrollRecord | null>(null);

  const [isPayslipModalOpen, setIsPayslipModalOpen] = useState(false);
  const [payslipRecord, setPayslipRecord] = useState<PayrollRecord | null>(null);

  // Settings local state
  const [workingDays, setWorkingDays] = useState(state.payrollSettings?.workingDaysPerMonth || 26);
  const [overtimeRate, setOvertimeRate] = useState(state.payrollSettings?.overtimeRatePerHour || 250);
  const [pfDefault, setPfDefault] = useState(state.payrollSettings?.pfDefaultPercent || 12);
  const [ptDefault, setPtDefault] = useState(state.payrollSettings?.ptDefaultAmount || 200);
  const [tdsDefault, setTdsDefault] = useState(state.payrollSettings?.tdsDefaultPercent || 10);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const records = state.payrollRecords || [];
  const structures = state.salaryStructures || [];
  const rules = state.salaryRules || [];
  const employees = state.employees || [];

  // Filtered Payroll Records
  const filteredRecords = records
    .filter((r) => {
      const matchSearch =
        r.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.employeeId.toLowerCase().includes(searchTerm.toLowerCase());
      const matchDept = departmentFilter === 'ALL' || r.department === departmentFilter;
      const matchStatus = statusFilter === 'ALL' || r.status === statusFilter;
      return matchSearch && matchDept && matchStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'name') return a.employeeName.localeCompare(b.employeeName);
      if (sortBy === 'gross') return b.grossSalary - a.grossSalary;
      if (sortBy === 'net') return b.netSalary - a.netSalary;
      return a.status.localeCompare(b.status);
    });

  // Summary Metrics calculations
  const totalNetDisbursed = records.reduce((acc, r) => acc + (r.netSalary || 0), 0);
  const totalStatutoryDeductions = records.reduce(
    (acc, r) => acc + (r.pfDeduction || 0) + (r.ptDeduction || 0) + (r.taxDeduction || 0),
    0
  );
  const payslipsGeneratedCount = records.filter(
    (r) => r.status === 'Approved' || r.status === 'Processed' || r.status === 'Paid'
  ).length;

  // Handlers for Structure CRUD
  const handleSaveStructure = (structData: Omit<SalaryStructure, 'id'>) => {
    if (editingStructure) {
      updateSalaryStructure(editingStructure.id, structData);
      showToast(`Updated salary structure "${structData.title}"`);
    } else {
      addSalaryStructure(structData);
      showToast(`Created salary structure "${structData.title}"`);
    }
    setEditingStructure(null);
  };

  const handleDeleteStructure = (id: string) => {
    const res = deleteSalaryStructure(id);
    showToast(res.message);
  };

  // Handlers for Rule CRUD
  const handleSaveRule = (ruleData: Omit<SalaryRule, 'id'>) => {
    if (editingRule) {
      updateSalaryRule(editingRule.id, ruleData);
      showToast(`Updated salary rule "${ruleData.name}"`);
    } else {
      addSalaryRule(ruleData);
      showToast(`Created salary rule "${ruleData.name}"`);
    }
    setEditingRule(null);
  };

  const handleDeleteRule = (id: string) => {
    deleteSalaryRule(id);
    showToast('Deleted salary rule successfully.');
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updatePayrollSettings({
      workingDaysPerMonth: Number(workingDays),
      overtimeRatePerHour: Number(overtimeRate),
      pfDefaultPercent: Number(pfDefault),
      ptDefaultAmount: Number(ptDefault),
      tdsDefaultPercent: Number(tdsDefault),
    });
    showToast('Payroll configuration settings saved successfully!');
  };

  return (
    <AdminLayout
      pageTitle="Monthly Payroll Processing"
      breadcrumbs={[{ label: 'Payroll', href: '/admin/payroll' }]}
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed right-6 top-20 z-50 flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs text-white shadow-xl">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900">Monthly Payroll Processing</h2>
            <span className="flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 border border-amber-200">
              <Lock className="h-3 w-3" /> Confidential
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Calculate salary components, statutory deductions (PF/PT/TDS), and approve payslips
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsAssignModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50"
          >
            <DollarSign className="h-4 w-4 text-blue-600" />
            <span>Assign Salary</span>
          </button>
          <button
            onClick={() => setIsProcessModalOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-md hover:bg-blue-700 transition"
          >
            <Play className="h-4 w-4 fill-white" />
            <span>Process Payroll</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-200 text-xs font-bold gap-6">
        <button
          onClick={() => setActiveTab('processing')}
          className={`flex items-center gap-1.5 pb-3 border-b-2 transition ${
            activeTab === 'processing'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <CreditCard className="h-4 w-4" />
          <span>Monthly Payroll Run</span>
        </button>

        <button
          onClick={() => setActiveTab('structures')}
          className={`flex items-center gap-1.5 pb-3 border-b-2 transition ${
            activeTab === 'structures'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="h-4 w-4" />
          <span>Salary Structures ({structures.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('rules')}
          className={`flex items-center gap-1.5 pb-3 border-b-2 transition ${
            activeTab === 'rules'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Code2 className="h-4 w-4" />
          <span>Salary Rules ({rules.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-1.5 pb-3 border-b-2 transition ${
            activeTab === 'settings'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Settings className="h-4 w-4" />
          <span>Payroll Settings</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center gap-1.5 pb-3 border-b-2 transition ${
            activeTab === 'audit'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <History className="h-4 w-4" />
          <span>Audit Log</span>
        </button>
      </div>

      {/* TAB 1: MONTHLY PAYROLL RUN */}
      {activeTab === 'processing' && (
        <div className="space-y-4">
          {/* Automated Payroll Calculation Flow */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm text-xs">
            <h4 className="font-bold text-slate-900 mb-2">Automated Payroll Calculation Flow</h4>
            <div className="flex flex-wrap items-center gap-2 font-medium text-slate-600">
              <span
                onClick={() => showToast('Employee Master data loaded into engine scope.')}
                className="rounded-lg bg-slate-100 px-3 py-1.5 border border-slate-200 cursor-pointer hover:bg-blue-50"
              >
                Employee Master
              </span>
              <span>→</span>
              <span
                onClick={() => showToast('Attendance records synced for calculation.')}
                className="rounded-lg bg-slate-100 px-3 py-1.5 border border-slate-200 cursor-pointer hover:bg-blue-50"
              >
                Attendance Data
              </span>
              <span>→</span>
              <span
                onClick={() => showToast('Approved leave days & LOP computed.')}
                className="rounded-lg bg-slate-100 px-3 py-1.5 border border-slate-200 cursor-pointer hover:bg-blue-50"
              >
                Approved Leaves
              </span>
              <span>→</span>
              <span
                onClick={() => showToast('Overtime hours & bonuses applied.')}
                className="rounded-lg bg-slate-100 px-3 py-1.5 border border-slate-200 cursor-pointer hover:bg-blue-50"
              >
                Overtime & Bonus
              </span>
              <span>→</span>
              <span className="rounded-lg bg-blue-50 text-blue-700 px-3 py-1.5 border border-blue-200 font-bold">
                Net Salary
              </span>
              <span>→</span>
              <span className="rounded-lg bg-emerald-50 text-emerald-700 px-3 py-1.5 border border-emerald-200 font-bold">
                Payslip PDF
              </span>
            </div>
          </div>

          {/* Summary Metrics */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <span className="text-xs font-semibold text-slate-500">TOTAL NET PAYROLL</span>
              <p className="mt-2 text-2xl font-extrabold text-slate-900">
                ₹{totalNetDisbursed.toLocaleString('en-IN')}
              </p>
              <span className="text-[10px] text-slate-400">Current Cycle Sum</span>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <span className="text-xs font-semibold text-slate-500">STATUTORY DEDUCTIONS</span>
              <p className="mt-2 text-2xl font-extrabold text-slate-900">
                ₹{totalStatutoryDeductions.toLocaleString('en-IN')}
              </p>
              <span className="text-[10px] text-slate-400">PF + PT + TDS Income Tax</span>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <span className="text-xs font-semibold text-slate-500">PAYSLIPS GENERATED</span>
              <p className="mt-2 text-2xl font-extrabold text-emerald-600">
                {payslipsGeneratedCount} / {records.length || employees.length}
              </p>
              <span className="text-[10px] text-slate-400">Ready for Disbursal</span>
            </div>
          </div>

          {/* Filters & Search Toolbar */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-200 bg-white p-3 shadow-sm text-xs">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by Employee Name or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-4 bg-slate-50 focus:border-blue-500 focus:bg-white"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="rounded-xl border border-slate-200 p-2 bg-slate-50 font-medium text-slate-700"
              >
                <option value="ALL">All Departments</option>
                <option value="Engineering & IT">Engineering & IT</option>
                <option value="Human Resources">Human Resources</option>
                <option value="Finance & Accounts">Finance & Accounts</option>
                <option value="Sales & Marketing">Sales & Marketing</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-xl border border-slate-200 p-2 bg-slate-50 font-medium text-slate-700"
              >
                <option value="ALL">All Statuses</option>
                <option value="Draft">Draft</option>
                <option value="Calculated">Calculated</option>
                <option value="Approved">Approved</option>
                <option value="Processed">Processed</option>
                <option value="Paid">Paid</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="rounded-xl border border-slate-200 p-2 bg-slate-50 font-medium text-slate-700"
              >
                <option value="net">Sort: Net Salary</option>
                <option value="gross">Sort: Gross Salary</option>
                <option value="name">Sort: Employee Name</option>
                <option value="status">Sort: Status</option>
              </select>
            </div>
          </div>

          {/* Payroll Table */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {filteredRecords.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                  <CreditCard className="h-6 w-6" />
                </div>
                <h4 className="mt-3 text-sm font-bold text-slate-800">No payroll records matching criteria</h4>
                <p className="mt-1 max-w-xs text-xs text-slate-500">
                  Click &quot;Process Payroll&quot; to compute monthly payroll for active employees.
                </p>
                <button
                  onClick={() => setIsProcessModalOpen(true)}
                  className="mt-4 flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-md hover:bg-blue-700"
                >
                  <Play className="h-3.5 w-3.5 fill-white" />
                  <span>Process Payroll Run</span>
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50 text-slate-500 font-semibold">
                      <th className="px-4 py-3.5">Employee</th>
                      <th className="px-4 py-3.5">Department</th>
                      <th className="px-4 py-3.5">Pay Period</th>
                      <th className="px-4 py-3.5 text-right">Gross Salary</th>
                      <th className="px-4 py-3.5 text-right">Deductions</th>
                      <th className="px-4 py-3.5 text-right">Net Salary</th>
                      <th className="px-4 py-3.5 text-center">Status</th>
                      <th className="px-4 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredRecords.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50/60">
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <img
                              src={
                                r.avatar ||
                                'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80'
                              }
                              alt={r.employeeName}
                              className="h-8 w-8 rounded-full object-cover border"
                            />
                            <div>
                              <p className="font-bold text-slate-900">{r.employeeName}</p>
                              <p className="text-[10px] text-slate-400 font-mono">{r.employeeId}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-slate-700">
                          <div>{r.department}</div>
                          <div className="text-[10px] text-slate-400">{r.designation}</div>
                        </td>
                        <td className="px-4 py-3.5 text-slate-700 font-medium">{r.payPeriod}</td>
                        <td className="px-4 py-3.5 text-right font-bold text-slate-900">
                          ₹{r.grossSalary.toLocaleString('en-IN')}
                        </td>
                        <td className="px-4 py-3.5 text-right font-semibold text-rose-600">
                          ₹{r.totalDeductions.toLocaleString('en-IN')}
                        </td>
                        <td className="px-4 py-3.5 text-right font-extrabold text-emerald-600">
                          ₹{r.netSalary.toLocaleString('en-IN')}
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${
                              r.status === 'Paid' || r.status === 'Processed'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : r.status === 'Approved'
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : r.status === 'Calculated'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}
                          >
                            {r.status}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right space-x-1">
                          {/* View Payslip */}
                          <button
                            title="View / Print Payslip"
                            onClick={() => {
                              setPayslipRecord(r);
                              setIsPayslipModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            <Eye className="h-3.5 w-3.5 text-blue-600" /> Payslip
                          </button>

                          {/* Edit (if Draft / Calculated / Pending) */}
                          {(r.status === 'Draft' || r.status === 'Calculated') && (
                            <button
                              title="Edit Adjustments"
                              onClick={() => {
                                setSelectedPayrollRecord(r);
                                setIsEditPayrollOpen(true);
                              }}
                              className="inline-flex items-center rounded-lg border border-slate-200 bg-white p-1 text-slate-600 hover:bg-slate-50"
                            >
                              <Edit3 className="h-3.5 w-3.5 text-amber-600" />
                            </button>
                          )}

                          {/* Approve Action */}
                          {r.status === 'Calculated' && (
                            <button
                              title="Approve Payroll"
                              onClick={() => {
                                updatePayrollStatus(r.id, 'Approved');
                                showToast(`Payroll for ${r.employeeName} approved.`);
                              }}
                              className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-2 py-1 font-semibold text-white hover:bg-blue-700"
                            >
                              <Check className="h-3.5 w-3.5" /> Approve
                            </button>
                          )}

                          {/* Process / Pay Action */}
                          {r.status === 'Approved' && (
                            <button
                              title="Mark Disbursed / Paid"
                              onClick={() => {
                                updatePayrollStatus(r.id, 'Paid');
                                showToast(`Payroll for ${r.employeeName} marked as PAID.`);
                              }}
                              className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2 py-1 font-semibold text-white hover:bg-emerald-700"
                            >
                              Mark Paid
                            </button>
                          )}

                          {/* Delete Action (only Draft or Calculated) */}
                          {(r.status === 'Draft' || r.status === 'Calculated') && (
                            <button
                              title="Delete Record"
                              onClick={() => {
                                setPayrollToDelete(r);
                                setIsDeletePayrollOpen(true);
                              }}
                              className="inline-flex items-center rounded-lg border border-slate-200 bg-white p-1 text-rose-600 hover:bg-rose-50"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: SALARY STRUCTURES */}
      {activeTab === 'structures' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Salary Structures & Templates</h3>
              <p className="text-xs text-slate-500">
                Define pre-configured earning and deduction templates for your organization
              </p>
            </div>
            <button
              onClick={() => {
                setEditingStructure(null);
                setIsStructureModalOpen(true);
              }}
              className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-md hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              <span>+ Add Salary Structure</span>
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {structures.map((s) => (
              <div
                key={s.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3 hover:border-blue-300 transition"
              >
                <div className="flex items-start justify-between border-b pb-2">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{s.title}</h4>
                    <p className="text-xs text-slate-500">{s.description}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setEditingStructure(s);
                        setIsStructureModalOpen(true);
                      }}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteStructure(s.id)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-500">Basic Salary:</span>
                    <p className="font-bold text-slate-900">₹{s.basicSalary.toLocaleString('en-IN')}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">HRA Allowance:</span>
                    <p className="font-bold text-slate-900">
                      {s.hraType === 'PercentBasic' ? `${s.hraValue}% of Basic` : `₹${s.hraValue}`}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500">Conveyance / Medical:</span>
                    <p className="font-semibold text-slate-700">₹{s.conveyance} / ₹{s.medical}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Statutory PF / PT:</span>
                    <p className="font-semibold text-slate-700">{s.pfPercent}% / ₹{s.ptAmount}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: SALARY RULES */}
      {activeTab === 'rules' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Salary Rules & Script Configurations</h3>
              <p className="text-xs text-slate-500">
                Configure dynamic earning formulas, PF, PT, and tax rules evaluated by the payroll engine
              </p>
            </div>
            <button
              onClick={() => {
                setEditingRule(null);
                setIsRuleModalOpen(true);
              }}
              className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-md hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              <span>+ Create Salary Rule</span>
            </button>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-slate-500 font-semibold">
                  <th className="px-4 py-3.5">Rule Name</th>
                  <th className="px-4 py-3.5">Code</th>
                  <th className="px-4 py-3.5">Type</th>
                  <th className="px-4 py-3.5">Calculation Engine</th>
                  <th className="px-4 py-3.5">Value / Formula</th>
                  <th className="px-4 py-3.5">Scope</th>
                  <th className="px-4 py-3.5 text-center">Active</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rules.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3.5 font-bold text-slate-900">{r.name}</td>
                    <td className="px-4 py-3.5 font-mono text-slate-600">{r.code}</td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                          r.type === 'Earning' ? 'bg-blue-50 text-blue-700' : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        {r.type}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-700">{r.calcType}</td>
                    <td className="px-4 py-3.5 font-bold text-slate-900">{String(r.value)}</td>
                    <td className="px-4 py-3.5 text-slate-500">{r.appliesTo}</td>
                    <td className="px-4 py-3.5 text-center">
                      <span className={`h-2.5 w-2.5 rounded-full inline-block ${r.active ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                    </td>
                    <td className="px-4 py-3.5 text-right space-x-1">
                      <button
                        onClick={() => {
                          setEditingRule(r);
                          setIsRuleModalOpen(true);
                        }}
                        className="p-1 text-slate-500 hover:text-blue-600"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDeleteRule(r.id)} className="p-1 text-slate-500 hover:text-rose-600">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: PAYROLL SETTINGS */}
      {activeTab === 'settings' && (
        <div className="max-w-2xl space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Payroll Engine Settings</h3>
            <p className="text-xs text-slate-500">Configure global parameters for payroll calculation runs</p>
          </div>

          <form onSubmit={handleSaveSettings} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-slate-900">Standard Working Days per Month</label>
                <input
                  type="number"
                  required
                  value={workingDays}
                  onChange={(e) => setWorkingDays(Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border p-2.5 bg-slate-50"
                />
              </div>

              <div>
                <label className="font-bold text-slate-900">Overtime Rate per Hour (₹)</label>
                <input
                  type="number"
                  required
                  value={overtimeRate}
                  onChange={(e) => setOvertimeRate(Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border p-2.5 bg-slate-50"
                />
              </div>

              <div>
                <label className="font-bold text-slate-900">PF Default Rate (%)</label>
                <input
                  type="number"
                  required
                  value={pfDefault}
                  onChange={(e) => setPfDefault(Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border p-2.5 bg-slate-50"
                />
              </div>

              <div>
                <label className="font-bold text-slate-900">PT Default Monthly Amount (₹)</label>
                <input
                  type="number"
                  required
                  value={ptDefault}
                  onChange={(e) => setPtDefault(Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border p-2.5 bg-slate-50"
                />
              </div>

              <div>
                <label className="font-bold text-slate-900">TDS Default Rate (%)</label>
                <input
                  type="number"
                  required
                  value={tdsDefault}
                  onChange={(e) => setTdsDefault(Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border p-2.5 bg-slate-50"
                />
              </div>
            </div>

            <div className="flex justify-end pt-3">
              <button
                type="submit"
                className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-semibold text-white shadow-md hover:bg-blue-700"
              >
                Save Settings
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 5: AUDIT LOG */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Payroll Audit Trail</h3>
            <p className="text-xs text-slate-500">Audit history log of all payroll calculations, status approvals, and modifications</p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-slate-500 font-semibold">
                  <th className="px-4 py-3.5">User</th>
                  <th className="px-4 py-3.5">Action Executed</th>
                  <th className="px-4 py-3.5">Category</th>
                  <th className="px-4 py-3.5">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(state.activities || []).map((act) => (
                  <tr key={act.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3.5 font-bold text-slate-900">{act.user || 'Admin'}</td>
                    <td className="px-4 py-3.5 text-slate-700">{act.action}</td>
                    <td className="px-4 py-3.5">
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 border">
                        {act.category || 'system'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-400 font-mono">{act.timestamp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ALL MODAL INSTANCES */}
      <ProcessPayrollModal
        isOpen={isProcessModalOpen}
        onClose={() => setIsProcessModalOpen(false)}
        onSuccess={(msg) => showToast(msg)}
      />

      <AddEditSalaryStructureModal
        isOpen={isStructureModalOpen}
        onClose={() => setIsStructureModalOpen(false)}
        onSave={handleSaveStructure}
        initialData={editingStructure}
      />

      <AddEditSalaryRuleModal
        isOpen={isRuleModalOpen}
        onClose={() => setIsRuleModalOpen(false)}
        onSave={handleSaveRule}
        initialData={editingRule}
      />

      <AssignSalaryModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        onSuccess={(msg) => showToast(msg)}
      />

      <EditPayrollModal
        isOpen={isEditPayrollOpen}
        onClose={() => setIsEditPayrollOpen(false)}
        onSuccess={(msg) => showToast(msg)}
        record={selectedPayrollRecord}
      />

      <DeletePayrollModal
        isOpen={isDeletePayrollOpen}
        onClose={() => setIsDeletePayrollOpen(false)}
        onSuccess={(msg) => showToast(msg)}
        record={payrollToDelete}
      />

      <ViewPayslipModal
        isOpen={isPayslipModalOpen}
        onClose={() => setIsPayslipModalOpen(false)}
        record={payslipRecord}
      />
    </AdminLayout>
  );
}
