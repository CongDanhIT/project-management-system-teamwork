'use client';

import React, { useEffect } from 'react';
import {
  Building2,
  ChevronsUpDown,
  Plus,
  Check
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQuery } from '@tanstack/react-query';
import { workspaceService } from '@/services/workspace.service';
import { useWorkspaceStore } from '@/stores/workspace.store';
import { userService } from '@/services/user.service';
import { useParams, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

export default function WorkspaceSelector() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = params?.workspaceId as string;
  const { setCurrentWorkspaceId } = useWorkspaceStore();
  const [mounted, setMounted] = React.useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data: workspaces, isLoading } = useQuery({
    queryKey: ['workspaces'],
    queryFn: workspaceService.getWorkspaces,
  });

  const currentWorkspace = workspaces?.find(w => w._id === workspaceId);

  useEffect(() => {
    if (workspaceId) {
      setCurrentWorkspaceId(workspaceId);
    }
  }, [workspaceId, setCurrentWorkspaceId]);

  const handleSwitchWorkspace = async (id: string) => {
    try {
      // Cập nhật lên backend để lưu trạng thái workspace cuối cùng
      await userService.switchWorkspace(id);
      router.push(`/workspace/${id}`);
    } catch (error) {
      console.error('Failed to switch workspace:', error);
      // Vẫn cho phép chuyển URL dù fail cập nhật backend để không chặn người dùng
      router.push(`/workspace/${id}`);
    }
  };

  if (!mounted) {
    return (
      <div className="h-10 w-full bg-slate-100/50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-white/5 rounded-2xl animate-pulse" />
    );
  }

  return (
    <div className="relative">
      <DropdownMenu>
        <DropdownMenuTrigger
          className="w-full inline-flex items-center justify-between bg-white dark:bg-slate-900/40 hover:bg-slate-50 dark:hover:bg-slate-800/60 h-11 px-4 py-2 rounded-2xl text-left font-bold border-none outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
          disabled={isLoading}
        >
          <div className="flex items-center gap-2.5 overflow-hidden">
            <Building2 className="w-4 h-4 text-brand-primary dark:text-brand-secondary shrink-0" />
            <span className="truncate text-[13px] text-slate-800 dark:text-slate-100 tracking-tight">
              {isLoading ? 'Đang tải...' : currentWorkspace?.name || 'Chọn Workspace'}
            </span>
          </div>
          <ChevronsUpDown className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600 shrink-0" />
        </DropdownMenuTrigger>

        <DropdownMenuContent className="w-64 rounded-[24px] p-2 border-none bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-depth-3" side="bottom" align="start" sideOffset={8}>
          {/* Label phải nằm trong DropdownMenuGroup */}
          <DropdownMenuGroup>
            <DropdownMenuLabel className="px-3 py-2 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              Không gian làm việc
            </DropdownMenuLabel>
          </DropdownMenuGroup>

          <DropdownMenuSeparator />

          {/* Danh sách workspace */}
          <div className="max-h-[200px] overflow-y-auto">
            {workspaces && workspaces.length > 0 ? (
              workspaces.map((workspace) => (
                <DropdownMenuItem
                  key={workspace._id}
                  onClick={() => handleSwitchWorkspace(workspace._id)}
                  className="flex items-center justify-between cursor-pointer py-3 px-3 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 transition-colors group"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-brand-primary/20 text-brand-primary flex items-center justify-center text-[10px] font-bold">
                      {workspace.name?.charAt(0).toUpperCase() || 'W'}
                    </div>
                    <span className={cn(
                      "text-sm tracking-tight transition-colors",
                      workspaceId === workspace._id
                        ? "font-bold text-brand-primary dark:text-brand-secondary"
                        : "text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-100"
                    )}>
                      {workspace.name}
                    </span>
                  </div>
                  {workspaceId === workspace._id && (
                    <Check className="w-3.5 h-3.5 text-brand-primary" />
                  )}
                </DropdownMenuItem>
              ))
            ) : (
              <div className="py-4 px-2 text-center text-xs text-slate-400 italic">
                {isLoading ? 'Đang tải...' : 'Chưa tham gia workspace nào'}
              </div>
            )}
          </div>

          <DropdownMenuSeparator />

          {/* Tạo workspace mới - cũng phải trong Group */}
          <DropdownMenuGroup>
            <DropdownMenuItem
              className="flex items-center gap-2 cursor-pointer text-brand-primary dark:text-brand-secondary hover:bg-brand-primary/5 dark:hover:bg-brand-secondary/10 py-3 px-3 rounded-xl font-bold transition-all"
              onClick={() => router.push('/onboarding')}
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm">Tạo workspace mới</span>
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
