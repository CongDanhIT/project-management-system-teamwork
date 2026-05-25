/**
 * @file ai-agent.test.ts
 * @description Test cuộc gọi streamAgentChatService để tìm ra lỗi chi tiết của AI Agent.
 * Chạy: npx ts-node src/mytest/services/ai-agent.test.ts
 */

import { connectDatabase } from "../../config/database.config";
import { streamAgentChatService } from "../../services/ai.service";
import mongoose from "mongoose";

async function runTest() {
    console.log("=== BẮT ĐẦU TEST AI AGENT SERVICE ===");
    try {
        await connectDatabase();
        console.log("Đã kết nối DB.");

        const messages = [
            { role: "user", content: "lấy cho tôi danh sách công việc của tôi trong tháng này" }
        ];

        console.log("Đang gọi streamAgentChatService với Groq Compound...");
        const result = await streamAgentChatService({
            messages,
            userId: "69b2c66230b6f7c0ec6a2d62",
            workspaceId: "69b407a8b54147306942b630",
            modelId: "groq/compound"
        });

        console.log("Đang đọc stream kết quả...");
        const reader = result.fullStream.getReader();
        let done = false;
        
        while (!done) {
            const { value, done: doneReading } = await reader.read();
            done = doneReading;
            if (value) {
                console.log("Chunk nhận được:", JSON.stringify(value, null, 2));
            }
        }
        console.log("✅ Đọc stream hoàn tất thành công!");

    } catch (error: any) {
        console.error("❌ TEST THẤT BẠI:");
        console.error("Error Message:", error?.message);
        console.error("Error Stack:", error?.stack);
        console.error("Error Details:", error);
    } finally {
        await mongoose.disconnect();
        console.log("Đã ngắt kết nối DB.");
    }
}

runTest();
