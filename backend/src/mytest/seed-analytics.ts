
import mongoose from "mongoose";
import WorkspaceAnalyticsSnapshotModel from "../models/workspace-analytics-snapshot.model";
import * as dotenv from "dotenv";
import path from "path";

// Load environment variables
dotenv.config({ path: path.join(__dirname, "../../.env") });

const WORKSPACE_ID = "69b407a8b54147306942b630"; // ID của design team test22
const DB_URI = process.env.MONGO_URI || "mongodb://localhost:27017/teamsync_db";

async function seedAnalytics() {
    try {
        console.log("🚀 Đang kết nối Database...");
        await mongoose.connect(DB_URI);
        console.log("✅ Kết nối thành công.");

        // Xóa dữ liệu cũ của workspace này trong bảng snapshot để tránh trùng lặp
        await WorkspaceAnalyticsSnapshotModel.deleteMany({ workspaceId: WORKSPACE_ID });
        console.log("🧹 Đã dọn dẹp dữ liệu snapshot cũ.");

        const snapshots = [];
        const now = new Date();

        // Tạo dữ liệu cho 15 ngày qua
        for (let i = 15; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(now.getDate() - i);
            date.setHours(23, 55, 0, 0); // Giả lập snapshot chạy lúc cuối ngày

            // Logic giả lập: Số lượng task tăng dần theo thời gian
            const baseTasks = 20 + (15 - i) * 2; 
            const totalTasks = baseTasks + Math.floor(Math.random() * 5);
            const completedTasks = Math.floor(totalTasks * (0.4 + Math.random() * 0.4)); // Tỷ lệ 40-80%
            const inProgressTasks = Math.floor((totalTasks - completedTasks) * 0.7);
            const overdueTasks = totalTasks - completedTasks - inProgressTasks;

            snapshots.push({
                workspaceId: new mongoose.Types.ObjectId(WORKSPACE_ID),
                date: date,
                totalTasks,
                completedTasks,
                inProgressTasks,
                overdueTasks,
                totalProjects: 3
            });
        }

        await WorkspaceAnalyticsSnapshotModel.insertMany(snapshots);
        console.log(`✨ Đã tạo thành công ${snapshots.length} bản ghi snapshot cho Workspace.`);

    } catch (error) {
        console.error("❌ Lỗi khi seed dữ liệu:", error);
    } finally {
        await mongoose.disconnect();
        console.log("🔌 Đã ngắt kết nối database.");
        process.exit(0);
    }
}

seedAnalytics();
