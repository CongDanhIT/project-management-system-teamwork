import mongoose from "mongoose";
import ActivityLogModel, { ActivityActionEnum, ActivityEntityTypeEnum } from "../models/activity-log.model";
import logger from "../utils/logger";

export const logActivityService = async (params: {
    workspaceId: string;
    projectId?: string;
    userId: string;
    action: ActivityActionEnum;
    entityType: ActivityEntityTypeEnum;
    entityId: string;
    details?: {
        oldValue?: any;
        newValue?: any;
        summary?: string;
    };
}) => {
    try {
        const log = new ActivityLogModel({
            workspaceId: new mongoose.Types.ObjectId(params.workspaceId),
            projectId: params.projectId ? new mongoose.Types.ObjectId(params.projectId) : undefined,
            userId: new mongoose.Types.ObjectId(params.userId),
            action: params.action,
            entityType: params.entityType,
            entityId: new mongoose.Types.ObjectId(params.entityId),
            details: params.details
        });

        await log.save();
        // Sau này có thể thêm logic bắn Socket.io tại đây để cập nhật timeline real-time
        return log;
    } catch (error) {
        // Chúng ta log lỗi nhưng không throw để tránh làm sập luồng nghiệp vụ chính (Task creation/update)
        logger.error("[ACTIVITY-LOG-ERROR] Lỗi khi ghi nhật ký:", error);
        return null;
    }
};

/**
 * Lấy danh sách nhật ký của Workspace có phân trang và bộ lọc
 */
export const getWorkspaceActivityService = async (
    workspaceId: string, 
    limit: number = 20, 
    page: number = 1,
    filters?: {
        action?: string;
        entityType?: string;
        userId?: string;
        startDate?: string;
        endDate?: string;
    }
) => {
    const skip = (page - 1) * limit;

    // Xây dựng query động
    const query: any = {
        workspaceId: new mongoose.Types.ObjectId(workspaceId)
    };

    if (filters?.action) query.action = filters.action;
    if (filters?.entityType) query.entityType = filters.entityType;
    if (filters?.userId) query.userId = new mongoose.Types.ObjectId(filters.userId);
    
    if (filters?.startDate || filters?.endDate) {
        query.createdAt = {};
        if (filters.startDate) query.createdAt.$gte = new Date(filters.startDate);
        if (filters.endDate) {
            const end = new Date(filters.endDate);
            end.setHours(23, 59, 59, 999);
            query.createdAt.$lte = end;
        }
    }

    const [logs, totalCount] = await Promise.all([
        ActivityLogModel.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate("userId", "name profilePicture")
            .populate("projectId", "name emoji")
            .lean(),
        ActivityLogModel.countDocuments(query)
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return {
        activities: logs,
        pagination: {
            currentPage: page,
            totalPages,
            totalCount
        }
    };
};

/**
 * Lấy danh sách nhật ký của một Dự án cụ thể
 */
export const getProjectActivityService = async (projectId: string, limit: number = 20) => {
    return await ActivityLogModel.find({ 
        projectId: new mongoose.Types.ObjectId(projectId) 
    })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate("userId", "name profilePicture");
};

/**
 * Lấy thống kê số lượng hoạt động theo ngày (phục vụ Heatmap)
 */
export const getWorkspaceActivityStatisticsService = async (workspaceId: string, days: number = 365) => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const stats = await ActivityLogModel.aggregate([
        {
            $match: {
                workspaceId: new mongoose.Types.ObjectId(workspaceId),
                createdAt: { $gte: startDate }
            }
        },
        {
            $group: {
                _id: {
                    $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
                },
                count: { $sum: 1 }
            }
        },
        {
            $sort: { "_id": 1 }
        }
    ]);

    return stats.map(item => ({
        date: item._id,
        count: item.count
    }));
};

export const logActivity = logActivityService;
