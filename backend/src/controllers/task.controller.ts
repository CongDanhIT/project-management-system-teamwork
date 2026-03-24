import { asyncHandler } from "../middlewares/asyncHandle";
import { WorkSpaceIdSchema } from "../validation/workspace.validation";
import { projectIdSchema, taskIdSchema } from "../validation/project.validation";
import { createTaskSchema, updateTaskSchema, getTasksQuerySchema } from "../validation/task.validation";
import { getMemberRoleInWorkspace } from "../services/member.service";
import { roleGuard } from "../utils/roleGuard";
import { Permissions } from "../enums/role.enum";
import { createTaskService, deleteTaskService, getAllTasksService, getTaskByIdService, updateTaskService, getSubtasksService, getDeletedTasksService, restoreTaskService } from "../services/task.service";
import HTTP_STATUS from "../config/http.config";

export const createTaskController = asyncHandler(
    async (req, res, next) => {
        const workspaceId = WorkSpaceIdSchema.parse(req.params.workspaceId);
        const projectId = projectIdSchema.parse(req.params.projectId);
        const userId = req.user?._id;
        const body = createTaskSchema.parse(req.body);
        
        const role = await getMemberRoleInWorkspace(workspaceId, userId);
        roleGuard(role.name, [Permissions.CREATE_TASK]);

        const task = await createTaskService(workspaceId, projectId, body, userId);

        return res.status(HTTP_STATUS.CREATED).json({
            success: true,
            message: "Tạo công việc thành công",
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

        return res.status(HTTP_STATUS.OK).json({
            success: true,
            message: "Cập nhật công việc thành công",
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
            message: "Lấy danh sách công việc thành công",
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
            message: "Lấy danh sách công việc con thành công",
            ...result
        });
    }
);

export const getTaskByIdController = asyncHandler(
    async (req, res, next) => {
        const workspaceId = WorkSpaceIdSchema.parse(req.params.workspaceId);
        const userId = req.user?._id;
        const taskId = taskIdSchema.parse(req.params.taskId);
        const projectId = projectIdSchema.parse(req.params.projectId);

        const role = await getMemberRoleInWorkspace(workspaceId, userId);
        roleGuard(role.name, [Permissions.VIEW_ONLY]);

        const task = await getTaskByIdService(workspaceId, projectId, taskId);

        return res.status(HTTP_STATUS.OK).json({
            success: true,
            message: "Lấy thông tin công việc thành công",
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

        const task = await deleteTaskService(workspaceId, taskId);

        return res.status(HTTP_STATUS.OK).json({
            success: true,
            message: "Xóa công việc thành công",
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
        };
        const pagination = {
            page: query.pageNumber || 1,
            pageSize: query.pageSize || 10,
        };

        const result = await getAllTasksService(workspaceId, filters, pagination);

        return res.status(HTTP_STATUS.OK).json({
            success: true,
            message: "Lấy danh sách công việc của dự án thành công",
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
            message: "Lấy danh sách công việc đã xóa thành công",
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

        const task = await restoreTaskService(workspaceId, taskId);

        return res.status(HTTP_STATUS.OK).json({
            success: true,
            message: "Khôi phục công việc thành công",
            task
        });
    }
);