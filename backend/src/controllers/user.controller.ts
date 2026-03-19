import HTTP_STATUS from "../config/http.config";
import { asyncHandler } from "../middlewares/asyncHandle";
import { BadRequestException, NotFoundException } from "../utils/appError";
import cloudinary from "../config/cloudinary.config";
import logger from "../utils/logger";
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
 * [AI-ADDED] Controller upload avatar lên Cloudinary và trả về URL
 * POST /api/v1/user/upload-avatar
 */
export const updateUserAvatarController = asyncHandler(async (req, res, next) => {
    const file = req.file;
    if (!file) {
        throw new BadRequestException("Vui lòng tải lên một file ảnh!");
    }

    // Convert Buffer sang Base64 để gửi qua Cloudinary (hoặc dùng stream)
    const b64 = Buffer.from(file.buffer).toString("base64");
    const dataURI = "data:" + file.mimetype + ";base64," + b64;

    const result = await cloudinary.uploader.upload(dataURI, {
        resource_type: "auto",
        folder: "teamflow/avatars",
    });

    logger.info("Avatar uploaded to Cloudinary successfully", {
        userId: req.user?._id,
        url: result.secure_url
    });

    return res.status(HTTP_STATUS.OK).json({
        success: true,
        message: "Upload ảnh đại diện thành công",
        url: result.secure_url,
    });
});

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

    logger.info("Updating profile (Profile update requested)", {
        userId,
        body: req.body
    });

    const body = updateProfileSchema.parse(req.body);
    const { user } = await updateUserProfileService(userId, body);

    logger.info("Profile updated successfully in DB", { userId });

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
