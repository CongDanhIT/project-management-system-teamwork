'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    // Sử dụng một hàm async bên trong để kiểm soát luồng điều hướng mượt hơn
    const redirect = async () => {
      if (!isAuthenticated) {
        router.replace('/login');
        return;
      }

      // Đã đăng nhập, đợi một nhịp để đảm bảo dữ liệu user đã được nạp đầy đủ (nếu cần)
      if (user) {
        if (user.currentWorkspaceId) {
          router.replace(`/workspace/${user.currentWorkspaceId}`);
        } else {
          router.replace('/onboarding');
        }
      }
    };

    redirect();
  }, [isAuthenticated, user, router]);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        <p className="text-sm font-medium text-slate-500">Đang chuyển hướng...</p>
      </div>
    </div>
  );
}
