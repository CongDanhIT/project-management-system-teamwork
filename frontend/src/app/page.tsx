'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { Loader2 } from 'lucide-react';
import Loader from "@/components/ui/Loader";

export default function Home() {
  const router = useRouter();
  const { user, isAuthenticated, isInitializing } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Nếu chưa mount hoặc đang trong quá trình khởi tạo, đừng làm gì cả
    if (!mounted || isInitializing) return;

    const redirect = async () => {
      if (!isAuthenticated) {
        router.replace('/login');
        return;
      }

      if (user) {
        if (user.currentWorkspaceId) {
          router.replace(`/workspace/${user.currentWorkspaceId}`);
        } else {
          router.replace('/onboarding');
        }
      }
    };

    redirect();
  }, [isAuthenticated, user, router, isInitializing, mounted]);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-4">
        <Loader size="lg" />
        <p className="text-sm font-medium text-slate-500 animate-pulse">Đang chuẩn bị không gian làm việc của bạn...</p>
      </div>
    </div>
  );
}
