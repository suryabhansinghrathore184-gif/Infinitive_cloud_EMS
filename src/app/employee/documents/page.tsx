'use client';

import React, { useState, useEffect } from 'react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { FileText, RefreshCw, Download, File, ShieldCheck, Folder } from 'lucide-react';

interface DocumentRecord {
  _id?: string;
  id?: string;
  filename?: string;
  title?: string;
  category?: string;
  fileSize?: number;
  uploadedAt?: string;
  fileId?: string;
}

export default function EmployeeDocumentsPage() {
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDocuments = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/v1/documents');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setDocuments(data.data || []);
        }
      }
    } catch (err) {
      console.error('Error fetching documents:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  return (
    <AuthGuard allowedRoles={['EMPLOYEE', 'SUPER_ADMIN', 'ADMIN', 'HR', 'MANAGER']}>
      <AdminLayout
        allowedRoles={['EMPLOYEE', 'SUPER_ADMIN', 'ADMIN', 'HR', 'MANAGER']}
        pageTitle="My Documents"
        breadcrumbs={[
          { label: 'My Workspace', href: '/employee/dashboard' },
          { label: 'My Documents', href: '/employee/documents' },
        ]}
      >
        <div className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">My Secure HR Documents & Vault</h1>
              <p className="text-xs text-slate-500 mt-1">
                Access official employment contracts, ID identity verification files, certificates, and HR documents.
              </p>
            </div>
            <button
              onClick={fetchDocuments}
              disabled={isLoading}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh Vault</span>
            </button>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
            {isLoading ? (
              <div className="p-12 text-center text-xs text-slate-500">
                <RefreshCw className="h-5 w-5 animate-spin text-indigo-600 mx-auto mb-2" />
                <span>Loading your secure document repository...</span>
              </div>
            ) : documents.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-500">
                <Folder className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                <p className="font-bold text-slate-700 text-sm">No personal documents found</p>
                <p className="text-xs text-slate-400 mt-1">When HR or you upload personal records, they will be securely stored here.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4">Document Title</th>
                      <th className="py-3.5 px-4">Category</th>
                      <th className="py-3.5 px-4">Upload Date</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {documents.map((doc) => (
                      <tr key={doc._id || doc.id} className="hover:bg-slate-50/80">
                        <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-2">
                          <FileText className="h-4 w-4 text-indigo-600 shrink-0" />
                          <span>{doc.filename || doc.title || 'Official HR Document'}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-700">
                            {doc.category || 'General'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">{doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString() : 'N/A'}</td>
                        <td className="py-3.5 px-4 text-right">
                          <a
                            href={`/api/v1/documents/${doc._id || doc.id}/file`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 px-3 py-1 text-indigo-700 font-bold hover:bg-indigo-100 transition-colors cursor-pointer"
                          >
                            <Download className="h-3.5 w-3.5" />
                            <span>Download</span>
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </AdminLayout>
    </AuthGuard>
  );
}
