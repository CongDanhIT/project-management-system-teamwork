'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { KanbanBoard } from '@/components/project/KanbanBoard';
import { projectService, Project } from '@/services/project.service';
import { taskService } from '@/services/task.service';
import { workspaceService } from '@/services/workspace.service';
import { useWorkspaceStore } from '@/stores/workspace.store';
import { Loader2, LayoutGrid, BarChart3, Settings, Layout } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { TaskDrawer } from '@/components/task/TaskDrawer';
import { CreateTaskModal } from '@/components/task/CreateTaskModal';
import { Task, TaskStatus } from '@/types/task';
import { toast } from 'sonner';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { useWorkspaceRole } from '@/hooks/useWorkspaceRole';

export default function ProjectBoardPage() {
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  const projectId = params.projectId as string;
  const { currentWorkspaceId } = useWorkspaceStore();
  const { isAdminOrOwner } = useWorkspaceRole();
  const queryClient = useQueryClient();
  const [project, setProject] = useState<Project | null>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const { data: projectTasks = [] } = useQuery({
    queryKey: ['project-tasks', workspaceId, projectId],
    queryFn: () => taskService.getProjectTasks(workspaceId, projectId),
    enabled: !!workspaceId && !!projectId,
  });
  
  // Drawer state
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0); // To refresh KanbanBoard
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createModalStatus, setCreateModalStatus] = useState<TaskStatus>(TaskStatus.TODO);

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

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsDrawerOpen(true);
  };

  const handleUpdateTask = async (taskId: string, data: any) => {
    try {
      const updatedTask = await taskService.updateTask(workspaceId, projectId, taskId, data);
      if (selectedTask?._id === taskId) {
        setSelectedTask({ ...selectedTask, ...updatedTask });
      }
      queryClient.invalidateQueries({ queryKey: ['project-tasks', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['workspace-tasks', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['workspace-tasks-list', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['workspace-analytics', workspaceId] });
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
      setIsDrawerOpen(false);
      queryClient.invalidateQueries({ queryKey: ['project-tasks', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['workspace-tasks', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['workspace-tasks-list', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['workspace-analytics', workspaceId] });
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

      queryClient.invalidateQueries({ queryKey: ['project-tasks', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['workspace-tasks', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['workspace-tasks-list', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['workspace-analytics', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['workspace-projects', workspaceId] });
      
      if (isDrawerOpen && selectedTask && taskData.parentId === selectedTask._id) {
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
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
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
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-2xl border border-indigo-100 shadow-sm">
            {project.emoji || '🎯'}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              {project.name}
            </h1>
            <p className="text-sm text-slate-500 line-clamp-1">
              {project.description || 'Không có mô tả dự án'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-white/50 backdrop-blur-sm p-1.5 rounded-xl border border-slate-200/60 shadow-sm">
          <Link 
            href={`/workspace/${workspaceId}/project/${projectId}/board`}
            className="px-3 py-1 bg-white shadow-sm text-indigo-600 hover:text-indigo-700 font-semibold text-sm rounded-md flex items-center border border-slate-200"
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
            className="px-3 py-1 text-slate-500 hover:text-slate-700 text-sm font-medium flex items-center"
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Analytics
          </Link>
          <div className="w-px h-4 bg-slate-200 mx-1" />
          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-600">
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Kanban Board Container */}
      <div className="flex-1 min-h-0 bg-slate-50/30 -mx-4 md:-mx-8 px-4 md:px-8 py-6 rounded-t-[32px] border-t border-slate-200/60">
        <KanbanBoard 
          key={refreshKey}
          workspaceId={workspaceId} 
          projectId={projectId} 
          onTaskClick={handleTaskClick}
          onAddTaskClick={(status) => {
            setCreateModalStatus(status);
            setIsCreateModalOpen(true);
          }}
          isAdminOrOwner={isAdminOrOwner}
        />
      </div>

      <TaskDrawer 
        task={selectedTask}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onUpdate={handleUpdateTask}
        onDelete={handleDeleteTask}
        onSubtaskUpdate={() => setRefreshKey(prev => prev + 1)}
        members={members}
        tasks={projectTasks}
        isAdminOrOwner={isAdminOrOwner}
      />

      <CreateTaskModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        projects={project ? [project] : []}
        onSubmit={handleCreateTask}
        initialStatus={createModalStatus}
        workspaceId={workspaceId}
      />
    </div>
  );
}
