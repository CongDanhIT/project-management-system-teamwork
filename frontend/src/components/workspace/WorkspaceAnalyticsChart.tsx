'use client';

import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface WorkspaceAnalyticsChartProps {
  data: any[];
}

const WorkspaceAnalyticsChart = ({ data }: WorkspaceAnalyticsChartProps) => {
  // Nếu chưa có dữ liệu snapshot, không hiển thị biểu đồ
  if (!data || data.length === 0) {
    return (
      <div className="w-full h-[200px] flex items-center justify-center bg-zinc-50/50 dark:bg-zinc-900/50 rounded-3xl border border-dashed border-zinc-200 dark:border-zinc-800">
        <p className="text-sm text-zinc-500">Đang thu thập dữ liệu nhịp độ hàng ngày...</p>
      </div>
    );
  }

  // Chuẩn bị dữ liệu cho biểu đồ
  const chartData = data.map((item) => ({
    date: format(new Date(item.date), 'dd/MM', { locale: vi }),
    'Hoàn thành': item.completedTasks,
    'Tất cả': item.totalTasks,
    'Quá hạn': item.overdueTasks,
  }));

  return (
    <div className="w-full h-[320px] relative group">
      {/* Background Glow Effect */}
      <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/10 to-indigo-500/10 rounded-[32px] blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
      
      <div className="relative h-full bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl rounded-3xl border border-white/20 dark:border-zinc-800/20 p-6 flex flex-col shadow-2xl shadow-zinc-200/50 dark:shadow-none">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em]">
              Workspace Daily Pulse
            </h3>
            <p className="text-xs text-zinc-500">Nhịp độ công việc 15 ngày qua</p>
          </div>
          
          <div className="flex gap-4">
             <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                <span className="text-[10px] text-zinc-500 font-medium">Tổng việc</span>
             </div>
             <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                <span className="text-[10px] text-zinc-500 font-medium">Hoàn thành</span>
             </div>
          </div>
        </div>

        <div className="flex-1 w-full -ml-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.8)',
                  backdropFilter: 'blur(16px)',
                  borderRadius: '20px',
                  border: '1px solid rgba(255,255,255,0.3)',
                  boxShadow: '0 20px 40px -10px rgba(0,0,0,0.1)',
                  padding: '12px',
                }}
                itemStyle={{ fontSize: '11px', fontWeight: '600' }}
                labelStyle={{ fontSize: '10px', marginBottom: '4px', color: '#999' }}
              />
              
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 9, fill: '#a1a1aa', fontWeight: '500' }}
                dy={10}
              />
              
              <YAxis hide domain={['dataMin - 1', 'dataMax + 2']} />
              
              <Area
                type="monotone"
                dataKey="Tất cả"
                stroke="#6366f1"
                fillOpacity={1}
                fill="url(#colorTotal)"
                strokeWidth={3}
                dot={{ r: 0 }}
                activeDot={{ r: 4, strokeWidth: 0, fill: '#6366f1' }}
              />
              
              <Area
                type="monotone"
                dataKey="Hoàn thành"
                stroke="#10b981"
                fillOpacity={1}
                fill="url(#colorCompleted)"
                strokeWidth={3}
                dot={{ r: 0 }}
                activeDot={{ r: 4, strokeWidth: 0, fill: '#10b981' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default WorkspaceAnalyticsChart;
