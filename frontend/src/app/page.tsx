'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { Loader2 } from 'lucide-react';
import Loader from "@/components/ui/Loader";

import LandingPage from '@/components/landing/LandingPage';

export default function Home() {
  const router = useRouter();
  const { user, isAuthenticated, isInitializing } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Chỉ thực hiện chuyển hướng nếu đã mount, không còn initializing và đã login
    if (!mounted || isInitializing || !isAuthenticated) return;

    if (user) {
      if (user.currentWorkspaceId) {
        router.replace(`/workspace/${user.currentWorkspaceId}`);
      } else {
        router.replace('/onboarding');
      }
    }
  }, [isAuthenticated, user, router, isInitializing, mounted]);

  // Trong khi chờ đợi (khởi tạo, chưa mount, hoặc đang chuẩn bị chuyển hướng)
  if (!mounted || isInitializing || isAuthenticated) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <Loader size="lg" />
          <p className="text-sm font-medium text-slate-500 animate-pulse">Đang chuẩn bị không gian làm việc của bạn...</p>
        </div>
      </div>
    );
  }

  // Nếu không đăng nhập, hiển thị Landing Page
  return <LandingPage />;
}
