import { Router } from "express";
import { isAuthenticated } from "../middlewares/isAuthenticated.middleware";
import {
    createTaskController,
    deleteTaskController,
    getAllTasksController,
    getTaskByIdController,
    updateTaskController,
    getTasksByProjectController,
    getSubtasksController,
    getDeletedTasksController,
    restoreTaskController,
} from "../controllers/task.controller";

const taskRoutes = Router();

taskRoutes.use(isAuthenticated);

// 1. Tạo & Cập nhật
taskRoutes.post("/workspace/:workspaceId/project/:projectId/create", createTaskController);
taskRoutes.put("/workspace/:workspaceId/project/:projectId/update/:taskId", updateTaskController);

// 2. Lấy danh sách (Query chung trong Workspace)
taskRoutes.get("/workspace/:workspaceId/all", getAllTasksController);

// 3. Lấy danh sách cụ thể theo Dự án
taskRoutes.get("/workspace/:workspaceId/project/:projectId/all", getTasksByProjectController);

// 4. Lấy công việc con (Subtasks)
taskRoutes.get("/workspace/:workspaceId/subtasks/:parentId", getSubtasksController);

// 5. Thao tác trên ID cụ thể công việc
taskRoutes.get("/workspace/:workspaceId/project/:projectId/:taskId", getTaskByIdController);
taskRoutes.get("/workspace/:workspaceId/deleted/all", getDeletedTasksController);
taskRoutes.patch("/workspace/:workspaceId/restore/:taskId", restoreTaskController);
taskRoutes.delete("/workspace/:workspaceId/delete/:taskId", deleteTaskController);

export default taskRoutes;