import mongoose from "mongoose";
import ActivityLogModel, { ActivityActionEnum, ActivityEntityTypeEnum } from "../models/activity-log.model";
import logger from "../utils/logger";

export const aggregateProjectActivityLogsService = async (projectId: string) => {
    try {
        // Chỉ lấy logs trong 30 ngày gần nhất để giảm context size
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // Lấy 200 logs gần nhất (ưu tiên các hành động quan trọng)
        const logs = await ActivityLogModel.find({
            projectId,
            createdAt: { $gte: thirtyDaysAgo },
            action: {
                $in: [
                    ActivityActionEnum.UPDATE_TASK,
                    ActivityActionEnum.CREATE_TASK,
                    ActivityActionEnum.DELETE_TASK,
                    ActivityActionEnum.CREATE_PHASE,
                    ActivityActionEnum.UPDATE_PROJECT
                ]
            }
        })
        .sort({ createdAt: -1 })
        .limit(200)
        .populate("userId", "name") // Lấy tên người dùng
        .lean();

        // Rút gọn dữ liệu trước khi gửi cho AI để tiết kiệm token
        const compactLogs = logs.map(log => ({
            time: log.createdAt.toISOString().split('T')[0], // Chỉ lấy YYYY-MM-DD
            user: (log.userId as any)?.name || "Unknown",
            action: log.action,
            target: log.entityType,
            summary: log.details?.summary || ""
        }));

        logger.info("[Analytics-Service] Đã tổng hợp dữ liệu log dự án", { projectId, count: compactLogs.length });
        
        return compactLogs;
    } catch (error: any) {
        logger.error("[Analytics-Service] Lỗi khi tổng hợp activity logs", { error: error.message, projectId });
        throw new Error("Không thể tổng hợp dữ liệu phân tích.");
    }
};
