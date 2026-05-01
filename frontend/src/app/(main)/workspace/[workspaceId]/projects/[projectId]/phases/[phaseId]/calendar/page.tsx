'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { projectService, Project } from '@/services/project.service';
import { taskService } from '@/services/task.service';
import { workspaceService } from '@/services/workspace.service';
import { useWorkspaceStore } from '@/stores/workspace.store';
import { Loader2, LayoutGrid, BarChart3, Settings, Layout, Calendar as CalendarIcon, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { TaskDetailModal } from '@/components/task/TaskDetailModal';
import Loader from "@/components/ui/Loader";
import { Task } from '@/types/task';
import { toast } from 'sonner';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRole } from '@/hooks/useRole';
import { PhaseService } from '@/services/phase.service';
import { useRouter } from 'next/navigation';
import { TaskCalendar } from '@/components/project/TaskCalendar';


export default function ProjectCalendarPage() {
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  const projectId = params.projectId as string;
  const phaseId = params.phaseId as string;
  const router = useRouter();
  const { currentWorkspaceId } = useWorkspaceStore();
  const { isPrivileged } = useRole();
  
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

  const queryClient = useQueryClient();
  
  const [project, setProject] = useState<Project | null>(null);
  const [members, setMembers] = useState<any[]>([]);
  
  const { data: projectTasks = [] } = useQuery({
    queryKey: ['project-tasks', workspaceId, projectId, phaseId],
    queryFn: () => taskService.getProjectTasks(workspaceId, projectId, { pageSize: 1000, phaseId }),
    select: (data) => data.tasks,
    enabled: !!workspaceId && !!projectId && !!phaseId,
  });
  
  // Modal state
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [projectData, workspaceData] = await Promise.all([
          projectService.getProjectById(workspaceId, projectId),
          workspaceService.getMembers(workspaceId)
        ]);
        setProject(projectData);
        setMembers(workspaceData.members || []);
      } catch (error) {
        console.error('Fetch project error:', error);
        toast.error('Không thể tải dữ liệu');
      } finally {
        setLoading(false);
      }
    };

    if (workspaceId && projectId && phaseId) {
      fetchData();
    }
  }, [workspaceId, projectId, phaseId]);

  const handleTaskClick = (task: Task) => {
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
      queryClient.invalidateQueries({ queryKey: ['project-tasks', workspaceId, projectId] });
      toast.success('Đã xóa công việc');
    } catch (error) {
      console.error('Delete task error:', error);
      toast.error('Xóa thất bại');
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
    <div className="space-y-6 h-full flex flex-col pb-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      {/* Project Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-[28px] bg-brand-primary/10 flex items-center justify-center text-4xl shadow-depth-2 border border-brand-primary/20 backdrop-blur-xl">
            {project.emoji || '🎯'}
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tighter leading-none mb-2">
              {project.name}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-1">
              {project.description || 'Không có mô tả dự án'}
            </p>
          </div>
        </div>

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
          <div className="px-6 py-2.5 bg-brand-primary text-white shadow-glow-combined transition-all text-[11px] font-black uppercase tracking-widest flex items-center rounded-2xl ring-1 ring-white/20">
            <CalendarIcon className="w-4 h-4 mr-2" /> Calendar
          </div>
          <Link 
            href={`/workspace/${workspaceId}/projects/${projectId}/phases/${phaseId}/analytics`}
            className="px-6 py-2.5 text-slate-500 dark:text-slate-400 hover:text-brand-primary transition-all text-[11px] font-black uppercase tracking-widest flex items-center rounded-2xl hover:bg-white dark:hover:bg-white/5"
          >
            <BarChart3 className="w-4 h-4 mr-2" /> Analytics
          </Link>
        </div>
      </div>

      {/* Calendar Container */}
      <div className="flex-1 min-h-[600px]">
        <TaskCalendar tasks={projectTasks} onTaskClick={handleTaskClick} />
      </div>

      <TaskDetailModal 
        task={selectedTask}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onUpdate={handleUpdateTask}
        onDelete={handleDeleteTask}
        members={members}
        tasks={projectTasks}
        isAdminOrOwner={isPrivileged}
      />
    </div>
  );
}
