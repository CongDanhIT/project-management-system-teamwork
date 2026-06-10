import mongoose from "mongoose";
import ActivityLogModel, { ActivityActionEnum, ActivityEntityTypeEnum } from "../models/activity-log.model";
import logger from "../utils/logger";

export const aggregateProjectActivityLogsService = async (projectId: string) => {
    try {
        // Chỉ lấy logs trong 30 ngày gần nhất để giảm context size
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // Lấy tối đa 1000 logs gần nhất (ưu tiên các hành động quan trọng)
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
        .limit(1000)
        .populate("userId", "name") // Lấy tên người dùng
        .lean();

        // Rút gọn và Gom nhóm (Group/Aggregate) dữ liệu log
        const groupedLogsMap = new Map<string, any>();

        logs.forEach(log => {
            const time = log.createdAt.toISOString().split('T')[0];
            const user = (log.userId as any)?.name || "Unknown";
            const action = log.action;
            const target = log.entityType;
            const entityId = log.entityId ? log.entityId.toString() : "NoID";
            const summary = log.details?.summary || "";

            // Tạo khóa gom nhóm duy nhất theo: Ngày + Người dùng + Loại hành động + Đối tượng + ID cụ thể
            const groupKey = `${time}_${user}_${action}_${target}_${entityId}`;

            if (groupedLogsMap.has(groupKey)) {
                const existingGroup = groupedLogsMap.get(groupKey);
                existingGroup.count += 1;
                if (summary && !existingGroup.details.includes(summary)) {
                    existingGroup.details.push(summary);
                }
            } else {
                groupedLogsMap.set(groupKey, {
                    time,
                    user,
                    action,
                    target,
                    entityId,
                    count: 1,
                    details: summary ? [summary] : []
                });
            }
        });

        // BẢNG TRỌNG SỐ (WEIGHTS) - Điểm khoa học của bài báo nằm ở đây
        const ACTION_WEIGHTS: Record<string, number> = {
            [ActivityActionEnum.DELETE_TASK]: 1.0,    // Trọng số cực cao (Rủi ro mất dữ liệu)
            [ActivityActionEnum.UPDATE_PROJECT]: 0.9, // Thay đổi cấu trúc dự án
            [ActivityActionEnum.CREATE_PHASE]: 0.8,   // Tạo giai đoạn
            [ActivityActionEnum.CREATE_TASK]: 0.8,    // Tạo công việc
            [ActivityActionEnum.UPDATE_TASK]: 0.2,    // Cập nhật lặt vặt (Trọng số thấp)
        };

        const THRESHOLD = 0.5; // Ngưỡng lọc (Lọc bỏ các nhiễu rác)

        // BƯỚC LỌC TRỌNG SỐ (WEIGHTED FILTERING ALGORITHM)
        const compactLogs = Array.from(groupedLogsMap.values())
            .map(group => {
                const weight = ACTION_WEIGHTS[group.action] || 0.1;
                const score = weight * group.count; // Tính điểm: Trọng số x Số lần lặp
                return { ...group, score };
            })
            .filter(group => group.score >= THRESHOLD); // Chỉ giữ lại các cụm log đạt chuẩn

        logger.info("[Analytics-Service] Đã chạy Thuật toán Lọc Trọng số", { 
            projectId, 
            originalGroups: groupedLogsMap.size, 
            filteredGroups: compactLogs.length 
        });
        
        return compactLogs;
    } catch (error: any) {
        logger.error("[Analytics-Service] Lỗi khi tổng hợp activity logs", { error: error.message, projectId });
        throw new Error("Không thể tổng hợp dữ liệu phân tích.");
    }
};
