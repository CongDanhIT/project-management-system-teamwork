'use client';

import React, { useMemo } from 'react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
  AreaChart, Area
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FilterState } from './DashboardMacroFilter';
import { vi } from 'date-fns/locale';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

interface WorkspaceStatusOverviewProps {
  analytics: any;
  analyticsHistory: any[];
  projects: any[];
  filters: FilterState;
}

const COLORS = {
  todo: '#94a3b8',       // slate-400
  inProgress: '#6366f1', // indigo-500
  inReview: '#f59e0b',   // amber-500
  completed: '#10b981',  // emerald-500
  overdue: '#ef4444'     // red-500
};

export const WorkspaceStatusOverview = ({ analytics, analyticsHistory, projects, filters }: WorkspaceStatusOverviewProps) => {
  
  // 1. Dữ liệu cho Pie Chart (Cơ cấu trạng thái)
  const statusData = useMemo(() => {
    if (!analytics) return [];
    
    // Lưu ý: Hiện tại Backend trả về totalTasks, overdueTasks, completedTasks, inProgressTasks.
    // Chúng ta sẽ tính toán phần còn lại (To Do / In Review) nếu có thể, hoặc hiển thị 4 nhóm chính.
    // Giả định: To Do = Total - (Completed + In Progress + Overdue)
    const others = Math.max(0, analytics.totalTasks - (analytics.completedTasks + analytics.inProgressTasks + analytics.overdueTasks));

    return [
      { name: 'Cần làm', value: others, color: COLORS.todo },
      { name: 'Đang thực hiện', value: analytics.inProgressTasks, color: COLORS.inProgress },
      { name: 'Đã hoàn thành', value: analytics.completedTasks, color: COLORS.completed },
      { name: 'Quá hạn', value: analytics.overdueTasks, color: COLORS.overdue }
    ].filter(item => item.value > 0);
  }, [analytics]);

  // 2. Dữ liệu cho Horizontal Bar Chart (Số lượng công việc theo dự án)
  const projectTasksData = useMemo(() => {
    if (!projects) return [];
    
    // Lọc dự án theo macro-filter nếu có chọn cụ thể
    const filteredProjects = filters.projectIds.length > 0
      ? projects.filter(p => filters.projectIds.includes(String(p._id)))
      : projects;

    return filteredProjects
      .map(p => ({
        name: p.name,
        count: p.totalTasks || 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8); // Top 8 dự án trong danh sách đã lọc
  }, [projects, filters.projectIds]);

  // 3. Dữ liệu cho Line Chart (Vận tốc làm việc / Velocity)
  const velocityData = useMemo(() => {
    if (!analyticsHistory) return [];
    
    // Lọc theo bộ lọc thời gian nếu có chọn kỳ cụ thể
    let filtered = analyticsHistory;
    if (filters && filters.year !== 0) {
      filtered = analyticsHistory.filter(item => {
        const d = parseISO(item.date);
        if (d.getFullYear() !== filters.year) return false;
        if (filters.periodType === 'month') {
          if (filters.periodValue === 0) return true; // Cả năm
          return (d.getMonth() + 1) === filters.periodValue;
        }
        return Math.ceil((d.getMonth() + 1) / 3) === filters.periodValue;
      });
    }
    
    // Sắp xếp theo thứ tự thời gian tăng dần
    const sorted = [...filtered].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // Lấy tối đa 7 ngày gần nhất trong kỳ đã lọc
    return sorted.slice(-7).map(item => ({
      date: format(parseISO(item.date), 'dd/MM', { locale: vi }),
      completed: item.completedTasks || 0
    }));
  }, [analyticsHistory, filters]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-white/10 p-3 rounded-2xl shadow-xl">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{label}</p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: payload[0].color || payload[0].fill }} />
            <p className="text-sm font-bold text-slate-900 dark:text-white">
              {payload[0].value} <span className="text-[10px] font-medium text-slate-400">công việc</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-500">
      <div className="flex items-center gap-3">
        <div className="w-1.5 h-6 bg-[#035D5B] dark:bg-[#C7F964] rounded-full" />
        <h2 className="text-2xl font-black text-[#035D5B] dark:text-[#C7F964] tracking-tight uppercase">Tổng quan công việc</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Row 1 - Left: Status Pie Chart */}
        <div className="lg:col-span-5 bg-white/40 dark:bg-card/40 backdrop-blur-md rounded-[32px] border border-slate-100 dark:border-white/5 p-8 shadow-sm hover:shadow-md transition-all duration-500 overflow-hidden">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.25em]">Cơ cấu trạng thái</h3>
            <div className="text-[10px] font-bold text-[#035D5B] dark:text-[#C7F964] bg-[#035D5B]/5 dark:bg-[#C7F964]/5 px-3 py-1 rounded-full">
              Tỷ lệ %
            </div>
          </div>
          
          <div className="h-[280px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={8}
                  dataKey="value"
                  animationDuration={1500}
                  animationBegin={200}
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Center Info */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tổng cộng</span>
              <span className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">
                {analytics?.totalTasks || 0}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-6">
            {statusData.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 truncate">{item.name}</span>
                <span className="text-[11px] font-black text-slate-900 dark:text-white ml-auto">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Row 1 - Right: Projects Bar Chart */}
        <div className="lg:col-span-7 bg-white/40 dark:bg-card/40 backdrop-blur-md rounded-[32px] border border-slate-100 dark:border-white/5 p-8 shadow-sm hover:shadow-md transition-all duration-500 overflow-hidden">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.25em]">Số lượng công việc theo dự án</h3>
            <div className="text-[10px] font-bold text-[#035D5B] dark:text-[#C7F964] bg-[#035D5B]/5 dark:bg-[#C7F964]/5 px-3 py-1 rounded-full">
              Thống kê
            </div>
          </div>

          <div className="h-[340px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={projectTasksData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} strokeOpacity={0.1} />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false}
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }}
                  width={100}
                />
                <Tooltip cursor={{ fill: 'transparent' }} content={<CustomTooltip />} />
                <Bar 
                  dataKey="count" 
                  radius={[0, 12, 12, 0]} 
                  barSize={20}
                  animationDuration={2000}
                >
                  {projectTasksData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#035D5B' : '#10b981'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Row 2: Velocity Area Chart */}
        <div className="lg:col-span-full bg-white/40 dark:bg-card/40 backdrop-blur-md rounded-[32px] border border-slate-100 dark:border-white/5 p-8 shadow-sm hover:shadow-md transition-all duration-500 overflow-hidden">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.25em] mb-1">Tiến độ theo thời gian</h3>
              <p className="text-xs font-medium text-slate-500">Vận tốc làm việc (Velocity) của toàn nhóm</p>
            </div>
            <div className="flex gap-2">
              {['7 ngày qua', '14 ngày qua', '30 ngày qua'].map((label, idx) => {
                if (idx > 0) return null; // Tạm thời ẩn các option chưa hỗ trợ thay vì chỉ disable
                return (
                  <button 
                    key={idx} 
                    className={cn(
                      "text-[9px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full transition-all border",
                      idx === 0 
                        ? "bg-[#035D5B] dark:bg-[#C7F964] text-white dark:text-[#035D5B] border-transparent shadow-lg shadow-teal-900/20" 
                        : "text-slate-300 dark:text-slate-600 border-slate-100 dark:border-white/5 opacity-40 cursor-not-allowed"
                    )}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="h-[300px] w-full -ml-8">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={velocityData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="velocityGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#035D5B" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#035D5B" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                  dy={10}
                />
                <YAxis hide />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="completed" 
                  stroke="#035D5B" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#velocityGradient)"
                  animationDuration={2500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
