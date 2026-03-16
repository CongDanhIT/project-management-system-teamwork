import { asyncHandler } from "../middlewares/asyncHandle";
import { getMemberRoleInWorkspace } from "../services/member.service";
import { roleGuard } from "../utils/roleGraud";
import { createProjectSchema, updateProjectSchema } from "../validation/project.validation";
import { WorkSpaceIdSchema } from "../validation/workspace.validation";
import { Permissions } from "../enums/role.enum";
import HTTP_STATUS from "../config/http.config";
import { createProjectService, deleteProjectService, getProjectAnalyticsService, getProjectByIdService, getProjectsInWorkspaceService, updateProjectService } from "../services/project.service";
import { projectIdSchema } from "../validation/project.validation";

export const createProjectController = asyncHandler(
    async (req, res, next) => {
        const body = createProjectSchema.parse(req.body);
        const workspaceId = WorkSpaceIdSchema.parse(req.params.workspaceId);
        const userId = req.user?._id;
        const role = await getMemberRoleInWorkspace(workspaceId, userId);
        roleGuard(role.name, [Permissions.CREATE_PROJECT]);
        const project = await createProjectService(workspaceId, body, userId);
        return res.status(HTTP_STATUS.CREATED).json({
            success: true,
            message: "Tạo dự án thành công",
            project
        })
    }
)

export const getAllProjectsInWorkspaceController = asyncHandler(
    async (req, res, next) => {
        const workspaceId = WorkSpaceIdSchema.parse(req.params.workspaceId);
        const userId = req.user?._id;
        const role = await getMemberRoleInWorkspace(workspaceId, userId);
        roleGuard(role.name, [Permissions.VIEW_ONLY]);
        const pageSize = parseInt(req.query.pageSize as string || "10");
        const pageNumber = parseInt(req.query.pageNumber as string || "1");
        const { projects, totalCount, totalPages, skip } = await getProjectsInWorkspaceService(
            workspaceId,
            pageSize,
            pageNumber
        );
        return res.status(HTTP_STATUS.OK).json({
            success: true,
            message: "Lấy danh sách dự án thành công",
            pagination: {
                totalCount,
                totalPages,
                skip,
                limit: pageSize,
                currentPage: pageNumber,
                pageSize,
                pageNumber
            },
            projects
        })
    }
)

export const getProjectByIdController = asyncHandler(
    async (req, res, next) => {
        const workspaceId = WorkSpaceIdSchema.parse(req.params.workspaceId);
        const projectId = projectIdSchema.parse(req.params.projectId);
        const userId = req.user?._id;
        const role = await getMemberRoleInWorkspace(workspaceId, userId);
        roleGuard(role.name, [Permissions.VIEW_ONLY]);
        const project = await getProjectByIdService(projectId, workspaceId);
        return res.status(HTTP_STATUS.OK).json({
            success: true,
            message: "Lấy thông tin dự án thành công",
            project
        })
    }
)

export const getProjectAnalyticsController = asyncHandler(
    async (req, res, next) => {
        const workspaceId = WorkSpaceIdSchema.parse(req.params.workspaceId);
        const projectId = projectIdSchema.parse(req.params.projectId);
        const userId = req.user?._id;
        const role = await getMemberRoleInWorkspace(workspaceId, userId);
        roleGuard(role.name, [Permissions.VIEW_ONLY]);
        const analytics = await getProjectAnalyticsService(projectId, workspaceId);
        return res.status(HTTP_STATUS.OK).json({
            success: true,
            message: "Lấy thông tin analytics dự án thành công",
            analytics
        })
    }
)

export const updateProjectController = asyncHandler(
    async (req, res, next) => {
        const workspaceId = WorkSpaceIdSchema.parse(req.params.workspaceId);
        const projectId = projectIdSchema.parse(req.params.projectId);
        const userId = req.user?._id;
        const { name, description, emoji } = updateProjectSchema.parse(req.body);
        const role = await getMemberRoleInWorkspace(workspaceId, userId);
        roleGuard(role.name, [Permissions.EDIT_PROJECT]);
        const project = await updateProjectService(projectId, workspaceId, { name, description, emoji });
        return res.status(HTTP_STATUS.OK).json({
            success: true,
            message: "Cập nhật dự án thành công",
            project
        })
    }
)

export const deleteProjectController = asyncHandler(
    async (req, res, next) => {
        const workspaceId = WorkSpaceIdSchema.parse(req.params.workspaceId);
        const projectId = projectIdSchema.parse(req.params.projectId);
        const userId = req.user?._id;
        const role = await getMemberRoleInWorkspace(workspaceId, userId);
        roleGuard(role.name, [Permissions.DELETE_PROJECT]);
        const project = await deleteProjectService(projectId, workspaceId);
        return res.status(HTTP_STATUS.OK).json({
            success: true,
            message: "Xóa dự án thành công",
            project
        })
    }
)
