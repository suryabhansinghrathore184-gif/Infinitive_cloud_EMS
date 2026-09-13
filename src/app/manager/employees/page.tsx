'use client';

import React, { useState, useEffect } from 'react';
import { Users, Search, RefreshCw, Mail, Building2, Eye, ShieldCheck } from 'lucide-react';

export default function ManagerEmployeesPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedEmp, setSelectedEmp] = useState<any | null>(null);

  const fetchEmployees = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/v1/employees?search=${encodeURIComponent(search)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setEmployees(data.data || []);
        }
      }
    } catch (err) {
      console.error('Failed to fetch team employees:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Team Employees</h1>
          <p className="text-sm text-slate-500 mt-1">View and manage direct reports under your management scope.</p>
        </div>
        <button
          onClick={fetchEmployees}
          className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 transition-all cursor-pointer"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="relative">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search employee by name, email, or designation..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-10 pr-4 text-xs font-medium text-slate-800 focus:border-indigo-500 focus:outline-hidden"
          />
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center p-12 text-xs text-slate-500">
            <RefreshCw className="h-5 w-5 animate-spin text-indigo-600 mr-2" />
            <span>Loading team employee data...</span>
          </div>
        ) : employees.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            No team employees found matching your filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Employee</th>
                  <th className="py-3.5 px-4">Department</th>
                  <th className="py-3.5 px-4">Designation</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {employees.map((emp) => (
                  <tr key={emp.id || emp.employeeId} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      <div>
                        {emp.name || `${emp.firstName || ''} ${emp.lastName || ''}`}
                        <span className="block font-mono text-[10px] text-slate-400 font-normal">{emp.employeeId}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">{emp.department}</td>
                    <td className="py-3.5 px-4">{emp.designation}</td>
                    <td className="py-3.5 px-4">
                      <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
                        {emp.status || 'Active'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedEmp(emp)}
                        className="inline-flex items-center gap-1 text-indigo-600 font-semibold hover:text-indigo-800 cursor-pointer"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedEmp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900">Employee Information</h3>
            <p className="text-xs text-slate-500 mt-1">{selectedEmp.name} ({selectedEmp.employeeId})</p>
            <div className="mt-4 space-y-2 text-xs">
              <p><strong>Email:</strong> {selectedEmp.email}</p>
              <p><strong>Department:</strong> {selectedEmp.department}</p>
              <p><strong>Designation:</strong> {selectedEmp.designation}</p>
              <p><strong>Status:</strong> {selectedEmp.status || 'Active'}</p>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedEmp(null)}
                className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
