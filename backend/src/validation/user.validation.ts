import { z } from "zod";

// Schema cập nhật thông tin profile user
export const updateProfileSchema = z.object({
    name: z
        .string()
        .min(2, "Tên phải có ít nhất 2 ký tự")
        .max(100, "Tên không được vượt quá 100 ký tự")
        .optional(),
    profilePicture: z
        .string()
        .url("URL ảnh đại diện không hợp lệ")
        .nullable()
        .optional(),
});

// Schema đổi mật khẩu
export const changePasswordSchema = z.object({
    currentPassword: z
        .string()
        .min(1, "Vui lòng nhập mật khẩu hiện tại"),
    newPassword: z
        .string()
        .min(6, "Mật khẩu mới phải có ít nhất 6 ký tự")
        .max(128, "Mật khẩu không được vượt quá 128 ký tự"),
});

// Schema switch current workspace
export const switchWorkspaceSchema = z.object({
    workspaceId: z
        .string()
        .min(1, "workspaceId không được để trống"),
});
