'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { projectService } from '@/services/project.service';
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
  Sun,
  Heart,
  ChevronDown,
  Megaphone,
  Briefcase,
  Map,
  Files,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth.store';
import { useWorkspaceStore } from '@/stores/workspace.store';
import { authService } from '@/services/auth.service';
import { PhaseService } from '@/services/phase.service';
import WorkspaceSelector from './WorkspaceSelector';
import { Button } from '@/components/ui/button';
import { useWorkspaceRole } from '@/hooks/useWorkspaceRole';
import { toast } from 'sonner';
import { UserAvatar } from '../shared/UserAvatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuGroup,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';

// navItems removed from static list to be dynamic in component

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const params = useParams();
  
  // Lấy workspaceId từ params hoặc fallback từ pathname nếu params bị rỗng (thường gặp khi đang chuyển hướng hoặc hydration)
  const workspaceIdFromParams = params?.workspaceId as string;
  const workspaceIdFromPath = pathname?.split('/')[2];
  const workspaceId = (workspaceIdFromParams || (workspaceIdFromPath && /^[0-9a-fA-F]{24}$/.test(workspaceIdFromPath) ? workspaceIdFromPath : '')) as string;

  const { user, logout } = useAuthStore();
  const { setCurrentWorkspaceId } = useWorkspaceStore();
  const { isAdminOrOwner } = useWorkspaceRole();
  const queryClient = useQueryClient();
  const [isFavoritesOpen, setIsFavoritesOpen] = React.useState(true);
  const [isProjectsOpen, setIsProjectsOpen] = React.useState(false);
  const [expandedProjectId, setExpandedProjectId] = React.useState<string | null>(null);

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

  const { data: favoriteProjects, isLoading: favoritesLoading } = useQuery({
    queryKey: ['favorite-projects', workspaceId],
    queryFn: () => projectService.getFavoriteProjects(workspaceId),
    enabled: !!workspaceId,
  });

  const { data: projectsData } = useQuery({
    queryKey: ['workspace-projects-all', workspaceId],
    queryFn: () => projectService.getProjectsByWorkspace(workspaceId, 1, 100),
    enabled: !!workspaceId,
  });

  const { data: phasesData } = useQuery({
    queryKey: ['workspace-phases-all', workspaceId],
    queryFn: () => PhaseService.getPhasesByWorkspace(workspaceId),
    enabled: !!workspaceId,
  });

  const allProjects = projectsData?.projects || [];
  const allPhases = phasesData?.data || [];

  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 flex-col bg-white dark:bg-sidebar lg:flex shadow-[inset_1px_1px_0_rgba(255,255,255,0.6),4px_0_16px_-4px_rgba(0,0,0,0.1)] dark:shadow-[inset_1px_1px_0_rgba(255,255,255,0.05),4px_0_24px_rgba(0,0,0,0.4)] border-none transition-all duration-300">
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

      {/* Blurry Separator Gradient Line - Top (Enhanced Clarity) */}
      <div className="relative h-[1.5px] w-full mb-2">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-400/30 dark:via-brand-secondary/10 to-transparent" />
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-6 overflow-y-auto">
        {[
          {
            group: 'TỔNG QUAN',
            items: [
              { label: 'Dashboard', icon: LayoutDashboard, href: `/workspace/${workspaceId}` },
              { label: 'Bản tin', icon: Megaphone, href: `/workspace/${workspaceId}/newsfeed` },
            ]
          },
          {
            group: 'THỰC THI & QUẢN LÝ',
            items: [
              { label: 'Lịch trình', icon: Map, href: `/workspace/${workspaceId}/roadmap` },
              { label: 'Dự án', icon: FolderKanban, href: `/workspace/${workspaceId}/projects`, hasDropdown: true },
              { label: 'Tài liệu', icon: Files, href: `/workspace/${workspaceId}/documents` },
              { label: 'Công việc của tôi', icon: CheckSquare, href: `/workspace/${workspaceId}/tasks` },
              ...(workspaceId && isAdminOrOwner ? [
                { label: 'Tự động hóa', icon: Zap, href: `/workspace/${workspaceId}/automation` }
              ] : []),
            ]
          },
          {
            group: 'HỆ THỐNG',
            items: [
              { label: 'Thành viên', icon: Users, href: `/workspace/${workspaceId}/members` },
              ...(workspaceId && isAdminOrOwner ? [
                { label: 'Cài đặt Workspace', icon: Settings, href: `/workspace/${workspaceId}/settings` }
              ] : []),
            ]
          }
        ].map((section, index) => (
          <div key={section.group} className="space-y-1.5">
            {index > 0 && (
              <div className="relative h-[1.5px] -mx-4 mb-6 mt-2">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-400/30 dark:via-brand-secondary/10 to-transparent" />
              </div>
            )}
            <span className="px-5 text-[10px] font-black text-slate-400 dark:text-slate-100/30 uppercase tracking-[0.2em] mb-2 block">
              {section.group}
            </span>
            {section.items.map((item: any) => {
              const isActive = pathname === item.href || (item.href !== `/workspace/${workspaceId}` && pathname?.startsWith(item.href));
              
              if (item.hasDropdown) {
                return (
                  <div key={item.label} className="space-y-1">
                    <div
                      className={cn(
                        "group flex items-center gap-3 px-5 py-3 rounded-2xl text-[14px] font-medium transition-all duration-300 cursor-pointer",
                        isActive
                          ? "bg-brand-primary text-white shadow-lg shadow-brand-primary/20"
                          : "text-[#3F4948] dark:text-slate-50/60 hover:bg-brand-primary/5 dark:hover:bg-brand-secondary/5 hover:text-brand-primary dark:hover:text-brand-secondary"
                      )}
                      onClick={() => setIsProjectsOpen(!isProjectsOpen)}
                    >
                      <item.icon className={cn("w-5 h-5 transition-all duration-300", isActive ? "text-[#C7F964] scale-105" : "text-current opacity-70 group-hover:opacity-100")} />
                      <span className={cn(isActive ? "font-semibold" : "font-medium")}>{item.label}</span>
                      <div className="ml-auto flex items-center gap-2">
                        {isActive && <div className="w-1.5 h-1.5 rounded-full bg-[#C7F964] shadow-[0_0_8px_#C7F964]" />}
                        <ChevronDown className={cn("w-4 h-4 transition-transform duration-300 opacity-50 group-hover:opacity-100", isProjectsOpen && "rotate-180")} />
                      </div>
                    </div>

                    {isProjectsOpen && (
                      <div className="ml-4 pl-4 border-l border-slate-100 dark:border-white/5 space-y-1 py-1 animate-in slide-in-from-top-2 duration-300">
                        <Link
                          href={item.href}
                          className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] transition-all",
                            pathname === item.href 
                              ? "text-brand-primary dark:text-brand-secondary font-bold" 
                              : "text-slate-500 dark:text-slate-400 hover:text-brand-primary dark:hover:text-brand-secondary"
                          )}
                        >
                          <Layout className="w-3.5 h-3.5" />
                          <span>Xem tất cả dự án</span>
                        </Link>

                        {allProjects.map((project: any) => {
                          const projectHref = `/workspace/${workspaceId}/projects/${project._id}/phases`;
                          const isProjectActive = pathname?.startsWith(projectHref);
                          const isExpanded = expandedProjectId === project._id;
                          const projectPhases = allPhases.filter((p: any) => p.projectId === project._id);

                          return (
                            <div key={project._id} className="space-y-0.5">
                              <div
                                className={cn(
                                  "group flex items-center justify-between px-4 py-2 rounded-xl text-[13px] cursor-pointer transition-all",
                                  isProjectActive
                                    ? "text-brand-primary dark:text-brand-secondary font-bold bg-brand-primary/5"
                                    : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5"
                                )}
                                onClick={() => setExpandedProjectId(isExpanded ? null : project._id)}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className={cn(
                                    "w-1.5 h-1.5 rounded-full",
                                    isProjectActive ? "bg-brand-primary dark:bg-brand-secondary" : "bg-slate-300 dark:bg-slate-600"
                                  )} />
                                  <span className="truncate">{project.name}</span>
                                </div>
                                {projectPhases.length > 0 && (
                                  <ChevronDown className={cn("w-3 h-3 transition-transform", isExpanded && "rotate-180")} />
                                )}
                              </div>

                              {isExpanded && projectPhases.length > 0 && (
                                <div className="ml-3 pl-3 border-l border-slate-100 dark:border-white/10 space-y-0.5 py-1">
                                  {projectPhases.map((phase: any) => {
                                    const phaseHref = `/workspace/${workspaceId}/projects/${project._id}/phases/${phase._id}/board`;
                                    const isPhaseActive = pathname?.startsWith(`/workspace/${workspaceId}/projects/${project._id}/phases/${phase._id}`);
                                    return (
                                      <Link
                                        key={phase._id}
                                        href={phaseHref}
                                        className={cn(
                                          "flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12px] transition-all",
                                          isPhaseActive
                                            ? "text-brand-primary dark:text-brand-secondary font-bold"
                                            : "text-slate-400 dark:text-slate-500 hover:text-brand-primary dark:hover:text-brand-secondary"
                                        )}
                                      >
                                        <div className={cn(
                                          "w-1 h-1 rounded-full",
                                          isPhaseActive ? "bg-brand-primary dark:bg-brand-secondary" : "bg-slate-200 dark:bg-slate-800"
                                        )} />
                                        <span className="truncate">{phase.name}</span>
                                      </Link>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={cn(
                    "group flex items-center gap-3 px-5 py-3 rounded-2xl text-[14px] font-medium transition-all duration-300",
                    isActive
                      ? "bg-brand-primary text-white shadow-lg shadow-brand-primary/20"
                      : "text-[#3F4948] dark:text-slate-50/60 hover:bg-brand-primary/5 dark:hover:bg-brand-secondary/5 hover:text-brand-primary dark:hover:text-brand-secondary"
                  )}
                >
                  <item.icon className={cn("w-5 h-5 transition-all duration-300", isActive ? "text-[#C7F964] scale-105" : "text-current opacity-70 group-hover:opacity-100")} />
                  <span className={cn(isActive ? "font-semibold" : "font-medium")}>{item.label}</span>
                  {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#C7F964] shadow-[0_0_8px_#C7F964]" />}
                </Link>
              );
            })}
          </div>
        ))}

        {/* Favorite Projects Section */}
        {favoriteProjects && favoriteProjects.length > 0 && (
          <div className="pt-6 space-y-2">
            <button 
              onClick={() => setIsFavoritesOpen(!isFavoritesOpen)}
              className="flex items-center justify-between w-full px-5 mb-2 group outline-none"
            >
              <span className="text-[10px] font-black text-slate-400 dark:text-slate-100/30 uppercase tracking-[0.2em] group-hover:text-brand-primary dark:group-hover:text-brand-secondary transition-colors">
                Dự án yêu thích
              </span>
              <ChevronDown 
                className={cn(
                  "w-3.5 h-3.5 text-slate-400 dark:text-slate-500 transition-transform duration-300",
                  !isFavoritesOpen && "-rotate-90"
                )} 
              />
            </button>
            
            {isFavoritesOpen && (
              <div className="space-y-1 animate-in fade-in slide-in-from-top-2 duration-300">
                {favoriteProjects.map((project) => {
                  const projectHref = `/workspace/${workspaceId}/projects/${project._id}/phases`;
                  const isActive = pathname?.startsWith(projectHref);
                  return (
                    <Link
                      key={project._id}
                      href={projectHref}
                      className={cn(
                        "group flex items-center gap-3 px-5 py-2.5 rounded-xl text-[13px] transition-all duration-300",
                        isActive
                          ? "bg-brand-primary/10 text-brand-primary dark:text-brand-secondary font-bold"
                          : "text-slate-500 dark:text-slate-400 hover:bg-brand-primary/5 dark:hover:bg-white/5 hover:text-brand-primary dark:hover:text-brand-secondary"
                      )}
                    >
                      <div className={cn(
                        "w-2 h-2 rounded-full transition-all duration-300",
                        isActive 
                          ? "bg-brand-primary shadow-[0_0_8px_rgba(3,93,91,0.4)] dark:bg-brand-secondary dark:shadow-[0_0_8px_rgba(199,249,100,0.4)]" 
                          : "bg-slate-200 dark:bg-slate-700 group-hover:bg-brand-primary/60 dark:group-hover:bg-brand-secondary/60"
                      )} />
                      <span className="truncate">{project.name}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </nav>

      {/* Footer / User Profile (Redesigned Profile Block) */}
      <div className="mt-auto relative">
        {/* Blurry Separator Gradient Line - Ultra Soft (Enhanced Clarity) */}
        <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-slate-400/30 dark:via-brand-secondary/10 to-transparent" />
        <div className="p-4">

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button className="w-full group relative flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 hover:bg-[#035D5B]/5 dark:hover:bg-[#C7F964]/5 outline-none">
                <div className="absolute inset-0 bg-gradient-to-r from-brand-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-all rounded-2xl" />

                <div className="relative pt-2"> {/* Added padding to prevent clipping when floating */}
                  {/* Detached Shadow Element */}
                  <div className="absolute bottom-[-1px] left-1/2 -translate-x-1/2 w-8 h-1 bg-black/20 dark:bg-black/40 rounded-[50%] blur-[2px] opacity-60 scale-90 transition-all duration-500 group-hover:opacity-100 group-hover:scale-125 group-hover:blur-[6px]" />

                  <div className="absolute -inset-1.5 bg-gradient-to-tr from-brand-primary/20 to-teal-500/10 rounded-xl blur-[8px] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <UserAvatar
                    user={user || { name: 'User' }}
                    size="default"
                    showShadow={false}
                    className="w-10 h-10 border-2 border-white dark:border-white/10 shadow-sm relative z-10 -translate-y-1 group-hover:-translate-y-3 transition-all duration-500"
                  />
                </div>

                <div className="flex flex-col items-start min-w-0 flex-1 relative z-10 text-left">
                  <span className="text-[10px] font-black text-slate-400 dark:text-slate-100/20 uppercase tracking-widest leading-none mb-1">
                    Tài khoản
                  </span>
                  <span className="text-sm font-bold text-[#3F4948] dark:text-slate-50 truncate w-full group-hover:text-brand-primary dark:group-hover:text-brand-secondary transition-colors">
                    {user?.name || 'Guest'}
                  </span>
                </div>

                <ChevronRight className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </button>
            }
          />
          <DropdownMenuContent
            align="end"
            side="right"
            sideOffset={12}
            className="w-72 rounded-[28px] p-4 shadow-depth-3 border-ghost glass mb-4 ml-1 animate-in fade-in slide-in-from-left-2 duration-300 z-50 text-left"
          >
            <DropdownMenuGroup className="px-3 py-2">
              <div className="flex items-center gap-3 mb-1">
                <UserAvatar user={user || { name: 'User' }} size="default" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-slate-800 dark:text-white truncate">{user?.name}</p>
                  <p className="text-[10px] font-bold text-slate-400 truncate uppercase tracking-tighter">{user?.email}</p>
                </div>
              </div>
            </DropdownMenuGroup>
            <DropdownMenuSeparator className="bg-divider/20 my-2" />
            <DropdownMenuGroup className="space-y-1">
              <DropdownMenuItem
                onClick={() => router.push('/settings/profile')}
                className="group rounded-[18px] font-bold cursor-pointer py-3.5 px-4 hover:bg-teal-50 dark:hover:bg-teal-500/10 text-slate-600 dark:text-slate-300 hover:text-teal-700 dark:hover:text-teal-400"
              >
                <Users className="w-4.5 h-4.5 mr-3 text-teal-400 group-hover:text-teal-600 transition-colors" />
                Thông tin cá nhân
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleLogout}
                className="group rounded-[18px] font-bold cursor-pointer py-3.5 px-4 hover:bg-rose-50 dark:hover:bg-rose-500/10 text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400"
              >
                <LogOut className="w-4.5 h-4.5 mr-3 text-rose-400 group-hover:text-rose-600 transition-colors" />
                Đăng xuất
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        </div>
      </div>

      {/* Vertical Gradient Border - Dark Mode Only (Neon Precision) */}
      <div className="absolute right-0 top-0 bottom-0 w-[1px] hidden dark:block pointer-events-none">
        <div className="h-full w-full bg-gradient-to-b from-transparent via-slate-700/40 to-transparent" />
        <div className="absolute inset-0 shadow-[1px_0_12px_rgba(255,255,255,0.08)]" />
      </div>
    </aside>
  );
}
