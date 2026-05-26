import mongoose from 'mongoose';
import dotenv from 'dotenv';
import TaskModel from '../models/task.model';
import logger from '../utils/logger';

// Nạp biến môi trường
dotenv.config();

const MONGODB_URI = process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/my-team-flow-dev";

const migrateDueDates = async () => {
    try {
        logger.info("[MIGRATION] Bắt đầu kết nối Database...");
        await mongoose.connect(MONGODB_URI);
        logger.info("[MIGRATION] Kết nối thành công. Đang quét các Task có dueDate kết thúc bằng 00:00:00...");

        // Tìm tất cả task có dueDate
        const tasks = await TaskModel.find({ dueDate: { $ne: null } });
        let updatedCount = 0;

        for (const task of tasks) {
            if (task.dueDate) {
                const date = new Date(task.dueDate);
                
                // Nếu giờ = 0, phút = 0, giây = 0 (theo local time)
                // Hoặc bạn có thể dùng getUTCHours tùy vào timezone lưu trước đó.
                // An toàn nhất: Nếu timezone lưu mặc định của thư viện date picker
                // là 00:00:00.
                if (date.getHours() === 0 && date.getMinutes() === 0 && date.getSeconds() === 0) {
                    date.setHours(23, 59, 59, 999);
                    task.dueDate = date;
                    await task.save();
                    updatedCount++;
                } else if (date.getHours() === 7 && date.getMinutes() === 0 && date.getSeconds() === 0) {
                     // Nếu lưu UTC 00:00:00, ở VN (UTC+7) nó sẽ ra 07:00:00
                    date.setHours(23, 59, 59, 999);
                    task.dueDate = date;
                    await task.save();
                    updatedCount++;
                }
            }
        }

        logger.info(`[MIGRATION] Hoàn thành! Đã cập nhật ${updatedCount} tasks.`);
    } catch (error) {
        logger.error("[MIGRATION] Lỗi trong quá trình chạy:", error);
    } finally {
        await mongoose.disconnect();
        logger.info("[MIGRATION] Đã ngắt kết nối Database.");
        process.exit(0);
    }
};

migrateDueDates();
