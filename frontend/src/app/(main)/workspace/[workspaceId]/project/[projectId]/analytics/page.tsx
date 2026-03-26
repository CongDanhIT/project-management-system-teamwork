'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { projectService, Project } from '@/services/project.service';
import { Loader2, LayoutGrid, BarChart3, Settings, TrendingUp, CheckCircle2, Clock, AlertCircle, Layout } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { useQueryClient } from '@tanstack/react-query';

export default function ProjectAnalyticsPage() {
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  const projectId = params.projectId as string;
  const [project, setProject] = useState<Project | null>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    const fetchProjectData = async () => {
      try {
        const [projectData, analyticsData] = await Promise.all([
          projectService.getProjectById(workspaceId, projectId),
          projectService.getProjectAnalytics(workspaceId, projectId)
        ]);
        setProject(projectData);
        setAnalytics(analyticsData);
        // Invalidate workspace projects to refresh sorting on dashboard
        queryClient.invalidateQueries({ queryKey: ['workspace-projects', workspaceId] });
      } catch (error) {
        console.error('Fetch analytics error:', error);
      } finally {
        setLoading(false);
      }
    };

    if (workspaceId && projectId) {
      fetchProjectData();
    }
  }, [workspaceId, projectId, queryClient]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (!project || !analytics) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] text-slate-500">
        <p>Không thể tải dữ liệu phân tích.</p>
      </div>
    );
  }

  const chartData = [
    { name: 'Hoàn thành', value: analytics.completedTasks, color: '#10B981' },
    { name: 'Quá hạn', value: analytics.overdueTasks, color: '#EF4444' },
    { name: 'Đang thực hiện', value: analytics.totalTasks - analytics.completedTasks - analytics.overdueTasks, color: '#4F46E5' },
  ];

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Project Header (Shared with Board) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-2xl border border-indigo-100 shadow-sm">
            {project.emoji || '🎯'}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              {project.name}
            </h1>
            <p className="text-sm text-slate-500">Phân tích dự án & Hiệu suất</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-white/50 backdrop-blur-sm p-1.5 rounded-xl border border-slate-200/60 shadow-sm">
          <Link 
            href={`/workspace/${workspaceId}/project/${projectId}/board`}
            className="px-3 py-1 text-slate-500 hover:text-slate-700 text-sm font-medium flex items-center"
          >
            <LayoutGrid className="w-4 h-4 mr-2" />
            Board
          </Link>
          <Link 
            href={`/workspace/${workspaceId}/project/${projectId}/table`}
            className="px-3 py-1 text-slate-500 hover:text-slate-700 text-sm font-medium flex items-center"
          >
            <Layout className="w-4 h-4 mr-2" />
            Table
          </Link>
          <Link 
            href={`/workspace/${workspaceId}/project/${projectId}/analytics`}
            className="px-3 py-1 bg-white shadow-sm text-indigo-600 hover:text-indigo-700 font-semibold text-sm rounded-md flex items-center border border-slate-200"
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Analytics
          </Link>
        </div>
      </div>

      {/* Analytics Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 min-h-0">
        {/* Main Chart Card */}
        <Card className="md:col-span-2 bg-white/70 backdrop-blur-md border-slate-200/60 shadow-glass rounded-2xl overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-500" />
              Tiến độ công việc
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 12 }} 
                />
                <YAxis hide />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={60}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Stats Column */}
        <div className="flex flex-col gap-6">
          <Card className="flex-1 bg-white/70 backdrop-blur-md border-slate-200/60 shadow-glass rounded-2xl border-l-[6px] border-l-indigo-500">
            <CardContent className="flex flex-col items-center justify-center h-full py-8">
              <div className="text-4xl font-bold text-indigo-600 mb-1">
                {Math.round(analytics.completionRate)}%
              </div>
              <div className="text-sm font-medium text-slate-500 uppercase tracking-wider">Tỷ lệ hoàn thành</div>
            </CardContent>
          </Card>

          <Card className="flex-1 bg-white/70 backdrop-blur-md border-slate-200/60 shadow-glass rounded-2xl border-l-[6px] border-l-emerald-500">
            <CardContent className="flex flex-col items-center justify-center h-full py-8 text-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-2" />
              <div className="text-3xl font-bold text-slate-800">{analytics.completedTasks}</div>
              <div className="text-sm font-medium text-slate-500">Đã xong</div>
            </CardContent>
          </Card>
        </div>

        {/* Row 2 of Bento */}
        <Card className="bg-white/70 backdrop-blur-md border-slate-200/60 shadow-glass rounded-2xl border-l-[6px] border-l-rose-500">
          <CardContent className="flex flex-col items-center justify-center py-10">
            <AlertCircle className="w-10 h-10 text-rose-500 mb-3" />
            <div className="text-4xl font-bold text-slate-800 mb-1">{analytics.overdueTasks}</div>
            <div className="text-sm font-medium text-slate-500">Công việc quá hạn</div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 bg-white/70 backdrop-blur-md border-slate-200/60 shadow-glass rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-500" />
              Tổng quan Dự án
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-around h-[160px]">
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-800">{analytics.totalTasks}</div>
              <div className="text-sm text-slate-500">Tổng số Task</div>
            </div>
            <div className="w-px h-12 bg-slate-200" />
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-800">{analytics.totalTasks - analytics.completedTasks}</div>
              <div className="text-sm text-slate-500">Còn lại</div>
            </div>
            <div className="w-px h-12 bg-slate-200" />
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-600">{project.createdBy.name}</div>
              <div className="text-sm text-slate-500">Chủ dự án</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
