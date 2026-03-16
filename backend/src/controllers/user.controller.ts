import HTTP_STATUS from "../config/http.config";
import { asyncHandler } from "../middlewares/asyncHandle";
import { NotFoundException } from "../utils/appError";
import {
    getCurrentUserService,
    updateUserProfileService,
    changePasswordService,
    switchWorkspaceService,
} from "../services/user.service";
import {
    updateProfileSchema,
    changePasswordSchema,
} from "../validation/user.validation";
import { WorkSpaceIdSchema } from "../validation/workspace.validation";

/**
 * [ORIGINAL] Lấy thông tin user hiện tại đang đăng nhập
 * GET /api/v1/user/current
 */
export const getCurrentUser = asyncHandler(async (req, res, next) => {
    const userId = req.user?._id;
    const { user } = await getCurrentUserService(userId);

    return res.status(HTTP_STATUS.OK).json({
        success: true,
        message: "Lấy dữ liệu người dùng mới nhất thành công",
        user,
    });
});

/**
 * [AI-ADDED] Cập nhật thông tin profile user (tên, ảnh đại diện)
 * PUT /api/v1/user/profile
 */
export const updateUserProfileController = asyncHandler(async (req, res) => {
    const userId = req.user?._id;
    const body = updateProfileSchema.parse(req.body);
    const { user } = await updateUserProfileService(userId, body);

    return res.status(HTTP_STATUS.OK).json({
        success: true,
        message: "Cập nhật thông tin cá nhân thành công",
        user,
    });
});

/**
 * [AI-ADDED] Đổi mật khẩu (chỉ cho tài khoản đăng ký thường, không áp dụng OAuth)
 * PUT /api/v1/user/change-password
 */
export const changePasswordController = asyncHandler(async (req, res) => {
    const userId = req.user?._id;
    const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);
    const result = await changePasswordService(userId, currentPassword, newPassword);

    return res.status(HTTP_STATUS.OK).json({
        success: true,
        message: result.message,
    });
});

/**
 * [AI-ADDED] Chuyển workspace hiện tại (cập nhật currentWorkspace cho user)
 * PATCH /api/v1/user/workspace/switch/:workspaceId
 */
export const switchWorkspaceController = asyncHandler(async (req, res) => {
    const userId = req.user?._id;
    const workspaceId = WorkSpaceIdSchema.parse(req.params.workspaceId);
    const { user } = await switchWorkspaceService(userId, workspaceId);

    return res.status(HTTP_STATUS.OK).json({
        success: true,
        message: "Chuyển workspace thành công",
        user,
    });
});