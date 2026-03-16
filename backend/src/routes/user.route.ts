import { Router } from "express";
import {
    getCurrentUser,
    updateUserProfileController,
    changePasswordController,
    switchWorkspaceController,
} from "../controllers/user.controller";

const userRoutes = Router();

// [ORIGINAL] Endpoint: /api/v1/user/current
userRoutes.get("/current", getCurrentUser);

// [AI-ADDED] Cập nhật thông tin cá nhân (tên, ảnh đại diện)
userRoutes.put("/profile", updateUserProfileController);

// [AI-ADDED] Đổi mật khẩu (chỉ cho tài khoản email/password)
userRoutes.put("/change-password", changePasswordController);

// [AI-ADDED] Chuyển workspace hiện tại đang hoạt động
userRoutes.patch("/workspace/switch/:workspaceId", switchWorkspaceController);

export default userRoutes;