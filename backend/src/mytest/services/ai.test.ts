/**
 * @file ai.test.ts
 * @description Test thủ công cho ai.service.ts
 * Chạy: npx ts-node src/mytest/services/ai.test.ts
 */

import dotenv from "dotenv";
dotenv.config();

import connectDatabase from "../../config/database.config";
import { streamAgentChatService } from "../../services/ai.service";

const run = async () => {
    try {
        console.log("Đang kết nối Database...");
        await connectDatabase();
        console.log("Kết nối Database thành công!");

        console.log("Khởi chạy streamAgentChatService...");
        const result = await streamAgentChatService({
            messages: [
                { role: "user", content: "xin chào" }
            ],
            userId: "69b2c66230b6f7c0ec6a2d62",
            workspaceId: "69b407a8b54147306942b630"
        });

        console.log("Nhận stream từ AI:");
        console.log("--------------------");
        // Đọc stream text
        for await (const textPart of result.textStream) {
            process.stdout.write(textPart);
        }
        console.log("\n--------------------");
        console.log("Stream hoàn tất!");
        process.exit(0);
    } catch (error: any) {
        console.error("LỖI KHI CHẠY TEST:", error);
        process.exit(1);
    }
};

run();
