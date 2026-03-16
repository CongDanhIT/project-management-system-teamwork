import HTTP_STATUS from "../config/http.config";
import { asyncHandler } from "../middlewares/asyncHandle";
import { getMemberRoleInWorkspace } from "../services/member.service";
import {
    changeMemberRoleService,
    createWorkspaceService,
    deleteWorkspaceByIdService,
    getAllWorkspaceIsMemberService,
    getWorkspaceAnalyticsService,
    getWorkspaceByIdService,
    getWorkspaceMemberService,
    updateWorkspaceByIdService,
    resetInviteCodeService,
    removeMemberFromWorkspaceService,
} from "../services/workspace.service";
import { roleGuard } from "../utils/roleGraud";
import { changeWorkSpaceMemberRoleSchema, createWorkspaceSchema, updateWorkspaceSchema, WorkSpaceIdSchema } from "../validation/workspace.validation";
import { Permissions } from "../enums/role.enum";


export const createWorkspaceController = asyncHandler(
    async (req, res, next) => {
        const body = createWorkspaceSchema.parse(req.body);

        const userId = req.user?._id;
        const workspace = await createWorkspaceService(userId, body);

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
        const { members, roles } = await getWorkspaceMemberService(workspaceId);
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

        const analytics = await getWorkspaceAnalyticsService(workspaceId);
        // Trả về dữ liệu tạm thời
        return res.status(HTTP_STATUS.OK).json({
            success: true,
            message: "Lấy thông tin analytics thành công",
            analytics
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

        const member = await changeMemberRoleService(workspaceId, memberId, roleId);
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
        const { name, description } = updateWorkspaceSchema.parse(req.body);

        // Lấy Role Document
        const getRole = await getMemberRoleInWorkspace(workspaceId, userId);

        // Kiểm tra quyền
        roleGuard(getRole.name, [Permissions.EDIT_WORKSPACE]);

        const workspace = await updateWorkspaceByIdService(workspaceId, name, description);
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