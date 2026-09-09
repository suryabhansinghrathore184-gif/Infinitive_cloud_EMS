'use client';

import React from 'react';
import { X, Printer, Download, Building2, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { PayrollRecord } from '@/types/admin';
import { useEmsStore } from '@/store/emsStore';

interface ViewPayslipModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: PayrollRecord | null;
}

// Convert numbers to words (INR format)
function numberToWordsINR(num: number): string {
  if (!num || isNaN(num)) return 'Zero Rupees Only';
  const a = [
    '', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ',
    'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function inWords(n: number): string {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + ' ' + a[n % 10];
    if (n < 1000) return a[Math.floor(n / 100)] + 'Hundred ' + inWords(n % 100);
    if (n < 100000) return inWords(Math.floor(n / 1000)) + 'Thousand ' + inWords(n % 1000);
    if (n < 10000000) return inWords(Math.floor(n / 100000)) + 'Lakh ' + inWords(n % 100000);
    return inWords(Math.floor(n / 10000000)) + 'Crore ' + inWords(n % 10000000);
  }

  return `${inWords(Math.floor(num)).trim()} Rupees Only`;
}

export const ViewPayslipModal: React.FC<ViewPayslipModalProps> = ({
  isOpen,
  onClose,
  record,
}) => {
  const { state } = useEmsStore();

  if (!isOpen || !record) return null;

  const company = state.company;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    // Standard browser trigger for print-to-pdf
    window.print();
  };

  const grossEarnings = record.grossSalary;
  const totalDeductions = record.totalDeductions;
  const netPay = record.netSalary;
  const amountInWords = numberToWordsINR(netPay);
  const payslipNo = `PAY-${record.payYear}-${record.payMonth < 10 ? '0' + record.payMonth : record.payMonth}-${record.employeeId}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-xs">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl text-xs text-slate-800 animate-fade-in max-h-[92vh] overflow-y-auto print:max-w-none print:shadow-none print:p-0 print:m-0">
        
        {/* Action bar (Hidden on Print) */}
        <div className="flex items-center justify-between border-b pb-4 mb-4 print:hidden font-bold text-sm text-slate-900">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
            <span>Salary Payslip - {record.payPeriod}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <Printer className="h-4 w-4 text-slate-500" />
              <span>Print</span>
            </button>
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-md hover:bg-blue-700"
            >
              <Download className="h-4 w-4" />
              <span>Download PDF</span>
            </button>
            <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:text-slate-700 ml-2">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Printable Payslip Card Content */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm print:border-none print:p-4 font-sans text-slate-800 space-y-5">
          
          {/* Company & Header */}
          <div className="flex items-start justify-between border-b pb-4 border-slate-200">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 uppercase tracking-tight">{company.name}</h2>
              <p className="text-[11px] text-slate-500">{company.address}, {company.city}, {company.state}, {company.country}</p>
              <p className="text-[11px] text-slate-500">Contact: {company.contactEmail} | {company.contactPhone}</p>
            </div>
            <div className="text-right">
              <span className="inline-block rounded-md bg-blue-50 px-2.5 py-1 font-bold text-blue-700 text-xs border border-blue-200">
                PAYSLIP FOR {record.payPeriod.toUpperCase()}
              </span>
              <p className="text-[10px] text-slate-400 mt-1 font-mono">Payslip ID: {payslipNo}</p>
            </div>
          </div>

          {/* Employee & Pay Summary Info Grid */}
          <div className="grid grid-cols-2 gap-4 rounded-xl bg-slate-50 p-4 border border-slate-100 text-xs">
            <div className="space-y-1.5">
              <div className="flex justify-between"><span className="text-slate-500 font-semibold">Employee Name:</span> <span className="font-bold text-slate-900">{record.employeeName}</span></div>
              <div className="flex justify-between"><span className="text-slate-500 font-semibold">Employee ID:</span> <span className="font-mono text-slate-700">{record.employeeId}</span></div>
              <div className="flex justify-between"><span className="text-slate-500 font-semibold">Department:</span> <span className="text-slate-700">{record.department}</span></div>
              <div className="flex justify-between"><span className="text-slate-500 font-semibold">Designation:</span> <span className="text-slate-700">{record.designation}</span></div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between"><span className="text-slate-500 font-semibold">Pay Period:</span> <span className="font-bold text-slate-900">{record.payPeriod}</span></div>
              <div className="flex justify-between"><span className="text-slate-500 font-semibold">Working Days:</span> <span className="text-slate-700">{record.workingDays} Days</span></div>
              <div className="flex justify-between"><span className="text-slate-500 font-semibold">Days Paid:</span> <span className="text-slate-700">{record.presentDays + record.paidLeaveDays} Days</span></div>
              <div className="flex justify-between"><span className="text-slate-500 font-semibold">Status:</span> <span className="font-bold text-emerald-600">{record.status}</span></div>
            </div>
          </div>

          {/* Earnings & Deductions Tables Side-by-Side */}
          <div className="grid grid-cols-2 gap-4">
            
            {/* Earnings Column */}
            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <div className="bg-slate-100 p-2.5 font-bold text-slate-900 text-xs border-b flex justify-between">
                <span>EARNINGS</span>
                <span>AMOUNT (₹)</span>
              </div>
              <div className="divide-y divide-slate-100 p-2.5 space-y-2 text-[11px]">
                <div className="flex justify-between"><span className="text-slate-600">Basic Salary</span><span className="font-semibold text-slate-800">₹{(record.basicSalary || 0).toLocaleString('en-IN')}</span></div>
                <div className="flex justify-between"><span className="text-slate-600">House Rent Allowance (HRA)</span><span className="font-semibold text-slate-800">₹{(record.hra || 0).toLocaleString('en-IN')}</span></div>
                <div className="flex justify-between"><span className="text-slate-600">Conveyance Allowance</span><span className="font-semibold text-slate-800">₹{(record.conveyance || 0).toLocaleString('en-IN')}</span></div>
                <div className="flex justify-between"><span className="text-slate-600">Medical Allowance</span><span className="font-semibold text-slate-800">₹{(record.medical || 0).toLocaleString('en-IN')}</span></div>
                <div className="flex justify-between"><span className="text-slate-600">Special Allowance</span><span className="font-semibold text-slate-800">₹{(record.specialAllowance || 0).toLocaleString('en-IN')}</span></div>
                {record.overtimePay > 0 && <div className="flex justify-between"><span className="text-slate-600">Overtime Pay</span><span className="font-semibold text-slate-800">₹{record.overtimePay.toLocaleString('en-IN')}</span></div>}
                {record.bonus > 0 && <div className="flex justify-between"><span className="text-slate-600">Bonus</span><span className="font-semibold text-slate-800">₹{record.bonus.toLocaleString('en-IN')}</span></div>}
                {record.otherEarnings > 0 && <div className="flex justify-between"><span className="text-slate-600">Other Earnings</span><span className="font-semibold text-slate-800">₹{record.otherEarnings.toLocaleString('en-IN')}</span></div>}
              </div>
              <div className="bg-blue-50/70 p-2.5 font-bold text-blue-900 text-xs border-t flex justify-between">
                <span>TOTAL GROSS EARNINGS</span>
                <span>₹{grossEarnings.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Deductions Column */}
            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <div className="bg-slate-100 p-2.5 font-bold text-slate-900 text-xs border-b flex justify-between">
                <span>DEDUCTIONS</span>
                <span>AMOUNT (₹)</span>
              </div>
              <div className="divide-y divide-slate-100 p-2.5 space-y-2 text-[11px]">
                <div className="flex justify-between"><span className="text-slate-600">Provident Fund (PF)</span><span className="font-semibold text-slate-800">₹{(record.pfDeduction || 0).toLocaleString('en-IN')}</span></div>
                <div className="flex justify-between"><span className="text-slate-600">Professional Tax (PT)</span><span className="font-semibold text-slate-800">₹{(record.ptDeduction || 0).toLocaleString('en-IN')}</span></div>
                <div className="flex justify-between"><span className="text-slate-600">Tax Deducted at Source (TDS)</span><span className="font-semibold text-slate-800">₹{(record.taxDeduction || 0).toLocaleString('en-IN')}</span></div>
                {record.lopDeduction > 0 && <div className="flex justify-between"><span className="text-slate-600">Loss of Pay (LOP)</span><span className="font-semibold text-rose-600">₹{record.lopDeduction.toLocaleString('en-IN')}</span></div>}
                {record.esiDeduction > 0 && <div className="flex justify-between"><span className="text-slate-600">ESI Deduction</span><span className="font-semibold text-slate-800">₹{record.esiDeduction.toLocaleString('en-IN')}</span></div>}
                {record.loanDeduction > 0 && <div className="flex justify-between"><span className="text-slate-600">Loan / Advance</span><span className="font-semibold text-slate-800">₹{record.loanDeduction.toLocaleString('en-IN')}</span></div>}
                {record.otherDeductions > 0 && <div className="flex justify-between"><span className="text-slate-600">Other Deductions</span><span className="font-semibold text-slate-800">₹{record.otherDeductions.toLocaleString('en-IN')}</span></div>}
              </div>
              <div className="bg-rose-50/70 p-2.5 font-bold text-rose-900 text-xs border-t flex justify-between">
                <span>TOTAL DEDUCTIONS</span>
                <span>₹{totalDeductions.toLocaleString('en-IN')}</span>
              </div>
            </div>

          </div>

          {/* Net Salary Summary Block */}
          <div className="rounded-xl border-2 border-emerald-500 bg-emerald-50/40 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-emerald-800">NET PAYABLE AMOUNT:</span>
              <p className="text-sm font-semibold text-slate-700 italic mt-0.5">{amountInWords}</p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-extrabold text-emerald-700">₹{netPay.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Footer Signatures */}
          <div className="flex items-center justify-between border-t pt-8 text-[10px] text-slate-400">
            <div>
              <p className="font-semibold text-slate-600">System Generated Payslip</p>
              <p>This is a computer generated document and does not require a physical signature.</p>
            </div>
            <div className="text-right border-t border-slate-300 pt-2 font-bold text-slate-700">
              Authorized Signatory ({company.name})
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
