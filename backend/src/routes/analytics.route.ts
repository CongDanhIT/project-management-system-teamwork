import { Router } from "express";
import { getAdvancedInsightsController } from "../controllers/analytics.controller";

const analyticsRoutes = Router();

// Lấy báo cáo chuyên sâu bằng AI
analyticsRoutes.get(
    "/workspace/:workspaceId/project/:projectId/advanced-insights",
    getAdvancedInsightsController
);

export default analyticsRoutes;
