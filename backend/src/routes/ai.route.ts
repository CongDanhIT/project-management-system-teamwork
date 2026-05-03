import { Router } from "express";
import {
    suggestDescriptionController,
    suggestSubtasksController,
    chatController,
    generateProjectStructureController,
    applyAIProjectPlanController,
} from "../controllers/ai.controller";
import { isAuthenticated } from "../middlewares/isAuthenticated.middleware";

const aiRouter = Router();

// POST /api/ai/suggest-description - Gợi ý mô tả task từ tiêu đề
aiRouter.post("/suggest-description", suggestDescriptionController);

// POST /api/ai/suggest-subtasks - Gợi ý danh sách subtask từ tiêu đề task cha
aiRouter.post("/suggest-subtasks", suggestSubtasksController);

// POST /api/ai/chat - Chat với AI dựa trên context project/workspace
aiRouter.post("/chat", chatController);

// POST /api/ai/generate-plan - Phân rã dự án thông minh (Sprint 6)
aiRouter.post("/generate-plan", generateProjectStructureController);

// POST /api/ai/apply-plan - Lưu kế hoạch AI vào database (Sprint 6)
aiRouter.post("/apply-plan", applyAIProjectPlanController);

export default aiRouter;
