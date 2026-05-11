'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { taskService } from '@/services/task.service';
import { projectService } from '@/services/project.service';
import { PhaseService } from '@/services/phase.service';
import { TaskRow } from '@/components/task/TaskRow';
import { TaskFilters } from '@/components/task/TaskFilters';
import { Loader2, Inbox, Plus } from 'lucide-react';
import Loader from "@/components/ui/Loader";
import { Button } from '@/components/ui/button';
import { Task } from '@/types/task';
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

  const { data, isLoading } = useQuery({
    queryKey: ['workspace-tasks-list', workspaceId, filters],
    queryFn: () => taskService.getTasksByWorkspace(workspaceId, {
      ... (filters.status !== 'all' && { status: filters.status }),
      ... (filters.priority !== 'all' && { priority: filters.priority }),
      ... (filters.projectId !== 'all' && { projectId: filters.projectId }),
      ... (filters.assigneeIds.length > 0 && { assignedTo: filters.assigneeIds.join(',') }),
      ... (filters.parentId !== 'all' && { parentId: filters.parentId === 'root' ? '' : filters.parentId }),
      ... (filters.phaseId !== 'all' && { phaseId: filters.phaseId }),
      ... (filters.search && { search: filters.search }),
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

  return (
    <div className="flex flex-col h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">Công việc của tôi</h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium">Quản lý và theo dõi tiến độ công việc tập trung.</p>
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
