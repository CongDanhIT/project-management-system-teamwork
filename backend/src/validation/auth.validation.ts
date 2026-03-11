import { z } from "zod";

export const emailSchema = z.string().trim().email("Email không hợp lệ").min(1, "Email không được để trống");

export const passwordSchema = z.string().trim().min(6, "Mật khẩu phải có ít nhất 6 ký tự").max(100, "Mật khẩu không được vượt quá 100 ký tự");

export const nameSchema = z.string().trim().min(3, "Tên phải có ít nhất 3 ký tự").max(100, "Tên không được vượt quá 100 ký tự");

export const registerSchema = z.object({
    name: nameSchema,
    email: emailSchema,
    password: passwordSchema,
});

export const loginSchema = z.object({
    email: emailSchema,
    password: passwordSchema,
});
