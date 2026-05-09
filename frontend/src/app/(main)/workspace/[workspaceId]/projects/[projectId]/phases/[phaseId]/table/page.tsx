'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { projectService, Project } from '@/services/project.service';
import { taskService } from '@/services/task.service';
import { workspaceService } from '@/services/workspace.service';
import { Task, TaskStatus, TaskPriority } from '@/types/task';
import { 
  Layout, 
  LayoutGrid, 
  BarChart3, 
  Plus, 
  Filter, 
  Search, 
  ChevronDown, 
  ChevronRight, 
  MoreHorizontal, 
  Pencil, 
  Trash2, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ArrowUpDown, 
  Loader2, 
  FilterX, 
  Download, 
  Expand, 
  MessageSquare,
  User,
  Layers,
  X,
  Wand2,
  CalendarDays
} from 'lucide-react';

import Loader from "@/components/ui/Loader";
import { SearchInput } from '@/components/shared/SearchInput';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { PriorityBadge } from '@/components/shared/PriorityBadge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format, addDays, differenceInDays, startOfDay } from 'date-fns';
import { vi } from 'date-fns/locale';
import { TaskDetailModal } from '@/components/task/TaskDetailModal';
import { CreateTaskModal } from '@/components/task/CreateTaskModal';
import { toast } from 'sonner';
import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { useRole } from '@/hooks/useRole';
import { PhaseService } from '@/services/phase.service';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";



export default function ProjectTablePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const workspaceId = params.workspaceId as string;
  const projectId = params.projectId as string;
  const phaseId = params.phaseId as string;
  const targetTaskId = searchParams.get('taskId');
  const queryClient = useQueryClient();
  const router = useRouter();
  const { isPrivileged } = useRole();
  
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filter states
  const [selectedStatus, setSelectedStatus] = useState<TaskStatus | 'all'>('all');
  const [selectedPriority, setSelectedPriority] = useState<TaskPriority | 'all'>('all');
  const [selectedAssigneeId, setSelectedAssigneeId] = useState<string | 'all'>('all');

  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modal state
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAutoAssigning, setIsAutoAssigning] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Queries
  const { data: projectData, isLoading: isProjectLoading } = useQuery({
    queryKey: ['project', workspaceId, projectId],
    queryFn: () => projectService.getProjectById(workspaceId, projectId),
    enabled: !!workspaceId && !!projectId,
  });

  const { data: rootTasksData, isLoading: isRootTasksLoading, isPlaceholderData } = useQuery({
    queryKey: ['project-root-tasks', workspaceId, projectId, phaseId, selectedStatus, selectedPriority, selectedAssigneeId, currentPage, searchQuery],
    queryFn: () => taskService.getProjectTasks(workspaceId, projectId, { 
      pageNumber: currentPage, 
      pageSize, 
      parentId: 'null', // Fetch only top-level
      keyword: searchQuery,
      phaseId,
      status: selectedStatus === 'all' ? undefined : selectedStatus,
      priority: selectedPriority === 'all' ? undefined : selectedPriority,
      assignedTo: selectedAssigneeId === 'all' ? undefined : selectedAssigneeId
    }),
    placeholderData: keepPreviousData,
    enabled: !!workspaceId && !!projectId,
  });

  const { data: subtasksData, isLoading: isSubtasksLoading } = useQuery({
    queryKey: ['project-all-subtasks', workspaceId, projectId, phaseId, selectedStatus, selectedPriority, selectedAssigneeId],
    queryFn: () => taskService.getProjectTasks(workspaceId, projectId, { 
      pageSize: 1000, 
      parentId: 'not-null',
      phaseId,
      status: selectedStatus === 'all' ? undefined : selectedStatus,
      priority: selectedPriority === 'all' ? undefined : selectedPriority,
      assignedTo: selectedAssigneeId === 'all' ? undefined : selectedAssigneeId
    }),
    enabled: !!workspaceId && !!projectId,
  });


  const { data: phasesData, isLoading: isPhasesLoading } = useQuery({
    queryKey: ['project-phases', projectId],
    queryFn: () => PhaseService.getPhases(projectId),
    enabled: !!projectId,
  });

  const allPhases = phasesData?.data || [];

  const { data: workspaceData, isLoading: isMembersLoading } = useQuery({
    queryKey: ['workspace-members', workspaceId],
    queryFn: () => workspaceService.getMembers(workspaceId),
    enabled: !!workspaceId,
  });

  // Fetch Phase status to check for locking
  const { data: phase } = useQuery({
      queryKey: ['phase', phaseId],
      queryFn: () => PhaseService.getPhases(projectId).then(res => res.data.find((p: any) => p._id === phaseId)),
      enabled: !!projectId && !!phaseId,
  });

  // Derived variables
  const loading = isProjectLoading || isRootTasksLoading || isSubtasksLoading || isMembersLoading;

  // Effects
  useEffect(() => {
      if (phase?.isLocked && !isPrivileged && !loading) {
          toast.error('Giai đoạn này đã bị khóa. Chỉ Quản trị viên mới có quyền truy cập.');
          router.push(`/workspace/${workspaceId}/projects/${projectId}/phases`);
      }
  }, [phase, isPrivileged, loading, workspaceId, projectId, router]);

  useEffect(() => {
    if (workspaceData?.members) {
      // Map to the user object inside each member record
      const memberUsers = workspaceData.members
        .map((m: any) => m.userId)
        .filter((u: any) => !!u); // Remove null/undefined
      setMembers(memberUsers);
    }
  }, [workspaceData]);

  useEffect(() => {
    if (targetTaskId && workspaceId && projectId) {
      const fetchAndOpenTask = async () => {
        try {
          const task = await taskService.getTaskById(workspaceId, projectId, targetTaskId);
          if (task) {
            setSelectedTask(task);
            setIsTaskModalOpen(true);
          }
        } catch (error) {
          console.error("Failed to fetch target task:", error);
        }
      };
      fetchAndOpenTask();
    }
  }, [targetTaskId, workspaceId, projectId]);

  useEffect(() => {
    if (projectData) {
      setProject(projectData);
      queryClient.invalidateQueries({ queryKey: ['workspace-projects', workspaceId] });
    }
    
    // Combine Root Tasks and Subtasks
    const combinedTasks: Task[] = [];
    if (rootTasksData?.tasks) {
      combinedTasks.push(...rootTasksData.tasks);
      if (rootTasksData.pagination) {
        setTotalPages(rootTasksData.pagination.totalPages);
        setTotalCount(rootTasksData.pagination.totalCount);
      }
    }
    if (subtasksData?.tasks) {
      // Filter to only include subtasks (they have a parentId)
      const subOnly = subtasksData.tasks.filter(t => t.parentId);
      combinedTasks.push(...subOnly);
    }
    
    setTasks(combinedTasks);
  }, [projectData, rootTasksData, subtasksData, workspaceData, queryClient, workspaceId]);


  const refreshTasks = async () => {
    queryClient.invalidateQueries({ queryKey: ['project-root-tasks'] });
    queryClient.invalidateQueries({ queryKey: ['project-all-subtasks'] });
  };

  const isProjectCompleted = project?.status === 'COMPLETED';

  const handleTaskClick = (task: Task) => {
    if (isProjectCompleted) {
      toast.info('Dự án đã hoàn thành. Bạn chỉ có thể xem thông tin ở chế độ đọc.');
      return;
    }
    setSelectedTask(task);
    setIsTaskModalOpen(true);
  };

  const toggleRow = (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId);
    } else {
      newExpanded.add(taskId);
    }
    setExpandedRows(newExpanded);
  };

  const handleAutoAssignDates = async () => {
    if (!phase?.startDate || !phase?.endDate) {
      toast.error("Vui lòng thiết lập ngày bắt đầu và kết thúc cho Giai đoạn (Phase) trước khi phân bổ Task.");
      return;
    }

    try {
      setIsAutoAssigning(true);
      
      // 1. Lấy tất cả task của phase này (không phân trang để lấy đủ)
      const response = await taskService.getProjectTasks(workspaceId as string, projectId as string, {
        phaseId: phaseId,
        pageSize: 100 // Giả định phase không quá 100 task
      });

      const tasksInPhase = response.tasks || [];
      
      // 2. Lọc task chưa có ngày
      const tasksWithoutDates = tasksInPhase.filter(t => !t.startDate && !t.dueDate);

      if (tasksWithoutDates.length === 0) {
        toast.info("Tất cả công việc trong giai đoạn này đã có lịch trình.");
        setIsAutoAssigning(false);
        return;
      }

      // 3. Tính toán phân bổ
      const phaseStart = startOfDay(new Date(phase.startDate));
      const phaseEnd = startOfDay(new Date(phase.endDate));
      const totalDays = differenceInDays(phaseEnd, phaseStart) + 1;
      
      if (totalDays <= 0) {
        toast.error("Ngày kết thúc của giai đoạn phải sau ngày bắt đầu.");
        setIsAutoAssigning(false);
        return;
      }

      // Chia đều số ngày cho số task. 
      // Nếu số task > số ngày, mỗi task sẽ chiếm 1 ngày (gối đầu nhau)
      const count = tasksWithoutDates.length;
      const daysPerTask = Math.max(1, Math.floor(totalDays / count));

      toast.loading(`Đang phân bổ lịch trình cho ${count} công việc...`);

      // 4. Cập nhật từng task
      const updatePromises = tasksWithoutDates.map((task, index) => {
        const startOffset = Math.min(index * daysPerTask, totalDays - 1);
        const endOffset = Math.min((index + 1) * daysPerTask - 1, totalDays - 1);
        
        const taskStart = addDays(phaseStart, startOffset);
        const taskEnd = addDays(phaseStart, endOffset);

        return taskService.updateTask(workspaceId as string, projectId as string, task._id, {
          startDate: taskStart.toISOString(),
          dueDate: taskEnd.toISOString()
        });
      });

      await Promise.all(updatePromises);
      
      toast.dismiss();
      toast.success(`Đã tự động gán ngày cho ${count} công việc thành công!`);
      
      // 5. Làm mới dữ liệu
      queryClient.invalidateQueries({ queryKey: ['project-tasks'] });
      
    } catch (error) {
      console.error("Auto assign error:", error);
      toast.dismiss();
      toast.error("Có lỗi xảy ra khi tự động phân bổ ngày.");
    } finally {
      setIsAutoAssigning(false);
    }
  };

  const handleUpdateTask = async (taskId: string, data: Partial<Task>) => {
    try {
      // [FIX] Map assignedTo objects to IDs for the update request
      const updateData: any = { ...data };
      if (data.assignedTo && Array.isArray(data.assignedTo)) {
        updateData.assignedTo = data.assignedTo.map((u: any) => 
          typeof u === 'string' ? u : (u._id || u.id)
        );
      }

      const updatedTask = await taskService.updateTask(workspaceId, projectId, taskId, updateData);
      setTasks(prev => prev.map(t => t._id === taskId ? { ...t, ...updatedTask } : t));
      if (selectedTask?._id === taskId) {
        setSelectedTask({ ...selectedTask, ...updatedTask });
      }
      queryClient.invalidateQueries({ queryKey: ['project-root-tasks', workspaceId, projectId, phaseId] });
      queryClient.invalidateQueries({ queryKey: ['project-all-subtasks', workspaceId, projectId, phaseId] });
      queryClient.invalidateQueries({ queryKey: ['project-tasks', workspaceId, projectId, phaseId] });

      queryClient.invalidateQueries({ queryKey: ['workspace-tasks', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['workspace-tasks', 'list', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['workspace-analytics', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['workspace-analytics-history', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['projectAnalytics', workspaceId, projectId] });
      queryClient.invalidateQueries({ queryKey: ['projectAnalyticsHistory', workspaceId, projectId] });
      queryClient.invalidateQueries({ queryKey: ['workspace-projects', workspaceId] });
      toast.success('Cập nhật công việc thành công');
    } catch (error) {
      console.error('Update task error:', error);
      toast.error('Cập nhật thất bại');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await taskService.deleteTask(workspaceId, projectId, taskId);
      queryClient.invalidateQueries({ queryKey: ['project-root-tasks', workspaceId, projectId, phaseId] });
      queryClient.invalidateQueries({ queryKey: ['project-all-subtasks', workspaceId, projectId, phaseId] });
      queryClient.invalidateQueries({ queryKey: ['project-tasks', workspaceId, projectId, phaseId] });

      queryClient.invalidateQueries({ queryKey: ['workspace-tasks', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['workspace-tasks', 'list', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['workspace-analytics', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['workspace-analytics-history', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['projectAnalytics', workspaceId, projectId] });
      queryClient.invalidateQueries({ queryKey: ['projectAnalyticsHistory', workspaceId, projectId] });
      queryClient.invalidateQueries({ queryKey: ['workspace-projects', workspaceId] });
      setIsTaskModalOpen(false);
      toast.success('Đã xóa công việc');
    } catch (error) {
      console.error('Delete task error:', error);
      toast.error('Xóa thất bại');
    }
  };

  const handleCreateTask = async (pId: string, taskData: any) => {
    try {
      const createdTask = await taskService.createTask(workspaceId, pId, taskData);
      const subtasksCount = taskData.subtasks?.length || 0;

      queryClient.invalidateQueries({ queryKey: ['project-root-tasks', workspaceId, projectId, phaseId] });
      queryClient.invalidateQueries({ queryKey: ['project-all-subtasks', workspaceId, projectId, phaseId] });
      queryClient.invalidateQueries({ queryKey: ['project-tasks', workspaceId, projectId, phaseId] });
      queryClient.invalidateQueries({ queryKey: ['workspace-tasks', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['workspace-tasks', 'list', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['workspace-analytics', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['workspace-analytics-history', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['projectAnalytics', workspaceId, projectId] });
      queryClient.invalidateQueries({ queryKey: ['projectAnalyticsHistory', workspaceId, projectId] });
      queryClient.invalidateQueries({ queryKey: ['workspace-projects', workspaceId] });

      if (isTaskModalOpen && selectedTask && taskData.parentId === selectedTask._id) {
        const updatedParent = await taskService.getTaskById(workspaceId, pId, selectedTask._id);
        setSelectedTask(updatedParent);
      }

      toast.success(subtasksCount > 0
        ? `Đã tạo công việc và ${subtasksCount} nhiệm vụ con!`
        : "Đã tạo công việc mới"
      );
    } catch (error) {
      console.error("Create task error:", error);
      toast.error("Lỗi khi tạo công việc");
    }
  };

  const topLevelTasks = tasks.filter(t => !t.parentId);

  const getParentIdStr = (parentId: any) => {
    if (!parentId) return '';
    return typeof parentId === 'object' ? String(parentId._id) : String(parentId);
  };

  // Create a map for quick subtask lookup using string IDs
  const subtasksMap = new Map<string, Task[]>();
  tasks.forEach(t => {
    if (t.parentId) {
      const parentIdStr = getParentIdStr(t.parentId);
      const subs = subtasksMap.get(parentIdStr) || [];
      subs.push(t);
      subtasksMap.set(parentIdStr, subs);
    }
  });

  const getFilteredData = () => {
    const results: { parent: Task; subtasks: Task[] }[] = [];

    topLevelTasks.forEach(parent => {
      const parentIdStr = String(parent._id);
      const parentMatches = parent.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        parent.taskCode.toLowerCase().includes(searchQuery.toLowerCase());

      const allSubtasks = subtasksMap.get(parentIdStr) || [];
      const matchingSubTasks = allSubtasks.filter(t =>
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.taskCode.toLowerCase().includes(searchQuery.toLowerCase())
      );

      if (parentMatches || matchingSubTasks.length > 0) {
        const subtasksToShow = searchQuery ? (parentMatches ? allSubtasks : matchingSubTasks) : allSubtasks;
        results.push({ parent, subtasks: subtasksToShow });
      }
    });

    return results;
  };

  const filteredData = getFilteredData();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <Loader size="lg" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] text-slate-500">
        <p>Không tìm thấy dự án.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-brand-primary/5 flex items-center justify-center text-2xl border border-brand-primary/10 shadow-sm">
            {project.emoji || '🎯'}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              {project.name}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Danh sách công việc & Cơ sở dữ liệu</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-100/50 dark:bg-slate-800/40 p-1 rounded-xl border border-slate-200/60 dark:border-white/10 shadow-inner overflow-hidden">
          <Link
            href={`/workspace/${workspaceId}/projects/${projectId}/phases/${phaseId}/board`}
            className="px-4 py-1.5 text-slate-500 dark:text-slate-400 hover:text-brand-primary dark:hover:text-brand-secondary transition-all text-xs font-bold uppercase tracking-wider flex items-center rounded-lg hover:bg-white/80 dark:hover:bg-white/5"
          >
            <LayoutGrid className="w-3.5 h-3.5 mr-2" />
            Board
          </Link>
          <div
            className="px-4 py-1.5 bg-white dark:bg-brand-primary text-brand-primary dark:text-white shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:shadow-glow-combined border border-slate-200/50 dark:border-white/10 transition-all text-xs font-black uppercase tracking-wider flex items-center rounded-lg ring-1 ring-slate-900/5 dark:ring-white/5"
          >
            <Layout className="w-3.5 h-3.5 mr-2" />
            Table
          </div>
          <Link
            href={`/workspace/${workspaceId}/projects/${projectId}/phases/${phaseId}/calendar`}
            className="px-4 py-1.5 text-slate-500 dark:text-slate-400 hover:text-brand-primary dark:hover:text-brand-secondary transition-all text-xs font-bold uppercase tracking-wider flex items-center rounded-lg hover:bg-white/80 dark:hover:bg-white/5"
          >
            <Calendar className="w-3.5 h-3.5 mr-2" />
            Calendar
          </Link>
          <Link
            href={`/workspace/${workspaceId}/projects/${projectId}/phases/${phaseId}/analytics`}
            className="px-4 py-1.5 text-slate-500 dark:text-slate-400 hover:text-brand-primary dark:hover:text-brand-secondary transition-all text-xs font-bold uppercase tracking-wider flex items-center rounded-lg hover:bg-white/80 dark:hover:bg-white/5"
          >
            <BarChart3 className="w-3.5 h-3.5 mr-2" />
            Analytics
          </Link>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <SearchInput
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Tìm theo tiêu đề hoặc mã..."
          className="h-10"
          containerClassName="flex-1 max-w-sm"
        />

        <div className="flex items-center gap-2">
          {/* Auto-assign Dates Action */}
          <div className="flex items-center gap-3 bg-white/50 dark:bg-slate-900/50 p-1 px-3 rounded-xl border border-slate-200/60 dark:border-white/5 backdrop-blur-sm mr-2">
            <div className="flex flex-col">
              <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider leading-none mb-1">Schedule</span>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-brand-primary animate-pulse" />
                <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">Auto-sync</span>
              </div>
            </div>
            <div className="w-px h-6 bg-slate-200 dark:bg-white/10 mx-1" />
            <Button 
              variant="ghost" 
              size="sm"
              disabled={isAutoAssigning || isProjectCompleted}
              onClick={handleAutoAssignDates}
              className="h-8 px-2.5 rounded-lg hover:bg-brand-primary/10 hover:text-brand-primary group transition-all"
            >
              {isAutoAssigning ? (
                <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
              ) : (
                <Wand2 className="w-3.5 h-3.5 mr-2 group-hover:rotate-12 transition-transform" />
              )}
              <span className="text-[11px] font-medium">Gán ngày nhanh</span>
            </Button>
          </div>

          {(selectedStatus !== 'all' || selectedPriority !== 'all' || selectedAssigneeId !== 'all') && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => {
                setSelectedStatus('all');
                setSelectedPriority('all');
                setSelectedAssigneeId('all');
                setCurrentPage(1);
              }}
              className="h-9 px-2 text-slate-500 hover:text-red-500 transition-colors"
            >
              <X className="w-4 h-4 mr-1.5" />
              Xóa lọc
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="outline" className={cn(
                  "h-10 border-slate-200 dark:border-white/10 rounded-xl text-slate-600 dark:text-slate-400 dark:bg-slate-800",
                  (selectedStatus !== 'all' || selectedPriority !== 'all' || selectedAssigneeId !== 'all') && "border-brand-primary/50 bg-brand-primary/5 text-brand-primary"
                )}>
                  <Filter className="w-4 h-4 mr-2" />
                  Lọc
                </Button>
              }
            />
            <DropdownMenuContent className="w-64" align="end">
              <DropdownMenuGroup>
                <DropdownMenuLabel>Tùy chọn lọc</DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Clock className="w-4 h-4 mr-2" />
                  <span>Trạng thái</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="w-48">
                  <DropdownMenuRadioGroup value={selectedStatus} onValueChange={(v) => { setSelectedStatus(v as any); setCurrentPage(1); }}>
                    <DropdownMenuRadioItem value="all">Tất cả trạng thái</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value={TaskStatus.TODO}>Cần làm</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value={TaskStatus.IN_PROGRESS}>Đang thực hiện</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value={TaskStatus.COMPLETED}>Hoàn thành</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value={TaskStatus.CANCELLED}>Đã hủy</DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuSubContent>
              </DropdownMenuSub>

              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <AlertCircle className="w-4 h-4 mr-2" />
                  <span>Độ ưu tiên</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="w-48">
                  <DropdownMenuRadioGroup value={selectedPriority} onValueChange={(v) => { setSelectedPriority(v as any); setCurrentPage(1); }}>
                    <DropdownMenuRadioItem value="all">Tất cả độ ưu tiên</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value={TaskPriority.LOW}>Thấp</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value={TaskPriority.MEDIUM}>Trung bình</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value={TaskPriority.HIGH}>Cao</DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuSubContent>
              </DropdownMenuSub>

              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <User className="w-4 h-4 mr-2" />
                  <span>Người thực hiện</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="w-64 max-h-[300px] overflow-y-auto">
                  <DropdownMenuRadioGroup value={selectedAssigneeId} onValueChange={(v) => { setSelectedAssigneeId(v); setCurrentPage(1); }}>
                    <DropdownMenuRadioItem value="all">Tất cả mọi người</DropdownMenuRadioItem>
                    <DropdownMenuSeparator />
                    {members.map((member) => (
                      <DropdownMenuRadioItem key={member._id || member.id} value={member._id || member.id}>
                        <div className="flex items-center gap-2">
                          <Avatar className="w-5 h-5">
                            <AvatarImage src={member.profilePicture} />
                            <AvatarFallback className="text-[8px] font-bold">
                              {member.name?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs truncate">{member.name}</span>
                        </div>
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            </DropdownMenuContent>
          </DropdownMenu>

          {!isProjectCompleted && (
            <Button
              className="h-10 bg-brand-primary hover:bg-brand-primary/90 rounded-xl shadow-brand-primary/10"
              onClick={() => setIsCreateModalOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Thêm Task
            </Button>
          )}
        </div>
      </div>

      {/* Database Table */}
      <div className="flex-1 bg-white dark:bg-slate-900/50 dark:backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm flex flex-col min-h-0">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead className="sticky top-0 z-10">
              <tr className="bg-slate-50/80 dark:bg-slate-800/80 backdrop-blur-sm border-b border-slate-200 dark:border-white/10 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                <th className="px-6 py-4 w-24">Mã</th>
                <th className="px-6 py-4 flex-1">Tên công việc</th>
                <th className="px-6 py-4 w-36">
                  <div className="flex items-center gap-1">Trạng thái <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th className="px-6 py-4 w-32">Ưu tiên</th>
                <th className="px-6 py-4 w-36">Người thực hiện</th>
                <th className="px-6 py-4 w-36">Hạn chót</th>
                <th className="px-6 py-4 w-16"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {filteredData.length > 0 ? (
                filteredData.map(({ parent, subtasks }) => {
                  const parentIdStr = String(parent._id);
                  const isExpanded = expandedRows.has(parentIdStr) || searchQuery.length > 0;
                  const hasSubtasks = subtasks.length > 0;

                  return (
                    <React.Fragment key={parentIdStr}>
                      {/* Parent Row */}
                      <tr 
                        onClick={() => handleTaskClick(parent)}
                        className={cn(
                          "group hover:bg-slate-50/50 dark:hover:bg-white/5 cursor-pointer transition-colors relative",
                          hasSubtasks && isExpanded && "bg-slate-50/30 dark:bg-white/5"
                        )}
                      >
                        <td className="px-6 py-4 whitespace-nowrap relative">
                          <div className="flex items-center gap-3">
                            {hasSubtasks ? (
                              <button 
                                onClick={(e) => toggleRow(parentIdStr, e)}
                                className="w-5 h-5 flex items-center justify-center rounded-md hover:bg-brand-primary/10 text-slate-400 hover:text-brand-primary transition-all z-10 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10"
                              >
                                {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                              </button>
                            ) : (
                              <div className="w-5" />
                            )}
                            <span className="text-[10px] font-mono font-bold text-brand-primary bg-brand-primary/10 px-2 py-0.5 rounded tracking-tighter uppercase">
                              {parent.taskCode}
                            </span>
                          </div>
                          {hasSubtasks && isExpanded && (
                            <div className="absolute left-[34px] top-[44px] bottom-0 w-[1.5px] bg-slate-200 dark:bg-white/10 group-hover:bg-brand-primary/30 transition-colors" />
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 tracking-tight transition-colors group-hover:text-brand-primary">
                              {parent.title}
                            </span>
                            {parent.description && (
                              <span className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5 font-normal italic">
                                {parent.description}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4"><StatusBadge status={parent.status} /></td>
                        <td className="px-6 py-4"><PriorityBadge priority={parent.priority} /></td>
                        <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                          {parent.assignedTo && parent.assignedTo.length > 0 ? (
                            <div className="flex items-center gap-2">
                              <Avatar className="w-6 h-6 ring-1 ring-slate-200 dark:ring-white/10">
                                <AvatarImage src={parent.assignedTo[0].profilePicture} />
                                <AvatarFallback className="text-[10px] bg-brand-primary/10 text-brand-primary font-bold uppercase">
                                  {parent.assignedTo[0].name?.[0]}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm truncate max-w-[100px]">{parent.assignedTo[0].name}</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full border border-dashed border-slate-300 dark:border-white/20 flex items-center justify-center">
                                <User className="w-3 h-3 text-slate-300 dark:text-slate-500" />
                              </div>
                              <span className="text-xs italic">Chưa gán</span>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                            <span className="text-xs font-medium tracking-wider">
                              {parent.dueDate ? format(new Date(parent.dueDate), 'dd MMM, yyyy', { locale: vi }) : '--'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 dark:text-slate-500">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>

                      {/* Subtask Rows */}
                      {isExpanded && subtasks.map((subtask, index) => {
                        const isLast = index === subtasks.length - 1;
                        return (
                          <tr 
                            key={subtask._id} 
                            onClick={() => handleTaskClick(subtask)}
                            className="group hover:bg-brand-primary/5 cursor-pointer transition-colors relative"
                          >
                            <td className="px-6 py-3 whitespace-nowrap relative">
                              {!isLast ? (
                                <div className="absolute left-[34px] top-0 bottom-0 w-[1.5px] bg-slate-200 group-hover:bg-brand-primary/30 transition-colors" />
                              ) : (
                                <div className="absolute left-[34px] top-0 h-[50%] w-[1.5px] bg-slate-200 group-hover:bg-brand-primary/30 transition-colors" />
                              )}
                              <div className="absolute left-[34px] top-1/2 -translate-y-1/2 w-4 h-[1.5px] bg-slate-200 group-hover:bg-brand-primary/30 transition-colors" />
                              <div className="flex items-center gap-3 pl-8">
                                <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-100 group-hover:bg-brand-primary/10 group-hover:text-brand-primary px-1.5 py-0.5 rounded transition-all">
                                  {subtask.taskCode}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-3">
                              <span className="text-sm font-medium text-slate-600 transition-colors group-hover:text-brand-primary">
                                {subtask.title}
                              </span>
                            </td>
                            <td className="px-6 py-3"><StatusBadge status={subtask.status} /></td>
                            <td className="px-6 py-3"><PriorityBadge priority={subtask.priority} /></td>
                            <td className="px-6 py-3">
                              {subtask.assignedTo && subtask.assignedTo.length > 0 ? (
                                <div className="flex items-center gap-2 opacity-80">
                                  <Avatar className="w-5 h-5 ring-1 ring-slate-100">
                                    <AvatarImage src={subtask.assignedTo[0].profilePicture} />
                                    <AvatarFallback className="text-[9px] bg-slate-50 text-slate-500 font-bold uppercase">
                                      {subtask.assignedTo[0].name?.[0]}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-xs text-slate-500 truncate max-w-[80px]">{subtask.assignedTo[0].name}</span>
                                </div>
                              ) : (
                                <span className="text-[10px] text-slate-300 italic pl-7">Chưa gán</span>
                              )}
                            </td>
                            <td className="px-6 py-3 text-slate-400 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-3 h-3 opacity-50" />
                                <span className="text-[10px] font-medium tracking-wider">
                                  {subtask.dueDate ? format(new Date(subtask.dueDate), 'dd MMM', { locale: vi }) : '--'}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-3 text-right">
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-200">
                                <MoreHorizontal className="w-3.5 h-3.5" />
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </React.Fragment>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-20 text-center text-slate-500 italic">
                    Không tìm thấy công việc nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination & Footer info */}
        <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-6 text-xs font-medium text-slate-500">
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-white border border-slate-200 rounded-md text-brand-primary font-bold">
                {currentPage}
              </span>
              <span>trên {totalPages} trang</span>
            </div>
            <div className="h-4 w-px bg-slate-200 hidden sm:block" />
            <span>Tổng số: <strong className="text-slate-900">{totalCount}</strong> tác vụ chính</span>
          </div>

          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8 px-3 rounded-lg border-slate-200 text-slate-600 hover:bg-white hover:text-brand-primary transition-all disabled:opacity-30"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1 || loading}
            >
              <ChevronRight className="w-4 h-4 mr-1 rotate-180" />
              Trước
            </Button>
            
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
               {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                 // Simple pagination window logic
                 let pageNum = i + 1;
                 if (totalPages > 5 && currentPage > 3) {
                   pageNum = currentPage - 3 + i + 1;
                   if (pageNum > totalPages) pageNum = totalPages - (4 - i);
                 }
                 
                 return (
                   <button
                     key={pageNum}
                     onClick={() => setCurrentPage(pageNum)}
                     className={cn(
                       "w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold transition-all",
                       currentPage === pageNum
                         ? "bg-white text-brand-primary shadow-sm border border-slate-200/60"
                         : "text-slate-500 hover:bg-white/80 hover:text-brand-primary"
                     )}
                   >
                     {pageNum}
                   </button>
                 );
               })}
            </div>

            <Button 
              variant="outline" 
              size="sm" 
              className="h-8 px-3 rounded-lg border-slate-200 text-slate-600 hover:bg-white hover:text-brand-primary transition-all disabled:opacity-30"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages || loading}
            >
              Sau
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
          
          <span className="flex items-center gap-2 italic text-[10px] text-slate-400 sm:ml-auto">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Đang đồng bộ thời gian thực
          </span>
        </div>
      </div>

      <TaskDetailModal
        task={selectedTask}
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          // Xóa taskId và commentId khỏi URL khi đóng
          const params = new URLSearchParams(searchParams.toString());
          params.delete('taskId');
          params.delete('commentId');
          const newQuery = params.toString();
          router.replace(`${window.location.pathname}${newQuery ? `?${newQuery}` : ''}`);
        }}
        onUpdate={handleUpdateTask}
        onDelete={handleDeleteTask}
        onSubtaskUpdate={refreshTasks}
        members={members}
        tasks={tasks}
        isAdminOrOwner={isPrivileged}
      />

      <CreateTaskModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        projects={project ? [project] : []}
        onSubmit={handleCreateTask}
        workspaceId={workspaceId}
        phaseId={phaseId}
      />
    </div>
  );
}
