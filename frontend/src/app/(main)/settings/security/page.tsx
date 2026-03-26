'use client';

import React from 'react';
import { useMutation } from '@tanstack/react-query';
import { userService, ChangePasswordData } from '@/services/user.service';
import { 
  KeyRound, 
  Lock, 
  Eye, 
  EyeOff,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { cn } from '@/lib/utils';

export default function SecurityPage() {
  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm<ChangePasswordData>();
  const [showCurrent, setShowCurrent] = React.useState(false);
  const [showNew, setShowNew] = React.useState(false);

  const mutation = useMutation({
    mutationFn: (data: ChangePasswordData) => userService.changePassword(data),
    onSuccess: () => {
      toast.success("Mật khẩu đã được thay đổi");
      reset();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Lỗi khi đổi mật khẩu");
    }
  });

  const onSubmit = (data: ChangePasswordData) => {
    mutation.mutate(data);
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Bảo mật tài khoản</h1>
        <p className="text-slate-500 font-medium">Cập nhật mật khẩu và bảo vệ quyền truy cập của bạn.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 border-slate-200/60 shadow-xl shadow-slate-200/10 rounded-3xl overflow-hidden">
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-6">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-indigo-600" />
                Thay đổi mật khẩu
              </CardTitle>
              <CardDescription>Chúng tôi khuyên bạn nên sử dụng mật khẩu mạnh mà bạn chưa sử dụng ở nơi khác.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Mật khẩu hiện tại</label>
                <div className="relative">
                  <Input 
                    type={showCurrent ? "text" : "password"}
                    {...register('currentPassword', { required: "Vui lòng nhập mật khẩu hiện tại" })}
                    className="h-12 rounded-xl border-slate-200 focus:ring-indigo-500 focus:border-indigo-500 font-bold pl-10"
                  />
                  <Lock className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
                  >
                    {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
                {errors.currentPassword && <p className="text-xs text-red-500 font-bold ml-1">{errors.currentPassword.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Mật khẩu mới</label>
                <div className="relative">
                  <Input 
                    type={showNew ? "text" : "password"}
                    {...register('newPassword', { 
                        required: "Vui lòng nhập mật khẩu mới",
                        minLength: { value: 6, message: "Mật khẩu phải có ít nhất 6 ký tự" }
                    })}
                    className="h-12 rounded-xl border-slate-200 focus:ring-indigo-500 focus:border-indigo-500 font-bold pl-10"
                  />
                  <Lock className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
                  >
                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
                {errors.newPassword && <p className="text-xs text-red-500 font-bold ml-1">{errors.newPassword.message}</p>}
              </div>
            </CardContent>
            <CardFooter className="bg-slate-50/30 border-t border-slate-100 p-6 flex justify-end">
              <Button 
                type="submit" 
                disabled={!isDirty || mutation.isPending}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-black px-8 h-12 rounded-2xl shadow-lg shadow-indigo-200"
              >
                {mutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Cập nhật mật khẩu
              </Button>
            </CardFooter>
          </form>
        </Card>

        <div className="space-y-6">
           <Card className="border-indigo-100 bg-indigo-50/30 overflow-hidden rounded-3xl p-6">
              <div className="flex items-center gap-2 mb-4">
                 <ShieldCheck className="w-5 h-5 text-indigo-600" />
                 <h4 className="font-bold text-slate-900">Bảo mật tài khoản</h4>
              </div>
              <ul className="space-y-3">
                 {[
                   "Sử dụng ít nhất 8 ký tự",
                   "Kết hợp chữ hoa và chữ thường",
                   "Thêm số và ký tự đặc biệt",
                   "Không sử dụng thông tin cá nhân"
                 ].map((tip, i) => (
                   <li key={i} className="flex items-center gap-2 text-xs font-bold text-slate-600 uppercase tracking-tight">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-400"></div>
                      {tip}
                   </li>
                 ))}
              </ul>
           </Card>

           <div className="p-6 rounded-3xl bg-amber-50 border border-amber-100 flex gap-3">
              <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
              <div className="space-y-1">
                 <p className="text-sm font-bold text-amber-900 leading-tight">Lưu ý bảo trì</p>
                 <p className="text-[11px] font-medium text-amber-600 leading-relaxed uppercase tracking-tight">Việc đổi mật khẩu sẽ yêu cầu bạn đăng nhập lại trên tất cả các thiết bị.</p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}

function Loader2(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}
