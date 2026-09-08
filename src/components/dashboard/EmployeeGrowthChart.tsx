'use client';

import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { mockGrowthData } from '@/data/dashboard';
import { TrendingUp } from 'lucide-react';

export const EmployeeGrowthChart: React.FC = () => {
  return (
    <div className="flex h-full w-full flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900">Employee Growth</h3>
            <span className="flex items-center text-xs font-semibold text-emerald-600">
              <TrendingUp className="mr-0.5 h-3.5 w-3.5" /> +11.4% Overall
            </span>
          </div>
          <p className="text-xs text-slate-500">Total headcount growth over the last 6 months</p>
        </div>
        <div className="flex items-center gap-2">
          <select className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 focus:border-blue-500 focus:outline-none">
            <option>Last 6 Months</option>
            <option>Last 12 Months</option>
            <option>Year 2026</option>
          </select>
        </div>
      </div>

      {/* Chart Container */}
      <div className="mt-4 flex-1 min-h-[220px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={mockGrowthData}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="growthGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#64748b', fontSize: 12 }}
            />
            <YAxis
              domain={['dataMin - 50', 'dataMax + 50']}
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#64748b', fontSize: 12 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                borderRadius: '12px',
                border: 'none',
                color: '#fff',
                fontSize: '12px',
                padding: '8px 12px',
              }}
              formatter={(value: number) => [`${value} Employees`, 'Headcount']}
            />
            <Area
              type="monotone"
              dataKey="count"
              stroke="#2563eb"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#growthGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
