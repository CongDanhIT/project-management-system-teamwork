import { Router } from "express";
import {
    suggestDescriptionController,
    suggestSubtasksController,
    chatController,
} from "../controllers/ai.controller";

const aiRouter = Router();
console.log("========================================");
console.log(">>> AI ROUTER MODULE LOADED SUCCESS <<<");
console.log("========================================");

// POST /api/ai/suggest-description - Gợi ý mô tả task từ tiêu đề
aiRouter.post("/suggest-description", suggestDescriptionController);

// POST /api/ai/suggest-subtasks - Gợi ý danh sách subtask từ tiêu đề task cha
aiRouter.post("/suggest-subtasks", suggestSubtasksController);

// POST /api/ai/chat - Chat với AI dựa trên context project/workspace
aiRouter.post("/chat", chatController);

export default aiRouter;
