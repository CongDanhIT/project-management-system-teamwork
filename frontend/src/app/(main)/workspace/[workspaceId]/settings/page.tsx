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
  UserPlus,
  Slack,
  ExternalLink,
  Globe,
  Mail,
  Zap,
  Send
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import Loader from "@/components/ui/Loader";
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
  slackWebhookUrl: string;
  dailyDigestEnabled: boolean;
}

export default function WorkspaceSettingsPage() {
  const params = useParams();
  const workspaceId = params?.workspaceId as string;
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

  const { register, handleSubmit, reset, setValue, watch, formState: { isDirty } } = useForm<WorkspaceSettingsForm>({
    defaultValues: {
      dailyDigestEnabled: true
    }
  });
  const dailyDigestEnabled = watch('dailyDigestEnabled') ?? true;

  useEffect(() => {
    if (workspace) {
      reset({
        name: workspace.name,
        description: workspace.description || '',
        slackWebhookUrl: workspace.slackWebhookUrl || '',
        dailyDigestEnabled: workspace.dailyDigestEnabled ?? true,
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

  const handleTestSlack = async () => {
    try {
      toast.promise(workspaceService.triggerSlackTest(workspaceId as string), {
        loading: 'Đang gửi thông báo test đến Slack...',
        success: 'Đã gửi thành công! Hãy kiểm tra Slack của bạn.',
        error: (err: any) => err.response?.data?.message || 'Gửi test Slack thất bại'
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleTestEmail = async () => {
    try {
      toast.promise(workspaceService.triggerEmailTest(), {
        loading: 'Đang gửi email báo cáo cá nhân...',
        success: 'Đã gửi thành công! Hãy kiểm tra hòm thư của bạn.',
        error: (err: any) => err.response?.data?.message || 'Gửi email test thất bại'
      });
    } catch (error) {
      console.error(error);
    }
  };

  if (isWorkspaceLoading || isRoleLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader size="lg" />
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Đang nạp cấu hình không gian...</p>
      </div>
    );
  }

  if (!isAdminOrOwner) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
        <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-full">
           <AlertTriangle className="w-12 h-12 text-amber-500" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Từ chối truy cập</h2>
        <p className="text-slate-500 dark:text-slate-400 max-w-md">Bạn không có quyền thay đổi các thiết lập này. Vui lòng liên hệ Admin hoặc Owner.</p>
        <Button onClick={() => router.back()}>Quay lại</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-20">
      <div>
        <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Cài đặt Workspace</h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium">Quản lý cấu hình chung và các thiết lập nâng cao.</p>
      </div>

      <div className="grid gap-8">
        {/* General Settings */}
        <Card className="bg-white dark:bg-slate-900/50 dark:backdrop-blur-xl border-slate-200/60 dark:border-white/10 shadow-xl shadow-slate-200/10 dark:shadow-none rounded-3xl overflow-hidden">
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardHeader className="bg-slate-50/50 dark:bg-white/5 border-b border-slate-100 dark:border-white/5 py-6">
              <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-900 dark:text-slate-100">
                <Settings2 className="w-5 h-5 text-brand-primary" />
                Thông tin cơ bản
              </CardTitle>
              <CardDescription className="text-slate-500 dark:text-slate-400">Cập nhật tên và mô tả không gian làm việc của bạn.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Tên Workspace</label>
                <Input 
                  {...register('name', { required: true })}
                  placeholder="VD: Phòng Marketing, Dự án X..."
                  className="h-12 rounded-xl border-slate-200 dark:border-white/10 dark:bg-slate-800 focus:ring-brand-primary/80 focus:border-brand-primary/80 font-bold dark:text-white"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Mô tả (Không bắt buộc)</label>
                <Textarea 
                  {...register('description')}
                  placeholder="Mô tả mục tiêu của workspace này..."
                  className="min-h-[120px] rounded-2xl border-slate-200 dark:border-white/10 dark:bg-slate-800 focus:ring-brand-primary/80 focus:border-brand-primary/80 font-medium resize-none dark:text-white"
                />
              </div>
            </CardContent>
            <CardFooter className="bg-slate-50/30 dark:bg-white/5 border-t border-slate-100 dark:border-white/5 p-6 flex justify-end">
              <Button 
                type="submit" 
                disabled={!isDirty || updateMutation.isPending}
                className="bg-brand-primary hover:bg-brand-primary/90 text-white font-black px-8 h-12 rounded-2xl shadow-lg shadow-brand-primary/20"
              >
                {updateMutation.isPending ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Lưu thay đổi
              </Button>
            </CardFooter>
          </form>
        </Card>

        {/* Personal Email Digest */}
        <Card className="bg-white dark:bg-slate-900/50 dark:backdrop-blur-xl border-slate-200/60 dark:border-white/10 shadow-xl shadow-slate-200/10 dark:shadow-none rounded-3xl overflow-hidden mb-8">
          <CardHeader className="bg-slate-50/50 dark:bg-white/5 border-b border-slate-100 dark:border-white/5 py-6">
            <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-900 dark:text-slate-100">
              <Mail className="w-5 h-5 text-brand-primary" />
              Thông báo Email cá nhân
            </CardTitle>
            <CardDescription className="text-slate-500 dark:text-slate-400">Nhận báo cáo tóm tắt công việc cá nhân gửi trực tiếp vào hòm thư của bạn.</CardDescription>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5 group transition-all hover:border-brand-primary/30">
              <div className="space-y-0.5">
                <Label className="text-sm font-bold text-slate-900 dark:text-slate-100">Báo cáo công việc cá nhân</Label>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Tóm tắt các task đến hạn, quá hạn và thông báo quan trọng dành riêng cho bạn.</p>
              </div>
              <div className="flex items-center gap-4">
                <Button 
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleTestEmail}
                  className="h-8 rounded-xl border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10 text-[10px] font-bold gap-2 px-3"
                >
                  <Send className="w-3 h-3 text-brand-primary" />
                  Gửi test ngay
                </Button>
                {/* Switch này dùng cấu hình profile cá nhân, tạm thời để hiển thị để user test gửi thủ công */}
                <span className="text-[10px] text-slate-400 font-medium italic">Luôn bật</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Integrations (Slack) */}
        <Card className="bg-white dark:bg-slate-900/50 dark:backdrop-blur-xl border-slate-200/60 dark:border-white/10 shadow-xl shadow-slate-200/10 dark:shadow-none rounded-3xl overflow-hidden">
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardHeader className="bg-slate-50/50 dark:bg-white/5 border-b border-slate-100 dark:border-white/5 py-6">
              <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-900 dark:text-slate-100">
                <Slack className="w-5 h-5 text-[#4A154B]" />
                Tích hợp Slack
              </CardTitle>
              <CardDescription className="text-slate-500 dark:text-slate-400">Kết nối TeamFlow với Slack để nhận thông báo về Newsfeed và trạng thái dự án.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Slack Webhook URL</label>
                <div className="relative">
                  <Input 
                    {...register('slackWebhookUrl')}
                    placeholder="https://hooks.slack.com/services/..."
                    className="h-12 rounded-xl border-slate-200 dark:border-white/10 dark:bg-slate-800 focus:ring-brand-primary/80 focus:border-brand-primary/80 font-mono text-xs dark:text-white pr-10"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Globe className="w-4 h-4 text-slate-300" />
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5 mt-2 group transition-all hover:border-brand-primary/30">
                <div className="space-y-0.5">
                  <Label htmlFor="daily-digest" className="text-sm font-bold text-slate-900 dark:text-slate-100 cursor-pointer">Thông báo tổng kết hàng ngày</Label>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Tự động gửi báo cáo sức khỏe dự án vào 8:00 AM mỗi ngày qua Slack.</p>
                </div>
                <div className="flex items-center gap-4">
                  <Button 
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleTestSlack}
                    className="h-8 rounded-xl border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10 text-[10px] font-bold gap-2 px-3"
                  >
                    <Zap className="w-3 h-3 text-amber-500" />
                    Gửi test ngay
                  </Button>
                  <Switch 
                    id="daily-digest"
                    checked={dailyDigestEnabled}
                    onCheckedChange={(checked: boolean) => setValue('dailyDigestEnabled', !!checked, { shouldDirty: true })}
                  />
                </div>
              </div>

              <div className="flex items-start gap-2 p-4 bg-amber-50/50 dark:bg-amber-950/10 rounded-xl border border-amber-100/50 dark:border-amber-900/20">
                <Info className="w-4 h-4 text-brand-primary mt-0.5" />
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Webhook URL cho phép TeamFlow gửi thông báo tự động vào một channel Slack cụ thể. 
                  Bạn có thể tạo mã này tại <a href="https://api.slack.com/apps" target="_blank" rel="noreferrer" className="text-brand-primary hover:underline inline-flex items-center gap-1">Slack Apps <ExternalLink className="w-3 h-3" /></a>
                </p>
              </div>
            </CardContent>
            <CardFooter className="bg-slate-50/30 dark:bg-white/5 border-t border-slate-100 dark:border-white/5 p-6 flex justify-end">
              <Button 
                type="submit" 
                disabled={!isDirty || updateMutation.isPending}
                className="bg-[#4A154B] hover:bg-[#3d113d] text-white font-black px-8 h-12 rounded-2xl shadow-lg shadow-purple-900/20"
              >
                {updateMutation.isPending ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Lưu cấu hình Slack
              </Button>
            </CardFooter>
          </form>
        </Card>

        {/* Invite Code Settings */}
        <Card className="bg-white dark:bg-slate-900/50 dark:backdrop-blur-xl border-slate-200/60 dark:border-white/10 shadow-xl shadow-slate-200/10 dark:shadow-none rounded-3xl overflow-hidden">
          <CardHeader className="bg-slate-50/50 dark:bg-white/5 border-b border-slate-100 dark:border-white/5 py-6">
            <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-900 dark:text-slate-100">
              <UserPlus className="w-5 h-5 text-emerald-600" />
              Mã mời Workspace
            </CardTitle>
            <CardDescription className="text-slate-500 dark:text-slate-400">Sử dụng mã này để mời thành viên khác vào không gian làm việc.</CardDescription>
          </CardHeader>
          <CardContent className="p-8 space-y-4">
            <div className="flex flex-col md:flex-row items-center gap-4">
              <div className="flex-1 w-full bg-slate-100 dark:bg-white/5 px-6 py-4 rounded-2xl border border-slate-200 dark:border-white/10 flex items-center justify-between group">
                <span className="text-2xl font-black tracking-[0.2em] text-slate-700 dark:text-slate-200">
                  {workspace?.inviteCode || '--------'}
                </span>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => copyToClipboard(workspace?.inviteCode || '')}
                  className="hover:bg-white dark:hover:bg-slate-800 text-slate-500 hover:text-brand-primary"
                >
                  {copied ? <Check className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5" />}
                </Button>
              </div>
              <Button 
                variant="outline"
                className="h-14 w-full md:w-auto px-6 rounded-2xl border-slate-200 dark:border-white/20 dark:hover:bg-white/5 gap-2 font-bold dark:text-white"
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
        <Card className="bg-white dark:bg-red-950/5 dark:backdrop-blur-xl border-red-100 dark:border-red-900/30 shadow-xl shadow-red-50/50 dark:shadow-none rounded-3xl overflow-hidden">
          <CardHeader className="bg-red-50/30 dark:bg-red-900/10 border-b border-red-50 dark:border-red-900/20 py-6">
            <CardTitle className="text-lg font-bold text-red-600 dark:text-red-500 flex items-center gap-2">
              <Trash2 className="w-5 h-5" />
              Khu vực nguy hiểm
            </CardTitle>
            <CardDescription className="text-red-500/80 dark:text-red-400/80">Các hành động này không thể hoàn tác. Hãy cẩn trọng.</CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 rounded-2xl bg-red-50/50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 border-dashed">
              <div className="space-y-1">
                <p className="font-bold text-red-900 dark:text-red-200">Xóa Workspace này</p>
                <p className="text-sm text-red-600/70 dark:text-red-400/70 font-medium">Bao gồm tất cả dự án, công việc và dữ liệu thành viên.</p>
              </div>
              <Button 
                variant="destructive" 
                onClick={() => {
                  if (window.confirm("BẠN CÓ CHẮC CHẮN MUỐN XÓA WORKSPACE NÀY? Toàn bộ dữ liệu sẽ mất vĩnh viễn.")) {
                    deleteMutation.mutate();
                  }
                }}
                className="font-black rounded-xl h-12 px-6 shadow-lg shadow-red-100 dark:shadow-none"
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
                Xác nhận xóa
              </Button>
            </div>
          </CardContent>
          <CardFooter className="bg-red-50/10 dark:bg-red-900/5 p-6 flex items-center gap-3">
             <Info className="w-4 h-4 text-red-400 dark:text-red-500 shrink-0" />
             <p className="text-[11px] font-bold text-red-400 dark:text-red-500 uppercase tracking-wider">Chỉ có chủ sở hữu và Admin mới nhìn thấy khu vực này.</p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
