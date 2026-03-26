'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectService, Project } from '@/services/project.service';
import {
  FolderKanban,
  Plus,
  Search,
  MoreHorizontal,
  ArrowRight,
  Pencil,
  Trash2,
  Calendar,
  Undo2,
  FileText,
  Clock,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

// ---- Emoji chọn nhanh ----
const EMOJI_LIST = ['📁', '🚀', '🎨', '💡', '🔧', '📊', '🌟', '🔥', '🎯', '🌐', '🛠️', '📱'];

import { taskService } from '@/services/task.service';
import { Task } from '@/types/task';

import { ProjectFormDialog } from '@/components/project/ProjectFormDialog';
import { useWorkspaceRole } from '@/hooks/useWorkspaceRole';

// ---- Project Card ----
function ProjectCard({
  project,
  workspaceId,
  onEdit,
  onDelete,
  isAdminOrOwner,
}: {
  project: Project;
  workspaceId: string;
  onEdit: (p: Project) => void;
  onDelete: (p: Project) => void;
  isAdminOrOwner: boolean;
}) {
  const router = useRouter();

  return (
    <Card
      className="border-slate-200/60 shadow-sm hover:shadow-md transition-all group cursor-pointer"
      onClick={() => router.push(`/workspace/${workspaceId}/project/${project._id}/board`)}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          {/* Icon + Tên */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-2xl shadow-sm group-hover:border-indigo-200 transition-all">
              {project.emoji || '📁'}
            </div>
            <div>
              <p className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors leading-tight">
                {project.name}
              </p>
              {project.description && (
                <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{project.description}</p>
              )}
            </div>
          </div>

          {/* Actions dropdown — ngăn click card */}
          {isAdminOrOwner && (
            <div onClick={(e) => e.stopPropagation()}>
              <DropdownMenu>
                <DropdownMenuTrigger
                  className="opacity-0 group-hover:opacity-100 h-7 w-7 inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 text-slate-400"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuGroup>
                    <DropdownMenuItem onClick={() => onEdit(project)}>
                      <Pencil className="w-3.5 h-3.5 mr-2" />
                      Chỉnh sửa
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem
                      onClick={() => onDelete(project)}
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

        {/* Meta */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Calendar className="w-3 h-3" />
            <span>{new Date(project.updatedAt).toLocaleDateString('vi-VN')}</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-indigo-500 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
            Mở <ArrowRight className="w-3 h-3" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ---- Deleted Project Card ----
function DeletedProjectCard({
  project,
  onRestore,
  isRestoring,
  isAdminOrOwner,
}: {
  project: Project;
  onRestore: (pId: string) => void;
  isRestoring: boolean;
  isAdminOrOwner: boolean;
}) {
  return (
    <Card className="border-slate-200/60 shadow-sm opacity-70 grayscale hover:grayscale-0 hover:opacity-100 transition-all">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-2xl shadow-sm">
              {project.emoji || '📁'}
            </div>
            <div>
              <p className="font-bold text-slate-900 leading-tight line-through">
                {project.name}
              </p>
              {project.description && (
                <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{project.description}</p>
              )}
            </div>
          </div>
          {isAdminOrOwner && (
            <Button
              variant="outline"
              size="sm"
              className="text-indigo-600 border-indigo-200 hover:bg-indigo-50"
              onClick={() => onRestore(project._id)}
              disabled={isRestoring}
            >
              <Undo2 className="w-3.5 h-3.5 mr-2" />
              Khôi phục
            </Button>
          )}
        </div>
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-red-500 font-medium">
            <Trash2 className="w-3 h-3" />
            <span>Đã xóa</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ---- Trang chính ----
export default function ProjectsPage() {
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  const queryClient = useQueryClient();
  const { isAdminOrOwner } = useWorkspaceRole();

  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'active'|'trash'>('active');
  const [trashTab, setTrashTab] = useState<'projects'|'tasks'>('projects');
  const [formOpen, setFormOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['workspace-projects', workspaceId],
    queryFn: () => projectService.getProjectsByWorkspace(workspaceId, 1, 50),
    enabled: !!workspaceId,
  });

  const { data: deletedData, isLoading: isDeletedLoading } = useQuery({
    queryKey: ['workspace-deleted-projects', workspaceId],
    queryFn: () => projectService.getDeletedProjects(workspaceId),
    enabled: !!workspaceId && activeTab === 'trash' && trashTab === 'projects',
  });

  const { data: deletedTasks, isLoading: isDeletedTasksLoading } = useQuery({
    queryKey: ['workspace-deleted-tasks', workspaceId],
    queryFn: () => taskService.getDeletedTasks(workspaceId),
    enabled: !!workspaceId && activeTab === 'trash' && trashTab === 'tasks',
  });

  const isCurrentLoading = activeTab === 'active' ? isLoading : (trashTab === 'projects' ? isDeletedLoading : isDeletedTasksLoading);
  const currentItems = activeTab === 'active' ? (data?.projects ?? []) : (trashTab === 'projects' ? (deletedData ?? []) : (deletedTasks ?? []));
  
  const filtered = currentItems.filter((item: any) => {
    const name = item.name || item.title || '';
    return name.toLowerCase().includes(search.toLowerCase());
  });

  const deleteMutation = useMutation({
    mutationFn: () => projectService.deleteProject(workspaceId, deletingProject!._id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-projects', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['workspace-deleted-projects', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['workspace-analytics', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['workspace-tasks', workspaceId] });
      toast.success('Dự án đã được đưa vào thùng rác!');
      setDeletingProject(null);
    },
    onError: () => toast.error('Xoá thất bại, thử lại nhé!'),
  });

  const restoreMutation = useMutation({
    mutationFn: (pId: string) => projectService.restoreProject(workspaceId, pId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-projects', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['workspace-deleted-projects', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['workspace-analytics', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['workspace-tasks', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['workspace-tasks-list', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['project-tasks', workspaceId] });
      toast.success('Đã khôi phục dự án thành công!');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Khôi phục thất bại, thử lại nhé!'),
  });

  const restoreTaskMutation = useMutation({
    mutationFn: (tId: string) => taskService.restoreTask(workspaceId, tId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-deleted-tasks', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['workspace-tasks', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['workspace-tasks-list', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['project-tasks', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['workspace-analytics', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['workspace-projects', workspaceId] });
      toast.success('Đã khôi phục công việc thành công!');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Khôi phục thất bại, thử lại nhé!'),
  });

  const handleEdit = (p: Project) => {
    setEditingProject(p);
    setFormOpen(true);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Dự án</h1>
          <p className="text-slate-500 font-medium mt-1">
            {isCurrentLoading ? '...' : 
              activeTab === 'active' ? `${filtered.length} dự án đang hoạt động` :
              trashTab === 'projects' ? `${filtered.length} dự án trong thùng rác` :
              `${filtered.length} công việc trong thùng rác`
            }
          </p>
        </div>
        {isAdminOrOwner && activeTab === 'active' && (
          <Button
            onClick={() => {
              setEditingProject(null);
              setFormOpen(true);
            }}
            className="gap-2 bg-indigo-600 hover:bg-indigo-700"
          >
            <Plus className="w-4 h-4" />
            Tạo dự án
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('active')}
          className={cn(
            "px-6 py-3 font-bold text-sm border-b-2 transition-colors",
            activeTab === 'active' 
              ? 'border-indigo-600 text-indigo-600' 
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
          )}
        >
          Đang hoạt động
        </button>
        <button
          onClick={() => setActiveTab('trash')}
          className={cn(
            "px-6 py-3 font-bold text-sm border-b-2 transition-colors",
            activeTab === 'trash' 
              ? 'border-red-500 text-red-500' 
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
          )}
        >
          Thùng rác
        </button>
      </div>

      {/* Trash Sub-tabs */}
      {activeTab === 'trash' && (
        <div className="flex gap-2 p-1 bg-slate-100/50 rounded-xl w-fit">
          <button
             onClick={() => setTrashTab('projects')}
             className={cn(
               "px-4 py-1.5 text-xs font-bold rounded-lg transition-all",
               trashTab === 'projects' 
                ? "bg-white text-slate-900 shadow-sm" 
                : "text-slate-500 hover:text-slate-700"
             )}
          >
            Dự án
          </button>
          <button
             onClick={() => setTrashTab('tasks')}
             className={cn(
               "px-4 py-1.5 text-xs font-bold rounded-lg transition-all",
               trashTab === 'tasks' 
                ? "bg-white text-slate-900 shadow-sm" 
                : "text-slate-500 hover:text-slate-700"
             )}
          >
            Công việc
          </button>
        </div>
      )}

      {/* Search */}
      <div className="relative w-full sm:max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm kiếm dự án..."
          className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
        />
      </div>

      {/* Grid */}
      {isCurrentLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="p-5 border border-slate-200 rounded-xl space-y-3 bg-white">
              <div className="flex items-center gap-3">
                <Skeleton className="w-12 h-12 rounded-2xl" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
              <Skeleton className="h-3 w-24" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className={cn(
            "w-16 h-16 rounded-2xl flex items-center justify-center mb-4",
            activeTab === 'trash' ? "bg-red-50" : "bg-indigo-50"
          )}>
            {activeTab === 'trash' ? (
              <Trash2 className="w-8 h-8 text-red-400" />
            ) : (
              <FolderKanban className="w-8 h-8 text-indigo-400" />
            )}
          </div>
          <p className="text-slate-900 font-bold text-lg">
            {search 
              ? 'Không tìm thấy kết quả' 
              : activeTab === 'trash' 
                ? (trashTab === 'projects' ? 'Thùng rác dự án trống' : 'Thùng rác công việc trống')
                : 'Chưa có dự án nào'}
          </p>
          <p className="text-slate-500 text-sm mt-1">
            {search 
              ? 'Thử tìm kiếm với từ khoá khác' 
              : activeTab === 'trash'
                ? 'Chưa có gì trong thùng rác của bạn.'
                : 'Tạo dự án đầu tiên để bắt đầu'}
          </p>
          {!search && isAdminOrOwner && activeTab === 'active' && (
            <Button
              className="mt-6 gap-2 bg-indigo-600 hover:bg-indigo-700"
              onClick={() => {
                setEditingProject(null);
                setFormOpen(true);
              }}
            >
              <Plus className="w-4 h-4" /> Tạo dự án đầu tiên
            </Button>
          )}
        </div>
      ) : activeTab === 'trash' && trashTab === 'tasks' ? (
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
           {(filtered as Task[]).map((task: Task) => (
             <Card key={task._id} className="border-slate-200/60 shadow-sm opacity-70 grayscale hover:grayscale-0 hover:opacity-100 transition-all">
               <CardContent className="p-5">
                 <div className="flex items-start justify-between">
                   <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 shadow-sm">
                       <FileText className="w-5 h-5" />
                     </div>
                     <div className="flex-1 min-w-0">
                       <p className="font-bold text-slate-900 leading-tight line-through truncate">
                         {task.title}
                       </p>
                       <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                          <FolderKanban className="w-2.5 h-2.5" />
                          {typeof task.projectId === 'object' ? (task.projectId as any).name : 'Dự án'}
                       </p>
                     </div>
                   </div>
                   {isAdminOrOwner && (
                     <Button
                       variant="outline"
                       size="sm"
                       className="text-indigo-600 border-indigo-200 hover:bg-indigo-50 h-8"
                       onClick={() => restoreTaskMutation.mutate(task._id)}
                       disabled={restoreTaskMutation.isPending}
                     >
                       <Undo2 className="w-3.5 h-3.5 mr-1" />
                       <span className="text-[10px]">Khôi phục</span>
                     </Button>
                   )}
                 </div>
                 <div className="mt-4 flex items-center justify-between">
                   <div className="flex items-center gap-1.5 text-[10px] text-red-500 font-medium bg-red-50 px-2 py-0.5 rounded-full">
                     <Trash2 className="w-2.5 h-2.5" />
                     <span>Đã xóa</span>
                   </div>
                   <div className="flex items-center gap-1 text-[10px] text-slate-400">
                      <Clock className="w-2.5 h-2.5" />
                      {new Date(task.updatedAt).toLocaleDateString('vi-VN')}
                   </div>
                 </div>
               </CardContent>
             </Card>
           ))}
         </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
           {(filtered as Project[]).map((project: Project) => (
            activeTab === 'active' ? (
              <ProjectCard
                key={project._id}
                project={project}
                workspaceId={workspaceId}
                onEdit={handleEdit}
                onDelete={setDeletingProject}
                isAdminOrOwner={isAdminOrOwner}
              />
            ) : (
              <DeletedProjectCard
                key={project._id}
                project={project}
                isRestoring={restoreMutation.isPending}
                onRestore={(pId) => restoreMutation.mutate(pId)}
                isAdminOrOwner={isAdminOrOwner}
              />
            )
          ))}
        </div>
      )}

      {/* Dialog tạo / sửa */}
      <ProjectFormDialog
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingProject(null);
        }}
        workspaceId={workspaceId}
        project={editingProject}
      />

      {/* Dialog xác nhận xoá */}
      <Dialog open={!!deletingProject} onOpenChange={(v) => !v && setDeletingProject(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Xác nhận xoá dự án</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600">
            Dự án <span className="font-bold text-slate-900">"{deletingProject?.name}"</span> cùng tất cả công việc bên trong sẽ được chuyển vào thùng rác. Bạn có thể khôi phục lại nội dung này sau.
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
