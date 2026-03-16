import { z } from "zod";
import { TaskPriorityEnum, TaskStatusEnum } from "../enums/task.enum";

export const titleSchema = z.string()
    .trim()
    .min(1, "Tên task không được để trống")
    .max(100, "Tên task không được quá 100 ký tự");

export const descriptionSchema = z.string()
    .trim()
    .max(1000, "Mô tả không được quá 1000 ký tự")
    .optional();
export const assignedToSchema = z.string()
    .trim()
    .nullable()
    .optional();
export const dueDateSchema = z.string().trim().optional()
    .refine((val) => {
        return !val || !isNaN(Date.parse(val));
    }, "Ngày hết hạn không hợp lệ");

export const prioritySchema = z.nativeEnum(TaskPriorityEnum);

export const statusSchema = z.nativeEnum(TaskStatusEnum);

export const createTaskSchema = z.object({
    title: titleSchema,
    description: descriptionSchema,
    priority: prioritySchema,
    status: statusSchema,
    dueDate: dueDateSchema,
    assignedTo: assignedToSchema,
});

export const updateTaskSchema = createTaskSchema.partial();

export const getTasksQuerySchema = z.object({
    projectId: z.string().optional(),
    status: z.string().optional(),
    priority: z.string().optional(),
    assignedTo: z.string().optional(),
    keyword: z.string().optional(),
    dueDate: z.string().optional(),
    pageNumber: z.string().transform((val) => parseInt(val) || 1).optional(),
    pageSize: z.string().transform((val) => parseInt(val) || 10).optional(),
});
