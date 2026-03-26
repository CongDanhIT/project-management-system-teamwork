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
import { useParams, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

export default function WorkspaceSelector() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = params.workspaceId as string;
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

  const handleSwitchWorkspace = (id: string) => {
    router.push(`/workspace/${id}`);
  };

  if (!mounted) {
    return (
      <div className="h-10 w-full bg-slate-50 border border-slate-200/60 rounded-md animate-pulse" />
    );
  }

  return (
    <div className="relative">
      <DropdownMenu>
        <DropdownMenuTrigger
          className="w-full inline-flex items-center justify-between bg-slate-50 border border-slate-200/60 hover:bg-slate-100 h-10 px-3 py-2 rounded-md text-left font-medium outline-none focus-visible:ring-1 focus-visible:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          disabled={isLoading}
        >
          <div className="flex items-center gap-2 overflow-hidden">
            <Building2 className="w-4 h-4 text-indigo-600 shrink-0" />
            <span className="truncate text-sm text-slate-900">
              {isLoading ? 'Đang tải...' : currentWorkspace?.name || 'Chọn Workspace'}
            </span>
          </div>
          <ChevronsUpDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        </DropdownMenuTrigger>

        <DropdownMenuContent className="w-56" side="bottom" align="start">
          {/* Label phải nằm trong DropdownMenuGroup */}
          <DropdownMenuGroup>
            <DropdownMenuLabel className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
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
                  className="flex items-center justify-between cursor-pointer py-2"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-indigo-100 text-indigo-600 flex items-center justify-center text-[10px] font-bold">
                      {workspace.name?.charAt(0).toUpperCase() || 'W'}
                    </div>
                    <span className={cn(
                      "text-sm",
                      workspaceId === workspace._id
                        ? "font-semibold text-indigo-600"
                        : "text-slate-600"
                    )}>
                      {workspace.name}
                    </span>
                  </div>
                  {workspaceId === workspace._id && (
                    <Check className="w-3.5 h-3.5 text-indigo-600" />
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
              className="flex items-center gap-2 cursor-pointer text-indigo-600 focus:text-indigo-700 py-2"
              onClick={() => router.push('/onboarding')}
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm font-medium">Tạo workspace mới</span>
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
