import { Router } from "express";
import { isAuthenticated } from "../middlewares/isAuthenticated.middleware";
import {
    createTaskController,
    deleteTaskController,
    getAllTasksController,
    getTaskByIdController,
    updateTaskController,
    getTasksByProjectController,
} from "../controllers/task.controller";


const taskRoutes = Router();

taskRoutes.use(isAuthenticated);

taskRoutes.post("/projects/:projectId/workspace/:workspaceId/create", createTaskController);

taskRoutes.put("/projects/:projectId/workspace/:workspaceId/update/:taskId", updateTaskController);

taskRoutes.get("/workspace/:workspaceId/tasks", getAllTasksController);

taskRoutes.get("/:taskId/workspace/:workspaceId/projects/:projectId", getTaskByIdController);

taskRoutes.delete("/:taskId/workspace/:workspaceId/delete", deleteTaskController);

// [AI-ADDED] Lấy tasks theo project cụ thể (RESTful pattern)
taskRoutes.get("/workspace/:workspaceId/projects/:projectId/tasks", getTasksByProjectController);

export default taskRoutes;