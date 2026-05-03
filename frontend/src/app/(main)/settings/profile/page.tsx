'use client';

import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authService } from '@/services/auth.service';
import { userService } from '@/services/user.service';
import { 
  User, 
  Mail, 
  Camera, 
  Save, 
  Loader2,
  Sparkles,
  Bell,
  Copy,
  RefreshCcw,
  Info
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { useAuthStore } from '@/stores/auth.store';

interface ProfileForm {
  name: string;
  profilePicture: string;
  slackUserId: string;
}

export default function ProfilePage() {
  const queryClient = useQueryClient();
  const { user, updateUser } = useAuthStore();
  const [isCopied, setIsCopied] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const emailAddress = `task+${user?.inboxToken || 'undefined'}@inbox.thitranboduong.id.vn`;

  const { register, handleSubmit, reset, watch, setValue, formState: { isDirty } } = useForm<ProfileForm>({
    defaultValues: {
      name: user?.name || '',
      profilePicture: user?.avatar || '',
      slackUserId: user?.slackUserId || '',
    }
  });

  const profilePictureUrl = watch('profilePicture') || undefined;

  useEffect(() => {
    if (user) {
      reset({
        name: user.name || '',
        profilePicture: user.avatar || '',
        slackUserId: user.slackUserId || '',
      });
    }
  }, [user, reset]);

  // Logic cập nhật Preferences (Daily Digest)
  const updatePrefMutation = useMutation({
    mutationFn: (checked: boolean) => userService.updatePreferences({ receiveDailyDigest: checked }),
    onSuccess: (response) => {
      const updatedUser = response.user;
      if (updatedUser) {
        // Đồng bộ vào Global Store
        updateUser({
          preferences: updatedUser.preferences
        });
      }
      toast.success("Đã cập nhật cài đặt thông báo");
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
    },
    onError: () => toast.error("Không thể cập nhật cài đặt thông báo")
  });

  // Logic Reset Inbox Token
  const resetTokenMutation = useMutation({
    mutationFn: () => userService.resetInboxToken(),
    onSuccess: (response) => {
      const updatedUser = response.user;
      if (updatedUser) {
        updateUser({
           inboxToken: updatedUser.inboxToken
        });
      }
      toast.success("Đã làm mới mã hòm thư cá nhân");
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
    },
    onError: () => toast.error("Không thể làm mới mã hòm thư")
  });

  const updateMutation = useMutation({
    mutationFn: (data: ProfileForm) => userService.updateProfile(data),
    onSuccess: (response) => {
      // API backend trả về { success: true, user: { ... } }
      const updatedUser = response.user || response.data;
      
      // Update local store
      updateUser({
        name: updatedUser.name,
        avatar: updatedUser.profilePicture || updatedUser.avatar
      });

      queryClient.invalidateQueries({ queryKey: ['current-user'] });
      toast.success("Đã cập nhật hồ sơ cá nhân");
    },
    onError: () => toast.error("Lỗi khi cập nhật hồ sơ")
  });

  const onSubmit = (data: ProfileForm) => {
    updateMutation.mutate(data);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Ảnh quá lớn! Vui lòng chọn ảnh dưới 2MB.");
      return;
    }

    try {
      setIsUploading(true);
      const loadingToast = toast.loading("Đang tải ảnh lên...");
      
      const { url } = await userService.uploadAvatar(file);
      
      setValue('profilePicture', url, { shouldDirty: true });
      toast.dismiss(loadingToast);
      toast.success("Tải ảnh lên thành công! Hãy nhấn Lưu hồ sơ để cập nhật.");
    } catch (error) {
      toast.error("Lỗi khi tải ảnh lên Cloudinary");
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Hồ sơ cá nhân</h1>
        <p className="text-slate-500 font-medium">Quản lý cách bạn xuất hiện trên TeamFlow.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Profile Info Form */}
          <Card className="border-slate-200/60 shadow-xl shadow-slate-200/10 rounded-3xl overflow-hidden">
            <form onSubmit={handleSubmit(onSubmit)}>
              <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-6">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <User className="w-5 h-5 text-brand-primary" />
                  Thông tin tài khoản
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="flex flex-col sm:flex-row items-center gap-8 mb-4">
                  <div 
                    className="relative group cursor-pointer"
                    onClick={() => !isUploading && fileInputRef.current?.click()}
                  >
                     <UserAvatar 
                        name={user?.name} 
                        image={profilePictureUrl}
                        size="xl"
                        showShadow={false}
                        className="w-24 h-24 rounded-3xl border-4 border-white shadow-xl ring-1 ring-slate-100"
                     />
                     <div className="absolute inset-0 bg-black/40 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        {isUploading ? <Loader2 className="text-white w-6 h-6 animate-spin" /> : <Camera className="text-white w-6 h-6" />}
                     </div>
                     <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept="image/*"
                        onChange={handleFileChange}
                        disabled={isUploading}
                     />
                  </div>
                  <div className="space-y-1 text-center sm:text-left">
                     <h3 className="font-bold text-slate-900">Ảnh đại diện</h3>
                     <p className="text-xs text-slate-500 font-medium max-w-xs">Chúng tôi hỗ trợ định dạng PNG, JPG. Dung lượng tối đa 2MB.</p>
                     <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        className="mt-2 text-[10px] h-7 rounded-lg border-brand-primary/10 text-brand-primary hover:bg-brand-primary/10 font-bold"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                     >
                        CHỌN ẢNH TỪ MÁY
                     </Button>
                  </div>
                </div>

                <div className="grid gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Họ và tên</label>
                    <Input 
                      {...register('name', { required: true })}
                      className="h-12 rounded-xl border-slate-200 focus:ring-brand-primary/80 focus:border-brand-primary/80 font-bold"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Email (Không thể thay đổi)</label>
                    <div className="relative">
                      <Input 
                        value={user?.email}
                        disabled
                        className="h-12 rounded-xl bg-slate-50 border-slate-200 font-medium pl-10 cursor-not-allowed"
                      />
                      <Mail className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">URL Ảnh đại diện</label>
                    <Input 
                      {...register('profilePicture')}
                      placeholder="https://..."
                      className="h-12 rounded-xl border-slate-200 focus:ring-brand-primary/80 focus:border-brand-primary/80 font-medium"
                    />
                    <p className="text-[10px] text-slate-400 italic ml-1">* Bạn có thể dán link trực tiếp hoặc chọn ảnh từ máy ở trên.</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Slack User ID</label>
                    <Input 
                      {...register('slackUserId')}
                      placeholder="Ví dụ: U0123456789"
                      className="h-12 rounded-xl border-slate-200 focus:ring-brand-primary/80 focus:border-brand-primary/80 font-mono"
                    />
                    <p className="text-[10px] text-slate-400 italic ml-1">* Lấy ID này trong mục Profile trên Slack của bạn để đồng bộ công việc.</p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-slate-50/30 border-t border-slate-100 p-6 flex justify-end">
                <Button 
                  type="submit" 
                  disabled={!isDirty || updateMutation.isPending || isUploading}
                  className="bg-brand-primary hover:bg-brand-primary/90 text-white font-black px-8 h-12 rounded-2xl shadow-lg shadow-brand-primary/20"
                >
                  {(updateMutation.isPending || isUploading) ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  Lưu hồ sơ
                </Button>
              </CardFooter>
            </form>
          </Card>

          {/* Notifications Settings */}
          <Card className="border-slate-200/60 shadow-xl shadow-slate-200/10 rounded-3xl overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-6">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Bell className="w-5 h-5 text-brand-primary" />
                Cài đặt thông báo
              </CardTitle>
              <CardDescription className="font-medium">
                Kiểm soát cách bạn nhận thông báo từ hệ thống.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <div className="flex items-start gap-4 p-4 rounded-2xl border border-slate-100 hover:border-brand-primary/20 transition-colors bg-slate-50/30">
                <div className="mt-1">
                  <Checkbox 
                    id="daily-digest" 
                    checked={user?.preferences?.receiveDailyDigest ?? true}
                    onCheckedChange={(checked) => {
                      updatePrefMutation.mutate(!!checked);
                    }}
                    disabled={updatePrefMutation.isPending}
                    className="w-5 h-5 rounded-md border-slate-300 data-[state=checked]:bg-brand-primary data-[state=checked]:border-brand-primary"
                  />
                </div>
                <div className="grid gap-1.5 leading-none">
                  <label
                    htmlFor="daily-digest"
                    className="text-sm font-bold text-slate-900 leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    Nhận email tóm tắt hàng ngày (Daily Digest)
                  </label>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    Hệ thống sẽ gửi email báo cáo công việc vào lúc 8:00 sáng hàng ngày (GMT+7) để bạn nắm bắt kế hoạch trong ngày.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Universal Inbox Settings */}
          <Card className="border-slate-200/60 shadow-xl shadow-slate-200/10 rounded-3xl overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-6">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Mail className="w-5 h-5 text-brand-primary" />
                Hòm thư cá nhân (Inbox-to-Task)
              </CardTitle>
              <CardDescription className="font-medium">
                Gửi email đến địa chỉ này để tự động tạo công việc nháp trong Inbox của bạn.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="bg-brand-primary/5 border border-brand-primary/10 rounded-2xl p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-brand-primary uppercase tracking-widest ml-1">ĐỊA CHỈ EMAIL CÁ NHÂN</label>
                  <div className="flex gap-2">
                    <div className="flex-1 bg-white border border-brand-primary/20 rounded-xl px-4 py-3 font-mono text-sm font-bold text-slate-700 truncate">
                       task+{user?.inboxToken || '********'}@inbox.thitranboduong.id.vn
                    </div>
                    <Button 
                      type="button"
                      variant="outline" 
                      size="icon"
                      className="rounded-xl border-brand-primary/20 text-brand-primary hover:bg-brand-primary/10 h-[46px] w-[46px]"
                      onClick={() => {
                        const email = `task+${user?.inboxToken}@inbox.thitranboduong.id.vn`;
                        navigator.clipboard.writeText(email);
                        toast.success("Đã sao chép địa chỉ email");
                      }}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 text-xs text-slate-500 font-medium bg-white/50 p-3 rounded-xl border border-slate-100">
                  <Info className="w-4 h-4 text-brand-primary shrink-0 mt-0.5" />
                  <p>Tiêu đề email sẽ là tên Task, nội dung email sẽ là phần mô tả. Task sẽ được lưu ở trạng thái Bản nháp trong Inbox.</p>
                </div>

                <div className="pt-2 flex justify-between items-center">
                  <p className="text-[10px] text-slate-400 font-bold italic">* Bạn nên giữ bí mật mã định danh này.</p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={resetTokenMutation.isPending}
                    onClick={() => {
                      if (confirm("Bạn có chắc chắn muốn làm mới mã hòm thư? Địa chỉ cũ sẽ không còn hoạt động.")) {
                        resetTokenMutation.mutate();
                      }
                    }}
                    className="text-red-500 hover:text-red-600 hover:bg-red-50 text-[10px] font-black h-8"
                  >
                    {resetTokenMutation.isPending ? <Loader2 className="w-3 h-3 mr-2 animate-spin" /> : <RefreshCcw className="w-3 h-3 mr-2" />}
                    LÀM MỚI MÃ
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar help / Promo */}
        <div className="space-y-6">
           <Card className="border-brand-primary/10 bg-gradient-to-br from-brand-primary/10/50 to-white overflow-hidden rounded-3xl p-6">
              <div className="flex items-center gap-2 mb-4">
                 <div className="w-8 h-8 rounded-xl bg-brand-primary/20 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-brand-primary" />
                 </div>
                 <h4 className="font-bold text-slate-900">Mẹo thiết kế</h4>
              </div>
              <p className="text-sm text-slate-600 font-medium mb-4 leading-relaxed">
                 Sử dụng ảnh đại diện rõ nét sẽ giúp đồng đội dễ dàng nhận diện bạn trong các cuộc thảo luận và phân công dự án.
              </p>
              <div className="p-3 bg-white rounded-xl border border-brand-primary/10 text-[10px] font-bold text-brand-primary/80 uppercase tracking-widest">
                 CHẾ ĐỘ CHUYÊN NGHIỆP
              </div>
           </Card>
        </div>
      </div>
    </div>
  );
}
