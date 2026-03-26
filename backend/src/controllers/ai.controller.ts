import { asyncHandler } from "../middlewares/asyncHandle";
import { Request, Response } from "express";
import {
    generateTaskDescriptionService,
    suggestSubtasksService,
    chatWithContextService,
} from "../services/ai.service";
import HTTP_STATUS from "../config/http.config";
import logger from "../utils/logger";

/**
 * POST /api/ai/suggest-description
 * Body: { title: string }
 */
export const suggestDescriptionController = asyncHandler(
    async (req: Request, res: Response) => {
        const { title } = req.body;
        if (!title || typeof title !== "string" || title.trim().length === 0) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                message: "Vui lòng cung cấp tiêu đề (title) hợp lệ.",
            });
        }

        const description = await generateTaskDescriptionService(title.trim());
        return res.status(HTTP_STATUS.OK).json({
            success: true,
            description,
        });
    }
);

/**
 * POST /api/ai/suggest-subtasks
 * Body: { parentTitle: string }
 */
export const suggestSubtasksController = asyncHandler(
    async (req: Request, res: Response) => {
        const { parentTitle } = req.body;
        if (!parentTitle || typeof parentTitle !== "string" || parentTitle.trim().length === 0) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                message: "Vui lòng cung cấp tiêu đề task cha (parentTitle) hợp lệ.",
            });
        }

        const subtasks = await suggestSubtasksService(parentTitle.trim());
        return res.status(HTTP_STATUS.OK).json({
            success: true,
            subtasks,
        });
    }
);

/**
 * POST /api/ai/chat
 * Body: { message: string, history: [{role, content}], context: {...} }
 */
export const chatController = asyncHandler(
    async (req: Request, res: Response) => {
        const { message, history = [], context = {} } = req.body;
        logger.info("[AI-Controller] Nhận được yêu cầu chat", { 
            message: message?.substring(0, 50), 
            historyLength: history?.length, 
            context: context?.projectName 
        });

        if (!message || typeof message !== "string" || message.trim().length === 0) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                message: "Vui lòng cung cấp nội dung tin nhắn (message) hợp lệ.",
            });
        }

        const reply = await chatWithContextService(message.trim(), history, context);
        return res.status(HTTP_STATUS.OK).json({
            success: true,
            reply,
        });
    }
);
