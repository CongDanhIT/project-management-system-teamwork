import cron from "node-cron";
import ProjectModel from "../models/project.model";
import TaskModel from "../models/task.model";
import UserModel from "../models/user.model";
import logger from "../utils/logger";
import cloudinary from "../config/cloudinary.config";

/**
 * Trích xuất public_id từ Cloudinary URL
 * VD: https://res.cloudinary.com/cloud_name/image/upload/v1/folder/image.jpg 
 * -> folder/image
 */
const extractPublicIdFromUrl = (url: string): string | null => {
    try {
        const parts = url.split("/");
        const uploadIndex = parts.indexOf("upload");
        if (uploadIndex === -1) return null;

        // Bỏ phần version (bắt đầu bằng 'v') nếu có
        const startIndex = parts[uploadIndex + 1].startsWith("v") ? uploadIndex + 2 : uploadIndex + 1;
        const publicIdWithExt = parts.slice(startIndex).join("/");
        
        // Loại bỏ phần mở rộng file (.jpg, .png, etc)
        return publicIdWithExt.replace(/\.[^/.]+$/, "");
    } catch (error) {
        return null;
    }
};

/**
 * 1. Tự động dọn dẹp các mục trong thùng rác sau 30 ngày (Chạy hàng ngày)
 */
export const cleanupExpiredTrash = async () => {
    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        logger.info(`[CRON] Bắt đầu dọn dẹp thùng rác (Trước ngày ${thirtyDaysAgo.toLocaleDateString()})...`);

        // Tìm và xóa dự án
        const expiredProjects = await ProjectModel.find({ 
            deletedAt: { $ne: null, $lt: thirtyDaysAgo } 
        });

        if (expiredProjects.length > 0) {
            const projectIds = expiredProjects.map(p => p._id);
            await TaskModel.deleteMany({ projectId: { $in: projectIds } });
            const result = await ProjectModel.deleteMany({ _id: { $in: projectIds } });
            logger.info(`[CRON] Đã xóa vĩnh viễn ${result.deletedCount} dự án quá hạn.`);
        }

        // Tìm và xóa task nẻ
        const deletedTasksResult = await TaskModel.deleteMany({
            deletedAt: { $ne: null, $lt: thirtyDaysAgo }
        });

        if (deletedTasksResult.deletedCount > 0) {
            logger.info(`[CRON] Đã xóa vĩnh viễn ${deletedTasksResult.deletedCount} công việc riêng lẻ.`);
        }
    } catch (error) {
        logger.error("[CRON-ERR] Lỗi dọn dẹp thùng rác:", { error });
    }
};

/**
 * 2. Dọn dẹp file Cloudinary mồ côi (Chạy hàng tháng)
 * Quét toàn bộ tệp trên Cloudinary, nếu không có trong DB thì xóa.
 */
export const cleanupOrphanedCloudinaryFiles = async () => {
    try {
        logger.info("[CRON] Bắt đầu quét file mồ côi trên Cloudinary...");

        // Bước 1: Lấy tất cả public_id đang dùng trong DB (Hiện tại chỉ có User.profilePicture)
        const users = await UserModel.find({ profilePicture: { $ne: null } }).select("profilePicture");
        const usedPublicIds = new Set<string>();

        users.forEach(u => {
            if (u.profilePicture) {
                const pid = extractPublicIdFromUrl(u.profilePicture);
                if (pid) usedPublicIds.add(pid);
            }
        });

        // Bước 2: Liệt kê tài nguyên trên Cloudinary (Hỗ trợ Pagination)
        const deletedFiles: string[] = [];
        let nextCursor: string | undefined;

        do {
            const result: any = await cloudinary.api.resources({
                type: 'upload',
                prefix: 'teamflow/', // Chỉ quét trong folder dự án để an toàn
                max_results: 500,
                next_cursor: nextCursor
            });

            const orphanedIds = result.resources
                .filter((res: any) => {
                    // Chỉ xóa file đã tồn tại trên 24h để tránh race condition khi đang upload
                    const createdAt = new Date(res.created_at);
                    const isOldEnough = (Date.now() - createdAt.getTime()) > 24 * 60 * 60 * 1000;
                    return isOldEnough && !usedPublicIds.has(res.public_id);
                })
                .map((res: any) => res.public_id);

            if (orphanedIds.length > 0) {
                await cloudinary.api.delete_resources(orphanedIds);
                deletedFiles.push(...orphanedIds);
            }

            nextCursor = result.next_cursor;
        } while (nextCursor);

        if (deletedFiles.length > 0) {
            logger.info(`[CRON] Đã dọn dẹp ${deletedFiles.length} file mồ côi.`, { files: deletedFiles });
        } else {
            logger.info("[CRON] Không tìm thấy file mồ côi nào cần dọn dẹp.");
        }

    } catch (error) {
        logger.error("[CRON-ERR] Lỗi dọn dẹp Cloudinary:", { error });
    }
};

/**
 * Khởi chạy các tiến trình định kỳ
 */
export const startCronService = () => {
    // Chạy dọn dẹp thùng rác 1 lần ngay khi khởi động
    cleanupExpiredTrash();

    // 1. Dọn dẹp thùng rác: Chạy vào 00:00 hàng ngày
    cron.schedule("0 0 * * *", () => {
        cleanupExpiredTrash();
    });

    // 2. Dọn dẹp Cloudinary: Chạy vào 01:00 ngày đầu tiên mỗi tháng
    cron.schedule("0 1 1 * *", () => {
        cleanupOrphanedCloudinaryFiles();
    });

    logger.info("[CRON] Hệ thống Lập lịch (node-cron) đã kích hoạt.");
};
