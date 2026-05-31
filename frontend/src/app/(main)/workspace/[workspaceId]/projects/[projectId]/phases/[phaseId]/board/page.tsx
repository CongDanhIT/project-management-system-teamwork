'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { KanbanBoard } from '@/components/project/KanbanBoard';
import { projectService, Project } from '@/services/project.service';
import { taskService } from '@/services/task.service';
import { workspaceService } from '@/services/workspace.service';
import { useWorkspaceStore } from '@/stores/workspace.store';
import { Loader2, LayoutGrid, BarChart3, Settings, Layout, Calendar as CalendarIcon, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { TaskDetailModal } from '@/components/task/TaskDetailModal';
import { CreateTaskModal } from '@/components/task/CreateTaskModal';
import Loader from "@/components/ui/Loader";
import { Task, TaskStatus } from '@/types/task';
import { toast } from 'sonner';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';

import { useRole } from '@/hooks/useRole';
import { PhaseService } from '@/services/phase.service';
import { useRouter } from 'next/navigation';


export default function ProjectBoardPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const workspaceId = params?.workspaceId as string;
  const projectId = params?.projectId as string;
  const phaseId = params?.phaseId as string;
  const { currentWorkspaceId } = useWorkspaceStore();
  const { isPrivileged } = useRole();
  const queryClient = useQueryClient();
  const [project, setProject] = useState<Project | null>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Fetch Phase status to check for locking
  const { data: phase } = useQuery({
      queryKey: ['phase', phaseId],
      queryFn: () => PhaseService.getPhases(projectId).then(res => res.data.find((p: any) => p._id === phaseId)),
      enabled: !!projectId && !!phaseId,
  });

  useEffect(() => {
      if (phase?.isLocked && !isPrivileged && !loading) {
          toast.error('Giai đoạn này đã bị khóa. Chỉ Quản trị viên mới có quyền truy cập.');
          router.push(`/workspace/${workspaceId}/projects/${projectId}/phases`);
      }
  }, [phase, isPrivileged, loading, workspaceId, projectId, router]);

  
  const { data: projectTasks = [] } = useQuery({
    queryKey: ['project-tasks', workspaceId, projectId, phaseId],
    queryFn: () => taskService.getProjectTasks(workspaceId, projectId, { pageSize: 1000, phaseId }),
    select: (data) => data.tasks,
    enabled: !!workspaceId && !!projectId && !!phaseId,
  });
  
  // Modal state
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0); // To refresh KanbanBoard
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createModalStatus, setCreateModalStatus] = useState<TaskStatus>(TaskStatus.TODO);

  // Auto open task from URL
  useEffect(() => {
    const taskId = searchParams?.get('taskId');
    if (taskId && workspaceId && projectId) {
      const fetchTask = async () => {
        try {
          const task = await taskService.getTaskById(workspaceId, projectId, taskId);
          setSelectedTask(task);
          setIsModalOpen(true);
        } catch (error) {
          console.error('Auto-open task error:', error);
        }
      };
      fetchTask();
    }
  }, [searchParams, workspaceId, projectId]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [projectData, workspaceData] = await Promise.all([
          projectService.getProjectById(workspaceId, projectId),
          workspaceService.getMembers(workspaceId)
        ]);
        setProject(projectData);
        setMembers(workspaceData.members || []);
        // Invalidate workspace projects to refresh sorting on dashboard
        queryClient.invalidateQueries({ queryKey: ['workspace-projects', workspaceId] });
      } catch (error) {
        console.error('Fetch project error:', error);
        toast.error('Không thể tải dữ liệu');
      } finally {
        setLoading(false);
      }
    };

    if (workspaceId && projectId) {
      fetchData();
    }
  }, [workspaceId, projectId]);

  const isProjectLocked = project?.status === 'COMPLETED' || project?.status === 'ON_HOLD';

  const handleTaskClick = (task: Task) => {
    if (isProjectLocked) {
      toast.info('Dự án đang tạm dừng hoặc đã hoàn thành. Chế độ xem chỉ đọc.');
      return;
    }
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const handleUpdateTask = async (taskId: string, data: any) => {
    try {
      const updatedTask = await taskService.updateTask(workspaceId, projectId, taskId, data);
      if (selectedTask?._id === taskId) {
        setSelectedTask({ ...selectedTask, ...updatedTask });
      }
      queryClient.invalidateQueries({ queryKey: ['project-tasks', workspaceId, projectId, phaseId] });
      queryClient.invalidateQueries({ queryKey: ['project-root-tasks', workspaceId, projectId] });
      queryClient.invalidateQueries({ queryKey: ['project-all-subtasks', workspaceId, projectId] });
      queryClient.invalidateQueries({ queryKey: ['workspace-tasks', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['workspace-tasks-list', workspaceId] });
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
      setIsModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['project-tasks', workspaceId, projectId, phaseId] });
      queryClient.invalidateQueries({ queryKey: ['project-root-tasks', workspaceId, projectId] });
      queryClient.invalidateQueries({ queryKey: ['project-all-subtasks', workspaceId, projectId] });
      queryClient.invalidateQueries({ queryKey: ['workspace-tasks', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['workspace-tasks-list', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['workspace-analytics', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['workspace-analytics-history', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['projectAnalytics', workspaceId, projectId] });
      queryClient.invalidateQueries({ queryKey: ['projectAnalyticsHistory', workspaceId, projectId] });
      queryClient.invalidateQueries({ queryKey: ['workspace-projects', workspaceId] });
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

      queryClient.invalidateQueries({ queryKey: ['project-tasks', workspaceId, projectId, phaseId] });
      queryClient.invalidateQueries({ queryKey: ['workspace-tasks', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['workspace-tasks-list', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['workspace-analytics', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['workspace-analytics-history', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['projectAnalytics', workspaceId, projectId] });
      queryClient.invalidateQueries({ queryKey: ['projectAnalyticsHistory', workspaceId, projectId] });
      queryClient.invalidateQueries({ queryKey: ['workspace-projects', workspaceId] });
      
      if (isModalOpen && selectedTask && taskData.parentId === selectedTask._id) {
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
        <p>Không tìm thấy thông báo dự án.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Project Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-brand-primary/5 flex items-center justify-center text-2xl border border-brand-primary/10 shadow-sm">
            {project.emoji || '🎯'}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              {project.name}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-1">
              {project.description || 'Không có mô tả dự án'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-100/50 dark:bg-slate-800/40 p-1 rounded-xl border border-slate-200/60 dark:border-white/10 shadow-inner overflow-hidden">
          <div
            className="px-4 py-1.5 bg-white dark:bg-brand-primary text-brand-primary dark:text-white shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:shadow-glow-combined border border-slate-200/50 dark:border-white/10 transition-all text-xs font-black uppercase tracking-wider flex items-center rounded-lg ring-1 ring-slate-900/5 dark:ring-white/5"
          >
            <LayoutGrid className="w-3.5 h-3.5 mr-2" />
            Board
          </div>
          <Link 
            href={`/workspace/${workspaceId}/projects/${projectId}/phases/${phaseId}/table`}
            className="px-4 py-1.5 text-slate-500 dark:text-slate-400 hover:text-brand-primary dark:hover:text-brand-secondary transition-all text-xs font-bold uppercase tracking-wider flex items-center rounded-lg hover:bg-white/80 dark:hover:bg-white/5"
          >
            <Layout className="w-3.5 h-3.5 mr-2" />
            Table
          </Link>
          <Link 
            href={`/workspace/${workspaceId}/projects/${projectId}/phases/${phaseId}/calendar`}
            className="px-4 py-1.5 text-slate-500 dark:text-slate-400 hover:text-brand-primary dark:hover:text-brand-secondary transition-all text-xs font-bold uppercase tracking-wider flex items-center rounded-lg hover:bg-white/80 dark:hover:bg-white/5"
          >
            <CalendarIcon className="w-3.5 h-3.5 mr-2" />
            Calendar
          </Link>
          <Link 
            href={`/workspace/${workspaceId}/projects/${projectId}/phases/${phaseId}/analytics`}
            className="px-4 py-1.5 text-slate-500 dark:text-slate-400 hover:text-brand-primary dark:hover:text-brand-secondary transition-all text-xs font-bold uppercase tracking-wider flex items-center rounded-lg hover:bg-white/80 dark:hover:bg-white/5"
          >
            <BarChart3 className="w-3.5 h-3.5 mr-2" />
            Analytics
          </Link>
          <div className="w-px h-6 bg-slate-200/60 dark:bg-white/10 mx-1" />
          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 dark:text-slate-500 hover:text-brand-primary dark:hover:text-brand-secondary transition-colors">
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Kanban Board Container */}
      <div className="flex-1 min-h-0 bg-slate-50/30 dark:bg-transparent -mx-4 md:-mx-8 px-4 md:px-8 py-6 rounded-t-[32px] border-t border-slate-200/60 dark:border-white/5">
        <KanbanBoard 
          key={refreshKey}
          workspaceId={workspaceId} 
          projectId={projectId} 
          phaseId={phaseId}
          onTaskClick={handleTaskClick}
          onAddTaskClick={(status) => {
            if (isProjectLocked) return;
            setCreateModalStatus(status);
            setIsCreateModalOpen(true);
          }}
          isAdminOrOwner={isPrivileged}
          isProjectCompleted={isProjectLocked}
        />
      </div>

      <TaskDetailModal 
        task={selectedTask}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onUpdate={handleUpdateTask}
        onDelete={handleDeleteTask}
        onSubtaskUpdate={() => setRefreshKey(prev => prev + 1)}
        members={members}
        tasks={projectTasks}
        isAdminOrOwner={isPrivileged}
      />

      <CreateTaskModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        projects={project ? [project] : []}
        onSubmit={handleCreateTask}
        initialStatus={createModalStatus}
        workspaceId={workspaceId}
        phaseId={phaseId}
        isAdminOrOwner={isPrivileged}
      />
    </div>
  );
}
