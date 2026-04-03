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
    <aside className="w-66 h-screen glass border-ghost flex flex-col fixed left-0 top-0 z-50 shadow-ambient">
      {/* Logo & Workspace Selector */}
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-3 px-2">
          <div className="w-9 h-9 bg-kinetic rounded-xl flex items-center justify-center shadow-glow shadow-brand-primary/20">
            <Layout className="text-white w-5 h-5" />
          </div>
          <span className="text-xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-brand-primary to-accent-ai">
            TeamFlow
          </span>
        </div>
        
        <div className="px-1">
          <WorkspaceSelector />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-2 space-y-1.5 overflow-y-auto">
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
                "group flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200",
                isActive 
                  ? "bg-brand-primary text-white shadow-glow shadow-brand-primary/30" 
                  : "text-slate-500 hover:bg-brand-secondary/50 hover:text-brand-primary"
              )}
            >
              <item.icon className={cn("w-4.5 h-4.5 transition-transform duration-200", isActive ? "text-white scale-110" : "text-slate-400 group-hover:text-brand-primary")} />
              {item.label}
              {isActive && <ChevronRight className="ml-auto w-4 h-4 text-white/70" />}
            </Link>
          );
        })}
      </nav>

      {/* Footer / User Profile */}
      <div className="p-6 mt-auto border-t border-divider/40">
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-secondary/30 border border-ghost shadow-sm">
          <div className="w-10 h-10 rounded-full bg-kinetic flex items-center justify-center text-white font-black text-sm shadow-sm ring-2 ring-white">
            {user?.name?.[0].toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-900 truncate">{user?.name}</p>
            <p className="text-[10px] font-medium text-slate-500 truncate uppercase tracking-tight">{user?.email}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={handleLogout} className="rounded-full w-8 h-8 hover:bg-rose-50 hover:text-rose-500">
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="flex items-center justify-between mt-5 px-1">
          <Link 
            href="/settings/profile"
            className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-brand-primary transition-all hover:translate-x-1"
          >
            <Settings className="w-3.5 h-3.5" />
            Cài đặt
          </Link>
          <ThemeToggle />
        </div>
      </div>
    </aside>
  );
}
