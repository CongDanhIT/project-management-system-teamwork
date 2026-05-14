import cron from "node-cron";
import ProjectModel from "../models/project.model";
import TaskModel from "../models/task.model";
import UserModel from "../models/user.model";
import logger from "../utils/logger";
import cloudinary from "../config/cloudinary.config";
import WorkspaceModel from "../models/workspace.model";
import { SlackService } from "./slack.service";
import { saveDailySnapshotsForAllWorkspaces, getWorkspaceAnalyticsService } from "./workspace.service";
import { saveDailySnapshotsForAllProjects } from "./project.service";
import { EmailService } from "./email.service";
import AssetService from "./asset.service";
import ProjectAssetModel from "../models/project-asset.model";
import PhaseModel from "../models/phase.model";
import AssetFolderModel from "../models/asset-folder.model";
import { NotificationService } from "./notification.service";
import { TaskStatusEnum } from "../enums/task.enum";

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

        // Tìm và xóa các Phase quá hạn
        await PhaseModel.deleteMany({ deletedAt: { $ne: null, $lt: thirtyDaysAgo } });
        // Tìm và xóa các Asset Folder quá hạn
        await AssetFolderModel.deleteMany({ deletedAt: { $ne: null, $lt: thirtyDaysAgo } });

    } catch (error) {
        logger.error("[CRON-ERR] Lỗi dọn dẹp thùng rác:", { error });
    }
};

/**
 * 1.1. Dọn dẹp tệp tin vật lý trên R2 (Chạy hàng ngày cùng lúc với dọn dẹp thùng rác)
 */
export const cleanupExpiredAssets = async () => {
    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        logger.info("[CRON] Bắt đầu dọn dẹp tệp tin vật lý trên R2...");

        // Tìm các asset đã bị xóa mềm quá 30 ngày
        const expiredAssets = await ProjectAssetModel.find({
            deletedAt: { $ne: null, $lt: thirtyDaysAgo }
        });

        for (const asset of expiredAssets) {
            try {
                // Xóa vật lý trên R2
                await AssetService.hardDeleteFromR2(asset.storageKey);
                // Xóa vĩnh viễn khỏi DB
                await ProjectAssetModel.deleteOne({ _id: asset._id });
                logger.info(`[CRON] Đã xóa vĩnh viễn asset: ${asset.name} (${asset.storageKey})`);
            } catch (err: any) {
                logger.error(`[CRON-ERR] Lỗi khi xóa asset ${asset._id} từ R2`, { error: err.message });
            }
        }

        if (expiredAssets.length > 0) {
            logger.info(`[CRON] Đã hoàn thành dọn dẹp ${expiredAssets.length} tệp tin quá hạn trên R2.`);
        }
    } catch (error) {
        logger.error("[CRON-ERR] Lỗi tiến trình dọn dẹp R2:", { error });
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
 * 2.1. Dọn dẹp tệp tin R2 mồ côi (Chạy hàng tháng)
 * Quét toàn bộ tệp trên R2, nếu không có trong DB thì xóa.
 */
export const cleanupOrphanedR2Files = async () => {
    try {
        logger.info("[CRON] Bắt đầu quét file mồ côi trên R2...");

        // Bước 1: Lấy tất cả storageKey đang dùng trong DB
        const activeAssets = await ProjectAssetModel.find({ 
            storageProvider: 'R2',
            deletedAt: null 
        }).select("storageKey");
        
        const usedStorageKeys = new Set(activeAssets.map(a => a.storageKey));

        // Bước 2: Liệt kê tất cả tài nguyên trên R2
        const r2Objects = await AssetService.listAllR2Objects();
        const deletedKeys: string[] = [];

        for (const obj of r2Objects) {
            if (!obj.Key) continue;

            // Kiểm tra xem key có trong DB không
            if (!usedStorageKeys.has(obj.Key)) {
                // Chỉ xóa file đã tồn tại trên 24h để tránh race condition
                const lastModified = obj.LastModified ? new Date(obj.LastModified) : new Date();
                const isOldEnough = (Date.now() - lastModified.getTime()) > 24 * 60 * 60 * 1000;

                if (isOldEnough) {
                    await AssetService.hardDeleteFromR2(obj.Key);
                    deletedKeys.push(obj.Key);
                }
            }
        }

        if (deletedKeys.length > 0) {
            logger.info(`[CRON] Đã dọn dẹp ${deletedKeys.length} file mồ côi trên R2.`, { keys: deletedKeys });
        } else {
            logger.info("[CRON] Không tìm thấy file mồ côi nào trên R2.");
        }

    } catch (error) {
        logger.error("[CRON-ERR] Lỗi dọn dẹp R2 mồ côi:", { error });
    }
};

/**
 * 3. Kiểm tra và gửi thông báo cho các công việc quá hạn (Chạy hàng giờ)
 */
export const checkOverdueTasks = async () => {
    try {
        const now = new Date();
        logger.info("[CRON] Đang kiểm tra các công việc quá hạn...");

        // Tìm các task chưa hoàn thành, có hạn chót và đã quá hạn mà chưa gửi thông báo
        const overdueTasks = await TaskModel.find({
            status: { $nin: [TaskStatusEnum.DONE, TaskStatusEnum.COMPLETED] },
            dueDate: { $ne: null, $lt: now },
            overdueNotificationSent: { $ne: true },
            deletedAt: null
        });

        if (overdueTasks.length === 0) {
            logger.info("[CRON] Không có công việc mới quá hạn.");
            return;
        }

        for (const task of overdueTasks) {
            // [DATA-INTEGRITY] Chỉ gửi thông báo nếu có người được gán thực sự
            if (task.assignedTo && task.assignedTo.length > 0) {
                // Lọc bỏ các ID không hợp lệ nếu có
                const validAssignees = task.assignedTo.filter(id => id != null);
                
                if (validAssignees.length === 0) {
                    logger.warn(`[CRON] Task ${task.taskCode} quá hạn nhưng không có người gán hợp lệ. Bỏ qua.`);
                } else {
                    for (const recipientId of validAssignees) {
                        await NotificationService.sendTaskOverdueNotification(
                            task.workspaceId.toString(),
                            task._id.toString(),
                            task.createdBy.toString(),
                            recipientId.toString(),
                            task.title,
                            task.taskCode,
                            task.dueDate as Date,
                            task.projectId.toString()
                        );
                    }
                    logger.info(`[CRON] Đã gửi thông báo quá hạn cho task ${task.taskCode} tới ${validAssignees.length} người dùng.`);
                }
            } else {
                logger.info(`[CRON] Task ${task.taskCode} quá hạn nhưng không có người gán. Không gửi thông báo.`);
            }

            // Đánh dấu là đã gửi thông báo để tránh gửi lại
            task.overdueNotificationSent = true;
            await task.save();
        }

        logger.info(`[CRON] Đã gửi thông báo quá hạn cho ${overdueTasks.length} công việc.`);
    } catch (error) {
        logger.error("[CRON-ERR] Lỗi khi kiểm tra công việc quá hạn:", { error });
    }
};

/**
 * Khởi chạy các tiến trình định kỳ
 */
export const startCronService = () => {
    // Chạy dọn dẹp thùng rác 1 lần ngay khi khởi động
    cleanupExpiredTrash();
    // Chạy kiểm tra quá hạn 1 lần ngay khi khởi động (Hữu ích cho môi trường DEV khi backend không mở liên tục)
    checkOverdueTasks();
    
    // [FIX] Chạy lưu snapshot ngay khi khởi động để tránh mất dữ liệu nếu server bị tắt vào ban đêm
    // Điều này giúp Dashboard có mốc so sánh chính xác cho ngày hôm nay.
    saveDailySnapshotsForAllWorkspaces();
    saveDailySnapshotsForAllProjects();

    // 1. Dọn dẹp thùng rác: Chạy vào 00:00 hàng ngày
    cron.schedule("0 0 * * *", () => {
        cleanupExpiredTrash();
        cleanupExpiredAssets(); // 🚀 Dọn dẹp file R2 song song
    });

    // 2. Dọn dẹp Cloudinary & R2: Chạy vào 01:00 và 02:00 ngày đầu tiên mỗi tháng
    cron.schedule("0 1 1 * *", () => {
        cleanupOrphanedCloudinaryFiles();
    });

    cron.schedule("0 2 1 * *", () => {
        cleanupOrphanedR2Files();
    });

    // 3. Analytics Snapshot: Chạy vào 23:55 hàng ngày
    cron.schedule("55 23 * * *", () => {
        saveDailySnapshotsForAllWorkspaces();
        saveDailySnapshotsForAllProjects();
    }, {
        timezone: "Asia/Ho_Chi_Minh"
    });

    // 3.1. Kiểm tra task quá hạn: Chạy hàng giờ (phút thứ 0)
    cron.schedule("0 * * * *", () => {
        checkOverdueTasks();
    });

    // 4. Daily Digest: Chạy vào 08:00 hàng ngày (Giờ Việt Nam)
    cron.schedule("0 8 * * *", async () => {
        logger.info("[CRON] Bắt đầu gửi Daily Digest cho người dùng có đăng ký...");
        // Chỉ lấy những user đang hoạt động và đồng ý nhận email
        const users = await UserModel.find({ 
            isActive: true, 
            "preferences.receiveDailyDigest": true 
        }).select("_id email");

        for (const user of users) {
            try {
                await EmailService.sendDailyDigest(user._id.toString());
            } catch (error: any) {
                logger.error(`[CRON-ERR] Không thể gửi Daily Digest cho user ${user._id}`, { error: error.message });
            }
        }
        logger.info(`[CRON] Đã hoàn thành tiến trình Daily Digest cho ${users.length} người dùng.`);

        // --- Gửi Daily Digest cho Slack của Workspace ---
        logger.info("[CRON] Bắt đầu gửi Daily Digest cho các Workspace có bật Slack...");
        const activeWorkspaces = await WorkspaceModel.find({
            dailyDigestEnabled: true,
            slackWebhookUrl: { $nin: [null, ""] }
        });

        for (const workspace of activeWorkspaces) {
            try {
                const stats = await getWorkspaceAnalyticsService(workspace._id.toString());
                const workspaceLink = `${process.env.FRONTEND_ORIGIN || "http://localhost:3000"}/workspace/${workspace._id}/board`;
                
                await SlackService.sendDailyDigest(
                    workspace.slackWebhookUrl!,
                    workspace.name,
                    stats,
                    stats.trends,
                    stats.nearDueDateTasks,
                    workspaceLink
                );
                logger.info(`[CRON] Đã gửi Daily Digest Slack cho workspace: ${workspace.name}`);
            } catch (error: any) {
                logger.error(`[CRON-ERR] Lỗi khi gửi Slack cho workspace ${workspace.name}`, { error: error.message });
            }
        }
        logger.info(`[CRON] Đã hoàn thành tiến trình Slack Daily Digest cho ${activeWorkspaces.length} workspace.`);
    }, {
        timezone: "Asia/Ho_Chi_Minh"
    });

    logger.info("[CRON] Hệ thống Lập lịch (node-cron) đã kích hoạt.");
};
