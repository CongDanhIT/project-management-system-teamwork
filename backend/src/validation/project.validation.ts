import { z } from "zod";
import { ProjectStatusEnum } from "../enums/projectStatus.enum";

export const emojiSchema = z
    .string().trim().optional();

export const nameSchema = z
    .string().trim().min(1, "Tên dự án phải có ít nhất 1 ký tự")
    .max(255, "Tên dự án phải có nhiều nhất 255 ký tự");

export const descriptionSchema = z
    .string().trim()
    .max(255, "Mô tả dự án phải có nhiều nhất 255 ký tự")
    .optional();

export const statusSchema = z.nativeEnum(ProjectStatusEnum).optional();

export const dateSchema = z.string()
    .transform((val) => (val ? new Date(val) : null))
    .refine((date) => date === null || !isNaN(date.getTime()), {
        message: "Định dạng ngày không hợp lệ",
    })
    .optional();

export const projectIdSchema = z.string()
    .trim()
    .regex(/^[0-9a-fA-F]{24}$/, "ID dự án không hợp lệ");

export const taskIdSchema = z.string()
    .trim()
    .regex(/^[0-9a-fA-F]{24}$/, "ID nhiệm vụ không hợp lệ");
//---------------------------------------------------------------------
export const createProjectSchemaV2 = z.object({
    emoji: emojiSchema,
    name: nameSchema,
    description: descriptionSchema,
    status: statusSchema,
    startDate: dateSchema,
    endDate: dateSchema,
    coverUrl: z.any().optional().nullable(),
    coverPositionX: z.number().min(0).max(100).default(50).optional(),
    coverPositionY: z.number().min(0).max(100).default(50).optional(),
    isAutoTaggingEnabled: z.boolean().optional(),
});

export const updateProjectSchemaV2 = z.object({
    emoji: emojiSchema,
    name: nameSchema,
    description: descriptionSchema,
    status: statusSchema,
    startDate: dateSchema,
    endDate: dateSchema,
    coverUrl: z.any().optional().nullable(),
    coverPositionX: z.number().min(0).max(100).optional(),
    coverPositionY: z.number().min(0).max(100).optional(),
    isAutoTaggingEnabled: z.boolean().optional(),
});
