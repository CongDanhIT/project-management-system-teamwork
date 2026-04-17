'use client';

import React from 'react';
import {
  Search,
  Bell,
  Plus,
  HelpCircle,
  UserPlus,
  Building2,
  CheckSquare,
  Inbox
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useUiStore } from '@/stores/ui.store';
import { projectService } from '@/services/project.service';
import { taskService } from '@/services/task.service';
import { CreateTaskModal } from '@/components/task/CreateTaskModal';
import { toast } from 'sonner';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { JoinWorkspaceModal } from '@/components/workspace/JoinWorkspaceModal';
import { useRouter } from 'next/navigation';
import { useWorkspaceRole } from '@/hooks/useWorkspaceRole';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '../shared/ThemeToggle';

export default function Header() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAdminOrOwner, workspaceId } = useWorkspaceRole();
  const [isJoinModalOpen, setIsJoinModalOpen] = React.useState(false);
  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = React.useState(false);

  const { data: projectsData } = useQuery({
    queryKey: ['workspace-projects', workspaceId],
    queryFn: () => projectService.getProjectsByWorkspace(workspaceId as string),
    enabled: !!workspaceId,
  });
  const projects = projectsData?.projects || [];

  const handleCreateTask = async (pId: string, taskData: any) => {
    try {
      const newTask = await taskService.createTask(workspaceId as string, pId, taskData);
      const subtasksCount = taskData.subtasks?.length || 0;

      // 1. Cập nhật tất cả các danh sách task trong cache (Workspace-wide)
      queryClient.setQueriesData({ queryKey: ['workspace-tasks', workspaceId] }, (oldData: any) => {
        if (!oldData || !oldData.tasks) return oldData;
        return {
          ...oldData,
          tasks: [newTask, ...oldData.tasks],
          pagination: {
            ...oldData.pagination,
            totalCount: (oldData.pagination?.totalCount || 0) + 1
          }
        };
      });

      // 2. Cập nhật số lượng task của dự án tương ứng trong cache
      queryClient.setQueryData(['workspace-projects', workspaceId], (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          projects: oldData.projects.map((p: any) => 
            p._id === pId ? { ...p, totalTasks: (p.totalTasks || 0) + 1 } : p
          )
        };
      });

      // 3. Invalidate analytics
      queryClient.invalidateQueries({ queryKey: ['workspace-analytics', workspaceId] });



      toast.success(subtasksCount > 0
        ? `Đã tạo công việc và ${subtasksCount} nhiệm vụ con!`
        : "Đã tạo công việc mới"
      );
    } catch (error) {
      toast.error("Lỗi khi tạo công việc");
    }
  };

  const { isInboxSidebarOpen, toggleInboxSidebar } = useUiStore();

  return (
    <header className="h-20 bg-background/40 dark:bg-background/40 backdrop-blur-[20px] sticky top-0 z-40 flex items-center justify-between px-12 border-b border-border transition-all duration-300">
      <div className="flex-1">
        {/* Can add breadcrumbs or search here in future */}
      </div>

      <div className="flex items-center gap-5">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={toggleInboxSidebar}
          className={cn(
            "group relative text-slate-400 hover:bg-brand-primary/10 rounded-full h-11 w-11 transition-all duration-300",
            isInboxSidebarOpen && "bg-brand-primary/10 text-brand-primary"
          )}
        >
          <Inbox className="w-6 h-6 group-hover:text-brand-primary" />
          <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-brand-primary rounded-full border-2 border-white animate-pulse shadow-[0_0_10px_rgba(45,212,191,0.5)]"></span>
        </Button>

        <Button variant="ghost" size="icon" className="group relative text-slate-400 hover:bg-brand-primary/10 rounded-full h-11 w-11">
          <Bell className="w-6 h-6 group-hover:text-brand-primary" />
          <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white animate-pulse"></span>
        </Button>

        <Button variant="ghost" size="icon" className="group text-slate-400 hover:bg-brand-primary/10 rounded-full h-11 w-11">
          <HelpCircle className="w-6 h-6 group-hover:text-brand-primary" />
        </Button>

        <ThemeToggle />

        <DropdownMenu>
          <DropdownMenuTrigger 
            render={
              <Button 
                className="relative px-6 h-11 rounded-full bg-background/70 dark:bg-card/70 backdrop-blur-xl hover:bg-background/90 dark:hover:bg-card/90 text-foreground dark:text-white font-black text-[9px] tracking-[0.1em] gap-3 shadow-sm hover:shadow-[0_10px_30px_rgba(45,212,191,0.12)] flex items-center overflow-hidden active:scale-95 transition-all duration-500 border border-slate-200/60 dark:border-white/5 hover:border-teal-400/40 group/btn"
              >
                {/* Subtle Kinetic Mesh for Hover */}
                <div className="absolute inset-0 bg-gradient-to-tr from-teal-500/0 via-transparent to-brand-primary/0 group-hover/btn:from-teal-500/10 group-hover/btn:to-brand-primary/10 transition-all duration-700"></div>
                
                {/* Vibrant Icon Circle - Smaller size */}
                <div className="relative w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-brand-primary/100 flex items-center justify-center shadow-[0_2px_6px_rgba(20,184,166,0.1)] group-hover/btn:shadow-teal-500/30 group-hover/btn:rotate-180 transition-all duration-700">
                  <Plus className="w-5 h-5 text-white" strokeWidth={3} />
                </div>
                
                <span className="relative uppercase z-10 group-hover/btn:text-teal-600 dark:group-hover/btn:text-teal-400 transition-colors">KHỞI TẠO NHANH</span>
                
                {/* Neon Bottom Highlight */}
                <div className="absolute inset-x-8 group-hover/btn:inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-transparent via-teal-400 to-transparent opacity-0 group-hover/btn:opacity-100 transition-all duration-500 blur-[0.5px]"></div>
              </Button>
            }
          />
          <DropdownMenuContent align="end" className="w-72 rounded-[28px] p-4 shadow-depth-3 border-ghost glass mt-3 animate-in fade-in zoom-in-95 duration-200">
            {workspaceId && (
              <>
                <DropdownMenuGroup className="space-y-1">
                  <DropdownMenuLabel className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] px-3 py-2">Workspace Hiện Tại</DropdownMenuLabel>
                  {isAdminOrOwner && (
                    <DropdownMenuItem
                      onClick={() => router.push(`/workspace/${workspaceId}/projects`)}
                      className="group rounded-[18px] font-bold cursor-pointer py-3.5 px-4 hover:bg-teal-50 text-slate-600 hover:text-teal-700"
                    >
                      <Plus className="w-4.5 h-4.5 mr-3 text-teal-400 group-hover:text-teal-600" />
                      Khởi tạo Dự án
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    onClick={() => setIsCreateTaskModalOpen(true)}
                    className="group rounded-[18px] font-bold cursor-pointer py-3.5 px-4 hover:bg-brand-primary/5 text-slate-600 hover:text-brand-primary"
                  >
                    <CheckSquare className="w-4.5 h-4.5 mr-3 text-brand-primary/60 group-hover:text-brand-primary" />
                    Thiết lập Nhiệm vụ
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator className="bg-divider/40 my-3" />
              </>
            )}

            <DropdownMenuGroup className="space-y-1">
              <DropdownMenuLabel className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] px-3 py-2">Quản trị Hệ thống</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => setIsJoinModalOpen(true)}
                className="group rounded-[18px] font-bold cursor-pointer py-3.5 px-4 hover:bg-emerald-50 text-slate-600 hover:text-emerald-600"
              >
                <UserPlus className="w-4.5 h-4.5 mr-3 text-emerald-400 group-hover:text-emerald-600" />
                Kết nối Workspace
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.push('/onboarding')}
                className="group rounded-[18px] font-bold cursor-pointer py-3.5 px-4 hover:bg-amber-50 text-slate-600 hover:text-amber-600"
              >
                <Building2 className="w-4.5 h-4.5 mr-3 text-amber-400 group-hover:text-amber-600" />
                Kiến tạo không gian
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <JoinWorkspaceModal
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
      />

      {workspaceId && (
        <CreateTaskModal
          isOpen={isCreateTaskModalOpen}
          onClose={() => setIsCreateTaskModalOpen(false)}
          projects={projects}
          onSubmit={handleCreateTask}
          workspaceId={workspaceId}
        />
      )}
    </header>
  );
}
