import mongoose from "mongoose";
import ProjectModel from "../models/project.model";
import TaskModel from "../models/task.model";
import { TaskStatusEnum } from "../enums/task.enum";
import { ProjectStatusEnum, ProjectStatusEnumType } from "../enums/projectStatus.enum";
import { getDashboardTimeFilterMatch } from "../utils/date";
import ProjectAnalyticsSnapshotModel from "../models/project-analytics-snapshot.model";
import logger from "../utils/logger";
import { logActivity } from "./activity.service";
import { ActivityActionEnum, ActivityEntityTypeEnum } from "../models/activity-log.model";



export const createProjectService = async (workspaceId: string, body: {
    name: string;
    description?: string | null;
    emoji?: string | null;
    status?: ProjectStatusEnumType;
    startDate?: Date | null;
    endDate?: Date | null;
    coverUrl?: string | null;
    coverPosition?: number;
}, userId: string) => {
    const project = new ProjectModel({
        ...body,
        workspaceId,
        createdBy: userId
    })
    await project.save();

    // Ghi nhật ký
    await logActivity({
        workspaceId,
        projectId: (project._id as any).toString(),
        userId,
        action: ActivityActionEnum.CREATE_PROJECT,
        entityType: ActivityEntityTypeEnum.PROJECT,
        entityId: (project._id as any).toString(),
        details: {
            summary: `đã tạo dự án mới: ${project.name}`
        }
    });

    // Trả về kèm các trường placeholder cho UI cache

    return {
        ...project.toObject(),
        totalTasks: 0,
        completedTasks: 0
    };
};


export const getProjectsInWorkspaceService = async (
    workspaceId: string, 
    pageSize: number, 
    pageNumber: number,
    timeFilters?: { year?: number, month?: number, quarter?: number }
) => {
    const skip = (pageNumber - 1) * pageSize;
    const workspaceIdObj = new mongoose.Types.ObjectId(workspaceId);

    const query = { workspaceId: workspaceIdObj, deletedAt: null };

    // 1. Tính tổng số dự án để phân trang
    const totalCount = await ProjectModel.countDocuments(query);

    // 2. Aggregation để lấy dự án kèm số lượng task
    const projects = await ProjectModel.aggregate([
        { $match: query },
        { $sort: { lastAccessedAt: -1, viewCount: -1 } },
        { $skip: skip },
        { $limit: pageSize },
        // Lookup tasks để đếm (chỉ lấy task chưa xóa)
        {
            $lookup: {
                from: "tasks",
                let: { projectId: "$_id" },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ["$projectId", "$$projectId"] },
                                    { $eq: ["$deletedAt", null] }
                                ]
                            }
                        }
                    },
                    // Lọc task theo thời gian
                    ...(timeFilters?.year ? [{ $match: getDashboardTimeFilterMatch(timeFilters) }] : [])
                ],
                as: "tasks"
            }
        },
        // Chèn thông tin người tạo (Populate tương đương)
        {
            $lookup: {
                from: "users",
                localField: "createdBy",
                foreignField: "_id",
                as: "createdBy"
            }
        },
        { $unwind: { path: "$createdBy", preserveNullAndEmptyArrays: true } },
        // Tính toán totalTasks và completedTasks
        {
            $project: {
                _id: 1,
                name: 1,
                description: 1,
                emoji: 1,
                workspaceId: 1,
                status: 1,
                startDate: 1,
                endDate: 1,
                createdAt: 1,
                updatedAt: 1,
                lastAccessedAt: 1,
                viewCount: 1,
                coverUrl: 1,
                coverPositionX: 1,
                coverPositionY: 1,
                "createdBy._id": 1,
                "createdBy.name": 1,
                "createdBy.profilePicture": 1,
                favoritedBy: 1,
                totalTasks: { $size: "$tasks" },
                completedTasks: {
                    $size: {
                        $filter: {
                            input: "$tasks",
                            as: "task",
                            cond: {
                                $or: [
                                    { $eq: ["$$task.status", TaskStatusEnum.DONE] },
                                    { $eq: ["$$task.status", TaskStatusEnum.COMPLETED] }
                                ]
                            }
                        }
                    }
                },
                inProgressTasks: {
                    $size: {
                        $filter: {
                            input: "$tasks",
                            as: "task",
                            cond: { $eq: ["$$task.status", TaskStatusEnum.IN_PROGRESS] }
                        }
                    }
                },
                overdueTasks: {
                    $size: {
                        $filter: {
                            input: "$tasks",
                            as: "task",
                            cond: {
                                $and: [
                                    { $ne: ["$$task.dueDate", null] },
                                    { $lt: ["$$task.dueDate", "$$NOW"] },
                                    { $not: { $in: ["$$task.status", [TaskStatusEnum.DONE, TaskStatusEnum.COMPLETED]] } }
                                ]
                            }
                        }
                    }
                }
            }
        }
    ]);

    const totalPages = Math.ceil(totalCount / pageSize);
    return { projects, totalCount, totalPages, skip };
};

export const getProjectByIdService = async (projectId: string, workspaceId: string, userId?: string) => {
    const project = await ProjectModel.findOneAndUpdate(
        { _id: projectId, workspaceId, deletedAt: null },
        {
            $inc: { viewCount: 1 },
            $set: { lastAccessedAt: new Date() }
        },
        { new: true }
    ).populate("createdBy", "_id name profilePicture");

    if (!project) {
        throw new Error("Không tìm thấy dự án hoặc dự án đã bị đóng băng/xóa");
    }

    return project;
};

export const getProjectAnalyticsService = async (projectId: string, workspaceId: string, phaseId?: string) => {
    const project = await ProjectModel.findOne({ _id: projectId, workspaceId, deletedAt: null });
    if (!project) {
        throw new Error("Không tìm thấy dự án");
    }
    const currentDate = new Date();
    const next24Hours = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000);
    const nextWeek = new Date();
    nextWeek.setDate(currentDate.getDate() + 7);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Lấy dữ liệu thực tế hiện tại
    const taskAnalytics = await TaskModel.aggregate([
        {
            $match: {
                projectId: new mongoose.Types.ObjectId(projectId),
                deletedAt: null,
                ...(phaseId ? { phaseId: new mongoose.Types.ObjectId(phaseId) } : {})
            },
        },
        {
            $facet: {
                totalTasks: [{ $count: "count" }],
                overdueTasks: [
                    {
                        $match: {
                            dueDate: { $lt: currentDate },
                            status: { $nin: [TaskStatusEnum.DONE, TaskStatusEnum.COMPLETED] }
                        }
                    },
                    { $count: "count" }
                ],
                completedTasks: [
                    {
                        $match: { status: { $in: [TaskStatusEnum.DONE, TaskStatusEnum.COMPLETED] } }
                    },
                    { $count: "count" }
                ],
                inProgressTasks: [
                    {
                        $match: { status: { $in: [TaskStatusEnum.IN_PROGRESS, TaskStatusEnum.INREVIEW] } }
                    },
                    { $count: "count" }
                ],
                unassignedTasks: [
                    {
                        $match: {
                            $or: [
                                { assignedTo: { $exists: false } },
                                { assignedTo: { $size: 0 } }
                            ]
                        }
                    },
                    { $count: "count" }
                ],
                overdueTasksList: [
                    {
                        $match: {
                            dueDate: { $lt: currentDate, $ne: null },
                            status: { $nin: [TaskStatusEnum.DONE, TaskStatusEnum.COMPLETED] }
                        }
                    },
                    { $sort: { dueDate: 1 } },
                    { $limit: 5 },
                    {
                        $lookup: {
                            from: "users",
                            localField: "assignedTo",
                            foreignField: "_id",
                            as: "assignedTo"
                        }
                    },
                    {
                        $project: {
                            _id: 1, title: 1, status: 1, priority: 1, dueDate: 1, workspaceId: 1,
                            "assignedTo._id": 1, "assignedTo.name": 1, "assignedTo.profilePicture": 1
                        }
                    }
                ],
                upcomingTasksList: [
                    {
                        $match: {
                            dueDate: { $gte: currentDate, $lte: next24Hours },
                            status: { $nin: [TaskStatusEnum.DONE, TaskStatusEnum.COMPLETED] }
                        }
                    },
                    { $sort: { dueDate: 1 } },
                    { $limit: 5 },
                    {
                        $lookup: {
                            from: "users",
                            localField: "assignedTo",
                            foreignField: "_id",
                            as: "assignedTo"
                        }
                    },
                    {
                        $project: {
                            _id: 1, title: 1, status: 1, priority: 1, dueDate: 1, workspaceId: 1,
                            "assignedTo._id": 1, "assignedTo.name": 1, "assignedTo.profilePicture": 1
                        }
                    }
                ],
                statusDistribution: [
                    {
                        $group: {
                            _id: "$status",
                            count: { $sum: 1 }
                        }
                    },
                    {
                        $project: {
                            status: "$_id",
                            count: 1,
                            _id: 0
                        }
                    }
                ],
                tagDistribution: [
                    { $unwind: { path: "$tags", preserveNullAndEmptyArrays: true } },
                    {
                        $lookup: {
                            from: "tags",
                            localField: "tags",
                            foreignField: "_id",
                            as: "tagDetails"
                        }
                    },
                    { $unwind: { path: "$tagDetails", preserveNullAndEmptyArrays: true } },
                    {
                        $group: {
                            _id: { $ifNull: ["$tagDetails.name", "Chưa phân loại"] },
                            count: { $sum: 1 }
                        }
                    },
                    {
                        $project: {
                            tag: "$_id",
                            count: 1,
                            _id: 0
                        }
                    }
                ],
                memberDistribution: [
                    { $unwind: { path: "$assignedTo", preserveNullAndEmptyArrays: true } },
                    {
                        $lookup: {
                            from: "users",
                            localField: "assignedTo",
                            foreignField: "_id",
                            as: "userDetails"
                        }
                    },
                    { $unwind: { path: "$userDetails", preserveNullAndEmptyArrays: true } },
                    {
                        $group: {
                            _id: { $ifNull: ["$userDetails.name", "Chưa phân công"] },
                            count: { $sum: 1 }
                        }
                    },
                    {
                        $project: {
                            name: "$_id",
                            count: 1,
                            _id: 0
                        }
                    }
                ],
                priorityDistribution: [
                    {
                        $group: {
                            _id: "$priority",
                            count: { $sum: 1 }
                        }
                    },
                    {
                        $project: {
                            priority: "$_id",
                            count: 1,
                            _id: 0
                        }
                    }
                ],
                deadlinePerformance: [
                    {
                        $project: {
                            isDone: { $in: ["$status", [TaskStatusEnum.DONE, TaskStatusEnum.COMPLETED]] },
                            dueDate: 1,
                            completedAt: 1,
                            updatedAt: 1,
                            isOverdue: { 
                                $and: [
                                    { $ne: ["$dueDate", null] },
                                    { $lt: ["$dueDate", currentDate] },
                                    { $not: { $in: ["$status", [TaskStatusEnum.DONE, TaskStatusEnum.COMPLETED]] } }
                                ]
                            }
                        }
                    },
                    {
                        $project: {
                            earlyTime: {
                                $cond: [
                                    { $and: ["$isDone", { $ne: [{ $ifNull: ["$completedAt", "$updatedAt"] }, null] }, { $ne: ["$dueDate", null] }, { $lte: [{ $ifNull: ["$completedAt", "$updatedAt"] }, "$dueDate"] }] },
                                    { $subtract: ["$dueDate", { $ifNull: ["$completedAt", "$updatedAt"] }] },
                                    0
                                ]
                            },
                            lateTime: {
                                $cond: [
                                    { $and: ["$isDone", { $ne: [{ $ifNull: ["$completedAt", "$updatedAt"] }, null] }, { $ne: ["$dueDate", null] }, { $gt: [{ $ifNull: ["$completedAt", "$updatedAt"] }, "$dueDate"] }] },
                                    { $subtract: [{ $ifNull: ["$completedAt", "$updatedAt"] }, "$dueDate"] },
                                    0
                                ]
                            },
                            ongoingLateTime: {
                                $cond: [
                                    { $and: ["$isOverdue", { $ne: ["$dueDate", null] }] },
                                    { $subtract: [currentDate, "$dueDate"] },
                                    0
                                ]
                            }
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            totalEarlyms: { $sum: "$earlyTime" },
                            totalLatems: { $sum: "$lateTime" },
                            totalOngoingLatems: { $sum: "$ongoingLateTime" },
                            earlyTasksCount: { $sum: { $cond: [{ $gt: ["$earlyTime", 0] }, 1, 0] } },
                            lateTasksCount: { $sum: { $cond: [{ $gt: ["$lateTime", 0] }, 1, 0] } }
                        }
                    }
                ]
            },
        },
    ]);

    const result = taskAnalytics[0] || {};
    const totalTasks = result.totalTasks?.[0]?.count || 0;
    const overdueTasks = result.overdueTasks?.[0]?.count || 0;
    const completedTasks = result.completedTasks?.[0]?.count || 0;
    const inProgressTasks = result.inProgressTasks?.[0]?.count || 0;
    const unassignedTasks = result.unassignedTasks?.[0]?.count || 0;
    const overdueTasksList = result.overdueTasksList || [];
    const upcomingTasksList = result.upcomingTasksList || [];
    const statusDistribution = result.statusDistribution || [];
    const priorityDistribution = result.priorityDistribution || [];
    const tagDistribution = result.tagDistribution || [];
    const memberDistribution = result.memberDistribution || [];

    // Hiệu năng thời hạn (Deadline Performance)
    const perf = result.deadlinePerformance?.[0] || { 
        totalEarlyms: 0, totalLatems: 0, totalOngoingLatems: 0, earlyTasksCount: 0, lateTasksCount: 0 
    };

    logger.info(`[ANALYTICS] Project: ${projectId}, Perf:`, perf);

    const totalEarlyHours = parseFloat((perf.totalEarlyms / 3600000).toFixed(1));
    const totalLateHours = parseFloat((perf.totalLatems / 3600000).toFixed(1));
    const totalOngoingLateHours = parseFloat((perf.totalOngoingLatems / 3600000).toFixed(1));

    // 2. Tỉ lệ hoàn thành tổng thể
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    // 3. Truy vấn toàn bộ Snapshots từ Database để làm cơ sở tính toán
    const allSnapshots = await ProjectAnalyticsSnapshotModel.find({
        projectId: new mongoose.Types.ObjectId(projectId)
    }).sort({ date: 1 });

    // Lọc lấy các bản ghi Snapshot THỰC SỰ TRONG QUÁ KHỨ (trước ngày hôm nay)
    const yesterdayDate = new Date(today);
    yesterdayDate.setHours(0, 0, 0, 0);

    const pastSnapshots = allSnapshots.filter(s => new Date(s.date) < yesterdayDate);
    
    // Snapshot của ngày gần nhất trước hôm nay (thường là ngày hôm qua)
    const lastSnapshot = pastSnapshots.length > 0 ? pastSnapshots[pastSnapshots.length - 1] : null;

    // Hiệu suất hôm nay (Số task thực tế hoàn thành tính từ mốc snapshot cũ nhất gần đây)
    const tasksDoneToday = lastSnapshot ? (completedTasks - lastSnapshot.completedTasks) : completedTasks;

    // Chỉ lấy tối đa 7 snapshot quá khứ gần nhất để tính trung bình nhịp độ (Baseline)
    const baselineSnapshots = pastSnapshots.slice(-7);

    let performanceIndex = 100;

    if (baselineSnapshots.length > 0) {
        const sumDailyCompleted = baselineSnapshots.reduce((sum, snap) => sum + (snap.dailyCompletedTasks || 0), 0);
        const avgDailyPast = sumDailyCompleted / baselineSnapshots.length;

        if (avgDailyPast !== 0) {
            performanceIndex = ((tasksDoneToday / avgDailyPast) - 1) * 100;
        } else {
            performanceIndex = tasksDoneToday > 0 ? 100 : (tasksDoneToday < 0 ? -100 : 0);
        }

        performanceIndex = Math.round(performanceIndex);
    }

    return {
        totalTasks,
        overdueTasks,
        completedTasks,
        inProgressTasks,
        unassignedTasks,
        overdueTasksList,
        upcomingTasksList,
        statusDistribution,
        priorityDistribution,
        tagDistribution,
        memberDistribution,
        completionRate,
        tasksDoneToday,
        todayPerformance: performanceIndex,
        isImproving: tasksDoneToday > 0 && (lastSnapshot ? tasksDoneToday >= (lastSnapshot.dailyCompletedTasks || 0) : true),
        deadlinePerformance: {
            totalEarlyHours,
            totalLateHours,
            totalOngoingLateHours,
            earlyTasksCount: perf.earlyTasksCount,
            lateTasksCount: perf.lateTasksCount
        }
    };
};

/**
 * Lấy lịch sử dữ liệu analytics trong 15 ngày gần nhất
 * Đã khôi phục và tích hợp dữ liệu Real-time
 */
export const getProjectAnalyticsHistoryService = async (projectId: string, workspaceId: string) => {
    // 1. Lấy dữ liệu thực tế hiện tại
    const currentData = await getProjectAnalyticsService(projectId, workspaceId);
    if (!currentData) {
        throw new Error("Không thể tải dữ liệu phân tích dự án");
    }

    // 2. Lấy snapshots hiện có (tối đa 25 bản ghi để có buffer tính toán rolling)
    const history = await ProjectAnalyticsSnapshotModel.find({
        projectId: new mongoose.Types.ObjectId(projectId)
    })
    .sort({ date: -1 })
    .limit(25)
    .lean();

    // 3. Xây dựng Timeline 14 ngày (từ 13 ngày trước đến hôm nay)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const timeline: any[] = [];
    const snapshotsMap = new Map();
    history.forEach(s => {
        const dateStr = new Date(s.date).toDateString();
        snapshotsMap.set(dateStr, s);
    });

    // Tạo mảng 14 ngày thô (Dữ liệu snapshot hoặc điền bù)
    for (let i = 13; i >= 0; i--) {
        const targetDate = new Date(today);
        targetDate.setDate(today.getDate() - i);
        const dateStr = targetDate.toDateString();
        const isToday = i === 0;

        if (isToday) {
            timeline.push({
                date: today,
                totalTasks: currentData.totalTasks,
                completedTasks: currentData.completedTasks,
                overdueTasks: currentData.overdueTasks,
                unassignedTasks: currentData.unassignedTasks || 0,
                dailyCompletedTasks: currentData.tasksDoneToday,
                isRealTime: true
            });
        } else if (snapshotsMap.has(dateStr)) {
            const s = snapshotsMap.get(dateStr);
            timeline.push({
                date: targetDate,
                totalTasks: s.totalTasks,
                completedTasks: s.completedTasks,
                overdueTasks: s.overdueTasks,
                unassignedTasks: s.unassignedTasks || 0,
                dailyCompletedTasks: s.dailyCompletedTasks || 0
            });
        } else {
            const lastAvailable = timeline.length > 0 ? timeline[timeline.length - 1] : { 
                totalTasks: 0, completedTasks: 0, overdueTasks: 0, unassignedTasks: 0 
            };
            timeline.push({
                date: targetDate,
                totalTasks: lastAvailable.totalTasks,
                completedTasks: lastAvailable.completedTasks,
                overdueTasks: lastAvailable.overdueTasks,
                unassignedTasks: lastAvailable.unassignedTasks,
                dailyCompletedTasks: 0,
                isPlaceholder: true
            });
        }
    }

    // 4. Tính toán Burndown Data
    // Lấy thông tin dự án để có ngày bắt đầu/kết thúc lý tưởng
    const project = await ProjectModel.findById(projectId).select("startDate endDate createdAt").lean();
    if (!project) return timeline; // Không tìm thấy dự án thì trả về timeline thô

    // Đường lý tưởng (Ideal Burn): Giảm dần từ totalTasks về 0 theo thời gian dự án
    const projectStart = project.startDate || project.createdAt;
    const projectEnd = project.endDate;
    const totalTasksAtStart = currentData.totalTasks;


    // 5. Trả về timeline kèm dữ liệu bổ sung
    return timeline.map((entry, index) => {
        const entryDate = new Date(entry.date);
        
        // Tính toán Ideal Burndown (nếu có đủ thông tin ngày tháng)
        let idealTasksRemaining = null;
        if (projectStart && projectEnd && projectEnd > projectStart) {
            const totalDuration = projectEnd.getTime() - projectStart.getTime();
            const timeElapsed = entryDate.getTime() - projectStart.getTime();
            
            if (timeElapsed < 0) {
                idealTasksRemaining = totalTasksAtStart;
            } else if (timeElapsed > totalDuration) {
                idealTasksRemaining = 0;
            } else {
                const completionRatio = timeElapsed / totalDuration;
                idealTasksRemaining = Math.max(0, totalTasksAtStart * (1 - completionRatio));
            }
        }

        // Tính toán Performance Index (Rolling 7-day)
        let performanceIndex = 100;
        if (index === timeline.length - 1) {
            performanceIndex = currentData.todayPerformance;
        } else {
            const dailyDone = entry.dailyCompletedTasks || 0;
            const previousEntries = timeline.slice(Math.max(0, index - 7), index);
            
            if (previousEntries.length > 0) {
                const sumPast = previousEntries.reduce((sum, e) => sum + (e.dailyCompletedTasks || 0), 0);
                const avgPast = sumPast / previousEntries.length;
                
                if (avgPast !== 0) {
                    performanceIndex = ((dailyDone / avgPast) - 1) * 100;
                } else {
                    performanceIndex = dailyDone > 0 ? 100 : (dailyDone < 0 ? -100 : 0);
                }
            } else {
                performanceIndex = dailyDone > 0 ? 100 : 0;
            }
        }

        return {
            ...entry,
            remainingTasks: entry.totalTasks - entry.completedTasks,
            idealTasksRemaining: idealTasksRemaining !== null ? Math.round(idealTasksRemaining) : null,
            performanceIndex: Math.round(performanceIndex)
        };
    });
};

export const updateProjectService = async (projectId: string, workspaceId: string,
    body: {
        name?: string,
        description?: string | null,
        emoji?: string | null,
        status?: ProjectStatusEnumType,
        startDate?: Date | null,
        endDate?: Date | null,
        coverUrl?: string | null;
        coverPosition?: number;
    }, userId?: string) => {

    // 1. Capture old value
    const oldProject = await ProjectModel.findOne({ _id: projectId, workspaceId, deletedAt: null });

    const project = await ProjectModel.findOneAndUpdate(
        { _id: projectId, workspaceId, deletedAt: null },
        body,
        { new: true, runValidators: true }
    );
    if (!project || !oldProject) {
        throw new Error("Không tìm thấy dự án hoặc dự án đã bị đóng băng/xóa");
    }

    // Ghi nhật ký
    if (userId) {
        const changedFields = Object.keys(body);
        const oldValues: any = {};
        changedFields.forEach(key => {
            oldValues[key] = (oldProject as any)[key];
        });

        let detailedSummary = `đã cập nhật thông tin dự án: **${project.name}**`;
        if (changedFields.includes('name') && oldProject.name !== project.name) {
            detailedSummary = `đã đổi tên dự án từ **${oldProject.name}** thành **${project.name}**`;
        } else if (changedFields.includes('status') && oldProject.status !== project.status) {
            detailedSummary = `đã chuyển trạng thái dự án **${project.name}** sang **${project.status}**`;
        }

        await logActivity({
            workspaceId,
            projectId: (project._id as any).toString(),
            userId,
            action: ActivityActionEnum.UPDATE_PROJECT,
            entityType: ActivityEntityTypeEnum.PROJECT,
            entityId: (project._id as any).toString(),
            details: {
                oldValue: oldValues,
                newValue: body,
                summary: detailedSummary
            }
        });
    }

    return project;
};



export const deleteProjectService = async (projectId: string, workspaceId: string, userId: string) => {


    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        // 1. Soft Delete Project
        const project = await ProjectModel.findOneAndUpdate(
            { _id: projectId, workspaceId, deletedAt: null },
            { deletedAt: new Date() },
            { new: true, session }
        );

        if (!project) {
            throw new Error("Không tìm thấy dự án hoặc dự án đã bị xóa/đóng băng");
        }

        // 2. Cascade Soft Delete cho toàn bộ Task thuộc Project này
        await TaskModel.updateMany(
            { projectId, workspaceId, deletedAt: null },
            { deletedAt: new Date() },
            { session }
        );

        // Ghi nhật ký
        await logActivity({
            workspaceId,
            projectId: (project._id as any).toString(),
            userId,
            action: ActivityActionEnum.DELETE_PROJECT,
            entityType: ActivityEntityTypeEnum.PROJECT,
            entityId: (project._id as any).toString(),
            details: {
                summary: `đã xóa dự án: ${project.name}`
            }
        });

        await session.commitTransaction();
        return project;

    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
};

// [AI-ADDED] Khôi phục dự án từ thùng rác
export const restoreProjectService = async (projectId: string, workspaceId: string, userId: string) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        // 1. Restore Project
        const project = await ProjectModel.findOneAndUpdate(
            { _id: projectId, workspaceId, deletedAt: { $ne: null } },
            { deletedAt: null },
            { new: true, session }
        );

        if (!project) {
            throw new Error("Không tìm thấy dự án trong thùng rác");
        }

        // 2. Cascade Restore cho toàn bộ Task thuộc Project này
        await TaskModel.updateMany(
            { projectId, workspaceId, deletedAt: { $ne: null } },
            { deletedAt: null },
            { session }
        );

        // Ghi nhật ký
        await logActivity({
            workspaceId,
            projectId: (project._id as any).toString(),
            userId,
            action: ActivityActionEnum.RESTORE_PROJECT,
            entityType: ActivityEntityTypeEnum.PROJECT,
            entityId: (project._id as any).toString(),
            details: {
                summary: `đã khôi phục dự án: ${project.name}`
            }
        });

        await session.commitTransaction();
        return project;

    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
};

// [AI-ADDED] Xóa vĩnh viễn dự án (Hard Delete) và toàn bộ dữ liệu liên quan
export const permanentDeleteProjectService = async (projectId: string, workspaceId: string, userId: string) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        // 1. Kiểm tra dự án có tồn tại trong thùng rác không?
        const project = await ProjectModel.findOne({ 
            _id: projectId, 
            workspaceId, 
            deletedAt: { $ne: null } 
        }).session(session);

        if (!project) {
            throw new Error("Không tìm thấy dự án trong thùng rác để xóa vĩnh viễn");
        }

        // 2. Cascade Hard Delete:
        // - Xóa toàn bộ Task và Subtasks
        await TaskModel.deleteMany({ projectId, workspaceId }).session(session);
        
        // - Xóa Project Analytics Snapshots
        const ProjectAnalyticsSnapshotModel = mongoose.model("ProjectAnalyticsSnapshot");
        await ProjectAnalyticsSnapshotModel.deleteMany({ projectId }).session(session);

        // - Xóa Activity Logs liên quan đến dự án này
        const ActivityLogModel = mongoose.model("ActivityLog");
        await ActivityLogModel.deleteMany({ projectId }).session(session);

        // 3. Xóa vĩnh viễn dự án
        await ProjectModel.deleteOne({ _id: projectId }).session(session);

        await session.commitTransaction();
        return { success: true, message: "Dự án đã được xóa vĩnh viễn" };

    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
};

// [AI-ADDED] Lấy danh sách dự án trong thùng rác
export const getDeletedProjectsInWorkspaceService = async (workspaceId: string) => {
    const projects = await ProjectModel.find({
        workspaceId,
        deletedAt: { $ne: null }
    })
        .populate("createdBy", "_id name profilePicture")
        .sort({ deletedAt: -1 });

    return projects;
};

// [AI-ADDED] Toggle trạng thái yêu thích dự án
export const toggleFavoriteProjectService = async (projectId: string, workspaceId: string, userId: string) => {
    const project = await ProjectModel.findOne({ _id: projectId, workspaceId, deletedAt: null });
    if (!project) {
        throw new Error("Không tìm thấy dự án");
    }

    const userIdObj = new mongoose.Types.ObjectId(userId);
    const isFavorited = project.favoritedBy.some(id => id.equals(userIdObj));

    if (isFavorited) {
        // Bỏ yêu thích
        project.favoritedBy = project.favoritedBy.filter(id => !id.equals(userIdObj));
    } else {
        // Thêm vào yêu thích
        project.favoritedBy.push(userIdObj);
    }

    await project.save();
    return { project, isFavorited: !isFavorited };
};

// [AI-ADDED] Lấy danh sách dự án yêu thích của người dùng trong Workspace
export const getFavoriteProjectsInWorkspaceService = async (workspaceId: string, userId: string) => {
    const userIdObj = new mongoose.Types.ObjectId(userId);
    const projects = await ProjectModel.find({
        workspaceId,
        deletedAt: null,
        favoritedBy: userIdObj
    })
        .select("_id name emoji favoritedBy")
        .sort({ name: 1 }); // Sắp xếp A-Z theo tên

    return projects;
};

/**
 * Tự động lưu snapshot analytics cho tất cả các dự án 
 * (Dùng cho Cron job cuối ngày)
 */
export const saveDailySnapshotsForAllProjects = async () => {
    try {
        // Chỉ lấy các dự án đang hoạt động (không bao gồm PLANNING, COMPLETED, FROZEN, và đã xóa)
        const projects = await ProjectModel.find({
            deletedAt: null,
            status: { $nin: [ProjectStatusEnum.PLANNING, ProjectStatusEnum.COMPLETED, ProjectStatusEnum.FROZEN] }
        }).select("_id workspaceId");

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        logger.info(`[SNAPSHOT-PROJECT] Bắt đầu lưu snapshot cho ${projects.length} dự án (Ngày: ${today.toLocaleDateString()})...`);

        for (const project of projects) {
            const projectId = (project._id as mongoose.Types.ObjectId).toString();
            const workspaceId = (project.workspaceId as mongoose.Types.ObjectId).toString();

            // Lấy dữ liệu analytics hiện tại
            const data = await getProjectAnalyticsService(projectId, workspaceId);
            if (!data) {
                logger.warn(`[SNAPSHOT-PROJECT-WARN] Không thể lấy dữ liệu cho dự án ${projectId}, bỏ qua...`);
                continue;
            }

            // Cập nhật hoặc thêm mới snapshot cho ngày hôm nay
            await ProjectAnalyticsSnapshotModel.findOneAndUpdate(
                { projectId, date: today },
                {
                    workspaceId,
                    totalTasks: data.totalTasks,
                    completedTasks: data.completedTasks,
                    overdueTasks: data.overdueTasks,
                    inProgressTasks: data.inProgressTasks,
                    unassignedTasks: data.unassignedTasks,
                    dailyCompletedTasks: data.tasksDoneToday,
                    performanceIndex: data.todayPerformance
                },
                { upsert: true, new: true }
            );
        }

        logger.info("[SNAPSHOT-PROJECT] Đã hoàn thành lưu snapshot dự án hàng ngày.");
    } catch (error) {
        logger.error("[SNAPSHOT-PROJECT-ERR] Lỗi khi lưu snapshot dự án:", { error });
    }
};

