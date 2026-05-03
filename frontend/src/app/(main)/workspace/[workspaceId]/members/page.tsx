'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workspaceService } from '@/services/workspace.service';
import { 
  MoreVertical, 
  UserPlus, 
  Trash2, 
  ShieldCheck, 
  Mail,
  RefreshCw,
  Copy,
  Check
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { RoleBadge } from '@/components/shared/RoleBadge';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthStore } from '@/stores/auth.store';
import { cn } from '@/lib/utils';

export default function MembersPage() {
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuthStore();
  const [copied, setCopied] = useState(false);

  // Fetch Members & Roles
  const { data, isLoading } = useQuery({
    queryKey: ['workspace-members', workspaceId],
    queryFn: () => workspaceService.getMembers(workspaceId),
    enabled: !!workspaceId,
  });

  // Fetch Workspace Info (for invite code)
  const { data: workspace } = useQuery({
    queryKey: ['workspace', workspaceId],
    queryFn: () => workspaceService.getWorkspaceById(workspaceId),
    enabled: !!workspaceId,
  });

  const changeRoleMutation = useMutation({
    mutationFn: ({ memberId, roleId }: { memberId: string, roleId: string }) => 
      workspaceService.changeMemberRole(workspaceId, memberId, roleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-members', workspaceId] });
      toast.success("Đã cập nhật vai trò thành công");
    },
    onError: () => toast.error("Lỗi khi cập nhật vai trò")
  });

  const removeMemberMutation = useMutation({
    mutationFn: (memberId: string) => workspaceService.removeMember(workspaceId, memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-members', workspaceId] });
      toast.success("Đã xóa thành viên khỏi workspace");
    },
    onError: () => toast.error("Lỗi khi xóa thành viên")
  });

  const resetInviteCodeMutation = useMutation({
    mutationFn: () => workspaceService.resetInviteCode(workspaceId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceId] });
      toast.success("Đã tạo mới mã mời");
    },
    onError: () => toast.error("Lỗi khi reset mã mời")
  });

  const copyInviteCode = () => {
    if (workspace?.inviteCode) {
      navigator.clipboard.writeText(workspace.inviteCode);
      setCopied(true);
      toast.success("Đã sao chép mã mời vào bộ nhớ tạm");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const members = data?.members || [];
  const roles = data?.roles || [];

  // Check if current user is Owner or Admin
  const currentUserMember = members.find((m: any) => m.userId?._id === currentUser?.id);
  const isPrivileged = currentUserMember?.role?.name === 'OWNER' || currentUserMember?.role?.name === 'ADMIN';
  const isOwner = currentUserMember?.role?.name === 'OWNER';

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Thành viên</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">Quản lý quyền hạn và những người tham gia trong Workspace của bạn.</p>
        </div>
        
        {isPrivileged && (
            <div className="flex items-center gap-2 bg-white/50 dark:bg-slate-900/40 backdrop-blur-sm border border-slate-200/60 dark:border-brand-primary/20 p-1.5 rounded-2xl shadow-sm">
                <div className="px-3 py-1.5">
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Mã mời</p>
                    <p className="text-sm font-mono font-bold text-brand-primary">{workspace?.inviteCode || 'LOADING...'}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={copyInviteCode} className="h-10 w-10 text-slate-400 hover:text-brand-primary dark:hover:bg-brand-primary/10 rounded-xl">
                    {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                </Button>
                <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => resetInviteCodeMutation.mutate()}
                    className="h-10 w-10 text-slate-400 hover:text-brand-primary rounded-xl"
                    disabled={resetInviteCodeMutation.isPending}
                >
                    <RefreshCw className={cn("w-4 h-4", resetInviteCodeMutation.isPending && "animate-spin")} />
                </Button>
            </div>
        )}
      </div>

      <Card className="border-slate-200/60 dark:border-brand-primary/10 shadow-xl shadow-slate-200/20 dark:shadow-black/20 overflow-hidden rounded-3xl dark:bg-slate-900/50 dark:backdrop-blur-xl">
        <CardHeader className="bg-slate-50/50 dark:bg-brand-primary/5 border-b border-slate-100 dark:border-brand-primary/10 py-6">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-brand-primary/80" />
              Danh sách thành viên ({members.length})
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-100 dark:divide-brand-primary/5">
            {isLoading ? (
              [1, 2, 3].map(i => (
                <div key={i} className="p-6 flex items-center gap-4 animate-pulse">
                  <div className="w-12 h-12 rounded-2xl bg-slate-200"></div>
                  <div className="space-y-2 flex-1">
                    <div className="h-4 w-32 bg-slate-200 rounded"></div>
                    <div className="h-3 w-48 bg-slate-100 rounded"></div>
                  </div>
                </div>
              ))
            ) : (
              members.map((member: any) => (
                <div key={member._id} className="p-6 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-brand-primary/5 transition-colors group">
                  <div className="flex items-center gap-4">
                    <UserAvatar 
                      user={member.userId} 
                      className="w-12 h-12 border-2 border-white dark:border-slate-800 shadow-sm ring-1 ring-slate-100 dark:ring-brand-primary/20"
                      showShadow={false}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-slate-900 dark:text-slate-100 tracking-tight">{member.userId?.name}</p>
                        {member.userId?._id === currentUser?.id && (
                          <span className="text-[10px] font-bold text-brand-primary dark:text-white dark:bg-brand-primary/40 bg-brand-primary/10 px-1.5 py-0.5 rounded uppercase flex items-center gap-1">
                            <span className="w-1 h-1 rounded-full bg-brand-primary dark:bg-emerald-400 animate-pulse" />
                            Bạn
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 mt-0.5">
                        <Mail className="w-3 h-3" />
                        <p className="text-xs font-medium">{member.userId?.email}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex justify-end min-w-[100px]">
                      <RoleBadge roleName={member.role?.name} />
                    </div>
                    
                    {isOwner && member.userId?._id !== currentUser?.id && member.role?.name !== 'OWNER' ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          className={cn(
                            buttonVariants({ variant: "ghost", size: "icon" }),
                            "h-10 w-10 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-brand-primary/10 shadow-sm rounded-xl border border-transparent hover:border-slate-200 dark:hover:border-brand-primary/20 transition-all"
                          )}
                        >
                          <MoreVertical className="w-4 h-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 shadow-2xl border-slate-200/60 dark:border-brand-primary/10 bg-white/95 dark:bg-slate-900/90 backdrop-blur-xl">
                          <DropdownMenuGroup>
                            <DropdownMenuLabel className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-2 py-1.5">Thay đổi vai trò</DropdownMenuLabel>
                            {roles.map((role: any) => (
                                role.name !== 'OWNER' && (
                                  <DropdownMenuItem 
                                      key={role._id} 
                                      onClick={() => changeRoleMutation.mutate({ memberId: member.userId?._id, roleId: role._id })}
                                      className={cn(
                                          "rounded-xl font-bold cursor-pointer my-0.5 transition-colors",
                                          member.role?._id === role._id && "bg-brand-primary/10 text-brand-primary focus:bg-brand-primary/10 focus:text-brand-primary dark:bg-brand-primary/20 dark:text-emerald-400"
                                      )}
                                  >
                                      {role.name}
                                  </DropdownMenuItem>
                                )
                            ))}
                          </DropdownMenuGroup>
                          <DropdownMenuSeparator className="bg-slate-100 dark:bg-brand-primary/10 my-2" />
                          <DropdownMenuItem 
                            onClick={() => {
                                if(window.confirm(`Bạn có chắc muốn xóa ${member.userId?.name} khỏi workspace?`)) {
                                    removeMemberMutation.mutate(member.userId?._id);
                                }
                            }}
                            className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/30 rounded-xl font-bold cursor-pointer transition-colors"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Xóa khỏi Workspace
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : (
                      <div className="w-10" /> 
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <div className="bg-gradient-to-br from-brand-primary via-brand-primary to-[#024341] rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl shadow-brand-primary/20 text-white relative overflow-hidden border border-white/10 group hover:shadow-brand-primary/30 transition-all duration-500">
        <div className="relative z-10 max-w-lg">
           <h3 className="text-3xl font-black tracking-tighter mb-2 drop-shadow-sm">Mở rộng nhóm của bạn?</h3>
           <p className="text-emerald-50/60 font-medium leading-relaxed">Gửi mã mời cho đồng đội để họ có thể tham gia và cộng tác trực tiếp trong không gian làm việc này.</p>
        </div>
        <div className="relative z-10 flex gap-4">
           <Button size="lg" onClick={copyInviteCode} className="bg-white text-brand-primary hover:bg-emerald-50 font-black rounded-2xl px-10 h-14 shadow-2xl hover:scale-105 active:scale-95 transition-all">
              <UserPlus className="w-5 h-5 mr-3" />
              Mời thành viên
           </Button>
        </div>
        {/* Decorative elements - Editorial Tech Style */}
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-white/10 rounded-full blur-[80px] group-hover:bg-white/15 transition-colors duration-700"></div>
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-black/20 rounded-full blur-[80px] group-hover:bg-black/30 transition-colors duration-700"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.1)_100%)] pointer-events-none"></div>
      </div>
    </div>
  );
}
