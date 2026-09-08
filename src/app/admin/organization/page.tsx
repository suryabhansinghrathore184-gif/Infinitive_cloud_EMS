'use client';

import React, { useState } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { mockDepartments, mockDesignations, mockLocations } from '@/data/employees';
import { Building2, Layers, MapPin, Network, Plus, Edit, CheckCircle2 } from 'lucide-react';

export default function OrganizationPage() {
  const [activeTab, setActiveTab] = useState<'departments' | 'designations' | 'locations' | 'hierarchy'>('departments');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <AdminLayout
      pageTitle="Organization Management"
      breadcrumbs={[{ label: 'Organization', href: '/admin/organization' }]}
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed right-6 top-20 z-50 flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs text-white shadow-xl">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Organization Structure</h2>
          <p className="text-xs text-slate-500">
            Configure departments, designations, locations, and organizational reporting hierarchy
          </p>
        </div>

        <button
          onClick={() => showToast('Opening creation modal...')}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-blue-600/20 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          <span>Add New Unit</span>
        </button>
      </div>

      {/* Tabs Bar */}
      <div className="flex border-b border-slate-200 bg-white rounded-xl p-1 shadow-sm text-xs font-semibold text-slate-600">
        {[
          { key: 'departments', label: 'Departments', icon: Building2 },
          { key: 'designations', label: 'Designations', icon: Layers },
          { key: 'locations', label: 'Locations', icon: MapPin },
          { key: 'hierarchy', label: 'Organization Hierarchy', icon: Network },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2.5 transition-all ${
                activeTab === tab.key
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: DEPARTMENTS */}
      {activeTab === 'departments' && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {mockDepartments.map((dept) => (
            <div key={dept.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-slate-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 font-bold text-xs">
                    {dept.code}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{dept.name}</h3>
                    <p className="text-[10px] text-slate-400">Head: {dept.head}</p>
                  </div>
                </div>
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200">
                  {dept.status}
                </span>
              </div>
              <p className="mt-3 text-xs text-slate-600">{dept.description}</p>
              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
                <span className="font-bold text-slate-900">{dept.employeeCount} Employees</span>
                <button
                  onClick={() => showToast(`Editing ${dept.name}`)}
                  className="flex items-center gap-1 font-semibold text-blue-600 hover:text-blue-700"
                >
                  <Edit className="h-3.5 w-3.5" /> Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 2: DESIGNATIONS */}
      {activeTab === 'designations' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-slate-500">
                <th className="px-4 py-3 font-semibold">Designation Title</th>
                <th className="px-4 py-3 font-semibold">Code</th>
                <th className="px-4 py-3 font-semibold">Department</th>
                <th className="px-4 py-3 font-semibold">Grade Level</th>
                <th className="px-4 py-3 font-semibold">Employees</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {mockDesignations.map((des) => (
                <tr key={des.id} className="hover:bg-slate-50/60">
                  <td className="px-4 py-3 font-bold text-slate-900">{des.title}</td>
                  <td className="px-4 py-3 font-mono text-slate-500">{des.code}</td>
                  <td className="px-4 py-3 text-slate-700">{des.department}</td>
                  <td className="px-4 py-3 font-semibold text-blue-600">{des.level}</td>
                  <td className="px-4 py-3 font-semibold text-slate-900">{des.employeeCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 3: LOCATIONS */}
      {activeTab === 'locations' && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {mockLocations.map((loc) => (
            <div key={loc.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{loc.name}</h3>
                  <p className="text-xs text-slate-500">{loc.city}, {loc.country}</p>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
                <span className="font-semibold text-slate-600">Code: {loc.code}</span>
                <span className="font-bold text-blue-600">{loc.employeeCount} Staff</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 4: HIERARCHY DIAGRAM */}
      {activeTab === 'hierarchy' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-4">Enterprise Reporting Tree</h3>
          <div className="rounded-xl bg-slate-900 p-6 font-mono text-xs text-slate-200 leading-relaxed overflow-x-auto">
            <p className="text-blue-400 font-bold">Company (Enterprise Global)</p>
            <p className="text-slate-400"> │</p>
            <p> ├── <span className="text-emerald-400 font-bold">HR Department</span> (Head: Sneha Roy)</p>
            <p> │   ├── HR Manager (L5)</p>
            <p> │   └── HR Executive (L3)</p>
            <p className="text-slate-400"> │</p>
            <p> ├── <span className="text-purple-400 font-bold">Engineering & IT</span> (Head: Rajesh K.)</p>
            <p> │   ├── IT Manager (L5)</p>
            <p> │   ├── Team Lead (L5)</p>
            <p> │   └── Senior Software Developers (L4)</p>
            <p className="text-slate-400"> │</p>
            <p> └── <span className="text-amber-400 font-bold">Finance & Accounts</span> (Head: Vikram Mehta)</p>
            <p>     ├── Finance Manager (L5)</p>
            <p>     └── Senior Accountant (L3)</p>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
