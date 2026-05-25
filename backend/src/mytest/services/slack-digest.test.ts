/**
 * @file slack-digest.test.ts
 * @description Test thủ công cho getWorkspaceAnalyticsService và Slack Block Kit Daily Digest
 * Chạy: npx ts-node src/mytest/services/slack-digest.test.ts
 */

import dotenv from "dotenv";
import path from "path";

// Load environment variables từ file .env ở thư mục backend
dotenv.config({ path: path.join(__dirname, "../../../.env") });

import { connectDatabase } from "../../config/database.config";
import mongoose from "mongoose";
import WorkspaceModel from "../../models/workspace.model";
import { getWorkspaceAnalyticsService } from "../../services/workspace.service";
import { SlackService } from "../../services/slack.service";

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

        await describe("Test getWorkspaceAnalyticsService với các trường yesterdayActivity", async () => {
            const stats = await getWorkspaceAnalyticsService(workspaceId);
            
            expect("Kết quả chứa trường yesterdayActivity", stats.hasOwnProperty("yesterdayActivity"));
            if (stats.yesterdayActivity) {
                const activity = stats.yesterdayActivity;
                expect("yesterdayActivity chứa createdTasks", typeof activity.createdTasks === "number");
                expect("yesterdayActivity chứa completedTasks", typeof activity.completedTasks === "number");
                expect("yesterdayActivity chứa topContributor", activity.topContributor === null || typeof activity.topContributor === "object");
                
                if (activity.topContributor) {
                    expect("topContributor chứa name", typeof activity.topContributor.name === "string");
                    expect("topContributor chứa completedCount", typeof activity.topContributor.completedCount === "number");
                }
                
                console.log("yesterdayActivity data:", JSON.stringify(activity, null, 2));
            }
        });

        await describe("Test tạo Slack Blocks và in ra kiểm tra định dạng", async () => {
            const stats = await getWorkspaceAnalyticsService(workspaceId);
            const trends = stats.trends;
            const urgentTasks = stats.nearDueDateTasks;
            
            // Mock sendMessage của SlackService để xem các blocks được tạo
            const originalSendMessage = SlackService.sendMessage;
            let capturedBlocks: any[] = [];
            
            SlackService.sendMessage = async (webhookUrl: string, text: string, blocks?: any[]) => {
                capturedBlocks = blocks || [];
                console.log(`[MOCK] Đã chặn gửi tin nhắn đến webhook. Text: "${text}"`);
                return Promise.resolve();
            };

            await SlackService.sendDailyDigest(
                "http://mock-webhook-url",
                workspace.name,
                stats,
                trends,
                urgentTasks,
                "http://localhost:3000/workspace/test-id/board"
            );

            // Phục hồi sendMessage gốc
            SlackService.sendMessage = originalSendMessage;

            expect("Tạo được danh sách các blocks cho Slack Kit", capturedBlocks.length > 0);
            
            const headerBlock = capturedBlocks.find(b => b.type === "header");
            expect("Có block header", !!headerBlock);
            if (headerBlock) {
                expect("Header có nội dung đúng chuẩn", headerBlock.text.text === "🎯 TEAMFLOW DAILY DIGEST");
            }

            const dividerBlocks = capturedBlocks.filter(b => b.type === "divider");
            expect("Có ít nhất 2 block divider để phân tách nội dung", dividerBlocks.length >= 2);

            const overviewTitle = capturedBlocks.find(b => b.text && b.text.text.includes("WORKSPACE OVERVIEW"));
            expect("Có block tiêu đề Tổng quan chung", !!overviewTitle);

            const yesterdayTitle = capturedBlocks.find(b => b.text && b.text.text.includes("YESTERDAY'S PULSE"));
            expect("Có block tiêu đề Hoạt động ngày hôm qua", !!yesterdayTitle);

            console.log("\n--- Cấu trúc Slack Blocks vừa được sinh ra ---");
            console.log(JSON.stringify(capturedBlocks, null, 2));
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
