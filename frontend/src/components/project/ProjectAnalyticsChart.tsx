'use client';

import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  CartesianGrid,
} from 'recharts';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface ProjectAnalyticsChartProps {
  data: any[];
}

const ProjectAnalyticsChart = ({ data }: ProjectAnalyticsChartProps) => {
  if (!data || data.length === 0) {
    return (
      <div className="w-full h-[300px] flex flex-col items-center justify-center bg-slate-50/50 dark:bg-slate-900/50 rounded-[32px] border-2 border-dashed border-slate-200 dark:border-white/10 p-10">
        <p className="text-sm text-slate-500 font-bold uppercase tracking-widest">Đang thu thập dữ liệu...</p>
      </div>
    );
  }

  const chartData = data.map((item) => ({
    date: format(new Date(item.date), 'dd/MM', { locale: vi }),
    'Hoàn thành': item.completedTasks,
    'Tất cả': item.totalTasks,
    'Xong trong ngày': item.dailyCompletedTasks || 0,
    'Hiệu suất (%)': Number(item.performanceIndex || 0),
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200 dark:border-white/10 p-4 rounded-2xl shadow-2xl min-w-[200px] ring-1 ring-black/5">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 pb-2 border-b border-slate-100 dark:border-white/5">{label}</p>
          {payload.map((entry: any, index: number) => {
            const isPerformance = entry.name.includes('%');
            const isDaily = entry.name === 'Xong trong ngày';
            const valueColor = isDaily ? '#f59e0b' : entry.color;
            
            return (
              <div key={index} className="flex items-center justify-between gap-4 py-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full shadow-sm" style={{ backgroundColor: valueColor }}></div>
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">{entry.name}</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[12px] font-black" style={{ color: valueColor }}>
                    {entry.value > 0 && isPerformance ? '+' : ''}{entry.value}{isPerformance ? '%' : ''}
                  </span>
                  {isDaily && (
                    <span className="text-[8px] font-bold text-slate-400 uppercase">nhiệm vụ</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
      {/* Chart 1: Progress Pulse */}
      <div className="relative group h-[450px]">
        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/10 to-emerald-500/10 rounded-[40px] blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
        <div className="relative h-full bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl rounded-[32px] border border-white dark:border-white/5 p-8 flex flex-col shadow-ambient">
          <div className="flex items-start justify-between mb-8">
            <div className="space-y-1">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Workload Progress</h3>
              <p className="text-sm font-black text-indigo-500 dark:text-indigo-400 tracking-tight">Tiến độ & Khối lượng công việc</p>
            </div>
            <div className="flex items-center gap-4 mt-1">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-[#10b981]"></div>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Hoàn thành</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-[#6366f1]"></div>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Tất cả</span>
              </div>
            </div>
          </div>
          <div className="flex-1 w-full -ml-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.3} />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: '800' }} 
                  dy={15} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: '800' }}
                  dx={-5}
                  domain={[0, 'auto']}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#94a3b8', strokeWidth: 1, strokeDasharray: '4 4' }} />
                <Area name="Tất cả" type="monotone" dataKey="Tất cả" stroke="#6366f1" fillOpacity={1} fill="url(#colorTotal)" strokeWidth={2.5} dot={{ r: 0 }} activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff' }} />
                <Area name="Hoàn thành" type="monotone" dataKey="Hoàn thành" stroke="#10b981" fillOpacity={1} fill="url(#colorCompleted)" strokeWidth={2.5} dot={{ r: 0 }} activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Chart 2: Velocity Momentum */}
      <div className="relative group h-[450px]">
        <div className="absolute -inset-1 bg-gradient-to-r from-[#C7F964]/10 to-indigo-500/10 rounded-[40px] blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
        <div className="relative h-full bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl rounded-[32px] border border-white dark:border-white/5 p-8 flex flex-col shadow-ambient">
          <div className="flex items-start justify-between mb-8">
            <div className="space-y-1">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Performance Velocity</h3>
              <p className="text-sm font-black text-[#035D5B] dark:text-[#C7F964] tracking-tight">Hiệu suất & Nhịp độ làm việc</p>
            </div>
             <div className="flex items-center gap-4 mt-1">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-[#C7F964]"></div>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Hiệu suất (%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-[#f59e0b]"></div>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Xong trong ngày</span>
              </div>
            </div>
          </div>
          <div className="flex-1 w-full -ml-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                <defs>
                  <linearGradient id="colorVelocity" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#C7F964" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#C7F964" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.3} />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: '800' }} 
                  dy={15} 
                />
                {/* Dual Y-Axes */}
                <YAxis 
                  yAxisId="left"
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#C7F964', fontWeight: '800' }}
                  dx={-5}
                  unit="%"
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#f59e0b', fontWeight: '800' }}
                  dx={5}
                />
                <ReferenceLine yAxisId="left" y={0} stroke="#94a3b8" strokeDasharray="3 3" opacity={0.5} label={{ value: 'Baseline', position: 'insideBottomRight', fill: '#94a3b8', fontSize: 8, fontWeight: 'bold' }} />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#94a3b8', strokeWidth: 1, strokeDasharray: '4 4' }} />
                <Area 
                  yAxisId="left"
                  name="Hiệu suất (%)" 
                  type="monotone" 
                  dataKey="Hiệu suất (%)" 
                  stroke="#C7F964" 
                  fillOpacity={1} 
                  fill="url(#colorVelocity)" 
                  strokeWidth={3} 
                  dot={{ r: 0 }} 
                  activeDot={{ r: 6, strokeWidth: 2, stroke: '#fff' }} 
                />
                <Area 
                  yAxisId="right"
                  name="Xong trong ngày" 
                  type="monotone" 
                  dataKey="Xong trong ngày" 
                  stroke="#f59e0b" 
                  fill="transparent" 
                  strokeWidth={2} 
                  strokeDasharray="4 4"
                  dot={{ r: 0 }} 
                  activeDot={{ r: 5, strokeWidth: 1, stroke: '#fff' }} 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectAnalyticsChart;
