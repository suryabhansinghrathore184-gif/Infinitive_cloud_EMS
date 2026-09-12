'use client';

import React, { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { useEmsStore } from '@/store/emsStore';
import {
  FileText,
  Lock,
  Upload,
  Download,
  CheckCircle2,
  AlertCircle,
  Eye,
  Edit3,
  Trash2,
  Search,
  Filter,
  RefreshCw,
  Loader2,
  ShieldCheck,
  FileImage,
  Calendar,
} from 'lucide-react';
import { EmployeeDocument, DocumentCategory, DocumentAccessRole } from '@/types/admin';
import { UploadDocumentModal } from '@/components/modals/UploadDocumentModal';
import { EditDocumentModal } from '@/components/modals/EditDocumentModal';
import { ViewDocumentModal } from '@/components/modals/ViewDocumentModal';
import { DeleteDocumentModal } from '@/components/modals/DeleteDocumentModal';

export default function DocumentsPage() {
  const { state, setDocuments, addDocument, updateDocument, deleteDocument } = useEmsStore();

  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [accessRoleFilter, setAccessRoleFilter] = useState<string>('All');
  const [dateSort, setDateSort] = useState<'newest' | 'oldest'>('newest');

  // Modal active targets
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [viewTarget, setViewTarget] = useState<EmployeeDocument | null>(null);
  const [editTarget, setEditTarget] = useState<EmployeeDocument | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<EmployeeDocument | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Fetch documents from MongoDB API on load
  const fetchDocumentsFromApi = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/v1/documents');
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.documents)) {
        setDocuments(data.documents);
      }
    } catch (err) {
      console.error('Failed to load documents from API:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocumentsFromApi();
  }, []);

  const documents = state.documents || [];

  // Filter & Search Logic
  const filteredDocuments = documents
    .filter((doc) => {
      // Search term
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = doc.title?.toLowerCase().includes(q);
        const matchesEmp = doc.employeeName?.toLowerCase().includes(q) || doc.employeeId?.toLowerCase().includes(q);
        const matchesFile = doc.fileName?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesEmp && !matchesFile) return false;
      }

      // Category filter
      if (categoryFilter !== 'All' && doc.category !== categoryFilter) {
        return false;
      }

      // Access Role filter
      if (accessRoleFilter !== 'All' && doc.accessRole !== accessRoleFilter) {
        return false;
      }

      return true;
    })
    .sort((a, b) => {
      const dateA = new Date(a.uploadDate || 0).getTime();
      const dateB = new Date(b.uploadDate || 0).getTime();
      return dateSort === 'newest' ? dateB - dateA : dateA - dateB;
    });

  return (
    <AdminLayout
      pageTitle="Document Vault"
      breadcrumbs={[{ label: 'Documents', href: '/admin/documents' }]}
    >
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed right-6 top-20 z-50 flex items-center gap-2.5 rounded-xl px-4 py-3 text-xs text-white shadow-2xl border transition-all ${
            toast.type === 'success'
              ? 'bg-slate-900 border-emerald-500/50'
              : 'bg-rose-950 border-rose-500/50'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
          )}
          <span className="font-medium">{toast.message}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Enterprise Document Vault</h2>
          <p className="text-xs text-slate-500">
            Encrypted MongoDB GridFS binary storage for employee contracts, offer letters, identity proofs, & HR files
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchDocumentsFromApi}
            disabled={isLoading}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 active:scale-95 shadow-xs disabled:opacity-50 transition"
            title="Refresh Vault Data"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-slate-500 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-md hover:bg-blue-700 active:scale-95 transition-all"
          >
            <Upload className="h-4 w-4" />
            <span>Upload Document</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Controls Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-xs">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, employee name, or file name..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-xs font-medium text-slate-800 placeholder-slate-400 transition-colors focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        {/* Category & Access Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-slate-600 font-semibold">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <span>Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-transparent font-bold text-slate-900 focus:outline-none cursor-pointer"
            >
              <option value="All">All Categories</option>
              <option value="Offer Letter">Offer Letter</option>
              <option value="Appointment Letter">Appointment Letter</option>
              <option value="Identity Proof">Identity Proof</option>
              <option value="Payslip">Payslip</option>
              <option value="Resume">Resume</option>
              <option value="Experience Letter">Experience Letter</option>
              <option value="Contract">Contract</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-slate-600 font-semibold">
            <Lock className="h-3.5 w-3.5 text-slate-400" />
            <span>Access Role:</span>
            <select
              value={accessRoleFilter}
              onChange={(e) => setAccessRoleFilter(e.target.value)}
              className="bg-transparent font-bold text-slate-900 focus:outline-none cursor-pointer"
            >
              <option value="All">All Roles</option>
              <option value="HR Only">HR Only</option>
              <option value="Admin Only">Admin Only</option>
              <option value="HR & Admin">HR & Admin</option>
              <option value="Employee">Employee</option>
              <option value="Public">Public</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-slate-600 font-semibold">
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
            <span>Sort:</span>
            <select
              value={dateSort}
              onChange={(e) => setDateSort(e.target.value as 'newest' | 'oldest')}
              className="bg-transparent font-bold text-slate-900 focus:outline-none cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        </div>
      </div>

      {/* Documents Data Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-2" />
            <p className="text-xs font-semibold text-slate-500">Loading documents from MongoDB GridFS...</p>
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <FileText className="h-7 w-7" />
            </div>
            <h4 className="mt-3 text-sm font-bold text-slate-800">
              {searchQuery || categoryFilter !== 'All' || accessRoleFilter !== 'All'
                ? 'No matching documents found'
                : 'No documents uploaded yet'}
            </h4>
            <p className="mt-1 max-w-sm text-xs text-slate-500 leading-relaxed">
              {searchQuery || categoryFilter !== 'All' || accessRoleFilter !== 'All'
                ? 'Try adjusting your search query or filter settings.'
                : 'Click "Upload Document" to select a file from your computer and store it securely in MongoDB GridFS.'}
            </p>
            {!searchQuery && categoryFilter === 'All' && accessRoleFilter === 'All' && (
              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="mt-4 flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-blue-700 active:scale-95 transition-all"
              >
                <Upload className="h-4 w-4" /> Upload First Document
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80 text-slate-500 font-semibold">
                  <th className="px-4 py-3.5">Document Title</th>
                  <th className="px-4 py-3.5">Employee</th>
                  <th className="px-4 py-3.5">Category</th>
                  <th className="px-4 py-3.5">File Name</th>
                  <th className="px-4 py-3.5">File Size</th>
                  <th className="px-4 py-3.5">Upload Date</th>
                  <th className="px-4 py-3.5">Access Role</th>
                  <th className="px-4 py-3.5 text-right font-bold text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDocuments.map((doc) => {
                  const isImage = /\.(png|jpe?g|webp|gif)$/i.test(doc.fileName);
                  const isPdf = doc.fileName.toLowerCase().endsWith('.pdf');

                  return (
                    <tr key={doc.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3.5 font-bold text-slate-900">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl font-bold ${
                              isPdf
                                ? 'bg-rose-50 text-rose-600 border border-rose-200'
                                : isImage
                                ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                                : 'bg-blue-50 text-blue-600 border border-blue-200'
                            }`}
                          >
                            {isImage ? <FileImage className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                          </div>
                          <span className="truncate max-w-[200px]" title={doc.title}>
                            {doc.title}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 font-medium text-slate-700">
                        <div>
                          <p className="font-bold text-slate-900 truncate max-w-[150px]">{doc.employeeName}</p>
                          <span className="text-[10px] text-slate-400 font-mono">{doc.employeeId}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700 border border-slate-200">
                          {doc.category}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-600 font-mono text-[11px]">
                        <span className="truncate max-w-[140px] block" title={doc.fileName}>
                          {doc.fileName}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-500 font-medium">{doc.fileSize}</td>
                      <td className="px-4 py-3.5 text-slate-500 font-medium">{doc.uploadDate}</td>
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800 border border-amber-200">
                          <Lock className="h-2.5 w-2.5 text-amber-600" /> {doc.accessRole}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* View Button */}
                          <button
                            onClick={() => setViewTarget(doc)}
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-blue-50 hover:text-blue-600 transition"
                            title="View / Preview Document"
                          >
                            <Eye className="h-4 w-4" />
                          </button>

                          {/* Download Button */}
                          <a
                            href={`/api/v1/documents/${doc.id}/file?download=true`}
                            download={doc.fileName}
                            onClick={() => showToast(`Downloading "${doc.fileName}"...`)}
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-emerald-50 hover:text-emerald-600 transition"
                            title="Download File"
                          >
                            <Download className="h-4 w-4" />
                          </a>

                          {/* Edit Button */}
                          <button
                            onClick={() => setEditTarget(doc)}
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 transition"
                            title="Edit Document Details"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>

                          {/* Delete Button */}
                          <button
                            onClick={() => setDeleteTarget(doc)}
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition"
                            title="Delete Document"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Upload Document Modal */}
      <UploadDocumentModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        employees={state.employees}
        onSuccess={(newDoc) => {
          addDocument(newDoc);
          showToast(`Document "${newDoc.title}" uploaded to MongoDB GridFS successfully!`, 'success');
        }}
      />

      {/* View Document Modal */}
      <ViewDocumentModal
        isOpen={!!viewTarget}
        onClose={() => setViewTarget(null)}
        document={viewTarget}
      />

      {/* Edit Document Modal */}
      <EditDocumentModal
        isOpen={!!editTarget}
        onClose={() => setEditTarget(null)}
        document={editTarget}
        employees={state.employees}
        onSuccess={(updatedDoc) => {
          updateDocument(updatedDoc.id, updatedDoc);
          showToast(`Document "${updatedDoc.title}" updated successfully!`, 'success');
        }}
      />

      {/* Delete Confirmation Modal */}
      <DeleteDocumentModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        document={deleteTarget}
        onSuccess={(deletedId) => {
          deleteDocument(deletedId);
          showToast('Document deleted from database and storage clean!', 'success');
        }}
      />
    </AdminLayout>
  );
}
