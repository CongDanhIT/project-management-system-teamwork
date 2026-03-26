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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Thành viên</h1>
          <p className="text-slate-500 font-medium">Quản lý quyền hạn và những người tham gia trong Workspace của bạn.</p>
        </div>
        
        {isPrivileged && (
            <div className="flex items-center gap-2 bg-white/50 backdrop-blur-sm border border-slate-200/60 p-1.5 rounded-2xl shadow-sm">
                <div className="px-3 py-1.5">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mã mời</p>
                    <p className="text-sm font-mono font-bold text-indigo-600">{workspace?.inviteCode || 'LOADING...'}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={copyInviteCode} className="h-10 w-10 text-slate-400 hover:text-indigo-600 rounded-xl">
                    {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                </Button>
                <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => resetInviteCodeMutation.mutate()}
                    className="h-10 w-10 text-slate-400 hover:text-indigo-600 rounded-xl"
                    disabled={resetInviteCodeMutation.isPending}
                >
                    <RefreshCw className={cn("w-4 h-4", resetInviteCodeMutation.isPending && "animate-spin")} />
                </Button>
            </div>
        )}
      </div>

      <Card className="border-slate-200/60 shadow-xl shadow-slate-200/20 overflow-hidden rounded-3xl">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-6">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-500" />
              Danh sách thành viên ({members.length})
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-100">
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
                <div key={member._id} className="p-6 flex items-center justify-between hover:bg-slate-50/50 transition-colors group">
                  <div className="flex items-center gap-4">
                    <Avatar className="w-12 h-12 rounded-2xl border-2 border-white shadow-sm ring-1 ring-slate-100">
                      <AvatarImage src={member.userId?.profilePicture} />
                      <AvatarFallback className="bg-gradient-to-br from-indigo-50 to-slate-50 text-indigo-600 font-bold">
                        {member.userId?.name?.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-slate-900 tracking-tight">{member.userId?.name}</p>
                        {member.userId?._id === currentUser?.id && (
                          <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded uppercase">Bạn</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-500 mt-0.5">
                        <Mail className="w-3 h-3" />
                        <p className="text-xs font-medium">{member.userId?.email}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <RoleBadge roleName={member.role?.name} />
                    
                    {isPrivileged && member.userId?._id !== currentUser?.id && member.role?.name !== 'OWNER' && (
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          className={cn(
                            buttonVariants({ variant: "ghost", size: "icon" }),
                            "text-slate-400 hover:text-slate-600 hover:bg-white shadow-sm rounded-xl border border-transparent hover:border-slate-200"
                          )}
                        >
                          <MoreVertical className="w-4 h-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 shadow-2xl border-slate-200/60 bg-white/95 backdrop-blur-xl">
                          <DropdownMenuGroup>
                            <DropdownMenuLabel className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 py-1.5">Thay đổi vai trò</DropdownMenuLabel>
                            {roles.map((role: any) => (
                                role.name !== 'OWNER' && (
                                  <DropdownMenuItem 
                                      key={role._id} 
                                      onClick={() => changeRoleMutation.mutate({ memberId: member.userId?._id, roleId: role._id })}
                                      className={cn(
                                          "rounded-xl font-bold cursor-pointer my-0.5",
                                          member.role?._id === role._id && "bg-indigo-50 text-indigo-600 focus:bg-indigo-50 focus:text-indigo-600"
                                      )}
                                  >
                                      {role.name}
                                  </DropdownMenuItem>
                                )
                            ))}
                          </DropdownMenuGroup>
                          <DropdownMenuSeparator className="bg-slate-100 my-2" />
                          <DropdownMenuItem 
                            onClick={() => {
                                if(window.confirm(`Bạn có chắc muốn xóa ${member.userId?.name} khỏi workspace?`)) {
                                    removeMemberMutation.mutate(member.userId?._id);
                                }
                            }}
                            className="text-red-600 focus:text-red-600 focus:bg-red-50 rounded-xl font-bold cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Xóa khỏi Workspace
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <div className="bg-indigo-600 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl shadow-indigo-200 text-white relative overflow-hidden">
        <div className="relative z-10 max-w-lg">
           <h3 className="text-2xl font-black tracking-tight mb-2">Mở rộng nhóm của bạn?</h3>
           <p className="text-indigo-100 font-medium">Gửi mã mời cho đồng đội để họ có thể tham gia và cộng tác trực tiếp trong không gian làm việc này.</p>
        </div>
        <div className="relative z-10 flex gap-4">
           <Button size="lg" onClick={copyInviteCode} className="bg-white text-indigo-600 hover:bg-indigo-50 font-black rounded-2xl px-8 h-12 shadow-xl">
              <UserPlus className="w-5 h-5 mr-2" />
              Mời thành viên
           </Button>
        </div>
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-400/20 rounded-full -ml-20 -mb-20 blur-3xl"></div>
      </div>
    </div>
  );
}
