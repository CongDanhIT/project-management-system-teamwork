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
  CornerDownRight,
  ChevronRight,
  ChevronDown
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
import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
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
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Drawer state
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const { data: projectData, isLoading: isProjectLoading } = useQuery({
    queryKey: ['project', workspaceId, projectId],
    queryFn: () => projectService.getProjectById(workspaceId, projectId),
    enabled: !!workspaceId && !!projectId,
  });

  // Fetch only Root Tasks for the current page
  const { data: rootTasksData, isLoading: isRootTasksLoading, isPlaceholderData } = useQuery({
    queryKey: ['project-root-tasks', workspaceId, projectId, currentPage, searchQuery],
    queryFn: () => taskService.getProjectTasks(workspaceId, projectId, { 
      pageNumber: currentPage, 
      pageSize, 
      parentId: 'null', // Fetch only top-level
      keyword: searchQuery 
    }),
    placeholderData: keepPreviousData,
    enabled: !!workspaceId && !!projectId,
  });

  // Fetch ALL subtasks of this project to build the tree (Subtasks don't affect root pagination)
  const { data: subtasksData, isLoading: isSubtasksLoading } = useQuery({
    queryKey: ['project-all-subtasks', workspaceId, projectId],
    queryFn: () => taskService.getProjectTasks(workspaceId, projectId, { 
      pageSize: 1000, 
      parentId: 'not-null' // Custom parameter handling or just fetch all and filter client side
    }),
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
    
    if (workspaceData) setMembers(workspaceData.members || []);
  }, [projectData, rootTasksData, subtasksData, workspaceData, queryClient, workspaceId]);

  const loading = isProjectLoading || isRootTasksLoading || isSubtasksLoading || isMembersLoading;

  const refreshTasks = async () => {
    queryClient.invalidateQueries({ queryKey: ['project-root-tasks'] });
    queryClient.invalidateQueries({ queryKey: ['project-all-subtasks'] });
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsDrawerOpen(true);
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

  const handleUpdateTask = async (taskId: string, data: Partial<Task>) => {
    try {
      const updatedTask = await taskService.updateTask(workspaceId, projectId, taskId, data);
      setTasks(prev => prev.map(t => t._id === taskId ? { ...t, ...updatedTask } : t));
      if (selectedTask?._id === taskId) {
        setSelectedTask({ ...selectedTask, ...updatedTask });
      }
      queryClient.invalidateQueries({ queryKey: ['project-root-tasks', workspaceId, projectId] });
      queryClient.invalidateQueries({ queryKey: ['project-all-subtasks', workspaceId, projectId] });
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
      queryClient.invalidateQueries({ queryKey: ['project-root-tasks', workspaceId, projectId] });
      queryClient.invalidateQueries({ queryKey: ['project-all-subtasks', workspaceId, projectId] });
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

      queryClient.invalidateQueries({ queryKey: ['project-root-tasks', workspaceId, projectId] });
      queryClient.invalidateQueries({ queryKey: ['project-all-subtasks', workspaceId, projectId] });
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
                          "group hover:bg-slate-50/50 cursor-pointer transition-colors relative",
                          hasSubtasks && isExpanded && "bg-slate-50/30"
                        )}
                      >
                        <td className="px-6 py-4 whitespace-nowrap relative">
                          <div className="flex items-center gap-3">
                            {hasSubtasks ? (
                              <button 
                                onClick={(e) => toggleRow(parentIdStr, e)}
                                className="w-5 h-5 flex items-center justify-center rounded-md hover:bg-indigo-100 text-slate-400 hover:text-indigo-600 transition-all z-10 bg-white border border-slate-200"
                              >
                                {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                              </button>
                            ) : (
                              <div className="w-5" />
                            )}
                            <span className="text-xs font-mono font-bold text-indigo-500 bg-indigo-50/50 px-2 py-0.5 rounded">
                              {parent.taskCode}
                            </span>
                          </div>
                          {hasSubtasks && isExpanded && (
                            <div className="absolute left-[34px] top-[44px] bottom-0 w-[1.5px] bg-slate-200 group-hover:bg-indigo-200 transition-colors" />
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold text-slate-900 tracking-tight transition-colors group-hover:text-indigo-600">
                              {parent.title}
                            </span>
                            {parent.description && (
                              <span className="text-xs text-slate-500 line-clamp-1 mt-0.5 font-normal italic">
                                {parent.description}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4"><StatusBadge status={parent.status} /></td>
                        <td className="px-6 py-4"><PriorityBadge priority={parent.priority} /></td>
                        <td className="px-6 py-4 text-slate-500">
                          {parent.assignedTo ? (
                            <div className="flex items-center gap-2">
                              <Avatar className="w-6 h-6 ring-1 ring-slate-200">
                                <AvatarImage src={parent.assignedTo.profilePicture} />
                                <AvatarFallback className="text-[10px] bg-indigo-50 text-indigo-600 font-bold uppercase">
                                  {parent.assignedTo.name?.[0]}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm truncate max-w-[100px]">{parent.assignedTo.name}</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full border border-dashed border-slate-300 flex items-center justify-center">
                                <User className="w-3 h-3 text-slate-300" />
                              </div>
                              <span className="text-xs italic">Chưa gán</span>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span className="text-xs font-medium tracking-wider">
                              {parent.dueDate ? format(new Date(parent.dueDate), 'dd MMM, yyyy', { locale: vi }) : '--'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400">
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
                            className="group hover:bg-indigo-50/20 cursor-pointer transition-colors relative"
                          >
                            <td className="px-6 py-3 whitespace-nowrap relative">
                              {!isLast ? (
                                <div className="absolute left-[34px] top-0 bottom-0 w-[1.5px] bg-slate-200 group-hover:bg-indigo-300 transition-colors" />
                              ) : (
                                <div className="absolute left-[34px] top-0 h-[50%] w-[1.5px] bg-slate-200 group-hover:bg-indigo-300 transition-colors" />
                              )}
                              <div className="absolute left-[34px] top-1/2 -translate-y-1/2 w-4 h-[1.5px] bg-slate-200 group-hover:bg-indigo-300 transition-colors" />
                              <div className="flex items-center gap-3 pl-8">
                                <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-100 group-hover:bg-indigo-50 group-hover:text-indigo-500 px-1.5 py-0.5 rounded transition-all">
                                  {subtask.taskCode}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-3">
                              <span className="text-sm font-medium text-slate-600 transition-colors group-hover:text-indigo-600">
                                {subtask.title}
                              </span>
                            </td>
                            <td className="px-6 py-3"><StatusBadge status={subtask.status} /></td>
                            <td className="px-6 py-3"><PriorityBadge priority={subtask.priority} /></td>
                            <td className="px-6 py-3">
                              {subtask.assignedTo ? (
                                <div className="flex items-center gap-2 opacity-80">
                                  <Avatar className="w-5 h-5 ring-1 ring-slate-100">
                                    <AvatarImage src={subtask.assignedTo.profilePicture} />
                                    <AvatarFallback className="text-[9px] bg-slate-50 text-slate-500 font-bold uppercase">
                                      {subtask.assignedTo.name?.[0]}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-xs text-slate-500 truncate max-w-[80px]">{subtask.assignedTo.name}</span>
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
              <span className="px-2 py-1 bg-white border border-slate-200 rounded-md text-indigo-600 font-bold">
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
              className="h-8 px-3 rounded-lg border-slate-200 text-slate-600 hover:bg-white hover:text-indigo-600 transition-all disabled:opacity-30"
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
                       "w-7 h-7 flex items-center justify-center text-[11px] font-bold rounded-md transition-all",
                       currentPage === pageNum 
                         ? "bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200" 
                         : "text-slate-400 hover:text-slate-600 hover:bg-white/50"
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
              className="h-8 px-3 rounded-lg border-slate-200 text-slate-600 hover:bg-white hover:text-indigo-600 transition-all disabled:opacity-30"
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
