import mongoose from "mongoose";
import logger from "../utils/logger";

import { RoleEnum } from "../enums/role.enum";
import MemberModel from "../models/member.model";
import RoleModel from "../models/role-permission.model";
import UserModel from "../models/user.model";
import WorkspaceModel from "../models/workspace.model";
import { BadRequestException, NotFoundException } from "../utils/appError";
import TaskModel from "../models/task.model";
import { TaskStatusEnum } from "../enums/task.enum";
import ProjectModel from "../models/project.model";
// tạo workspace
export const createWorkspaceService = async (userId: string, body: {
    name: string;
    description?: string | null | undefined;
}) => {
    // 1. Khởi tạo session để quản lý Transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // 2. Kiểm tra User tồn tại (sử dụng session)
        const user = await UserModel.findById(userId).session(session);
        if (!user) {
            logger.error("Không tìm thấy user khi tạo workspace", { userId });
            throw new NotFoundException("User not found");
        }

        // 3. Lấy Role Owner (sử dụng session)
        const ownerRole = await RoleModel.findOne({ name: RoleEnum.OWNER }).session(session);
        if (!ownerRole) {
            logger.error("Không tìm thấy vai trò OWNER trong DB");
            throw new NotFoundException("Vai trò OWNER không tồn tại");
        }

        // 4. Tạo Workspace mới
        const workspace = new WorkspaceModel({
            name: body.name,
            description: body.description,
            owner: userId,
        });
        await workspace.save({ session });
        logger.debug("Đã lưu workspace mới", { workspaceId: workspace._id });

        // 5. Tạo bản ghi Member (là người sở hữu workspace)
        const member = new MemberModel({
            workspaceId: workspace._id,
            userId: userId,
            role: ownerRole._id,
            joinedAt: new Date(),
        });
        await member.save({ session });
        logger.debug("Đã lưu member owner");

        // 6. Cập nhật currentWorkspace cho User
        user.currentWorkspace = workspace._id as mongoose.Types.ObjectId;
        await user.save({ session });
        logger.debug("Đã cập nhật currentWorkspace cho user");

        // 7. Chốt hạ Transaction thành công
        await session.commitTransaction();
        logger.info("Tạo workspace thành công qua transaction", { workspaceId: workspace._id, userId });

        return workspace;

    } catch (error) {
        // 8. Nếu bất kỳ bước nào lỗi -> Rollback (Hủy) toàn bộ
        logger.error("Lỗi trong transaction tạo workspace", { error });
        await session.abortTransaction();
        throw error;
    } finally {
        // 9. Luôn kết thúc session để giải phóng tài nguyên
        session.endSession();
    }
};
// lấy tất cả workspace của user
export const getAllWorkspaceIsMemberService = async (userId: string) => {
    const user = await UserModel.findById(userId);
    if (!user) {
        throw new NotFoundException("User not found");
    }
    const memberShip = await MemberModel.find({ userId: userId })
        .populate("workspaceId").exec();
    const workspace = memberShip.map((member) => member.workspaceId);
    return workspace;
};
// lấy thông tin workspace theo id
export const getWorkspaceByIdService = async (workspaceId: string, userId: string) => {
    const workspace = await WorkspaceModel.findById(workspaceId);
    if (!workspace) {
        throw new NotFoundException("Workspace not found");
    }
    const member = await MemberModel.find({ workspaceId: workspaceId })
        .populate("role").exec();
    const WorkspaceWithMember = {
        ...workspace.toObject(),
        member
    };
    return WorkspaceWithMember;
};
// lấy tất cả member trong workspace
export const getWorkspaceMemberService = async (workspaceId: string) => {
    // 1. Lấy danh sách thành viên và populate thông tin User + Role
    const members = await MemberModel.find({ workspaceId: workspaceId })
        .populate("userId", "name email profilePicture") // Chỉ lấy các trường cần thiết của User
        .populate("role", "name") // Lấy tên của Role (Owner, Admin, Member)
        .lean();

    // 2. Lấy danh sách toàn bộ các Role hiện có trong hệ thống (để Frontend dùng cho Dropdown)
    const roles = await RoleModel.find({}, "name _id").lean();

    return { members, roles };
};
// lấy thông tin analytics trong workspace
export const getWorkspaceAnalyticsService = async (workspaceId: string) => {
    const currentDate = new Date();
    const twentyFourHoursLater = new Date(currentDate.getTime() + (24 * 60 * 60 * 1000));

    // Dùng Promise.all để chạy 4 truy vấn song song - Tốc độ nhanh gấp 4 lần
    const [totalTasks, overdueTasks, completedTasks, nearDueDateTasks] = await Promise.all([
        TaskModel.countDocuments({ workspaceId: workspaceId }),

        TaskModel.countDocuments({
            workspaceId: workspaceId,
            dueDate: { $lt: currentDate },
            status: { $ne: TaskStatusEnum.DONE }
        }),

        TaskModel.countDocuments({
            workspaceId: workspaceId,
            status: TaskStatusEnum.DONE
        }),

        TaskModel.find({
            workspaceId: workspaceId,
            dueDate: {
                $gte: currentDate,
                $lte: twentyFourHoursLater
            },
            status: { $ne: TaskStatusEnum.DONE }
        }).sort({ dueDate: 1 })
    ]);

    const analytics = {
        totalTasks,
        overdueTasks,
        completedTasks,
        nearDueDateTasks,
        summary: {
            completionRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0
        }
    };
    // Trả về một object chứa toàn bộ thông tin
    return analytics;
};
// thay đổi vai trò của thành viên trong workspace
export const changeMemberRoleService = async (workspaceId: string, memberId: string, roleId: string) => {
    // Chạy song song việc tìm Role và Member,workspace để tối ưu tốc độ
    const [role, member, workspace] = await Promise.all([
        RoleModel.findById(roleId),
        MemberModel.findOne({ workspaceId, userId: memberId }),
        WorkspaceModel.findById(workspaceId)
    ]);

    if (!role) {
        throw new NotFoundException("Role not found");
    }
    if (!member) {
        throw new NotFoundException("Member not found");
    }
    if (!workspace) {
        throw new NotFoundException("Workspace not found");
    }

    member.role = roleId as any;
    await member.save();

    // Trả về member kèm thông tin role mới đã được populate
    return member.populate("role");
};
//cập nhật workspace
export const updateWorkspaceByIdService = async (workspaceId: string, name?: string, description?: string | null) => {
    const workspace = await WorkspaceModel.findById(workspaceId);
    if (!workspace) {
        throw new NotFoundException("không tìm thấy workspace");
    }
    if (name !== undefined) {
        workspace.name = name;
    }

    if (description !== undefined) {
        workspace.description = description;
    }
    await workspace.save();
    return workspace;
};
// xóa workspace
export const deleteWorkspaceByIdService = async (workspaceId: string, userId: string) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const workspace = await WorkspaceModel.findById(workspaceId).session(session);
        if (!workspace) {
            throw new NotFoundException("không tìm thấy workspace");
        }
        if (workspace.owner.toString() !== userId) {
            throw new BadRequestException("Bạn không có quyền xóa workspace");
        }
        const user = await UserModel.findById(userId).session(session);
        if (!user) {
            throw new NotFoundException("không tìm thấy user");
        }
        await ProjectModel.deleteMany({ workspaceId: workspaceId }).session(session);
        await TaskModel.deleteMany({ workspaceId: workspaceId }).session(session);
        await MemberModel.deleteMany({ workspaceId: workspaceId }).session(session);
        //update the user's currentWorkspace if  it matches the workspaceId
        if (user.currentWorkspace?.toString() === workspaceId) {
            const memberWorkspace = await MemberModel.findOne({ userId: userId }).session(session);
            user.currentWorkspace = memberWorkspace ? memberWorkspace.workspaceId : null;
            await user.save({ session });
        }
        await workspace.deleteOne({ session });
        await session.commitTransaction();
        return user.currentWorkspace;
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
};
// [AI-ADDED] Tạo lại invite code mới cho workspace (dùng khi muốn vô hiệu hóa code cũ)
export const resetInviteCodeService = async (workspaceId: string, requesterId: string) => {
    const workspace = await WorkspaceModel.findById(workspaceId);
    if (!workspace) {
        throw new NotFoundException("Không tìm thấy workspace");
    }
    // Dùng method resetInviteCode đã có sẵn trên model
    workspace.resetInviteCode();
    await workspace.save();
    return { inviteCode: workspace.inviteCode };
};

// [AI-ADDED] Xóa một thành viên khỏi workspace (kick member)
export const removeMemberFromWorkspaceService = async (
    workspaceId: string,
    memberId: string
) => {
    const workspace = await WorkspaceModel.findById(workspaceId);
    if (!workspace) {
        throw new NotFoundException("Không tìm thấy workspace");
    }

    // Tìm bản ghi member theo userId (memberId ở đây là userId của người bị kick)
    const member = await MemberModel.findOne({ workspaceId, userId: memberId });
    if (!member) {
        throw new NotFoundException("Thành viên không tồn tại trong workspace");
    }

    // Không cho phép kick owner của workspace
    if (workspace.owner.toString() === memberId) {
        throw new BadRequestException("Không thể xóa chủ sở hữu khỏi workspace");
    }

    await MemberModel.deleteOne({ workspaceId, userId: memberId });
    return { memberId };
};
