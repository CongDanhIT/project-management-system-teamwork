/**
 * @file workspace.test.ts
 * @description Test thủ công cho getWorkspaceAnalyticsHistoryService với bộ lọc thời gian
 * Chạy: npx ts-node src/mytest/services/workspace.test.ts
 */

import dotenv from "dotenv";
import path from "path";

// Load environment variables từ file .env ở thư mục backend
dotenv.config({ path: path.join(__dirname, "../../../.env") });

import { connectDatabase } from "../../config/database.config";
import mongoose from "mongoose";
import WorkspaceModel from "../../models/workspace.model";
import { getWorkspaceAnalyticsHistoryService } from "../../services/workspace.service";

let passed = 0;
let failed = 0;

function expect(testName: string, condition: boolean): void {
    if (condition) {
        console.log(`  ✅ PASS: ${testName}`);
        passed++;
    } else {
        console.error(`  ❌ FAIL: ${testName}`);
        failed++;
    }
}

async function describe(suiteName: string, fn: () => Promise<void> | void): Promise<void> {
    console.log(`\n📦 ${suiteName}`);
    console.log("─".repeat(50));
    await fn();
}

async function runTests() {
    try {
        console.log("Đang kết nối database...");
        await connectDatabase();
        
        // Lấy một workspace ngẫu nhiên từ database để test
        const workspace = await WorkspaceModel.findOne().lean();
        if (!workspace) {
            console.error("Không tìm thấy workspace nào trong DB để test!");
            process.exit(1);
        }

        const workspaceId = workspace._id.toString();
        console.log(`Đang sử dụng Workspace ID: ${workspaceId} (${workspace.name})`);

        await describe("Test getWorkspaceAnalyticsHistoryService với bộ lọc tháng 5/2026", async () => {
            const timeFilters = { year: 2026, month: 5 };
            const history = await getWorkspaceAnalyticsHistoryService(workspaceId, undefined, timeFilters);
            
            expect("Kết quả trả về là một mảng", Array.isArray(history));
            expect("Mảng có ít nhất một phần tử", history.length > 0);
            
            if (history.length > 0) {
                const firstEntry = history[0];
                expect("Mỗi entry chứa workspaceId", firstEntry.workspaceId instanceof mongoose.Types.ObjectId);
                expect("Mỗi entry chứa date", firstEntry.date instanceof Date);
                expect("Mỗi entry chứa totalTasks", typeof firstEntry.totalTasks === "number");
                expect("Mỗi entry chứa completedTasks", typeof firstEntry.completedTasks === "number");
                expect("Mỗi entry chứa inProgressTasks", typeof firstEntry.inProgressTasks === "number");
                expect("Mỗi entry chứa overdueTasks", typeof firstEntry.overdueTasks === "number");
                
                console.log(`Sample Entry:`, {
                    date: firstEntry.date.toDateString(),
                    totalTasks: firstEntry.totalTasks,
                    completedTasks: firstEntry.completedTasks,
                    inProgressTasks: firstEntry.inProgressTasks,
                    overdueTasks: firstEntry.overdueTasks,
                });
            }
        });

        await describe("Test getWorkspaceAnalyticsHistoryService ở chế độ All-time (không truyền timeFilters)", async () => {
            const history = await getWorkspaceAnalyticsHistoryService(workspaceId, undefined, undefined);
            
            expect("Kết quả trả về là một mảng", Array.isArray(history));
            expect("Mảng có ít nhất một phần tử", history.length > 0);
            
            if (history.length > 0) {
                const lastEntry = history[history.length - 1];
                expect("Entry cuối cùng có flag isRealTime = true", lastEntry.isRealTime === true);
            }
        });

    } catch (error) {
        console.error("Lỗi khi chạy test:", error);
        failed++;
    } finally {
        await mongoose.connection.close();
        
        console.log("\n" + "═".repeat(50));
        console.log(`📊 KẾT QUẢ: ${passed} passed | ${failed} failed`);
        console.log("═".repeat(50));
        if (failed > 0) process.exit(1);
        process.exit(0);
    }
}

runTests();
