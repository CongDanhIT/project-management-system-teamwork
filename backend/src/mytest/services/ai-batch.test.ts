import dns from "dns";
dns.setDefaultResultOrder("ipv4first");
import mongoose from "mongoose";
import { env } from "../../config/env";
import { streamAgentChatService } from "../../services/ai.service";
import ProjectModel from "../../models/project.model";
import PhaseModel from "../../models/phase.model";
import TaskModel from "../../models/task.model";

async function runBatchTest() {
    console.log("=== BẮT ĐẦU CHẠY KIỂM THỬ BATCH OPERATIONS ===");
    
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
        // 2. Lấy dữ liệu thật trong DB để làm ngữ cảnh test
        const project = await ProjectModel.findOne({ deletedAt: null }).lean();
        if (!project) {
            console.error("❌ Không tìm thấy dự án nào trong Database để chạy test.");
            return;
        }
        
        const phase = await PhaseModel.findOne({ projectId: project._id, deletedAt: null }).lean();
        if (!phase) {
            console.error("❌ Không tìm thấy giai đoạn (phase) nào cho dự án", project.name);
            return;
        }

        console.log(`Ngữ cảnh test:`);
        console.log(`- Project: ${project.name} (${project._id})`);
        console.log(`- Phase: ${phase.name} (${phase._id})`);

        // 3. Gọi AI yêu cầu tạo 2 task hàng loạt
        const userPrompt = `Hãy tạo 2 công việc sau đây trong giai đoạn "${phase.name}" (ID giai đoạn là ${phase._id}):
1. "Họp review code hàng tuần" - Mô tả: "Họp đánh giá chất lượng mã nguồn"
2. "Viết tài liệu API V2" - Mô tả: "Viết đặc tả swagger cho bot"`;

        console.log("\nYêu cầu gửi lên AI:", userPrompt);
        console.log("Đang gửi yêu cầu và nhận stream phản hồi...");

        const result = await streamAgentChatService({
            messages: [{ role: "user", content: userPrompt }],
            userId: "65cb76f1c84d720b08db9c8f",
            workspaceId: project.workspaceId.toString(),
            projectId: project._id.toString()
        });

        let responseText = "";
        let toolCallDetected = false;
        let batchSize = 0;

        for await (const chunk of (result as any).fullStream) {
            if (chunk.type === "text-delta" && chunk.textDelta) {
                responseText += chunk.textDelta;
                process.stdout.write(chunk.textDelta);
            } else if (chunk.type === "tool-call") {
                toolCallDetected = true;
                console.log(`\n[AI Gọi Tool]: ${chunk.toolName}`);
                console.log(`[Tham số Tool]:`, JSON.stringify(chunk.args, null, 2));
                if (chunk.toolName === "createTask" && chunk.args?.tasks) {
                    batchSize = chunk.args.tasks.length;
                }
            } else if (chunk.type === "tool-result") {
                console.log(`\n[Kết quả Tool]:`, JSON.stringify(chunk.result, null, 2));
            }
        }
        console.log("\n----------------------------------------");

        // 4. Đánh giá kết quả
        if (toolCallDetected && batchSize >= 2) {
            console.log(`✅ PASS: AI đã tự động phát hiện yêu cầu hàng loạt và gọi tool createTask với mảng ${batchSize} phần tử!`);
        } else if (toolCallDetected && batchSize === 1) {
            console.warn(`⚠️ CẢNH BÁO: AI đã gọi tool createTask nhưng chỉ truyền 1 phần tử (AI gọi tuần tự hoặc gom nhóm sai).`);
        } else {
            console.error(`❌ FAIL: AI không gọi tool createTask hàng loạt. Phản hồi của AI:`, responseText);
        }

    } catch (error: any) {
        console.error("❌ FAIL: Crash trong quá trình test:", error.message);
        console.error(error.stack);
    } finally {
        await mongoose.connection.close();
        console.log("\nĐã đóng kết nối database.");
    }
}

runBatchTest();
