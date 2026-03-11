import { env } from "../config/env";
import HTTP_STATUS from "../config/http.config";
import { asyncHandler } from "../middlewares/asyncHandle";
import { registerService } from "../services/auth.service";
import logger from "../utils/logger"; // Import logger để ghi lại nhật ký đăng nhập
import { registerSchema } from "../validation/auth.validation";

/**
 * Controller xử lý hành động sau khi xác thực thành công qua Google.
 * Passport sẽ gán dữ liệu User vào req.user.
 */
export const googleLoginCallback = asyncHandler(async (req, res, next) => {


    // Lấy ID của workspace hiện tại để điều hướng người dùng về đúng trang chủ của họ
    const currentWorkspaceId = req.user?.currentWorkspace;

    if (!currentWorkspaceId) {
        return res.redirect(`${env.FRONTEND_GOOGLE_CALLBACK_URL}?status=failure&message=authentication_failed`);
    }
    return res.redirect(`${env.FRONTEND_ORIGIN}/workspace/${currentWorkspaceId}`);
});

export const registerController = asyncHandler(async (req, res, next) => {
    const body = registerSchema.parse({ ...req.body });
    await registerService(body);

    return res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message: "Đăng ký thành công",
    })

})