'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { taskService } from '@/services/task.service';
import { projectService } from '@/services/project.service';
import { PhaseService } from '@/services/phase.service';
import { TaskRow } from '@/components/task/TaskRow';
import { TaskFilters } from '@/components/task/TaskFilters';
import { Loader2, Inbox, Plus, TrendingUp, Clock, Zap } from 'lucide-react';
import Loader from "@/components/ui/Loader";
import { Button } from '@/components/ui/button';
import { Task, TaskStatus } from '@/types/task';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TaskDetailModal } from '@/components/task/TaskDetailModal';
import { CreateTaskModal } from '@/components/task/CreateTaskModal';
import { workspaceService } from '@/services/workspace.service';
import { toast } from 'sonner';
import { useWorkspaceRole } from '@/hooks/useWorkspaceRole';
import { useAuthStore } from '@/stores/auth.store';

export default function TaskListPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const workspaceId = params.workspaceId as string;
  const targetTaskId = searchParams.get('taskId');
  const queryClient = useQueryClient();
  const router = useRouter();
  const { isAdminOrOwner } = useWorkspaceRole();

  const { user } = useAuthStore();
  const [filters, setFilters] = useState<{
    search: string;
    status: string;
    priority: string;
    projectId: string;
    assigneeIds: string[];
    parentId: string;
    phaseId: string;
  }>({
    search: '',
    status: 'all',
    priority: 'all',
    projectId: 'all',
    assigneeIds: user?.id ? [user.id] : [],
    parentId: 'all',
    phaseId: 'all',
  });

  // Đảm bảo cập nhật filter khi user load xong (nếu chưa có ở lần render đầu)
  useEffect(() => {
    if (user?.id && filters.assigneeIds.length === 0 && filters.search === '' && filters.status === 'all' && filters.priority === 'all' && filters.projectId === 'all' && filters.parentId === 'all' && filters.phaseId === 'all') {
      setFilters(prev => ({ ...prev, assigneeIds: [user.id] }));
    }
  }, [user?.id]);

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedFeaturedProjectId, setSelectedFeaturedProjectId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['workspace-tasks-list', workspaceId, filters],
    queryFn: () => taskService.getTasksByWorkspace(workspaceId, {
      ... (filters.status !== 'all' && { status: filters.status }),
      ... (filters.priority !== 'all' && { priority: filters.priority }),
      ... (filters.projectId !== 'all' && { projectId: filters.projectId }),
      ... (filters.assigneeIds.length > 0 && { assignedTo: filters.assigneeIds.join(',') }),
      ... (filters.parentId !== 'all' && { parentId: filters.parentId === 'root' ? '' : filters.parentId }),
      ... (filters.phaseId !== 'all' && { phaseId: filters.phaseId }),
      ... (filters.search && { keyword: filters.search }),
      pageSize: 50
    }),
    enabled: !!workspaceId,
  });

  const tasks = data?.tasks || [];

  // Tự động mở Task nếu có taskId trong URL
  useEffect(() => {
    if (targetTaskId && workspaceId) {
      // 1. Tìm trong danh sách hiện tại trước
      const taskInList = tasks.find((t: Task) => t._id === targetTaskId);
      if (taskInList) {
        setSelectedTask(taskInList);
        setIsDrawerOpen(true);
        return;
      }

      // 2. Nếu không có trong danh sách (do filter), fetch trực tiếp
      const fetchAndOpenTask = async () => {
        try {
          // Thử tìm trong project của task (nếu biết) hoặc fetch đại diện
          // Ở trang TaskListPage, ta có thể fetch trực tiếp task bằng ID nếu API hỗ trợ không cần projectId
          // Hoặc dùng queryClient để lấy từ cache toàn cục
          const task = await taskService.getTaskById(workspaceId, 'any', targetTaskId);
          if (task) {
            setSelectedTask(task);
            setIsDrawerOpen(true);
          }
        } catch (error) {
          console.error("Failed to fetch target task for list page:", error);
        }
      };
      
      // Chỉ fetch nếu tasks đã load xong mà không thấy
      if (!isLoading) {
        fetchAndOpenTask();
      }
    }
  }, [targetTaskId, tasks, workspaceId, isLoading]);

  const { data: projectsData } = useQuery({
    queryKey: ['workspace-projects', workspaceId],
    queryFn: () => projectService.getProjectsByWorkspace(workspaceId),
    enabled: !!workspaceId,
  });

  const { data: membersData } = useQuery({
    queryKey: ['workspace-members', workspaceId],
    queryFn: () => workspaceService.getMembers(workspaceId),
    enabled: !!workspaceId,
  });

  const { data: allTasksData } = useQuery({
    queryKey: ['workspace-all-tasks', workspaceId],
    queryFn: () => taskService.getTasksByWorkspace(workspaceId, { pageSize: 1000 }), // Lấy nhiều hơn để fill filter
    enabled: !!workspaceId,
  });

  const { data: phasesData } = useQuery({
    queryKey: ['workspace-phases', workspaceId],
    queryFn: () => PhaseService.getPhasesByWorkspace(workspaceId),
    enabled: !!workspaceId,
  });

  const members = membersData?.members || [];
  const projects = projectsData?.projects || [];
  const phases = phasesData?.data || [];
  const allTasks = allTasksData?.tasks || [];

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsDrawerOpen(true);
  };

  const handleUpdateTask = async (taskId: string, updateData: any) => {
    try {
        const pId = typeof selectedTask?.projectId === 'object' 
          ? (selectedTask.projectId as any)._id 
          : selectedTask?.projectId;

        const updatedTask = await taskService.updateTask(workspaceId, pId || '', taskId, updateData);
        
        // 1. Cập nhật tất cả các danh sách task trong cache (bao quát cả Task List và Dashboard Overdue)
        queryClient.setQueriesData({ queryKey: ['workspace-tasks', workspaceId] }, (oldData: any) => {
            if (!oldData || !oldData.tasks) return oldData;
            return {
                ...oldData,
                tasks: oldData.tasks.map((t: Task) => t._id === taskId ? { ...t, ...updatedTask } : t)
            };
        });


        // 2. Cập nhật cache cho task lẻ nếu đang mở (nếu cần)
        queryClient.setQueryData(['task', workspaceId, taskId], updatedTask);

        // 3. Invalidate analytics & projects vì status thay đổi có thể ảnh hưởng đến tiến độ
        queryClient.invalidateQueries({ queryKey: ['workspace-analytics', workspaceId] });
        queryClient.invalidateQueries({ queryKey: ['workspace-analytics-history', workspaceId] });
        queryClient.invalidateQueries({ queryKey: ['projectAnalytics', workspaceId] });
        queryClient.invalidateQueries({ queryKey: ['projectAnalyticsHistory', workspaceId] });
        queryClient.invalidateQueries({ queryKey: ['workspace-projects', workspaceId] });
        
        // Refresh project board tasks
        const finalProjectId = typeof updatedTask?.projectId === 'object' ? (updatedTask.projectId as any)?._id : updatedTask?.projectId;
        if (finalProjectId) {
            queryClient.invalidateQueries({ queryKey: ['project-tasks', workspaceId, finalProjectId] });
        }

        toast.success("Đã cập nhật công việc");
    } catch (error) {
        toast.error("Lỗi khi cập nhật công việc");
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa công việc này?")) return;
    try {
        await taskService.deleteTask(workspaceId, selectedTask?.projectId?._id || '', taskId);
        setIsDrawerOpen(false);

        // 1. Xóa khỏi tất cả các danh sách task trong cache
        queryClient.setQueriesData({ queryKey: ['workspace-tasks-list', workspaceId] }, (oldData: any) => {
            if (!oldData || !oldData.tasks) return oldData;
            return {
                ...oldData,
                tasks: oldData.tasks.filter((t: Task) => t._id !== taskId),
                pagination: {
                    ...oldData.pagination,
                    totalCount: Math.max(0, (oldData.pagination?.totalCount || 1) - 1)
                }
            };
        });

        // 2. Cập nhật số lượng task của project trong cache projects
        const pId = selectedTask?.projectId?._id;
        if (pId) {
            queryClient.setQueryData(['workspace-projects', workspaceId], (oldData: any) => {
                if (!oldData) return oldData;
                return {
                    ...oldData,
                    projects: oldData.projects.map((p: any) => 
                        p._id === pId ? { ...p, totalTasks: Math.max(0, (p.totalTasks || 1) - 1) } : p
                    )
                };
            });
        }

        // 3. Invalidate analytics
        queryClient.invalidateQueries({ queryKey: ['workspace-analytics', workspaceId] });
        queryClient.invalidateQueries({ queryKey: ['workspace-analytics-history', workspaceId] });
        queryClient.invalidateQueries({ queryKey: ['projectAnalytics', workspaceId] });
        queryClient.invalidateQueries({ queryKey: ['projectAnalyticsHistory', workspaceId] });
        
        toast.success("Đã xóa công việc");
    } catch (error) {
        toast.error("Lỗi khi xóa công việc");
    }
  };

  const handleCreateTask = async (pId: string, taskData: any) => {
    try {
        const newTask = await taskService.createTask(workspaceId, pId, taskData);
        const subtasksCount = taskData.subtasks?.length || 0;

        // 1. Thêm vào các danh sách task trong cache (ưu tiên các list không filter hoặc filter phù hợp)
        queryClient.setQueriesData({ queryKey: ['workspace-tasks-list', workspaceId] }, (oldData: any) => {
            if (!oldData || !oldData.tasks) return oldData;
            // Chỉ thêm vào nếu là list không filter hoặc filter search rỗng
            return {
                ...oldData,
                tasks: [newTask, ...oldData.tasks],
                pagination: {
                    ...oldData.pagination,
                    totalCount: (oldData.pagination?.totalCount || 0) + 1
                }
            };
        });

        // 2. Cập nhật số lượng task của dự án tương ứng trong cache
        queryClient.setQueryData(['workspace-projects', workspaceId], (oldData: any) => {
            if (!oldData) return oldData;
            return {
                ...oldData,
                projects: oldData.projects.map((p: any) => 
                    p._id === pId ? { ...p, totalTasks: (p.totalTasks || 0) + 1 } : p
                )
            };
        });

        // 3. Invalidate analytics
        queryClient.invalidateQueries({ queryKey: ['workspace-analytics', workspaceId] });
        queryClient.invalidateQueries({ queryKey: ['workspace-analytics-history', workspaceId] });
        queryClient.invalidateQueries({ queryKey: ['projectAnalytics', workspaceId] });
        queryClient.invalidateQueries({ queryKey: ['projectAnalyticsHistory', workspaceId] });
        
        toast.success(subtasksCount > 0 
            ? `Đã tạo công việc và ${subtasksCount} nhiệm vụ con!` 
            : "Đã tạo công việc mới"
        );
    } catch (error) {
        toast.error("Lỗi khi tạo công việc");
    }
  };


  const clearFilters = () => {
    setFilters({
        search: '',
        status: 'all',
        priority: 'all',
        projectId: 'all',
        assigneeIds: [],
        parentId: 'all',
        phaseId: 'all',
    });
  };

  const featuredProject = projects.length > 0 
    ? (selectedFeaturedProjectId 
        ? projects.find((p: any) => p._id === selectedFeaturedProjectId) || [...projects].sort((a: any, b: any) => (b.totalTasks || 0) - (a.totalTasks || 0))[0]
        : [...projects].sort((a: any, b: any) => (b.totalTasks || 0) - (a.totalTasks || 0))[0])
    : null;

  const featuredProjectPhasesCount = featuredProject 
    ? phases.filter((p: any) => (typeof p.projectId === 'string' ? p.projectId === featuredProject._id : p.projectId?._id === featuredProject._id)).length 
    : 0;

  // Lọc các task của user hiện tại trong dự án nổi bật
  const myTasksInFeaturedProject = allTasks.filter((t: Task) => {
    if (!featuredProject || !user?.id) return false;
    
    const tProjId = typeof t.projectId === 'object' && t.projectId !== null
      ? (t.projectId as any)._id
      : t.projectId;
      
    const isProjMatch = tProjId === featuredProject._id;
    
    const isAssignedToMe = t.assignedTo?.some((u: any) => {
      const uId = typeof u === 'object' && u !== null ? u._id : u;
      return uId === user.id;
    });
    
    return isProjMatch && isAssignedToMe;
  });

  // 1. Ô 1: Tính tỉ lệ hoàn thành công việc của tôi
  const myTotalTasksCount = myTasksInFeaturedProject.length;
  const myCompletedTasksCount = myTasksInFeaturedProject.filter((t: Task) => 
    t.status === TaskStatus.COMPLETED || t.status === TaskStatus.DONE
  ).length;
  const myCompletionRate = myTotalTasksCount > 0 
    ? Math.round((myCompletedTasksCount / myTotalTasksCount) * 100) 
    : 0;

  // Lọc các task đang hoạt động (chưa hoàn thành, chưa hủy) của tôi trong dự án nổi bật
  const myActiveTasksInFeaturedProject = myTasksInFeaturedProject
    .filter((t: Task) => 
      t.status !== TaskStatus.COMPLETED && 
      t.status !== TaskStatus.DONE && 
      t.status !== TaskStatus.CANCELLED
    )
    .sort((a: Task, b: Task) => {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });

  // 2. Ô 2: Tìm công việc có hạn chót gần nhất trong tương lai hoặc hôm nay (không lấy task đã quá hạn trước ngày hôm nay)
  const nextDeadlineTask = myActiveTasksInFeaturedProject.find((t: Task) => {
    if (!t.dueDate) return false;
    const taskTime = new Date(t.dueDate).getTime();
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    return taskTime >= startOfToday.getTime();
  });

  // Tính số ngày/giờ còn lại cho task sắp đến hạn
  let deadlineText = 'Không có hạn chót';
  let deadlineBadgeColor = 'bg-slate-200/80 dark:bg-white/5 text-slate-600 dark:text-slate-400 font-extrabold';
  
  if (nextDeadlineTask && nextDeadlineTask.dueDate) {
    const diffTime = new Date(nextDeadlineTask.dueDate).getTime() - Date.now();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffTime < 0) {
      const absDays = Math.abs(diffDays);
      deadlineText = absDays === 0 ? 'Quá hạn hôm nay' : `Quá hạn ${absDays} ngày`;
      deadlineBadgeColor = 'bg-rose-500/10 text-rose-750 dark:text-rose-450 font-black shadow-[0_0_8px_rgba(244,63,94,0.1)]';
    } else if (diffDays === 0) {
      deadlineText = 'Hết hạn hôm nay';
      deadlineBadgeColor = 'bg-amber-500/10 text-amber-800 dark:text-amber-400 font-black animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.1)]';
    } else if (diffDays === 1) {
      deadlineText = 'Hạn ngày mai';
      deadlineBadgeColor = 'bg-amber-500/10 text-amber-800 dark:text-amber-400 font-black shadow-[0_0_8px_rgba(245,158,11,0.1)]';
    } else {
      deadlineText = `Còn ${diffDays} ngày`;
      deadlineBadgeColor = 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 font-black shadow-[0_0_8px_rgba(16,185,129,0.1)]';
    }
  }

  // 3. Ô 3: Lấy tối đa 2 active tasks
  const topActiveTasks = myActiveTasksInFeaturedProject.slice(0, 2);

  // Danh sách công việc trễ hạn (của tôi)
  const overdueTasks = myTasksInFeaturedProject.filter((t: Task) => {
    if (t.status === TaskStatus.COMPLETED || t.status === TaskStatus.DONE || t.status === TaskStatus.CANCELLED) return false;
    if (!t.dueDate) return false;

    const taskTime = new Date(t.dueDate).getTime();
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    return taskTime < startOfToday.getTime(); // Overdue = dueDate is strictly before today
  }).sort((a: Task, b: Task) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime());

  // 4. Khung 2 (Ô giữa): Công việc theo giai đoạn
  const featuredProjectPhasesList = featuredProject 
    ? phases.filter((p: any) => (typeof p.projectId === 'string' ? p.projectId === featuredProject._id : p.projectId?._id === featuredProject._id))
    : [];

  const tasksByPhase = featuredProjectPhasesList.map((phase: any) => {
    const count = myTasksInFeaturedProject.filter((t: Task) => {
      const tPhaseId = typeof t.phaseId === 'object' && t.phaseId !== null ? (t.phaseId as any)._id : t.phaseId;
      return tPhaseId === phase._id;
    }).length;
    return {
      ...phase,
      count
    };
  }).sort((a: any, b: any) => new Date(a.startDate || 0).getTime() - new Date(b.startDate || 0).getTime());
  
  const maxTasksInPhase = Math.max(...tasksByPhase.map((p: any) => p.count), 1);

  return (
    <div className="flex flex-col h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-extrabold text-brand-primary tracking-tight">Công việc của tôi</h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium">Quản lý và theo dõi tiến độ công việc tập trung.</p>
          </div>
        </div>

      {/* Bento Grid Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-10 gap-8 mt-8 mb-8">
        {/* Khung dự án (6 cột, 2 dòng) */}
        <div className="md:col-span-6 md:row-span-2 bg-white/70 dark:bg-[#071613]/80 backdrop-blur-[16px] rounded-[48px] overflow-hidden flex flex-col relative min-h-[300px] shadow-[0_40px_60px_-10px_rgba(0,68,66,0.04),0_0_2px_rgba(0,68,66,0.04),inset_0_1px_0_rgba(255,255,255,0.6)] dark:shadow-none">
          {featuredProject ? (
            <>
              {featuredProject.coverUrl ? (
                <div className="w-full h-full relative flex flex-col justify-between">
                  <img 
                    src={featuredProject.coverUrl} 
                    alt={featuredProject.name} 
                    className="absolute inset-0 w-full h-full object-cover z-0"
                    style={{ objectPosition: `${featuredProject.coverPositionX}% ${featuredProject.coverPositionY}%` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10 z-0" />
                  
                  <div className="relative z-10 flex items-center gap-2 px-8 pt-6 pb-2 mt-auto">
                    <span className="text-xl bg-white/20 backdrop-blur-md rounded-xl p-2 shadow-lg border border-white/10">{featuredProject.emoji || '📁'}</span>
                    <h3 className="text-white font-black text-xl tracking-tight drop-shadow-md">{featuredProject.name}</h3>
                  </div>

                  <div className="relative z-10 px-8 pb-8 pt-0">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="flex flex-col gap-1.5 p-6 bg-white/10 hover:bg-white/20 transition-all dark:bg-black/30 backdrop-blur-md rounded-[32px] text-white shadow-xl">
                        <span className="text-[9px] uppercase font-black tracking-widest flex items-center gap-1 opacity-80">
                          <div className="w-1 h-1 rounded-full bg-white/80 shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                          Thời gian
                        </span>
                        <span className="text-xs font-bold truncate">
                          {featuredProject.startDate && featuredProject.endDate 
                            ? `${new Date(featuredProject.startDate).toLocaleDateString('vi-VN')} - ${new Date(featuredProject.endDate).toLocaleDateString('vi-VN')}`
                            : 'Vô thời hạn'}
                        </span>
                      </div>
                      <div className="flex flex-col gap-1.5 p-6 bg-white/10 hover:bg-white/20 transition-all dark:bg-black/30 backdrop-blur-md rounded-[32px] text-white shadow-xl">
                        <span className="text-[9px] uppercase font-black tracking-widest flex items-center gap-1 opacity-80">
                          <div className="w-1 h-1 rounded-full bg-white/80 shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                          Giai đoạn
                        </span>
                        <span className="text-lg font-black">{featuredProjectPhasesCount} <span className="text-[10px] font-bold opacity-80">phase</span></span>
                      </div>
                      <div className="flex flex-col gap-1.5 p-6 bg-white/10 hover:bg-white/20 transition-all dark:bg-black/30 backdrop-blur-md rounded-[32px] text-white shadow-xl">
                        <span className="text-[9px] uppercase font-black tracking-widest flex items-center gap-1 opacity-80">
                          <div className="w-1 h-1 rounded-full bg-white/80 shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                          Công việc
                        </span>
                        <span className="text-lg font-black">{featuredProject.totalTasks || 0} <span className="text-[10px] font-bold opacity-80">task</span></span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-brand-primary to-brand-tertiary flex flex-col justify-between relative overflow-hidden">
                  <div className="absolute inset-0 bg-black/10 z-0"></div>
                  
                  <div className="relative z-10 flex items-center gap-2 px-8 pt-6 pb-2 mt-auto">
                    <span className="text-xl bg-white/20 backdrop-blur-md rounded-xl p-2 shadow-lg border border-white/20">{featuredProject.emoji || '📁'}</span>
                    <h3 className="text-white font-black text-xl tracking-tight drop-shadow-md">{featuredProject.name}</h3>
                  </div>
                  
                  <div className="relative z-10 px-8 pb-8 pt-0">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="flex flex-col gap-1.5 p-6 bg-white/20 hover:bg-white/30 transition-all backdrop-blur-md rounded-[32px] text-white shadow-xl">
                        <span className="text-[9px] uppercase font-black tracking-widest flex items-center gap-1 opacity-95">
                          <div className="w-1 h-1 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                          Thời gian
                        </span>
                        <span className="text-xs font-bold truncate">
                          {featuredProject.startDate && featuredProject.endDate 
                            ? `${new Date(featuredProject.startDate).toLocaleDateString('vi-VN')} - ${new Date(featuredProject.endDate).toLocaleDateString('vi-VN')}`
                            : 'Vô thời hạn'}
                        </span>
                      </div>
                      <div className="flex flex-col gap-1.5 p-6 bg-white/20 hover:bg-white/30 transition-all backdrop-blur-md rounded-[32px] text-white shadow-xl">
                        <span className="text-[9px] uppercase font-black tracking-widest flex items-center gap-1 opacity-95">
                          <div className="w-1 h-1 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                          Giai đoạn
                        </span>
                        <span className="text-lg font-black">{featuredProjectPhasesCount} <span className="text-[10px] font-bold opacity-90">phase</span></span>
                      </div>
                      <div className="flex flex-col gap-1.5 p-6 bg-white/20 hover:bg-white/30 transition-all backdrop-blur-md rounded-[32px] text-white shadow-xl">
                        <span className="text-[9px] uppercase font-black tracking-widest flex items-center gap-1 opacity-95">
                          <div className="w-1 h-1 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                          Công việc
                        </span>
                        <span className="text-lg font-black">{featuredProject.totalTasks || 0} <span className="text-[10px] font-bold opacity-90">task</span></span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-400">
              <span className="text-5xl opacity-50">📁</span>
              <p className="font-bold text-sm">Chưa có dự án nổi bật</p>
            </div>
          )}
        </div>

        {/* Khối bên phải dòng 1 (2 khối, mỗi khối 2 cột) */}
        <div className="md:col-span-2 md:row-span-1 bg-white/70 dark:bg-[#071613]/80 backdrop-blur-[16px] rounded-[48px] p-8 flex flex-col justify-between shadow-[0_40px_60px_-10px_rgba(0,68,66,0.04),0_0_2px_rgba(0,68,66,0.04),inset_0_1px_0_rgba(255,255,255,0.6)] dark:shadow-none hover:shadow-[0_40px_60px_-5px_rgba(0,68,66,0.08)] transition-all duration-300 hover:-translate-y-1 min-h-[160px]">
          <span className="text-[#3F4948] dark:text-[#A8EFEC] font-bold text-[11px] uppercase tracking-[0.2em] block flex items-center gap-1.5"><TrendingUp className="w-3.5 h-3.5 text-brand-primary" />Tiến độ của tôi</span>
          
          <div className="flex items-center justify-between gap-3 my-auto pt-2">
            <div className="flex flex-col">
              <span className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight drop-shadow-[0_2px_8px_rgba(59,130,246,0.15)]">{myCompletionRate}%</span>
              <span className="text-[11px] text-slate-600 dark:text-slate-350 font-extrabold mt-0.5">
                {myTotalTasksCount > 0 ? `${myCompletedTasksCount}/${myTotalTasksCount} hoàn thành` : 'Chưa có task'}
              </span>
            </div>
            
            <div className="relative flex items-center justify-center w-14 h-14 flex-shrink-0">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="28"
                  cy="28"
                  r="24"
                  className="stroke-slate-200/50 dark:stroke-[#172925]/80"
                  strokeWidth="4"
                  fill="transparent"
                />
                <circle
                  cx="28"
                  cy="28"
                  r="24"
                  className="stroke-brand-primary transition-all duration-700 ease-out"
                  strokeWidth="4"
                  fill="transparent"
                  strokeDasharray={2 * Math.PI * 24}
                  strokeDashoffset={2 * Math.PI * 24 * (1 - myCompletionRate / 100)}
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="md:col-span-2 md:row-span-1 bg-white/70 dark:bg-[#071613]/80 backdrop-blur-[16px] rounded-[48px] p-8 flex flex-col justify-between shadow-[0_40px_60px_-10px_rgba(0,68,66,0.04),0_0_2px_rgba(0,68,66,0.04),inset_0_1px_0_rgba(255,255,255,0.6)] dark:shadow-none hover:shadow-[0_40px_60px_-5px_rgba(0,68,66,0.08)] transition-all duration-300 hover:-translate-y-1 min-h-[160px]">
          <span className="text-[#3F4948] dark:text-[#A8EFEC] font-bold text-[11px] uppercase tracking-[0.2em] block flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-amber-500" />Hạn chót tiếp theo</span>
          
          {nextDeadlineTask ? (
            <div 
              onClick={() => handleTaskClick(nextDeadlineTask)}
              className="flex flex-col gap-2 cursor-pointer group/item my-auto pt-2"
            >
              <div className="flex">
                <span className={`text-[9.5px] font-black uppercase px-2 py-0.5 rounded-md ${deadlineBadgeColor}`}>
                  {deadlineText}
                </span>
              </div>
              <h4 className="text-base font-extrabold font-manrope text-slate-900 dark:text-slate-100 group-hover/item:text-brand-primary transition-colors line-clamp-2 leading-relaxed mt-1">
                {nextDeadlineTask.title}
              </h4>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5 my-auto pt-2">
              <div className="flex animate-pulse">
                <span className={`text-[9.5px] font-black uppercase px-2 py-0.5 rounded-md ${deadlineBadgeColor}`}>
                  {deadlineText}
                </span>
              </div>
              <h4 className="text-base font-bold text-slate-500 dark:text-slate-400 line-clamp-1 mt-1">
                Mọi việc đã hoàn thành
              </h4>
            </div>
          )}
        </div>

        {/* Khối bên phải dòng 2 (1 khối lớn, 4 cột) */}
        <div className="md:col-span-4 md:row-span-1 bg-white/70 dark:bg-[#071613]/80 backdrop-blur-[16px] rounded-[48px] p-8 flex flex-col justify-between shadow-[0_40px_60px_-10px_rgba(0,68,66,0.04),0_0_2px_rgba(0,68,66,0.04),inset_0_1px_0_rgba(255,255,255,0.6)] dark:shadow-none min-h-[160px]">
          <span className="text-[#3F4948] dark:text-[#A8EFEC] font-bold text-[11px] uppercase tracking-[0.2em] block mb-4 flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-rose-500" />Công việc đang làm</span>
          
          <div className="flex-1 grid grid-cols-2 gap-4 items-center">
            {topActiveTasks.length > 0 ? (
              topActiveTasks.map((task: Task) => {
                let progressWidth = '0%';
                let progressColor = 'bg-slate-400 dark:bg-slate-500';
                
                if (task.status === TaskStatus.TODO) {
                  progressWidth = '20%';
                  progressColor = 'bg-slate-400 dark:bg-slate-500';
                } else if (task.status === TaskStatus.IN_PROGRESS) {
                  progressWidth = '60%';
                  progressColor = 'bg-brand-primary dark:bg-brand-secondary';
                } else if (task.status === TaskStatus.INREVIEW) {
                  progressWidth = '85%';
                  progressColor = 'bg-brand-primary dark:bg-brand-secondary';
                } else if (task.status === TaskStatus.BACKLOG) {
                  progressWidth = '10%';
                  progressColor = 'bg-slate-300 dark:bg-slate-700';
                }

                return (
                  <div 
                    key={task._id}
                    onClick={() => handleTaskClick(task)}
                    className="flex flex-col gap-2.5 p-6 bg-slate-100/65 dark:bg-[#172925]/85 rounded-[32px] hover:bg-slate-100 dark:hover:bg-[#172925] hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(0,0,0,0.03)] dark:hover:shadow-none transition-all duration-300 cursor-pointer group"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-[9px] font-black text-slate-650 dark:text-slate-350 bg-slate-200/60 dark:bg-[#071613] px-1.5 py-0.5 rounded border-none font-mono flex-shrink-0">
                          {task.taskCode}
                        </span>
                        <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 group-hover:text-brand-primary transition-colors truncate">
                          {task.title}
                        </h4>
                      </div>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full h-1.5 bg-slate-200/50 dark:bg-[#071613] rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${progressColor} transition-all duration-500`}
                        style={{ width: progressWidth }}
                      />
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 dark:text-slate-400">
                      <span>Trạng thái: <span className="text-slate-700 dark:text-slate-300 capitalize font-extrabold">{task.status.toLowerCase().replace('_', ' ')}</span></span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-2 flex flex-col items-center justify-center py-2 text-center text-slate-400 dark:text-slate-500">
                <span className="text-xl">✨</span>
                <span className="text-[10px] font-bold mt-1">Tuyệt vời! Bạn không có task dở dang</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* New 3-Column Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
        {/* Column 1: Danh sách Project */}
        <div className="bg-white/70 dark:bg-[#071613]/80 backdrop-blur-[16px] rounded-[48px] p-8 flex flex-col shadow-[0_40px_60px_-10px_rgba(0,68,66,0.04),0_0_2px_rgba(0,68,66,0.04),inset_0_1px_0_rgba(255,255,255,0.6)] dark:shadow-none h-[320px]">
          <span className="text-[#3F4948] dark:text-[#A8EFEC] font-bold text-[11px] uppercase tracking-[0.2em] block mb-4">Dự án của bạn</span>
          <ScrollArea className="h-[210px] pr-4">
            <div className="flex flex-col gap-3 pb-4 pr-1">
              {projects.length > 0 ? projects.map((p: any) => (
                <div 
                  key={p._id} 
                  onClick={() => setSelectedFeaturedProjectId(p._id)}
                  className={`flex items-center gap-3 p-6 rounded-[32px] cursor-pointer transition-all duration-300 ${featuredProject?._id === p._id ? 'bg-brand-primary/10 text-brand-primary dark:bg-[#172925] dark:text-[#C7F964]' : 'bg-slate-100/55 hover:bg-slate-100 dark:bg-[#172925]/50 dark:hover:bg-[#172925]/80 text-slate-800 dark:text-slate-200'}`}
                >
                  {/* Image */}
                  <div className="w-12 h-12 rounded-2xl overflow-hidden flex-shrink-0 bg-slate-100 dark:bg-slate-800 relative">
                    {p.coverUrl ? (
                      <img src={p.coverUrl} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xl">{p.emoji || '📁'}</div>
                    )}
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0 flex flex-col">
                    <h4 className="text-sm font-bold truncate">{p.name}</h4>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">{p.totalTasks || 0} tasks</span>
                  </div>
                  {/* Status Badge */}
                  <div className="flex-shrink-0 self-end">
                    <span className="text-[8px] font-black uppercase px-2 py-1 rounded-lg bg-slate-200/50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 tracking-[0.2em]">
                      {p.status || 'Active'}
                    </span>
                  </div>
                </div>
              )) : (
                <div className="text-center text-slate-500 dark:text-slate-400 text-xs font-medium py-4">Chưa có dự án</div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Column 2: Biểu đồ task theo Phase */}
        <div className="bg-white/70 dark:bg-[#071613]/80 backdrop-blur-[16px] rounded-[48px] p-8 flex flex-col shadow-[0_40px_60px_-10px_rgba(0,68,66,0.04),0_0_2px_rgba(0,68,66,0.04),inset_0_1px_0_rgba(255,255,255,0.6)] dark:shadow-none h-[320px]">
          <span className="text-[#3F4948] dark:text-[#A8EFEC] font-bold text-[11px] uppercase tracking-[0.2em] block mb-4 flex items-center justify-between">
            <span>Phân bổ theo giai đoạn</span>
          </span>
          <ScrollArea className="h-[210px] pr-4">
            <div className="flex flex-col gap-4 pb-4 pr-1">
              {tasksByPhase.length > 0 ? tasksByPhase.map((phase: any) => {
                const widthPercent = phase.count > 0 ? Math.max((phase.count / maxTasksInPhase) * 100, 6) : 0;
                // Tính độ đậm nhạt: base opacity 0.4, tối đa 1.0 tùy theo số lượng
                const barOpacity = phase.count > 0 ? 0.3 + (0.7 * (phase.count / maxTasksInPhase)) : 0;
                
                return (
                  <div key={phase._id} className="flex flex-col gap-1.5 group">
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span className="text-slate-700 dark:text-slate-300 truncate pr-2 group-hover:text-brand-primary transition-colors">{phase.name}</span>
                      <span className="text-slate-500 dark:text-slate-400 font-black bg-slate-100 dark:bg-[#172925] px-2 py-0.5 rounded-lg">{phase.count}</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100/80 dark:bg-slate-800/50 rounded-full overflow-hidden flex">
                      {phase.count > 0 && (
                        <div 
                          className="h-full bg-brand-primary dark:bg-brand-secondary rounded-full transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(3,93,91,0.2)] dark:shadow-none" 
                          style={{ 
                            width: `${widthPercent}%`,
                            opacity: barOpacity 
                          }} 
                        />
                      )}
                    </div>
                  </div>
                );
              }) : (
                <div className="text-center text-slate-500 dark:text-slate-400 text-xs font-medium py-10 flex flex-col items-center gap-2">
                  <span className="text-2xl opacity-40">📉</span>
                  Dự án này chưa có giai đoạn nào
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Column 3: Danh sách task hết hạn */}
        <div className="bg-rose-500/[0.03] dark:bg-rose-950/[0.05] backdrop-blur-[16px] rounded-[48px] p-8 flex flex-col shadow-[0_40px_60px_-10px_rgba(0,68,66,0.04),0_0_2px_rgba(0,68,66,0.04),inset_0_1px_0_rgba(255,255,255,0.6)] dark:shadow-none h-[320px] relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-40 h-40 bg-rose-500/10 dark:bg-rose-500/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none group-hover:bg-rose-500/20 transition-all duration-500" />
          
          <span className="text-rose-600 dark:text-rose-400 font-bold text-[11px] uppercase tracking-[0.2em] block mb-4 flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
            Đã quá hạn
          </span>
          
          <ScrollArea className="h-[210px] pr-4 relative z-10">
            <div className="flex flex-col gap-3 pb-4 pr-1">
              {overdueTasks.length > 0 ? overdueTasks.map((t: Task) => (
                <div 
                  key={t._id}
                  onClick={() => handleTaskClick(t)}
                  className="flex flex-col p-6 rounded-[32px] cursor-pointer transition-all duration-300 bg-white/80 dark:bg-[#172925]/60 hover:bg-white dark:hover:bg-[#172925] hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(0,0,0,0.03)] dark:hover:shadow-none"
                >
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate group-hover:text-rose-650 dark:group-hover:text-rose-400 transition-colors">{t.title}</h4>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] text-rose-600/90 dark:text-rose-400/90 font-bold bg-rose-500/10 px-2 py-0.5 rounded-lg">
                      {t.startDate ? new Date(t.startDate).toLocaleDateString('vi-VN') : 'Không có'} - {t.dueDate ? new Date(t.dueDate).toLocaleDateString('vi-VN') : 'Không có'}
                    </span>
                  </div>
                </div>
              )) : (
                <div className="text-center text-slate-500 dark:text-slate-400 text-xs font-medium py-10 flex flex-col items-center gap-2">
                  <span className="text-2xl opacity-50">🎉</span>
                  Tuyệt vời! Không có việc nào trễ hạn.
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Filters */}
      <TaskFilters 
        filters={filters}
        projects={projects}
        members={members}
        tasks={allTasks}
        onSearchChange={(search) => setFilters(prev => ({ ...prev, search }))}
        onStatusChange={(status) => setFilters(prev => ({ ...prev, status }))}
        onPriorityChange={(priority) => setFilters(prev => ({ ...prev, priority }))}
        onProjectChange={(projectId: string) => setFilters(prev => ({ ...prev, projectId }))}
        onAssigneeChange={(assigneeIds: string[]) => setFilters(prev => ({ ...prev, assigneeIds }))}
        onParentTaskChange={(parentId: string) => setFilters(prev => ({ ...prev, parentId }))}
        onPhaseChange={(phaseId: string) => setFilters(prev => ({ ...prev, phaseId }))}
        onClear={clearFilters}
        phases={phases}
      />

      {/* List Container */}
      <div className="flex-1 min-h-0 bg-white/40 dark:bg-slate-950/40 backdrop-blur-xl rounded-[40px] border border-slate-100 dark:border-white/5 overflow-hidden shadow-sm dark:shadow-2xl">
        <div className="bg-slate-50/80 dark:bg-slate-900/90 px-6 py-5 grid grid-cols-[40px_100px_1fr_120px_120px_120px_120px_80px] items-center gap-4 text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest border-b border-slate-100/80 dark:border-white/5 sticky top-0 z-20 backdrop-blur-md">
           <div className="flex justify-center" />
           <div>Mã Task</div>
           <div>Công việc & Dự án</div>
           <div className="text-center">Trạng thái</div>
           <div className="text-center">Ưu tiên</div>
           <div className="text-center">Giai đoạn</div>
           <div className="text-center">Hạn chót</div>
           <div className="text-right pr-4">Người làm</div>
        </div>

        <ScrollArea className="h-[calc(100vh-350px)]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-20 gap-4">
              <Loader size="md" />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Đang nạp bộ nhớ công việc...</p>
            </div>
          ) : tasks.length > 0 ? (
            <div className="flex flex-col">
              {tasks.map((task: Task) => (
                <TaskRow key={task._id} task={task} onClick={handleTaskClick} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-20 text-center">
              <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mb-4 border border-slate-100 dark:border-white/5">
                <Inbox className="w-8 h-8 text-slate-300 dark:text-slate-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Không tìm thấy công việc</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 max-w-[280px]">Hãy thử điều chỉnh bộ lọc hoặc tạo công việc mới.</p>
              {Object.values(filters).some(v => v !== '' && v !== 'all') && (
                <Button variant="link" onClick={clearFilters} className="text-brand-primary font-bold mt-4">
                    Xóa tất cả lọc
                </Button>
              )}
            </div>
          )}
        </ScrollArea>
      </div>

      <TaskDetailModal 
        task={selectedTask}
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          // Xóa taskId và commentId khỏi URL khi đóng
          const params = new URLSearchParams(searchParams.toString());
          params.delete('taskId');
          params.delete('commentId');
          const newQuery = params.toString();
          router.replace(`${window.location.pathname}${newQuery ? `?${newQuery}` : ''}`);
        }}
        onUpdate={handleUpdateTask}
        onDelete={handleDeleteTask}
        members={membersData?.members || []}
        tasks={tasks}
        isAdminOrOwner={isAdminOrOwner}
      />

      <CreateTaskModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        projects={projects}
        onSubmit={handleCreateTask}
        workspaceId={workspaceId}
        isAdminOrOwner={isAdminOrOwner}
      />
    </div>
  );
}
