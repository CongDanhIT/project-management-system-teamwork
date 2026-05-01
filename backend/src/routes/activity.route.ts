import { Router } from "express";
import { isAuthenticated } from "../middlewares/isAuthenticated.middleware";
import { getWorkspaceActivityController, getWorkspaceActivityStatisticsController } from "../controllers/activity.controller";



const activityRoutes = Router();

// Tất cả các route nhật ký đều yêu cầu đăng nhập
activityRoutes.use(isAuthenticated);


activityRoutes.get("/workspace/:workspaceId", getWorkspaceActivityController);
activityRoutes.get("/statistics/:workspaceId", getWorkspaceActivityStatisticsController);


export default activityRoutes;
