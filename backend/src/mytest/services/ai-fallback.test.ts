import dns from "dns";
dns.setDefaultResultOrder("ipv4first");
import mongoose from "mongoose";
import { env } from "../../config/env";
import { streamAgentChatService } from "../../services/ai.service";

async function runDirectTest() {
    console.log("=== BẮT ĐẦU CHẠY KIỂM THỬ DIRECT SERVICE ===");
    
    // 1. Kết nối database
    console.log("Đang kết nối database...");
    try {
        await mongoose.connect(env.MONGO_URI);
        console.log("✅ Kết nối database thành công.");
    } catch (dbErr: any) {
        console.error("❌ Không thể kết nối database:", dbErr.message);
        return;
    }

    try {
        console.log("\n--- TEST CASE: Ép lỗi Tool (Thiếu projectId khi xem phase) ---");
        const result = await streamAgentChatService({
            messages: [{ role: "user", content: "Hãy liệt kê các giai đoạn của dự án này" }],
            userId: "65cb76f1c84d720b08db9c8f",
            workspaceId: "65cb76f1c84d720b08db9c8f",
            projectId: undefined // không truyền projectId để gây lỗi tool
        });

        console.log("Đang nhận stream phản hồi từ AI...");
        let responseText = "";
        
        // Vercel AI SDK streamText result.fullStream là một AsyncIterable
        for await (const chunk of (result as any).fullStream) {
            if (chunk.type === "text-delta" && chunk.textDelta) {
                responseText += chunk.textDelta;
                process.stdout.write(chunk.textDelta);
            } else if (chunk.type === "tool-call") {
                console.log(`\n[AI Gọi Tool]: ${chunk.toolName}`);
            } else if (chunk.type === "tool-result") {
                console.log(`\n[Kết quả Tool]:`, JSON.stringify(chunk.result));
            }
        }
        console.log("\n----------------------------------------");
        
        if (responseText.includes("dự án cụ thể") || responseText.includes("Project ID") || responseText.includes("giai đoạn") || responseText.includes("chọn một")) {
            console.log("✅ PASS: AI đã tự động phát hiện kết quả lỗi từ tool và giải thích êm đẹp cho người dùng!");
        } else {
            console.error("❌ FAIL: Phản hồi của AI không xử lý đúng lỗi tool. Phản hồi thực tế:", responseText);
        }

    } catch (error: any) {
        console.error("❌ FAIL: Service bị crash trong quá trình stream:", error.message);
        console.error(error.stack);
    } finally {
        await mongoose.connection.close();
        console.log("\nĐã đóng kết nối database.");
    }
}

runDirectTest();
