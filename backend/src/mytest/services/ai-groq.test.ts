/**
 * @file ai-groq.test.ts
 * @description Test kết nối trực tiếp tới Groq API bằng model llama-3.3-70b-versatile
 * Chạy: npx ts-node src/mytest/services/ai-groq.test.ts
 */

import { createGroq } from "@ai-sdk/groq";
import { generateText } from "ai";
import { env } from "../../config/env";
import { AI_MODELS } from "../../services/ai.service";

async function runTest() {
    console.log("=== BẮT ĐẦU TEST KẾT NỐI GROQ API ===");
    console.log("GROQ_API_KEY present:", !!env.GROQ_API_KEY);
    if (env.GROQ_API_KEY) {
        console.log("GROQ_API_KEY prefix:", env.GROQ_API_KEY.substring(0, 8));
    }

    try {
        const groqProvider = createGroq({
            apiKey: env.GROQ_API_KEY,
        });

        console.log("Đang gửi request test tới Groq...");
        const { text } = await generateText({
            model: groqProvider(AI_MODELS.GROQ_LLAMA_3_3_70B),
            prompt: "Hãy trả lời từ 'OK' nếu bạn nhận được tin nhắn này.",
        });

        console.log("✅ KẾT QUẢ THÀNH CÔNG:");
        console.log("AI Phản hồi:", text);
    } catch (error: any) {
        console.error("❌ KẾT QUẢ THẤT BẠI:");
        console.error("Status Code:", error?.status || error?.statusCode);
        console.error("Error Message:", error?.message);
        console.error("Error Details:", JSON.stringify(error, null, 2));
    }
}

runTest();
