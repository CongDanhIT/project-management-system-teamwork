import mongoose from "mongoose";
import UserModel from "../models/user.model";
import MemberModel from "../models/member.model";
import WorkspaceModel from "../models/workspace.model";
import { BadRequestException, NotFoundException } from "../utils/appError";

/**
 * [ORIGINAL] Lấy thông tin user hiện tại đang đăng nhập
 */
export const getCurrentUserService = async (userId: string) => {
    const user = await UserModel.findById(userId)
        .populate("currentWorkspace")
        .select("-password");

    if (!user) {
        throw new NotFoundException("AUTH_USER_NOT_FOUND");
    }

    return { user };
};

/**
 * [AI-ADDED] Cập nhật thông tin profile của user (tên, ảnh đại diện)
 */
export const updateUserProfileService = async (
    userId: string,
    data: { name?: string; profilePicture?: string | null }
) => {
    const user = await UserModel.findById(userId).select("-password");
    if (!user) {
        throw new NotFoundException("Không tìm thấy user");
    }

    if (data.name !== undefined) user.name = data.name;
    if (data.profilePicture !== undefined) user.profilePicture = data.profilePicture;

    await user.save();
    return { user };
};

/**
 * [AI-ADDED] Thay đổi mật khẩu của user (chỉ áp dụng cho tài khoản đăng ký thường)
 */
export const changePasswordService = async (
    userId: string,
    currentPassword: string,
    newPassword: string
) => {
    // Lấy user kèm password để so sánh
    const user = await UserModel.findById(userId).select("+password");
    if (!user) {
        throw new NotFoundException("Không tìm thấy user");
    }

    // Kiểm tra tài khoản OAuth (không có password)
    if (!user.password) {
        throw new BadRequestException(
            "Tài khoản đăng nhập qua Google không thể đổi mật khẩu"
        );
    }

    // Xác minh mật khẩu hiện tại
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
        throw new BadRequestException("Mật khẩu hiện tại không chính xác");
    }

    // Gán mật khẩu mới (middleware pre-save sẽ tự hash)
    user.password = newPassword;
    await user.save();

    return { message: "Đổi mật khẩu thành công" };
};

/**
 * [AI-ADDED] Chuyển workspace hiện tại của user sang workspace khác mà user là thành viên
 */
export const switchWorkspaceService = async (
    userId: string,
    workspaceId: string
) => {
    // Kiểm tra workspace tồn tại
    const workspace = await WorkspaceModel.findById(workspaceId);
    if (!workspace) {
        throw new NotFoundException("Không tìm thấy workspace");
    }

    // Kiểm tra user có phải là thành viên của workspace không
    const isMember = await MemberModel.exists({ workspaceId, userId });
    if (!isMember) {
        throw new BadRequestException("Bạn không phải là thành viên của workspace này");
    }

    // Cập nhật currentWorkspace
    const user = await UserModel.findByIdAndUpdate(
        userId,
        { currentWorkspace: new mongoose.Types.ObjectId(workspaceId) },
        { new: true }
    )
        .populate("currentWorkspace")
        .select("-password");

    if (!user) {
        throw new NotFoundException("Không tìm thấy user");
    }

    return { user };
};