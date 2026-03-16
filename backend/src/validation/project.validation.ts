import { z } from "zod";

export const emojiSchema = z
    .string().trim().optional();

export const nameSchema = z
    .string().trim().min(1, "Tên dự án phải có ít nhất 1 ký tự")
    .max(255, "Tên dự án phải có nhiều nhất 255 ký tự");

export const descriptionSchema = z
    .string().trim()
    .min(3, "Mô tả dự án phải có ít nhất 3 ký tự")
    .max(255, "Mô tả dự án phải có nhiều nhất 255 ký tự")
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
})
export const updateProjectSchema = z.object({
    emoji: emojiSchema,
    name: nameSchema,
    description: descriptionSchema,
})
