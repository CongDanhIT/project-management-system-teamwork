'use client';

import React from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { workspaceService } from '@/services/workspace.service';
import { projectService } from '@/services/project.service';
import { taskService } from '@/services/task.service';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar,
  ArrowRight,
  MoreVertical,
  Layout,
  Pencil,
  Trash2,
  MoreHorizontal,
  Plus,
  Users,
  Activity,
  TrendingUp,
  TrendingDown,
  Download
} from 'lucide-react';
import { format, formatDistanceToNow, isToday, isYesterday, isThisWeek } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuGroup
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { ProjectFormDialog } from '@/components/project/ProjectFormDialog';
import { Project } from '@/services/project.service';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import Loader from '@/components/ui/Loader';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Task, TaskStatus } from '@/types/task';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const TaskDetailModal = dynamic(() => import('@/components/task/TaskDetailModal').then(mod => mod.TaskDetailModal), {
  ssr: false,
  loading: () => null
});
import { UserAvatar } from '@/components/shared/UserAvatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { OverdueCommandCenter } from '@/components/workspace/OverdueCommandCenter';
import WorkspaceAnalyticsChart from '@/components/workspace/WorkspaceAnalyticsChart';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import ProjectAnalyticsTab from '@/components/workspace/ProjectAnalyticsTab';
import WorkspaceActivityTab from '@/components/workspace/WorkspaceActivityTab';
import { ActivityHeatmap } from '@/components/workspace/ActivityHeatmap';
import { WorkspaceStatusOverview } from '@/components/workspace/WorkspaceStatusOverview';
import { DashboardMacroFilter, FilterState } from '@/components/workspace/DashboardMacroFilter';
import MemberPerformanceEvaluation from '@/components/workspace/MemberPerformanceEvaluation';
import ProjectOverviewTable from "@/components/workspace/ProjectOverviewTable";
import { isSameMonth, isSameQuarter, isSameYear, parseISO, endOfMonth, endOfQuarter, startOfMonth, startOfQuarter, subMonths, subQuarters } from 'date-fns';
import { exportWorkspaceOverviewToWord } from '@/utils/export-utils';




import { useWorkspaceRole } from '@/hooks/useWorkspaceRole';
import { Heart, HeartOff } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';

const getDynamicGradient = (id: string) => {
  const gradients = [
    'from-[#035D5B] to-[#0A2E2C]',
    'from-[#1A3C34] to-[#04100E]',
    'from-[#0E433E] to-[#061D1B]',
    'from-[#004D40] to-[#002420]',
    'from-[#172925] to-[#04100E]',
  ];
  const index = id ? id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % gradients.length : 0;
  return gradients[index];
};

export default function WorkspaceDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const workspaceId = params.workspaceId as string;
  const { isAdminOrOwner } = useWorkspaceRole();
  const { user } = useAuthStore();
  const [isExporting, setIsExporting] = React.useState(false);

  const [selectedTask, setSelectedTask] = React.useState<Task | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = React.useState(false);
  const [isOverdueCenterOpen, setIsOverdueCenterOpen] = React.useState(false);
  const [editingProject, setEditingProject] = React.useState<Project | null>(null);
  const [deletingProject, setDeletingProject] = React.useState<Project | null>(null);
  const [projectFormOpen, setProjectFormOpen] = React.useState(false);

  // Macro Filter State
  const [filters, setFilters] = React.useState<FilterState>({
    year: new Date().getFullYear(),
    periodType: 'month',
    periodValue: new Date().getMonth() + 1,
    projectIds: [],
    healthStatus: 'all'
  });

  // Chế độ "All" (year === 0): không lọc theo thời gian
  const isAllMode = filters.year === 0;

  // Tạo time params dùng chung cho tất cả query
  const timeParams = React.useMemo(() => {
    if (isAllMode) return {}; // All mode: không gửi bộ lọc thời gian
    return {
      year: filters.year,
      month: filters.periodType === 'month' ? filters.periodValue : undefined,
      quarter: filters.periodType === 'quarter' ? filters.periodValue : undefined
    };
  }, [isAllMode, filters.year, filters.periodType, filters.periodValue]);

  const isReportMode = React.useMemo(() => {
    if (isAllMode) return false; // All mode: không phải report mode
    const now = new Date();
    if (filters.year < now.getFullYear()) return true;
    if (filters.periodType === 'month') {
      if (filters.periodValue === 0) return false;
      if (filters.periodValue < now.getMonth() + 1) return true;
    }
    if (filters.periodType === 'quarter') {
      if (filters.periodValue < Math.ceil((now.getMonth() + 1) / 3)) return true;
    }
    return false;
  }, [filters, isAllMode]);

  // Kiểm tra xem kỳ được chọn có phải là tương lai không
  const isFutureMode = React.useMemo(() => {
    if (isAllMode) return false; // All mode: không phải future mode
    const now = new Date();
    if (filters.year > now.getFullYear()) return true;
    if (filters.year < now.getFullYear()) return false;

    if (filters.periodType === 'month') {
      if (filters.periodValue === 0) return false;
      return filters.periodValue > (now.getMonth() + 1);
    }
    if (filters.periodType === 'quarter') {
      return filters.periodValue > Math.ceil((now.getMonth() + 1) / 3);
    }
    return false;
  }, [filters, isAllMode]);

  // Fetch Analytics
  const { data: analytics, isLoading: isAnalyticsLoading } = useQuery({
    queryKey: ['workspace-analytics', workspaceId, filters.projectIds, filters.year, filters.periodType, filters.periodValue],
    queryFn: () => workspaceService.getWorkspaceAnalytics(workspaceId, filters.projectIds, timeParams),
    enabled: !!workspaceId,
  });

  const { data: analyticsHistory } = useQuery({
    queryKey: ['workspace-analytics-history', workspaceId, filters.projectIds, filters.year, filters.periodType, filters.periodValue],
    queryFn: () => workspaceService.getWorkspaceAnalyticsHistory(workspaceId, filters.projectIds, timeParams),
    enabled: !!workspaceId,
  });

  // Fetch Projects - Giới hạn 4 dự án trọng tâm cho Dashboard
  const { data: projectsData, isLoading: isProjectsLoading } = useQuery({
    queryKey: ['workspace-projects', workspaceId, 1, 4],
    queryFn: () => projectService.getProjectsByWorkspace(workspaceId, 1, 4),
    enabled: !!workspaceId,
  });

  // Fetch All Projects for Analytics & Table - Cần lọc theo thời gian
  const { data: allProjectsData, isLoading: isAllProjectsLoading } = useQuery({
    queryKey: ['workspace-projects-all', workspaceId, filters.year, filters.periodType, filters.periodValue],
    queryFn: () => projectService.getProjectsByWorkspace(workspaceId, 1, 100, isAllMode ? undefined : timeParams),
    enabled: !!workspaceId,
  });

  // Fetch Recent Tasks
  const { data: tasksData, isLoading: isTasksLoading } = useQuery({
    queryKey: ['workspace-tasks-overdue', workspaceId],
    queryFn: () => taskService.getTasksByWorkspace(workspaceId, { isOverdue: 'true', limit: 20 }),
    enabled: !!workspaceId,
  });

  // Fetch Members for TaskDetail & Analytics
  const { data: membersData } = useQuery({
    queryKey: ['workspace-members', workspaceId, filters.projectIds, filters.year, filters.periodType, filters.periodValue],
    queryFn: () => workspaceService.getMembers(workspaceId, filters.projectIds, isAllMode ? undefined : timeParams),
    enabled: !!workspaceId,
  });

  React.useEffect(() => {
    if (membersData) {
      console.log("Dashboard: Members Data Loaded", membersData?.members?.length, "members found");
    }
  }, [membersData]);

  // Sort tasks by priority (HIGH > MEDIUM > LOW) and filter by selected projects
  const priorityWeight: Record<string, number> = { 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
  const overdueTasksList = (tasksData?.tasks || [])
    .filter((task: any) => {
      if (filters.projectIds.length === 0) return true;
      // Handle both string ID and populated object ID
      const pId = typeof task.projectId === 'object' && task.projectId !== null 
        ? (task.projectId._id || task.projectId.$oid) 
        : task.projectId;
      return filters.projectIds.includes(String(pId));
    })
    .sort((a: any, b: any) => {
      const weightA = priorityWeight[a.priority as string] || 0;
      const weightB = priorityWeight[b.priority as string] || 0;
      if (weightB !== weightA) return weightB - weightA;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(); // Nếu cùng ưu tiên, task trễ nhất lên đầu
    });



  // 3. Dữ liệu cho Line Chart (Vận tốc làm việc / Velocity) dùng để xuất báo cáo
  const velocityData = React.useMemo(() => {
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

  // Tính toán Stats dựa trên bộ lọc
  const computedStats = React.useMemo(() => {
    if (!analytics || !analyticsHistory) return [];

    // Trường hợp 1: Kỳ tương lai -> Trả về 0 hoặc rỗng
    if (isFutureMode) {
      return [
        { 
          label: 'Tổng công việc', 
          value: 0, 
          trend: { value: '0', isUp: true }, 
          icon: CheckCircle2,
          color: 'text-brand-primary',
          glow: 'from-brand-primary/20 to-transparent',
          accent: 'bg-brand-primary'
        },
        { 
          label: 'Đang thực hiện', 
          value: 0, 
          trend: { value: '0', isUp: true }, 
          icon: Clock,
          color: 'text-amber-500',
          glow: 'from-amber-500/20 to-transparent',
          accent: 'bg-amber-500'
        },
        { 
          label: 'Đã hoàn thành', 
          value: 0, 
          trend: { value: '0', isUp: true }, 
          icon: CheckCircle2,
          color: 'text-emerald-500',
          glow: 'from-emerald-500/20 to-transparent',
          accent: 'bg-emerald-500'
        },
        { 
          label: 'Quá hạn', 
          value: 0, 
          trend: { value: '0', isUp: false }, 
          icon: AlertCircle,
          color: 'text-red-500',
          glow: 'from-red-500/20 to-transparent',
          accent: 'bg-red-500'
        }
      ];
    }

    // Trường hợp 2: Thời điểm hiện tại (Real-time)
    if (!isReportMode) {
      return [
        {
          label: 'Tổng công việc',
          value: analytics.totalTasks || 0,
          trend: { 
            value: analytics.trends?.totalTasksTrend ? (analytics.trends.totalTasksTrend.percent > 0 ? `${Math.round(analytics.trends.totalTasksTrend.percent)}%` : Math.abs(analytics.trends.totalTasksTrend.value).toString()) : '0', 
            isUp: (analytics.trends?.totalTasksTrend?.value || 0) >= 0 
          },
          icon: CheckCircle2,
          color: 'text-brand-primary',
          glow: 'from-brand-primary/20 to-transparent',
          accent: 'bg-brand-primary'
        },
        {
          label: 'Đang thực hiện',
          value: analytics.inProgressTasks || 0,
          trend: { 
            value: analytics.trends?.inProgressTasksTrend ? (analytics.trends.inProgressTasksTrend.percent > 0 ? `${Math.round(analytics.trends.inProgressTasksTrend.percent)}%` : Math.abs(analytics.trends.inProgressTasksTrend.value).toString()) : '0', 
            isUp: (analytics.trends?.inProgressTasksTrend?.value || 0) >= 0 
          },
          icon: Clock,
          color: 'text-amber-500',
          glow: 'from-amber-500/20 to-transparent',
          accent: 'bg-amber-500'
        },
        {
          label: 'Đã hoàn thành',
          value: analytics.completedTasks || 0,
          trend: { 
            value: analytics.trends?.completedTasksTrend ? (analytics.trends.completedTasksTrend.percent > 0 ? `${Math.round(analytics.trends.completedTasksTrend.percent)}%` : Math.abs(analytics.trends.completedTasksTrend.value).toString()) : '0', 
            isUp: (analytics.trends?.completedTasksTrend?.value || 0) >= 0 
          },
          icon: CheckCircle2,
          color: 'text-emerald-500',
          glow: 'from-emerald-500/20 to-transparent',
          accent: 'bg-emerald-500'
        },
        {
          label: 'Quá hạn',
          value: analytics.overdueTasks || 0,
          trend: { 
            value: analytics.trends?.overdueTasksTrend ? (analytics.trends.overdueTasksTrend.percent > 0 ? `${Math.round(analytics.trends.overdueTasksTrend.percent)}%` : Math.abs(analytics.trends.overdueTasksTrend.value).toString()) : '0', 
            isUp: (analytics.trends?.overdueTasksTrend?.value || 0) >= 0 
          },
          icon: AlertCircle,
          color: 'text-red-500',
          glow: 'from-red-500/20 to-transparent',
          accent: 'bg-red-500'
        },
      ];
    }

    // Chế độ báo cáo: Tìm snapshot cuối cùng của kỳ được chọn
    const findSnapshotForPeriod = (year: number, periodType: 'month' | 'quarter', periodValue: number) => {
      return analyticsHistory.filter(s => {
        const d = parseISO(s.date);
        if (d.getFullYear() !== year) return false;
        if (periodType === 'month') {
          if (periodValue === 0) return true; // Lấy mọi tháng trong năm
          return (d.getMonth() + 1) === periodValue;
        }
        return Math.ceil((d.getMonth() + 1) / 3) === periodValue;
      }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
    };

    const currentSnapshot = findSnapshotForPeriod(filters.year, filters.periodType, filters.periodValue);
    
    // Tìm snapshot của kỳ trước để tính trend
    let prevYear = filters.year;
    let prevValue = filters.periodValue - 1;
    if (prevValue === 0) {
      prevYear -= 1;
      prevValue = filters.periodType === 'month' ? 12 : 4;
    }
    const prevSnapshot = findSnapshotForPeriod(prevYear, filters.periodType, prevValue);

    const getTrend = (curr: number, prev: number) => {
      const diff = curr - prev;
      return {
        value: Math.abs(diff).toString(),
        isUp: diff >= 0
      };
    };

    return [
      {
        label: 'Tổng công việc',
        value: currentSnapshot?.totalTasks || 0,
        trend: getTrend(currentSnapshot?.totalTasks || 0, prevSnapshot?.totalTasks || 0),
        icon: CheckCircle2,
        color: 'text-brand-primary',
        glow: 'from-brand-primary/20 to-transparent',
        accent: 'bg-brand-primary'
      },
      {
        label: 'Đang thực hiện',
        value: currentSnapshot?.inProgressTasks || 0,
        trend: getTrend(currentSnapshot?.inProgressTasks || 0, prevSnapshot?.inProgressTasks || 0),
        icon: Clock,
        color: 'text-amber-500',
        glow: 'from-amber-500/20 to-transparent',
        accent: 'bg-amber-500'
      },
      {
        label: 'Đã hoàn thành',
        value: currentSnapshot?.completedTasks || 0,
        trend: getTrend(currentSnapshot?.completedTasks || 0, prevSnapshot?.completedTasks || 0),
        icon: CheckCircle2,
        color: 'text-emerald-500',
        glow: 'from-emerald-500/20 to-transparent',
        accent: 'bg-emerald-500'
      },
      {
        label: 'Quá hạn',
        value: currentSnapshot?.overdueTasks || 0,
        trend: getTrend(currentSnapshot?.overdueTasks || 0, prevSnapshot?.overdueTasks || 0),
        icon: AlertCircle,
        color: 'text-red-500',
        glow: 'from-red-500/20 to-transparent',
        accent: 'bg-red-500'
      },
    ];
  }, [analytics, analyticsHistory, filters, isReportMode]);

  const handleExportReport = async () => {
    try {
      setIsExporting(true);
      toast.info("Đang khởi tạo tài liệu báo cáo chiến lược...");

      const workspaceName = allProjectsData?.projects?.[0]?.workspaceId?.name || "Workspace TeamFlow";
      const reporterName = user?.name || "Thành viên TeamFlow";

      const projectName = filters.projectIds.length === 0
        ? "Tất cả dự án"
        : filters.projectIds
            .map(id => {
              const proj = allProjectsData?.projects?.find((p: any) => String(p._id) === id);
              return proj?.name || id;
            })
            .join(", ");

      const activeFilters = {
        year: filters.year,
        periodType: filters.periodType as 'month' | 'quarter',
        periodValue: filters.periodValue,
        projectName,
        healthStatus: filters.healthStatus
      };

      const totalTasks = computedStats.find(s => s.label === 'Tổng công việc')?.value || 0;
      const inProgressTasks = computedStats.find(s => s.label === 'Đang thực hiện')?.value || 0;
      const completedTasks = computedStats.find(s => s.label === 'Đã hoàn thành')?.value || 0;
      const overdueTasks = computedStats.find(s => s.label === 'Quá hạn')?.value || 0;
      const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      const stats = {
        totalTasks,
        inProgressTasks,
        completedTasks,
        overdueTasks,
        completionRate
      };

      const members = (membersData?.members || []).map((m: any) => {
        const total = m.taskStats?.totalTasks || 0;
        const completed = m.taskStats?.completedTasks || 0;
        const overdue = m.taskStats?.overdueTasks || 0;
        const inProgress = Math.max(0, total - completed - overdue);
        const rawRole = m.role || "MEMBER";
        const role = rawRole === "OWNER" ? "Chủ sở hữu" : rawRole === "ADMIN" ? "Quản trị viên" : "Thành viên";
        return {
          name: m.userId?.name || m.name || "Ẩn danh",
          email: m.userId?.email || m.email || "",
          role,
          totalTasks: total,
          completedTasks: completed,
          inProgressTasks: inProgress,
          overdueTasks: overdue
        };
      });

      await exportWorkspaceOverviewToWord({
        workspaceName,
        reporterName,
        activeFilters,
        stats,
        velocityData,
        members
      });

      toast.success("Xuất báo cáo thành công! Tải xuống tài liệu bắt đầu.");
    } catch (error) {
      console.error("Lỗi xuất báo cáo Word:", error);
      toast.error("Không thể xuất báo cáo Word. Vui lòng thử lại!");
    } finally {
      setIsExporting(false);
    }
  };


  const isLoading = isAnalyticsLoading || isProjectsLoading || isTasksLoading;

  const handleProjectClick = (projectId: string) => {
    router.push(`/workspace/${workspaceId}/projects/${projectId}/phases`);
  };

  const handleSeeAllProjects = () => {
    router.push(`/workspace/${workspaceId}/projects`);
  };

  const handleSeeAllTasks = () => {
    router.push(`/workspace/${workspaceId}/tasks`);
  };

  const deleteMutation = useMutation({
    mutationFn: () => projectService.deleteProject(workspaceId, deletingProject!._id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-projects', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['workspace-analytics', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['workspace-tasks', workspaceId] });
      toast.success('Đã chuyển dự án vào thùng rác!');
      setDeletingProject(null);
    },
    onError: () => toast.error('Có lỗi xảy ra, thử lại nhé!'),
  });

  const favoriteMutation = useMutation({
    mutationFn: (projectId: string) => projectService.toggleFavorite(workspaceId, projectId),
    onMutate: async (projectId) => {
      await queryClient.cancelQueries({ queryKey: ['workspace-projects', workspaceId] });
      const previousProjects = queryClient.getQueryData(['workspace-projects', workspaceId]);

      queryClient.setQueryData(['workspace-projects', workspaceId], (old: any) => {
        if (!old || !old.projects) return old;
        return {
          ...old,
          projects: old.projects.map((p: any) => {
            if (p._id === projectId) {
              const uId = user?.id;
              const favoritedBy = [...(p.favoritedBy || [])];
              const isFav = favoritedBy.some((id: any) => (id._id || id) === uId);
              const newFavs = isFav
                ? favoritedBy.filter((id: any) => (id._id || id) !== uId)
                : [...favoritedBy, uId];
              return { ...p, favoritedBy: newFavs };
            }
            return p;
          })
        };
      });
      return { previousProjects };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['workspace-projects', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['favorite-projects', workspaceId] });
      toast.success(data.isFavorited ? "Đã thêm vào yêu thích" : "Đã bỏ yêu thích");
    },
    onError: (err, variables, context: any) => {
      if (context?.previousProjects) {
        queryClient.setQueryData(['workspace-projects', workspaceId], context.previousProjects);
      }
      toast.error("Không thể cập nhật trạng thái yêu thích");
    }
  });
  const currentUserId = user?.id;

  const handleEditProject = (p: Project) => {
    setEditingProject(p);
    setProjectFormOpen(true);
  };

  const handleDeleteProject = (p: Project) => {
    setDeletingProject(p);
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsTaskModalOpen(true);
  };

  const handleUpdateTask = async (taskId: string, data: any) => {
    try {
      // Find the project ID from the selected task with robust fallback
      const projectInfo = (selectedTask as any)?.project;
      const pId = (typeof selectedTask?.projectId === 'object' && selectedTask?.projectId !== null)
        ? (selectedTask.projectId as any)._id 
        : (selectedTask?.projectId || 
           (typeof projectInfo === 'object' && projectInfo !== null ? projectInfo._id : projectInfo));

      console.log("UpdateTask: pId resolved to", pId, "from task", taskId);

      if (!pId) {
        console.error("UpdateTask: No project ID found for task", taskId);
        toast.error("Không tìm thấy thông tin dự án để cập nhật");
        return;
      }

      await taskService.updateTask(workspaceId, pId, taskId, data);
      
      // Đồng bộ toàn bộ các query liên quan đến Task trong Workspace
      const syncKeys = [
        ['workspace-tasks', workspaceId],
        ['workspace-tasks-list', workspaceId],
        ['workspace-tasks-overdue', workspaceId],
        ['overdue-tasks', workspaceId],
        ['workspace-analytics', workspaceId],
        ['workspace-analytics-history', workspaceId],
        ['projectAnalytics', workspaceId],
        ['projectAnalyticsHistory', workspaceId],
        ['workspace-projects', workspaceId]
      ];

      syncKeys.forEach(key => queryClient.invalidateQueries({ queryKey: key }));
      
      // Also sync project-specific queries if we have the pId
      if (pId) {
        queryClient.invalidateQueries({ queryKey: ['project-tasks', workspaceId, pId] });
        queryClient.invalidateQueries({ queryKey: ['project-root-tasks', workspaceId, pId] });
        queryClient.invalidateQueries({ queryKey: ['project-all-subtasks', workspaceId, pId] });
        queryClient.invalidateQueries({ queryKey: ['project-summary', workspaceId, pId] });
      }

      toast.success("Đã cập nhật công việc");
    } catch (error) {
      console.error("Failed to update task on dashboard", error);
      toast.error("Không thể cập nhật công việc");
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      if (window.confirm("Bạn có chắc chắn muốn xóa công việc này?")) {
        const projectInfo = (selectedTask as any)?.project;
        const pId = (typeof selectedTask?.projectId === 'object' && selectedTask?.projectId !== null)
          ? (selectedTask.projectId as any)._id 
          : (selectedTask?.projectId || 
             (typeof projectInfo === 'object' && projectInfo !== null ? projectInfo._id : projectInfo));

        await taskService.deleteTask(workspaceId, pId || '', taskId);
        setIsTaskModalOpen(false);
        
        // Đồng bộ toàn diện sau khi xóa
        queryClient.invalidateQueries({ queryKey: ['workspace-tasks', workspaceId] });
        queryClient.invalidateQueries({ queryKey: ['workspace-tasks-list', workspaceId] });
        queryClient.invalidateQueries({ queryKey: ['workspace-tasks-overdue', workspaceId] });
        queryClient.invalidateQueries({ queryKey: ['overdue-tasks', workspaceId] });
        queryClient.invalidateQueries({ queryKey: ['workspace-analytics', workspaceId] });
        queryClient.invalidateQueries({ queryKey: ['workspace-analytics-history', workspaceId] });
        queryClient.invalidateQueries({ queryKey: ['projectAnalytics', workspaceId] });
        queryClient.invalidateQueries({ queryKey: ['projectAnalyticsHistory', workspaceId] });
        queryClient.invalidateQueries({ queryKey: ['workspace-projects', workspaceId] });
        
        if (pId) {
          queryClient.invalidateQueries({ queryKey: ['project-tasks', workspaceId, pId] });
          queryClient.invalidateQueries({ queryKey: ['project-root-tasks', workspaceId, pId] });
          queryClient.invalidateQueries({ queryKey: ['project-all-subtasks', workspaceId, pId] });
          queryClient.invalidateQueries({ queryKey: ['project-summary', workspaceId, pId] });
        }
        toast.success("Đã xóa công việc");
      }
    } catch (error) {
      toast.error("Không thể xóa công việc");
    }
  };

  // Helper component for project actions to keep the code clean
  const ProjectActionMenu = ({ project, isHero = false }: { project: any, isHero?: boolean }) => (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "inline-flex items-center justify-center transition-all outline-none backdrop-blur-md border shadow-sm",
          isHero
            ? "h-10 w-10 rounded-2xl text-white hover:text-white bg-black/20 hover:bg-black/40 border-white/20"
            : "h-8 w-8 rounded-xl text-slate-500 hover:text-slate-900 dark:text-[#E5F4EF]/50 dark:hover:text-[#C7F964] bg-white/80 dark:bg-white/5 border-slate-200 dark:border-white/10 hover:bg-white dark:hover:bg-white/10"
        )}
      >
        <MoreHorizontal className={isHero ? "w-5 h-5" : "w-4 h-4"} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 rounded-[24px] p-2 shadow-depth-3 border-none bg-white dark:bg-[#1C2322]">
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => handleProjectClick(project._id)} className="rounded-xl py-3 font-bold text-slate-600">
            <Layout className="w-4 h-4 mr-3 text-teal-600" />
            Mở bảng công việc
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleEditProject(project)} className="rounded-xl py-3 font-bold text-slate-600">
            <Pencil className="w-4 h-4 mr-3 text-amber-500" />
            Chỉnh sửa dự án
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator className="my-2 bg-slate-50" />
        <DropdownMenuGroup>
          <DropdownMenuItem
            onClick={() => handleDeleteProject(project)}
            className="rounded-xl py-3 font-bold text-red-500 focus:text-red-500 focus:bg-red-50"
          >
            <Trash2 className="w-4 h-4 mr-3" />
            Xoá dự án
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab') || 'overview';

  const handleTabChange = (value: string) => {
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    current.set('tab', value);
    const search = current.toString();
    const query = search ? `?${search}` : "";
    router.push(`${window.location.pathname}${query}`, { scroll: false });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto pt-2 px-4 md:pt-6 md:px-10 animate-in fade-in duration-700 pb-20">
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full space-y-16">
        {/* Welcome Header & Tabs Control */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="flex flex-col gap-2">
            <h1 className="text-[42px] font-black text-[#035D5B] dark:text-[#C7F964] tracking-[-0.04em] leading-tight uppercase">
              Chiến lược Workspace
            </h1>
            <p className="text-[16px] text-[#3F4948] dark:text-[#E5F4EF]/80 font-medium">
              Dữ liệu thời gian thực và tiến hướng kiến tạo các mục tiêu chiến lược.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 shrink-0">
            <TabsList className="shrink-0 bg-slate-100/50 dark:bg-slate-800/40 p-1.5 rounded-[24px] border border-slate-200 dark:border-white/5 backdrop-blur-xl">
              <TabsTrigger 
                value="overview"
                className="rounded-[18px] px-8 py-2.5 text-[11px] font-black uppercase tracking-widest transition-all data-[state=active]:bg-white dark:data-[state=active]:bg-[#C7F964] data-[state=active]:text-[#035D5B] data-[state=active]:shadow-glow-sm"
              >
                Tổng quan
              </TabsTrigger>
              <TabsTrigger 
                value="focus"
                className="rounded-[18px] px-8 py-2.5 text-[11px] font-black uppercase tracking-widest transition-all data-[state=active]:bg-white dark:data-[state=active]:bg-[#C7F964] data-[state=active]:text-[#035D5B] data-[state=active]:shadow-glow-sm"
              >
                Tiêu điểm
              </TabsTrigger>
              <TabsTrigger 
                value="project"
                className="rounded-[18px] px-8 py-2.5 text-[11px] font-black uppercase tracking-widest transition-all data-[state=active]:bg-white dark:data-[state=active]:bg-[#C7F964] data-[state=active]:text-[#035D5B] data-[state=active]:shadow-glow-sm"
              >
                Hoạt động
              </TabsTrigger>
            </TabsList>

            {/* Elegant Export Button on Page Level */}
            {activeTab === 'overview' && (
              <Button
                onClick={handleExportReport}
                disabled={isExporting}
                className="h-[52px] px-6 rounded-[24px] font-black text-[10px] uppercase tracking-widest bg-teal-50/60 hover:bg-teal-100/80 text-[#035D5B] dark:bg-teal-950/30 dark:hover:bg-teal-900/40 dark:text-teal-400 border border-teal-200/60 dark:border-teal-500/20 shadow-sm hover:scale-105 transition-all active:scale-95 flex items-center justify-center gap-2 group shrink-0"
              >
                {isExporting ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 border-2 border-current border-t-transparent animate-spin rounded-full" />
                    Đang xuất...
                  </span>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5 transition-transform group-hover:translate-y-0.5" />
                    Xuất Báo Cáo
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Tab 1: Overview */}
        <TabsContent value="overview" className="mt-0 space-y-20 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="space-y-12">
            {/* Macro Filter Bar */}
            <div className="w-full">
              <DashboardMacroFilter 
                filters={filters} 
                setFilters={setFilters} 
                projects={allProjectsData?.projects || []} 
              />
            </div>

            {/* Stats Bento Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {computedStats.map((stat) => (
                <div
                  key={stat.label}
                  className={cn(
                    "group relative bg-white dark:bg-card p-8 rounded-[40px] transition-all duration-500 hover:-translate-y-2 overflow-hidden dark:border dark:border-white/5 shadow-depth-1 dark:shadow-none"
                  )}
                >
                  {/* Ambient Background Light Source */}
                  <div className={cn(
                    "absolute -right-20 -top-20 w-64 h-64 rounded-full bg-gradient-to-br blur-[80px] opacity-0 group-hover:opacity-60 transition-opacity duration-1000",
                    stat.glow
                  )} />

                  <div className="flex flex-col gap-6 relative z-10">
                    <div className="flex justify-between items-start">
                      <div className="relative">
                        <div className="relative h-12 w-12 rounded-[18px] bg-slate-50 dark:bg-brand-secondary/5 flex items-center justify-center transition-all duration-500 group-hover:shadow-glow group-hover:shadow-brand-secondary/5 group-hover:scale-110">
                          <stat.icon className={cn("w-6 h-6", stat.color)} strokeWidth={2} />
                        </div>
                      </div>

                      {/* Decorative Linear Indicator */}
                      <div className="flex gap-1.5 opacity-20 group-hover:opacity-100 transition-opacity pt-2">
                        <div className={cn("w-1.5 h-1.5 rounded-full", stat.accent)} />
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                      </div>
                    </div>

                    <div>
                      <span className="text-[11px] font-black text-slate-400 dark:text-brand-primary/80 uppercase tracking-[0.2em]">{stat.label}</span>
                      <div className="flex items-baseline gap-2 mt-2">
                        <h3 className={cn(
                          "text-[32px] font-black tracking-[-0.06em] leading-none transition-all duration-700",
                          stat.color
                        )}>
                          {isLoading ? <Skeleton className="h-8 w-16" /> : stat.value}
                        </h3>
                      </div>
                    </div>
                  </div>

                  {/* Trend Indicator - Nằm ngang ở góc dưới bên phải */}
                  <div className="absolute bottom-8 right-8 flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity duration-300">
                    {stat.trend.isUp ? (
                      <TrendingUp size={10} className="text-emerald-500" />
                    ) : (
                      <TrendingDown size={10} className="text-red-500" />
                    )}
                    <span className={cn(
                      "font-mono text-[10px] font-bold tracking-tight",
                      stat.trend.isUp ? "text-emerald-500" : "text-red-500"
                    )}>
                      {stat.trend.isUp ? '+' : '-'}{stat.trend.value}
                    </span>
                  </div>

                  {/* Bottom Decorative Line */}
                  <div className="absolute bottom-0 left-10 right-10 h-[2px] bg-gradient-to-r from-transparent via-border-subtle to-transparent overflow-hidden">
                    <div className={cn(
                      "h-full w-0 group-hover:w-full transition-all duration-1000 bg-gradient-to-r",
                      stat.glow.replace('blur-[80px]', 'blur-none')
                    )} />
                  </div>
                </div>
              ))}
            </div>

            {/* Analytics Chart - Báo cáo phân tích nhịp độ lâu dài */}
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-200">
              <WorkspaceAnalyticsChart 
                data={analyticsHistory || []} 
                macroFilters={filters}
              />
            </div>

            {/* Hoạt động nhịp điệu (Heatmap) */}
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">
              <ActivityHeatmap workspaceId={workspaceId} />
            </div>

            {/* Vùng 1: Tổng quan công việc (Mới thêm) */}
            <WorkspaceStatusOverview 
              analytics={analytics}
              analyticsHistory={analyticsHistory || []}
              projects={allProjectsData?.projects || []}
              filters={filters}
            />

            {/* Vùng 2: Đánh giá và so sánh thành viên (Mới thêm) */}
            <MemberPerformanceEvaluation 
              members={membersData?.members || []}
            />

            {/* Vùng 3: Tổng quan theo dự án (Mới thêm) */}
            <ProjectOverviewTable 
              projects={(allProjectsData?.projects || []).filter((p: any) => 
                filters.projectIds.length === 0 || filters.projectIds.includes(String(p._id))
              )}
            />

          </div>

          <div className="flex flex-col gap-20">
            <section className="space-y-12 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-[32px] font-black text-[#035D5B] dark:text-[#C7F964] tracking-tight uppercase">Dự án trọng tâm</h2>
                  <p className="text-sm text-[#3F4948] dark:text-[#E5F4EF]/40 font-medium">Bốn mảnh ghép chiến lược đang được kiến tạo.</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSeeAllProjects}
                  className="text-[#035D5B] dark:text-[#C7F964] hover:bg-[#035D5B]/5 dark:hover:bg-[#C7F964]/5 font-bold tracking-tight rounded-full px-6"
                >
                  Phóng tầm mắt <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>

              <div className="w-full">
                {isProjectsLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                    {[1, 2, 3].map(i => (
                      <Skeleton key={i} className="h-[460px] rounded-[32px]" />
                    ))}
                  </div>
                ) : projectsData?.projects?.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 pt-10 pb-16">
                    {(projectsData?.projects || [])
                      .filter((p: any) => {
                        if (filters.healthStatus === 'all') return true;
                        if (filters.healthStatus === 'completed') return p.status === 'COMPLETED';
                        if (filters.healthStatus === 'at-risk') return (p.overdueTasks || 0) > 0;
                        if (filters.healthStatus === 'active') return p.status === 'ACTIVE' || (p.inProgressTasks || 0) > 0;
                        return true;
                      })
                      .slice(0, 4)
                      .map((project: any, index: number) => {
                        const isHero = index === 0;
                        return (
                        <div
                          key={typeof project._id === 'object' ? (project._id?.$oid || JSON.stringify(project._id)) : (project._id || index)}
                          onClick={() => handleProjectClick(project._id)}
                          className={cn(
                            "relative flex flex-col rounded-[32px] bg-white dark:bg-card/40 backdrop-blur-md shadow-glow-combined hover:z-30 group overflow-hidden border border-slate-100 dark:border-white/5 cursor-pointer p-0",
                            index % 4 === 1 ? "group-hover:translate-y-[-4px]" : "",
                            isHero ? "lg:flex-row lg:min-h-[380px] lg:col-span-full" : "h-[370px]"
                          )}
                        >
                          {/* Background/Cover Layer - ABSOLUTE FULL BLEED */}
                          <div
                            className={cn(
                              "relative overflow-hidden shrink-0 transition-all duration-500 transform-gpu z-[5]",
                              isHero ? "h-72 lg:h-auto lg:w-[48%]" : "h-48 w-full"
                            )}
                          >
                            {project.coverUrl ? (
                              <div
                                className="w-full h-full bg-cover transition-transform duration-1000 group-hover:scale-110 opacity-70 transform-gpu will-change-transform scale-[1.01]"
                                style={{
                                  backgroundImage: `url(${project.coverUrl})`,
                                  backgroundPosition: `${project.coverPositionX ?? 50}% ${project.coverPositionY ?? 50}%`,
                                  backfaceVisibility: 'hidden',
                                  transform: 'translateZ(0)'
                                }}
                              />
                            ) : (
                              <div className={cn(
                                "w-full h-full bg-gradient-to-br transition-all",
                                index === 0 ? "from-teal-500/10 to-emerald-500/10" :
                                  index === 1 ? "from-[#035D5B]/10 to-[#0A2E2C]/10" :
                                    index === 2 ? "from-cyan-500/10 to-sky-500/10" :
                                      "from-amber-500/10 to-orange-500/10"
                              )} />
                            )}
                            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/10 dark:to-black/30" />

                            {/* Smaller, more elegant Emoji overlay */}
                            <div className="absolute top-6 left-6 w-10 h-10 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center text-lg shadow-lg border border-white/20 z-20">
                              {project.emoji || '📁'}
                            </div>
                          </div>

                          {/* Content Area with consistent padding */}
                          <div className={cn(
                            "relative z-10 flex flex-col min-w-0 flex-1 px-6 pt-5 pb-5",
                            isHero ? "space-y-6 justify-center" : "space-y-2"
                          )}>
                            <div className="flex justify-between items-start">
                              <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest text-teal-600 bg-teal-500/10 border-none">
                                {index % 4 === 0 ? "Chiến lược hàng đầu" :
                                  index % 4 === 1 ? "Kiến tạo mục tiêu" :
                                    index % 4 === 2 ? "Giải pháp sáng tạo" :
                                      "Đổi mới không ngừng"}
                              </Badge>
                              {isAdminOrOwner && (
                                <div onClick={(e) => e.stopPropagation()}>
                                  <ProjectActionMenu project={project} isHero={isHero} />
                                </div>
                              )}
                            </div>

                            <div className="space-y-2 pb-2">
                              <h3 className={cn(
                                "font-black text-slate-900 dark:text-foreground leading-tight tracking-tighter transition-all duration-500 uppercase",
                                isHero ? "text-4xl lg:text-5xl" : "text-lg",
                                "group-hover:text-teal-600 dark:group-hover:text-teal-400"
                              )}>
                                {project.name}
                              </h3>
                              <p className={cn(
                                "font-medium text-slate-500 dark:text-text-dim leading-relaxed opacity-90",
                                isHero ? "text-base max-w-xl line-clamp-2" : "text-[13px] line-clamp-1"
                              )}>
                                {project.description || 'Hành trình kiến tạo đổi mới đầy khát vọng.'}
                              </p>
                            </div>



                            <div className="flex items-center justify-between mt-auto">
                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50/50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-brand-primary opacity-70" />
                                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                                    {project.totalTasks || 0} công việc
                                  </span>
                                </div>

                                {project.members && project.members.length > 0 && (
                                  <div className="flex -space-x-2 pl-1 border-l border-slate-100 dark:border-white/10 ml-1">
                                    {project.members.slice(0, 3).map((member: any, i: number) => (
                                      <UserAvatar
                                        key={member.userId?._id || i}
                                        user={member.userId}
                                        className="h-8 w-8 border-2 border-card ring-0 shadow-sm"
                                        showShadow={false}
                                      />
                                    ))}
                                  </div>
                                )}
                              </div>

                              <span className="text-[10px] font-bold text-[#3F4948]/60 dark:text-brand-primary/80 uppercase tracking-[0.2em]">
                                {formatDistanceToNow(new Date(project.updatedAt), { addSuffix: true, locale: vi })}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
            ) : (
                  <div className="col-span-full py-20 bg-slate-50/20 dark:bg-card/10 rounded-[48px] border-2 border-dashed border-slate-200/60 dark:border-brand-primary/20 flex flex-col items-center justify-center text-center w-full animate-in fade-in zoom-in duration-700 min-h-[300px]">
                    <div className="w-16 h-16 bg-slate-100/50 dark:bg-slate-800/50 rounded-2xl flex items-center justify-center mb-6 shadow-depth-flat text-slate-300 dark:text-slate-600">
                      <Layout className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">Không gian hiện đang trống</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-sm font-medium">Hãy bắt đầu hành trình bằng việc tạo một dự án chiến lược mới.</p>
                    {isAdminOrOwner && (
                      <Button
                        onClick={() => { setEditingProject(null); setProjectFormOpen(true); }}
                        className="mt-8 bg-[#065b55] hover:bg-[#084d48] text-white font-black rounded-full px-8 py-5 h-auto text-xs uppercase tracking-[0.1em] shadow-2xl shadow-teal-900/20 transition-all hover:scale-105 active:scale-95"
                      >
                        Tạo ngay dự án đầu tiên
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
              {/* Main Feed: 8 Columns on Desktop */}
              <section className="lg:col-span-8 space-y-10 pb-4">
                <div className="mb-12">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-[1px] w-8 bg-red-500/30" />
                    <span className="text-[10px] font-bold text-red-500 uppercase tracking-[0.2em]">Hệ thống cảnh báo</span>
                  </div>
                  <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Nhiệm vụ quá hạn</h2>
                  <p className="text-[13px] font-medium text-slate-500 mt-1 max-w-xl">
                    Danh sách các mục tiêu đã vượt quá thời hạn cam kết. Hãy ưu tiên xử lý để đảm bảo tiến độ dự án.
                  </p>
                </div>

                <div className="relative pl-8 space-y-10">
                  {/* Timeline vertical line */}
                  <div className="absolute left-[11px] top-4 bottom-4 w-[2px] bg-gradient-to-b from-red-500/20 via-red-500/5 to-transparent" />

                  {isTasksLoading ? (
                    [1, 2, 3].map(i => (
                      <div key={i} className="flex items-center gap-6 p-6 bg-white dark:bg-[#172925] rounded-[24px]">
                        <Skeleton className="w-12 h-12 rounded-2xl" />
                        <div className="space-y-2 flex-1">
                          <Skeleton className="h-4 w-1/3" />
                          <Skeleton className="h-3 w-1/2" />
                        </div>
                      </div>
                    ))
                  ) : overdueTasksList.length > 0 ? (
                    (() => {
                      const groupedTasks: Record<string, any[]> = {};
                      // Sort by priority within the flat list first, then group
                      const priorityMap: Record<string, number> = { 'URGENT': 0, 'HIGH': 1, 'MEDIUM': 2, 'NORMAL': 3, 'LOW': 4 };
                      const sortedTasks = [...overdueTasksList].sort((a, b) => {
                        const pA = priorityMap[a.priority] ?? 5;
                        const pB = priorityMap[b.priority] ?? 5;
                        return pA - pB;
                      });

                      sortedTasks.forEach((task: any) => {
                        const date = new Date(task.dueDate);
                        let label = "Quá hạn lâu";
                        if (isToday(date)) label = "Hết hạn hôm nay";
                        else if (isYesterday(date)) label = "Hết hạn hôm qua";
                        else if (isThisWeek(date)) label = "Trong tuần này";
                        if (!groupedTasks[label]) groupedTasks[label] = [];
                        groupedTasks[label].push(task);
                      });

                      return Object.entries(groupedTasks).map(([day, dayTasks]) => (
                        <div key={day} className="space-y-6 relative">
                          <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-white dark:bg-[#191C1E] border-2 border-red-500 z-10 shadow-[0_0_10px_rgba(239,68,68,0.3)]" />
                          <h3 className="text-[10px] font-bold text-red-500/60 dark:text-red-400/50 uppercase tracking-[0.2em] mb-4">
                            {day}
                          </h3>

                          <div className="space-y-4">
                            {dayTasks.slice(0, 3).map((task: any, index: number) => (
                              <div
                                key={typeof task._id === 'object' ? (task._id?.$oid || JSON.stringify(task._id)) : (task._id || `task-${index}`)}
                                onClick={() => handleTaskClick(task)}
                                className="group relative flex flex-col md:flex-row items-center md:items-center gap-5 p-5.5 rounded-[28px] bg-white/70 dark:bg-card/60 backdrop-blur-md border border-red-500/10 dark:border-red-500/10 hover:border-red-500/30 dark:hover:border-red-400/30 transition-all duration-500 cursor-pointer shadow-depth-1 dark:shadow-none"
                              >
                                <div className="flex gap-4 items-center shrink-0">
                                  <div className={cn(
                                    "w-10 h-10 rounded-xl flex items-center justify-center shadow-sm transition-transform duration-500 group-hover:scale-110",
                                    task.status === TaskStatus.DONE ? "bg-emerald-50 text-emerald-600" : "bg-red-50 dark:bg-red-500/5 text-red-500"
                                  )}>
                                    {task.status === TaskStatus.DONE ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                                  </div>
                                </div>

                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-0.5">
                                    <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest text-brand-primary bg-brand-primary/5 dark:bg-brand-primary/10 border-none">
                                      {task.priority || 'NORMAL'}
                                    </Badge>
                                    <span className="text-[9px] font-bold text-[#035D5B] dark:text-[#C7F964] uppercase tracking-wider">
                                      {task.projectId?.name || 'Workspace'}
                                    </span>
                                  </div>
                                  <h4 className="text-base font-bold text-[#191C1E] dark:text-[#E5F4EF] tracking-tight truncate group-hover:text-[#035D5B] dark:group-hover:text-[#C7F964] transition-colors">
                                    {task.title}
                                  </h4>
                                </div>

                                <div className="flex items-center gap-3 shrink-0 md:pl-2">
                                  <div className="flex items-center gap-1.5 text-[9px] font-bold text-red-500 dark:text-red-400 uppercase tracking-wider px-2 py-0.5 bg-red-50 dark:bg-red-500/10 rounded-full border border-red-100 dark:border-red-500/20">
                                    Trễ {formatDistanceToNow(new Date(task.dueDate), { locale: vi })}
                                  </div>
                                  {task.assignedTo && (
                                    <div className="flex -space-x-1.5">
                                      {(Array.isArray(task.assignedTo) ? task.assignedTo : [task.assignedTo]).slice(0, 3).map((member: any, idx: number) => (
                                        <UserAvatar
                                          key={member._id || idx}
                                          user={member}
                                          size="sm"
                                          className="w-7 h-7 border-2 border-white dark:border-[#04100E] shadow-sm"
                                          showShadow={false}
                                        />
                                      ))}
                                    </div>
                                  )}
                                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#035D5B] dark:group-hover:text-[#C7F964] transition-all duration-300" />
                                </div>
                              </div>
                            ))}

                            {dayTasks.length > 3 && (
                              <div
                                onClick={() => setIsOverdueCenterOpen(true)}
                                className="group relative flex items-center justify-between p-6 rounded-[32px] bg-red-500/5 dark:bg-red-500/10 border-2 border-dashed border-red-500/20 hover:border-red-500/50 transition-all duration-500 cursor-pointer overflow-hidden"
                              >
                                <div className="flex items-center gap-4">
                                  <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center text-red-500 shadow-lg group-hover:scale-110 transition-all duration-500">
                                    <Activity className="w-6 h-6" />
                                  </div>
                                  <div className="space-y-0.5">
                                    <div className="text-[10px] font-bold text-red-500 uppercase tracking-widest">Hành động khẩn cấp</div>
                                    <h4 className="text-[15px] font-bold text-slate-900 dark:text-white leading-tight">
                                      Và {dayTasks.length - 3} mục tiêu quan trọng khác đang bị đình trệ...
                                    </h4>
                                  </div>
                                </div>
                                <Button variant="ghost" className="rounded-full bg-white dark:bg-slate-800 hover:bg-red-500 hover:text-white transition-all px-6 h-10 font-bold uppercase text-[9px] tracking-widest shadow-sm">
                                  Điều phối <ArrowRight className="w-3.5 h-3.5 ml-2" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    })()
                  ) : (
                    <div className="text-center py-16 bg-white/50 dark:bg-card/20 rounded-[32px] border border-dashed border-slate-100 dark:border-brand-secondary/10">
                      <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Mọi mục tiêu đã được chinh phục</p>
                    </div>
                  )}
                </div>
              </section>

              {/* Sidebar: 4 Columns on Desktop */}
              <div className="lg:col-span-4 space-y-10">
                {/* Team Members Section */}
                <section className="space-y-6 pb-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-black text-[#035D5B] dark:text-[#C7F964] tracking-tight flex items-center gap-3 uppercase">
                      <Users className="w-5 h-5 text-[#035D5B] dark:text-[#C7F964]" />
                      Đội ngũ
                    </h3>
                    <span className="text-[10px] font-black text-[#035D5B] dark:text-[#C7F964] bg-[#035D5B]/5 dark:bg-[#C7F964]/5 px-3 py-1 rounded-full uppercase tracking-widest">
                      {membersData?.members?.length || 0} Nhân sự
                    </span>
                  </div>
                  <Card className="rounded-[32px] border border-white dark:border-white/10 bg-white/70 dark:bg-card/40 backdrop-blur-xl shadow-[0_12px_40px_-12px_rgba(0,0,0,0.12)] dark:shadow-[0_12px_40px_-12px_rgba(0,0,0,0.4)] p-8 transition-all duration-500 glow-hover-primary overflow-visible">
                    <div className="grid grid-cols-4 gap-x-6 gap-y-10">
                      {membersData?.members ? (
                        membersData.members.slice(0, 8).map((member: any, idx: number) => {
                          const completedTasks = member.taskStats?.completedTasks || 0;
                          const overdueTasks = member.taskStats?.overdueTasks || 0;
                          const totalTasks = member.taskStats?.totalTasks || 0;
                          // Đang làm = Tổng - Đã xong - Trễ hạn
                          const doingTasks = Math.max(0, totalTasks - completedTasks - overdueTasks);

                          return (
                            <div key={member._id?.toString() || member.userId?._id?.toString() || `member-${idx}`} className="group relative flex flex-col items-center pb-4 hover:z-[100]">
                              {/* Realistic Contact Shadow (Bóng nhỏ tách rời) */}
                              <div className="absolute bottom-2 w-10 h-1.5 bg-black/30 dark:bg-black/60 blur-[4px] rounded-[50%] transition-all duration-500 group-hover:scale-90 group-hover:opacity-60" />

                              <div className="relative z-10 hover:-translate-y-2 transition-all duration-500">
                                <UserAvatar
                                  user={member}
                                  size="lg"
                                  showShadow={false}
                                  className="w-14 h-14 cursor-pointer bg-white dark:bg-slate-800"
                                />
                                
                                {/* Task Stats Badges */}
                                {doingTasks + overdueTasks > 0 && (
                                  <div className="absolute -top-1 -right-1 flex flex-col gap-1 items-end pointer-events-none">
                                    {overdueTasks > 0 && (
                                      <div className="px-1.5 py-0.5 rounded-full bg-red-500 text-[8px] font-black text-white shadow-lg border border-white dark:border-slate-900 animate-pulse">
                                        {overdueTasks}
                                      </div>
                                    )}
                                    {doingTasks > 0 && (
                                      <div className="px-1.5 py-0.5 rounded-full bg-[#C7F964] text-[8px] font-black text-[#04100E] shadow-lg border border-white dark:border-slate-900">
                                        {doingTasks}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>

                              <div className="absolute -top-14 left-1/2 -translate-x-1/2 scale-75 group-hover:scale-100 transition-all duration-500 bg-[#191C1E] dark:bg-[#C7F964] text-white dark:text-[#04100E] p-3 rounded-2xl shadow-2xl shadow-black/20 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none tracking-tight z-[110]">
                                <div className="text-[12px] font-black mb-1">{member.userId?.name || member.name || 'Thành viên'}</div>
                                <div className="flex gap-3 text-[9px] font-bold uppercase tracking-widest opacity-80">
                                  <span className="flex items-center gap-1">
                                    <div className="w-1 h-1 rounded-full bg-blue-400" />
                                    {member.taskStats?.totalTasks || 0} Tổng
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <div className="w-1 h-1 rounded-full bg-[#C7F964]" />
                                    {doingTasks} Đang làm
                                  </span>
                                  {overdueTasks > 0 && (
                                    <span className="flex items-center gap-1 text-red-400">
                                      <div className="w-1 h-1 rounded-full bg-red-500" />
                                      {overdueTasks} Trễ hạn
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <p className="col-span-4 text-center text-xs text-slate-400 py-4 uppercase font-bold tracking-widest">Chưa có nhân sự</p>
                      )}
                      {isAdminOrOwner && (
                        <div className="flex flex-col items-center justify-start group relative pb-4 hover:z-[100]">
                          {/* Realistic Contact Shadow for Button */}
                          <div className="absolute bottom-2 w-10 h-1.5 bg-black/30 dark:bg-black/50 blur-[4px] rounded-[50%] transition-all duration-500 group-hover:scale-90 group-hover:opacity-60" />

                          <button className="w-14 h-14 rounded-full border-2 border-dashed border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-400 hover:border-[#035D5B] hover:text-[#035D5B] dark:hover:text-[#C7F964] bg-white dark:bg-slate-800 transition-all duration-500 hover:-translate-y-2 z-10 relative">
                            <Plus className="w-6 h-6 transition-transform duration-500 group-hover:rotate-90" />
                          </button>
                        </div>
                      )}
                    </div>
                  </Card>
                </section>

                {/* Workplace Pulse / Analytics Sidebar */}
                <section className="space-y-6 pb-4">
                  <h3 className="text-xl font-black text-[#035D5B] dark:text-[#C7F964] tracking-tight flex items-center gap-3 uppercase">
                    <Activity className="w-5 h-5 text-amber-500" />
                    Nhịp độ
                  </h3>
                  <Card className="group relative rounded-[40px] border border-[#035D5B]/30 dark:border-white/10 bg-[#035D5B]/80 dark:bg-[#035D5B]/40 backdrop-blur-2xl p-8 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.12)] hover:shadow-[0_30px_80px_-20px_rgba(0,0,0,0.2)] dark:shadow-[0_12px_40px_-12px_rgba(0,0,0,0.4)] dark:hover:shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)] transition-all duration-700 overflow-hidden text-white">
                    {/* Fixed Ambient Colors behind the glass but inside the card to ensure blur quality */}
                    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                      <div className="absolute -right-10 -top-10 w-40 h-40 bg-teal-400/20 rounded-full blur-[60px]" />
                      <div className="absolute right-1/4 bottom-0 w-32 h-32 bg-amber-400/20 rounded-full blur-[50px]" />
                      <div className="absolute -left-10 top-1/2 w-40 h-40 bg-purple-500/10 rounded-full blur-[70px]" />
                    </div>

                    {/* Glass Shine Surface */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent z-[1] pointer-events-none" />

                    <div className="space-y-6 relative z-10">
                      <div>
                        <p className="text-[10px] font-black text-white/50 dark:text-brand-primary/80 uppercase tracking-[0.2em] mb-2">Dự án hoàn tất</p>
                        <div className="flex items-end gap-2">
                          <span className="text-5xl font-black text-white tracking-tighter drop-shadow-sm">
                            {allProjectsData?.projects?.filter((p: any) => p.status === 'COMPLETED').length || 0}
                          </span>
                          <span className="text-xs font-bold text-white/30 mb-1.5 uppercase tracking-widest">
                            / {allProjectsData?.pagination?.totalCount || allProjectsData?.projects?.length || 0} TỔNG THỂ
                          </span>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="h-2 w-full bg-black/20 dark:bg-white/5 rounded-full overflow-hidden p-[1px] border border-white/5">
                          <div
                            className="h-full bg-gradient-to-r from-teal-400 via-[#C7F964] to-emerald-400 rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(199,249,100,0.5)]"
                            style={{ width: `${(allProjectsData?.projects?.filter((p: any) => p.status === 'COMPLETED').length / (allProjectsData?.pagination?.totalCount || allProjectsData?.projects?.length || 1)) * 100}%` }}
                          />
                        </div>
                        <div className="flex justify-between items-center">
                          <p className="text-[10px] font-medium text-white/80 leading-relaxed uppercase tracking-widest">
                            Nhịp độ vận hành tối ưu
                          </p>
                          <span className="text-[10px] font-black text-[#C7F964] drop-shadow-md">
                            {Math.round((allProjectsData?.projects?.filter((p: any) => p.status === 'COMPLETED').length / (allProjectsData?.pagination?.totalCount || allProjectsData?.projects?.length || 1)) * 100)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                </section>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="focus" className="mt-0">
          <ProjectAnalyticsTab 
            workspaceId={workspaceId} 
            projects={allProjectsData?.projects || []} 
            onTaskClick={handleTaskClick}
          />
        </TabsContent>

        <TabsContent value="project" className="mt-0 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <WorkspaceActivityTab workspaceId={workspaceId} />
        </TabsContent>

      </Tabs>

      <TaskDetailModal
        task={selectedTask}
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onUpdate={handleUpdateTask}
        onDelete={handleDeleteTask}
        members={membersData?.members || []}
        tasks={tasksData?.tasks || []}
        isAdminOrOwner={isAdminOrOwner}
      />
      <ProjectFormDialog
        open={projectFormOpen}
        onClose={() => {
          setProjectFormOpen(false);
          setEditingProject(null);
        }}
        workspaceId={workspaceId}
        project={editingProject}
      />

      <Dialog open={!!deletingProject} onOpenChange={(v) => !v && setDeletingProject(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Xác nhận xoá dự án</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <p className="text-sm text-slate-600">
              Dự án <span className="font-bold text-slate-900">"{deletingProject?.name}"</span> cùng tất cả công việc bên trong sẽ được chuyển vào thùng rác.
            </p>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="ghost" onClick={() => setDeletingProject(null)} className="rounded-xl font-bold">Huỷ</Button>
              <Button
                variant="destructive"
                onClick={() => deleteMutation.mutate()}
                disabled={deleteMutation.isPending}
                className="rounded-xl font-bold"
              >
                {deleteMutation.isPending ? "Đang xoá..." : "Xác nhận xoá"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <OverdueCommandCenter
        isOpen={isOverdueCenterOpen}
        onOpenChange={setIsOverdueCenterOpen}
        workspaceId={workspaceId}
        onTaskClick={handleTaskClick}
        projects={projectsData?.projects || []}
      />
    </div>
  );
}
