import axios from "axios";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/auth.store";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
console.log("[FE-API] Base URL:", API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Biến cờ để tránh hiện nhiều toast cùng lúc khi nhiều request fail song song
let isAuthToastShown = false;

// Request interceptor: Chặn đứng các request có URL lỗi (chứa chuỗi "undefined")
api.interceptors.request.use(
  (config) => {
    if (config.url && (config.url.includes('/undefined') || config.url.endsWith('/undefined'))) {
      console.warn(`[API-GUARD] Chặn request lỗi: ${config.url}`);
      return Promise.reject(new Error(`Canceled malformed request: ${config.url}`));
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        const currentPath = window.location.pathname;
        
        // Không hiện toast nếu đang ở trang login để tránh gây phiền
        if (!currentPath.includes("/login") && !isAuthToastShown) {
          isAuthToastShown = true;
          toast.error("Phiên đăng nhập đã hết hạn", {
            description: "Vui lòng đăng nhập lại để tiếp tục làm việc.",
            duration: 5000,
            onAutoClose: () => { isAuthToastShown = false; },
            onDismiss: () => { isAuthToastShown = false; }
          });
        }
        
        // Xoá thông tin auth cục bộ qua store để trigger re-render đồng bộ
        useAuthStore.getState().logout();
      }
    }
    return Promise.reject(error);
  }
);

export default api;
