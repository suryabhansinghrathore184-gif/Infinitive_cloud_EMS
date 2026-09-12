'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Download,
  FileSpreadsheet,
  FileText,
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  BarChart3,
  Filter,
} from 'lucide-react';
import { generateCSV, generateExcelXML, downloadFile, printReport } from '@/lib/exportHelper';

interface ReportDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportEndpoint: string;
  reportTitle: string;
  reportDescription: string;
  currentFilters: {
    month?: string;
    department?: string;
    location?: string;
    status?: string;
  };
}

export const ReportDetailModal: React.FC<ReportDetailModalProps> = ({
  isOpen,
  onClose,
  reportEndpoint,
  reportTitle,
  reportDescription,
  currentFilters,
}) => {
  const [data, setData] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [summaryMetrics, setSummaryMetrics] = useState<{ label: string; value: string | number }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchReportData = async () => {
    if (!reportEndpoint) return;
    setIsLoading(true);
    setErrorMsg('');
    try {
      const params = new URLSearchParams();
      if (currentFilters.month) params.append('month', currentFilters.month);
      if (currentFilters.department && currentFilters.department !== 'All') params.append('department', currentFilters.department);
      if (currentFilters.location && currentFilters.location !== 'All') params.append('location', currentFilters.location);
      if (currentFilters.status && currentFilters.status !== 'All') params.append('status', currentFilters.status);
      if (searchQuery) params.append('search', searchQuery);

      const url = `${reportEndpoint}?${params.toString()}`;
      const res = await fetch(url);
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Failed to load report data');
      }

      setData(json.data || []);
      setHeaders(json.headers || []);
      setSummaryMetrics(json.summaryMetrics || []);
    } catch (err: any) {
      console.error('Error fetching report detail data:', err);
      setErrorMsg(err.message || 'Failed to load report details.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchReportData();
      setCurrentPage(1);
    }
  }, [isOpen, reportEndpoint, currentFilters.month, currentFilters.department, currentFilters.location, currentFilters.status]);

  if (!isOpen) return null;

  // Filtered rows
  const filteredData = data.filter((row) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return Object.values(row).some((val) => String(val).toLowerCase().includes(query));
  });

  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
  const paginatedData = filteredData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const getRowValues = (rowObj: any): any[] => {
    // Return row values in matching header order or object values
    return Object.values(rowObj).slice(1); // skip ID
  };

  const handleDownloadCSV = () => {
    const rawRows = filteredData.map((rowObj) => getRowValues(rowObj));
    const csvStr = generateCSV(headers, rawRows);
    const fileName = `${reportTitle.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`;
    downloadFile(csvStr, fileName, 'text/csv;charset=utf-8;');
  };

  const handleExportExcel = () => {
    const rawRows = filteredData.map((rowObj) => getRowValues(rowObj));
    const excelXml = generateExcelXML(reportTitle, currentFilters as any, headers, rawRows);
    const fileName = `${reportTitle.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.xls`;
    downloadFile(excelXml, fileName, 'application/vnd.ms-excel;charset=utf-8;');
  };

  const handlePrintPDF = () => {
    const rawRows = filteredData.map((rowObj) => getRowValues(rowObj));
    printReport(reportTitle, currentFilters as any, summaryMetrics, headers, rawRows);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-6xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600/30 rounded-xl border border-indigo-400/30">
              <BarChart3 className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h2 className="font-bold text-lg text-white">{reportTitle}</h2>
              <p className="text-xs text-slate-400">{reportDescription}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Toolbar & Summary */}
        <div className="p-6 space-y-4 border-b border-slate-100 bg-slate-50/50">
          {/* Summary Cards */}
          {summaryMetrics.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {summaryMetrics.map((sm, idx) => (
                <div key={idx} className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    {sm.label}
                  </span>
                  <span className="text-lg font-black text-slate-900 mt-1 block truncate">
                    {sm.value}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Search & Export Toolbar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search report records..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                onClick={handleDownloadCSV}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-100 transition-colors"
              >
                <Download className="w-4 h-4 text-indigo-600" />
                <span>CSV</span>
              </button>

              <button
                onClick={handleExportExcel}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold hover:bg-emerald-100 transition-colors"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>Excel</span>
              </button>

              <button
                onClick={handlePrintPDF}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all"
              >
                <FileText className="w-4 h-4" />
                <span>Print PDF</span>
              </button>
            </div>
          </div>
        </div>

        {/* Data Table Body */}
        <div className="flex-1 overflow-auto p-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-48 text-slate-400 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
              <span className="text-xs font-medium">Generating report dataset from database...</span>
            </div>
          ) : errorMsg ? (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
              <button
                onClick={fetchReportData}
                className="px-3 py-1 bg-red-600 text-white font-bold rounded-lg text-xs hover:bg-red-700"
              >
                Retry
              </button>
            </div>
          ) : filteredData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-slate-400 text-xs text-center">
              <BarChart3 className="w-10 h-10 mb-2 text-slate-300" />
              <p className="font-bold text-slate-700">No records found for current filters</p>
              <p className="text-[11px] text-slate-500 mt-1 max-w-xs">
                Try adjusting your search query or selecting a different department / month.
              </p>
            </div>
          ) : (
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-white font-semibold uppercase text-[10px] tracking-wider">
                  <tr>
                    {headers.map((h, i) => (
                      <th key={i} className="px-4 py-3 border-b border-slate-800">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {paginatedData.map((rowObj, idx) => {
                    const vals = getRowValues(rowObj);
                    return (
                      <tr key={idx} className="hover:bg-indigo-50/40 transition-colors">
                        {vals.map((v: any, cellIdx: number) => (
                          <td key={cellIdx} className="px-4 py-3 text-slate-800 font-medium whitespace-nowrap">
                            {v === null || v === undefined ? '-' : String(v)}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer Pagination */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span>Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2 py-1 bg-white border border-slate-200 rounded-lg font-medium text-slate-700"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <span className="ml-2 text-slate-400">
              Showing {filteredData.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} to{' '}
              {Math.min(currentPage * pageSize, filteredData.length)} of {filteredData.length} records
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-white disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-semibold text-slate-700">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-white disabled:opacity-40 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
