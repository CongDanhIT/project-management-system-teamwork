/**
 * @file ai-together.test.ts
 * @description Test kết nối trực tiếp tới Together AI bằng model meta-llama/Llama-3.3-70B-Instruct-Turbo
 * Chạy: npx ts-node src/mytest/services/ai-together.test.ts
 */

import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import { env } from "../../config/env";
import { AI_MODELS, chatWithContextService } from "../../services/ai.service";

async function runTest() {
    console.log("=== BẮT ĐẦU TEST KẾT NỐI TOGETHER AI ===");
    console.log("TOGETHER_API_KEY present:", !!env.TOGETHER_API_KEY);
    if (env.TOGETHER_API_KEY) {
        console.log("TOGETHER_API_KEY prefix:", env.TOGETHER_API_KEY.substring(0, 8));
    } else {
        console.error("❌ Không tìm thấy TOGETHER_API_KEY trong env!");
        return;
    }

    try {
        const togetherProvider = createOpenAI({
            apiKey: env.TOGETHER_API_KEY,
            baseURL: "https://api.together.ai/v1",
        });

        console.log("1. Đang test qua Vercel AI SDK (generateText)...");
        const { text } = await generateText({
            model: togetherProvider.chat(AI_MODELS.TOGETHER_LLAMA_3_3_70B) as any,
            prompt: "Hãy trả lời duy nhất từ 'OK' nếu bạn là Llama 3.3 từ Together AI và nhận được tin nhắn này.",
        });

        console.log("✅ KẾT QUẢ VERCEL AI SDK THÀNH CÔNG:");
        console.log("AI Phản hồi:", text);

        console.log("\n2. Đang test qua chatWithContextService...");
        const reply = await chatWithContextService(
            "Xin chào, dự án này tên là gì vậy AI?",
            [],
            {
                projectName: "Hệ thống Quản lý TeamFlow",
                totalTasks: 10,
                doneTasks: 4
            },
            AI_MODELS.GROQ_LLAMA_3_3_70B // Sẽ tự động trỏ về Together Llama 3.3
        );

        console.log("✅ KẾT QUẢ CHAT WITH CONTEXT THÀNH CÔNG:");
        console.log("AI Phản hồi:", reply);

        console.log("\n3. Đang test streamText với Tool Calling...");
        const { streamText } = require("ai");
        const { z } = require("zod");
        const result = await streamText({
            model: togetherProvider.chat(AI_MODELS.TOGETHER_LLAMA_3_3_70B) as any,
            system: "Bạn là AI hỗ trợ dự án.",
            messages: [{ role: "user", content: "Hãy viết một câu chào ngắn gọn." }],
            tools: {
                getWorkspaceProjects: {
                    description: "Lấy danh sách các dự án trong Workspace.",
                    parameters: z.object({}),
                    execute: async () => {
                        console.log("-> Tool getWorkspaceProjects được gọi bởi AI!");
                        return [{ name: "Dự án A" }, { name: "Dự án B" }];
                    }
                }
            },
            maxSteps: 5,
        });

        console.log("Result keys:", Object.keys(result));
        console.log("Result proto keys:", Object.getOwnPropertyNames(Object.getPrototypeOf(result)));
        console.log("Đang nhận stream chunk...");
        for await (const chunk of result.fullStream) {
            console.log("Chunk type:", chunk.type, "Keys:", Object.keys(chunk));
            if (chunk.type === "text-delta" && (chunk as any).textDelta) {
                process.stdout.write((chunk as any).textDelta);
            }
        }
        console.log("\n✅ Hoàn tất test 3.");

    } catch (error: any) {
        console.error("❌ KẾT QUẢ THẤT BẠI:");
        console.error("Status Code:", error?.status || error?.statusCode);
        console.error("Error Message:", error?.message);
        console.error("Error Details:", JSON.stringify(error, null, 2));
    }
}

runTest();
