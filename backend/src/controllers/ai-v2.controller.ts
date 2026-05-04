import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/asyncHandle";
import logger from "../utils/logger";
import { streamAgentChatService } from "../services/ai.service";

/**
 * POST /api/ai/v2/chat
 * Controller xử lý luồng Chat AI Agent V2 với khả năng Tool Calling và Streaming.
 */
export const chatV2Controller = asyncHandler(
    async (req: Request, res: Response) => {
        const { messages, context = {}, modelId } = req.body;
        const userId = (req as any).user?._id?.toString(); // Chuyển sang string để đồng bộ
        const workspaceId = context.workspaceId;
        const projectId = context.projectId;

        logger.info("[AI-V2-Controller] Nhận yêu cầu chat Agent", { 
            userId, 
            workspaceId, 
            projectId,
            messagesCount: messages?.length,
            modelId
        });

        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({
                success: false,
                message: "Dữ liệu tin nhắn (messages) không hợp lệ.",
            });
        }

        // 1. Chuẩn hóa và làm sạch tin nhắn (Sanitize) để tránh lỗi format SDK
        const sanitizedMessages = messages.map((m: any) => ({
            role: m.role,
            content: m.content || "",
            ...(m.toolInvocations ? { toolInvocations: m.toolInvocations } : {})
        }));

        logger.info("[AI-V2-Controller] Đang xử lý yêu cầu Chat Agent", { 
            userId, 
            workspaceId: workspaceId || "N/A", 
            projectId: projectId || "N/A",
            messagesCount: sanitizedMessages.length
        });

        try {
            // Khởi chạy service Agentic AI
            const result = await streamAgentChatService({
                messages: sanitizedMessages,
                userId: userId || "",
                workspaceId: workspaceId?.toString(),
                projectId: projectId?.toString(),
                modelId
            });

            // Ghi nhận phản hồi stream vào response Express
            result.pipeDataStreamToResponse(res);

        } catch (error: any) {
            logger.error("[AI-V2-Controller] Lỗi nghiêm trọng khi xử lý Agent Chat", { 
                message: error.message,
                stack: error.stack,
                userId
            });

            if (!res.headersSent) {
                res.status(500).json({ 
                    success: false, 
                    message: "Lỗi máy chủ nội bộ khi xử lý AI Agent.",
                    error: error.message 
                });
            }
        }
    }
);
