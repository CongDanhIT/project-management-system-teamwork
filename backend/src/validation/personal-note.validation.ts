import { z } from "zod";

export const noteIdSchema = z.string().trim().length(24, "ID không hợp lệ");

export const createNoteSchema = z.object({
    workspaceId: z.string().trim().length(24, "Workspace ID không hợp lệ"),
    title: z.string().trim().min(1, "Tiêu đề không được để trống").max(255, "Tiêu đề quá dài"),
    description: z.string().trim().optional(),
    color: z.string().trim().optional(),
    isPinned: z.boolean().optional(),
});

export const updateNoteSchema = z.object({
    title: z.string().trim().min(1, "Tiêu đề không được để trống").max(255, "Tiêu đề quá dài").optional(),
    description: z.string().trim().optional(),
    color: z.string().trim().optional(),
    isPinned: z.boolean().optional(),
});
