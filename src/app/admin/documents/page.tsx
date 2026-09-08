'use client';

import React, { useState } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { mockEmployeeDocuments } from '@/data/modulesData';
import { FileText, Lock, Upload, Download, Eye, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function DocumentsPage() {
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <AdminLayout
      pageTitle="Document Vault"
      breadcrumbs={[{ label: 'Documents', href: '/admin/documents' }]}
    >
      {/* Toast */}
      {toastMessage && (
        <div className="fixed right-6 top-20 z-50 flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs text-white shadow-xl">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Secure HR Document Management</h2>
          <p className="text-xs text-slate-500">
            Encrypted storage for offer letters, appointment docs, identity proofs, and payslips
          </p>
        </div>

        <button
          onClick={() => showToast('Opening secure document upload dialog...')}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-md hover:bg-blue-700"
        >
          <Upload className="h-4 w-4" />
          <span>Upload Document</span>
        </button>
      </div>

      {/* Documents Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50 text-slate-500 font-semibold">
              <th className="px-4 py-3.5">Document Title</th>
              <th className="px-4 py-3.5">Employee</th>
              <th className="px-4 py-3.5">Category</th>
              <th className="px-4 py-3.5">File Size</th>
              <th className="px-4 py-3.5">Upload Date</th>
              <th className="px-4 py-3.5">Access Role</th>
              <th className="px-4 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {mockEmployeeDocuments.map((doc) => (
              <tr key={doc.id} className="hover:bg-slate-50/60">
                <td className="px-4 py-3.5 font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-600" />
                  {doc.title}
                </td>
                <td className="px-4 py-3.5 text-slate-700 font-medium">{doc.employeeName}</td>
                <td className="px-4 py-3.5">
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                    {doc.category}
                  </span>
                </td>
                <td className="px-4 py-3.5 text-slate-500">{doc.fileSize}</td>
                <td className="px-4 py-3.5 text-slate-500">{doc.uploadDate}</td>
                <td className="px-4 py-3.5">
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 border border-amber-200">
                    <Lock className="h-2.5 w-2.5" /> {doc.accessRole}
                  </span>
                </td>
                <td className="px-4 py-3.5 text-right">
                  <button
                    onClick={() => showToast(`Generating presigned URL for ${doc.fileName}...`)}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <Download className="h-3.5 w-3.5 text-blue-600" /> Download
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
