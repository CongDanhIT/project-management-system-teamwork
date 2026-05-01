import { Router } from "express";
import { createProjectController, deleteProjectController, getAllProjectsInWorkspaceController, getProjectAnalyticsController, getProjectByIdController, updateProjectController, restoreProjectController, getDeletedProjectsController, toggleFavoriteProjectController, getFavoriteProjectsController, getProjectAnalyticsHistoryController, permanentDeleteProjectController } from "../controllers/project.controller";
import { isAuthenticated } from "../middlewares/isAuthenticated.middleware";

const projectRoutes = Router();

projectRoutes.use(isAuthenticated);

projectRoutes.get("/workspace/:workspaceId/deleted", getDeletedProjectsController);

projectRoutes.get("/workspace/:workspaceId/all", getAllProjectsInWorkspaceController);

projectRoutes.get("/workspace/:workspaceId/analytics/:projectId", getProjectAnalyticsController);
projectRoutes.get("/workspace/:workspaceId/analytics/history/:projectId", getProjectAnalyticsHistoryController);

projectRoutes.get("/workspace/:workspaceId/:projectId", getProjectByIdController);

projectRoutes.post("/workspace/:workspaceId/create", createProjectController);

projectRoutes.put("/workspace/:workspaceId/update/:projectId", updateProjectController);

projectRoutes.patch("/workspace/:workspaceId/restore/:projectId", restoreProjectController);

projectRoutes.delete("/workspace/:workspaceId/delete/:projectId", deleteProjectController);
projectRoutes.delete("/workspace/:workspaceId/hard-delete/:projectId", permanentDeleteProjectController);

projectRoutes.get("/workspace/:workspaceId/favorites/all", getFavoriteProjectsController);

projectRoutes.patch("/workspace/:workspaceId/favorite/:projectId", toggleFavoriteProjectController);

export default projectRoutes;