'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { projectService } from '@/services/project.service';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, Cell as BarCell
} from 'recharts';
import ProjectAnalyticsChart from '@/components/project/ProjectAnalyticsChart';
import ProjectRadarChart from '@/components/project/ProjectRadarChart';
import TeamPerformanceChart from './TeamPerformanceChart';
import { workspaceService } from '@/services/workspace.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Target, 
  Zap,
  Calendar,
  User,
  Activity,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  FastForward,
  History,
  Timer,
  Info,
  Search
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import Loader from '@/components/ui/Loader';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { Button } from '@/components/ui/button';
import { FileText, Loader2, Download, Table as TableIcon } from 'lucide-react';
import { toast } from 'sonner';
import { taskService } from '@/services/task.service';
import { ExcelService, SummaryItem } from '@/services/excel.service';
import { AdvancedInsightsDrawer } from '@/components/analytics/AdvancedInsightsDrawer';
import { PhaseService } from '@/services/phase.service';
import { Sparkles, RotateCcw, Filter } from 'lucide-react';
import { StatusBadge } from '../shared/StatusBadge';
import { PriorityBadge } from '../shared/PriorityBadge';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { TaskStatus, TaskPriority } from '@/types/task';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';


interface ProjectAnalyticsTabProps {
  workspaceId: string;
  projects: any[];
  onTaskClick?: (task: any) => void;
}

const COLORS = ['#035D5B', '#10B981', '#F59E0B', '#EF4444', '#6366F1', '#8B5CF6'];
const PRIORITY_COLORS: Record<string, string> = {
  'HIGH': '#EF4444', // Chuyển High sang màu đỏ để nhấn mạnh rủi ro cao nhất hiện tại
  'MEDIUM': '#F59E0B',
  'LOW': '#10B981',
};

const STATUS_LABELS: Record<string, string> = {
  'TODO': 'Cần làm',
  'DONE': 'Hoàn thành',
  'IN_PROGRESS': 'Đang làm',
  'INREVIEW': 'Đang kiểm tra',
  'BACKLOG': 'Tồn đọng',
  'CANCELLED': 'Đã hủy'
};

const STATUS_COLORS: Record<string, string> = {
  'TODO': 'bg-slate-500',
  'DONE': 'bg-teal-500',
  'IN_PROGRESS': 'bg-blue-500',
  'INREVIEW': 'bg-purple-500',
  'BACKLOG': 'bg-amber-600',
  'CANCELLED': 'bg-red-500'
};

const TaskDeadlineCard = ({ task, type, onClick }: { task: any, type: 'overdue' | 'upcoming', onClick?: () => void }) => (
  <div 
    onClick={onClick}
    className="group p-3 rounded-[16px] bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5 hover:border-brand-primary/30 transition-all duration-300 shadow-sm hover:shadow-md cursor-pointer"
  >
    <div className="flex items-center justify-between gap-3">
      <div className="space-y-0.5 flex-1 min-w-0">
        <div className="flex items-center gap-2">
           <Badge className={cn("text-[8px] font-black uppercase px-2 py-0", 
             task.priority === 'HIGH' ? "bg-red-500" :
             task.priority === 'MEDIUM' ? "bg-amber-500" :
             "bg-slate-500"
           )}>
             {task.priority}
           </Badge>
           <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
              {STATUS_LABELS[task.status] || task.status}
           </span>
        </div>
        <h4 className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate group-hover:text-brand-primary transition-colors">
          {task.title}
        </h4>
      </div>
      <div className="shrink-0 text-right">
        <div className={cn("text-[9px] font-black italic mb-0.5", 
          type === 'overdue' ? "text-red-500" : "text-amber-500"
        )}>
           {formatDistanceToNow(new Date(task.dueDate), { addSuffix: true, locale: vi })}
        </div>
        <div className="text-[8px] text-slate-400 font-medium opacity-60">
          {new Date(task.dueDate).toLocaleDateString('vi-VN')}
        </div>
      </div>
      <ChevronRight className="w-3 h-3 text-slate-200 group-hover:text-brand-primary transition-colors" />
    </div>
  </div>
);

const PerformanceCard = ({ title, value, subtitle, icon: Icon, color }: { title: string, value: string | number, subtitle: string, icon: any, color: 'emerald' | 'red' | 'amber' }) => (
  <div className={cn(
    "p-6 rounded-[32px] border backdrop-blur-md transition-all duration-500 group relative overflow-hidden",
    color === 'emerald' ? "bg-emerald-50/50 dark:bg-emerald-500/5 border-emerald-100 dark:border-emerald-500/20" :
    color === 'red' ? "bg-red-50/50 dark:bg-red-500/5 border-red-100 dark:border-red-500/20" :
    "bg-amber-50/50 dark:bg-amber-500/5 border-amber-100 dark:border-amber-500/20"
  )}>
    <div className={cn(
      "absolute -right-4 -top-4 w-24 h-24 rounded-full blur-3xl opacity-20 transition-all duration-700 group-hover:scale-150",
      color === 'emerald' ? "bg-emerald-500" : color === 'red' ? "bg-red-500" : "bg-amber-500"
    )} />
    
    <div className="flex items-start justify-between relative z-10">
      <div className="space-y-1">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-brand-primary/80">{title}</p>
        <h3 className={cn(
          "text-3xl font-black tracking-tight",
          color === 'emerald' ? "text-emerald-600 dark:text-emerald-400" :
          color === 'red' ? "text-red-600 dark:text-red-400" :
          "text-amber-600 dark:text-amber-400"
        )}>{value}</h3>
        <p className="text-xs font-bold text-slate-500 dark:text-white/30 italic">{subtitle}</p>
      </div>
      <div className={cn(
        "w-12 h-12 rounded-2xl flex items-center justify-center border shadow-sm group-hover:rotate-12 transition-transform duration-500",
        color === 'emerald' ? "bg-white dark:bg-emerald-500/20 border-emerald-100 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400" :
        color === 'red' ? "bg-white dark:bg-red-500/20 border-red-100 dark:border-red-500/30 text-red-600 dark:text-red-400" :
        "bg-white dark:bg-amber-500/20 border-amber-100 dark:border-amber-500/30 text-amber-600 dark:text-amber-400"
      )}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
  </div>
);

export default function ProjectAnalyticsTab({ workspaceId, projects, onTaskClick }: ProjectAnalyticsTabProps) {
  const [selectedProjectId, setSelectedProjectId] = React.useState<string>("");
  const [isExporting, setIsExporting] = React.useState(false);
  const [isExportingExcel, setIsExportingExcel] = React.useState(false);
  const [isInsightsOpen, setIsInsightsOpen] = React.useState(false);

  React.useEffect(() => {
    if (projects && projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0]._id);
    }
  }, [projects, selectedProjectId]);

  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['projectAnalytics', workspaceId, selectedProjectId],
    queryFn: () => projectService.getProjectAnalytics(workspaceId as string, selectedProjectId as string),
    enabled: !!workspaceId && !!selectedProjectId,
  });

  const { data: membersData } = useQuery({
    queryKey: ['workspace-members', workspaceId, selectedProjectId],
    queryFn: () => workspaceService.getMembers(workspaceId, selectedProjectId),
    enabled: !!workspaceId && !!selectedProjectId,
  });

  const { data: phasesData, isLoading: phasesLoading } = useQuery({
    queryKey: ['project-phases', selectedProjectId],
    queryFn: () => PhaseService.getPhases(selectedProjectId as string).then(res => {
      if (Array.isArray(res)) return res;
      if (res && Array.isArray(res.data)) return res.data;
      return [];
    }),
    enabled: !!selectedProjectId,
  });

  const { data: historyData } = useQuery({
    queryKey: ['projectAnalyticsHistory', workspaceId, selectedProjectId],
    queryFn: () => projectService.getProjectAnalyticsHistory(workspaceId as string, selectedProjectId as string),
    enabled: !!workspaceId && !!selectedProjectId,
  });

  interface TaskFilters {
    status: string;
    priority: string;
    tag: string;
    member: string;
    phase: string;
  }

  const [searchTerm, setSearchTerm] = React.useState('');
  const [taskFilters, setTaskFilters] = React.useState<TaskFilters>({
    status: 'ALL',
    priority: 'ALL',
    tag: 'ALL',
    member: 'ALL',
    phase: 'ALL'
  });

  const { data: explorerTasksData, isLoading: explorerTasksLoading } = useQuery({
    queryKey: ['projectTasksExplorer', workspaceId, selectedProjectId],
    queryFn: () => taskService.getProjectTasks(workspaceId, selectedProjectId, { pageSize: 500 }),
    enabled: !!workspaceId && !!selectedProjectId
  });

  const filteredTasks = React.useMemo(() => {
    return explorerTasksData?.tasks?.filter((task: any) => {
      if (searchTerm && !task.title?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      if (taskFilters.status !== 'ALL' && task.status !== taskFilters.status) return false;
      if (taskFilters.priority !== 'ALL' && task.priority !== taskFilters.priority) return false;
      if (taskFilters.tag !== 'ALL' && !task.tags?.some((t: any) => t.name === taskFilters.tag)) return false;
      if (taskFilters.member !== 'ALL' && !task.assignedTo?.some((u: any) => {
        const userId = typeof u === 'object' ? (u._id || u.id) : u;
        return String(userId) === String(taskFilters.member);
      })) return false;
      
      if (taskFilters.phase !== 'ALL') {
        const tPhase = task.phaseId;
        const taskPhaseId = tPhase ? (typeof tPhase === 'object' ? (tPhase._id || tPhase.id) : tPhase) : null;
        if (String(taskPhaseId || '') !== String(taskFilters.phase)) return false;
      }
      
      return true;
    }) || [];
  }, [explorerTasksData, taskFilters, searchTerm]);

  // Memoize selected item info for Filter UI labels
  const selectedMemberInfo = React.useMemo(() => {
    if (taskFilters.member === 'ALL') return null;
    return membersData?.members?.find((m: any) => {
      const user = m.userId || m;
      const id = user._id || m._id || m;
      return id === taskFilters.member;
    });
  }, [membersData, taskFilters.member]);

  const selectedPhaseInfo = React.useMemo(() => {
    if (taskFilters.phase === 'ALL') return null;
    const phases = Array.isArray(phasesData) ? phasesData : [];
    return phases.find((p: any) => (p._id || p.id) === taskFilters.phase);
  }, [phasesData, taskFilters.phase]);


  const handleResetFilters = () => {
    setSearchTerm('');
    setTaskFilters({
      status: 'ALL',
      priority: 'ALL',
      tag: 'ALL',
      member: 'ALL',
      phase: 'ALL'
    });
  };

  if (analyticsLoading) {
    return <div className="flex justify-center py-20"><Loader /></div>;
  }

  if (!projects || projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-slate-50/10 dark:bg-white/5 rounded-[40px] border-2 border-dashed border-slate-200 dark:border-white/10">
        <Target className="w-12 h-12 text-slate-300 mb-4" />
        <h3 className="text-xl font-bold text-slate-900 dark:text-white">Chưa có dự án nào</h3>
        <p className="text-slate-500 text-sm">Hãy tạo dự án trước khi xem phân tích chi tiết.</p>
      </div>
    );
  }

  const handleExportExcel = async () => {
    const project = projects.find(p => p._id === selectedProjectId);
    if (!project) return;
    setIsExportingExcel(true);
    try {
      const response = await taskService.getProjectTasks(workspaceId, selectedProjectId, { pageSize: 1000 });
      const tasks = response.tasks;

      // Tính toán các thông tin Dashboard
      const now = new Date();
      const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      
      const totalTasks = tasks.length;
      const doneTasks = tasks.filter((t: any) => t.status === 'DONE').length;
      const completionRate = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
      
      const overdueTasks = tasks.filter((t: any) => 
        t.status !== 'DONE' && t.dueDate && new Date(t.dueDate) < now
      );
      
      const upcomingTasks = tasks.filter((t: any) => 
        t.status !== 'DONE' && t.dueDate && new Date(t.dueDate) >= now && new Date(t.dueDate) <= nextWeek
      );

      // Xác định hiệu suất dựa trên tỷ lệ hoàn thành
      let performanceLabel = 'Trung bình';
      let performanceColor = 'FF718096'; // Gray
      if (completionRate >= 80) {
        performanceLabel = 'Xuất sắc';
        performanceColor = 'FF38A169'; // Green
      } else if (completionRate >= 50) {
        performanceLabel = 'Tốt';
        performanceColor = 'FF3182CE'; // Blue
      } else if (completionRate < 30 && totalTasks > 5) {
        performanceLabel = 'Cần cải thiện';
        performanceColor = 'FFE53E3E'; // Red
      }

      const summary: SummaryItem[] = [
        { label: 'Tỷ lệ hoàn thành', value: `${completionRate}%`, color: completionRate > 70 ? 'FF38A169' : 'FFDD6B20' },
        { label: 'Hiệu suất dự án', value: performanceLabel, color: performanceColor },
        { label: 'Tổng số Task', value: totalTasks },
        { label: 'Task đã hoàn thành', value: doneTasks },
        { label: 'Task quá hạn (Số lượng)', value: overdueTasks.length, color: overdueTasks.length > 0 ? 'FFE53E3E' : 'FF38A169' },
        { label: 'Task sắp hết hạn (7 ngày tới)', value: upcomingTasks.length, color: upcomingTasks.length > 0 ? 'FFD69E2E' : 'FF38A169' },
      ];

      // Nếu có task quá hạn, thêm thông tin chi tiết vào summary
      if (overdueTasks.length > 0) {
        summary.push({ label: '---', value: '---' }); // Spacer
        summary.push({ label: 'CẢNH BÁO QUÁ HẠN', value: `Có ${overdueTasks.length} task trễ hạn!`, color: 'FFE53E3E' });
        
        overdueTasks.slice(0, 5).forEach((t: any) => {
          const delayDays = Math.floor((now.getTime() - new Date(t.dueDate).getTime()) / (1000 * 60 * 60 * 24));
          summary.push({ label: `! ${t.title}`, value: `Trễ ${delayDays} ngày`, color: 'FFE53E3E' });
        });
        
        if (overdueTasks.length > 5) {
          summary.push({ label: '...', value: `Và ${overdueTasks.length - 5} task khác` });
        }
      }

      // Sắp xếp task theo Giai đoạn (Phase) để các task cùng phase nằm cạnh nhau
      const sortedTasks = [...tasks].sort((a: any, b: any) => {
        const phaseA = a.phaseId?.name || 'Z_NONE'; 
        const phaseB = b.phaseId?.name || 'Z_NONE';
        return phaseA.localeCompare(phaseB);
      });
      
      const columns = [
        { header: 'Giai đoạn', key: 'phase', width: 25 },
        { header: 'Mã Task', key: 'taskCode', width: 15 },
        { header: 'Tên công việc', key: 'title', width: 45 },
        { header: 'Trạng thái', key: 'status', width: 18 },
        { header: 'Mức ưu tiên', key: 'priority', width: 15 },
        { header: 'Ngày bắt đầu', key: 'startDate', width: 15 },
        { header: 'Hạn chót', key: 'dueDate', width: 15 },
        { header: 'Người thực hiện', key: 'assignees', width: 35 },
      ];

      const data = sortedTasks.map((t: any) => ({
        phase: t.phaseId?.name || '---',
        taskCode: t.taskCode,
        title: t.title,
        status: STATUS_LABELS[t.status] || t.status,
        priority: t.priority,
        startDate: t.startDate ? new Date(t.startDate).toLocaleDateString('vi-VN') : '',
        dueDate: t.dueDate ? new Date(t.dueDate).toLocaleDateString('vi-VN') : '',
        assignees: t.assignedTo?.map((u: any) => u.name).join(', ') || 'Chưa gán',
      }));

      await ExcelService.exportToExcel({
        filename: `Project_${project.name}_Tasks`,
        sheetName: 'Danh sách công việc',
        columns,
        data,
        title: `BÁO CÁO CÔNG VIỆC DỰ ÁN: ${project.name.toUpperCase()}`,
        summary
      });

      toast.success('Xuất file Excel cao cấp thành công');
    } catch (error) {
      console.error(error);
      toast.error('Lỗi khi xuất file Excel');
    } finally {
      setIsExportingExcel(false);
    }
  };

  const handleExportPDF = async () => {
    const project = projects.find(p => p._id === selectedProjectId);
    if (!project) return;
    setIsExporting(true);
    
    const element = document.getElementById('project-analytics-tab-export');
    if (!element) {
      setIsExporting(false);
      return;
    }

    const originalWidth = element.style.width;
    const originalHeight = element.style.height;

    // Expand scrollable areas for full capture
    const originalStyles = new Map();
    const scrollAreas = element.querySelectorAll('.overflow-y-auto, .overflow-hidden, .min-h-0');
    scrollAreas.forEach((node) => {
      const el = node as HTMLElement;
      originalStyles.set(el, {
        overflow: el.style.overflow,
        overflowY: el.style.overflowY,
        maxHeight: el.style.maxHeight,
        height: el.style.height,
        minHeight: el.style.minHeight
      });
      el.style.overflow = 'visible';
      el.style.overflowY = 'visible';
      el.style.maxHeight = 'none';
      el.style.height = 'auto';
      el.style.minHeight = 'auto';
    });

    // Bulletproof layout fix for html-to-image
    element.style.width = '1200px';
    element.style.height = 'auto'; // Let it expand naturally now that scrollbars are removed

    try {
      await new Promise(resolve => setTimeout(resolve, 300)); // Allow DOM to fully re-render and expand

      const imgData = await toPng(element, { 
        cacheBust: true, 
        pixelRatio: 2,
        backgroundColor: '#ffffff', // Ensure white background
        width: 1200,
        style: {
          margin: '0',
          padding: '24px', // Add padding for the screenshot
        }
      });

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      const imgProps = pdf.getImageProperties(imgData);
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      let heightLeft = pdfHeight;
      let position = 0;

      // Trang đầu tiên
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= pageHeight;

      // Tạo thêm trang nếu nội dung còn dài hơn 1 trang A4
      while (heightLeft > 0) {
        position = heightLeft - pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`Project_${project.name}_Dashboard.pdf`);
      toast.success('Xuất báo cáo PDF thành công');
    } catch (error) {
      console.error('PDF Export Error:', error);
      toast.error('Lỗi khi xuất báo cáo PDF');
    } finally {
      // Revert to original styles
      element.style.width = originalWidth;
      element.style.height = originalHeight;
      
      // Revert scroll areas
      scrollAreas.forEach((node) => {
        const el = node as HTMLElement;
        const styles = originalStyles.get(el);
        if (styles) {
          el.style.overflow = styles.overflow;
          el.style.overflowY = styles.overflowY;
          el.style.maxHeight = styles.maxHeight;
          el.style.height = styles.height;
          el.style.minHeight = styles.minHeight;
        }
      });
      
      setIsExporting(false);
    }
  };

  const statusData = Array.isArray(analytics?.statusDistribution)
    ? analytics.statusDistribution.map((item: any) => ({
        name: STATUS_LABELS[item.status] || item.status,
        value: item.count
      }))
    : [];

  const priorityData = Array.isArray(analytics?.priorityDistribution)
    ? analytics.priorityDistribution.map((item: any) => ({
        name: item.priority,
        count: item.count,
        fill: PRIORITY_COLORS[item.priority] || '#94a3b8'
      }))
    : [];

  return (
    <>
      <div id="project-analytics-tab-export" className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 bg-transparent dark:bg-transparent">
      {/* Selector Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white/40 dark:bg-white/5 backdrop-blur-xl p-8 rounded-[32px] border border-white dark:border-white/10 shadow-ambient">
        <div className="space-y-1">
          <h2 className="text-2xl font-black text-[#035D5B] dark:text-[#C7F964] tracking-tight uppercase">Điểm tin dự án</h2>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Chọn một dự án để xem hiệu suất chi tiết và rủi ro tiềm ẩn.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <Select value={selectedProjectId} onValueChange={(val) => setSelectedProjectId(val || '')}>
          <SelectTrigger className="w-full md:w-[300px] h-12 rounded-2xl bg-white dark:bg-card border-slate-200 dark:border-white/10 font-bold text-[#035D5B] dark:text-[#E5F4EF]">
            <SelectValue placeholder="Chọn dự án">
              {projects.find(p => p._id === selectedProjectId) ? (
                <div className="flex items-center gap-2">
                  <span>{projects.find(p => p._id === selectedProjectId)?.emoji || '📁'}</span>
                  <span>{projects.find(p => p._id === selectedProjectId)?.name}</span>
                </div>
              ) : "Chọn dự án"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="rounded-2xl border-none shadow-2xl dark:bg-[#1C2322]">
            {projects.map((project) => (
              <SelectItem key={project._id} value={project._id} className="rounded-xl py-3 font-bold text-slate-600 dark:text-slate-300 focus:bg-teal-50 dark:focus:bg-teal-900/30">
                <div className="flex items-center gap-2">
                  <span>{project.emoji || '📁'}</span>
                  <span>{project.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button 
          variant="outline" 
          onClick={handleExportExcel}
          disabled={isExportingExcel}
          className="h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 border-emerald-200/60 dark:border-emerald-500/20 shadow-sm whitespace-nowrap text-emerald-600 dark:text-emerald-400"
        >
          {isExportingExcel ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Table className="w-4 h-4 mr-2" />}
          <span className="font-bold">Xuất Excel</span>
        </Button>

        <Button 
          variant="outline" 
          onClick={handleExportPDF}
          disabled={isExporting}
          className="h-12 rounded-2xl bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 border-slate-200/60 dark:border-white/10 shadow-sm whitespace-nowrap"
        >
          {isExporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2 text-rose-500" />}
          <span className="font-bold text-slate-700 dark:text-slate-200">Xuất PDF</span>
        </Button>

        <Button 
          onClick={() => setIsInsightsOpen(true)}
          disabled={!selectedProjectId}
          className="h-12 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-glow border-none transition-all duration-300 group whitespace-nowrap px-6"
        >
          <Sparkles className="w-5 h-5 mr-2 text-yellow-300 group-hover:animate-pulse" />
          <span className="font-black tracking-wide">Phân tích AI</span>
        </Button>
        </div>
      </div>

      {analyticsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-32 rounded-[24px] bg-slate-100 dark:bg-white/5 animate-pulse" />)}
        </div>
      ) : (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard 
              label="Tỷ lệ hoàn thành" 
              value={`${Number(analytics?.completionRate || 0).toFixed(1)}%`} 
              icon={Target} 
              color="text-brand-primary"
              subValue={`${analytics?.completedTasks || 0}/${analytics?.totalTasks || 0} công việc`}
              tooltip="Phần trăm tổng khối lượng công việc đã được hoàn thành trong dự án."
            />
            <MetricCard 
              label="Đang xử lý" 
              value={analytics?.inProgressTasks || 0} 
              icon={Clock} 
              color="text-amber-500"
              subValue="Cần sự tập trung cao"
              tooltip="Các công việc đang được triển khai hoặc trong giai đoạn kiểm tra chất lượng."
            />
            <MetricCard 
              label="Quá hạn" 
              value={analytics?.overdueTasks || 0} 
              icon={AlertCircle} 
              color="text-red-500"
              subValue="Rủi ro tiến độ"
              tooltip="Số lượng các đầu việc đã quá ngày hạn định nhưng vẫn chưa hoàn thành."
            />
            <MetricCard 
              label="Chưa phân công" 
              value={analytics?.unassignedTasks || 0} 
              icon={User} 
              color="text-slate-500"
              subValue="Cần được điều phối"
              tooltip="Các công việc chưa được giao cho bất kỳ thành viên nào chịu trách nhiệm."
            />
          </div>

          {/* Performance Insight Section - New AI-Added */}
          {analytics?.deadlinePerformance && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-top-4 duration-1000 delay-300">
               <PerformanceCard 
                 title="Tiết kiệm thời gian"
                 value={`${analytics.deadlinePerformance.totalEarlyHours}h`}
                 subtitle={`Từ ${analytics.deadlinePerformance.earlyTasksCount} công việc xong sớm`}
                 icon={FastForward}
                 color="emerald"
               />
               <PerformanceCard 
                 title="Tổng thời gian trễ"
                 value={`${analytics.deadlinePerformance.totalLateHours}h`}
                 subtitle={`Của ${analytics.deadlinePerformance.lateTasksCount} công việc vượt hạn`}
                 icon={History}
                 color="red"
               />
               <PerformanceCard 
                 title="Độ trễ hiện hữu"
                 value={`${analytics.deadlinePerformance.totalOngoingLateHours}h`}
                 subtitle="Tổng thời gian trễ của các việc chưa xong"
                 icon={Timer}
                 color="amber"
               />
            </div>
          )}

          {/* Row 1: History Trend Chart - Full Width */}
          <div className="w-full">
            <ProjectAnalyticsChart data={historyData || []} />
          </div>

          {/* Row 2: Secondary Insights (Distributed Grid) */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {/* 1. Status Distribution */}
            <Card className="rounded-[32px] border-white/40 dark:border-white/5 bg-white/40 dark:bg-card/40 backdrop-blur-md shadow-ambient overflow-hidden hover:border-brand-primary/20 transition-all">
              <CardHeader className="pb-2">
                <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-brand-primary/80">Trạng thái công việc</CardTitle>
              </CardHeader>
              <CardContent className="p-4 flex flex-col gap-4">
                {/* Chart 1: Doughnut for Counts - Shrinked for better vertical space */}
                <div className="relative h-[160px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={60}
                        paddingAngle={5}
                        cornerRadius={6}
                        dataKey="value"
                      >
                        {statusData.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip 
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '10px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  
                  {/* Central Indicator */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pt-1">
                    <span className="text-[18px] font-black text-brand-primary leading-none">
                      {Number(analytics?.completionRate || 0).toFixed(0)}%
                    </span>
                    <span className="text-[7px] font-black text-slate-400 uppercase tracking-tighter">Xong</span>
                  </div>
                </div>

                {/* Chart 2: Stacked Horizontal Progress for Percentage */}
                <div className="space-y-3 px-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Phân bổ tỷ lệ %</span>
                    <span className="text-[9px] font-bold text-brand-primary">Tổng {analytics?.totalTasks || 0} việc</span>
                  </div>
                  
                  {/* Custom Progress Bar */}
                  <div className="h-3 w-full bg-slate-100 dark:bg-white/5 rounded-full flex overflow-hidden">
                    {statusData.map((item: any, index: number) => {
                      const percentage = analytics?.totalTasks > 0 
                        ? (item.value / analytics.totalTasks) * 100 
                        : 0;
                      if (percentage === 0) return null;
                      
                      return (
                        <div 
                          key={`progress-${index}`}
                          style={{ 
                            width: `${percentage}%`,
                            backgroundColor: COLORS[index % COLORS.length]
                          }}
                          className="h-full transition-all duration-1000 relative group"
                        >
                          {/* Tooltip on hover */}
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-20">
                            <div className="bg-slate-800 text-white text-[9px] py-1 px-2 rounded-lg whitespace-nowrap font-bold">
                              {item.name}: {percentage.toFixed(1)}%
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Legend with percentages */}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 pt-2">
                    {statusData.map((item: any, index: number) => {
                      const percentage = analytics?.totalTasks > 0 
                        ? (item.value / analytics.totalTasks) * 100 
                        : 0;
                      return (
                        <div key={`legend-detail-${index}`} className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                          <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 truncate">{item.name}</span>
                          <span className="text-[9px] font-black text-slate-400 ml-auto">{percentage.toFixed(0)}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 2. Priority Distribution */}
            <Card className="rounded-[32px] border-white/40 dark:border-white/5 bg-white/40 dark:bg-card/40 backdrop-blur-md shadow-ambient overflow-hidden hover:border-brand-primary/20 transition-all">
              <CardHeader className="pb-2">
                <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-brand-primary/80">Mức độ ưu tiên</CardTitle>
              </CardHeader>
              <CardContent className="p-4 flex flex-col gap-4">
                {/* Chart 1: Doughnut for Counts */}
                <div className="relative h-[160px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={priorityData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={60}
                        paddingAngle={5}
                        cornerRadius={6}
                        dataKey="count"
                      >
                        {priorityData.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <RechartsTooltip 
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '10px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  
                  {/* Central Icon Indicator */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pt-1">
                    <Zap className={cn(
                      "w-6 h-6 mb-0.5 animate-pulse",
                      priorityData.find((p: any) => p.name === 'HIGH' && p.count > 0) ? "text-red-500" : "text-amber-500"
                    )} />
                    <span className="text-[7px] font-black text-slate-400 uppercase tracking-tighter">Ưu tiên</span>
                  </div>
                </div>

                {/* Chart 2: Stacked Horizontal Progress for Percentage */}
                <div className="space-y-3 px-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Trọng số rủi ro</span>
                    <Badge variant="outline" className="text-[8px] font-black bg-red-50 dark:bg-red-500/10 text-red-500 border-red-100 dark:border-red-500/20 px-1.5 py-0 h-4">
                      {priorityData.find((p: any) => p.name === 'HIGH')?.count || 0} QUAN TRỌNG
                    </Badge>
                  </div>
                  
                  {/* Custom Progress Bar */}
                  <div className="h-3 w-full bg-slate-100 dark:bg-white/5 rounded-full flex overflow-hidden">
                    {priorityData.map((item: any, index: number) => {
                      const percentage = analytics?.totalTasks > 0 
                        ? (item.count / analytics.totalTasks) * 100 
                        : 0;
                      if (percentage === 0) return null;
                      
                      return (
                        <div 
                          key={`priority-progress-${index}`}
                          style={{ 
                            width: `${percentage}%`,
                            backgroundColor: item.fill
                          }}
                          className="h-full transition-all duration-1000 relative group"
                        >
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-20">
                            <div className="bg-slate-800 text-white text-[9px] py-1 px-2 rounded-lg whitespace-nowrap font-bold">
                              {item.name}: {percentage.toFixed(1)}%
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Legend Grid */}
                  <div className="grid grid-cols-2 gap-x-3 gap-y-2 pt-1">
                    {priorityData.map((item: any, index: number) => {
                      const percentage = analytics?.totalTasks > 0 
                        ? (item.count / analytics.totalTasks) * 100 
                        : 0;
                      return (
                        <div key={`priority-legend-${index}`} className="flex items-center gap-2 bg-slate-50/50 dark:bg-white/5 p-1.5 rounded-xl border border-slate-100 dark:border-white/5">
                          <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: item.fill }} />
                          <span className="text-[8px] font-bold text-slate-500 dark:text-slate-400 truncate">{item.name}</span>
                          <span className="text-[8px] font-black text-slate-400 ml-auto">{percentage.toFixed(0)}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 3. Radar Chart for Tags */}
            <ProjectRadarChart 
              title="Phân loại công việc" 
              data={analytics?.tagDistribution?.map((t: any) => ({ name: t.tag, count: t.count })) || []} 
              color="#035D5B"
              fill="#10B981"
            />

            {/* 4. Radar Chart for Member Workload */}
            <ProjectRadarChart 
              title="Tải công việc thành viên" 
              data={analytics?.memberDistribution || []} 
              color="#6366F1"
              fill="#8B5CF6"
            />
          </div>

          {/* Row 2.5: Task Explorer (Filter & Table) */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="my-10 bg-white dark:bg-slate-900/40 backdrop-blur-2xl border border-slate-100 dark:border-white/5 rounded-[40px] p-8 shadow-xl shadow-slate-200/20 dark:shadow-none relative overflow-hidden"
          >
             {/* Decorative Background Element */}
             <div className="absolute -top-24 -right-24 w-64 h-64 bg-teal-500/5 rounded-full blur-[100px]" />

             <div className="relative z-10 space-y-8">
                {/* Header with Title and Quick Search */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-teal-500/10 flex items-center justify-center text-teal-600 dark:text-teal-400">
                        <Search className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">Trình khám phá công việc</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Tra cứu và lọc chi tiết các tác vụ của dự án</p>
                      </div>
                   </div>

                   <div className="flex items-center gap-3">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={handleResetFilters}
                        className="h-10 px-4 rounded-2xl border-slate-100 dark:border-white/10 text-slate-500 hover:text-teal-600 hover:bg-teal-50 transition-all gap-2"
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span className="text-xs font-bold">Đặt lại</span>
                      </Button>
                      
                      <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-teal-500 transition-colors" />
                        <input 
                          type="text" 
                          placeholder="Tìm nhanh tên công việc..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-2xl py-2.5 pl-10 pr-4 text-sm w-full lg:w-72 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition-all"
                        />
                      </div>
                   </div>
                </div>

                {/* Horizontal Filter Bar */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 p-5 bg-slate-50/50 dark:bg-white/5 rounded-[28px] border border-slate-100 dark:border-white/5">
                   {/* Status */}
                   <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Trạng thái</label>
                      <Select value={taskFilters.status} onValueChange={(v: string | null) => setTaskFilters(prev => ({...prev, status: v || 'ALL'}))}>
                        <SelectTrigger className="bg-white dark:bg-slate-900/50 border-none shadow-sm rounded-xl h-10 text-xs font-bold">
                          <SelectValue placeholder="Trạng thái">
                            {taskFilters.status === 'ALL' ? "Tất cả trạng thái" : (STATUS_LABELS[taskFilters.status] || taskFilters.status)}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-slate-100 dark:border-white/10">
                          <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
                          <SelectItem value="TODO">Cần làm</SelectItem>
                          <SelectItem value="IN_PROGRESS">Đang làm</SelectItem>
                          <SelectItem value="INREVIEW">Đang kiểm tra</SelectItem>
                          <SelectItem value="DONE">Hoàn thành</SelectItem>
                        </SelectContent>
                      </Select>
                   </div>

                   {/* Phase */}
                   <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Giai đoạn</label>
                      <Select value={taskFilters.phase} onValueChange={(v: string | null) => setTaskFilters(prev => ({...prev, phase: v || 'ALL'}))}>
                        <SelectTrigger className="bg-white dark:bg-slate-900/50 border-none shadow-sm rounded-xl h-10 text-xs font-bold">
                          <SelectValue placeholder="Giai đoạn">
                            {selectedPhaseInfo ? selectedPhaseInfo.name : "Tất cả giai đoạn"}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-slate-100 dark:border-white/10">
                          <SelectItem value="ALL">Tất cả giai đoạn</SelectItem>
                          {phasesLoading ? (
                            <div className="p-2 text-center text-[10px] text-slate-400 italic">Đang tải...</div>
                          ) : Array.isArray(phasesData) && phasesData.length > 0 ? (
                            phasesData.map((p: any) => (
                              <SelectItem key={p._id || p.id} value={p._id || p.id}>{p.name}</SelectItem>
                            ))
                          ) : (
                            <div className="p-2 text-center text-[10px] text-slate-400 italic">Không có giai đoạn</div>
                          )}
                        </SelectContent>
                      </Select>
                   </div>

                   {/* Priority */}
                   <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Mức ưu tiên</label>
                      <Select value={taskFilters.priority} onValueChange={(v: string | null) => setTaskFilters(prev => ({...prev, priority: v || 'ALL'}))}>
                        <SelectTrigger className="bg-white dark:bg-slate-900/50 border-none shadow-sm rounded-xl h-10 text-xs font-bold">
                          <SelectValue placeholder="Mức ưu tiên">
                            {taskFilters.priority === 'ALL' ? "Tất cả mức độ" : taskFilters.priority}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-slate-100 dark:border-white/10">
                          <SelectItem value="ALL">Tất cả mức độ</SelectItem>
                          {Object.entries(TaskPriority).map(([key, value]) => (
                            <SelectItem key={key} value={value}>{value}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                   </div>

                   {/* Tag */}
                   <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Phân loại</label>
                      <Select value={taskFilters.tag} onValueChange={(v: string | null) => setTaskFilters(prev => ({...prev, tag: v || 'ALL'}))}>
                        <SelectTrigger className="bg-white dark:bg-slate-900/50 border-none shadow-sm rounded-xl h-10 text-xs font-bold">
                          <SelectValue placeholder="Phân loại">
                            {taskFilters.tag === 'ALL' ? "Tất cả nhãn" : taskFilters.tag}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-slate-100 dark:border-white/10">
                          <SelectItem value="ALL">Tất cả nhãn</SelectItem>
                          {analytics?.tagDistribution?.map((t: any) => (
                            <SelectItem key={t.tag} value={t.tag}>{t.tag}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                   </div>

                   {/* Member */}
                   <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Thành viên</label>
                      <Select value={taskFilters.member} onValueChange={(v: string | null) => setTaskFilters(prev => ({...prev, member: v || 'ALL'}))}>
                        <SelectTrigger className="bg-white dark:bg-slate-900/50 border-none shadow-sm rounded-xl h-10 text-xs font-bold">
                          <SelectValue placeholder="Thành viên">
                             {selectedMemberInfo ? (
                               <div className="flex items-center gap-2">
                                 <Avatar className="w-5 h-5">
                                   <AvatarImage src={selectedMemberInfo.userId?.avatar || selectedMemberInfo.userId?.profilePicture || selectedMemberInfo.avatar} />
                                   <AvatarFallback className="text-[7px] font-black bg-teal-50 text-teal-600">
                                     {(selectedMemberInfo.userId?.fullName || selectedMemberInfo.userId?.name || "U").substring(0,2).toUpperCase()}
                                   </AvatarFallback>
                                 </Avatar>
                                 <span className="truncate max-w-[80px]">
                                   {selectedMemberInfo.userId?.fullName || selectedMemberInfo.userId?.name || "Thành viên"}
                                 </span>
                               </div>
                             ) : "Tất cả thành viên"}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-slate-100 dark:border-white/10">
                          <SelectItem value="ALL">Tất cả thành viên</SelectItem>
                          {membersData?.members?.map((m: any) => {
                             const user = m.userId || m;
                             const id = String(user._id || m._id || m);
                             const name = user.fullName || user.name || user.email || m.email || "Unknown";
                             return (
                               <SelectItem key={id} value={id}>
                                 <div className="flex items-center gap-2">
                                   <Avatar className="w-5 h-5">
                                     <AvatarImage src={user.avatar || user.profilePicture} />
                                     <AvatarFallback className="text-[7px] font-black">
                                       {name.substring(0,2).toUpperCase()}
                                     </AvatarFallback>
                                   </Avatar>
                                   {name}
                                 </div>
                               </SelectItem>
                             );
                          })}
                        </SelectContent>
                      </Select>
                   </div>
                </div>

                {/* Task Table Container */}
                <div className="bg-white dark:bg-slate-900/40 dark:backdrop-blur-xl border border-slate-100/80 dark:border-white/5 rounded-[32px] overflow-hidden shadow-sm">
                   <div className="max-h-[460px] overflow-y-auto custom-scrollbar">
                      <Table>
                         <TableHeader className="bg-slate-50/80 dark:bg-white/5 sticky top-0 z-20 backdrop-blur-md">
                            <TableRow className="hover:bg-transparent border-none">
                               <TableHead className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tên công việc</TableHead>
                               <TableHead className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Giai đoạn</TableHead>
                               <TableHead className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Trạng thái</TableHead>
                               <TableHead className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Ưu tiên</TableHead>
                               <TableHead className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Người thực hiện</TableHead>
                            </TableRow>
                         </TableHeader>
                         <TableBody>
                            {explorerTasksLoading ? (
                               <TableRow><TableCell colSpan={5} className="text-center py-24 text-slate-400 italic">Đang tải dữ liệu...</TableCell></TableRow>
                            ) : filteredTasks.length > 0 ? (
                               filteredTasks.map((task: any) => (
                                  <TableRow 
                                    key={task._id} 
                                    className="group hover:bg-slate-50/50 dark:hover:bg-white/5 border-slate-100 dark:border-white/5 transition-all duration-200 cursor-pointer" 
                                    onClick={() => onTaskClick?.(task)}
                                  >
                                     <TableCell className="px-6 py-5">
                                        <div className="space-y-1.5">
                                           <div className="font-bold text-sm text-slate-700 dark:text-slate-200 group-hover:text-teal-600 transition-colors">
                                              {task.title}
                                           </div>
                                           <div className="flex flex-wrap gap-1.5">
                                              {task.tags?.map((tag: any) => (
                                                 <span key={tag._id || tag} className="text-[9px] bg-slate-100 dark:bg-white/10 px-2 py-0.5 rounded-md text-slate-500 font-bold uppercase tracking-tight">
                                                    #{tag.name || tag}
                                                 </span>
                                              ))}
                                           </div>
                                        </div>
                                     </TableCell>
                                     <TableCell className="text-center">
                                        {task.phaseId ? (
                                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-teal-50/50 dark:bg-teal-500/5 border border-teal-100/50 dark:border-teal-500/20">
                                            <div className="w-1.5 h-1.5 rounded-full bg-teal-500 shadow-[0_0_8px_rgba(20,184,166,0.4)]" />
                                            <span className="text-[10px] font-bold text-teal-700 dark:text-teal-400 tracking-tight">
                                              {typeof task.phaseId === 'object' ? task.phaseId.name : task.phaseId}
                                            </span>
                                          </div>
                                        ) : (
                                          <span className="text-[10px] text-slate-400 font-medium italic opacity-60">---</span>
                                        )}
                                      </TableCell>
                                      <TableCell className="px-6 py-4">
                                         <div className="flex items-center justify-center">
                                            <StatusBadge status={task.status as any} />
                                         </div>
                                      </TableCell>
                                     <TableCell className="px-6 py-5 text-center"><PriorityBadge priority={task.priority as any} /></TableCell>
                                     <TableCell className="px-6 py-5">
                                        <div className="flex justify-end -space-x-2">
                                           {task.assignedTo?.map((u: any) => (
                                              <Avatar key={u._id} className="w-7 h-7 border-2 border-white dark:border-slate-950 shadow-sm hover:z-10 transition-all">
                                                 <AvatarImage src={u.avatar || u.profilePicture} />
                                                 <AvatarFallback className="text-[8px] font-black bg-teal-50 text-teal-600">
                                                   {(u.fullName || u.name || "U").substring(0,2).toUpperCase()}
                                                 </AvatarFallback>
                                              </Avatar>
                                           ))}
                                        </div>
                                     </TableCell>
                                  </TableRow>
                               ))
                            ) : (
                               <TableRow>
                                  <TableCell colSpan={5} className="px-6 py-24 text-center">
                                     <div className="flex flex-col items-center gap-3">
                                        <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-white/5 flex items-center justify-center">
                                           <Search className="w-6 h-6 text-slate-200" />
                                        </div>
                                        <p className="text-slate-400 italic text-sm">Không tìm thấy công việc nào phù hợp với bộ lọc hiện tại</p>
                                     </div>
                                  </TableCell>
                               </TableRow>
                            )}
                         </TableBody>
                      </Table>
                   </div>
                </div>

                {/* Explorer Footer */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-white/5">
                   <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                         Hiển thị <span className="text-slate-800 dark:text-white">{filteredTasks.length}</span> kết quả công việc
                      </span>
                   </div>
                   
                   <div className="flex items-center gap-6">
                      <div className="h-4 w-[1px] bg-slate-200 dark:bg-white/10 hidden sm:block" />
                      <Button 
                        variant="ghost" 
                        className="text-[10px] font-black text-teal-500 uppercase tracking-widest hover:text-teal-600 hover:bg-teal-500/5 px-4 rounded-xl gap-2 h-9 transition-all"
                      >
                         Xem chi tiết báo cáo
                         <ChevronRight className="w-4 h-4" />
                      </Button>
                   </div>
                </div>
             </div>
          </motion.div>

          {/* Row 3: Detail Insights (8-4 Layout) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Left Column (8 cols) - Team Heatmap */}
            <div className="lg:col-span-8 space-y-10">

              {/* Team Performance Heatmap/Distribution */}
              <div className="lg:col-span-8">
                 <TeamPerformanceChart members={membersData?.members || []} />
              </div>



            </div>

            {/* Right Column (4 cols) - Task Deadlines (Overdue & Upcoming) */}
            <div className="lg:col-span-4 h-full">
              <div className="h-full relative bg-white/40 dark:bg-card/40 backdrop-blur-md rounded-[40px] border border-white/40 dark:border-white/5 p-8 flex flex-col shadow-ambient">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-black text-[#035D5B] dark:text-[#C7F964] uppercase tracking-tight flex items-center gap-2">
                     <Calendar className="w-5 h-5" />
                     Hạn task
                  </h3>
                </div>

                <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                  {/* 1. Hết hạn Section */}
                  <div className="flex-1 flex flex-col min-h-0 pb-6">
                     <div className="flex items-center gap-2 mb-4 shrink-0">
                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                        <span className="text-[11px] font-black uppercase tracking-[0.2em] text-red-500/80">Hết hạn</span>
                     </div>
                     <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
                        {analytics?.overdueTasksList?.length > 0 ? (
                          analytics.overdueTasksList.map((task: any) => (
                            <TaskDeadlineCard 
                              key={task._id} 
                              task={task} 
                              type="overdue" 
                              onClick={() => {
                                const pId = typeof task.projectId === 'object' ? task.projectId?._id : (task.projectId || selectedProjectId);
                                onTaskClick?.({ ...task, projectId: pId });
                              }}
                            />
                          ))
                        ) : (
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest px-2 opacity-50">Không có task quá hạn</p>
                        )}
                     </div>
                  </div>

                  {/* Divider */}
                  <div className="h-[1px] w-full bg-slate-100 dark:bg-white/5 mb-6 shrink-0" />

                  {/* 2. Sắp hết hạn Section (Within 24h) */}
                  <div className="flex-1 flex flex-col min-h-0">
                     <div className="flex items-center gap-2 mb-4 shrink-0">
                        <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                        <span className="text-[11px] font-black uppercase tracking-[0.2em] text-amber-500/80">Sắp hết hạn (24h)</span>
                     </div>
                     <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
                        {analytics?.upcomingTasksList?.length > 0 ? (
                          analytics.upcomingTasksList.map((task: any) => (
                            <TaskDeadlineCard 
                              key={task._id} 
                              task={task} 
                              type="upcoming" 
                              onClick={() => {
                                const pId = typeof task.projectId === 'object' ? task.projectId?._id : (task.projectId || selectedProjectId);
                                onTaskClick?.({ ...task, projectId: pId });
                              }}
                            />
                          ))
                        ) : (
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest px-2 opacity-50">Không có task gấp</p>
                        )}
                     </div>
                  </div>

                  {(!analytics?.overdueTasksList?.length && !analytics?.upcomingTasksList?.length) && (
                     <div className="absolute inset-0 flex items-center justify-center p-8 bg-white/20 dark:bg-slate-900/20 backdrop-blur-sm z-10 rounded-[32px]">
                       <div className="text-center">
                          <Activity className="w-8 h-8 text-slate-200 mx-auto mb-3" />
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tuyệt vời! Không có task gấp</p>
                       </div>
                     </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Productivity Insights - Fullwidth Row */}
            <div className={cn(
               "w-full mt-10 p-10 rounded-[40px] relative overflow-hidden group transition-all duration-700",
               "bg-gradient-to-br from-emerald-50 via-white to-emerald-50/30 border border-emerald-100/80 shadow-sm", // Light Mode: Solid & Crisp
               "dark:from-card/80 dark:via-card/40 dark:to-background/90 dark:border-brand-secondary/10 dark:shadow-ambient backdrop-blur-2xl" // Dark Mode: Deep & Ethereal
            )}>
               {/* Decorative Elements - Theme aware */}
               <div className="absolute -right-10 -top-10 w-80 h-80 bg-emerald-200/20 dark:bg-brand-primary/10 rounded-full blur-[100px] group-hover:dark:bg-brand-primary/20 transition-all duration-1000" />
               <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-emerald-100/30 dark:bg-brand-secondary/5 rounded-full blur-[80px]" />
               
               <div className="relative z-10 space-y-6">
                 <div className={cn(
                   "inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest leading-none",
                   "bg-emerald-50 border-emerald-200 text-emerald-700", // Light
                   "dark:bg-brand-primary/10 dark:border-brand-primary/20 dark:text-brand-primary" // Dark
                 )}>
                   <Activity className="w-3 h-3" />
                   Gợi ý chiến thuật
                 </div>
                 
                 <h3 className="text-3xl font-extrabold tracking-tight leading-tight text-slate-900 dark:text-white">
                   Dự án đã hoàn thành <span className="text-emerald-600 dark:text-brand-primary">{Number(analytics?.completionRate || 0).toFixed(1)}%</span>. 
                 </h3>
                 
                 <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10">
                   <p className="text-slate-600 dark:text-slate-300 font-medium max-w-2xl leading-relaxed">
                     {analytics?.overdueTasks > 0 
                       ? `Hiện có ${analytics.overdueTasks} công việc quá hạn. Hãy ưu tiên xử lý các đầu việc có mức ưu tiên CAO và KHẨN CẤP để đảm bảo dự án không bị đình trệ.`
                       : "Tiến độ dự án đang rất tốt! Hãy duy trì nhịp độ và đảm bảo tất cả các công việc mới đều được phân công người chịu trách nhiệm chính xác."}
                   </p>
                   
                   {/* Metric Section */}
                   <div className="lg:pl-10 lg:border-l border-slate-200/60 dark:border-white/5 shrink-0">
                     <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-12 h-12 rounded-2xl flex items-center justify-center border transition-colors",
                          "bg-emerald-50 border-emerald-100 text-emerald-600", // Light
                          "dark:bg-brand-primary/5 dark:border-brand-primary/10 dark:text-brand-primary" // Dark
                        )}>
                           <Zap className="w-6 h-6" />
                        </div>
                        <div>
                           <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-brand-primary/80">Hiệu suất hôm nay</p>
                           <div className="flex items-baseline gap-2">
                              <p className="text-xl font-black text-slate-900 dark:text-white">
                                {analytics?.todayPerformance?.toFixed(0)}%
                              </p>
                              {analytics?.todayPerformance !== 100 && (
                                <div className={cn(
                                  "flex items-center text-xs font-bold px-2 py-0.5 rounded-full",
                                  analytics?.todayPerformance > 100 
                                    ? "bg-emerald-50 text-emerald-600 dark:bg-brand-primary/10 dark:text-brand-primary" 
                                    : "bg-red-50 text-red-600 dark:bg-red-400/10 dark:text-red-400"
                                )}>
                                  {analytics?.todayPerformance > 100 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                                  {analytics?.todayPerformance > 100 ? "Tăng tốc" : "Chậm lại"}
                                </div>
                              )}
                           </div>
                           <p className="text-xs font-medium text-slate-400 dark:text-white/30 italic leading-tight mt-1">
                              {analytics?.tasksDoneToday > 0 
                                ? `Đã xong ${analytics.tasksDoneToday} việc hôm nay. `
                                : "Chưa hoàn thành việc nào hôm nay. "}
                              So với nhịp độ trung bình.
                           </p>
                        </div>
                     </div>
                   </div>
                 </div>
               </div>
            </div>
          </>
        )}
      </div>

      {/* Advanced Insights Drawer */}
      <AdvancedInsightsDrawer
        isOpen={isInsightsOpen}
        onClose={() => setIsInsightsOpen(false)}
        workspaceId={workspaceId}
        projectId={selectedProjectId}
      />
    </>
  );
}

function MetricCard({ label, value, icon: Icon, color, subValue, tooltip }: any) {
  return (
    <Card className="group/metric rounded-[28px] border-white/40 dark:border-white/5 bg-white/40 dark:bg-card/40 backdrop-blur-md shadow-ambient hover:shadow-lg transition-all duration-500 relative overflow-visible">
      <CardContent className="p-6">
        {tooltip && (
          <div className="absolute top-4 right-4 z-20 group/info cursor-help">
            <Info className="w-3 h-3 text-slate-300 opacity-50 group-hover/info:opacity-100 transition-opacity" />
            <div className="absolute right-0 top-full mt-2 w-48 p-2 bg-slate-900/95 dark:bg-[#1C2322] text-[10px] text-white dark:text-[#E5F4EF] rounded-xl opacity-0 invisible group-hover/info:opacity-100 group-hover/info:visible transition-all duration-300 z-50 shadow-2xl border border-white/10 backdrop-blur-md font-medium leading-relaxed">
              {tooltip}
            </div>
          </div>
        )}
        <div className="flex items-center gap-4">
          <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center bg-slate-50 dark:bg-white/5 group-hover/metric:scale-110 transition-transform duration-500", color)}>
            <Icon className="w-6 h-6" />
          </div>
          <div className="space-y-0.5">
            <p className="text-[10px] font-black text-slate-400 dark:text-brand-primary/80 uppercase tracking-[0.2em]">{label}</p>
            <h3 className={cn("text-2xl font-black tracking-tighter", color)}>{value}</h3>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-slate-50 dark:border-white/5">
           <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">{subValue}</p>
        </div>
      </CardContent>
    </Card>
  );
}
