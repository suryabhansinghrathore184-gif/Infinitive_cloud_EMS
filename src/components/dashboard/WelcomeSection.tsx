'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, UserPlus, Building2, Briefcase, Megaphone, CalendarOff, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { useEmsStore } from '@/store/emsStore';

interface WelcomeSectionProps {
  onAddEmployee?: () => void;
  onAddDepartment?: () => void;
  onAddDesignation?: () => void;
  onAddHoliday?: () => void;
  onCreateAnnouncement?: () => void;
  onAddLeaveType?: () => void;
}

export const WelcomeSection: React.FC<WelcomeSectionProps> = ({
  onAddEmployee,
  onAddDepartment,
  onAddDesignation,
  onCreateAnnouncement,
  onAddLeaveType,
}) => {
  const { state } = useEmsStore();
  const [currentDateFormatted, setCurrentDateFormatted] = useState<string>('');

  useEffect(() => {
    setCurrentDateFormatted(format(new Date(), 'EEEE, MMMM d, yyyy'));
  }, []);

  const adminName = state.adminUser?.name || 'Administrator';

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">
            Welcome back, {adminName}
          </h2>
          <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-bold text-indigo-700 border border-indigo-200">
            <Sparkles className="mr-1 h-3 w-3 text-indigo-600" /> HR Administrator
          </span>
        </div>
        <p className="mt-1 text-xs text-slate-500 font-medium">
          Manage workforce operations, organization structure, attendance records, and system analytics.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {/* Dynamic Date Display */}
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs">
          <Calendar className="h-4 w-4 text-indigo-600" />
          <span>{currentDateFormatted || 'Loading date...'}</span>
        </div>

        {/* Quick Action Entry Buttons */}
        {onAddEmployee && (
          <button
            onClick={onAddEmployee}
            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white shadow-md shadow-indigo-600/20 transition-all hover:bg-indigo-700 active:scale-95 cursor-pointer"
          >
            <UserPlus className="h-4 w-4" />
            <span>+ Add Employee</span>
          </button>
        )}

        {onAddDepartment && (
          <button
            onClick={onAddDepartment}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs transition-all hover:bg-slate-50 hover:text-indigo-600 active:scale-95 cursor-pointer"
            title="Create Department"
          >
            <Building2 className="h-4 w-4 text-slate-500" />
            <span>+ Dept</span>
          </button>
        )}

        {onAddDesignation && (
          <button
            onClick={onAddDesignation}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs transition-all hover:bg-slate-50 hover:text-purple-600 active:scale-95 cursor-pointer"
            title="Add Designation"
          >
            <Briefcase className="h-4 w-4 text-slate-500" />
            <span>+ Designation</span>
          </button>
        )}

        {onCreateAnnouncement && (
          <button
            onClick={onCreateAnnouncement}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs transition-all hover:bg-slate-50 hover:text-emerald-600 active:scale-95 cursor-pointer"
            title="Publish Announcement"
          >
            <Megaphone className="h-4 w-4 text-slate-500" />
            <span>+ Announcement</span>
          </button>
        )}

        {onAddLeaveType && (
          <button
            onClick={onAddLeaveType}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs transition-all hover:bg-slate-50 hover:text-amber-600 active:scale-95 cursor-pointer"
            title="Add Leave Type"
          >
            <CalendarOff className="h-4 w-4 text-slate-500" />
            <span>+ Leave Type</span>
          </button>
        )}
      </div>
    </div>
  );
};
