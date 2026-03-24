import { Router } from "express";
import { createProjectController, deleteProjectController, getAllProjectsInWorkspaceController, getProjectAnalyticsController, getProjectByIdController, updateProjectController, restoreProjectController, getDeletedProjectsController } from "../controllers/project.controller";
import { isAuthenticated } from "../middlewares/isAuthenticated.middleware";

const projectRoutes = Router();

projectRoutes.use(isAuthenticated);

projectRoutes.get("/workspace/:workspaceId/deleted", getDeletedProjectsController);

projectRoutes.get("/workspace/:workspaceId/all", getAllProjectsInWorkspaceController);

projectRoutes.get("/workspace/:workspaceId/analytics/:projectId", getProjectAnalyticsController);

projectRoutes.get("/workspace/:workspaceId/:projectId", getProjectByIdController);

projectRoutes.post("/workspace/:workspaceId/create", createProjectController);

projectRoutes.put("/workspace/:workspaceId/update/:projectId", updateProjectController);

projectRoutes.patch("/workspace/:workspaceId/restore/:projectId", restoreProjectController);

projectRoutes.delete("/workspace/:workspaceId/delete/:projectId", deleteProjectController);

export default projectRoutes;