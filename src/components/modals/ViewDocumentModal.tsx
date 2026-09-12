'use client';

import React, { useState } from 'react';
import { X, Eye, Download, FileText, Lock, Calendar, User, HardDrive, ExternalLink, ShieldCheck } from 'lucide-react';
import { EmployeeDocument } from '@/types/admin';

interface ViewDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: EmployeeDocument | null;
}

export const ViewDocumentModal: React.FC<ViewDocumentModalProps> = ({
  isOpen,
  onClose,
  document,
}) => {
  const [activeTab, setActiveTab] = useState<'preview' | 'details'>('preview');

  if (!isOpen || !document) return null;

  const fileUrl = `/api/v1/documents/${document.id}/file`;
  const downloadUrl = `${fileUrl}?download=true`;

  const isPdf =
    document.fileName.toLowerCase().endsWith('.pdf') ||
    document.mimeType === 'application/pdf';

  const isImage =
    /\.(png|jpe?g|webp|gif)$/i.test(document.fileName) ||
    document.mimeType?.startsWith('image/');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-xs">
      <div className="w-full max-w-4xl rounded-2xl bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-xs text-slate-800 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600 font-bold border border-blue-200">
              <FileText className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-sm text-slate-900 truncate">{document.title}</h3>
              <p className="text-[11px] text-slate-500 font-medium truncate">
                {document.employeeName} ({document.employeeId}) • {document.category}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={downloadUrl}
              download={document.fileName}
              className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 active:scale-95 transition"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download File</span>
            </a>
            <button
              onClick={onClose}
              className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-100 bg-white px-6 pt-2 gap-2 text-xs font-semibold text-slate-600">
          <button
            onClick={() => setActiveTab('preview')}
            className={`flex items-center gap-2 rounded-t-xl px-4 py-2 border-b-2 transition ${
              activeTab === 'preview'
                ? 'border-blue-600 text-blue-600 bg-blue-50/40 font-bold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <Eye className="h-4 w-4" />
            <span>Document Preview</span>
          </button>
          <button
            onClick={() => setActiveTab('details')}
            className={`flex items-center gap-2 rounded-t-xl px-4 py-2 border-b-2 transition ${
              activeTab === 'details'
                ? 'border-blue-600 text-blue-600 bg-blue-50/40 font-bold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <HardDrive className="h-4 w-4" />
            <span>Document Details & Metadata</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
          {activeTab === 'preview' ? (
            <div className="w-full h-[60vh] rounded-2xl border border-slate-200 bg-white overflow-hidden flex flex-col items-center justify-center shadow-inner">
              {isPdf ? (
                <iframe
                  src={`${fileUrl}#toolbar=0`}
                  className="w-full h-full border-none"
                  title={document.title}
                />
              ) : isImage ? (
                <div className="p-4 flex items-center justify-center w-full h-full bg-slate-900/5 overflow-auto">
                  <img
                    src={fileUrl}
                    alt={document.title}
                    className="max-h-full max-w-full object-contain rounded-lg shadow-md"
                  />
                </div>
              ) : (
                <div className="p-8 text-center space-y-3">
                  <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-200">
                    <FileText className="h-8 w-8" />
                  </div>
                  <h4 className="font-bold text-slate-800 text-sm">Preview Unavailable for this file format</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Direct browser preview is supported for PDF and image documents. Click below to download and view <strong>{document.fileName}</strong> locally.
                  </p>
                  <a
                    href={downloadUrl}
                    download={document.fileName}
                    className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-slate-800"
                  >
                    <Download className="h-4 w-4 text-blue-400" />
                    <span>Download {document.fileName} ({document.fileSize})</span>
                  </a>
                </div>
              )}
            </div>
          ) : (
            /* Document Details Tab */
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3 shadow-xs">
                  <h4 className="font-bold text-slate-900 text-xs flex items-center gap-2 border-b pb-2">
                    <FileText className="h-4 w-4 text-blue-600" /> File Information
                  </h4>
                  <div className="space-y-2">
                    <div>
                      <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Document Title</span>
                      <p className="font-bold text-slate-900">{document.title}</p>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">File Name</span>
                      <p className="font-mono text-slate-700">{document.fileName}</p>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">File Size</span>
                      <p className="font-semibold text-slate-800">{document.fileSize}</p>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">MIME Type</span>
                      <p className="font-mono text-slate-600">{document.mimeType || 'application/pdf'}</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3 shadow-xs">
                  <h4 className="font-bold text-slate-900 text-xs flex items-center gap-2 border-b pb-2">
                    <ShieldCheck className="h-4 w-4 text-emerald-600" /> Access & Audit Metadata
                  </h4>
                  <div className="space-y-2">
                    <div>
                      <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Target Employee</span>
                      <p className="font-bold text-slate-900">{document.employeeName} ({document.employeeId})</p>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Document Category</span>
                      <p className="font-semibold text-slate-800">{document.category}</p>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Access Role</span>
                      <p className="font-semibold text-amber-700">{document.accessRole}</p>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Upload Date & Author</span>
                      <p className="font-semibold text-slate-700">{document.uploadDate} by {document.uploadedBy || 'HR Administrator'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Bar */}
              <div className="flex items-center justify-between rounded-2xl border border-blue-200 bg-blue-50/60 p-4">
                <div>
                  <h5 className="font-bold text-blue-950">GridFS Encrypted Storage</h5>
                  <p className="text-blue-700 text-[11px]">Binary file stream endpoint: <code className="font-mono text-[10px] bg-white px-1 py-0.5 rounded">{fileUrl}</code></p>
                </div>
                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-xl border border-blue-300 bg-white px-3 py-1.5 font-bold text-blue-700 hover:bg-blue-100 transition shadow-xs"
                >
                  <span>Open Raw File</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
