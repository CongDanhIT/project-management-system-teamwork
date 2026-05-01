import { asyncHandler } from "../middlewares/asyncHandle";
import { getMemberRoleInWorkspace } from "../services/member.service";
import { roleGuard } from "../utils/roleGuard";
import { createProjectSchemaV2, updateProjectSchemaV2 } from "../validation/project.validation";
import { WorkSpaceIdSchema } from "../validation/workspace.validation";
import { Permissions } from "../enums/role.enum";
import HTTP_STATUS from "../config/http.config";
import { createProjectService, deleteProjectService, getProjectAnalyticsService, getProjectByIdService, getProjectsInWorkspaceService, updateProjectService, restoreProjectService, getDeletedProjectsInWorkspaceService, toggleFavoriteProjectService, getFavoriteProjectsInWorkspaceService, getProjectAnalyticsHistoryService, permanentDeleteProjectService } from "../services/project.service";
import { projectIdSchema } from "../validation/project.validation";
import { ProjectStatusEnum } from "../enums/projectStatus.enum";

// ... (các controllers khác giữ nguyên)

export const getDeletedProjectsController = asyncHandler(
    async (req, res, next) => {
        const workspaceId = WorkSpaceIdSchema.parse(req.params.workspaceId);
        const userId = (req.user?._id as any).toString();


        const role = await getMemberRoleInWorkspace(workspaceId, userId);
        roleGuard(role.name, [Permissions.EDIT_PROJECT]);

        const projects = await getDeletedProjectsInWorkspaceService(workspaceId);
        return res.status(HTTP_STATUS.OK).json({
            success: true,
            message: "Lấy danh sách dự án trong thùng rác thành công",
            projects
        })
    }
)

export const createProjectController = asyncHandler(
    async (req, res, next) => {
        const body = createProjectSchemaV2.parse(req.body);
        const workspaceId = WorkSpaceIdSchema.parse(req.params.workspaceId);
        const userId = (req.user?._id as any).toString();

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
        const userId = (req.user?._id as any).toString();

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
        const userId = (req.user?._id as any).toString();
        const role = await getMemberRoleInWorkspace(workspaceId, userId);
        roleGuard(role.name, [Permissions.VIEW_ONLY]);
        const project = await getProjectByIdService(projectId, workspaceId, userId);
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
        const userId = (req.user?._id as any).toString();
        const role = await getMemberRoleInWorkspace(workspaceId, userId);

        roleGuard(role.name, [Permissions.VIEW_ONLY]);
        const phaseId = req.query.phaseId as string;
        const analytics = await getProjectAnalyticsService(projectId, workspaceId, phaseId);
        return res.status(HTTP_STATUS.OK).json({
            success: true,
            message: "Lấy thông tin analytics dự án thành công",
            analytics
        })
    }
)

export const getProjectAnalyticsHistoryController = asyncHandler(
    async (req, res, next) => {
        const workspaceId = WorkSpaceIdSchema.parse(req.params.workspaceId);
        const projectId = projectIdSchema.parse(req.params.projectId);
        const userId = (req.user?._id as any).toString();
        const role = await getMemberRoleInWorkspace(workspaceId, userId);

        roleGuard(role.name, [Permissions.VIEW_ONLY]);

        const history = await getProjectAnalyticsHistoryService(projectId, workspaceId);
        return res.status(HTTP_STATUS.OK).json({
            success: true,
            message: "Lấy lịch sử analytics dự án thành công",
            history
        })
    }
)

export const updateProjectController = asyncHandler(
    async (req, res, next) => {
        const workspaceId = WorkSpaceIdSchema.parse(req.params.workspaceId);
        const projectId = projectIdSchema.parse(req.params.projectId);
        const userId = (req.user?._id as any).toString();
        const body = updateProjectSchemaV2.parse(req.body);

        const projectData = await getProjectByIdService(projectId, workspaceId, userId);

        // Logic check khóa dự án (FROZEN)
        if (projectData.status === ProjectStatusEnum.FROZEN && body.status !== ProjectStatusEnum.ACTIVE) {
            return res.status(HTTP_STATUS.FORBIDDEN).json({
                success: false,
                message: "Dự án đã bị đóng băng (FROZEN), không thể chỉnh sửa trừ khi chuyển lại trạng thái ACTIVE"
            });
        }

        const role = await getMemberRoleInWorkspace(workspaceId, userId);
        roleGuard(role.name, [Permissions.EDIT_PROJECT]);
        const project = await updateProjectService(projectId, workspaceId, body, userId);


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
        const userId = (req.user?._id as any).toString();

        const projectData = await getProjectByIdService(projectId, workspaceId, userId);
        if (projectData.status === ProjectStatusEnum.FROZEN) {
            return res.status(HTTP_STATUS.FORBIDDEN).json({
                success: false,
                message: "Dự án đã bị đóng băng (FROZEN), không thể xóa"
            });
        }

        const role = await getMemberRoleInWorkspace(workspaceId, userId);
        roleGuard(role.name, [Permissions.DELETE_PROJECT]);

        const project = await deleteProjectService(projectId, workspaceId, userId);
        return res.status(HTTP_STATUS.OK).json({
            success: true,
            message: "Đưa dự án vào thùng rác thành công",
            project
        })
    }
)

export const restoreProjectController = asyncHandler(
    async (req, res, next) => {
        const workspaceId = WorkSpaceIdSchema.parse(req.params.workspaceId);
        const projectId = projectIdSchema.parse(req.params.projectId);
        const userId = (req.user?._id as any).toString();

        const role = await getMemberRoleInWorkspace(workspaceId, userId);
        roleGuard(role.name, [Permissions.EDIT_PROJECT]);

        const project = await restoreProjectService(projectId, workspaceId, userId);
        return res.status(HTTP_STATUS.OK).json({
            success: true,
            message: "Khôi phục dự án thành công",
            project
        })
    }
)

export const permanentDeleteProjectController = asyncHandler(
    async (req, res, next) => {
        const workspaceId = WorkSpaceIdSchema.parse(req.params.workspaceId);
        const projectId = projectIdSchema.parse(req.params.projectId);
        const userId = (req.user?._id as any).toString();

        const role = await getMemberRoleInWorkspace(workspaceId, userId);
        roleGuard(role.name, [Permissions.DELETE_PROJECT]);

        const result = await permanentDeleteProjectService(projectId, workspaceId, userId);
        return res.status(HTTP_STATUS.OK).json({
            ...result
        })
    }
)

export const toggleFavoriteProjectController = asyncHandler(
    async (req, res, next) => {
        const workspaceId = WorkSpaceIdSchema.parse(req.params.workspaceId);
        const projectId = projectIdSchema.parse(req.params.projectId);
        const userId = (req.user?._id as any).toString();

        const { project, isFavorited } = await toggleFavoriteProjectService(projectId, workspaceId, userId);

        return res.status(HTTP_STATUS.OK).json({
            success: true,
            message: isFavorited ? "Đã thêm vào yêu thích" : "Đã bỏ yêu thích",
            project,
            isFavorited
        })
    }
)

export const getFavoriteProjectsController = asyncHandler(
    async (req, res, next) => {
        const workspaceId = WorkSpaceIdSchema.parse(req.params.workspaceId);
        const userId = (req.user?._id as any).toString();

        const projects = await getFavoriteProjectsInWorkspaceService(workspaceId, userId);


        return res.status(HTTP_STATUS.OK).json({
            success: true,
            message: "Lấy danh sách dự án yêu thích thành công",
            projects
        })
    }
)
