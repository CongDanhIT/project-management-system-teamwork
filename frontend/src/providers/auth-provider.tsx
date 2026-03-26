"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/stores/auth.store";
import { authService } from "@/services/auth.service";
import { Loader2 } from "lucide-react";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setAuth, logout } = useAuthStore();
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        // Luôn cố gắng đồng bộ với session từ backend khi app load
        const response = await authService.getCurrentUser();

        if (response.success && response.user) {
          // Lưu vào Zustand
          setAuth(response.user);
        } else {
          // Không có session hợp lệ
          logout();
        }
      } catch (error: any) {
        // Nếu lỗi 401 (Unauthorized), đơn giản là người dùng chưa đăng nhập, không cần báo lỗi đỏ
        if (error.response?.status === 401) {
          logout();
        } else {
          console.error("Auth sync error:", error);
          logout();
        }
      } finally {
        setIsInitializing(false);
      }
    };

    initAuth();
  }, [setAuth, logout]);

  if (isInitializing) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-white dark:bg-slate-950">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-600 mb-4" />
        <p className="text-sm font-medium text-slate-500 animate-pulse">
          Đang chuẩn bị không gian làm việc...
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
