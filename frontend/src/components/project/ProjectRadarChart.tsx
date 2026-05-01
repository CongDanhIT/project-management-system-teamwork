'use client';

import React from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ProjectRadarChartProps {
  title: string;
  data: { name: string; count: number }[];
  color?: string;
  fill?: string;
}

export default function ProjectRadarChart({ title, data, color = "#035D5B", fill = "#10B981" }: ProjectRadarChartProps) {
  // Chuẩn bị dữ liệu cho Radar Chart
  const chartData = data && data.length > 0 
    ? data.map(item => ({
        subject: item.name,
        A: item.count,
      }))
    : [
        { subject: 'Member A', A: 0 },
        { subject: 'Member B', A: 0 },
        { subject: 'Member C', A: 0 },
        { subject: 'Member D', A: 0 },
        { subject: 'Member E', A: 0 },
      ];

  return (
    <Card className="rounded-[32px] border-white/40 dark:border-white/5 bg-white/40 dark:bg-card/40 backdrop-blur-md shadow-ambient overflow-hidden hover:border-brand-primary/20 transition-all h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-brand-primary/80">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="h-[280px] flex items-center justify-center p-2">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
            <PolarGrid stroke="#94a3b8" strokeOpacity={0.2} />
            <PolarAngleAxis 
              dataKey="subject" 
              tick={{ fill: 'currentColor', fontSize: 9, fontWeight: 700 }}
            />
            <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={false} axisLine={false} />
            <Radar
              name="Số lượng"
              dataKey="A"
              stroke={color}
              fill={fill}
              fillOpacity={0.4}
            />
            <Tooltip 
              content={({ active, payload }: any) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-white/10 p-3 rounded-2xl shadow-xl min-w-[150px] animate-in fade-in zoom-in-95 duration-200">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 border-b border-slate-100 dark:border-white/5 pb-1">
                        {payload[0].payload.subject}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">Số lượng:</span>
                        <span className="text-sm font-black" style={{ color: color }}>
                          {payload[0].value} Task
                        </span>
                      </div>
                      <p className="text-[9px] text-slate-400 italic mt-2">
                        {title.includes('Thành viên') ? 'Tổng khối lượng công việc đảm nhiệm.' : 'Phân loại công việc theo nhãn này.'}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
