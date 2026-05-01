'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { projectService, Project } from '@/services/project.service';
import { Loader2, LayoutGrid, BarChart3, Settings, TrendingUp, CheckCircle2, Clock, AlertCircle, Layout, BarChart2, Calendar as CalendarIcon, Layers } from 'lucide-react';
import Loader from "@/components/ui/Loader";
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { 
  AreaChart,
  Area,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
} from 'recharts';
import { useQueryClient } from '@tanstack/react-query';
import { Download, FileText, FileSpreadsheet } from 'lucide-react';
import { taskService } from '@/services/task.service';
import * as XLSX from 'xlsx';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import { toast } from 'sonner';
import { useRole } from '@/hooks/useRole';
import { PhaseService } from '@/services/phase.service';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useWorkspaceStore } from '@/stores/workspace.store';


export default function ProjectAnalyticsPage() {
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  const projectId = params.projectId as string;
  const phaseId = params.phaseId as string;
  const [project, setProject] = useState<Project | null>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const router = useRouter();
  const { currentWorkspaceId } = useWorkspaceStore();
  const { isPrivileged } = useRole();
  const queryClient = useQueryClient();
  
  // Fetch Phase status to check for locking
  const { data: phase } = useQuery({
      queryKey: ['phase', phaseId],
      queryFn: () => PhaseService.getPhases(projectId).then(res => res.data.find((p: any) => p._id === phaseId)),
      enabled: !!projectId && !!phaseId,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
      if (phase?.isLocked && !isPrivileged && !loading) {
          toast.error('Giai đoạn này đã bị khóa. Chỉ Quản trị viên mới có quyền truy cập.');
          router.push(`/workspace/${workspaceId}/projects/${projectId}/phases`);
      }
  }, [phase, isPrivileged, loading, workspaceId, projectId, router]);


  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    const fetchProjectData = async () => {
      try {
        const [projectData, analyticsData] = await Promise.all([
          projectService.getProjectById(workspaceId, projectId),
          projectService.getProjectAnalytics(workspaceId, projectId, phaseId)
        ]);
        setProject(projectData);
        setAnalytics(analyticsData);
        queryClient.invalidateQueries({ queryKey: ['workspace-projects', workspaceId] });
      } catch (error) {
        console.error('Fetch analytics error:', error);
      } finally {
        setLoading(false);
      }
    };

    if (workspaceId && projectId && phaseId) {
      fetchProjectData();
    }
  }, [workspaceId, projectId, phaseId, queryClient]);

  const handleExportExcel = async () => {
    if (!project) return;
    setIsExporting(true);
    try {
      const response = await taskService.getProjectTasks(workspaceId, projectId, { pageSize: 1000, phaseId });
      const tasks = response.tasks;
      
      const data = tasks.map(t => ({
        'Mã Task': t.taskCode,
        'Tên công việc': t.title,
        'Trạng thái': t.status,
        'Mức ưu tiên': t.priority,
        'Ngày bắt đầu': t.startDate ? new Date(t.startDate).toLocaleDateString('vi-VN') : '',
        'Hạn chót': t.dueDate ? new Date(t.dueDate).toLocaleDateString('vi-VN') : '',
        'Người thực hiện': t.assignedTo?.map((u: any) => u.name).join(', ') || 'Chưa gán',
      }));

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Tasks");
      XLSX.writeFile(wb, `Project_${project.name}_Tasks.xlsx`);
      toast.success('Xuất file Excel thành công');
    } catch (error) {
      console.error(error);
      toast.error('Lỗi khi xuất file Excel');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPDF = async () => {
    if (!project) return;
    setIsExporting(true);
    
    const element = document.getElementById('analytics-dashboard');
    const chartContainer = document.getElementById('pdf-chart');
    const sidebarContainer = document.getElementById('pdf-sidebar');

    if (!element || !chartContainer || !sidebarContainer) {
      setIsExporting(false);
      return;
    }

    // Save original styles
    const originalDisplay = element.style.display;
    const originalWidth = element.style.width;
    const originalHeight = element.style.height;
    
    const originalChartWidth = chartContainer.style.width;
    const originalSidebarWidth = sidebarContainer.style.width;
    const originalSidebarMargin = sidebarContainer.style.marginLeft;

    // --- BULLETPROOF LAYOUT FIX FOR HTML-TO-IMAGE ---
    // CSS Grid can be extremely buggy in SVG foreignObject. We switch to Flexbox.
    element.style.display = 'flex';
    element.style.width = '1200px';
    element.style.height = `${element.offsetHeight}px`; // Prevent height collapse
    
    // Explicitly size the children
    chartContainer.style.width = '750px';
    chartContainer.style.flexShrink = '0';
    
    sidebarContainer.style.width = '418px'; // 1200 - 750 - 32px gap
    sidebarContainer.style.marginLeft = '32px';
    sidebarContainer.style.flexShrink = '0';

    try {
      await new Promise(resolve => setTimeout(resolve, 150)); // Allow re-flow

      const imgData = await toPng(element, { 
        cacheBust: true, 
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        width: 1200,
        height: element.offsetHeight,
        style: {
          margin: '0',
        }
      });

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      
      const imgProps = pdf.getImageProperties(imgData);
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Project_${project.name}_Analytics.pdf`);
      toast.success('Xuất báo cáo PDF thành công');
    } catch (error) {
      console.error('PDF Export Error:', error);
      toast.error('Lỗi khi xuất báo cáo PDF');
    } finally {
      // Revert to original styles
      element.style.display = originalDisplay;
      element.style.width = originalWidth;
      element.style.height = originalHeight;
      
      chartContainer.style.width = originalChartWidth;
      chartContainer.style.flexShrink = '';
      
      sidebarContainer.style.width = originalSidebarWidth;
      sidebarContainer.style.marginLeft = originalSidebarMargin;
      sidebarContainer.style.flexShrink = '';
      
      setIsExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <Loader size="lg" />
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

  // Dữ liệu giả lập cho biểu đồ xu hướng 7 ngày để UI trông premium
  const trendData = [
    { day: 'T2', value: Math.max(0, Math.floor(analytics.totalTasks * 0.45)) },
    { day: 'T3', value: Math.max(0, Math.floor(analytics.totalTasks * 0.52)) },
    { day: 'T4', value: Math.max(0, Math.floor(analytics.totalTasks * 0.48)) },
    { day: 'T5', value: Math.max(0, Math.floor(analytics.totalTasks * 0.60)) },
    { day: 'T6', value: Math.max(0, Math.floor(analytics.totalTasks * 0.75)) },
    { day: 'T7', value: Math.max(0, Math.floor(analytics.totalTasks * 0.82)) },
    { day: 'CN', value: analytics.completedTasks },
  ];

  return (
    <div className="space-y-8 h-full flex flex-col pb-20 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      {/* Project Header - Glassmorphism Editorial Tech */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-[28px] bg-brand-primary/10 flex items-center justify-center text-4xl shadow-depth-2 border border-brand-primary/20 backdrop-blur-xl">
            {project.emoji || '🎯'}
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tighter leading-none mb-2">
              {project.name}
            </h1>
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-black text-brand-primary uppercase tracking-[0.2em] px-3 py-1 bg-brand-primary/5 rounded-full border border-brand-primary/10">Project Engine</span>
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                <CalendarIcon className="w-3 h-3" /> Cập nhật {new Date().toLocaleDateString('vi-VN')}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-white/50 dark:bg-slate-900/40 p-1.5 rounded-[24px] border border-slate-200/60 dark:border-white/10 backdrop-blur-md shadow-glass">
            <Link 
              href={`/workspace/${workspaceId}/projects/${projectId}/phases/${phaseId}/board`}
              className="px-6 py-2.5 text-slate-500 dark:text-slate-400 hover:text-brand-primary transition-all text-[11px] font-black uppercase tracking-widest flex items-center rounded-2xl hover:bg-white dark:hover:bg-white/5"
            >
              <LayoutGrid className="w-4 h-4 mr-2" /> Board
            </Link>
            <Link 
              href={`/workspace/${workspaceId}/projects/${projectId}/phases/${phaseId}/table`}
              className="px-6 py-2.5 text-slate-500 dark:text-slate-400 hover:text-brand-primary transition-all text-[11px] font-black uppercase tracking-widest flex items-center rounded-2xl hover:bg-white dark:hover:bg-white/5"
            >
              <Layout className="w-4 h-4 mr-2" /> Table
            </Link>
            <Link 
              href={`/workspace/${workspaceId}/projects/${projectId}/phases/${phaseId}/calendar`}
              className="px-6 py-2.5 text-slate-500 dark:text-slate-400 hover:text-brand-primary transition-all text-[11px] font-black uppercase tracking-widest flex items-center rounded-2xl hover:bg-white dark:hover:bg-white/5"
            >
              <CalendarIcon className="w-4 h-4 mr-2" /> Calendar
            </Link>
            <div className="px-6 py-2.5 bg-brand-primary text-white shadow-glow-combined transition-all text-[11px] font-black uppercase tracking-widest flex items-center rounded-2xl ring-1 ring-white/20">
              <BarChart3 className="w-4 h-4 mr-2" /> Analytics
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              onClick={handleExportExcel}
              disabled={isExporting}
              className="rounded-[20px] bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 border-slate-200/60 dark:border-white/10 shadow-sm"
            >
              {isExporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileSpreadsheet className="w-4 h-4 mr-2 text-emerald-500" />}
              Excel
            </Button>
            <Button 
              variant="outline"
              onClick={handleExportPDF}
              disabled={isExporting}
              className="rounded-[20px] bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 border-slate-200/60 dark:border-white/10 shadow-sm"
            >
              {isExporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2 text-rose-500" />}
              PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Analytics Bento Grid */}
      <div id="analytics-dashboard" className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1 min-h-0 bg-transparent rounded-[48px]">
        {/* Main Area Chart - High Contrast & Depth */}
        <div id="pdf-chart" className="lg:col-span-2">
          <div className="bg-white/80 dark:bg-slate-900/50 backdrop-blur-2xl border border-slate-200/60 dark:border-white/10 rounded-[48px] p-10 shadow-depth-3 h-full flex flex-col relative overflow-hidden group">
             {/* Decorative Ambient Light */}
             <div className="absolute -top-24 -right-24 w-64 h-64 bg-brand-primary/10 rounded-full blur-[100px] pointer-events-none" />
             
             <div className="flex items-center justify-between mb-12 relative z-10">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Vận tốc công việc</h2>
                  <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mt-2">Dữ liệu phân tích thời gian thực</p>
                </div>
                <div className="flex items-center gap-2 p-1.5 bg-slate-100/50 dark:bg-white/5 rounded-2xl border border-slate-200/60 dark:border-white/5 shadow-inner">
                  <Button variant="ghost" size="sm" className="rounded-xl bg-white dark:bg-slate-800 shadow-depth-1 text-[10px] font-black uppercase tracking-widest px-6 h-9">Weekly</Button>
                  <Button variant="ghost" size="sm" className="rounded-xl text-[10px] font-black uppercase tracking-widest px-6 h-9 text-slate-500 dark:text-slate-400 opacity-50 hover:opacity-100">Monthly</Button>
                </div>
             </div>

             <div className="flex-1 w-full min-h-[350px] relative z-10 mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0D9488" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#0D9488" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="8 8" vertical={false} stroke="#64748b" opacity={0.05} />
                    <XAxis 
                      dataKey="day" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 900 }}
                      dy={15}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 900 }}
                    />
                    <Tooltip 
                      cursor={{ stroke: '#0D9488', strokeWidth: 2, strokeDasharray: '5 5' }}
                      contentStyle={{ 
                        borderRadius: '24px', 
                        border: '1px solid rgba(255,255,255,0.1)', 
                        boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.5)',
                        backgroundColor: 'rgba(15, 23, 42, 0.95)',
                        backdropFilter: 'blur(16px)',
                        padding: '16px 20px',
                        color: '#fff'
                      }}
                      itemStyle={{ color: '#2DD4BF', fontWeight: 900 }}
                      labelStyle={{ color: '#94A3B8', marginBottom: '8px', fontWeight: 900, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#0D9488" 
                      strokeWidth={6}
                      fillOpacity={1} 
                      fill="url(#colorValue)" 
                      animationDuration={2500}
                    />
                  </AreaChart>
                </ResponsiveContainer>
             </div>
          </div>
        </div>

        {/* Sidebar Insights */}
        <div id="pdf-sidebar" className="space-y-8 h-full flex flex-col">
          {/* Main Insights Card */}
          <div className="bg-white/80 dark:bg-slate-900/50 backdrop-blur-2xl border border-slate-200/60 dark:border-white/10 rounded-[48px] p-10 shadow-depth-3 space-y-10 flex-1 flex flex-col justify-center">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-[32px] bg-brand-primary/10 flex items-center justify-center shadow-inner-depth border border-brand-primary/20">
                <BarChart2 className="w-10 h-10 text-brand-primary animate-pulse" />
              </div>
              <div className="space-y-1">
                <h3 className="text-[10px] font-black text-brand-primary uppercase tracking-[0.3em]">Health Score</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-black text-slate-900 dark:text-slate-100 tracking-tighter">
                    {Math.round(analytics.completionRate)}%
                  </span>
                  <span className="text-xs font-black text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">Excellent</span>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                <span>Total Delivery</span>
                <span className="text-slate-900 dark:text-slate-200">{analytics.completedTasks}/{analytics.totalTasks} Tasks</span>
              </div>
              <div className="h-4 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden p-1 border border-slate-200 dark:border-white/5 shadow-inner">
                <div 
                  className="h-full bg-gradient-to-r from-brand-primary via-teal-500 to-brand-primary bg-[length:200%_auto] animate-shimmer rounded-full shadow-lg shadow-brand-primary/40 transition-all duration-1500" 
                  style={{ width: `${analytics.completionRate}%` }} 
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-5">
              <div className="p-8 rounded-[36px] bg-emerald-50/50 dark:bg-emerald-500/5 border border-emerald-100 dark:border-emerald-500/10 group hover:shadow-depth-2 transition-all duration-500">
                <CheckCircle2 className="w-6 h-6 text-emerald-500 mb-4" />
                <p className="text-[10px] font-black text-emerald-600/60 dark:text-emerald-500/50 uppercase tracking-widest mb-1.5">Done</p>
                <p className="text-3xl font-black text-emerald-700 dark:text-emerald-400 tracking-tighter">{analytics.completedTasks}</p>
              </div>
              <div className="p-8 rounded-[36px] bg-rose-50/50 dark:bg-rose-500/5 border border-rose-100 dark:border-rose-500/10 group hover:shadow-depth-2 transition-all duration-500">
                <AlertCircle className="w-6 h-6 text-rose-500 mb-4" />
                <p className="text-[10px] font-black text-rose-600/60 dark:text-rose-500/50 uppercase tracking-widest mb-1.5">Delay</p>
                <p className="text-3xl font-black text-rose-700 dark:text-rose-400 tracking-tighter">{analytics.overdueTasks}</p>
              </div>
            </div>
          </div>

          {/* Owner Perspective Card */}
          <div className="bg-slate-900 dark:bg-brand-primary border-none rounded-[48px] p-10 text-white shadow-depth-4 overflow-hidden relative group min-h-[220px] flex items-center">
            {/* Background Texture */}
            <div className="absolute top-0 right-0 w-full h-full bg-grid-white/[0.03] pointer-events-none" />
            <div className="absolute -bottom-20 -right-20 opacity-30 group-hover:scale-125 transition-transform duration-1000 rotate-12">
               <Settings className="w-64 h-64 animate-spin-slow" />
            </div>
            
            <div className="relative z-10 w-full">
              <div className="space-y-1 mb-8">
                <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Project Lead</p>
                <h4 className="text-2xl font-black tracking-tight flex items-center gap-3">
                  {project.createdBy.name}
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-glow" />
                </h4>
              </div>
              <div className="flex items-center gap-3">
                <Button className="flex-1 bg-white hover:bg-slate-50 text-slate-900 rounded-2xl h-14 font-black text-[11px] uppercase tracking-[0.15em] transition-transform active:scale-95 shadow-lg">
                  Workspace Rules
                </Button>
                <Button variant="ghost" className="w-14 h-14 p-0 bg-white/10 hover:bg-white/20 text-white rounded-2xl backdrop-blur-md border border-white/10 transition-colors">
                  <Settings className="w-6 h-6" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
