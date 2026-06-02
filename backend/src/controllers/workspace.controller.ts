import HTTP_STATUS from "../config/http.config";
import logger from "../utils/logger";

import { asyncHandler } from "../middlewares/asyncHandle";
import { getMemberRoleInWorkspace } from "../services/member.service";
import {
    changeMemberRoleService,
    createWorkspaceService,
    deleteWorkspaceByIdService,
    getAllWorkspaceIsMemberService,
    getWorkspaceAnalyticsService,
    getWorkspaceAnalyticsHistoryService,
    getWorkspaceByIdService,
    getWorkspaceMemberService,

    updateWorkspaceByIdService,
    resetInviteCodeService,
    removeMemberFromWorkspaceService,
    leaveWorkspaceService,
    triggerSlackTestService,
    triggerEmailTestService,
    startVideoCallService,
    endVideoCallService,
} from "../services/workspace.service";
import { getDashboardTimeFilterMatch } from "../utils/date";
import { roleGuard } from "../utils/roleGuard";
import { changeWorkSpaceMemberRoleSchema, createWorkspaceSchema, updateWorkspaceSchema, WorkSpaceIdSchema } from "../validation/workspace.validation";
import { Permissions } from "../enums/role.enum";


export const createWorkspaceController = asyncHandler(
    async (req, res, next) => {
        logger.info("Yêu cầu tạo workspace mới", { body: req.body, user: req.user?._id });
        const body = createWorkspaceSchema.parse(req.body);

        const userId = req.user?._id;
        const workspace = await createWorkspaceService(userId, body);
        logger.info("Tạo workspace thành công", { workspaceId: workspace._id });

        return res.status(HTTP_STATUS.CREATED).json({
            success: true,
            message: "Tạo workspace thành công",
            workspace
        })
    }
)

export const getAllWorkspaceIsMemberController = asyncHandler(
    async (req, res, next) => {
        const userId = req.user?._id;
        const workspaces = await getAllWorkspaceIsMemberService(userId);

        return res.status(HTTP_STATUS.OK).json({
            success: true,
            message: "Lấy danh sách workspace thành công",
            workspaces
        })
    }
)

export const getWorkspaceByIdController = asyncHandler(
    async (req, res, next) => {
        const workspaceId = WorkSpaceIdSchema.parse(req.params.id);
        const userId = req.user?._id;
        // await getMemberRoleInWorkspace(workspaceId, userId);
        const workspace = await getWorkspaceByIdService(workspaceId, userId);
        return res.status(HTTP_STATUS.OK).json({
            success: true,
            message: "Lấy workspace thành công",
            workspace
        })
    }
)

export const getWorkspaceMemberController = asyncHandler(
    async (req, res, next) => {
        const workspaceId = WorkSpaceIdSchema.parse(req.params.id);
        const userId = req.user?._id;

        // Lấy Role Document
        const role = await getMemberRoleInWorkspace(workspaceId, userId);

        // Chạy Guard kiểm tra quyền
        roleGuard(role.name, [Permissions.VIEW_ONLY]);
        const rawProjectIds = req.query.projectIds || req.query.projectId; // Hỗ trợ cả 2 tên param để tương thích ngược
        const projectIds = rawProjectIds 
            ? (Array.isArray(rawProjectIds) 
                ? (rawProjectIds as string[]) 
                : (rawProjectIds as string).split(',')
              ).map(id => id.trim()).filter(id => id !== "") 
            : undefined;

        const year = req.query.year ? parseInt(req.query.year as string) : undefined;
        const month = req.query.month ? parseInt(req.query.month as string) : undefined;
        const quarter = req.query.quarter ? parseInt(req.query.quarter as string) : undefined;

        const { members, roles } = await getWorkspaceMemberService(workspaceId, projectIds, { year, month, quarter });
        // Trả về dữ liệu tạm thời
        return res.status(HTTP_STATUS.OK).json({
            success: true,
            message: "Lấy danh sách thành viên thành công",
            members,
            roles
        });
    }
);

export const getWorkspaceAnalyticsController = asyncHandler(
    async (req, res, next) => {
        const workspaceId = WorkSpaceIdSchema.parse(req.params.id);
        const userId = req.user?._id;

        // Lấy Role Document
        const role = await getMemberRoleInWorkspace(workspaceId, userId);

        // Chạy Guard kiểm tra quyền
        roleGuard(role.name, [Permissions.VIEW_ONLY]);

        const rawProjectIds = req.query.projectIds;
        const projectIds = rawProjectIds 
            ? (Array.isArray(rawProjectIds) 
                ? (rawProjectIds as string[]) 
                : (rawProjectIds as string).split(',')
              ).map(id => id.trim()).filter(id => id !== "") 
            : undefined;
        
        const year = req.query.year ? parseInt(req.query.year as string) : undefined;
        const month = req.query.month ? parseInt(req.query.month as string) : undefined;
        const quarter = req.query.quarter ? parseInt(req.query.quarter as string) : undefined;
        
        const analytics = await getWorkspaceAnalyticsService(workspaceId, projectIds, { year, month, quarter });
        // Trả về dữ liệu tạm thời
        return res.status(HTTP_STATUS.OK).json({
            success: true,
            message: "Lấy thông tin analytics thành công",
            analytics
        });
    }
);

export const getWorkspaceAnalyticsHistoryController = asyncHandler(
    async (req, res, next) => {
        const workspaceId = WorkSpaceIdSchema.parse(req.params.id);
        const userId = req.user?._id;

        // Kiểm tra quyền truy cập (chỉ thành viên mới được xem)
        const role = await getMemberRoleInWorkspace(workspaceId, userId);
        roleGuard(role.name, [Permissions.VIEW_ONLY]);

        const rawProjectIds = req.query.projectIds;
        const projectIds = rawProjectIds 
            ? (Array.isArray(rawProjectIds) 
                ? (rawProjectIds as string[]) 
                : (rawProjectIds as string).split(',')
              ).map(id => id.trim()).filter(id => id !== "") 
            : undefined;

        const year = req.query.year ? parseInt(req.query.year as string) : undefined;
        const month = req.query.month ? parseInt(req.query.month as string) : undefined;
        const quarter = req.query.quarter ? parseInt(req.query.quarter as string) : undefined;

        const history = await getWorkspaceAnalyticsHistoryService(workspaceId, projectIds, { year, month, quarter });

        return res.status(HTTP_STATUS.OK).json({
            success: true,
            message: "Lấy lịch sử analytics thành công",
            history
        });
    }
);


export const changeWorkSpaceMemberRoleController = asyncHandler(
    async (req, res, next) => {
        const workspaceId = WorkSpaceIdSchema.parse(req.params.id);
        const userId = req.user?._id;
        const { memberId, roleId } = changeWorkSpaceMemberRoleSchema.parse(req.body);

        // Lấy Role Document
        const getRole = await getMemberRoleInWorkspace(workspaceId, userId);

        // Kiểm tra quyền
        roleGuard(getRole.name, [Permissions.CHANGE_MEMBER_ROLE]);

        const member = await changeMemberRoleService(workspaceId, memberId, roleId, userId);
        // Trả về dữ liệu tạm thời
        return res.status(HTTP_STATUS.OK).json({
            success: true,
            message: "Thay đổi vai trò thành viên thành công",
            member
        });
    }
);

export const updateWorkspaceByIdController = asyncHandler(
    async (req, res, next) => {
        const workspaceId = WorkSpaceIdSchema.parse(req.params.id);
        const userId = req.user?._id;
        const { name, description, slackWebhookUrl, dailyDigestEnabled } = updateWorkspaceSchema.parse(req.body);

        // Lấy Role Document
        const getRole = await getMemberRoleInWorkspace(workspaceId, userId);

        // Kiểm tra quyền
        roleGuard(getRole.name, [Permissions.EDIT_WORKSPACE]);

        const workspace = await updateWorkspaceByIdService(workspaceId, userId, name, description, slackWebhookUrl, dailyDigestEnabled);
        // Trả về dữ liệu tạm thời
        return res.status(HTTP_STATUS.OK).json({
            success: true,
            message: "Cập nhật workspace thành công",
            workspace
        });
    }
);

export const deleteWorkspaceByIdController = asyncHandler(
    async (req, res, next) => {
        const workspaceId = WorkSpaceIdSchema.parse(req.params.id);
        const userId = req.user?._id;

        // Lấy Role Document
        const getRole = await getMemberRoleInWorkspace(workspaceId, userId);

        // Kiểm tra quyền
        roleGuard(getRole.name, [Permissions.DELETE_WORKSPACE]);

        const currentWorkspace = await deleteWorkspaceByIdService(workspaceId, userId);
        // Trả về dữ liệu tạm thời
        return res.status(HTTP_STATUS.OK).json({
            success: true,
            message: "Xóa workspace thành công",
            currentWorkspace
        });
    }
);

// [AI-ADDED] Tạo lại mã mời invite code (chỉ chủ sở hữu Workspace mới có quyền)
export const resetInviteCodeController = asyncHandler(
    async (req, res) => {
        const workspaceId = WorkSpaceIdSchema.parse(req.params.id);
        const userId = req.user?._id;

        // Chỉ OWNER mới được tạo lại invite code
        const getRole = await getMemberRoleInWorkspace(workspaceId, userId);
        roleGuard(getRole.name, [Permissions.MANAGE_WORKSPACE_SETTINGS]);

        const result = await resetInviteCodeService(workspaceId, userId);
        return res.status(HTTP_STATUS.OK).json({
            success: true,
            message: "Tạo lại mã mời vào workspace thành công",
            inviteCode: result.inviteCode,
        });
    }
);

// [AI-ADDED] Xóa thành viên khỏi workspace (chỉ OWNER/ADMIN có quyền REMOVE_MEMBER)
export const removeWorkspaceMemberController = asyncHandler(
    async (req, res) => {
        const workspaceId = WorkSpaceIdSchema.parse(req.params.id);
        const memberId = String(req.params.memberId); // Cast để đảm bảo string (Express 5 params type)
        const userId = req.user?._id;

        const getRole = await getMemberRoleInWorkspace(workspaceId, userId);
        roleGuard(getRole.name, [Permissions.REMOVE_MEMBER]);

        const result = await removeMemberFromWorkspaceService(workspaceId, memberId);
        return res.status(HTTP_STATUS.OK).json({
            success: true,
            message: "Xóa thành viên khỏi workspace thành công",
            memberId: result.memberId,
        });
    }
);

// [AI-ADDED] Trigger Slack Test thủ công
export const triggerSlackTestController = asyncHandler(
    async (req, res) => {
        const workspaceId = WorkSpaceIdSchema.parse(req.params.id);
        const userId = req.user?._id;

        const getRole = await getMemberRoleInWorkspace(workspaceId, userId);
        roleGuard(getRole.name, [Permissions.EDIT_WORKSPACE]);

        const result = await triggerSlackTestService(workspaceId);
        return res.status(HTTP_STATUS.OK).json(result);
    }
);

// [AI-ADDED] Trigger Email Test thủ công (Công việc cá nhân)
export const triggerEmailTestController = asyncHandler(
    async (req, res) => {
        const userId = req.user?._id;
        const result = await triggerEmailTestService(userId);
        return res.status(HTTP_STATUS.OK).json(result);
    }
);

// Tự rời khỏi workspace
export const leaveWorkspaceController = asyncHandler(
    async (req, res) => {
        const workspaceId = WorkSpaceIdSchema.parse(req.params.id);
        const userId = req.user?._id;

        const currentWorkspace = await leaveWorkspaceService(workspaceId, userId);
        return res.status(HTTP_STATUS.OK).json({
            success: true,
            message: "Rời khỏi workspace thành công",
            currentWorkspace
        });
    }
);

// [AI-ADDED] Video Call Controllers
export const startVideoCallController = asyncHandler(
    async (req, res) => {
        const workspaceId = WorkSpaceIdSchema.parse(req.params.id);
        const userId = req.user?._id;

        const getRole = await getMemberRoleInWorkspace(workspaceId, userId);
        roleGuard(getRole.name, [Permissions.VIEW_ONLY]);

        const activeCall = await startVideoCallService(workspaceId, userId);
        
        return res.status(HTTP_STATUS.OK).json({
            success: true,
            message: "Đã bắt đầu cuộc gọi video",
            activeCall
        });
    }
);

export const endVideoCallController = asyncHandler(
    async (req, res) => {
        const workspaceId = WorkSpaceIdSchema.parse(req.params.id);
        const userId = req.user?._id;

        const getRole = await getMemberRoleInWorkspace(workspaceId, userId);
        roleGuard(getRole.name, [Permissions.VIEW_ONLY]);

        await endVideoCallService(workspaceId);
        
        return res.status(HTTP_STATUS.OK).json({
            success: true,
            message: "Đã kết thúc cuộc gọi video"
        });
    }
);