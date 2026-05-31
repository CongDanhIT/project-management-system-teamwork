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

        // 1. Áp dụng cửa sổ trượt (Sliding Window): Giữ lại tối đa 8 tin nhắn gần nhất để tiết kiệm token
        const MAX_HISTORY = 8;
        let prunedMessages = messages;
        if (messages.length > MAX_HISTORY) {
            prunedMessages = messages.slice(-MAX_HISTORY);
            logger.info("[AI-V2-Controller] Áp dụng Sliding Window: Cắt giảm lịch sử tin nhắn để hạn chế quota", {
                userId,
                originalCount: messages.length,
                prunedCount: prunedMessages.length
            });
        }

        // 2. Tinh giản kết quả Tool cũ (Tool Call & Result Pruning):
        // Chỉ giữ lại toolInvocations cho tin nhắn cuối cùng (nếu có) để tránh lặp lại dữ liệu JSON thô khổng lồ của các tool cũ.
        const sanitizedMessages = prunedMessages.map((m: any, index: number) => {
            const isLastMessage = index === prunedMessages.length - 1;
            const hasToolInvocations = !!m.toolInvocations;

            return {
                role: m.role,
                content: m.content || "",
                ...(isLastMessage && hasToolInvocations ? { toolInvocations: m.toolInvocations } : {})
            };
        });

        logger.info("[AI-V2-Controller] Đang xử lý yêu cầu Chat Agent với lịch sử tinh giản", { 
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
                phaseId: context.phaseId?.toString(),
                modelId
            });

            // Tránh Unhandled Promise Rejection từ các Promise ngầm của Vercel AI SDK
            result.text.catch((err: any) => {
                logger.error("[AI-V2-Controller] Bắt được lỗi từ result.text Promise", { 
                    message: err?.message || String(err),
                    stack: err?.stack
                });
            });

            if (result.response) {
                result.response.catch((err: any) => {
                    logger.error("[AI-V2-Controller] Bắt được lỗi từ result.response Promise", { 
                        message: err?.message || String(err),
                        stack: err?.stack
                    });
                });
            }

            // Ghi nhận phản hồi stream vào response Express
            // pipeDataStreamToResponse là method trực tiếp trên StreamTextResult (ai v4.3)
            (result as any).pipeDataStreamToResponse(res, {
                onError: (error: any) => {
                    logger.error("[AI-V2-Controller] Lỗi trong quá trình stream response", {
                        message: error instanceof Error ? error.message : String(error),
                        stack: error instanceof Error ? error.stack : undefined
                    });
                    
                    if (!res.writableEnded) {
                        const fallbackText = `\n\n⚠️ *(Lỗi kết nối Stream: ${error instanceof Error ? error.message : String(error)}. Vui lòng thử lại.)*`;
                        try {
                            res.write(`0:${JSON.stringify(fallbackText)}\n`);
                        } catch (writeErr) {
                            logger.error("[AI-V2-Controller] Không thể ghi fallback chunk vào response", writeErr);
                        }
                    }
                    return error instanceof Error ? error.message : String(error);
                }
            });

        } catch (error: any) {
            logger.error("[AI-V2-Controller] Lỗi nghiêm trọng khi xử lý Agent Chat", { 
                message: error.message,
                stack: error.stack,
                userId
            });

            if (!res.headersSent) {
                try {
                    res.setHeader("Content-Type", "text/plain; charset=utf-8");
                    res.setHeader("x-vercel-ai-data-stream", "v1");
                    
                    const friendlyMessage = `🤖 Rất tiếc, AI Agent gặp sự cố kết nối máy chủ AI: ${error.message || "Lỗi không xác định"}. Vui lòng thử lại hoặc đổi mô hình khác.`;
                    res.write(`0:${JSON.stringify(friendlyMessage)}\n`);
                    res.end();
                } catch (writeErr: any) {
                    logger.error("[AI-V2-Controller] Lỗi khi gửi stream lỗi fallback", { 
                        message: writeErr.message,
                        stack: writeErr.stack 
                    });
                    if (!res.headersSent) {
                        res.status(500).json({ success: false, message: error.message });
                    }
                }
            }
        }
    }
);
