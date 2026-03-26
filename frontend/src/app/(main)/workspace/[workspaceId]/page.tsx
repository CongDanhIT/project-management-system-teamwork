'use client';

import React from 'react';
import { useParams } from 'next/navigation';
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
  MoreHorizontal
} from 'lucide-react';
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
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Task, TaskStatus } from '@/types/task';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const TaskDrawer = dynamic(() => import('@/components/task/TaskDrawer').then(mod => mod.TaskDrawer), { 
  ssr: false, 
  loading: () => null 
});
import { ScrollArea } from '@/components/ui/scroll-area';

import { useWorkspaceRole } from '@/hooks/useWorkspaceRole';

export default function WorkspaceDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const workspaceId = params.workspaceId as string;
  const { isAdminOrOwner } = useWorkspaceRole();

  const [selectedTask, setSelectedTask] = React.useState<Task | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);
  const [editingProject, setEditingProject] = React.useState<Project | null>(null);
  const [deletingProject, setDeletingProject] = React.useState<Project | null>(null);
  const [projectFormOpen, setProjectFormOpen] = React.useState(false);

  // Fetch Analytics
  const { data: analytics, isLoading: isAnalyticsLoading } = useQuery({
    queryKey: ['workspace-analytics', workspaceId],
    queryFn: () => workspaceService.getWorkspaceAnalytics(workspaceId),
    enabled: !!workspaceId,
  });

  // Fetch Projects
  const { data: projectsData, isLoading: isProjectsLoading } = useQuery({
    queryKey: ['workspace-projects', workspaceId],
    queryFn: () => projectService.getProjectsByWorkspace(workspaceId, 1, 10),
    enabled: !!workspaceId,
  });

  // Fetch Recent Tasks
  const { data: tasksData, isLoading: isTasksLoading } = useQuery({
    queryKey: ['workspace-tasks', workspaceId],
    queryFn: () => taskService.getTasksByWorkspace(workspaceId, { limit: 10 }), // Fetch more to allow filtering
    enabled: !!workspaceId,
  });

  // Fetch Members for TaskDrawer
  const { data: membersData } = useQuery({
    queryKey: ['workspace-members', workspaceId],
    queryFn: () => workspaceService.getMembers(workspaceId),
    enabled: !!workspaceId,
  });

  // Filter out DONE tasks
  const activeTasks = (tasksData?.tasks || [])
    .filter((task: Task) => task.status !== TaskStatus.DONE)
    .slice(0, 5); // Only show top 5 active tasks

  // Fetch Members for TaskDrawer

  const stats = [
    { label: 'Tổng công việc', value: analytics?.totalTasks || 0, icon: CheckCircle2, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Đang thực hiện', value: analytics?.inProgressTasks || 0, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Đã hoàn thành', value: analytics?.completedTasks || 0, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Quá hạn', value: analytics?.overdueTasks || 0, icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50' },
  ];

  const isLoading = isAnalyticsLoading || isProjectsLoading || isTasksLoading;

  const handleProjectClick = (projectId: string) => {
    router.push(`/workspace/${workspaceId}/project/${projectId}/board`);
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

  const handleEditProject = (p: Project) => {
    setEditingProject(p);
    setProjectFormOpen(true);
  };

  const handleDeleteProject = (p: Project) => {
    setDeletingProject(p);
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsDrawerOpen(true);
  };

  const handleUpdateTask = async (taskId: string, data: any) => {
    try {
      await taskService.updateTask(workspaceId, selectedTask?.projectId?._id || '', taskId, data);
      queryClient.invalidateQueries({ queryKey: ['workspace-tasks', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['workspace-tasks-list', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['workspace-analytics', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['project-tasks', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['workspace-projects', workspaceId] });
      toast.success("Đã cập nhật công việc");
    } catch (error) {
      toast.error("Không thể cập nhật công việc");
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      if (window.confirm("Bạn có chắc chắn muốn xóa công việc này?")) {
        await taskService.deleteTask(workspaceId, selectedTask?.projectId?._id || '', taskId);
        setIsDrawerOpen(false);
        queryClient.invalidateQueries({ queryKey: ['workspace-tasks', workspaceId] });
        queryClient.invalidateQueries({ queryKey: ['workspace-tasks-list', workspaceId] });
        queryClient.invalidateQueries({ queryKey: ['workspace-analytics', workspaceId] });
        queryClient.invalidateQueries({ queryKey: ['project-tasks', workspaceId] });
        queryClient.invalidateQueries({ queryKey: ['workspace-projects', workspaceId] });
        toast.success("Đã xóa công việc");
      }
    } catch (error) {
      toast.error("Không thể xóa công việc");
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Welcome Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Tổng quan Workspace</h1>
        <p className="text-slate-500 font-medium">Theo dõi tiến độ và các hoạt động quan trọng trong nhóm của bạn.</p>
      </div>

      {/* Stats Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.label} className="border-slate-200/60 shadow-sm hover:shadow-md transition-shadow overflow-hidden group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">{stat.label}</p>
                  <div className="text-3xl font-bold text-slate-900 mt-2">
                    {isLoading ? <Skeleton className="h-9 w-12" /> : stat.value}
                  </div>
                </div>
                <div className={cn("p-3 rounded-2xl transition-transform group-hover:scale-110 duration-300", stat.bg)}>
                  <stat.icon className={cn("w-6 h-6", stat.color)} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Projects */}
        <Card className="lg:col-span-2 border-slate-200/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between py-6">
            <CardTitle className="text-xl font-bold text-slate-900">Dự án gần đây</CardTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleSeeAllProjects}
              className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 font-semibold"
            >
              Xem tất cả <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent className="px-0">
            <ScrollArea className="h-[300px]">
              <div className="divide-y divide-slate-100">
                {isProjectsLoading ? (
                  [1, 2, 3].map(i => (
                    <div key={i} className="flex items-center gap-4 p-4 mx-2">
                      <Skeleton className="w-12 h-12 rounded-2xl" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-48" />
                      </div>
                    </div>
                  ))
                ) : (
                  (projectsData?.projects || []).map((project: any) => (
                    <div 
                      key={project._id} 
                      onClick={() => handleProjectClick(project._id)}
                      className="flex items-center justify-between p-4 hover:bg-slate-50/80 transition-colors mx-2 rounded-xl group cursor-pointer"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-2xl shadow-sm group-hover:border-indigo-200 group-hover:shadow-indigo-50 transition-all">
                          {project.emoji || '📁'}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{project.name}</p>
                          <p className="text-xs text-slate-500 font-medium">Bản cập nhật cuối: {new Date(project.updatedAt).toLocaleDateString('vi-VN')}</p>
                        </div>
                      </div>
                      {isAdminOrOwner && (
                        <div onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger 
                              className="text-slate-400 opacity-0 group-hover:opacity-100 h-8 w-8 inline-flex items-center justify-center rounded-lg transition-all hover:bg-slate-100 outline-none"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                              <DropdownMenuGroup>
                                <DropdownMenuItem onClick={() => handleProjectClick(project._id)}>
                                  <Layout className="w-3.5 h-3.5 mr-2" />
                                  Mở bảng
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleEditProject(project)}>
                                  <Pencil className="w-3.5 h-3.5 mr-2" />
                                  Chỉnh sửa
                                </DropdownMenuItem>
                              </DropdownMenuGroup>
                              <DropdownMenuSeparator />
                              <DropdownMenuGroup>
                                <DropdownMenuItem 
                                  onClick={() => handleDeleteProject(project)}
                                  className="text-red-600 focus:text-red-600"
                                >
                                  <Trash2 className="w-3.5 h-3.5 mr-2" />
                                  Xoá dự án
                                </DropdownMenuItem>
                              </DropdownMenuGroup>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                    )}
                    </div>
                  ))
                )}
                {!isProjectsLoading && projectsData?.projects?.length === 0 && (
                  <div className="p-12 text-center">
                    <p className="text-slate-400 font-medium italic">Chưa có dự án nào được tạo.</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Recent Activities/Tasks */}
        <Card className="border-slate-200/60 shadow-sm">
          <CardHeader className="py-6">
            <CardTitle className="text-xl font-bold text-slate-900">Việc cần làm</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[280px] pr-4">
              <div className="space-y-4">
                {isTasksLoading ? (
                  [1, 2, 3, 4].map(i => (
                    <div key={i} className="flex gap-4 items-center p-3">
                        <Skeleton className="w-2.5 h-2.5 rounded-full" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-3 w-full" />
                          <Skeleton className="h-2 w-20" />
                        </div>
                    </div>
                  ))
                ) : (
                  activeTasks.map((task: any) => (
                    <div 
                      key={task._id} 
                      onClick={() => handleTaskClick(task)}
                      className="flex gap-4 items-start p-3 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer group border border-transparent hover:border-slate-100"
                    >
                      <div className={cn(
                        "mt-1 w-2.5 h-2.5 rounded-full shrink-0 shadow-sm",
                        task.priority === 'high' ? 'bg-red-500' : task.priority === 'medium' ? 'bg-amber-500' : 'bg-blue-500'
                      )}></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">{task.title}</p>
                        
                        {/* Project Info Tag */}
                        {task.projectId && (
                          <div className="flex items-center gap-1 mt-0.5 opacity-80">
                            <span className="text-[10px]">{task.projectId.emoji || '📁'}</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter truncate max-w-[120px]">
                              {task.projectId.name}
                            </span>
                          </div>
                        )}

                        <div className="flex items-center gap-2 mt-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                            {task.dueDate ? new Date(task.dueDate).toLocaleDateString('vi-VN') : 'Kế hoạch'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
                {!isTasksLoading && activeTasks.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-slate-400 font-medium italic">Mọi thứ đã hoàn tất!</p>
                  </div>
                )}
              </div>
            </ScrollArea>
            {!isTasksLoading && activeTasks.length > 0 && (
              <Button 
                variant="outline" 
                onClick={handleSeeAllTasks}
                className="w-full mt-6 border-slate-200 text-slate-600 font-semibold hover:bg-slate-50"
              >
                Xem tất cả công việc
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      <TaskDrawer
        task={selectedTask}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
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
          <p className="text-sm text-slate-600">
            Dự án <span className="font-bold text-slate-900">"{deletingProject?.name}"</span> cùng tất cả công việc bên trong sẽ được chuyển vào thùng rác.
          </p>
          <DialogFooter className="mt-2">
            <Button variant="outline" onClick={() => setDeletingProject(null)}>
              Huỷ
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Đang xoá...' : 'Xoá dự án'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
