'use client';

import React from 'react';
import {
  Area,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  CartesianGrid,
  Bar,
  Line,
  ComposedChart,
  Legend,
  ReferenceLine
} from 'recharts';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";
import { Info } from "lucide-react";

interface ProjectAnalyticsChartProps {
  data: any[];
}

const CHART_DESCRIPTIONS: Record<string, string> = {
  'Thực tế': 'Số lượng công việc còn tồn đọng chưa hoàn thành tại thời điểm này.',
  'Lý tưởng': 'Lộ trình hoàn thành công việc chuẩn nếu đội ngũ làm việc đúng theo kế hoạch ban đầu.',
  'Dự báo': 'Dự đoán thời gian về đích dựa trên vận tốc làm việc thực tế của 7 ngày gần nhất.',
  'Xong trong ngày': 'Tổng số lượng công việc đã được chuyển sang trạng thái "Hoàn thành" trong ngày này.',
  'Hiệu suất (%)': 'Tỷ lệ so sánh giữa kết quả thực tế và kỳ vọng. Số dương (%) thể hiện việc đang vượt tiến độ.',
  'Thực tế (Vùng)': 'Vùng trực quan hóa khối lượng công việc còn lại.'
};

const ProjectAnalyticsChart = ({ data }: ProjectAnalyticsChartProps) => {
  if (!data || data.length === 0) {
    return (
      <div className="w-full h-[300px] flex flex-col items-center justify-center bg-slate-50/50 dark:bg-slate-900/50 rounded-[32px] border-2 border-dashed border-slate-200 dark:border-white/10 p-10">
        <p className="text-sm text-slate-500 font-bold uppercase tracking-widest">Đang thu thập dữ liệu...</p>
      </div>
    );
  }

  // Tính toán vận tốc và dự báo
  const lastSevenDays = data.slice(-7);
  const totalDoneInPeriod = lastSevenDays.reduce((acc, curr) => acc + (curr.dailyCompletedTasks || 0), 0);
  const velocity = totalDoneInPeriod / (lastSevenDays.length || 1);
  
  const lastDataPoint = data[data.length - 1];
  const firstDataPoint = data[0];
  const remainingTasks = lastDataPoint.remainingTasks || 0;
  const totalInitialTasks = firstDataPoint.remainingTasks || 0;
  
  // Tính số ngày dự kiến để xong (nếu velocity > 0)
  const daysToFinish = velocity > 0 ? Math.ceil(remainingTasks / velocity) : 30; // Mặc định 30 ngày nếu không có velocity
  const estimatedFinishDate = daysToFinish !== Infinity 
    ? new Date(new Date(lastDataPoint.date).getTime() + daysToFinish * 24 * 60 * 60 * 1000)
    : null;

  const chartData = data.map((item, index) => {
    const isLast = index === data.length - 1;
    
    // 4. Đường lý tưởng (Ideal Burndown) - Dự phòng nếu backend trả về null
    // Nếu có deadline, backend sẽ trả về con số chính xác theo lộ trình thực tế
    let idealValue = null;
    if (item.idealTasksRemaining !== null && item.idealTasksRemaining !== undefined) {
      idealValue = item.idealTasksRemaining;
    } else if (index === 0) {
      // Điểm bắt đầu của lý tưởng là số task hiện tại
      idealValue = totalInitialTasks;
    } else {
      // Fallback: Nếu không có deadline dự án, đường lý tưởng sẽ mặc định dốc về 0 
      // sau 30 ngày kể từ khi bắt đầu cửa sổ dữ liệu hiện tại (thay vì 14 ngày)
      const slope = totalInitialTasks / 30; 
      idealValue = Math.max(0, Math.round(totalInitialTasks - (index * slope)));
    }

    return {
      date: format(new Date(item.date), 'dd/MM', { locale: vi }),
      'Thực tế': item.remainingTasks,
      'Lý tưởng': idealValue,
      'Xong trong ngày': item.dailyCompletedTasks || 0,
      'Hiệu suất (%)': Number(item.performanceIndex || 0),
      'Dự báo': isLast ? item.remainingTasks : null,
    };
  });

  // Thêm các điểm dự báo vào tương lai (thêm khoảng 7 điểm dự báo để đường dài hơn)
  if (estimatedFinishDate && velocity >= 0) {
    const forecastCount = 7;
    for (let i = 1; i <= forecastCount; i++) {
      const forecastDate = new Date(new Date(lastDataPoint.date).getTime() + (i * 2) * 24 * 60 * 60 * 1000); // Cách 2 ngày 1 điểm
      const forecastRemaining = Math.max(0, remainingTasks - (velocity * (i * 2)));
      
      chartData.push({
        date: format(forecastDate, 'dd/MM', { locale: vi }),
        'Thực tế': null,
        'Lý tưởng': null,
        'Xong trong ngày': null,
        'Hiệu suất (%)': null,
        'Dự báo': Math.round(forecastRemaining),
      } as any);

      if (forecastRemaining <= 0) break; // Dừng khi đã về 0
    }
  }

  const isSlowerThanIdeal = lastDataPoint.idealTasksRemaining !== null && 
                            lastDataPoint.remainingTasks > lastDataPoint.idealTasksRemaining;
  const taskDifference = lastDataPoint.idealTasksRemaining !== null ? 
                         Math.abs(lastDataPoint.remainingTasks - lastDataPoint.idealTasksRemaining) : 0;

  const renderCustomLegend = (props: any) => {
    const { payload } = props;
    return (
      <TooltipProvider delayDuration={0}>
        <div className="flex flex-wrap justify-center gap-6 mt-6">
          {payload.map((entry: any, index: number) => {
             const description = CHART_DESCRIPTIONS[entry.value];
             return (
               <Tooltip key={`item-${index}`}>
                 <TooltipTrigger asChild>
                   <div className="flex items-center gap-2 cursor-help group transition-all">
                     <div className="w-2 h-2 rounded-full shadow-sm" style={{ backgroundColor: entry.color }} />
                     <span className="text-[10px] font-black text-slate-500 group-hover:text-slate-800 dark:group-hover:text-white uppercase tracking-widest transition-colors flex items-center gap-1.5">
                       {entry.value}
                       <Info className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400" />
                     </span>
                   </div>
                 </TooltipTrigger>
                 {description && (
                   <TooltipContent className="bg-slate-900 text-white border-none rounded-xl p-3 shadow-2xl max-w-[250px]">
                     <p className="text-[11px] font-medium leading-relaxed">{description}</p>
                   </TooltipContent>
                 )}
               </Tooltip>
             );
          })}
        </div>
      </TooltipProvider>
    );
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200 dark:border-white/10 p-5 rounded-[24px] shadow-2xl min-w-[280px] ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-white/5">
             <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
             <span className="text-[9px] font-bold text-brand-primary/60 bg-brand-primary/5 px-2 py-0.5 rounded-full uppercase">Analytics</span>
          </div>
          
          <div className="space-y-4">
            {payload.map((entry: any, index: number) => {
              if (entry.value === null || entry.value === undefined) return null;
              const isPerformance = entry.name.includes('%');
              const isIdeal = entry.name === 'Lý tưởng';
              const isForecast = entry.name === 'Dự báo';
              const valueColor = entry.color || entry.fill || (isIdeal ? '#64748b' : isForecast ? '#6366F1' : '#ef4444');
              const description = CHART_DESCRIPTIONS[entry.name];
              
              return (
                <div key={index} className="space-y-1 group">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full shadow-sm" style={{ backgroundColor: valueColor }}></div>
                      <span className="text-[11px] font-extrabold text-slate-700 dark:text-slate-200 uppercase tracking-tight">{entry.name}</span>
                    </div>
                    <span className="text-[13px] font-black" style={{ color: valueColor }}>
                      {entry.value > 0 && isPerformance ? '+' : ''}{entry.value}{isPerformance ? '%' : ''}
                    </span>
                  </div>
                  {description && (
                    <p className="text-[9px] leading-relaxed text-slate-400 dark:text-white/40 font-medium italic pl-4 border-l border-slate-100 dark:border-white/10 group-hover:text-slate-500 transition-colors">
                      {description}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
      {/* Chart 1: Burndown Analysis */}
      <div className="relative group h-[450px]">
        <div className="absolute -inset-1 bg-gradient-to-r from-red-500/10 to-indigo-500/10 rounded-[40px] blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
        <div className="relative h-full bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl rounded-[32px] border border-white dark:border-white/5 p-8 flex flex-col shadow-ambient">
          <div className="flex items-start justify-between mb-6">
            <div className="space-y-1">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Burndown Analysis</h3>
              <p className="text-sm font-black text-red-500 dark:text-red-400 tracking-tight">Biểu đồ dự báo hoàn thành</p>
            </div>
            <div className="flex flex-col items-end gap-2">
              {lastDataPoint.idealTasksRemaining !== null && (
                <div className={cn(
                  "px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-wider",
                  isSlowerThanIdeal 
                  ? "bg-red-50 border-red-100 text-red-500 dark:bg-red-500/10 dark:border-red-500/20"
                  : "bg-emerald-50 border-emerald-100 text-emerald-500 dark:bg-emerald-500/10 dark:border-emerald-500/20"
                )}>
                  {isSlowerThanIdeal ? `Chậm ${taskDifference} việc` : `Nhanh ${taskDifference} việc`}
                </div>
              )}
              {estimatedFinishDate && (
                <div className="px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 dark:bg-indigo-500/10 dark:border-indigo-500/20 text-[10px] font-black uppercase tracking-wider flex items-center gap-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                   Dự kiến xong: {format(estimatedFinishDate, 'dd/MM/yyyy')}
                </div>
              )}
            </div>
          </div>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="burndownGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
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
                />
                <RechartsTooltip content={<CustomTooltip />} cursor={{ stroke: '#94a3b8', strokeWidth: 1, strokeDasharray: '4 4' }} />
                <Legend content={renderCustomLegend} />
                
                {/* Area for trend */}
                <Area 
                  name="Thực tế (Vùng)" 
                  type="monotone" 
                  dataKey="Thực tế" 
                  fill="url(#burndownGradient)" 
                  stroke="none" 
                  isAnimationActive={false}
                />
                
                {/* Actual Line - Thick Red */}
                <Line 
                  name="Thực tế" 
                  type="monotone" 
                  dataKey="Thực tế" 
                  stroke="#ef4444" 
                  strokeWidth={4} 
                  dot={{ r: 4, fill: '#ef4444', strokeWidth: 2, stroke: '#fff' }} 
                  activeDot={{ r: 6, strokeWidth: 2, stroke: '#fff' }} 
                />

                {/* Forecast Line - Dashed Indigo */}
                <Line 
                  name="Dự báo" 
                  type="monotone" 
                  dataKey="Dự báo" 
                  stroke="#6366f1" 
                  strokeDasharray="5 5" 
                  strokeWidth={3} 
                  dot={{ r: 5, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }} 
                  activeDot={{ r: 7, strokeWidth: 2, stroke: '#fff' }}
                />

                {/* Ideal Line - Dashed Slate */}
                <Line 
                  name="Lý tưởng" 
                  type="monotone" 
                  dataKey="Lý tưởng" 
                  stroke="#94a3b8" 
                  strokeDasharray="3 3" 
                  strokeWidth={2} 
                  dot={{ r: 3, fill: '#94a3b8', strokeWidth: 1, stroke: '#fff' }}
                  opacity={0.6}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Chart 2: Velocity Momentum */}
      <div className="relative group h-[450px]">
        <div className="absolute -inset-1 bg-gradient-to-r from-[#C7F964]/10 to-indigo-500/10 rounded-[40px] blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
        <div className="relative h-full bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl rounded-[32px] border border-white dark:border-white/5 p-8 flex flex-col shadow-ambient">
          <div className="flex items-start justify-between mb-6">
            <div className="space-y-1">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Performance Velocity</h3>
              <p className="text-sm font-black text-[#035D5B] dark:text-[#C7F964] tracking-tight">Hiệu suất & Nhịp độ làm việc</p>
            </div>
            <div className="px-3 py-1 rounded-full bg-[#C7F964]/10 border border-[#C7F964]/20 text-[10px] font-black text-[#035D5B] dark:text-[#C7F964] uppercase tracking-wider">
               {lastDataPoint['Hiệu suất (%)'] > 0 ? 'Tăng tốc' : 'Ổn định'}
            </div>
          </div>
          <div className="flex-1 w-full -ml-4">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                <defs>
                  <linearGradient id="colorDaily" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.3} />
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
                  yAxisId="left"
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: '800' }}
                  dx={-5}
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#C7F964', fontWeight: '800' }}
                  dx={5}
                  unit="%"
                />
                <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: '#f1f5f9', opacity: 0.5 }} />
                <Legend content={renderCustomLegend} />
                <Bar 
                  yAxisId="left"
                  name="Xong trong ngày" 
                  dataKey="Xong trong ngày" 
                  fill="url(#colorDaily)" 
                  radius={[4, 4, 0, 0]} 
                  barSize={30}
                />
                <Line 
                  yAxisId="right"
                  name="Hiệu suất (%)" 
                  type="monotone" 
                  dataKey="Hiệu suất (%)" 
                  stroke="#C7F964" 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: '#C7F964', strokeWidth: 2, stroke: '#fff' }} 
                  activeDot={{ r: 6, strokeWidth: 2, stroke: '#fff' }} 
                />
                <ReferenceLine yAxisId="right" y={0} stroke="#94a3b8" strokeDasharray="3 3" opacity={0.5} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectAnalyticsChart;
