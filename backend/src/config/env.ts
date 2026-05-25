import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const envSchema = z.object({
    // Sử dụng coerce để tự động chuyển string "8000" thành number 8000
    PORT: z.coerce.number().default(8000),
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    BASE_PATH: z.string().default("/api"),

    MONGO_URI: z.string().min(1, "Bạn chưa cấu hình MONGO_URI trong file .env"),
    SESSION_SECRET: z.string().min(10, "SESSION_SECRET nên dài hơn 10 ký tự"),

    GOOGLE_CLIENT_ID: z.string().min(1, "Thiếu GOOGLE_CLIENT_ID"),
    GOOGLE_CLIENT_SECRET: z.string().min(1, "Thiếu GOOGLE_CLIENT_SECRET"),
    GOOGLE_CALLBACK_URL: z.string().url(),

    FRONTEND_ORIGIN: z.string().url(),
    FRONTEND_GOOGLE_CALLBACK_URL: z.string().url(),

    CLOUDINARY_CLOUD_NAME: z.string().optional(),
    CLOUDINARY_API_KEY: z.string().optional(),
    CLOUDINARY_API_SECRET: z.string().optional(),

    GROQ_API_KEY: z.string().optional(),
    NVIDIA_API_KEY: z.string().optional(),

    // Cloudflare R2
    R2_ACCOUNT_ID: z.string().optional(),
    R2_ACCESS_KEY_ID: z.string().optional(),
    R2_SECRET_ACCESS_KEY: z.string().optional(),
    R2_BUCKET_NAME: z.string().default("teamflow-assets"),
    R2_ENDPOINT: z.string().optional(),

    // SendGrid
    SENDGRID_API_KEY: z.string().optional(),
    SENDGRID_FROM_EMAIL: z.string().optional().default("no-reply@teamflow.com"),
    
    // Slack Integration
    SLACK_WEBHOOK_URL: z.string().optional(),
    SLACK_SIGNING_SECRET: z.string().optional(),
    TOGETHER_API_KEY: z.string().optional(),
});

const envParsed = envSchema.safeParse(process.env);

if (!envParsed.success) {
    console.error("❌ Cấu hình .env không hợp lệ:");
    console.error(envParsed.error.flatten().fieldErrors);
    process.exit(1);
}

// Bổ sung thêm các biến tiện ích dựa trên kết quả đã parse
export const env = {
    ...envParsed.data,
    isDev: envParsed.data.NODE_ENV === "development",
    isProd: envParsed.data.NODE_ENV === "production",
    isTest: envParsed.data.NODE_ENV === "test",
    TOGETHER_API_KEY: process.env.TOGETHER_API_KEY || envParsed.data.TOGETHER_API_KEY,
    // Mapping SendGrid_API_KEY từ .env nếu có
    SENDGRID_API_KEY: process.env.SendGrid_API_KEY || envParsed.data.SENDGRID_API_KEY,
    SENDGRID_FROM_EMAIL: process.env.SENDGRID_FROM_SYSTEM || process.env.SENDGRID_FROM_EMAIL || envParsed.data.SENDGRID_FROM_EMAIL,
};
