/**
 * @file seed-activity.ts
 * @description Script đổ dữ liệu mẫu cho ActivityLog để hiển thị Heatmap
 * Chạy: npx ts-node src/mytest/seed-activity.ts
 */

import mongoose from "mongoose";
import { connectDatabase } from "../config/database.config";
import ActivityLogModel, { ActivityActionEnum, ActivityEntityTypeEnum } from "../models/activity-log.model";
import dayjs from "dayjs";

const WORKSPACE_ID = "69b407a8b54147306942b630";
const USER_ID = "69b0e80ad52a379aade7b42b";

async function seed() {
    try {
        await connectDatabase();
        console.log("✅ Kết nối Database thành công");

        const actions = [
            { action: ActivityActionEnum.CREATE_TASK, entity: ActivityEntityTypeEnum.TASK, summary: "đã tạo một công việc mới" },
            { action: ActivityActionEnum.UPDATE_TASK, entity: ActivityEntityTypeEnum.TASK, summary: "đã cập nhật trạng thái công việc" },
            { action: ActivityActionEnum.UPDATE_PROJECT, entity: ActivityEntityTypeEnum.PROJECT, summary: "đã cập nhật thông tin dự án" },
            { action: ActivityActionEnum.CREATE_PROJECT, entity: ActivityEntityTypeEnum.PROJECT, summary: "đã tạo dự án mới" },
        ];

        const logs = [];
        const now = dayjs();

        console.log("⏳ Đang tạo dữ liệu mẫu cho 30 ngày qua...");

        for (let i = 0; i < 30; i++) {
            const currentDay = now.subtract(i, 'day');
            
            // Mỗi ngày tạo từ 2 đến 15 hành động ngẫu nhiên để heatmap trông đẹp hơn
            const dailyActionCount = Math.floor(Math.random() * 14) + 2; 

            for (let j = 0; j < dailyActionCount; j++) {
                const randomAction = actions[Math.floor(Math.random() * actions.length)];
                
                // Giờ ngẫu nhiên trong ngày
                const logDate = currentDay.startOf('day').add(Math.floor(Math.random() * 23), 'hour').toDate();

                logs.push({
                    workspaceId: new mongoose.Types.ObjectId(WORKSPACE_ID),
                    userId: new mongoose.Types.ObjectId(USER_ID),
                    action: randomAction.action,
                    entityType: randomAction.entity,
                    entityId: new mongoose.Types.ObjectId(), // Fake ID
                    details: {
                        summary: randomAction.summary
                    },
                    createdAt: logDate
                });
            }
        }

        if (logs.length > 0) {
            await ActivityLogModel.insertMany(logs);
            console.log(`✅ Đã chèn thành công ${logs.length} bản ghi hoạt động.`);
        } else {
            console.log("⚠️ Không có bản ghi nào được tạo.");
        }

        console.log("🚀 Hoàn tất! Hãy quay lại Dashboard và refresh để xem kết quả.");
        process.exit(0);
    } catch (error) {
        console.error("❌ Lỗi khi seed dữ liệu:", error);
        process.exit(1);
    }
}

seed();
