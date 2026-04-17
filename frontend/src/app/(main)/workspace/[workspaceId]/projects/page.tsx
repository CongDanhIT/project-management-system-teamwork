'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectService, Project } from '@/services/project.service';
import { taskService } from '@/services/task.service';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { 
  FolderKanban, 
  Plus, 
  Trash2, 
  Search, 
  Filter, 
  MoreVertical, 
  Clock, 
  Users, 
  Layout, 
  Heart,
  HeartOff,
  Pencil,
  MoreHorizontal,
  Loader2,
  ArrowLeft,
  LayoutGrid
} from 'lucide-react';
import { SearchInput } from '@/components/shared/SearchInput';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import Loader from "@/components/ui/Loader";
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth.store';
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
import { UserAvatar } from '@/components/shared/UserAvatar';

/**
 * Project Status Mapping
 */
const STATUS_CONFIG: Record<string, { label: string; color: string; progress: number }> = {
  PLANNING: { label: 'LẬP KẾ HOẠCH', color: 'bg-slate-100/80 text-slate-600 dark:bg-slate-800/50 dark:text-slate-400', progress: 0 },
  ACTIVE: { label: 'ĐANG HOẠT ĐỘNG', color: 'bg-brand-primary/10 text-brand-primary dark:bg-brand-primary/20 dark:text-brand-primary', progress: 45 },
  ON_HOLD: { label: 'TẠM DỪNG', color: 'bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400', progress: 15 },
  COMPLETED: { label: 'HOÀN THÀNH', color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400', progress: 100 },
  FROZEN: { label: 'ĐÓNG BĂNG', color: 'bg-slate-100/50 text-slate-500 dark:bg-slate-800/20 dark:text-slate-500', progress: 0 },
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

  const totalTasks = project.totalTasks || 0;
  const completedTasks = project.completedTasks || 0;
  const actualProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Stable theme index based on project ID
  const themeIndex = (project._id || project.name).split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % 4;

  const themes = [
    { label: "Chiến lược hàng đầu", text: "text-brand-primary bg-brand-primary/10", hover: "group-hover:text-brand-primary", accent: "bg-brand-primary" },
    { label: "Kiến tạo mục tiêu", text: "text-brand-secondary bg-brand-secondary/10", hover: "group-hover:text-brand-secondary", accent: "bg-brand-secondary" },
    { label: "Giải pháp sáng tạo", text: "text-brand-primary bg-brand-primary/15", hover: "group-hover:text-brand-primary", accent: "bg-brand-primary" },
    { label: "Đổi mới không ngừng", text: "text-brand-primary bg-brand-primary/20", hover: "group-hover:text-brand-primary", accent: "bg-brand-primary" }
  ];
  const currentTheme = themes[themeIndex];

  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const favoriteMutation = useMutation({
    mutationFn: (pId: string) => projectService.toggleFavorite(workspaceId, pId),
    onMutate: async (pId) => {
      // Optimistic Update
      await queryClient.cancelQueries({ queryKey: ['workspace-projects', workspaceId] });
      const previousProjects = queryClient.getQueryData(['workspace-projects', workspaceId]);

      if (previousProjects) {
        queryClient.setQueryData(['workspace-projects', workspaceId], (old: any) => {
          if (!old || !old.projects) return old;
          return {
            ...old,
            projects: old.projects.map((p: any) => {
              if (p._id === pId) {
                const uId = user?.id;
                const isFav = p.favoritedBy?.some((id: any) => (id._id || id) === uId);
                const newFavs = isFav 
                  ? p.favoritedBy.filter((id: any) => (id._id || id) !== uId)
                  : [...(p.favoritedBy || []), uId];
                return { ...p, favoritedBy: newFavs };
              }
              return p;
            })
          };
        });
      }
      return { previousProjects };
    },
    onSuccess: (responseData) => {
      // 1. Cập nhật cache chính bằng dữ liệu thực tế mới nhất từ API trả về
      queryClient.setQueryData(['workspace-projects', workspaceId], (oldData: any) => {
        if (!oldData || !oldData.projects) return oldData;
        return {
          ...oldData,
          projects: oldData.projects.map((p: any) => 
            p._id === project._id ? responseData.project : p
          )
        };
      });

      // 2. Cập nhật cache của project đơn lẻ nếu cần
      queryClient.setQueryData(['project', workspaceId, project._id], responseData.project);

      // 3. Invalidate danh sách yêu thích phụ và thông báo
      queryClient.invalidateQueries({ queryKey: ['favorite-projects', workspaceId] });
      toast.success(responseData.message || "Đã cập nhật yêu thích");
    },

    onError: (err, pId, context: any) => {
      if (context?.previousProjects) {
        queryClient.setQueryData(['workspace-projects', workspaceId], context.previousProjects);
      }
      toast.error("Không thể thực hiện thao tác");
    }
  });

  const isFavorited = project.favoritedBy?.some((id: any) => (id._id || id) === user?.id);

  return (
    <Card
      onClick={() => {
        if (isTrash) return;
        router.push(`/workspace/${workspaceId}/projects/${project._id}/board`);
      }}
      className={cn(
        "group relative p-0 rounded-[32px] bg-white dark:bg-slate-900/40 backdrop-blur-md shadow-glow-combined hover:z-30 overflow-hidden flex flex-col h-[360px] border border-slate-200 dark:border-white/5 cursor-pointer",
        isTrash ? "opacity-60 cursor-default" : "cursor-pointer"
      )}
    >
      {/* Editorial Accent Line (Unlocking Animation) */}
      <div className="absolute top-0 left-0 w-full h-[4px] overflow-hidden pointer-events-none z-30 transform-gpu">
        <div className={cn(
          "absolute inset-x-0 top-0 h-full transition-all duration-700 cubic-bezier(0.23,1,0.32,1) origin-left transform-gpu opacity-80 group-hover:opacity-100 scale-x-[0.15] group-hover:scale-x-100",
          currentTheme.accent
        )} />
        <div className="absolute inset-x-0 top-0 h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer-slide_2.5s_infinite] opacity-0 group-hover:opacity-100 transition-opacity duration-700" style={{ transform: 'translateZ(0)' }} />
      </div>

      {/* Top Visual Section */}
      <div className="relative h-[212px] w-full overflow-hidden bg-slate-50 dark:bg-slate-900/50 transform-gpu z-[5]" style={{ backfaceVisibility: 'hidden', isolation: 'isolate' }}>
        {project.coverUrl ? (
          <div
            className="w-full h-full bg-cover bg-no-repeat transition-transform duration-1000 group-hover:scale-110 transform-gpu will-change-transform scale-[1.01]"
            style={{ 
              backgroundImage: `url(${project.coverUrl})`,
              backgroundPosition: `${project.coverPositionX ?? 50}% ${project.coverPositionY ?? 50}%`,
              backfaceVisibility: 'hidden',
              transform: 'translateZ(0)'
            }}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 opacity-50 transform-gpu" />
        )}

        {/* Cinematic Overlay - Subtly darkening the bottom to prevent gaps */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/10 dark:to-black/30 z-10 pointer-events-none" />
        
        {/* Anti-pixel-gap line: A 1px solid color matching the card background */}
        <div className="absolute left-0 right-0 -bottom-[0.5px] h-[1.5px] bg-card dark:bg-[#072221] z-20 pointer-events-none" />

        {/* Floating Controls Overlay */}
        <div className="absolute inset-0 z-20 p-6 flex items-start justify-end">
          <div className="flex items-center gap-2">
            {!isTrash && (
              <div className="px-2.5 py-1 rounded-full glass text-[9px] font-black tracking-widest text-slate-900 dark:text-white uppercase flex items-center gap-2 border border-white/20">
                <div className={cn("w-1.5 h-1.5 rounded-full", config.label === 'ĐANG HOẠT ĐỘNG' ? "bg-brand-secondary" : "bg-brand-primary")} />
                {config.label}
              </div>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-full glass border border-white/20 text-slate-800 hover:bg-white/20 transition-all border-none outline-none"
                    onClick={(e) => e.stopPropagation()}
                  />
                }
              >
                <MoreHorizontal className="w-5 h-5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-2xl border-none shadow-depth-3 p-1.5 min-w-[200px] bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl">
                {activeTab === 'active' ? (
                  <>
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(project); }} className="rounded-xl font-bold text-slate-800 dark:text-slate-200 gap-3 py-3 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                      <Pencil className="w-4 h-4 text-brand-primary" /> Sửa thông tin
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-slate-100/50 dark:bg-slate-800/50 h-[1px] my-1" />
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDelete(project); }} className="rounded-xl font-bold text-red-600 hover:text-white hover:bg-red-500 transition-colors gap-3 py-3">
                      <Trash2 className="w-4 h-4" /> Đưa vào thùng rác
                    </DropdownMenuItem>
                  </>
                ) : (
                  <>
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onRestore?.(project._id); }} className="rounded-xl font-bold text-brand-primary gap-3 py-3 hover:bg-brand-primary/10 transition-colors">
                      Khôi phục dự án
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-slate-100/50 dark:bg-slate-800/50 h-[1px] my-1" />
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onPermanentDelete?.(project); }} className="rounded-xl font-bold text-red-600 gap-3 py-3 hover:bg-red-500 hover:text-white transition-colors">
                      Xoá vĩnh viễn
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Editorial Content Section */}
      <div className="relative z-20 px-6 pt-2 pb-5 flex-1 flex flex-col">
        <div className="space-y-3">
          <div className="flex justify-between items-start mb-2">
            <span className={cn(
              "text-[9px] font-black uppercase tracking-[0.15em] px-3 py-1.5 rounded-full transition-colors duration-500",
              currentTheme.text
            )}>
              {currentTheme.label}
            </span>
          </div>
          <h3 className={cn(
            "text-xl font-black text-slate-900 dark:text-white tracking-tighter leading-tight line-clamp-2 uppercase transition-all duration-500",
            currentTheme.hover
          )} style={{ WebkitTextStroke: '0.4px rgba(0,0,0,0.05)' }}>
            {project.name}
          </h3>
          <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed tracking-tight">
            {project.description || 'Chưa có mô tả cho dự án này'}
          </p>
        </div>

        {/* Technical Footer Section */}
        <div className="mt-auto pt-3 space-y-3">
          {/* Progress Precision */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
              <span>Độ phủ nhiệm vụ</span>
              <span className="text-slate-900 dark:text-white text-xs">{actualProgress}%</span>
            </div>
            <div className="h-[3px] w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-primary transition-all duration-1000 ease-out"
                style={{ width: `${actualProgress}%` }}
              />
            </div>
          </div>

          {/* Members & Meta (Redesigned) */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost" 
                size="icon"
                title={isFavorited ? "Bỏ yêu thích" : "Thêm vào yêu thích"}
                className={cn(
                  "h-9 w-9 rounded-full transition-all duration-300 transform-gpu z-30 border border-slate-100 dark:border-white/5 shadow-sm group/fav",
                  isFavorited 
                    ? "text-rose-500 border-rose-200 bg-rose-50 dark:bg-rose-500/10 scale-105" 
                    : "text-slate-300 hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/5 hover:border-rose-200"
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  favoriteMutation.mutate(project._id);
                }}
              >
                {isFavorited ? (
                  <div className="relative">
                    <Heart className="w-4.5 h-4.5 fill-current transition-opacity duration-300 group-hover/fav:opacity-0" />
                    <HeartOff className="w-4.5 h-4.5 absolute inset-0 opacity-0 group-hover/fav:opacity-100 transition-opacity duration-300 text-rose-600" />
                  </div>
                ) : (
                  <Heart className="w-4.5 h-4.5" />
                )}
              </Button>

              {project.members && project.members.length > 0 && (
                <div className="flex -space-x-2 pl-1 border-l border-slate-100 dark:border-white/10 ml-1">
                  {project.members.slice(0, 3).map((member: any, i: number) => (
                    <UserAvatar
                      key={member.userId?._id || i}
                      user={member.userId}
                      className="h-8 w-8 border-2 border-card ring-0 shadow-sm"
                      showShadow={false}
                    />
                  ))}
                </div>
              )}
            </div>

            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 dark:bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-100 dark:border-white/5">
              {formatDistanceToNow(new Date(project.updatedAt || Date.now()), { addSuffix: true, locale: vi })}
            </span>
          </div>
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
      className="group relative h-[360px] w-full rounded-[32px] border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-brand-secondary/40 hover:bg-brand-secondary/[0.02] transition-all duration-400 transform hover:!-translate-y-2 hover:z-30 hover:shadow-[0_30px_60px_-15px_rgba(199,249,100,0.2)] flex flex-col items-center justify-center gap-5 cursor-pointer overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-brand-secondary/[0.03] opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="relative w-16 h-16 rounded-3xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center border border-slate-100 dark:border-slate-800 group-hover:scale-110 group-hover:bg-brand-secondary group-hover:border-brand-secondary shadow-sm transition-all duration-500">
        <Plus className="w-8 h-8 text-slate-400 dark:text-slate-600 group-hover:text-brand-primary transition-colors" />
      </div>

      <div className="relative text-center space-y-2">
        <span className="block text-sm font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider group-hover:text-brand-secondary transition-colors">Tạo dự án mới</span>
        <span className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 tracking-wide uppercase">Thiết lập mục tiêu & nhiệm vụ</span>
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
  const { user } = useAuthStore();


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
    onSuccess: (deletedProject) => {
      // 1. Xoá khỏi danh sách projects đang hoạt động
      queryClient.setQueryData(['workspace-projects', workspaceId], (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          projects: oldData.projects.filter((p: Project) => p._id !== deletingProject!._id),
          totalCount: Math.max(0, (oldData.totalCount || 1) - 1)
        };
      });

      // 2. Thêm vào danh sách projects trong thùng rác
      queryClient.setQueryData(['workspace-deleted-projects', workspaceId], (oldData: any) => {
        if (!oldData) return [deletedProject];
        return [deletedProject, ...oldData];
      });

      // 3. Cập nhật analytics
      queryClient.invalidateQueries({ queryKey: ['workspace-analytics', workspaceId] });

      // 4. [AI-ADDED] Đồng bộ với danh sách yêu thích (Sidebar)
      queryClient.setQueryData(['favorite-projects', workspaceId], (oldData: any) => {
        if (!oldData) return [];
        return oldData.filter((p: any) => p._id !== deletingProject!._id);
      });

      toast.success('Dự án đã được đưa vào thùng rác!');
      setDeletingProject(null);
    },
  });


  const restoreMutation = useMutation({
    mutationFn: (pId: string) => projectService.restoreProject(workspaceId, pId),
    onSuccess: (restoredProject) => {
      // 1. Xoá khỏi danh sách thùng rác
      queryClient.setQueryData(['workspace-deleted-projects', workspaceId], (oldData: any) => {
        if (!oldData) return [];
        return oldData.filter((p: Project) => p._id !== restoredProject._id);
      });

      // 2. Thêm vào danh sách projects đang hoạt động
      queryClient.setQueryData(['workspace-projects', workspaceId], (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          projects: [restoredProject, ...oldData.projects],
          totalCount: (oldData.totalCount || 0) + 1
        };
      });

      // 3. Cập nhật analytics
      queryClient.invalidateQueries({ queryKey: ['workspace-analytics', workspaceId] });

      // 4. [AI-ADDED] Đồng bộ với danh sách yêu thích nếu dự án này từng được users thả tim
      const isFavorited = restoredProject.favoritedBy?.some((id: any) => (id._id || id) === user?.id);
      if (isFavorited) {
        queryClient.setQueryData(['favorite-projects', workspaceId], (oldData: any) => {
          if (!oldData) return [restoredProject];
          // Tránh trùng lặp và thêm vào danh sách
          const exists = oldData.some((p: any) => p._id === restoredProject._id);
          if (exists) return oldData;
          return [...oldData, restoredProject].sort((a, b) => (a.name || "").localeCompare(b.name || ""));
        });
      }

      toast.success('Đã khôi phục dự án và toàn bộ công việc liên quan thành công!');
    },
  });


  const hardDeleteMutation = useMutation({
    mutationFn: () => projectService.permanentDeleteProject(workspaceId, hardDeletingProject!._id),
    onSuccess: () => {
      // Xoá vĩnh viễn khỏi danh sách thùng rác trong cache
      queryClient.setQueryData(['workspace-deleted-projects', workspaceId], (oldData: any) => {
        if (!oldData) return [];
        return oldData.filter((p: Project) => p._id !== hardDeletingProject!._id);
      });

      // 2. [AI-ADDED] Gỡ khỏi danh sách yêu thích
      queryClient.setQueryData(['favorite-projects', workspaceId], (oldData: any) => {
        if (!oldData) return [];
        return oldData.filter((p: any) => p._id !== hardDeletingProject!._id);
      });

      toast.success('Dự án đã bị xoá vĩnh viễn!');
      setHardDeletingProject(null);
    },
  });


  const restoreTaskMutation = useMutation({
    mutationFn: async (task: any) => {
      // Kiểm tra nếu dự án cha đang bị xoá
      const isProjectDeleted = task.projectId?.isDeleted || 
                               deletedData?.some((p: any) => p._id === task.projectId?._id);
      
      if (isProjectDeleted) {
        throw new Error(`Dự án "${task.projectId?.name || 'liên quan'}" đang nằm trong thùng rác. Vui lòng khôi phục dự án trước.`);
      }
      
      return taskService.restoreTask(workspaceId, task._id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-deleted-tasks', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['workspace-tasks', workspaceId] });
      toast.success('Đã khôi phục công việc thành công!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Không thể khôi phục công việc');
    }
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
          <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-none">
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
      <div className="flex flex-wrap items-center justify-between gap-6 py-2">
        <div className="flex items-center bg-slate-100/50 dark:bg-slate-900/50 p-1 rounded-full">
          <button
            onClick={() => { setActiveTab('active'); setTrashType('PROJECT'); }}
            className={cn(
              "px-8 py-2.5 text-[11px] font-black uppercase tracking-[0.15em] transition-all rounded-full relative",
              activeTab === 'active'
                ? "text-white bg-brand-primary shadow-elevated-active"
                : "text-slate-500 hover:text-slate-700"
            )}
          >
            Đang hoạt động
            {data?.projects?.length > 0 && activeTab === 'active' && (
              <span className="ml-3 px-2 py-0.5 bg-white/20 text-[9px] text-white rounded-full font-black tracking-normal">{data.projects.length}</span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('trash')}
            className={cn(
              "px-8 py-2.5 text-[11px] font-black uppercase tracking-[0.15em] transition-all rounded-full relative",
              activeTab === 'trash'
                ? "text-white bg-red-500 shadow-elevated-active"
                : "text-slate-500 hover:text-slate-700"
            )}
          >
            Thùng rác
            {((deletedData?.length || 0) + (deletedTasksData?.length || 0)) > 0 && (
              <span className="ml-3 px-2 py-0.5 bg-white/20 text-[9px] text-white rounded-full font-black tracking-normal">
                {(deletedData?.length || 0) + (deletedTasksData?.length || 0)}
              </span>
            )}
          </button>
        </div>

        <div className="flex items-center gap-4 pb-3">
          {activeTab === 'trash' && (
            <div className="flex bg-slate-100/60 dark:bg-slate-900/40 p-1.5 rounded-full mr-4 shadow-sm transition-all">
              <button
                onClick={() => setTrashType('PROJECT')}
                className={cn(
                  "px-6 py-2 text-[10px] font-black uppercase tracking-widest rounded-full transition-all flex items-center gap-2",
                  trashType === 'PROJECT' ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm" : "text-slate-500 hover:text-slate-700"
                )}
              >
                Dự án
              </button>
              <button
                onClick={() => setTrashType('TASK')}
                className={cn(
                  "px-6 py-2 text-[10px] font-black uppercase tracking-widest rounded-full transition-all flex items-center gap-2",
                  trashType === 'TASK' ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm" : "text-slate-500 hover:text-slate-700"
                )}
              >
                Công việc
              </button>
            </div>
          )}

          <SearchInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm nhanh..."
            className="w-full sm:w-72"
          />
        </div>
      </div>

      {/* --- Projects Grid --- */}
      {isCurrentLoading ? (
        <div className="flex flex-col items-center justify-center py-40 animate-in fade-in duration-700">
          <Loader size="lg" />
          <p className="mt-8 text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] animate-pulse">
            Đang cấu trúc lại dữ liệu dự án...
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 text-center bg-slate-50/50 dark:bg-slate-900/20 rounded-[40px] border-2 border-dashed border-slate-200 dark:border-white/5 animate-in fade-in zoom-in duration-700">
          {activeTab === 'active' ? (
            <>
              <LayoutGrid className="w-16 h-16 text-slate-200 dark:text-slate-800 mb-6" />
              <p className="text-xl font-black text-slate-900 dark:text-white">Chưa có dự án nào</p>
              <p className="text-slate-500 mt-2 max-w-sm">Bắt đầu quản lý công việc chuyên nghiệp bằng cách tạo dự án đầu tiên của bạn.</p>
              {isAdminOrOwner && (
                <Button
                  onClick={() => setFormOpen(true)}
                  className="mt-8 bg-brand-primary hover:bg-brand-primary/90 text-white font-bold rounded-full px-10 shadow-lg shadow-brand-primary/20 dark:shadow-none"
                >
                  Tạo dự án ngay
                </Button>
              )}
            </>
          ) : (
            <>
              <Trash2 className="w-16 h-16 text-slate-200 dark:text-slate-800 mb-6" />
              <p className="text-xl font-black text-slate-900 dark:text-white">Thùng rác trống</p>
              <p className="text-slate-500 mt-2 max-w-sm">
                Không tìm thấy {trashType === 'PROJECT' ? 'dự án' : 'công việc'} nào đã xoá.
                Dữ liệu xoá sẽ được lưu giữ trong 30 ngày.
              </p>
              <Button
                variant="ghost"
                onClick={() => { setActiveTab('active'); setTrashType('PROJECT'); }}
                className="mt-8 text-brand-primary dark:text-brand-secondary font-bold hover:bg-brand-primary/10 dark:hover:bg-brand-secondary/10 rounded-full px-8"
              >
                Quay lại dự án
              </Button>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 pt-10 pb-16">
          {activeTab === 'active' && isAdminOrOwner && (
            <CreateProjectPlaceholder 
              key="create-project-placeholder"
              onClick={() => { setEditingProject(null); setFormOpen(true); }} 
            />
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
              <Card key={task._id} className="p-8 rounded-[32px] border border-slate-100 dark:border-white/5 bg-white dark:bg-slate-900/40 backdrop-blur-sm shadow-depth-1 hover:shadow-depth-2 transition-all duration-500 opacity-85 hover:opacity-100 flex flex-col h-[280px]">
                <div className="flex items-center justify-between mb-8" onClick={(e) => e.stopPropagation()}>
                  <div className="w-12 h-12 rounded-2xl bg-brand-primary/10 dark:bg-brand-primary/20 flex items-center justify-center text-brand-primary dark:text-brand-secondary font-black shadow-sm">
                    T
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full bg-slate-50/50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400" />
                      }
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-2xl border-slate-200 dark:border-white/10 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-depth-3 p-1.5 min-w-[200px]">
                      <DropdownMenuItem onClick={() => restoreTaskMutation.mutate(task)} className="rounded-xl font-bold text-brand-primary gap-3 py-3 hover:bg-brand-primary/10 transition-colors">
                        Khôi phục công việc
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-slate-100/50 dark:bg-slate-800/50 h-[1px] my-1" />
                      <DropdownMenuItem onClick={() => setDeletingTask(task)} className="rounded-xl font-bold text-red-600 hover:text-white hover:bg-red-500 transition-colors gap-3 py-3">
                        Xoá vĩnh viễn
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="flex-1 space-y-2">
                  <h4 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight line-clamp-2">{task.title}</h4>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                    Dự án: <span className="text-brand-primary">{task.projectId?.name || 'Không xác định'}</span>
                  </p>
                </div>
                <div className="pt-6 mt-auto">
                  <Badge variant="outline" className="text-[10px] uppercase font-bold py-1.5 px-3.5 rounded-full border-none bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400 shadow-sm">
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
        <DialogContent className="rounded-[32px] p-10 max-w-lg border-none shadow-depth-3 bg-white dark:bg-slate-900">
          <DialogHeader className="text-center space-y-4">
            <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto">
              <Trash2 className="w-10 h-10 text-amber-500" />
            </div>
            <DialogTitle className="text-2xl font-black text-slate-900 dark:text-white">Đưa vào thùng rác</DialogTitle>
          </DialogHeader>
          <div className="text-center">
            <p className="text-slate-500 dark:text-slate-400 font-medium">
              Dự án <span className="text-slate-900 dark:text-white font-bold">"{deletingProject?.name}"</span> sẽ được chuyển vào thùng rác.
              Bạn có thể khôi phục lại bất cứ lúc nào.
            </p>
          </div>
          <DialogFooter className="-mx-10 -mb-10 mt-10 p-8 bg-slate-50/50 dark:bg-slate-800/20 border-t border-slate-100 dark:border-white/5 rounded-b-[32px] flex-row gap-4">
            <Button
              variant="ghost"
              className="rounded-full h-12 font-bold flex-1 text-slate-500 hover:bg-slate-100 transition-colors"
              onClick={() => setDeletingProject(null)}
            >
              Hủy bỏ
            </Button>
            <Button
              className="bg-amber-500 hover:bg-amber-600 text-white rounded-full h-12 font-bold flex-1 shadow-lg shadow-amber-100/20 dark:shadow-none transition-all"
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
        <DialogContent className="rounded-[32px] p-10 max-w-lg border-none shadow-depth-3 bg-white dark:bg-slate-900">
          <DialogHeader className="text-center space-y-4">
            <div className="w-20 h-20 bg-red-100 dark:bg-red-500/10 rounded-full flex items-center justify-center mx-auto">
              <Trash2 className="w-10 h-10 text-red-600 dark:text-red-500" />
            </div>
            <DialogTitle className="text-2xl font-black text-red-600 dark:text-red-500 uppercase tracking-tighter">XOÁ VĨNH VIỄN</DialogTitle>
          </DialogHeader>
          <div className="text-center">
            <p className="text-slate-500 dark:text-slate-400 font-medium">
              CẢNH BÁO: <span className="text-slate-900 dark:text-white font-bold">"{hardDeletingProject?.name || deletingTask?.title}"</span> sẽ bị xoá vĩnh viễn.
              Hành động này <span className="underline font-bold text-red-600 dark:text-red-500">KHÔNG THỂ</span> hoàn tác.
            </p>
          </div>
          <DialogFooter className="-mx-10 -mb-10 mt-10 p-8 bg-slate-50/50 dark:bg-slate-900/50 border-none rounded-b-[32px] flex-row gap-4">
            <Button
              variant="ghost"
              className="rounded-full h-12 font-bold flex-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border-none"
              onClick={() => (setHardDeletingProject(null), setDeletingTask(null))}
            >
              Quay lại
            </Button>
            <Button
              variant="destructive"
              className="bg-red-600 hover:bg-red-700 text-white rounded-full h-12 font-bold flex-1 shadow-lg shadow-red-200/10 dark:shadow-none transition-all border-none"
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
