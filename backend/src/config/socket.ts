import { Server } from "socket.io";
import { Server as HttpServer } from "http";
import logger from "../utils/logger";
import eventDispatcher, { EVENTS } from "../utils/eventDispatcher";

import { env } from "./env";

let io: Server;

export const initSocket = (server: HttpServer) => {
    io = new Server(server, {
        cors: {
            origin: [env.FRONTEND_ORIGIN, "http://localhost:3000", "http://127.0.0.1:3000", "http://[::1]:3000", "http://localhost:3001"],
            methods: ["GET", "POST"],
            credentials: true
        },
        transports: ["polling", "websocket"]
    });

    io.on("connection", (socket) => {
        logger.info(`[Socket] Client connected: ${socket.id}`);

        // Người dùng tham gia vào room của Workspace/Project để nhận thông báo phân vùng
        socket.on("join-room", (roomId: string) => {
            socket.join(roomId);
            logger.debug(`[Socket] Client ${socket.id} joined room: ${roomId}`);
        });

        socket.on("leave-room", (roomId: string) => {
            socket.leave(roomId);
            logger.debug(`[Socket] Client ${socket.id} left room: ${roomId}`);
        });

        socket.on("disconnect", () => {
            logger.info(`[Socket] Client disconnected: ${socket.id}`);
        });
    });

    // --- Đăng ký lắng nghe các sự kiện từ EventDispatcher để broadcast ---

    // Sự kiện liên quan đến Task
    eventDispatcher.on(EVENTS.TASK.CREATED, (data) => broadcastToProject(data.projectId, "task:created", data));
    eventDispatcher.on(EVENTS.TASK.UPDATED, (data) => broadcastToProject(data.projectId, "task:updated", data));
    eventDispatcher.on(EVENTS.TASK.DELETED, (data) => broadcastToProject(data.projectId, "task:deleted", data));
    eventDispatcher.on(EVENTS.TASK.MOVED, (data) => broadcastToProject(data.projectId, "task:moved", data));

    // Sự kiện liên quan đến Newsfeed
    eventDispatcher.on(EVENTS.ANNOUNCEMENT.CREATED, (data) => {
        if (data.workspaceId) {
            io.to(data.workspaceId.toString()).emit("newsfeed:new", data);
        }
    });

    eventDispatcher.on(EVENTS.ANNOUNCEMENT.UPDATED, (data) => {
        if (data.workspaceId) {
            io.to(data.workspaceId.toString()).emit("newsfeed:updated", data);
        }
    });

    eventDispatcher.on(EVENTS.ANNOUNCEMENT.DELETED, (data) => {
        if (data.workspaceId) {
            io.to(data.workspaceId.toString()).emit("newsfeed:deleted", data);
        }
    });

    eventDispatcher.on(EVENTS.ANNOUNCEMENT.PINNED, (data) => {
        if (data.workspaceId) {
            io.to(data.workspaceId.toString()).emit("newsfeed:pinned", data);
        }
    });

    eventDispatcher.on(EVENTS.ANNOUNCEMENT.INTERACTION, (data) => {
        // data should contain workspaceId and announcementId
        if (data.workspaceId) {
            io.to(data.workspaceId.toString()).emit("newsfeed:interaction", data);
        }
    });

    // --- SPRINT 3: Real-time Comments & Notifications ---

    // 1. Lắng nghe bình luận mới
    eventDispatcher.on(EVENTS.COMMENT.ADDED, (data) => {
        // Gửi tới Room Project để các user đang mở Task đó thấy bình luận mới ngay lập tức
        if (data.workspaceId) {
            io.to(data.workspaceId.toString()).emit("comment:new", data);
        }
    });

    // 2. Lắng nghe xóa bình luận
    eventDispatcher.on(EVENTS.COMMENT.DELETED, (data) => {
        if (data.taskId) {
            io.emit("comment:deleted", data);
        }
    });

    // 3. Lắng nghe cập nhật cảm xúc
    eventDispatcher.on(EVENTS.COMMENT.REACTION_UPDATED, (data) => {
        if (data.taskId) {
            io.emit("comment:reaction_updated", data);
        }
    });

    // 2. Lắng nghe thông báo mới (Chuông báo)
    eventDispatcher.on(EVENTS.NOTIFICATION.RECEIVED, (data) => {
        // Gửi thông báo tới chính xác người nhận (Room cá nhân: userId)
        if (data.recipientId) {
            io.to(data.recipientId.toString()).emit("notification:new", data);
        }
    });

    return io;
};

/**
 * Gửi thông báo tới tất cả thành viên trong một Project
 */
const broadcastToProject = (projectId: any, event: string, data: any) => {
    if (!io || !projectId) return;
    const room = projectId.toString();
    console.log(`[Socket] Broadcasting event: ${event} to project: ${room}`);
    io.to(room).emit(event, data);
};

const broadcastToWorkspace = (workspaceId: any, event: string, data: any) => {
    if (!io || !workspaceId) return;
    const room = workspaceId.toString();
    console.log(`[Socket] Broadcasting event: ${event} to workspace: ${room}`);
    io.to(room).emit(event, data);
};

export const getIO = () => {
    if (!io) {
        throw new Error("Socket.io chưa được khởi tạo!");
    }
    return io;
};
