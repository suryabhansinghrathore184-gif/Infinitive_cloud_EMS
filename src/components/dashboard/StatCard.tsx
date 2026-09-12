'use client';

import React from 'react';
import { Users, UserCheck, UserMinus, UserPlus, TrendingUp, TrendingDown } from 'lucide-react';
import { KpiMetric } from '@/types/dashboard';

const iconMap = {
  'users': Users,
  'user-check': UserCheck,
  'user-minus': UserMinus,
  'user-plus': UserPlus,
};

const bgColors = {
  'users': 'bg-indigo-50 text-indigo-600 border-indigo-100',
  'user-check': 'bg-emerald-50 text-emerald-600 border-emerald-100',
  'user-minus': 'bg-amber-50 text-amber-600 border-amber-100',
  'user-plus': 'bg-purple-50 text-purple-600 border-purple-100',
};

interface StatCardProps {
  metric: KpiMetric;
}

export const StatCard: React.FC<StatCardProps> = ({ metric }) => {
  const IconComponent = iconMap[metric.iconName] || Users;
  const colorClass = bgColors[metric.iconName] || bgColors['users'];

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all hover:border-indigo-200 hover:shadow-md">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
          {metric.title}
        </span>
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${colorClass} shadow-2xs`}>
          <IconComponent className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-3 flex items-baseline justify-between">
        <div className="text-3xl font-extrabold tracking-tight text-slate-900">
          {metric.value}
        </div>
      </div>

      <div className="mt-3 flex items-center gap-1.5 text-xs">
        <span
          className={`inline-flex items-center font-bold rounded-md px-1.5 py-0.5 text-[11px] ${
            metric.isPositive
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-rose-50 text-rose-700 border border-rose-200'
          }`}
        >
          {metric.isPositive ? (
            <TrendingUp className="mr-1 h-3 w-3 text-emerald-600" />
          ) : (
            <TrendingDown className="mr-1 h-3 w-3 text-rose-600" />
          )}
          {metric.change}
        </span>
        <span className="text-slate-500 font-medium text-[11px]">vs last month</span>
      </div>
    </div>
  );
};
