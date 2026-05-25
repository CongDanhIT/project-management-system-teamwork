import mongoose from "mongoose";
import { env } from "../config/env";
import TaskModel from "../models/task.model";
import dayjs from "dayjs";

async function run() {
    try {
        console.log("Đang kết nối database...");
        await mongoose.connect(env.MONGO_URI);
        console.log("Kết nối database thành công!");

        // 1. Tìm tất cả các task đã hoàn thành trong DB
        const completedTasks = await TaskModel.find({
            status: { $in: ["DONE", "COMPLETED"] },
            deletedAt: null
        }).sort({ completedAt: -1 });

        console.log(`\nFound ${completedTasks.length} completed tasks in DB:`);
        completedTasks.forEach(t => {
            console.log(`- [${t.taskCode}] "${t.title}" | WS: ${t.workspaceId} | Status: ${t.status} | CompletedAt (UTC): ${t.completedAt?.toISOString()} | CompletedAt (Local): ${t.completedAt ? dayjs(t.completedAt).format("YYYY-MM-DD HH:mm:ss Z") : 'N/A'}`);
        });

    } catch (error: any) {
        console.error("Lỗi:", error);
    } finally {
        await mongoose.connection.close();
        console.log("Đã đóng kết nối database.");
    }
}

run();
