import { RoleEnum, Permissions, RoleEnumType, PermissionEnumType } from "../enums/role.enum";

export const RolePermissions: Record<RoleEnumType, PermissionEnumType[]> = {
    [RoleEnum.OWNER]: [
        Permissions.CREATE_WORKSPACE,
        Permissions.DELETE_WORKSPACE,
        Permissions.EDIT_WORKSPACE,
        Permissions.MANAGE_WORKSPACE_SETTINGS,

        Permissions.ADD_MEMBER,
        Permissions.CHANGE_MEMBER_ROLE,
        Permissions.REMOVE_MEMBER,

        Permissions.CREATE_PROJECT,
        Permissions.EDIT_PROJECT,
        Permissions.DELETE_PROJECT,

        Permissions.CREATE_TASK,
        Permissions.EDIT_TASK,
        Permissions.DELETE_TASK,

        Permissions.VIEW_ONLY,
    ],
    [RoleEnum.ADMIN]: [
        Permissions.ADD_MEMBER,
        //Permissions.REMOVE_MEMBER,

        Permissions.EDIT_PROJECT,
        Permissions.CREATE_PROJECT,
        Permissions.DELETE_PROJECT,

        Permissions.CREATE_TASK,
        Permissions.EDIT_TASK,
        Permissions.DELETE_TASK,

        Permissions.MANAGE_WORKSPACE_SETTINGS,
        Permissions.VIEW_ONLY,
    ],
    [RoleEnum.MEMBER]: [


        Permissions.CREATE_TASK,
        Permissions.EDIT_TASK,

        Permissions.VIEW_ONLY,
    ],

};
