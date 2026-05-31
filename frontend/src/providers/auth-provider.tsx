"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/stores/auth.store";
import { authService } from "@/services/auth.service";
import { Loader2 } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";

// Delay helper để retry khi backend chưa sẵn sàng
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { setAuth, logout, setInitializing: setGlobalInitializing } = useAuthStore();
  const [isInitializing, setIsInitializing] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Đảm bảo router đã sẵn sàng
  useEffect(() => {
    setMounted(true);
  }, []);

  // Danh sách các route công khai không cần redirect về login
  const PUBLIC_ROUTES = ['/login', '/register', '/'];

  useEffect(() => {
    if (!mounted) return;

    const initAuth = async () => {
      try {
        const response = await authService.getCurrentUser();

        if (response.success && response.user) {
          setAuth(response.user);
        } else {
          handleAuthFailure();
        }
      } catch (error: any) {
        const status = error.response?.status;

        if (status === 401) {
          handleAuthFailure();
        } else if (!error.response) {
          // Network Error...
          console.warn("[AuthProvider] Network unavailable, retrying in 1.5s...");
          await delay(1500);
          try {
            const retryResponse = await authService.getCurrentUser();
            if (retryResponse.success && retryResponse.user) {
              setAuth(retryResponse.user);
            } else {
              handleAuthFailure();
            }
          } catch (retryError: any) {
            handleAuthFailure();
          }
        } else {
          handleAuthFailure();
        }
      } finally {
        setIsInitializing(false);
        setGlobalInitializing(false);
      }
    };

    const handleAuthFailure = () => {
      logout();
      if (!pathname) return;
      // Chỉ redirect nếu không phải là route công khai
      const isPublic = PUBLIC_ROUTES.some(route => pathname === route || pathname.startsWith(route + '/'));
      if (!isPublic) {
        // Lưu lại trang hiện tại để redirect sau khi login
        router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
      }
    };

    initAuth();
  }, [setAuth, logout, setGlobalInitializing, router, pathname, mounted]);

  if (isInitializing) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-white dark:bg-slate-950">
        <Loader2 className="h-10 w-10 animate-spin text-brand-primary mb-4" />
        <p className="text-sm font-medium text-slate-500 animate-pulse">
          Đang chuẩn bị không gian làm việc...
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
