import ProjectModel from "../models/project.model";
import TaskModel from "../models/task.model";
import logger from "../utils/logger";

/**
 * Tự động dọn dẹp các mục trong thùng rác sau 30 ngày
 */
export const cleanupExpiredTrash = async () => {
    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        logger.info(`[CRON] Đang bắt đầu dọn dẹp thùng rác (đối với các item xóa trước ${thirtyDaysAgo.toLocaleDateString()})...`);

        // 1. Tìm các dự án đã xóa quá 30 ngày
        const expiredProjects = await ProjectModel.find({ 
            deletedAt: { $ne: null, $lt: thirtyDaysAgo } 
        });

        if (expiredProjects.length > 0) {
            const projectIds = expiredProjects.map(p => p._id);
            
            // Xóa sạch tất cả task thuộc các dự án này
            const deletedTasksCount = await TaskModel.deleteMany({ 
                projectId: { $in: projectIds } 
            });

            // Xóa sạch các dự án này
            const deletedProjectsCount = await ProjectModel.deleteMany({ 
                _id: { $in: projectIds } 
            });

            logger.info(`[CRON] Đã xóa vĩnh viễn ${deletedProjectsCount.deletedCount} dự án và ${deletedTasksCount.deletedCount} công việc đi kèm.`);
        }

        // 2. Tìm các task riêng lẻ đã xóa quá 30 ngày (không thuộc dự án bị xóa ở trên)
        const deletedTasksResult = await TaskModel.deleteMany({
            deletedAt: { $ne: null, $lt: thirtyDaysAgo }
        });

        if (deletedTasksResult.deletedCount > 0) {
            logger.info(`[CRON] Đã xóa vĩnh viễn ${deletedTasksResult.deletedCount} công việc riêng lẻ quá hạn 30 ngày.`);
        }

        logger.info("[CRON] Kết thúc tiến trình dọn dẹp thùng rác.");
    } catch (error) {
        logger.error("[CRON] Lỗi trong quá trình dọn dẹp thùng rác:", { error });
    }
};

/**
 * Khởi chạy tiến trình kiểm tra định kỳ (mỗi ngày một lần)
 */
export const startCronService = () => {
    // Chạy lần đầu ngay khi khởi động server
    cleanupExpiredTrash();

    // Sau đó chạy lại sau mỗi 24 giờ
    const ONE_DAY_MS = 24 * 60 * 60 * 1000;
    setInterval(cleanupExpiredTrash, ONE_DAY_MS);
    
    logger.info("[CRON] Dịch vụ dọn dẹp thùng rác tự động đã được kích hoạt (chu kỳ 24h).");
};
