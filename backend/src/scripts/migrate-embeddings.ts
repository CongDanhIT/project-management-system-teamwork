import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";

// Tải biến môi trường
dotenv.config({ path: path.join(__dirname, "../../.env") });

import TaskModel from "../models/task.model";
import ProjectModel from "../models/project.model";
import { embedTaskService, embedProjectService } from "../services/embedding.service";
import logger from "../utils/logger";

const MONGO_URI = process.env.MONGO_URI || "";

const migrateEmbeddings = async () => {
    try {
        if (!MONGO_URI) {
            throw new Error("MONGO_URI không tồn tại!");
        }

        logger.info("[Migration] Đang kết nối tới Database...");
        await mongoose.connect(MONGO_URI);
        logger.info("[Migration] Đã kết nối Database thành công.");

        // 1. Migrate Project
        const projects = await ProjectModel.find({ embedding: { $exists: false } }).lean();
        logger.info(`[Migration] Tìm thấy ${projects.length} Project cần tạo vector.`);
        
        for (let i = 0; i < projects.length; i++) {
            const p = projects[i];
            try {
                logger.info(`[Migration] Đang nhúng Project ${i + 1}/${projects.length}: ${p.name}`);
                const embedding = await embedProjectService({ name: p.name, description: p.description, status: p.status });
                await ProjectModel.updateOne({ _id: p._id }, { embedding, embeddingUpdatedAt: new Date() });
            } catch (error: any) {
                logger.error(`[Migration] Lỗi khi nhúng Project ${p._id}:`, error.message);
            }
        }

        // 2. Migrate Task
        const tasks = await TaskModel.find({ embedding: { $exists: false } }).lean();
        logger.info(`[Migration] Tìm thấy ${tasks.length} Task cần tạo vector.`);

        for (let i = 0; i < tasks.length; i++) {
            const t = tasks[i];
            try {
                logger.info(`[Migration] Đang nhúng Task ${i + 1}/${tasks.length}: ${t.title}`);
                const embedding = await embedTaskService({ title: t.title, description: t.description, status: t.status });
                await TaskModel.updateOne({ _id: t._id }, { embedding, embeddingUpdatedAt: new Date() });
                
                // Nghỉ 100ms giữa mỗi lượt gọi để tránh rate limit
                await new Promise(resolve => setTimeout(resolve, 100));
            } catch (error: any) {
                logger.error(`[Migration] Lỗi khi nhúng Task ${t._id}:`, error.message);
            }
        }

        logger.info("[Migration] Đã hoàn tất quá trình Migrate Vector!");

    } catch (error: any) {
        logger.error("[Migration] Lỗi trong quá trình Migrate:", error);
    } finally {
        await mongoose.disconnect();
        logger.info("[Migration] Đã ngắt kết nối Database.");
        process.exit(0);
    }
};

migrateEmbeddings();
