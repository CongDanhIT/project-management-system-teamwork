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
    .min(1, "Id dự án phải có ít nhất 1 ký tự")
    .max(255, "Id dự án phải có nhiều nhất 255 ký tự");
export const taskIdSchema = z.string()
    .trim()
    .min(1, "Id task phải có ít nhất 1 ký tự")
    .max(255, "Id task phải có nhiều nhất 255 ký tự");
//---------------------------------------------------------------------
export const createProjectSchema = z.object({
    emoji: emojiSchema,
    name: nameSchema,
    description: descriptionSchema,
    status: statusSchema,
    startDate: dateSchema,
    endDate: dateSchema,
})
export const updateProjectSchema = z.object({
    emoji: emojiSchema,
    name: nameSchema,
    description: descriptionSchema,
    status: statusSchema,
    startDate: dateSchema,
    endDate: dateSchema,
})
