import { z } from "zod";

export const nameSchema = z.string()
    .min(3, "Tên không được ít hơn 3 ký tự")
    .max(100, "Tên không được vượt quá 100 ký tự")
    .trim();
export const descriptionSchema = z.string()
    .max(255, "Mô tả không được vượt quá 255 ký tự")
    .optional()
    .nullable();
//----------------------------------------------------

export const createWorkspaceSchema = z.object({
    name: nameSchema,
    description: descriptionSchema,
})

export const updateWorkspaceSchema = z.object({
    name: nameSchema.optional(),
    description: descriptionSchema.optional(),
})

export const WorkSpaceIdSchema = z.string()
    .trim()
    .min(1, "Workspace ID không được để trống");

export const changeWorkSpaceMemberRoleSchema = z.object({
    memberId: z.string()
        .trim()
        .min(1, "Member ID không được để trống"),
    roleId: z.string()
        .trim()
        .min(1, "Role ID không được để trống")
})
