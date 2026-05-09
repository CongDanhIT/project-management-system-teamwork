'use client';

import React, { useState, useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import { FilterState } from './DashboardMacroFilter';

interface WorkspaceAnalyticsChartProps {
  data: any[];
  macroFilters?: FilterState;
}

// Component điểm sáng nhấp nháy cho điểm cuối cùng của biểu đồ
const PulsingDot = (props: any) => {
  const { cx, cy, index, dataLength, color } = props;
  if (index !== dataLength - 1) return null;

  return (
    <g>
      <circle cx={cx} cy={cy} r={8} fill={color} className="animate-ping opacity-40" />
      <circle cx={cx} cy={cy} r={5} fill={color} className="animate-pulse opacity-60" />
      <circle 
        cx={cx} cy={cy} r={4} 
        fill={color} 
        stroke="white" 
        strokeWidth={2} 
        className="drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]"
      />
    </g>
  );
};

const WorkspaceAnalyticsChart = ({ data, macroFilters }: WorkspaceAnalyticsChartProps) => {
  const [range, setRange] = useState<'7d' | '30d' | '90d' | '1y' | 'all'>('all');

  // Xác định chế độ báo cáo từ macroFilters
  const isReportMode = useMemo(() => {
    if (!macroFilters) return false;
    const now = new Date();
    if (macroFilters.year < now.getFullYear()) return true;
    if (macroFilters.periodType === 'month') {
      if (macroFilters.periodValue === 0) return false;
      if (macroFilters.periodValue < now.getMonth() + 1) return true;
    }
    if (macroFilters.periodType === 'quarter') {
      if (macroFilters.periodValue < Math.ceil((now.getMonth() + 1) / 3)) return true;
    }
    return false;
  }, [macroFilters]);

  // Kiểm tra tương lai
  const isFutureMode = useMemo(() => {
    if (!macroFilters) return false;
    const now = new Date();
    if (macroFilters.year > now.getFullYear()) return true;
    if (macroFilters.year < now.getFullYear()) return false;

    if (macroFilters.periodType === 'month') {
      if (macroFilters.periodValue === 0) return false;
      return macroFilters.periodValue > (now.getMonth() + 1);
    }
    if (macroFilters.periodType === 'quarter') {
      return macroFilters.periodValue > Math.ceil((now.getMonth() + 1) / 3);
    }
    return false;
  }, [macroFilters]);

  const rangeMap = {
    '7d': 7,
    '30d': 30,
    '90d': 90,
    '1y': 365,
    'all': Infinity
  };

  const sortedData = useMemo(() => {
    if (!data || data.length === 0) return [];
    return [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [data]);

  const filteredData = useMemo(() => {
    if (sortedData.length === 0 || isFutureMode) return [];

    // Nếu đang ở chế độ báo cáo, lọc theo Tháng/Quý của Macro Filter
    if (isReportMode && macroFilters) {
      return sortedData.filter(item => {
        const d = parseISO(item.date);
        if (d.getFullYear() !== macroFilters.year) return false;
        if (macroFilters.periodType === 'month') return (d.getMonth() + 1) === macroFilters.periodValue;
        return Math.ceil((d.getMonth() + 1) / 3) === macroFilters.periodValue;
      });
    }

    const daysToKeep = rangeMap[range];
    if (daysToKeep >= sortedData.length) return sortedData;
    return sortedData.slice(-daysToKeep);
  }, [sortedData, range, isReportMode, macroFilters]);

  const chartData = useMemo(() => {
    return filteredData.map((item) => ({
      date: format(new Date(item.date), 'dd/MM', { locale: vi }),
      'Hoàn thành': item.completedTasks,
      'Tất cả': item.totalTasks,
      'Quá hạn': item.overdueTasks,
    }));
  }, [filteredData]);

  if (!data || data.length === 0 || chartData.length === 0) {
    return (
      <div className="w-full h-[200px] flex items-center justify-center bg-zinc-50/50 dark:bg-zinc-900/50 rounded-3xl border border-dashed border-zinc-200 dark:border-zinc-800">
        <p className="text-sm text-zinc-500">
          {isFutureMode ? "Dữ liệu nhịp độ cho kỳ này chưa được khởi tạo." : "Đang thu thập dữ liệu nhịp độ hàng ngày..."}
        </p>
      </div>
    );
  }

  const FilterButton = ({ value, label, days }: { value: typeof range, label: string, days: number }) => {
    const isDisabled = days > sortedData.length && value !== 'all';
    
    return (
      <button
        disabled={isDisabled}
        onClick={() => setRange(value)}
        title={isDisabled ? `Cần ít nhất ${days} ngày dữ liệu` : label}
        className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full transition-all duration-500 ${
          range === value 
            ? 'bg-[#035D5B] text-white shadow-lg shadow-emerald-900/20 scale-105' 
            : isDisabled
              ? 'opacity-20 grayscale cursor-not-allowed text-zinc-400'
              : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 bg-zinc-100/50 dark:bg-white/5 hover:scale-105'
        }`}
      >
        {label}
      </button>
    );
  };

  return (
    <div className="w-full h-[400px] relative group isolate">
      <div className="absolute -inset-2 bg-gradient-to-tr from-indigo-500/10 via-emerald-500/5 to-transparent rounded-[40px] blur-3xl opacity-20 group-hover:opacity-30 transition-opacity duration-1000 animate-pulse" />
      
      <div className="relative h-full bg-white/40 dark:bg-zinc-900/40 backdrop-blur-2xl rounded-[32px] border border-white/40 dark:border-white/5 p-8 flex flex-col shadow-[0_20px_50px_rgba(0,0,0,0.05)] dark:shadow-none overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none" 
             style={{ backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

        <div className="flex items-center justify-between mb-8 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-1.5 h-1.5 rounded-full bg-[#a2ff00] animate-pulse" />
              <h3 className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.25em]">
                Workspace Daily Pulse
              </h3>
            </div>
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              {range === 'all' || rangeMap[range] >= sortedData.length 
                ? `Toàn bộ nhịp độ (${sortedData.length} ngày)` 
                : `Nhịp độ ${filteredData.length} ngày gần nhất`}
            </p>
          </div>
          
          <div className="flex gap-5">
             <div className="flex items-center gap-2">
                <div className="w-2.5 h-1 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"></div>
                <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-widest">Tổng việc</span>
             </div>
             <div className="flex items-center gap-2">
                <div className="w-2.5 h-1 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-widest">Hoàn thành</span>
             </div>
          </div>
        </div>

        <div className="flex-1 w-full relative z-10 -ml-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
              <defs>
                <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              
              <Tooltip
                cursor={{ stroke: 'rgba(161, 161, 170, 0.2)', strokeWidth: 1 }}
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.8)',
                  backdropFilter: 'blur(16px)',
                  borderRadius: '20px',
                  border: '1px solid rgba(255,255,255,0.4)',
                  boxShadow: '0 20px 40px -10px rgba(0,0,0,0.1)',
                  padding: '12px',
                }}
                itemStyle={{ fontSize: '11px', fontWeight: '700' }}
                labelStyle={{ fontSize: '10px', fontWeight: '800', marginBottom: '4px', color: '#71717a' }}
              />
              
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 9, fill: '#a1a1aa', fontWeight: '700' }}
                dy={15}
                minTickGap={40}
                padding={{ left: 10, right: 10 }}
              />
              
              <YAxis hide domain={['dataMin - 1', 'dataMax + 5']} />
              
              <Area
                type="monotone"
                dataKey="Tất cả"
                stroke="#6366f1"
                fillOpacity={1}
                fill="url(#colorTotal)"
                strokeWidth={3}
                dot={<PulsingDot dataLength={chartData.length} color="#6366f1" />}
                activeDot={{ r: 5, strokeWidth: 0, fill: '#6366f1' }}
                animationDuration={1500}
              />
              
              <Area
                type="monotone"
                dataKey="Hoàn thành"
                stroke="#10b981"
                fillOpacity={1}
                fill="url(#colorCompleted)"
                strokeWidth={3}
                dot={<PulsingDot dataLength={chartData.length} color="#10b981" />}
                activeDot={{ r: 5, strokeWidth: 0, fill: '#10b981' }}
                animationDuration={2000}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {!isReportMode && (
          <div className="mt-6 flex items-center justify-center gap-3 relative z-10 border-t border-zinc-100 dark:border-white/5 pt-5">
            <FilterButton value="7d" label="7 ngày" days={7} />
            <FilterButton value="30d" label="1 tháng" days={30} />
            <FilterButton value="90d" label="3 tháng" days={90} />
            <FilterButton value="1y" label="1 năm" days={365} />
            <FilterButton value="all" label="Tất cả" days={0} />
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkspaceAnalyticsChart;

