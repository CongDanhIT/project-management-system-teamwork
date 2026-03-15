import MemberModel from "../models/member.model";
import WorkspaceModel from "../models/workspace.model";
import { NotFoundException } from "../utils/appError";
import RoleModel, { RoleDocument } from "../models/role-permission.model";
import { RoleEnum } from "../enums/role.enum";

// lấy role của member trong workspace
/**
 * Lấy thông tin vai trò (role) của một người dùng trong một không gian làm việc (workspace).
 * Hàm này thực hiện kiểm tra sự tồn tại của workspace và tư cách thành viên của người dùng
 * trước khi trả về các quyền hạn liên quan.
 * 
 * @param {string} workspaceId - ID của không gian làm việc cần kiểm tra.
 * @param {string} userId - ID của người dùng cần lấy vai trò.
 * @returns {Promise<RoleDocument>} - Trả về Document của Role bao gồm danh sách quyền hạn.
 * @throws {NotFoundException} - Ném ra lỗi nếu workspace không tồn tại hoặc người dùng không phải thành viên.
 */
export const getMemberRoleInWorkspace = async (workspaceId: string, userId: string) => {
    const workspace = await WorkspaceModel.findById(workspaceId);
    if (!workspace) {
        throw new NotFoundException("không tìm thấy workspace");
    }
    const member = await MemberModel.findOne({ workspaceId: workspaceId, userId: userId })
        .populate("role").exec();
    if (!member) {
        throw new NotFoundException("không tìm thấy thành viên");
    }
    const role = member.role as unknown as RoleDocument;
    return role;
};

export const joinWorkspaceService = async (inviteCode: string, userId: string) => {
    const workspace = await WorkspaceModel.findOne({ inviteCode: inviteCode });
    if (!workspace) {
        throw new NotFoundException("không tìm thấy workspace");
    }
    const member = await MemberModel.findOne({ workspaceId: workspace._id, userId: userId });
    if (member) {
        throw new NotFoundException("bạn đã là thành viên của workspace");
    }
    const role = await RoleModel.findOne({ name: RoleEnum.MEMBER });
    if (!role) {
        throw new NotFoundException("không tìm thấy role");
    }
    const newMember = new MemberModel({
        workspaceId: workspace._id,
        userId: userId,
        role: role._id,
    });
    await newMember.save();
    return { workspaceId: workspace._id, role: role.name };
};