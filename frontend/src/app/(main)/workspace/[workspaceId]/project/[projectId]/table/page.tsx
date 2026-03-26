'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { projectService, Project } from '@/services/project.service';
import { taskService } from '@/services/task.service';
import { workspaceService } from '@/services/workspace.service';
import { Task } from '@/types/task';
import { 
  Loader2, 
  LayoutGrid, 
  BarChart3, 
  Settings, 
  Layout, 
  Plus, 
  Search,
  Filter,
  ArrowUpDown,
  MoreHorizontal,
  Calendar,
  User,
  CornerDownRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { PriorityBadge } from '@/components/shared/PriorityBadge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { TaskDrawer } from '@/components/task/TaskDrawer';
import { CreateTaskModal } from '@/components/task/CreateTaskModal';
import { toast } from 'sonner';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useWorkspaceRole } from '@/hooks/useWorkspaceRole';

export default function ProjectTablePage() {
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  const projectId = params.projectId as string;
  const queryClient = useQueryClient();
  const { isAdminOrOwner } = useWorkspaceRole();
  
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Drawer state
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const { data: projectData, isLoading: isProjectLoading } = useQuery({
    queryKey: ['project', workspaceId, projectId],
    queryFn: () => projectService.getProjectById(workspaceId, projectId),
    enabled: !!workspaceId && !!projectId,
  });

  const { data: fetchedTasks, isLoading: isTasksLoading } = useQuery({
    queryKey: ['project-tasks', workspaceId, projectId],
    queryFn: () => taskService.getProjectTasks(workspaceId, projectId),
    enabled: !!workspaceId && !!projectId,
  });

  const { data: workspaceData, isLoading: isMembersLoading } = useQuery({
    queryKey: ['workspace-members', workspaceId],
    queryFn: () => workspaceService.getMembers(workspaceId),
    enabled: !!workspaceId,
  });

  useEffect(() => {
    if (projectData) {
      setProject(projectData);
      // Invalidate workspace projects to refresh sorting on dashboard
      queryClient.invalidateQueries({ queryKey: ['workspace-projects', workspaceId] });
    }
    if (fetchedTasks) setTasks(fetchedTasks);
    if (workspaceData) setMembers(workspaceData.members || []);
  }, [projectData, fetchedTasks, workspaceData, queryClient, workspaceId]);

  const loading = isProjectLoading || isTasksLoading || isMembersLoading;

  const refreshTasks = async () => {
    try {
      const tasksData = await taskService.getProjectTasks(workspaceId, projectId);
      setTasks(tasksData);
    } catch (error) {
      console.error('Refresh tasks error:', error);
    }
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsDrawerOpen(true);
  };

  const handleUpdateTask = async (taskId: string, data: Partial<Task>) => {
    try {
      const updatedTask = await taskService.updateTask(workspaceId, projectId, taskId, data);
      setTasks(prev => prev.map(t => t._id === taskId ? { ...t, ...updatedTask } : t));
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
      queryClient.invalidateQueries({ queryKey: ['project-tasks', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['workspace-tasks', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['workspace-tasks-list', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['workspace-analytics', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['workspace-projects', workspaceId] });
      setIsDrawerOpen(false);
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

  const filteredTasks: Task[] = [];
  const topLevelTasks = tasks.filter(t => !t.parentId);

  topLevelTasks.forEach(parent => {
    const parentMatches = parent.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          parent.taskCode.toLowerCase().includes(searchQuery.toLowerCase());
    
    const subTasks = tasks.filter(t => t.parentId === parent._id);
    const matchingSubTasks = subTasks.filter(t => 
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      t.taskCode.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (parentMatches || matchingSubTasks.length > 0) {
      filteredTasks.push(parent);
      if (parentMatches) {
        filteredTasks.push(...subTasks);
      } else {
        filteredTasks.push(...matchingSubTasks); // only show matching subtasks if parent didn't strictly match search
      }
    }
  });

  // Add any orphaned tasks just in case
  const loadedParentIds = new Set(topLevelTasks.map(t => t._id));
  tasks.forEach(t => {
    if (t.parentId && !loadedParentIds.has(t.parentId)) {
      if (t.title.toLowerCase().includes(searchQuery.toLowerCase()) || t.taskCode.toLowerCase().includes(searchQuery.toLowerCase())) {
        filteredTasks.push(t);
      }
    }
  });

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
        <p>Không tìm thấy dự án.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-2xl border border-indigo-100 shadow-sm">
            {project.emoji || '🎯'}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              {project.name}
            </h1>
            <p className="text-sm text-slate-500">Danh sách công việc & Cơ sở dữ liệu</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-white/50 backdrop-blur-sm p-1.5 rounded-xl border border-slate-200/60 shadow-sm">
          <Link 
            href={`/workspace/${workspaceId}/project/${projectId}/board`}
            className="px-3 py-1 text-slate-500 hover:text-slate-700 text-sm font-medium flex items-center"
          >
            <LayoutGrid className="w-4 h-4 mr-2" />
            Board
          </Link>
          <Link 
            href={`/workspace/${workspaceId}/project/${projectId}/table`}
            className="px-3 py-1 bg-white shadow-sm text-indigo-600 hover:text-indigo-700 font-semibold text-sm rounded-md flex items-center border border-slate-200"
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
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            placeholder="Tìm theo tiêu đề hoặc mã..." 
            className="pl-10 h-10 bg-white border-slate-200 rounded-xl"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" className="h-10 border-slate-200 rounded-xl text-slate-600">
            <Filter className="w-4 h-4 mr-2" />
            Lọc
          </Button>
          <Button 
            className="h-10 bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-indigo-100/50"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Thêm Task
          </Button>
        </div>
      </div>

      {/* Database Table */}
      <div className="flex-1 bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex flex-col min-h-0">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead className="sticky top-0 z-10">
              <tr className="bg-slate-50/80 backdrop-blur-sm border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-widest">
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
            <tbody className="divide-y divide-slate-100">
              {filteredTasks.length > 0 ? (
                filteredTasks.map((task) => (
                  <tr 
                    key={task._id} 
                    onClick={() => handleTaskClick(task)}
                    className="group hover:bg-slate-50/50 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-xs font-mono font-bold text-indigo-500 bg-indigo-50/50 px-2 py-0.5 rounded">
                        {task.taskCode}
                      </span>
                    </td>
                    <td className={cn("px-6 py-4 flex flex-col", task.parentId && "pl-14")}>
                      <div className="flex items-center gap-2">
                        {task.parentId && <CornerDownRight className="w-4 h-4 text-slate-300" />}
                        <span className={cn(
                          "text-sm tracking-tight transition-colors group-hover:text-indigo-600",
                          task.parentId ? "font-medium text-slate-600" : "font-semibold text-slate-900"
                        )}>
                          {task.title}
                        </span>
                      </div>
                      {task.description && !task.parentId && (
                        <span className="text-xs text-slate-500 line-clamp-1 mt-0.5 font-normal">
                          {task.description}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={task.status} />
                    </td>
                    <td className="px-6 py-4">
                      <PriorityBadge priority={task.priority} />
                    </td>
                    <td className="px-6 py-4">
                      {task.assignedTo ? (
                        <div className="flex items-center gap-2">
                          <Avatar className="w-6 h-6 ring-1 ring-slate-200">
                            <AvatarImage src={task.assignedTo.profilePicture} />
                            <AvatarFallback className="text-[10px] bg-indigo-50 text-indigo-600 font-bold uppercase">
                              {task.assignedTo.name?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm text-slate-600 truncate max-w-[100px]">{task.assignedTo.name}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-slate-400">
                          <div className="w-6 h-6 rounded-full border border-dashed border-slate-300 flex items-center justify-center">
                            <User className="w-3 h-3" />
                          </div>
                          <span className="text-xs italic">Chưa gán</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-slate-500 whitespace-nowrap">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-xs font-medium uppercase tracking-wider">
                          {task.dueDate ? format(new Date(task.dueDate), 'dd MMM, yyyy', { locale: vi }) : '--'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))
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
        
        {/* Footer info */}
        <div className="p-4 bg-slate-50/50 border-t border-slate-200 flex items-center justify-between text-xs font-medium text-slate-500">
          <span>Tổng số: {topLevelTasks.length} tác vụ chính & {tasks.length - topLevelTasks.length} tác vụ con</span>
          <span className="flex items-center gap-2 italic">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Đang đồng bộ thời gian thực
          </span>
        </div>
      </div>

      <TaskDrawer 
        task={selectedTask}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onUpdate={handleUpdateTask}
        onDelete={handleDeleteTask}
        onSubtaskUpdate={refreshTasks}
        members={members}
        tasks={tasks}
        isAdminOrOwner={isAdminOrOwner}
      />

      <CreateTaskModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        projects={project ? [project] : []}
        onSubmit={handleCreateTask}
        workspaceId={workspaceId}
      />
    </div>
  );
}
