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
  Sparkles
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { useAuthStore } from '@/stores/auth.store';

interface ProfileForm {
  name: string;
  profilePicture: string;
}

export default function ProfilePage() {
  const queryClient = useQueryClient();
  const { user, updateUser } = useAuthStore();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const { register, handleSubmit, reset, watch, setValue, formState: { isDirty } } = useForm<ProfileForm>({
    defaultValues: {
      name: user?.name || '',
      profilePicture: user?.avatar || '',
    }
  });

  const profilePictureUrl = watch('profilePicture') || undefined;

  useEffect(() => {
    if (user) {
      reset({
        name: user.name || '',
        profilePicture: user.avatar || '',
      });
    }
  }, [user, reset]);

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
        {/* Profile Info Form */}
        <Card className="lg:col-span-2 border-slate-200/60 shadow-xl shadow-slate-200/10 rounded-3xl overflow-hidden">
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-6">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <User className="w-5 h-5 text-indigo-600" />
                Thông tin tài khoản
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="flex flex-col sm:flex-row items-center gap-8 mb-4">
                <div 
                  className="relative group cursor-pointer"
                  onClick={() => !isUploading && fileInputRef.current?.click()}
                >
                   <Avatar className="w-24 h-24 rounded-3xl border-4 border-white shadow-xl ring-1 ring-slate-100">
                     <AvatarImage src={profilePictureUrl} />
                     <AvatarFallback className="bg-indigo-50 text-indigo-600 text-3xl font-black">
                        {user?.name?.[0].toUpperCase()}
                     </AvatarFallback>
                   </Avatar>
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
                      className="mt-2 text-[10px] h-7 rounded-lg border-indigo-100 text-indigo-600 hover:bg-indigo-50 font-bold"
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
                    className="h-12 rounded-xl border-slate-200 focus:ring-indigo-500 focus:border-indigo-500 font-bold"
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
                    className="h-12 rounded-xl border-slate-200 focus:ring-indigo-500 focus:border-indigo-500 font-medium"
                  />
                  <p className="text-[10px] text-slate-400 italic ml-1">* Bạn có thể dán link trực tiếp hoặc chọn ảnh từ máy ở trên.</p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="bg-slate-50/30 border-t border-slate-100 p-6 flex justify-end">
              <Button 
                type="submit" 
                disabled={!isDirty || updateMutation.isPending || isUploading}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-black px-8 h-12 rounded-2xl shadow-lg shadow-indigo-200"
              >
                {(updateMutation.isPending || isUploading) ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Lưu hồ sơ
              </Button>
            </CardFooter>
          </form>
        </Card>

        {/* Sidebar help / Promo */}
        <div className="space-y-6">
           <Card className="border-indigo-100 bg-gradient-to-br from-indigo-50/50 to-white overflow-hidden rounded-3xl p-6">
              <div className="flex items-center gap-2 mb-4">
                 <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                 </div>
                 <h4 className="font-bold text-slate-900">Mẹo thiết kế</h4>
              </div>
              <p className="text-sm text-slate-600 font-medium mb-4 leading-relaxed">
                 Sử dụng ảnh đại diện rõ nét sẽ giúp đồng đội dễ dàng nhận diện bạn trong các cuộc thảo luận và phân công dự án.
              </p>
              <div className="p-3 bg-white rounded-xl border border-indigo-100 text-[10px] font-bold text-indigo-500 uppercase tracking-widest">
                 CHẾ ĐỘ CHUYÊN NGHIỆP
              </div>
           </Card>
        </div>
      </div>
    </div>
  );
}
