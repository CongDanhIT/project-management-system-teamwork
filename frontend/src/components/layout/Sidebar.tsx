'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { 
  LayoutDashboard, 
  FolderKanban, 
  CheckSquare, 
  Users, 
  Settings, 
  LogOut,
  ChevronRight,
  Layout,
  Moon,
  Sun
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth.store';
import { useWorkspaceStore } from '@/stores/workspace.store';
import { authService } from '@/services/auth.service';
import WorkspaceSelector from './WorkspaceSelector';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '../shared/ThemeToggle';
import { useWorkspaceRole } from '@/hooks/useWorkspaceRole';
import { toast } from 'sonner';

// navItems removed from static list to be dynamic in component

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { currentWorkspaceId, setCurrentWorkspaceId } = useWorkspaceStore();
  const { isAdminOrOwner } = useWorkspaceRole();
  const queryClient = useQueryClient();

  const handleLogout = async () => {
    try {
      await authService.logout();
      logout();
      setCurrentWorkspaceId(null);
      queryClient.clear(); // Xoá sạch bộ nhớ đệm (React Query cache)
      router.push('/login');
      toast.success("Đã đăng xuất thành công");
    } catch (error) {
      console.error("Logout failed", error);
      // Vẫn logout ở frontend kể cả khi backend lỗi để đảm bảo an toàn
      logout();
      setCurrentWorkspaceId(null);
      queryClient.clear();
      router.push('/login');
    }
  };

  return (
    <aside className="w-64 h-screen border-r border-slate-200/60 bg-white/70 backdrop-blur-md flex flex-col fixed left-0 top-0 z-50">
      {/* Logo & Workspace Selector */}
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-2 px-2">
          <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center">
            <Layout className="text-white w-5 h-5" />
          </div>
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-indigo-400">
            TeamFlow
          </span>
        </div>
        
        <WorkspaceSelector />
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {[
          { label: 'Dashboard', icon: LayoutDashboard, href: `/workspace/${currentWorkspaceId}` },
          { label: 'Dự án', icon: FolderKanban, href: `/workspace/${currentWorkspaceId}/projects` },
          { label: 'Công việc của tôi', icon: CheckSquare, href: `/workspace/${currentWorkspaceId}/tasks` },
          { label: 'Thành viên', icon: Users, href: `/workspace/${currentWorkspaceId}/members` },
          ...(currentWorkspaceId && isAdminOrOwner ? [
            { label: 'Cài đặt Workspace', icon: Settings, href: `/workspace/${currentWorkspaceId}/settings` }
          ] : []),
        ].map((item) => {
          const isActive = pathname === item.href || (item.href !== `/workspace/${currentWorkspaceId}` && pathname.startsWith(item.href));
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive 
                  ? "bg-indigo-50 text-indigo-600" 
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <item.icon className={cn("w-4 h-4", isActive ? "text-indigo-600" : "text-slate-400")} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer / User Profile */}
      <div className="p-4 border-t border-slate-200/60">
        <div className="flex items-center gap-3 px-2 py-3 rounded-xl bg-slate-50/50">
          <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
            {user?.name?.[0].toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900 truncate">{user?.name}</p>
            <p className="text-xs text-slate-500 truncate">{user?.email}</p>
          </div>
          <Button variant="ghost" size="icon-xs" onClick={handleLogout}>
            <LogOut className="w-3.5 h-3.5 text-slate-400 hover:text-red-500" />
          </Button>
        </div>
        
        <div className="flex items-center justify-between mt-4">
          <Link 
            href="/settings/profile"
            className="flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-indigo-600 transition-colors"
          >
            <Settings className="w-3.5 h-3.5" />
            Cài đặt tài khoản
          </Link>
          <ThemeToggle />
        </div>
      </div>
    </aside>
  );
}
