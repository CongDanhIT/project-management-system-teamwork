"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useParams, usePathname } from "next/navigation";
import { useAuthStore } from "@/stores/auth.store";
import { useCallStore } from "@/stores/useCallStore";

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});

export const useSocket = () => useContext(SocketContext);

/**
 * SocketProvider: Quản lý kết nối WebSocket và điều phối việc làm mới dữ liệu (Cache Invalidation)
 * khi nhận được tín hiệu từ Backend.
 */
export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const queryClient = useQueryClient();
  const params = useParams();
  const pathname = usePathname(); 
  const { user } = useAuthStore();
  
  // Trích xuất ID từ URL bằng Regex (vì useParams có thể trả về rỗng ở cấp độ Root Layout)
  // Pattern: /workspace/:workspaceId/projects/:projectId
  const workspaceId = (params?.workspaceId as string) || pathname?.match(/\/workspace\/([^\/]+)/)?.[1];
  const projectId = (params?.projectId as string) || pathname?.match(/\/projects\/([^\/]+)/)?.[1];
  
  // Chuẩn hóa Socket URL: Lấy từ biến môi trường hoặc mặc định localhost:8000
  // Nếu URL có /api ở cuối thì cắt bỏ để trỏ về root (nơi Socket.io lắng nghe)
  const getSocketUrl = () => {
    if (typeof window !== "undefined") {
      const hostname = window.location.hostname;
      const protocol = window.location.protocol;
      // Nếu đang chạy local, ưu tiên dùng hostname hiện tại để khớp CORS
      if (hostname === "localhost" || hostname === "127.0.0.1") {
        return `${protocol}//${hostname}:8000`;
      }
    }
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    return apiUrl.replace(/\/api$/, "").replace(/\/$/, "");
  };

  const socketUrl = getSocketUrl();

  // --- QUẢN LÝ KẾT NỐI SOCKET ---
  useEffect(() => {
    console.log("[Socket] Initializing connection to:", socketUrl);
    
    const socketInstance = io(socketUrl, {
      withCredentials: true,
      transports: ["websocket"], // Ép sử dụng websocket để tránh lỗi polling (xhr poll error)
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 3000,
      timeout: 10000,
    });

    socketInstance.on("connect", () => {
      console.log("[Socket] Connected successfully with ID:", socketInstance.id);
      setIsConnected(true);
    });

    socketInstance.on("connect_error", (error) => {
      console.error("[Socket] Connection Error:", error.message);
      if ((error as any).description) {
        console.error("[Socket] Error Description:", (error as any).description);
      }
      if ((error as any).context) {
        console.error("[Socket] Error Context:", (error as any).context);
      }
    });

    socketInstance.on("disconnect", () => {
      console.log("[Socket] Disconnected from server");
      setIsConnected(false);
    });

    // --- LẮNG NGHE TÍN HIỆU THAY ĐỔI TASK ---
    socketInstance.on("task:created", (data) => {
      console.log("[Socket] Signal: Task Created", data);
      toast.info(`${data.userName} vừa tạo task: "${data.taskTitle}" tại dự án "${data.projectName}"`);
      
      queryClient.invalidateQueries({ queryKey: ["project-tasks", data.workspaceId, data.projectId] });
      queryClient.invalidateQueries({ queryKey: ["project-root-tasks", data.workspaceId, data.projectId] });
      queryClient.invalidateQueries({ queryKey: ["project-all-subtasks", data.workspaceId, data.projectId] });
      queryClient.invalidateQueries({ queryKey: ["workspace-tasks", data.workspaceId] });
    });

    // 2. Task Updated
    socketInstance.on("task:updated", (data) => {
      console.log("[Socket] Signal: Task Updated", data);
      toast.info(`${data.userName} vừa cập nhật task: "${data.taskTitle}" tại dự án "${data.projectName}"`);
      
      queryClient.invalidateQueries({ queryKey: ["project-tasks", data.workspaceId, data.projectId] });
      queryClient.invalidateQueries({ queryKey: ["project-root-tasks", data.workspaceId, data.projectId] });
      queryClient.invalidateQueries({ queryKey: ["project-all-subtasks", data.workspaceId, data.projectId] });
      queryClient.invalidateQueries({ queryKey: ["task", data.taskId] });
    });

    socketInstance.on("task:deleted", (data) => {
      console.log("[Socket] Signal: Task Deleted", data);
      toast.warning(`${data.userName} vừa xóa task: "${data.taskTitle}" tại dự án "${data.projectName}"`);
      
      queryClient.invalidateQueries({ queryKey: ["project-tasks", data.workspaceId, data.projectId] });
      queryClient.invalidateQueries({ queryKey: ["project-root-tasks", data.workspaceId, data.projectId] });
      queryClient.invalidateQueries({ queryKey: ["project-all-subtasks", data.workspaceId, data.projectId] });
    });

    // --- LẮNG NGHE NEWSFEED ---
    socketInstance.on("newsfeed:new", (data) => {
       console.log("[Socket] Signal: New Newsfeed Post", data);
       toast.info("Có bản tin mới trong Newsfeed!");
       queryClient.invalidateQueries({ queryKey: ["announcements", data.workspaceId] });
    });

    socketInstance.on("newsfeed:updated", (data) => {
       console.log("[Socket] Signal: Newsfeed Updated", data);
       queryClient.invalidateQueries({ queryKey: ["announcements", data.workspaceId] });
    });

    socketInstance.on("newsfeed:deleted", (data) => {
       console.log("[Socket] Signal: Newsfeed Deleted", data);
       queryClient.invalidateQueries({ queryKey: ["announcements", data.workspaceId] });
    });

    socketInstance.on("newsfeed:pinned", (data) => {
       console.log("[Socket] Signal: Newsfeed Pinned", data);
       queryClient.invalidateQueries({ queryKey: ["announcements", data.workspaceId] });
    });

    socketInstance.on("newsfeed:interaction", (data) => {
       console.log("[Socket] Signal: Newsfeed Interaction (Comment/Reaction)", data);
       // Invalidate announcements query to update comments/reactions in real-time
       queryClient.invalidateQueries({ queryKey: ["announcements", data.workspaceId] });
    });

    // --- SPRINT 3: Real-time Comments & Notifications ---

    // 5. New Comment Added
    socketInstance.on("comment:new", (data) => {
      console.log("[Socket] Signal: New Comment Added", data);
      // Invalidate comments query để UI cập nhật ngay lập tức
      queryClient.invalidateQueries({ queryKey: ["task-comments", data.taskId] });
    });

    // 5.1 Comment Deleted
    socketInstance.on("comment:deleted", (data) => {
      console.log("[Socket] Signal: Comment Deleted", data);
      queryClient.invalidateQueries({ queryKey: ["task-comments", data.taskId] });
    });

    // 5.2 Comment Reaction Updated
    socketInstance.on("comment:reaction_updated", (data) => {
      console.log("[Socket] Signal: Comment Reaction Updated", data);
      queryClient.invalidateQueries({ queryKey: ["task-comments", data.taskId] });
    });

    // 6. New Notification Received (Chuông báo)
    socketInstance.on("notification:new", (data) => {
      console.log("[Socket] Signal: New Notification Received", data);
      toast.info(`🔔 ${data.title}: ${data.message}`, {
        duration: 5000,
      });
      // Invalidate notifications query
      queryClient.invalidateQueries({ queryKey: ["notifications", data.workspaceId] });
    });

    // --- SPRINT 4: Video Call ---
    socketInstance.on("call-started", (data) => {
      console.log("[Socket] Signal: Call Started", data);
      const currentUser = useAuthStore.getState().user;
      if (data.startedBy?._id !== currentUser?.id) {
         toast.info(`📞 Có cuộc gọi video nhóm từ ${data.startedBy?.name}. Hãy tham gia!`, {
            duration: 10000,
            action: {
              label: 'Tham gia',
              onClick: () => {
                useCallStore.getState().startCall(data.roomName, data);
              }
            }
         });
      }
    });

    socketInstance.on("call-ended", () => {
      console.log("[Socket] Signal: Call Ended");
      useCallStore.getState().endCall();
    });

    setSocket(socketInstance);

    return () => {
      console.log("[Socket] Cleaning up connection...");
      socketInstance.disconnect();
    };
  }, [socketUrl, queryClient]); // Tháo bỏ phụ thuộc params để tránh reconnect liên tục

  // --- QUẢN LÝ GIA NHẬP & RỜI PHÒNG (Dựa trên URL) ---
  useEffect(() => {
    if (!socket || !isConnected) return;

    const currentWorkspaceId = workspaceId;
    const currentProjectId = projectId;
    const currentUserId = user?.id;

    // 1. Gia nhập các phòng mới
    if (currentWorkspaceId) {
      console.log("[Socket] Joining Workspace Room:", currentWorkspaceId);
      socket.emit("join-room", currentWorkspaceId);
    }

    if (currentProjectId) {
      console.log("[Socket] Joining Project Room:", currentProjectId);
      socket.emit("join-room", currentProjectId);
    }

    if (currentUserId) {
      console.log("[Socket] Joining Personal Room:", currentUserId);
      socket.emit("join-room", currentUserId);
    }

    // 2. Logic dọn dẹp: Tự động thoát phòng khi URL thay đổi hoặc rời trang
    return () => {
      if (currentWorkspaceId) {
        console.log("[Socket] Leaving Workspace Room:", currentWorkspaceId);
        socket.emit("leave-room", currentWorkspaceId);
      }
      if (currentProjectId) {
        console.log("[Socket] Leaving Project Room:", currentProjectId);
        socket.emit("leave-room", currentProjectId);
      }
      // Lưu ý: Không thoát Personal Room để luôn nhận được thông báo quan trọng
    };
  }, [socket, isConnected, workspaceId, projectId, user?.id]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};
