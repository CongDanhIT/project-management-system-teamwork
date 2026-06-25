import { asyncHandler } from "../middlewares/asyncHandle";
import { Request, Response } from "express";
import { applyAIProjectPlanService, chatWithContextService, generateProjectStructureService, generateTaskDescriptionService, suggestSubtasksService } from "../services/ai.service";
import { getMemberRoleInWorkspace } from "../services/member.service";
import { roleGuard } from "../utils/roleGuard";
import { Permissions } from "../enums/role.enum";
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
        const { message, history = [], context = {}, modelId } = req.body;
        logger.info("[AI-Controller] Nhận được yêu cầu chat", { 
            message: message?.substring(0, 50), 
            historyLength: history?.length, 
            context: context?.projectName,
            modelId
        });

        if (!message || typeof message !== "string" || message.trim().length === 0) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                message: "Vui lòng cung cấp nội dung tin nhắn (message) hợp lệ.",
            });
        }

        const reply = await chatWithContextService(message.trim(), history, context, modelId);
        return res.status(HTTP_STATUS.OK).json({
            success: true,
            reply,
        });
    }
);

/**
 * POST /api/ai/generate-plan
 * Body: { prompt: string }
 */
export const generateProjectStructureController = asyncHandler(
    async (req: Request, res: Response) => {
        const { prompt, workspaceId, projectId } = req.body;
        const userId = (req as any).user?._id;

        logger.info("[AI-Debug] Khởi tạo yêu cầu AI Plan", { userId, workspaceId, projectId });
        
        if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                message: "Vui lòng cung cấp nội dung yêu cầu (prompt) hợp lệ.",
            });
        }

        if (!workspaceId || !projectId) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                message: "Thiếu thông tin workspaceId hoặc projectId.",
            });
        }

        // RBAC Check
        const role = await getMemberRoleInWorkspace(workspaceId, userId);
        roleGuard(role.name, [Permissions.AI_PLANNING]);

        logger.info("[AI-Controller] Đang phân rã dự án", { prompt: prompt.substring(0, 50), projectId });
        
        const structure = await generateProjectStructureService(prompt.trim(), projectId);
        
        return res.status(HTTP_STATUS.OK).json({
            success: true,
            structure,
        });
    }
);

/**
 * POST /api/ai/apply-plan
 * Body: { workspaceId: string, projectId: string, structure: any }
 * Yêu cầu: Đã đăng nhập
 */
export const applyAIProjectPlanController = asyncHandler(
    async (req: Request, res: Response) => {
        const { workspaceId, projectId, structure } = req.body;
        const userId = (req as any).user?._id; 

        if (!workspaceId || !projectId || !structure) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                message: "Thiếu thông tin workspaceId, projectId hoặc cấu trúc kế hoạch.",
            });
        }

        // RBAC Check
        const role = await getMemberRoleInWorkspace(workspaceId, userId);
        roleGuard(role.name, [Permissions.AI_PLANNING]);

        logger.info("[AI-Controller] Đang áp dụng kế hoạch AI vào dự án", { projectId, workspaceId });

        const result = await applyAIProjectPlanService(
            workspaceId,
            projectId,
            userId as string,
            structure
        );

        return res.status(HTTP_STATUS.OK).json({
            success: true,
            message: "Đã áp dụng kế hoạch AI thành công.",
            data: result,
        });
    }
);
