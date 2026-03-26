'use client';

import React, { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workspaceService } from '@/services/workspace.service';
import { 
  Settings2, 
  Trash2, 
  Save, 
  AlertTriangle,
  Info,
  RefreshCw,
  Copy,
  Check,
  UserPlus
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { useAuthStore } from '@/stores/auth.store';
import { useWorkspaceStore } from '@/stores/workspace.store';
import { useWorkspaceRole } from '@/hooks/useWorkspaceRole';
import { cn } from '@/lib/utils';

interface WorkspaceSettingsForm {
  name: string;
  description: string;
}

export default function WorkspaceSettingsPage() {
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user: currentUser, updateUser } = useAuthStore();
  const { setCurrentWorkspaceId } = useWorkspaceStore();
  const { isAdminOrOwner, isLoading: isRoleLoading } = useWorkspaceRole();
  const [copied, setCopied] = React.useState(false);

  const { data: workspace, isLoading: isWorkspaceLoading } = useQuery({
    queryKey: ['workspace', workspaceId],
    queryFn: () => workspaceService.getWorkspaceById(workspaceId),
    enabled: !!workspaceId,
  });

  const { data: workspaces } = useQuery({
    queryKey: ['workspaces'],
    queryFn: () => workspaceService.getWorkspaces(),
  });

  const { register, handleSubmit, reset, formState: { isDirty } } = useForm<WorkspaceSettingsForm>();

  useEffect(() => {
    if (workspace) {
      reset({
        name: workspace.name,
        description: workspace.description || '',
      });
    }
  }, [workspace, reset]);

  const updateMutation = useMutation({
    mutationFn: (data: WorkspaceSettingsForm) => workspaceService.updateWorkspace(workspaceId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      toast.success("Đã cập nhật thông tin workspace");
    },
    onError: () => toast.error("Lỗi khi cập nhật workspace")
  });

  const resetInviteMutation = useMutation({
    mutationFn: () => workspaceService.resetInviteCode(workspaceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceId] });
      toast.success("Đã làm mới mã mời thành công");
    },
    onError: () => toast.error("Lỗi khi làm mới mã mời")
  });

  const deleteMutation = useMutation({
    mutationFn: () => workspaceService.deleteWorkspace(workspaceId),
    onSuccess: async () => {
      toast.success("Đã xóa workspace thành công");
      
      // Invalidate and refetch workspaces to get current list
      await queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      const updatedWorkspaces = await queryClient.fetchQuery({
        queryKey: ['workspaces'],
        queryFn: () => workspaceService.getWorkspaces(),
      });

      const nextWorkspace = updatedWorkspaces?.find(w => w._id !== workspaceId);
      
      if (nextWorkspace) {
        setCurrentWorkspaceId(nextWorkspace._id);
        updateUser({ currentWorkspaceId: nextWorkspace._id });
        router.push(`/workspace/${nextWorkspace._id}`);
      } else {
        setCurrentWorkspaceId(null);
        updateUser({ currentWorkspaceId: undefined });
        router.push('/');
      }
    },
    onError: () => toast.error("Lỗi khi xóa workspace")
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Đã sao chép mã mời");
  };

  const onSubmit = (data: WorkspaceSettingsForm) => {
    updateMutation.mutate(data);
  };

  if (isWorkspaceLoading || isRoleLoading) {
    return <div className="p-8 text-center animate-pulse">Đang tải cấu hình...</div>;
  }

  if (!isAdminOrOwner) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
        <div className="p-4 bg-amber-50 rounded-full">
           <AlertTriangle className="w-12 h-12 text-amber-500" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Từ chối truy cập</h2>
        <p className="text-slate-500 max-w-md">Bạn không có quyền thay đổi các thiết lập này. Vui lòng liên hệ Admin hoặc Owner.</p>
        <Button onClick={() => router.back()}>Quay lại</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-20">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Cài đặt Workspace</h1>
        <p className="text-slate-500 font-medium">Quản lý cấu hình chung và các thiết lập nâng cao.</p>
      </div>

      <div className="grid gap-8">
        {/* General Settings */}
        <Card className="border-slate-200/60 shadow-xl shadow-slate-200/10 rounded-3xl overflow-hidden">
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-6">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Settings2 className="w-5 h-5 text-indigo-600" />
                Thông tin cơ bản
              </CardTitle>
              <CardDescription>Cập nhật tên và mô tả không gian làm việc của bạn.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Tên Workspace</label>
                <Input 
                  {...register('name', { required: true })}
                  placeholder="VD: Phòng Marketing, Dự án X..."
                  className="h-12 rounded-xl border-slate-200 focus:ring-indigo-500 focus:border-indigo-500 font-bold"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Mô tả (Không bắt buộc)</label>
                <Textarea 
                  {...register('description')}
                  placeholder="Mô tả mục tiêu của workspace này..."
                  className="min-h-[120px] rounded-2xl border-slate-200 focus:ring-indigo-500 focus:border-indigo-500 font-medium resize-none"
                />
              </div>
            </CardContent>
            <CardFooter className="bg-slate-50/30 border-t border-slate-100 p-6 flex justify-end">
              <Button 
                type="submit" 
                disabled={!isDirty || updateMutation.isPending}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-black px-8 h-12 rounded-2xl shadow-lg shadow-indigo-200"
              >
                {updateMutation.isPending ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Lưu thay đổi
              </Button>
            </CardFooter>
          </form>
        </Card>

        {/* Invite Code Settings */}
        <Card className="border-slate-200/60 shadow-xl shadow-slate-200/10 rounded-3xl overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-6">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-emerald-600" />
              Mã mời Workspace
            </CardTitle>
            <CardDescription>Sử dụng mã này để mời thành viên khác vào không gian làm việc.</CardDescription>
          </CardHeader>
          <CardContent className="p-8 space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-1 bg-slate-100 px-6 py-4 rounded-2xl border border-slate-200 flex items-center justify-between group">
                <span className="text-2xl font-black tracking-[0.2em] text-slate-700">
                  {workspace?.inviteCode || '--------'}
                </span>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => copyToClipboard(workspace?.inviteCode || '')}
                  className="hover:bg-white text-slate-500 hover:text-indigo-600"
                >
                  {copied ? <Check className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5" />}
                </Button>
              </div>
              <Button 
                variant="outline"
                className="h-14 px-6 rounded-2xl border-slate-200 hover:bg-slate-50 gap-2 font-bold"
                onClick={() => {
                  if (confirm("Làm mới mã mời sẽ khiến mã cũ không còn hiệu lực. Bạn chắc chứ?")) {
                    resetInviteMutation.mutate();
                  }
                }}
                disabled={resetInviteMutation.isPending}
              >
                <RefreshCw className={cn("w-4 h-4", resetInviteMutation.isPending && "animate-spin")} />
                Làm mới mã
              </Button>
            </div>
            <p className="text-xs text-slate-400 font-medium pl-1 italic">
              * Chia sẻ mã này với đồng nghiệp để họ tham gia. Bạn có thể làm mới mã bất cứ lúc nào để tăng tính bảo mật.
            </p>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-red-100 shadow-xl shadow-red-50/50 rounded-3xl overflow-hidden">
          <CardHeader className="bg-red-50/30 border-b border-red-50 py-6">
            <CardTitle className="text-lg font-bold text-red-600 flex items-center gap-2">
              <Trash2 className="w-5 h-5" />
              Khu vực nguy hiểm
            </CardTitle>
            <CardDescription className="text-red-500/80">Các hành động này không thể hoàn tác. Hãy cẩn trọng.</CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 rounded-2xl bg-red-50/50 border border-red-100 border-dashed">
              <div className="space-y-1">
                <p className="font-bold text-red-900">Xóa Workspace này</p>
                <p className="text-sm text-red-600/70 font-medium">Bao gồm tất cả dự án, công việc và dữ liệu thành viên.</p>
              </div>
              <Button 
                variant="destructive" 
                onClick={() => {
                  if (window.confirm("BẠN CÓ CHẮC CHẮN MUỐN XÓA WORKSPACE NÀY? Toàn bộ dữ liệu sẽ mất vĩnh viễn.")) {
                    deleteMutation.mutate();
                  }
                }}
                className="font-black rounded-xl h-12 px-6 shadow-lg shadow-red-100"
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
                Xác nhận xóa
              </Button>
            </div>
          </CardContent>
          <CardFooter className="bg-red-50/10 p-6 flex items-center gap-3">
             <Info className="w-4 h-4 text-red-400 shrink-0" />
             <p className="text-[11px] font-bold text-red-400 uppercase tracking-wider">Chỉ có chủ sở hữu và Admin mới nhìn thấy khu vực này.</p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
