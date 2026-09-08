'use client';

import React from 'react';
import { useEmsStore } from '@/store/emsStore';
import { Activity, Clock, Inbox } from 'lucide-react';

export const RecentActivity: React.FC = () => {
  const { state } = useEmsStore();
  const activities = state.activities;

  return (
    <div className="flex h-full w-full flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900">Recent Activity</h3>
          <p className="text-xs text-slate-500">Real-time system audit & update stream</p>
        </div>
        <Activity className="h-5 w-5 text-blue-600" />
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
        <div className="relative mt-4 flex-1 space-y-4 before:absolute before:left-4 before:top-3 before:h-[80%] before:w-[2px] before:bg-slate-100">
          {activities.map((act) => (
            <div key={act.id} className="relative flex items-start gap-3 pl-1">
              {/* Avatar or User Indicator */}
              <div className="relative z-10 h-8 w-8 flex-shrink-0 overflow-hidden rounded-full ring-2 ring-white">
                <img
                  src={act.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80'}
                  alt={act.user}
                  className="h-full w-full object-cover"
                />
              </div>

              {/* Activity Details */}
              <div className="flex-1 rounded-xl bg-slate-50/60 p-2.5 text-xs text-slate-700 transition-colors hover:bg-slate-100/70">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{act.user}</span>
                  <span className="flex items-center text-[10px] text-slate-400">
                    <Clock className="mr-1 h-3 w-3" /> {act.timestamp}
                  </span>
                </div>
                <p className="mt-1 text-slate-600 font-normal">{act.action}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
