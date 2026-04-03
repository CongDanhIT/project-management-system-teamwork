'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectService, Project } from '@/services/project.service';
import { taskService } from '@/services/task.service';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  Bell,
  SlidersHorizontal,
  ArrowUpDown,
  LayoutGrid,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { ProjectFormDialog } from '@/components/project/ProjectFormDialog';
import { useWorkspaceRole } from '@/hooks/useWorkspaceRole';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

/**
 * Project Status Mapping
 */
const STATUS_CONFIG: Record<string, { label: string; color: string; progress: number }> = {
  PLANNING: { label: 'Lập kế hoạch', color: 'bg-slate-100 text-slate-600 border-slate-200', progress: 0 },
  ACTIVE: { label: 'Đang hoạt động', color: 'bg-orange-50 text-orange-700 border-orange-200', progress: 45 },
  ON_HOLD: { label: 'Tạm dừng', color: 'bg-amber-50 text-amber-700 border-amber-200', progress: 15 },
  COMPLETED: { label: 'Hoàn thành', color: 'bg-teal-50 text-teal-700 border-teal-200', progress: 100 },
  FROZEN: { label: 'Đóng băng', color: 'bg-blue-50 text-blue-700 border-blue-200', progress: 0 },
};

/**
 * --- Project Card (Premium Design) ---
 */
function ProjectCard({
  project,
  workspaceId,
  onEdit,
  onDelete,
  onRestore,
  onPermanentDelete,
  isAdminOrOwner,
  activeTab = 'active',
}: {
  project: Project;
  workspaceId: string;
  onEdit: (p: Project) => void;
  onDelete: (p: Project) => void;
  onRestore?: (pId: string) => void;
  onPermanentDelete?: (p: Project) => void;
  isAdminOrOwner: boolean;
  activeTab?: 'active' | 'trash';
}) {
  const router = useRouter();
  const config = STATUS_CONFIG[project.status || 'PLANNING'] || STATUS_CONFIG.PLANNING;
  const isTrash = activeTab === 'trash';

  // Dải màu Premium Pastels có chiều sâu
  const colors = [
    "bg-indigo-50/80 text-indigo-600 shadow-indigo-100/50 border-indigo-100/50",
    "bg-rose-50/80 text-rose-600 shadow-rose-100/50 border-rose-100/50",
    "bg-amber-50/80 text-amber-600 shadow-amber-100/50 border-amber-100/50",
    "bg-emerald-50/80 text-emerald-600 shadow-emerald-100/50 border-emerald-100/50",
    "bg-sky-50/80 text-sky-600 shadow-sky-100/50 border-sky-100/50",
    "bg-violet-50/80 text-violet-600 shadow-violet-100/50 border-violet-100/50",
  ];

  const colorIndex = (project._id ? project._id.toString().charCodeAt(project._id.toString().length - 1) : 0) % colors.length;
  const projectColorClasses = colors[colorIndex];

  const totalTasks = project.totalTasks || 0;
  const completedTasks = project.completedTasks || 0;
  const actualProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <Card
      onClick={() => {
        if (isTrash) return;
        router.push(`/workspace/${workspaceId}/project/${project._id}/board`);
      }}
      className={cn(
        "group relative p-8 rounded-[32px] border-none bg-white shadow-ambient-subtle hover:shadow-ambient transition-all duration-500 overflow-hidden flex flex-col min-h-[380px] h-full",
        isTrash ? "opacity-80 cursor-default" : "cursor-pointer hover:shadow-ambient"
      )}
    >
      {/* Decorative Gradient Background on Hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50/0 via-slate-50/0 to-slate-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
      
      {/* Top Section: Icon & Badge */}
      <div className="relative flex items-start justify-between mb-8" onClick={(e) => e.stopPropagation()}>
        <div className={cn(
          "w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-sm transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3 shrink-0",
          projectColorClasses
        )}>
          {project.emoji || '🎯'}
        </div>

        <div className="flex items-center gap-2">
          {!isTrash && (
            <Badge 
              variant="outline" 
              className={cn(
                "text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border-none shadow-sm",
                config.color
              )}
            >
              {config.label}
            </Badge>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-9 w-9 rounded-full bg-slate-50/50 hover:bg-slate-100 text-slate-400 border-none transition-colors"
                  onClick={(e) => e.stopPropagation()}
                />
              }
            >
              <MoreHorizontal className="w-4 h-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-2xl border-slate-100 shadow-ambient p-1.5 min-w-[180px]">
              {activeTab === 'active' ? (
                <>
                  <DropdownMenuItem onClick={() => onEdit(project)} className="rounded-xl font-bold text-slate-600 gap-3 py-2.5">
                    <Pencil className="w-4 h-4 text-indigo-500" /> Sửa thông tin
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-slate-50" />
                  <DropdownMenuItem onClick={() => onDelete(project)} className="rounded-xl font-bold text-red-500 hover:text-red-600 hover:bg-red-50 gap-3 py-2.5">
                    <Trash2 className="w-4 h-4" /> Đưa vào thùng rác
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuItem onClick={() => onRestore?.(project._id)} className="rounded-xl font-bold text-teal-600 gap-3 py-2.5">
                    Khôi phục dự án
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-slate-50" />
                  <DropdownMenuItem onClick={() => onPermanentDelete?.(project)} className="rounded-xl font-bold text-red-600 gap-3 py-2.5">
                    Xoá vĩnh viễn
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Content Section */}
      <div className="relative flex-1 space-y-3 px-1 overflow-hidden">
        <h3 className="text-xl font-bold text-slate-900 tracking-tight leading-tight group-hover:text-teal-700 transition-colors duration-300 line-clamp-2 break-words">
          {project.name}
        </h3>
        <p className="text-sm font-medium text-slate-400 line-clamp-3 leading-relaxed opacity-85 group-hover:opacity-100 transition-opacity break-words">
          {project.description || 'Chưa có mô tả cho dự án này'}
        </p>
      </div>

      {/* Progress Section */}
      <div className="relative mt-auto pt-6 space-y-4 border-t border-slate-50/50 shrink-0">
        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-500">
          <span className="group-hover:text-slate-700 transition-all">Tiến độ công việc</span>
          <span className="text-slate-900 font-extrabold">{actualProgress}%</span>
        </div>
        
        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-teal-500 to-teal-400 transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(20,184,166,0.3)]"
            style={{ width: `${actualProgress}%` }}
          />
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="flex -space-x-2.5">
            {project.members && project.members.length > 0 ? (
              project.members.slice(0, 3).map((member: any, i: number) => (
                <Avatar key={i} className="h-8 w-8 border-2 border-white ring-2 ring-transparent group-hover:ring-teal-50 shadow-sm">
                  <AvatarImage src={member.userId?.profilePicture} />
                  <AvatarFallback className="bg-slate-100 text-[10px] font-bold">{member.userId?.name?.[0].toUpperCase()}</AvatarFallback>
                </Avatar>
              ))
            ) : (
              <Avatar className="h-8 w-8 border-2 border-white opacity-50 grayscale">
                <AvatarFallback className="bg-slate-50 text-[10px] font-black">?</AvatarFallback>
              </Avatar>
            )}
            {project.members && project.members.length > 3 && (
              <div className="h-8 w-8 rounded-full bg-slate-50 border-2 border-white flex items-center justify-center text-[10px] font-black text-slate-400">
                +{project.members.length - 3}
              </div>
            )}
          </div>

          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
            Cập nhật {formatDistanceToNow(new Date(project.updatedAt || Date.now()), { addSuffix: true, locale: vi })}
          </span>
        </div>
      </div>
    </Card>
  );
}

/**
 * Placeholder for new project creation
 */
function CreateProjectPlaceholder({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group min-h-[380px] h-full w-full rounded-[32px] border-2 border-dashed border-slate-200 hover:border-teal-500/50 hover:bg-teal-50/10 transition-all duration-500 flex flex-col items-center justify-center gap-5 cursor-pointer relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-50/30 opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <div className="relative w-16 h-16 rounded-3xl bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:scale-110 group-hover:bg-teal-500 group-hover:border-teal-400 transition-all duration-500 shadow-sm">
        <Plus className="w-8 h-8 text-slate-400 group-hover:text-white transition-colors" />
      </div>
      
      <div className="relative text-center space-y-1">
        <span className="block text-sm font-bold text-slate-900 uppercase tracking-wider">Tạo dự án mới</span>
        <span className="block text-[11px] font-medium text-slate-500">Thiết lập mục tiêu & nhiệm vụ</span>
      </div>
    </button>
  );
}

/**
 * --- Main Page Component ---
 */
export default function ProjectsPage() {
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  const queryClient = useQueryClient();
  const { isAdminOrOwner } = useWorkspaceRole();

  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'active' | 'trash'>('active');
  const [trashType, setTrashType] = useState<'PROJECT' | 'TASK'>('PROJECT');
  const [formOpen, setFormOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);
  const [hardDeletingProject, setHardDeletingProject] = useState<Project | null>(null);
  const [deletingTask, setDeletingTask] = useState<any | null>(null);

  const { data, isLoading, refetch: refetchActive } = useQuery({
    queryKey: ['workspace-projects', workspaceId],
    queryFn: () => projectService.getProjectsByWorkspace(workspaceId, 1, 50),
    enabled: !!workspaceId,
  });

  const { data: deletedData, isLoading: isDeletedLoading, refetch: refetchDeletedProjects } = useQuery({
    queryKey: ['workspace-deleted-projects', workspaceId],
    queryFn: () => projectService.getDeletedProjects(workspaceId),
    enabled: !!workspaceId && activeTab === 'trash',
  });

  const { data: deletedTasksData, isLoading: isDeletedTasksLoading, refetch: refetchDeletedTasks } = useQuery({
    queryKey: ['workspace-deleted-tasks', workspaceId],
    queryFn: () => taskService.getDeletedTasks(workspaceId),
    enabled: !!workspaceId && activeTab === 'trash',
  });

  // Tự động làm mới khi chuyển Tab
  React.useEffect(() => {
    if (activeTab === 'trash') {
      refetchDeletedProjects();
      refetchDeletedTasks();
    } else {
      refetchActive();
    }
  }, [activeTab, trashType, refetchDeletedProjects, refetchDeletedTasks, refetchActive]);

  const isCurrentLoading = activeTab === 'active' 
    ? isLoading 
    : (trashType === 'PROJECT' ? isDeletedLoading : isDeletedTasksLoading);
    
  const currentItems = activeTab === 'active' 
    ? (data?.projects ?? []) 
    : (trashType === 'PROJECT' ? (deletedData ?? []) : (deletedTasksData ?? []));

  const filtered = currentItems.filter((item: any) => {
    const name = item.name || item.title || '';
    return name.toLowerCase().includes(search.toLowerCase());
  });

  const deleteMutation = useMutation({
    mutationFn: () => projectService.deleteProject(workspaceId, deletingProject!._id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-projects', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['workspace-deleted-projects', workspaceId] });
      toast.success('Dự án đã được đưa vào thùng rác!');
      setDeletingProject(null);
    },
  });

  const restoreMutation = useMutation({
    mutationFn: (pId: string) => projectService.restoreProject(workspaceId, pId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-projects', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['workspace-deleted-projects', workspaceId] });
      toast.success('Đã khôi phục dự án và toàn bộ công việc liên quan thành công!');
    },
  });

  const hardDeleteMutation = useMutation({
    mutationFn: () => projectService.permanentDeleteProject(workspaceId, hardDeletingProject!._id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-deleted-projects', workspaceId] });
      toast.success('Dự án đã bị xoá vĩnh viễn!');
      setHardDeletingProject(null);
    },
  });

  const restoreTaskMutation = useMutation({
    mutationFn: (tId: string) => taskService.restoreTask(workspaceId, tId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-deleted-tasks', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['workspace-tasks', workspaceId] });
      toast.success('Đã khôi phục công việc thành công!');
    },
  });

  const hardDeleteTaskMutation = useMutation({
    mutationFn: () => taskService.hardDeleteTask(workspaceId, deletingTask!._id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-deleted-tasks', workspaceId] });
      toast.success('Công việc đã bị xoá vĩnh viễn!');
      setDeletingTask(null);
    },
  });

  function handleEdit(p: Project) {
    setEditingProject(p);
    setFormOpen(true);
  }

  return (
    <div className="space-y-12 animate-in fade-in duration-1000">
      {/* Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-4">
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight leading-none">
            {activeTab === 'trash' ? 'Thùng rác' : 'Dự án'}
          </h1>
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest opacity-80">
            {activeTab === 'trash' 
              ? `${(deletedData?.length || 0) + (deletedTasksData?.length || 0)} mục đã xoá đang chờ xử lý` 
              : `${data?.projects?.length || 0} dự án đang được quản lý`}
          </p>
        </div>
      </div>

      {/* --- Action Bar (Editorial Style) --- */}
      <div className="flex flex-wrap items-center justify-between gap-6 py-2 border-b border-slate-100/60">
        <div className="flex items-center gap-10">
          <button
            onClick={() => { setActiveTab('active'); setTrashType('PROJECT'); }}
            className={cn(
              "pb-5 text-[11px] font-black uppercase tracking-[0.15em] transition-all border-b-2 relative -mb-[2px]",
              activeTab === 'active'
                ? "text-slate-900 border-teal-500"
                : "text-slate-500 border-transparent hover:text-slate-700 hover:border-slate-200"
            )}
          >
            Đang hoạt động
            {data?.projects?.length > 0 && activeTab === 'active' && (
              <span className="ml-3 px-2 py-0.5 bg-slate-100 text-[9px] text-slate-500 rounded-full font-black tracking-normal">{data.projects.length}</span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('trash')}
            className={cn(
              "pb-5 text-[11px] font-black uppercase tracking-[0.15em] transition-all border-b-2 relative -mb-[2px]",
              activeTab === 'trash'
                ? "text-red-500 border-red-500"
                : "text-slate-500 border-transparent hover:text-slate-700 hover:border-slate-200"
            )}
          >
            Thùng rác
             {((deletedData?.length || 0) + (deletedTasksData?.length || 0)) > 0 && (
              <span className="ml-3 px-2 py-0.5 bg-red-50 text-[9px] text-red-500 rounded-full font-black tracking-normal">
                {(deletedData?.length || 0) + (deletedTasksData?.length || 0)}
              </span>
            )}
          </button>
        </div>

        <div className="flex items-center gap-4 pb-3">
          {activeTab === 'trash' && (
            <div className="flex bg-slate-50 p-1.5 rounded-full mr-4 border border-slate-200 shadow-sm transition-all">
              <button
                onClick={() => setTrashType('PROJECT')}
                className={cn(
                  "px-6 py-2 text-[10px] font-black uppercase tracking-widest rounded-full transition-all flex items-center gap-2",
                  trashType === 'PROJECT' ? "bg-white text-slate-900 shadow-sm border border-slate-100" : "text-slate-500 hover:text-slate-700"
                )}
              >
                Dự án
              </button>
              <button
                onClick={() => setTrashType('TASK')}
                className={cn(
                  "px-6 py-2 text-[10px] font-black uppercase tracking-widest rounded-full transition-all flex items-center gap-2",
                  trashType === 'TASK' ? "bg-white text-slate-900 shadow-sm border border-slate-100" : "text-slate-500 hover:text-slate-700"
                )}
              >
                Công việc
              </button>
            </div>
          )}

          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 group-focus-within:text-teal-500 transition-colors" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm nhanh..."
              className="w-full sm:w-72 pl-10 pr-5 py-2.5 text-xs bg-slate-100/60 border border-slate-200 rounded-full focus:bg-white focus:ring-4 focus:ring-teal-500/5 focus:border-teal-500/30 transition-all outline-none text-slate-900 font-bold placeholder:text-slate-500 placeholder:font-medium placeholder:uppercase placeholder:tracking-[0.1em]"
            />
          </div>
        </div>
      </div>

      {/* --- Projects Grid --- */}
      {isCurrentLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-[340px] w-full rounded-[24px]" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 text-center bg-slate-50/30 rounded-[32px] border-2 border-dashed border-slate-100 animate-in fade-in zoom-in duration-500">
          {activeTab === 'active' ? (
            <>
              <LayoutGrid className="w-16 h-16 text-slate-200 mb-6" />
              <p className="text-xl font-black text-slate-900">Chưa có dự án nào</p>
              <p className="text-slate-500 mt-2 max-w-sm">Bắt đầu quản lý công việc chuyên nghiệp bằng cách tạo dự án đầu tiên của bạn.</p>
              {isAdminOrOwner && (
                <Button
                  onClick={() => setFormOpen(true)}
                  className="mt-8 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-full px-10 shadow-lg shadow-teal-100"
                >
                  Tạo dự án ngay
                </Button>
              )}
            </>
          ) : (
            <>
              <Trash2 className="w-16 h-16 text-slate-200 mb-6" />
              <p className="text-xl font-black text-slate-900">Thùng rác trống</p>
              <p className="text-slate-500 mt-2 max-w-sm">
                Không tìm thấy {trashType === 'PROJECT' ? 'dự án' : 'công việc'} nào đã xoá. 
                Dữ liệu xoá sẽ được lưu giữ trong 30 ngày.
              </p>
              <Button
                variant="ghost"
                onClick={() => { setActiveTab('active'); setTrashType('PROJECT'); }}
                className="mt-8 text-indigo-600 font-bold hover:bg-indigo-50 rounded-full px-8"
              >
                Quay lại dự án
              </Button>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {activeTab === 'active' && isAdminOrOwner && (
            <CreateProjectPlaceholder onClick={() => { setEditingProject(null); setFormOpen(true); }} />
          )}

          {(activeTab === 'active' || trashType === 'PROJECT') ? (
            (filtered as Project[]).map((project: Project) => (
              <ProjectCard
                key={project._id}
                project={project}
                workspaceId={workspaceId}
                onEdit={handleEdit}
                onDelete={setDeletingProject}
                onRestore={(id) => restoreMutation.mutate(id)}
                onPermanentDelete={setHardDeletingProject}
                isAdminOrOwner={isAdminOrOwner}
                activeTab={activeTab}
              />
            ))
          ) : (
            (filtered as any[]).map((task: any) => (
              <Card key={task._id} className="p-8 rounded-[32px] border-none bg-white shadow-ambient-subtle hover:shadow-ambient transition-all duration-500 opacity-85 hover:opacity-100 flex flex-col h-[280px]">
                <div className="flex items-center justify-between mb-8" onClick={(e) => e.stopPropagation()}>
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-500 font-black shadow-sm">
                    T
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full bg-slate-50/50 hover:bg-slate-100 text-slate-400" />
                      }
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-2xl border-slate-100 shadow-ambient p-1.5 min-w-[180px]">
                      <DropdownMenuItem onClick={() => restoreTaskMutation.mutate(task._id)} className="rounded-xl font-bold text-teal-600 gap-3 py-2.5">
                         Khôi phục công việc
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-slate-50" />
                      <DropdownMenuItem onClick={() => setDeletingTask(task)} className="rounded-xl font-bold text-red-600 hover:bg-red-50 gap-3 py-2.5">
                        Xoá vĩnh viễn
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="flex-1 space-y-2">
                  <h4 className="text-xl font-black text-slate-900 tracking-tight line-clamp-1">{task.title}</h4>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    Dự án: <span className="text-slate-600">{task.projectId?.name || 'Không xác định'}</span>
                  </p>
                </div>
                <div className="pt-6 mt-auto border-t border-slate-50">
                  <Badge variant="outline" className="text-[9px] uppercase font-black py-1 px-3 rounded-full border-none bg-red-50 text-red-500 shadow-sm">
                    Đã xoá tạm thời
                  </Badge>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Modals */}

      <ProjectFormDialog
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingProject(null);
          refetchActive?.();
        }}
        workspaceId={workspaceId}
        project={editingProject}
      />

      {/* Move to Trash Modal */}
      <Dialog open={!!deletingProject} onOpenChange={(v) => !v && setDeletingProject(null)}>
        <DialogContent className="rounded-[32px] p-10 max-w-lg border-none shadow-2xl">
          <DialogHeader className="text-center space-y-4">
            <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto">
              <Trash2 className="w-10 h-10 text-amber-500" />
            </div>
            <DialogTitle className="text-2xl font-black text-slate-900">Đưa vào thùng rác</DialogTitle>
          </DialogHeader>
          <div className="text-center">
            <p className="text-slate-500 font-medium">
              Dự án <span className="text-slate-900 font-bold">"{deletingProject?.name}"</span> sẽ được chuyển vào thùng rác.
              Bạn có thể khôi phục lại bất cứ lúc nào.
            </p>
          </div>
          <DialogFooter className="-mx-10 -mb-10 mt-10 p-8 bg-slate-50/50 border-t border-slate-100 rounded-b-[32px] flex-row gap-4">
            <Button 
              variant="ghost" 
              className="rounded-full h-12 font-bold flex-1 text-slate-500 hover:bg-slate-100 transition-colors" 
              onClick={() => setDeletingProject(null)}
            >
              Hủy bỏ
            </Button>
            <Button
              className="bg-amber-500 hover:bg-amber-600 text-white rounded-full h-12 font-bold flex-1 shadow-lg shadow-amber-100 transition-all"
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Đang chuyển...' : 'Xác nhận chuyển'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Permanent Delete Dialog (Shared for Project & Task) */}
      <Dialog open={!!hardDeletingProject || !!deletingTask} onOpenChange={(v) => !v && (setHardDeletingProject(null), setDeletingTask(null))}>
        <DialogContent className="rounded-[32px] p-10 max-w-lg border-none shadow-2xl">
          <DialogHeader className="text-center space-y-4">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <Trash2 className="w-10 h-10 text-red-600" />
            </div>
            <DialogTitle className="text-2xl font-black text-red-600">XOÁ VĨNH VIỄN</DialogTitle>
          </DialogHeader>
          <div className="text-center">
            <p className="text-slate-500 font-medium">
              CẢNH BÁO: <span className="text-slate-900 font-bold">"{hardDeletingProject?.name || deletingTask?.title}"</span> sẽ bị xoá vĩnh viễn. 
              Hành động này <span className="underline font-bold text-red-600">KHÔNG THỂ</span> hoàn tác.
            </p>
          </div>
          <DialogFooter className="-mx-10 -mb-10 mt-10 p-8 bg-slate-50/50 border-t border-slate-100 rounded-b-[32px] flex-row gap-4">
            <Button 
              variant="ghost" 
              className="rounded-full h-12 font-bold flex-1 text-slate-500 hover:bg-slate-100" 
              onClick={() => (setHardDeletingProject(null), setDeletingTask(null))}
            >
              Quay lại
            </Button>
            <Button
              variant="destructive"
              className="bg-red-600 hover:bg-red-700 text-white rounded-full h-12 font-bold flex-1 shadow-lg shadow-red-200 transition-all"
              onClick={() => hardDeletingProject ? hardDeleteMutation.mutate() : hardDeleteTaskMutation.mutate()}
              disabled={hardDeleteMutation.isPending || hardDeleteTaskMutation.isPending}
            >
              {(hardDeleteMutation.isPending || hardDeleteTaskMutation.isPending) ? 'Đang xử lý...' : 'Xác nhận xoá bỏ'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
