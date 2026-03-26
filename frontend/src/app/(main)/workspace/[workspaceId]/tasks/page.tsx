'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { taskService } from '@/services/task.service';
import { projectService } from '@/services/project.service';
import { TaskRow } from '@/components/task/TaskRow';
import { TaskFilters } from '@/components/task/TaskFilters';
import { Loader2, Inbox, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Task } from '@/types/task';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TaskDrawer } from '@/components/task/TaskDrawer';
import { CreateTaskModal } from '@/components/task/CreateTaskModal';
import { workspaceService } from '@/services/workspace.service';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { useWorkspaceRole } from '@/hooks/useWorkspaceRole';

export default function TaskListPage() {
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  const queryClient = useQueryClient();
  const { isAdminOrOwner } = useWorkspaceRole();
  
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    priority: 'all',
    projectId: 'all',
    assignedTo: 'all',
    parentId: 'all',
  });

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['workspace-tasks-list', workspaceId, filters],
    queryFn: () => taskService.getTasksByWorkspace(workspaceId, {
      ... (filters.status !== 'all' && { status: filters.status }),
      ... (filters.priority !== 'all' && { priority: filters.priority }),
      ... (filters.projectId !== 'all' && { projectId: filters.projectId }),
      ... (filters.assignedTo !== 'all' && { assignedTo: filters.assignedTo }),
      ... (filters.parentId !== 'all' && { parentId: filters.parentId === 'root' ? '' : filters.parentId }),
      ... (filters.search && { search: filters.search }),
      pageSize: 50
    }),
    enabled: !!workspaceId,
  });

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

  const tasks = data?.tasks || [];
  const members = membersData?.members || [];
  const projects = projectsData?.projects || [];
  const allTasks = allTasksData?.tasks || [];

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsDrawerOpen(true);
  };

  const handleUpdateTask = async (taskId: string, data: any) => {
    try {
        await taskService.updateTask(workspaceId, selectedTask?.projectId?._id || '', taskId, data);
        queryClient.invalidateQueries({ queryKey: ['workspace-tasks-list', workspaceId] });
        queryClient.invalidateQueries({ queryKey: ['project-tasks', workspaceId] });
        queryClient.invalidateQueries({ queryKey: ['workspace-tasks', workspaceId] });
        queryClient.invalidateQueries({ queryKey: ['workspace-analytics', workspaceId] });
        queryClient.invalidateQueries({ queryKey: ['workspace-projects', workspaceId] });
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
        queryClient.invalidateQueries({ queryKey: ['workspace-tasks-list', workspaceId] });
        queryClient.invalidateQueries({ queryKey: ['project-tasks', workspaceId] });
        queryClient.invalidateQueries({ queryKey: ['workspace-tasks', workspaceId] });
        queryClient.invalidateQueries({ queryKey: ['workspace-analytics', workspaceId] });
        queryClient.invalidateQueries({ queryKey: ['workspace-projects', workspaceId] });
        toast.success("Đã xóa công việc");
    } catch (error) {
        toast.error("Lỗi khi xóa công việc");
    }
  };

  const handleCreateTask = async (pId: string, taskData: any) => {
    try {
        await taskService.createTask(workspaceId, pId, taskData);
        const subtasksCount = taskData.subtasks?.length || 0;

        queryClient.invalidateQueries({ queryKey: ['workspace-tasks-list', workspaceId] });
        queryClient.invalidateQueries({ queryKey: ['project-tasks', workspaceId] });
        queryClient.invalidateQueries({ queryKey: ['workspace-tasks', workspaceId] });
        queryClient.invalidateQueries({ queryKey: ['workspace-analytics', workspaceId] });
        queryClient.invalidateQueries({ queryKey: ['workspace-projects', workspaceId] });
        
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
        assignedTo: 'all',
        parentId: 'all',
    });
  };

  return (
    <div className="flex flex-col h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Công việc của tôi</h1>
            <p className="text-slate-500 font-medium">Quản lý và theo dõi tiến độ công việc tập trung.</p>
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
        onAssigneeChange={(assignedTo: string) => setFilters(prev => ({ ...prev, assignedTo }))}
        onParentTaskChange={(parentId: string) => setFilters(prev => ({ ...prev, parentId }))}
        onClear={clearFilters}
      />

      {/* List Container */}
      <div className="flex-1 min-h-0 bg-white/50 backdrop-blur-md rounded-2xl border border-slate-200/60 overflow-hidden shadow-sm">
        <div className="bg-slate-50/50 px-4 py-2 flex items-center gap-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
           <div className="w-4" /> {/* Checkbox space */}
           <div className="w-20">Mã Task</div>
           <div className="flex-1">Công việc & Dự án</div>
           <div className="flex items-center gap-6 w-[450px] justify-end pr-4">
             <div className="w-24 text-center">Trạng thái</div>
             <div className="w-32">Ưu tiên</div>
             <div className="w-32">Ngày hết hạn</div>
             <div className="w-8">Người làm</div>
           </div>
        </div>

        <ScrollArea className="h-[calc(100vh-350px)]">
          {isLoading ? (
            <div className="flex items-center justify-center p-20">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
          ) : tasks.length > 0 ? (
            <div className="divide-y divide-slate-50">
              {tasks.map((task: Task) => (
                <TaskRow key={task._id} task={task} onClick={handleTaskClick} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-20 text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                <Inbox className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Không tìm thấy công việc</h3>
              <p className="text-slate-500 text-sm mt-1 max-w-[280px]">Hãy thử điều chỉnh bộ lọc hoặc tạo công việc mới.</p>
              {Object.values(filters).some(v => v !== '' && v !== 'all') && (
                <Button variant="link" onClick={clearFilters} className="text-indigo-600 font-bold mt-4">
                    Xóa tất cả lọc
                </Button>
              )}
            </div>
          )}
        </ScrollArea>
      </div>

      <TaskDrawer 
        task={selectedTask}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
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
      />
    </div>
  );
}
