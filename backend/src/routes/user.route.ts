import { Router } from "express";
import {
    getCurrentUser,
    updateUserProfileController,
    updateUserAvatarController,
    changePasswordController,
    switchWorkspaceController,
    updateUserPreferencesController,
    resetInboxTokenController,
} from "../controllers/user.controller";
import upload from "../middlewares/upload.middleware";

import { isAuthenticated } from "../middlewares/isAuthenticated.middleware";

const userRoutes = Router();

userRoutes.use(isAuthenticated);

// [ORIGINAL] Endpoint: /api/v1/user/current
userRoutes.get("/current", getCurrentUser);

// [AI-ADDED] Cập nhật thông tin cá nhân (tên, ảnh đại diện)
userRoutes.put("/profile", updateUserProfileController);

// [AI-ADDED] Tải ảnh đại diện lên Cloudinary
userRoutes.post("/upload-avatar", upload.single('avatar'), updateUserAvatarController);

// [AI-ADDED] Đổi mật khẩu (chỉ cho tài khoản email/password)
userRoutes.put("/change-password", changePasswordController);

// [AI-ADDED] Chuyển workspace hiện tại đang hoạt động
userRoutes.patch("/workspace/switch/:workspaceId", switchWorkspaceController);

// [AI-ADDED] Cập nhật cấu hình người dùng (ví dụ: tắt/mở email báo cáo)
userRoutes.patch("/preferences", updateUserPreferencesController);

// [AI-ADDED] Reset mã hòm thư cá nhân
userRoutes.post("/inbox-token/reset", resetInboxTokenController);

export default userRoutes;