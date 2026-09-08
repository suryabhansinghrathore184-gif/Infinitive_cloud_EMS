'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, UserPlus, Download, Sparkles } from 'lucide-react';
import { mockUserData } from '@/data/dashboard';
import { format } from 'date-fns';

export const WelcomeSection: React.FC = () => {
  const [currentDateFormatted, setCurrentDateFormatted] = useState<string>('');

  useEffect(() => {
    // Dynamically calculate current date from system/browser local time
    setCurrentDateFormatted(format(new Date(), 'EEEE, MMMM d, yyyy'));
  }, []);

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            Good Morning, {mockUserData.name}
          </h2>
          <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
            <Sparkles className="mr-1 h-3 w-3 text-blue-500" /> HR Overview
          </span>
        </div>
        <p className="mt-1 text-sm text-slate-500">
          Here&apos;s what&apos;s happening with your organization today.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {/* Real Dynamic Date Display */}
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 shadow-sm">
          <Calendar className="h-4 w-4 text-blue-600" />
          <span>{currentDateFormatted || 'Loading current date...'}</span>
        </div>

        {/* Quick Action Buttons */}
        <button className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-blue-600/20 transition-all hover:bg-blue-700 active:scale-95">
          <UserPlus className="h-4 w-4" />
          <span>Add Employee</span>
        </button>

        <button className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-sm transition-all hover:bg-slate-50 active:scale-95">
          <Download className="h-4 w-4 text-slate-500" />
          <span className="hidden sm:inline">Export</span>
        </button>
      </div>
    </div>
  );
};
