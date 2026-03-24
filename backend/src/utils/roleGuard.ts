import { PermissionEnumType, RoleEnumType } from "../enums/role.enum";
import { RolePermissions } from "./role-permission";
import { ForbiddenException } from "./appError";

/**
 * Kiểm tra quyền hạn của một vai trò dựa trên danh sách các quyền yêu cầu.
 * Hàm này sử dụng một map (RolePermissions) để xác định xem vai trò được cung cấp có đủ
 * các quyền cần thiết để thực hiện hành động hay không.
 */
export const roleGuard = (
    role: RoleEnumType,
    requiredPermissions: PermissionEnumType[]
) => {
    const rolePermissions = RolePermissions[role];

    if (!rolePermissions) {
        throw new ForbiddenException("Vai trò không hợp lệ trong hệ thống");
    }

    const hasPermission = requiredPermissions.every((perm) =>
        rolePermissions.includes(perm)
    );

    if (!hasPermission) {
        throw new ForbiddenException("Bạn không đủ quyền hạn để thực hiện hành động này");
    }

    return true;
};