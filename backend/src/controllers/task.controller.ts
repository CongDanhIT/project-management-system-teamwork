import { asyncHandler } from "../middlewares/asyncHandle";
import { WorkSpaceIdSchema } from "../validation/workspace.validation";
import { projectIdSchema, taskIdSchema } from "../validation/project.validation";
import { createTaskSchema, updateTaskSchema, getTasksQuerySchema } from "../validation/task.validation";
import { getMemberRoleInWorkspace } from "../services/member.service";
import { roleGuard } from "../utils/roleGuard";
import { Permissions } from "../enums/role.enum";
import { createTaskService, deleteTaskService, getAllTasksService, getTaskByIdService, updateTaskService, getSubtasksService, getDeletedTasksService, restoreTaskService, permanentDeleteTaskService } from "../services/task.service";
import { getProjectByIdService } from "../services/project.service";
import HTTP_STATUS from "../config/http.config";
import eventDispatcher, { EVENTS } from "../utils/eventDispatcher";

export const createTaskController = asyncHandler(
    async (req, res, next) => {
        const workspaceId = WorkSpaceIdSchema.parse(req.params.workspaceId);
        const projectId = projectIdSchema.parse(req.params.projectId);
        const userId = req.user?._id;
        const body = createTaskSchema.parse(req.body);
        
        const role = await getMemberRoleInWorkspace(workspaceId, userId);
        roleGuard(role.name, [Permissions.CREATE_TASK]);

        const task = await createTaskService(workspaceId, projectId, body, userId);
        const project = await getProjectByIdService(projectId, workspaceId);

        // PhÃ¡t sá»± kiá»‡n realtime
        console.log(`[Event] Emitting TASK.CREATED for project: ${projectId}`);
        eventDispatcher.emit(EVENTS.TASK.CREATED, {
            projectId,
            workspaceId,
            taskId: task._id,
            task,
            userId,
            userName: (req.user as any)?.name || "Thành viên",
            taskTitle: task.title,
            projectName: project.name
        });

        return res.status(HTTP_STATUS.CREATED).json({
            success: true,
            message: "Táº¡o cÃ´ng viá»‡c thÃ nh cÃ´ng",
            task
        });
    }
);

export const updateTaskController = asyncHandler(
    async (req, res, next) => {
        const workspaceId = WorkSpaceIdSchema.parse(req.params.workspaceId);
        const projectId = projectIdSchema.parse(req.params.projectId);
        const userId = req.user?._id;
        const taskId = taskIdSchema.parse(req.params.taskId);
        const body = updateTaskSchema.parse(req.body);

        const role = await getMemberRoleInWorkspace(workspaceId, userId);
        roleGuard(role.name, [Permissions.EDIT_TASK]);

        const task = await updateTaskService(workspaceId, projectId, body, userId, taskId);
        const project = await getProjectByIdService(projectId, workspaceId);

        // PhÃ¡t sá»± kiá»‡n realtime
        console.log(`[Event] Emitting TASK.UPDATED for project: ${projectId}`);
        eventDispatcher.emit(EVENTS.TASK.UPDATED, {
            projectId,
            workspaceId,
            taskId,
            task,
            userName: (req.user as any)?.name || "ThÃ nh viÃªn",
            taskTitle: task.title,
            projectName: project.name
        });

        return res.status(HTTP_STATUS.OK).json({
            success: true,
            message: "Cáº­p nháº­t cÃ´ng viá»‡c thÃ nh cÃ´ng",
            task
        });
    }
);

export const getAllTasksController = asyncHandler(
    async (req, res, next) => {
        const workspaceId = WorkSpaceIdSchema.parse(req.params.workspaceId);
        const userId = req.user?._id;

        const query = getTasksQuerySchema.parse(req.query);

        const filters = {
            projectId: query.projectId,
            parentId: query.parentId,
            status: query.status?.split(","),
            priority: query.priority?.split(","),
            assignedTo: query.assignedTo?.split(","),
            keyword: query.keyword,
            dueDate: query.dueDate,
            isOverdue: query.isOverdue,
            tags: query.tags?.split(","),
            phaseId: query.phaseId,
        };

        const pagination = {
            page: query.pageNumber || 1,
            pageSize: query.pageSize || 10,
        };

        const role = await getMemberRoleInWorkspace(workspaceId, userId);
        roleGuard(role.name, [Permissions.VIEW_ONLY]);

        const result = await getAllTasksService(workspaceId, filters, pagination);

        return res.status(HTTP_STATUS.OK).json({
            success: true,
            message: "Láº¥y danh sÃ¡ch cÃ´ng viá»‡c thÃ nh cÃ´ng",
            ...result
        });
    }
);

export const getSubtasksController = asyncHandler(
    async (req, res, next) => {
        const workspaceId = WorkSpaceIdSchema.parse(req.params.workspaceId);
        const parentId = taskIdSchema.parse(req.params.parentId);
        const userId = req.user?._id;

        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 4;

        const role = await getMemberRoleInWorkspace(workspaceId, userId);
        roleGuard(role.name, [Permissions.VIEW_ONLY]);

        const result = await getSubtasksService(workspaceId, parentId, { page, pageSize: limit });

        return res.status(HTTP_STATUS.OK).json({
            success: true,
            message: "Láº¥y danh sÃ¡ch cÃ´ng viá»‡c con thÃ nh cÃ´ng",
            ...result
        });
    }
);

export const getTaskByIdController = asyncHandler(
    async (req, res, next) => {
        const workspaceId = WorkSpaceIdSchema.parse(req.params.workspaceId);
        const userId = req.user?._id;
        const taskId = taskIdSchema.parse(req.params.taskId);
        const projectId = req.params.projectId ? projectIdSchema.parse(req.params.projectId) : undefined;

        const role = await getMemberRoleInWorkspace(workspaceId, userId);
        roleGuard(role.name, [Permissions.VIEW_ONLY]);

        const task = await getTaskByIdService(workspaceId, projectId || '', taskId);

        return res.status(HTTP_STATUS.OK).json({
            success: true,
            message: "Láº¥y thÃ´ng tin cÃ´ng viá»‡c thÃ nh cÃ´ng",
            task
        });
    }
);

export const deleteTaskController = asyncHandler(
    async (req, res, next) => {
        const workspaceId = WorkSpaceIdSchema.parse(req.params.workspaceId);
        const userId = req.user?._id;
        const taskId = taskIdSchema.parse(req.params.taskId);

        const role = await getMemberRoleInWorkspace(workspaceId, userId);
        roleGuard(role.name, [Permissions.DELETE_TASK]);

        const task = await deleteTaskService(workspaceId, taskId, userId);
        const project = await getProjectByIdService(task.projectId.toString(), workspaceId);

        // PhÃ¡t sá»± kiá»‡n realtime
        eventDispatcher.emit(EVENTS.TASK.DELETED, {
            projectId: task.projectId,
            workspaceId,
            taskId,
            task,
            userName: (req.user as any)?.name || "ThÃ nh viÃªn",
            taskTitle: task.title,
            projectName: project.name
        });

        return res.status(HTTP_STATUS.OK).json({
            success: true,
            message: "XÃ³a cÃ´ng viá»‡c thÃ nh cÃ´ng",
            task
        });
    }
);

export const getTasksByProjectController = asyncHandler(
    async (req, res) => {
        const workspaceId = WorkSpaceIdSchema.parse(req.params.workspaceId);
        const projectId = projectIdSchema.parse(req.params.projectId);
        const userId = req.user?._id;

        const role = await getMemberRoleInWorkspace(workspaceId, userId);
        roleGuard(role.name, [Permissions.VIEW_ONLY]);

        const query = getTasksQuerySchema.parse(req.query);
        const filters = {
            projectId,
            parentId: query.parentId,
            status: query.status?.split(","),
            priority: query.priority?.split(","),
            assignedTo: query.assignedTo?.split(","),
            keyword: query.keyword,
            dueDate: query.dueDate,
            tags: query.tags?.split(","),
            phaseId: query.phaseId,
        };
        const pagination = {
            page: query.pageNumber || 1,
            pageSize: query.pageSize || 10,
        };

        const result = await getAllTasksService(workspaceId, filters, pagination);

        return res.status(HTTP_STATUS.OK).json({
            success: true,
            message: "Láº¥y danh sÃ¡ch cÃ´ng viá»‡c cá»§a dá»± Ã¡n thÃ nh cÃ´ng",
            ...result,
        });
    }
);

export const getDeletedTasksController = asyncHandler(
    async (req, res) => {
        const workspaceId = WorkSpaceIdSchema.parse(req.params.workspaceId);
        const userId = req.user?._id;

        const role = await getMemberRoleInWorkspace(workspaceId, userId);
        roleGuard(role.name, [Permissions.VIEW_ONLY]);

        const tasks = await getDeletedTasksService(workspaceId);

        return res.status(HTTP_STATUS.OK).json({
            success: true,
            message: "Láº¥y danh sÃ¡ch cÃ´ng viá»‡c Ä‘Ã£ xÃ³a thÃ nh cÃ´ng",
            tasks
        });
    }
);

export const restoreTaskController = asyncHandler(
    async (req, res) => {
        const workspaceId = WorkSpaceIdSchema.parse(req.params.workspaceId);
        const userId = req.user?._id;
        const taskId = taskIdSchema.parse(req.params.taskId);

        const role = await getMemberRoleInWorkspace(workspaceId, userId);
        roleGuard(role.name, [Permissions.EDIT_TASK]);

        const task = await restoreTaskService(workspaceId, taskId, userId);

        const project = await getProjectByIdService(task.projectId.toString(), workspaceId);
        // PhÃ¡t sá»± kiá»‡n realtime (Khi khÃ´i phá»¥c, coi nhÆ° lÃ  UPDATE tráº¡ng thÃ¡i deletedAt)
        eventDispatcher.emit(EVENTS.TASK.UPDATED, {
            projectId: task.projectId,
            workspaceId,
            taskId,
            task,
            userName: (req.user as any)?.name || "ThÃ nh viÃªn",
            taskTitle: task.title,
            projectName: project.name
        });

        return res.status(HTTP_STATUS.OK).json({
            success: true,
            message: "KhÃ´i phá»¥c cÃ´ng viá»‡c thÃ nh cÃ´ng",
            task
        });
    }
);
export const permanentDeleteTaskController = asyncHandler(
    async (req, res) => {
        const workspaceId = WorkSpaceIdSchema.parse(req.params.workspaceId);
        const userId = req.user?._id as string;
        const taskId = taskIdSchema.parse(req.params.taskId);

        const role = await getMemberRoleInWorkspace(workspaceId, userId);
        roleGuard(role.name, [Permissions.DELETE_TASK]);

        const result = await permanentDeleteTaskService(workspaceId, taskId, userId);

        return res.status(HTTP_STATUS.OK).json({
            ...result
        });
    }
);

export const getSmartAssignController = asyncHandler(
    async (req, res) => {
        const workspaceId = WorkSpaceIdSchema.parse(req.params.workspaceId);
        const projectId = projectIdSchema.parse(req.params.projectId);
        const taskId = taskIdSchema.parse(req.params.taskId);
        const userId = req.user?._id as string;

        const role = await getMemberRoleInWorkspace(workspaceId, userId);
        roleGuard(role.name, [Permissions.VIEW_ONLY]);

        const { smartAllocationService } = await import("../services/smart-allocation.service");
        const suggestions = await smartAllocationService.evaluateMembersForTask(workspaceId, projectId, taskId);

        return res.status(HTTP_STATUS.OK).json({
            success: true,
            message: "Lấy danh sách gợi ý phân bổ thành công",
            suggestions
        });
    }
);
