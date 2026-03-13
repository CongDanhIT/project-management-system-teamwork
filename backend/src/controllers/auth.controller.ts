import { env } from "../config/env";
import HTTP_STATUS from "../config/http.config";
import { asyncHandler } from "../middlewares/asyncHandle";
import { registerService } from "../services/auth.service";
import logger from "../utils/logger"; // Import logger để ghi lại nhật ký đăng nhập
import { registerSchema } from "../validation/auth.validation";
import passport, { session } from "passport";

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
    });
});

export const loginController = asyncHandler(async (req, res, next) => {
    passport.authenticate("local", (
        err: Error | null,
        user: Express.User | false,
        info: { message: string } | undefined
    ) => {
        if (err) {
            return next(err);
        }
        if (!user) {
            return res.status(HTTP_STATUS.UNAUTHORIZED).json({
                success: false,
                message: info?.message || "Email hoặc mật khẩu không chính xác",
            });
        }
        req.logIn(user, (err) => {
            if (err) {
                return next(err);
            }
            return res.status(HTTP_STATUS.OK).json({
                success: true,
                message: "Đăng nhập thành công",
            });
        });
    })(req, res, next);
});

export const logoutController = asyncHandler(async (req, res, next) => {
    req.logOut((err) => {
        if (err) {
            return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: "Đăng xuất thất bại",
            });
        }
        (req.session as any) = null;
        return res.status(HTTP_STATUS.OK).json({
            success: true,
            message: "Đăng xuất thành công",
        });
    });

});


