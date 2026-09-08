'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, UserPlus, Building2, Briefcase, Megaphone, CalendarOff, Plus, Sparkles } from 'lucide-react';
import { mockUserData } from '@/data/dashboard';
import { format } from 'date-fns';

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
  onAddHoliday,
  onCreateAnnouncement,
  onAddLeaveType,
}) => {
  const [currentDateFormatted, setCurrentDateFormatted] = useState<string>('');

  useEffect(() => {
    setCurrentDateFormatted(format(new Date(), 'EEEE, MMMM d, yyyy'));
  }, []);

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            Good Morning, {mockUserData.name}
          </h2>
          <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
            <Sparkles className="mr-1 h-3 w-3 text-blue-500" /> HR Administrator
          </span>
        </div>
        <p className="mt-1 text-sm text-slate-500">
          Create company structures, manage workforce records, and track real-time analytics.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        {/* Real Dynamic Date Display */}
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-xs">
          <Calendar className="h-4 w-4 text-blue-600" />
          <span>{currentDateFormatted || 'Loading date...'}</span>
        </div>

        {/* Action Controls */}
        {onAddEmployee && (
          <button
            onClick={onAddEmployee}
            className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-bold text-white shadow-md shadow-blue-600/20 transition-all hover:bg-blue-700 active:scale-95"
          >
            <UserPlus className="h-4 w-4" />
            <span>+ Add Employee</span>
          </button>
        )}

        {onAddDepartment && (
          <button
            onClick={onAddDepartment}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs transition-all hover:bg-slate-50 hover:text-blue-600 active:scale-95"
            title="Create Department"
          >
            <Building2 className="h-4 w-4 text-slate-500" />
            <span>+ Dept</span>
          </button>
        )}

        {onAddDesignation && (
          <button
            onClick={onAddDesignation}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs transition-all hover:bg-slate-50 hover:text-purple-600 active:scale-95"
            title="Add Designation"
          >
            <Briefcase className="h-4 w-4 text-slate-500" />
            <span>+ Designation</span>
          </button>
        )}

        {onCreateAnnouncement && (
          <button
            onClick={onCreateAnnouncement}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs transition-all hover:bg-slate-50 hover:text-emerald-600 active:scale-95"
            title="Publish Announcement"
          >
            <Megaphone className="h-4 w-4 text-slate-500" />
            <span>+ Announcement</span>
          </button>
        )}

        {onAddLeaveType && (
          <button
            onClick={onAddLeaveType}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs transition-all hover:bg-slate-50 hover:text-amber-600 active:scale-95"
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
