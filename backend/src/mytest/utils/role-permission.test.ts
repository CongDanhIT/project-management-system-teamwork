/**
 * @file role-permission.test.ts
 * @description Test thủ công cho RolePermissions
 * Chạy: npx ts-node src/mytest/utils/role-permission.test.ts
 */

import { RolePermissions } from "../../utils/role-permission";
import { RoleEnum, Permissions } from "../../enums/role.enum";

// ============================================================
// Tiện ích test đơn giản (không cần framework)
// ============================================================
let passed = 0;
let failed = 0;

function expect(testName: string, condition: boolean): void {
    if (condition) {
        console.log(`  ✅ PASS: ${testName}`);
        passed++;
    } else {
        console.error(`  ❌ FAIL: ${testName}`);
        failed++;
    }
}

function describe(suiteName: string, fn: () => void): void {
    console.log(`\n📦 ${suiteName}`);
    console.log("─".repeat(50));
    fn();
}

function printSummary(): void {
    console.log("\n" + "═".repeat(50));
    console.log(`📊 KẾT QUẢ: ${passed} passed | ${failed} failed`);
    console.log("═".repeat(50));
    if (failed > 0) process.exit(1);
}

// ============================================================
// HELPER: Kiểm tra xem role có quyền hay không
// ============================================================
function hasPermission(
    role: keyof typeof RolePermissions,
    permission: string
): boolean {
    return (RolePermissions[role] as string[]).includes(permission);
}

// ============================================================
// TEST SUITE 1: Kiểm tra OWNER
// ============================================================
describe("OWNER - Có đầy đủ quyền cao nhất", () => {
    expect(
        "OWNER có quyền CREATE_WORKSPACE",
        hasPermission(RoleEnum.OWNER, Permissions.CREATE_WORKSPACE)
    );
    expect(
        "OWNER có quyền DELETE_WORKSPACE",
        hasPermission(RoleEnum.OWNER, Permissions.DELETE_WORKSPACE)
    );
    expect(
        "OWNER có quyền ADD_MEMBER",
        hasPermission(RoleEnum.OWNER, Permissions.ADD_MEMBER)
    );
    expect(
        "OWNER có quyền CHANGE_MEMBER_ROLE",
        hasPermission(RoleEnum.OWNER, Permissions.CHANGE_MEMBER_ROLE)
    );
    expect(
        "OWNER có quyền CREATE_PROJECT",
        hasPermission(RoleEnum.OWNER, Permissions.CREATE_PROJECT)
    );
    expect(
        "OWNER có quyền DELETE_PROJECT",
        hasPermission(RoleEnum.OWNER, Permissions.DELETE_PROJECT)
    );
    expect(
        "OWNER có quyền CREATE_TASK",
        hasPermission(RoleEnum.OWNER, Permissions.CREATE_TASK)
    );
    expect(
        "OWNER có quyền VIEW_ONLY",
        hasPermission(RoleEnum.OWNER, Permissions.VIEW_ONLY)
    );
});

// ============================================================
// TEST SUITE 2: Kiểm tra ADMIN
// ============================================================
describe("ADMIN - Có quyền quản lý nhưng KHÔNG có quyền Workspace toàn phần", () => {
    expect(
        "ADMIN có quyền ADD_MEMBER",
        hasPermission(RoleEnum.ADMIN, Permissions.ADD_MEMBER)
    );
    expect(
        "ADMIN có quyền REMOVE_MEMBER",
        hasPermission(RoleEnum.ADMIN, Permissions.REMOVE_MEMBER)
    );
    expect(
        "ADMIN có quyền MANAGE_WORKSPACE_SETTINGS",
        hasPermission(RoleEnum.ADMIN, Permissions.MANAGE_WORKSPACE_SETTINGS)
    );
    expect(
        "ADMIN KHÔNG có quyền DELETE_WORKSPACE",
        !hasPermission(RoleEnum.ADMIN, Permissions.DELETE_WORKSPACE)
    );
    expect(
        "ADMIN KHÔNG có quyền CREATE_WORKSPACE",
        !hasPermission(RoleEnum.ADMIN, Permissions.CREATE_WORKSPACE)
    );
    expect(
        "ADMIN KHÔNG có quyền CHANGE_MEMBER_ROLE",
        !hasPermission(RoleEnum.ADMIN, Permissions.CHANGE_MEMBER_ROLE)
    );
    expect(
        "ADMIN có quyền CREATE_TASK",
        hasPermission(RoleEnum.ADMIN, Permissions.CREATE_TASK)
    );
    expect(
        "ADMIN có quyền VIEW_ONLY",
        hasPermission(RoleEnum.ADMIN, Permissions.VIEW_ONLY)
    );
});

// ============================================================
// TEST SUITE 3: Kiểm tra MEMBER
// ============================================================
describe("MEMBER - Chỉ có quyền tạo/sửa/xóa Task và xem", () => {
    expect(
        "MEMBER có quyền CREATE_TASK",
        hasPermission(RoleEnum.MEMBER, Permissions.CREATE_TASK)
    );
    expect(
        "MEMBER có quyền EDIT_TASK",
        hasPermission(RoleEnum.MEMBER, Permissions.EDIT_TASK)
    );
    expect(
        "MEMBER có quyền DELETE_TASK",
        hasPermission(RoleEnum.MEMBER, Permissions.DELETE_TASK)
    );
    expect(
        "MEMBER có quyền VIEW_ONLY",
        hasPermission(RoleEnum.MEMBER, Permissions.VIEW_ONLY)
    );
    expect(
        "MEMBER KHÔNG có quyền ADD_MEMBER",
        !hasPermission(RoleEnum.MEMBER, Permissions.ADD_MEMBER)
    );
    expect(
        "MEMBER KHÔNG có quyền DELETE_WORKSPACE",
        !hasPermission(RoleEnum.MEMBER, Permissions.DELETE_WORKSPACE)
    );
    expect(
        "MEMBER KHÔNG có quyền CREATE_PROJECT",
        !hasPermission(RoleEnum.MEMBER, Permissions.CREATE_PROJECT)
    );
    expect(
        "MEMBER KHÔNG có quyền MANAGE_WORKSPACE_SETTINGS",
        !hasPermission(RoleEnum.MEMBER, Permissions.MANAGE_WORKSPACE_SETTINGS)
    );
});

// ============================================================
// TEST SUITE 4: Kiểm tra cấu trúc tổng thể
// ============================================================
describe("Cấu trúc RolePermissions", () => {
    expect(
        "RolePermissions có key OWNER",
        RoleEnum.OWNER in RolePermissions
    );
    expect(
        "RolePermissions có key ADMIN",
        RoleEnum.ADMIN in RolePermissions
    );
    expect(
        "RolePermissions có key MEMBER",
        RoleEnum.MEMBER in RolePermissions
    );
    expect(
        "Quyền của OWNER phải là array",
        Array.isArray(RolePermissions[RoleEnum.OWNER])
    );
    expect(
        "OWNER phải có nhiều quyền hơn MEMBER",
        RolePermissions[RoleEnum.OWNER].length > RolePermissions[RoleEnum.MEMBER].length
    );
});

// In kết quả cuối
printSummary();
