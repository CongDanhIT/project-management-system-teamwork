import mongoose from "mongoose";
import ActivityLogModel, { ActivityActionEnum, ActivityEntityTypeEnum } from "../models/activity-log.model";
import logger from "../utils/logger";

export const aggregateProjectActivityLogsService = async (projectId: string, startDate?: string, endDate?: string) => {
    try {
        let fromDate = new Date();
        fromDate.setDate(fromDate.getDate() - 30); // Default 30 days
        let toDate = new Date();

        if (startDate) {
            fromDate = new Date(startDate);
        }
        if (endDate) {
            toDate = new Date(endDate);
            toDate.setHours(23, 59, 59, 999);
        }

        // Lấy tối đa 1000 logs gần nhất (bao quát toàn bộ hoạt động trong dự án)
        const logs = await ActivityLogModel.find({
            projectId,
            createdAt: { $gte: fromDate, $lte: toDate }
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
            let summary = log.details?.summary || "";

            // Bổ sung chi tiết thay đổi (oldValue -> newValue) để AI có ngữ cảnh sâu hơn
            if (log.details?.oldValue !== undefined || log.details?.newValue !== undefined) {
                const oldValStr = typeof log.details.oldValue === 'object' ? JSON.stringify(log.details.oldValue) : String(log.details.oldValue);
                const newValStr = typeof log.details.newValue === 'object' ? JSON.stringify(log.details.newValue) : String(log.details.newValue);
                summary += ` [Chi tiết: Từ '${oldValStr}' thay đổi thành '${newValStr}']`;
            }
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
            // D_struct (Structural Updates) - Trọng số cực cao (0.8 -> 1.0)
            [ActivityActionEnum.DELETE_PROJECT]: 1.0,
            [ActivityActionEnum.DELETE_PHASE]: 1.0,
            [ActivityActionEnum.DELETE_TASK]: 1.0,
            [ActivityActionEnum.DELETE_FOLDER]: 1.0,
            [ActivityActionEnum.DELETE_FILE]: 1.0,
            [ActivityActionEnum.MEMBER_LEFT]: 1.0,
            [ActivityActionEnum.ROLE_CHANGED]: 0.9,
            [ActivityActionEnum.UPDATE_PROJECT]: 0.9,
            [ActivityActionEnum.WORKSPACE_UPDATED]: 0.9,
            [ActivityActionEnum.CREATE_PROJECT]: 0.8,
            [ActivityActionEnum.CREATE_PHASE]: 0.8,
            [ActivityActionEnum.RESTORE_PROJECT]: 0.8,
            [ActivityActionEnum.RESTORE_PHASE]: 0.8,
            [ActivityActionEnum.RESTORE_TASK]: 0.8,
            [ActivityActionEnum.MEMBER_JOINED]: 0.8,

            // D_exec (Execution Updates) - Trọng số trung bình (0.4 -> 0.7)
            [ActivityActionEnum.CREATE_TASK]: 0.6,
            [ActivityActionEnum.MOVE_TASK]: 0.5,
            [ActivityActionEnum.UPDATE_PHASE]: 0.5,
            [ActivityActionEnum.CREATE_FOLDER]: 0.5,
            [ActivityActionEnum.UPLOAD_FILE]: 0.4,

            // D_comm (Communication & Minor Noise) - Trọng số thấp (0.1 -> 0.3)
            [ActivityActionEnum.UPDATE_TASK]: 0.2,
            [ActivityActionEnum.UPDATE_FOLDER]: 0.2,
            [ActivityActionEnum.RENAME_FILE]: 0.2,
        };

        // BƯỚC LỌC TRỌNG SỐ & PHÁT HIỆN BẤT THƯỜNG Z-SCORE 2 VÒNG
        const scoredGroups = Array.from(groupedLogsMap.values())
            .map(group => {
                let weight = ACTION_WEIGHTS[group.action] || 0.1;

                // Semantic Weight Boosting: Tự động phân tích ngữ nghĩa (NLP thô)
                // Nếu là cập nhật task nhưng chứa từ khóa "Hoàn thành", đẩy trọng số lên ngang mức D_exec quan trọng
                if (group.action === ActivityActionEnum.UPDATE_TASK) {
                    const isCompleted = group.details.some((detail: string) => 
                        detail.toLowerCase().includes("hoàn thành") || 
                        detail.toLowerCase().includes("done") || 
                        detail.toLowerCase().includes("completed")
                    );
                    if (isCompleted) {
                        weight = 0.7; 
                    }
                }

                const score = weight * group.count; // Tính điểm: Trọng số x Số lần lặp
                return { ...group, score };
            });

        let extremeAnomalies: any[] = [];
        let normalAnomalies: any[] = [];

        if (scoredGroups.length > 0) {
            // Vòng 1: Tìm siêu ngoại lệ (Z >= 3.0)
            const sumScores = scoredGroups.reduce((sum, curr) => sum + curr.score, 0);
            const mean = sumScores / scoredGroups.length;
            const variance = scoredGroups.reduce((sum, curr) => sum + Math.pow(curr.score - mean, 2), 0) / scoredGroups.length;
            const stdDev = Math.sqrt(variance);

            const remainingGroups: any[] = [];

            if (stdDev > 0) {
                for (const group of scoredGroups) {
                    const zScore = (group.score - mean) / stdDev;
                    if (zScore >= 3.0) {
                        extremeAnomalies.push({ ...group, type: "EXTREME_ANOMALY", zScore });
                    } else {
                        remainingGroups.push(group);
                    }
                }
            } else {
                remainingGroups.push(...scoredGroups);
            }

            // Vòng 2: Phân tích các nhóm còn lại (Z >= 0.5)
            if (remainingGroups.length > 0) {
                const sumScores2 = remainingGroups.reduce((sum, curr) => sum + curr.score, 0);
                const mean2 = sumScores2 / remainingGroups.length;
                const variance2 = remainingGroups.reduce((sum, curr) => sum + Math.pow(curr.score - mean2, 2), 0) / remainingGroups.length;
                const stdDev2 = Math.sqrt(variance2);

                if (stdDev2 > 0) {
                    for (const group of remainingGroups) {
                        const zScore = (group.score - mean2) / stdDev2;
                        if (zScore >= 0.5) {
                            normalAnomalies.push({ ...group, type: "NORMAL_ANOMALY", zScore });
                        }
                    }
                } else {
                    for (const group of remainingGroups) {
                        if (group.score > 0) {
                            normalAnomalies.push({ ...group, type: "NORMAL_ANOMALY", zScore: 0 });
                        }
                    }
                }
            }
        }

        // Tối ưu Context Window: Cắt giảm lượng dữ liệu gửi sang LLM để tránh lỗi Rate Limit (TPM)
        // Ưu tiên giữ toàn bộ Siêu ngoại lệ (Extreme), chỉ cắt giảm Ngoại lệ thường (Normal)
        const topNormalAnomalies = normalAnomalies
            .sort((a, b) => b.zScore - a.zScore) // Lấy những log có độ lệch chuẩn cao nhất
            .slice(0, 30); // Giới hạn tối đa 30 logs để tiết kiệm Token

        const compactLogs = [...extremeAnomalies, ...topNormalAnomalies];

        logger.info("[Analytics-Service] Đã chạy Thuật toán Z-Score 2 vòng", { 
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
