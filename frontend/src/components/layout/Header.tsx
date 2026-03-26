'use client';

import React from 'react';
import { 
  Search, 
  Bell, 
  Plus,
  HelpCircle,
  UserPlus,
  Building2,
  CheckSquare
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
      await taskService.createTask(workspaceId as string, pId, taskData);
      const subtasksCount = taskData.subtasks?.length || 0;

      queryClient.invalidateQueries({ queryKey: ['workspace-tasks-list'] });
      queryClient.invalidateQueries({ queryKey: ['project-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['workspace-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['workspace-analytics'] });
      queryClient.invalidateQueries({ queryKey: ['workspace-projects'] });
      
      toast.success(subtasksCount > 0 
        ? `Đã tạo công việc và ${subtasksCount} nhiệm vụ con!` 
        : "Đã tạo công việc mới"
      );
    } catch (error) {
      toast.error("Lỗi khi tạo công việc");
    }
  };

  return (
    <header className="h-16 border-b border-slate-200/60 bg-white/70 backdrop-blur-md sticky top-0 z-40 flex items-center justify-between px-6">
      <div className="flex-1"></div>

      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="relative text-slate-500">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </Button>
        
        <Button variant="ghost" size="icon" className="text-slate-500">
          <HelpCircle className="w-5 h-5" />
        </Button>

        <div className="w-px h-6 bg-slate-200 mx-1"></div>

        <DropdownMenu>
          <DropdownMenuTrigger 
            className={cn(
                buttonVariants({ variant: "default", size: "default" }),
                "bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100 rounded-xl px-4 font-bold gap-2"
            )}
          >
            <Plus className="w-4 h-4" />
            Tạo mới
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 shadow-2xl border-slate-200/60 bg-white/95 backdrop-blur-xl">
            {workspaceId && (
              <>
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 py-1.5">Workspace Hiện Tại</DropdownMenuLabel>
                  {isAdminOrOwner && (
                    <DropdownMenuItem 
                      onClick={() => router.push(`/workspace/${workspaceId}/projects`)}
                      className="rounded-xl font-bold cursor-pointer py-2"
                    >
                      <Plus className="w-4 h-4 mr-2 text-indigo-500" />
                      Tạo dự án mới
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem 
                    onClick={() => setIsCreateTaskModalOpen(true)}
                    className="rounded-xl font-bold cursor-pointer py-2"
                  >
                    <CheckSquare className="w-4 h-4 mr-2 text-sky-500" />
                    Tạo công việc mới
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator className="bg-slate-100 my-2" />
              </>
            )}

            
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 py-1.5">Hệ Thống</DropdownMenuLabel>
              <DropdownMenuItem 
                onClick={() => setIsJoinModalOpen(true)}
                className="rounded-xl font-bold cursor-pointer py-2"
              >
                <UserPlus className="w-4 h-4 mr-2 text-emerald-500" />
                Tham gia Workspace
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => router.push('/onboarding')}
                className="rounded-xl font-bold cursor-pointer py-2"
              >
                <Building2 className="w-4 h-4 mr-2 text-amber-500" />
                Tạo Workspace mới
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
