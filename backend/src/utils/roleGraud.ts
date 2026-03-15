import { PermissionEnumType, RoleEnumType } from "../enums/role.enum";
import { RolePermissions } from "./role-permission";
import { UnauthorizedException } from "./appError";

/**
 * Kiểm tra quyền hạn của một vai trò dựa trên danh sách các quyền yêu cầu.
 * Hàm này sử dụng một map (RolePermissions) để xác định xem vai trò được cung cấp có đủ
 * các quyền cần thiết để thực hiện hành động hay không.
 * 
 * @param {RoleEnumType} role - Vai trò cần kiểm tra (ví dụ: 'owner', 'admin', 'member').
 * @param {PermissionEnumType[]} requiredPermissions - Mảng các quyền hạn bắt buộc phải có.
 * @returns {boolean} - Trả về true nếu vai trò có đủ quyền.
 * @throws {UnauthorizedException} - Ném ra lỗi nếu vai trò không tồn tại hoặc không có đủ quyền.
 */
export const roleGuard = (
    role: RoleEnumType,
    requiredPermissions: PermissionEnumType[]
) => {
    const rolePermissions = RolePermissions[role];

    if (!rolePermissions) {
        throw new UnauthorizedException("Vai trò không hợp lệ trong hệ thống");
    }

    const hasPermission = requiredPermissions.every((perm) =>
        rolePermissions.includes(perm)
    );

    if (!hasPermission) {
        throw new UnauthorizedException("Bạn không có quyền thực hiện hành động này");
    }

    return true;
};