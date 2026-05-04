import { Router } from "express";
import { chatV2Controller } from "../controllers/ai-v2.controller";
import { isAuthenticated } from "../middlewares/isAuthenticated.middleware";

const aiV2Router = Router();

/**
 * Route cho AI Chat Bot V2 (Agentic AI)
 * Endpoint: /api/ai/v2/chat
 */
aiV2Router.post("/chat", isAuthenticated, chatV2Controller);

export default aiV2Router;
