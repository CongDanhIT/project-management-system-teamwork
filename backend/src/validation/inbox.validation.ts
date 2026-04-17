import { z } from "zod";

export const inboxIdSchema = z.string().trim().length(24, "ID không hợp lệ");

export const createDraftSchema = z.object({
    title: z.string().trim().min(1, "Tiêu đề không được để trống").max(255, "Tiêu đề quá dài"),
    description: z.string().trim().optional(),
});

export const promoteDraftSchema = z.object({
    workspaceId: z.string().trim().length(24, "Workspace ID không hợp lệ"),
    projectId: z.string().trim().length(24, "Project ID không hợp lệ"),
    status: z.string().trim().min(1, "Trạng thái không được để trống"),
});
