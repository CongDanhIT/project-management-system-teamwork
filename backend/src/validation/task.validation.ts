import { z } from "zod";
import { TaskPriorityEnum, TaskStatusEnum } from "../enums/task.enum";

export const titleSchema = z.string()
    .trim()
    .min(1, "Tên task không được để trống")
    .max(255, "Tên task không được quá 255 ký tự");

export const descriptionSchema = z.string()
    .trim()
    .max(5000, "Mô tả không được quá 5000 ký tự")
    .optional();

export const assignedToSchema = z.string()
    .trim()
    .nullable()
    .optional();

export const parentIdSchema = z.string()
    .trim()
    .nullable()
    .optional();

export const dateSchema = z.string()
    .nullable()
    .optional()
    .transform((val) => (val ? new Date(val) : null))
    .refine((date) => date === null || !isNaN(date.getTime()), {
        message: "Định dạng ngày không hợp lệ",
    })
    .optional();

export const hoursSchema = z.number()
    .min(0, "Thời gian không được nhỏ hơn 0")
    .default(0)
    .optional();

export const prioritySchema = z.nativeEnum(TaskPriorityEnum);

export const statusSchema = z.nativeEnum(TaskStatusEnum);

export const createTaskSchema = z.object({
    title: titleSchema,
    description: descriptionSchema,
    priority: prioritySchema,
    status: statusSchema,
    startDate: dateSchema,
    dueDate: dateSchema,
    assignedTo: assignedToSchema,
    parentId: parentIdSchema,
    estimatedHours: hoursSchema,
    loggedHours: hoursSchema,
});

export const updateTaskSchema = z.object({
    title: titleSchema,
    description: descriptionSchema,
    priority: prioritySchema,
    status: statusSchema,
    startDate: dateSchema,
    dueDate: dateSchema,
    assignedTo: assignedToSchema,
    parentId: parentIdSchema,
    estimatedHours: hoursSchema,
    loggedHours: hoursSchema,
}).partial();

export const getTasksQuerySchema = z.object({
    projectId: z.string().optional(),
    parentId: z.string().optional(), // Lọc subtasks
    status: z.string().optional(),
    priority: z.string().optional(),
    assignedTo: z.string().optional(),
    keyword: z.string().optional(),
    dueDate: z.string().optional(),
    pageNumber: z.string().transform((val) => parseInt(val) || 1).optional(),
    pageSize: z.string().transform((val) => parseInt(val) || 10).optional(),
});
