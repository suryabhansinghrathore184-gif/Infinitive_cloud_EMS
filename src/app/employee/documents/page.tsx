'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { useAuthStore } from '@/store/authStore';
import {
  FileText,
  RefreshCw,
  Download,
  Eye,
  CheckCircle2,
  AlertCircle,
  Folder,
  ShieldCheck,
  Search,
  RotateCcw,
  Calendar,
  X,
  FileCode,
  FileImage,
  FileCheck,
  FileSpreadsheet,
  File,
  Lock,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Inbox,
  FolderCheck,
  UserCheck,
} from 'lucide-react';

interface DocumentRecord {
  id: string;
  _id?: string;
  title: string;
  category?: string;
  fileName?: string;
  originalFileName?: string;
  fileSize?: string | number;
  fileSizeBytes?: number;
  mimeType?: string;
  fileUrl?: string;
  uploadedBy?: string;
  uploadDate?: string;
  createdAt?: string;
  accessRole?: string;
  employeeId?: string;
  employeeName?: string;
}

export default function EmployeeDocumentsPage() {
  const { user } = useAuthStore();

  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [profileData, setProfileData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);

  // Document Preview / Details Modal
  const [selectedDoc, setSelectedDoc] = useState<DocumentRecord | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchDocuments = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setIsError(false);
    setErrorMessage(null);

    try {
      const [docRes, meRes] = await Promise.all([
        fetch('/api/v1/documents').catch(() => null),
        fetch('/api/v1/auth/me').catch(() => null),
      ]);

      if (meRes && meRes.ok) {
        const meData = await meRes.json();
        if (meData.success) setProfileData(meData.data);
      }

      if (docRes && docRes.ok) {
        const data = await docRes.json();
        if (data.success && Array.isArray(data.documents)) {
          setDocuments(data.documents);
        } else if (data.success && Array.isArray(data.data)) {
          setDocuments(data.data);
        } else {
          setDocuments([]);
        }
      } else {
        setIsError(true);
        setErrorMessage('Failed to load document vault records from server.');
      }

      if (isManualRefresh) {
        showToast('Document vault updated successfully.');
      }
    } catch (err: any) {
      console.error('Error fetching documents from vault:', err);
      setIsError(true);
      setErrorMessage(err?.message || 'Unable to load document vault. Please check your connection.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Derived User Information
  const activeUser = profileData || user;
  const fullName = activeUser?.name || 'Employee';
  const todayFormattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Calculate real category summary counts
  const totalCount = documents.length;
  const employmentCount = documents.filter((d) => {
    const cat = (d.category || '').toLowerCase();
    return cat.includes('employment') || cat.includes('contract') || cat.includes('offer') || cat.includes('letter');
  }).length;

  const identityCount = documents.filter((d) => {
    const cat = (d.category || '').toLowerCase();
    return cat.includes('identity') || cat.includes('kyc') || cat.includes('id') || cat.includes('passport') || cat.includes('aadhaar');
  }).length;

  const certificateCount = documents.filter((d) => {
    const cat = (d.category || '').toLowerCase();
    return cat.includes('certificate') || cat.includes('training') || cat.includes('degree') || cat.includes('education');
  }).length;

  const otherCount = totalCount - (employmentCount + identityCount + certificateCount);

  // Available Category Options derived from data + defaults
  const categoryOptions = useMemo(() => {
    const set = new Set<string>(['Employment', 'Identity', 'Certificate', 'Policy', 'General', 'Other']);
    documents.forEach((d) => {
      if (d.category) set.add(d.category);
    });
    return Array.from(set);
  }, [documents]);

  // Filtered documents
  const filteredDocuments = useMemo(() => {
    return documents.filter((d) => {
      const titleStr = (d.title || d.fileName || d.originalFileName || '').toLowerCase();
      const catStr = (d.category || '').toLowerCase();

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        if (!titleStr.includes(query) && !catStr.includes(query)) return false;
      }

      if (filterCategory !== 'All') {
        if ((d.category || 'Other').toLowerCase() !== filterCategory.toLowerCase()) {
          return false;
        }
      }

      return true;
    });
  }, [documents, searchQuery, filterCategory]);

  // Paginated documents
  const totalPages = Math.ceil(filteredDocuments.length / pageSize) || 1;
  const paginatedDocuments = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredDocuments.slice(start, start + pageSize);
  }, [filteredDocuments, currentPage, pageSize]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setFilterCategory('All');
    setCurrentPage(1);
  };

  // Icon Helper by MIME / Category
  const getDocumentIcon = (mimeType?: string, category?: string) => {
    const mime = (mimeType || '').toLowerCase();
    const cat = (category || '').toLowerCase();

    if (mime.includes('pdf')) {
      return <FileText className="h-4 w-4 text-rose-600 shrink-0" />;
    }
    if (mime.includes('image')) {
      return <FileImage className="h-4 w-4 text-indigo-600 shrink-0" />;
    }
    if (mime.includes('word') || mime.includes('document')) {
      return <FileCode className="h-4 w-4 text-indigo-600 shrink-0" />;
    }
    if (cat.includes('employment') || cat.includes('contract')) {
      return <FileCheck className="h-4 w-4 text-emerald-600 shrink-0" />;
    }
    return <File className="h-4 w-4 text-slate-500 shrink-0" />;
  };

  return (
    <AuthGuard allowedRoles={['EMPLOYEE', 'SUPER_ADMIN', 'ADMIN', 'HR', 'MANAGER']}>
      <AdminLayout
        allowedRoles={['EMPLOYEE', 'SUPER_ADMIN', 'ADMIN', 'HR', 'MANAGER']}
        pageTitle="My Documents"
        breadcrumbs={[
          { label: 'My Workspace', href: '/employee/dashboard' },
          { label: 'Document Vault', href: '/employee/documents' },
        ]}
      >
        {/* Toast Alert */}
        {toastMessage && (
          <div className="fixed right-6 top-20 z-50 flex items-center gap-2 rounded-xl bg-slate-900 border border-emerald-500/40 px-4 py-3 text-xs text-white shadow-2xl animate-fade-in">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span className="font-medium">{toastMessage}</span>
          </div>
        )}

        {/* Top Header & Workspace Bar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6 pb-2 border-b border-slate-200/80">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-black tracking-tight text-slate-900">My Secure HR Documents & Vault</h1>
              <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-0.5 text-[11px] font-bold text-indigo-700 border border-indigo-200">
                <Lock className="h-3.5 w-3.5 text-indigo-600" />
                <span>{activeUser?.employeeId || 'VAULT'}</span>
              </span>
            </div>
            <p className="text-xs font-medium text-slate-500 mt-1 flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5 text-slate-400" />
              <span>{todayFormattedDate}</span>
              <span className="text-slate-300">•</span>
              <span>Access official employment contracts, ID identity verification files, certificates, and HR documents.</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchDocuments(true)}
              disabled={isLoading || isRefreshing}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50 transition-all cursor-pointer"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing || isLoading ? 'animate-spin text-indigo-600' : 'text-slate-500'}`} />
              <span>{isRefreshing ? 'Refreshing...' : 'Refresh Vault'}</span>
            </button>
          </div>
        </div>

        {/* Global Error Banner */}
        {isError && (
          <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50/80 p-4 text-xs text-rose-800 flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
              <div>
                <p className="font-bold text-rose-900">Unable to access document repository</p>
                <p className="text-rose-700 mt-0.5">{errorMessage || 'Please check your connection and retry.'}</p>
              </div>
            </div>
            <button
              onClick={() => fetchDocuments(true)}
              className="rounded-xl bg-rose-600 px-3.5 py-1.5 font-bold text-white shadow-xs hover:bg-rose-700 transition-all cursor-pointer shrink-0"
            >
              Retry
            </button>
          </div>
        )}

        {/* Pulse Skeleton Loading State */}
        {isLoading ? (
          <div className="space-y-6 animate-pulse">
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-24 rounded-2xl bg-slate-200/80"></div>
              ))}
            </div>
            <div className="h-64 rounded-2xl bg-slate-200/80"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* 5 Real Data Summary KPI Cards */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
              {/* 1. Total Documents */}
              <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs flex flex-col justify-between space-y-1.5">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Total Vault Files</span>
                  <FolderCheck className="h-4 w-4 text-indigo-600" />
                </div>
                <p className="text-2xl font-black text-slate-900 font-mono">{totalCount}</p>
                <p className="text-[11px] text-slate-400 font-medium">Authorized documents</p>
              </div>

              {/* 2. Employment Contracts */}
              <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs flex flex-col justify-between space-y-1.5">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Employment</span>
                  <FileCheck className="h-4 w-4 text-emerald-600" />
                </div>
                <p className="text-2xl font-black text-emerald-600 font-mono">{employmentCount}</p>
                <p className="text-[11px] text-slate-400 font-medium">Contracts & Letters</p>
              </div>

              {/* 3. Identity Documents */}
              <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs flex flex-col justify-between space-y-1.5">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Identity / KYC</span>
                  <UserCheck className="h-4 w-4 text-indigo-600" />
                </div>
                <p className="text-2xl font-black text-indigo-600 font-mono">{identityCount}</p>
                <p className="text-[11px] text-slate-400 font-medium">ID & Verification</p>
              </div>

              {/* 4. Certificates */}
              <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs flex flex-col justify-between space-y-1.5">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Certificates</span>
                  <ShieldCheck className="h-4 w-4 text-indigo-600" />
                </div>
                <p className="text-2xl font-black text-indigo-600 font-mono">{certificateCount}</p>
                <p className="text-[11px] text-slate-400 font-medium">Training & Education</p>
              </div>

              {/* 5. Other Documents */}
              <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs flex flex-col justify-between space-y-1.5">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Other / Policy</span>
                  <FileText className="h-4 w-4 text-amber-600" />
                </div>
                <p className="text-2xl font-black text-amber-600 font-mono">{otherCount > 0 ? otherCount : 0}</p>
                <p className="text-[11px] text-slate-400 font-medium">Policies & General</p>
              </div>
            </div>

            {/* Document Vault Container */}
            <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
              {/* Filter Controls Bar */}
              <div className="border-b border-slate-100 p-4 flex flex-col md:flex-row items-center justify-between gap-3 bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <Folder className="h-4 w-4 text-indigo-600" />
                  <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Document Vault Repository</h3>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
                  {/* Search Query Input */}
                  <div className="relative flex-1 md:w-56">
                    <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search documents..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full rounded-xl border border-slate-200 bg-white pl-8 pr-3 py-1.5 text-xs font-medium text-slate-800 placeholder-slate-400 outline-none focus:border-indigo-500"
                    />
                  </div>

                  {/* Category Filter */}
                  <select
                    value={filterCategory}
                    onChange={(e) => {
                      setFilterCategory(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 outline-none cursor-pointer"
                  >
                    <option value="All">All Categories</option>
                    {categoryOptions.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>

                  {/* Reset Button */}
                  {(filterCategory !== 'All' || searchQuery) && (
                    <button
                      onClick={handleResetFilters}
                      className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span>Reset</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Document List View / Empty State */}
              {filteredDocuments.length === 0 ? (
                <div className="p-12 text-center text-xs text-slate-400 space-y-3">
                  <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 mx-auto border border-indigo-100">
                    <Folder className="h-8 w-8 text-indigo-500" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-black text-slate-800 text-sm">No personal documents found</p>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      {documents.length === 0
                        ? 'Your employment documents will appear here when HR uploads or an authorized document is added.'
                        : 'No documents match your current search or category filter.'}
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Desktop / Tablet Data Table */}
                  <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-600">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-extrabold uppercase tracking-wider text-[10px]">
                        <tr>
                          <th className="py-3.5 px-4">Document Title & Filename</th>
                          <th className="py-3.5 px-4">Category</th>
                          <th className="py-3.5 px-4">Uploaded By</th>
                          <th className="py-3.5 px-4">Upload Date</th>
                          <th className="py-3.5 px-4">File Size</th>
                          <th className="py-3.5 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {paginatedDocuments.map((doc) => (
                          <tr key={doc.id || doc._id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3.5 px-4 font-bold text-slate-900">
                              <div className="flex items-center gap-2.5">
                                {getDocumentIcon(doc.mimeType, doc.category)}
                                <div>
                                  <span className="block font-bold text-slate-900">{doc.title || doc.fileName || 'HR Document'}</span>
                                  <span className="text-[10px] text-slate-400 font-mono font-normal">
                                    {doc.originalFileName || doc.fileName || 'file.pdf'}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-700 border border-slate-200">
                                {doc.category || 'General'}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-slate-600">{doc.uploadedBy || 'HR Administration'}</td>
                            <td className="py-3.5 px-4 text-slate-600 font-mono">
                              {doc.uploadDate || (doc.createdAt ? new Date(doc.createdAt).toLocaleDateString() : 'N/A')}
                            </td>
                            <td className="py-3.5 px-4 font-mono text-slate-500">
                              {typeof doc.fileSize === 'string' ? doc.fileSize : doc.fileSize ? `${doc.fileSize} B` : 'Standard'}
                            </td>
                            <td className="py-3.5 px-4 text-right space-x-2">
                              <button
                                onClick={() => setSelectedDoc(doc)}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                              >
                                <Eye className="h-3.5 w-3.5 text-indigo-600" />
                                <span>Preview</span>
                              </button>
                              <a
                                href={doc.fileUrl || `/api/v1/documents/${doc.id || doc._id}/file?download=true`}
                                download
                                className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-50 border border-indigo-100 px-3 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition-colors cursor-pointer"
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

                  {/* Mobile Card View (< 640px) */}
                  <div className="block sm:hidden divide-y divide-slate-100 p-3 space-y-3">
                    {paginatedDocuments.map((doc) => (
                      <div key={doc.id || doc._id} className="rounded-xl border border-slate-200/80 bg-white p-4 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            {getDocumentIcon(doc.mimeType, doc.category)}
                            <div>
                              <h4 className="font-bold text-slate-900 text-sm">{doc.title || doc.fileName}</h4>
                              <span className="text-[10px] font-mono text-slate-400">{doc.originalFileName || doc.fileName}</span>
                            </div>
                          </div>
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-bold text-slate-700 border border-slate-200 shrink-0">
                            {doc.category || 'General'}
                          </span>
                        </div>

                        <div className="flex justify-between text-[11px] text-slate-500 font-mono bg-slate-50 p-2 rounded-lg">
                          <span>Date: {doc.uploadDate || 'N/A'}</span>
                          <span>Size: {doc.fileSize || 'Standard'}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <button
                            onClick={() => setSelectedDoc(doc)}
                            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100"
                          >
                            <Eye className="h-3.5 w-3.5 text-indigo-600" />
                            <span>Preview</span>
                          </button>
                          <a
                            href={doc.fileUrl || `/api/v1/documents/${doc.id || doc._id}/file?download=true`}
                            download
                            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 py-2 text-xs font-bold text-white shadow-xs"
                          >
                            <Download className="h-3.5 w-3.5" />
                            <span>Download</span>
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Pagination Footer */}
              {filteredDocuments.length > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200 bg-slate-50/50 px-4 py-3 text-xs text-slate-500">
                  <div>
                    Showing <span className="font-bold text-slate-800">{paginatedDocuments.length}</span> of{' '}
                    <span className="font-bold text-slate-800">{filteredDocuments.length}</span> vault records
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      disabled={currentPage <= 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 font-bold text-slate-700 disabled:opacity-40 transition-colors cursor-pointer"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      <span>Previous</span>
                    </button>
                    <span className="px-2 font-medium text-slate-700">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      disabled={currentPage >= totalPages}
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 font-bold text-slate-700 disabled:opacity-40 transition-colors cursor-pointer"
                    >
                      <span>Next</span>
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Secure Document Preview & Details Modal */}
        {selectedDoc && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
            <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl space-y-4 animate-fade-in text-xs max-h-[90vh] overflow-y-auto border border-slate-100">
              {/* Modal Top Bar */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  {getDocumentIcon(selectedDoc.mimeType, selectedDoc.category)}
                  <div>
                    <h3 className="text-base font-black text-slate-900">{selectedDoc.title || selectedDoc.fileName}</h3>
                    <p className="text-[11px] text-slate-500 font-medium">Official HR Vault Document Record</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedDoc(null)}
                  className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Metadata Details Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-xl bg-slate-50/80 p-4 border border-slate-100 font-medium">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Category</span>
                  <span className="font-bold text-slate-900 mt-0.5 block">{selectedDoc.category || 'General'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Uploaded By</span>
                  <span className="font-bold text-slate-900 mt-0.5 block">{selectedDoc.uploadedBy || 'HR Admin'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Upload Date</span>
                  <span className="font-bold text-slate-900 font-mono mt-0.5 block">{selectedDoc.uploadDate || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">File Size</span>
                  <span className="font-bold text-slate-900 font-mono mt-0.5 block">{selectedDoc.fileSize || 'Standard'}</span>
                </div>
              </div>

              {/* Document File Inline Preview Player */}
              <div className="rounded-xl border border-slate-200 bg-slate-900 overflow-hidden min-h-[250px] flex items-center justify-center relative">
                {selectedDoc.mimeType?.includes('pdf') || selectedDoc.fileName?.endsWith('.pdf') ? (
                  <iframe
                    src={selectedDoc.fileUrl || `/api/v1/documents/${selectedDoc.id || selectedDoc._id}/file`}
                    className="w-full h-[320px] border-0"
                    title={selectedDoc.title}
                  />
                ) : selectedDoc.mimeType?.includes('image') ||
                  selectedDoc.fileName?.match(/\.(jpg|jpeg|png|webp)$/i) ? (
                  <img
                    src={selectedDoc.fileUrl || `/api/v1/documents/${selectedDoc.id || selectedDoc._id}/file`}
                    alt={selectedDoc.title}
                    className="max-h-[320px] w-auto object-contain p-2"
                  />
                ) : (
                  <div className="p-8 text-center text-slate-300 space-y-2">
                    <FileText className="h-10 w-10 text-slate-400 mx-auto" />
                    <p className="font-bold text-sm text-slate-200">Inline Preview Not Available</p>
                    <p className="text-xs text-slate-400 max-w-xs mx-auto">
                      This file type ({selectedDoc.mimeType || 'Document'}) cannot be rendered inline in the browser. Please use the Download button below.
                    </p>
                  </div>
                )}
              </div>

              {/* Modal Actions Footer */}
              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <a
                  href={selectedDoc.fileUrl || `/api/v1/documents/${selectedDoc.id || selectedDoc._id}/file?download=true`}
                  download
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-500 transition-all cursor-pointer"
                >
                  <Download className="h-4 w-4" />
                  <span>Download File</span>
                </a>
                <button
                  onClick={() => setSelectedDoc(null)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </AdminLayout>
    </AuthGuard>
  );
}
