'use client';

import React from 'react';
import { useEmsStore } from '@/store/emsStore';
import { Activity, Clock, Inbox } from 'lucide-react';

export const RecentActivity: React.FC = () => {
  const { state } = useEmsStore();
  const activities = state.activities;

  return (
    <div className="flex h-full w-full flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900">Recent Activity Stream</h3>
          <p className="text-xs text-slate-500 font-medium">Real-time system audit & update timeline</p>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200">
          <Activity className="h-4.5 w-4.5" />
        </div>
      </div>

      {/* Activity Stream vs Empty State */}
      {activities.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center py-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
            <Inbox className="h-6 w-6" />
          </div>
          <h4 className="mt-3 text-sm font-bold text-slate-800">No recent activity</h4>
          <p className="mt-1 max-w-xs text-xs text-slate-500">
            Admin data entries, employee updates, and system events will stream live here.
          </p>
        </div>
      ) : (
        <div className="relative mt-4 flex-1 space-y-3.5 before:absolute before:left-4 before:top-3 before:h-[85%] before:w-[2px] before:bg-slate-200">
          {activities.map((act) => (
            <div key={act.id} className="relative flex items-start gap-3 pl-1">
              {/* Avatar or User Indicator */}
              <div className="relative z-10 h-8 w-8 shrink-0 overflow-hidden rounded-full ring-2 ring-white shadow-xs">
                <img
                  src={act.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80'}
                  alt={act.user}
                  className="h-full w-full object-cover"
                />
              </div>

              {/* Activity Details */}
              <div className="flex-1 rounded-xl bg-slate-50 p-3 text-xs text-slate-700 transition-all hover:bg-indigo-50/40 border border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{act.user}</span>
                  <span className="flex items-center text-[10px] text-slate-400 font-mono">
                    <Clock className="mr-1 h-3 w-3 text-slate-400" /> {act.timestamp}
                  </span>
                </div>
                <p className="mt-1 text-slate-600 font-medium leading-relaxed">{act.action}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
