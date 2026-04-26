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
    description: z.string().nullable().optional(),
    slackWebhookUrl: z.string().url("Link Slack không đúng định dạng").nullable().optional(),
    dailyDigestEnabled: z.boolean().optional(),
});

export const WorkSpaceIdSchema = z.string()
    .trim()
    .regex(/^[0-9a-fA-F]{24}$/, "ID không gian làm việc không hợp lệ");

export const changeWorkSpaceMemberRoleSchema = z.object({
    memberId: z.string()
        .trim()
        .regex(/^[0-9a-fA-F]{24}$/, "ID thành viên không hợp lệ"),
    roleId: z.string()
        .trim()
        .regex(/^[0-9a-fA-F]{24}$/, "ID vai trò không hợp lệ")
})
