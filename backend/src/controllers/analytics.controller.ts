import { asyncHandler } from "../middlewares/asyncHandle";
import { WorkSpaceIdSchema } from "../validation/workspace.validation";
import { projectIdSchema } from "../validation/project.validation";
import { getMemberRoleInWorkspace } from "../services/member.service";
import { roleGuard } from "../utils/roleGuard";
import { Permissions } from "../enums/role.enum";
import { aggregateProjectActivityLogsService } from "../services/analytics.service";
import { generateAdvancedInsightsService } from "../services/ai.service";
import ProjectModel from "../models/project.model";
import TaskModel from "../models/task.model";
import MemberModel from "../models/member.model";
import HTTP_STATUS from "../config/http.config";
import mongoose from "mongoose";

export const getAdvancedInsightsController = asyncHandler(
    async (req, res, next) => {
        const workspaceId = WorkSpaceIdSchema.parse(req.params.workspaceId);
        const projectId = projectIdSchema.parse(req.params.projectId);
        const modelId = req.query.modelId as string || undefined;
        const startDate = req.query.startDate as string || undefined;
        const endDate = req.query.endDate as string || undefined;
        const userId = req.user?._id;

        // Chỉ cho phép những người có quyền xem dự án (VIEW_ONLY hoặc cao hơn)

        const role = await getMemberRoleInWorkspace(workspaceId, userId);
        roleGuard(role.name, [Permissions.VIEW_ONLY]);

        // Tính toán khoảng thời gian
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

        // 1. Tổng hợp dữ liệu log theo ngày
        const aggregatedLogs = await aggregateProjectActivityLogsService(projectId, startDate, endDate);

        // 1.5 Lấy Context Baseline của dự án để gửi kèm cho AI
        const project = await ProjectModel.findById(projectId).select("name endDate status");
        const totalTasks = await TaskModel.countDocuments({ projectId, deletedAt: null });
        const completedTasks = await TaskModel.countDocuments({ projectId, status: "DONE", deletedAt: null });
        const unassignedTasks = await TaskModel.countDocuments({ projectId, assignedTo: null, deletedAt: null });
        
        // Bổ sung các chỉ số chẩn đoán điểm nghẽn (Bottlenecks)
        const inProgressTasks = await TaskModel.countDocuments({ projectId, status: "IN_PROGRESS", deletedAt: null });
        const inReviewTasks = await TaskModel.countDocuments({ projectId, status: "INREVIEW", deletedAt: null });
        const highPriorityTasks = await TaskModel.countDocuments({ projectId, priority: "HIGH", deletedAt: null });

        // Bổ sung chỉ số chẩn đoán thời gian (Budget/Burn-down)
        const hoursResult = await TaskModel.aggregate([
            { $match: { projectId: new mongoose.Types.ObjectId(projectId), deletedAt: null } },
            { $group: { _id: null, totalEstimated: { $sum: "$estimatedHours" }, totalLogged: { $sum: "$loggedHours" } } }
        ]);
        const totalEstimatedHours = hoursResult[0]?.totalEstimated || 0;
        const totalLoggedHours = hoursResult[0]?.totalLogged || 0;

        const now = new Date();
        const overdueTasks = await TaskModel.countDocuments({ projectId, dueDate: { $lt: now }, status: { $ne: "DONE" }, deletedAt: null });
        const memberCount = await MemberModel.countDocuments({ workspaceId });

        const contextData = {
            projectName: project?.name || "Không rõ",
            deadline: project?.endDate ? new Date(project.endDate).toLocaleDateString("vi-VN") : "Chưa thiết lập",
            status: project?.status || "ACTIVE",
            taskProgress: `${completedTasks}/${totalTasks} task đã xong (${totalTasks ? Math.round((completedTasks/totalTasks)*100) : 0}%)`,
            wipStatus: `${inProgressTasks} task đang thực thi, ${inReviewTasks} task đang chờ duyệt QA`,
            priorityRisk: `Còn ${highPriorityTasks} task quan trọng (HIGH priority) chưa xong`,
            unassignedTasks: `${unassignedTasks} task chưa được phân công cho ai`,
            overdueTasks: `${overdueTasks} task đang bị trễ hạn (overdue)`,
            timeBudget: `Đã tiêu hao ${totalLoggedHours}h / Tổng dự toán ${totalEstimatedHours}h`,
            totalActiveMembers: memberCount
        };

        // 1.8 Lấy số liệu thống kê cho Báo cáo Tự động (Automated Report)
        const memberStatsRaw = await TaskModel.aggregate([
            { $match: { projectId: new mongoose.Types.ObjectId(projectId), deletedAt: null } },
            { $unwind: "$assignedTo" },
            { $group: {
                _id: "$assignedTo",
                total: { $sum: 1 },
                todo: { $sum: { $cond: [{ $eq: ["$status", "TODO"] }, 1, 0] } },
                inProgress: { $sum: { $cond: [{ $eq: ["$status", "IN_PROGRESS"] }, 1, 0] } },
                inReview: { $sum: { $cond: [{ $eq: ["$status", "INREVIEW"] }, 1, 0] } },
                done: { $sum: { $cond: [{ $eq: ["$status", "DONE"] }, 1, 0] } },
            }},
            { $lookup: {
                from: "users",
                localField: "_id",
                foreignField: "_id",
                as: "userInfo"
            }},
            { $unwind: "$userInfo" },
            { $project: {
                _id: 0,
                userId: "$_id",
                name: "$userInfo.name",
                email: "$userInfo.email",
                profilePicture: "$userInfo.profilePicture",
                total: 1,
                todo: 1,
                inProgress: 1,
                inReview: 1,
                done: 1,
                completionRate: {
                    $cond: [
                        { $eq: ["$total", 0] },
                        0,
                        { $round: [{ $multiply: [{ $divide: ["$done", "$total"] }, 100] }, 0] }
                    ]
                }
            }}
        ]);

        const reportStats = {
            overallStats: {
                totalTasks,
                completedTasks,
                completionRate: totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0,
                inProgressTasks,
                inReviewTasks,
                highPriorityTasks,
                unassignedTasks,
                overdueTasks,
                totalEstimatedHours,
                totalLoggedHours
            },
            memberStats: memberStatsRaw
        };

        // Tính filteredReportStats (Logic: Active Tasks trong kỳ)
        const activeFilter: any = {
            projectId,
            deletedAt: null,
            createdAt: { $lte: toDate },
            $or: [
                { status: { $ne: "DONE" } }, // Vẫn đang mở
                { completedAt: { $gte: fromDate } }, // Hoàn thành sau khi kỳ bắt đầu (kể cả hoàn thành trong kỳ)
                { status: "DONE", completedAt: null, updatedAt: { $gte: fromDate } } // Fallback cho task cũ không có completedAt
            ]
        };

        const completedFilter: any = {
            projectId,
            deletedAt: null,
            status: "DONE",
            $or: [
                { completedAt: { $gte: fromDate, $lte: toDate } },
                { completedAt: null, updatedAt: { $gte: fromDate, $lte: toDate } }
            ]
        };

        const filteredTotalTasks = await TaskModel.countDocuments(activeFilter);
        const filteredCompletedTasks = await TaskModel.countDocuments(completedFilter);
        
        // Các trạng thái khác đếm dựa trên tập active
        const filteredInProgressTasks = await TaskModel.countDocuments({ ...activeFilter, status: "IN_PROGRESS" });
        const filteredInReviewTasks = await TaskModel.countDocuments({ ...activeFilter, status: "INREVIEW" });
        const filteredHighPriorityTasks = await TaskModel.countDocuments({ ...activeFilter, priority: "HIGH" });
        const filteredUnassignedTasks = await TaskModel.countDocuments({ ...activeFilter, assignedTo: null });
        const filteredOverdueTasks = await TaskModel.countDocuments({ ...activeFilter, dueDate: { $lt: now }, status: { $ne: "DONE" } });

        // Tạo activeFilter cho các query Aggregate (yêu cầu ép kiểu ObjectId)
        const aggregateActiveFilter = { ...activeFilter, projectId: new mongoose.Types.ObjectId(projectId) };

        // Phân tích sâu: Phân bổ ưu tiên
        const filteredPriorityStatsRaw = await TaskModel.aggregate([
            { $match: aggregateActiveFilter },
            { $group: { _id: "$priority", count: { $sum: 1 } } }
        ]);
        const priorityDistribution = {
            URGENT: filteredPriorityStatsRaw.find(p => p._id === 'URGENT')?.count || 0,
            HIGH: filteredPriorityStatsRaw.find(p => p._id === 'HIGH')?.count || 0,
            MEDIUM: filteredPriorityStatsRaw.find(p => p._id === 'MEDIUM')?.count || 0,
            LOW: filteredPriorityStatsRaw.find(p => p._id === 'LOW')?.count || 0,
        };

        // Phân tích sâu: Phân bổ trạng thái
        const statusDistribution = {
            TODO: await TaskModel.countDocuments({ ...activeFilter, status: "TODO" }),
            IN_PROGRESS: filteredInProgressTasks,
            INREVIEW: filteredInReviewTasks,
            DONE: filteredCompletedTasks, // Sử dụng filteredCompletedTasks chính xác theo kỳ
        };

        // Phân tích sâu: Theo dõi thời gian (Time Tracking)
        const filteredHoursRaw = await TaskModel.aggregate([
            { $match: aggregateActiveFilter },
            { $group: { _id: null, estimated: { $sum: "$estimatedHours" }, logged: { $sum: "$loggedHours" } } }
        ]);
        const filteredTotalEstimatedHours = filteredHoursRaw[0]?.estimated || 0;
        const filteredTotalLoggedHours = filteredHoursRaw[0]?.logged || 0;

        const filteredMemberStatsRaw = await TaskModel.aggregate([
            { $match: aggregateActiveFilter },
            { $unwind: "$assignedTo" },
            { $group: {
                _id: "$assignedTo",
                total: { $sum: 1 },
                todo: { $sum: { $cond: [{ $eq: ["$status", "TODO"] }, 1, 0] } },
                inProgress: { $sum: { $cond: [{ $eq: ["$status", "IN_PROGRESS"] }, 1, 0] } },
                inReview: { $sum: { $cond: [{ $eq: ["$status", "INREVIEW"] }, 1, 0] } },
                done: { $sum: { $cond: [{ $eq: ["$status", "DONE"] }, 1, 0] } },
                estimatedHours: { $sum: "$estimatedHours" },
                loggedHours: { $sum: "$loggedHours" },
            }},
            { $lookup: {
                from: "users",
                localField: "_id",
                foreignField: "_id",
                as: "userInfo"
            }},
            { $unwind: "$userInfo" },
            { $project: {
                _id: 0,
                userId: "$_id",
                name: "$userInfo.name",
                email: "$userInfo.email",
                profilePicture: "$userInfo.profilePicture",
                total: 1,
                todo: 1,
                inProgress: 1,
                inReview: 1,
                done: 1,
                estimatedHours: 1,
                loggedHours: 1,
                completionRate: {
                    $cond: [
                        { $eq: ["$total", 0] },
                        0,
                        { $round: [{ $multiply: [{ $divide: ["$done", "$total"] }, 100] }, 0] }
                    ]
                }
            }}
        ]);

        const filteredReportStats = {
            overallStats: {
                totalTasks: filteredTotalTasks,
                completedTasks: filteredCompletedTasks,
                completionRate: filteredTotalTasks ? Math.round((filteredCompletedTasks / filteredTotalTasks) * 100) : 0,
                inProgressTasks: filteredInProgressTasks,
                inReviewTasks: filteredInReviewTasks,
                highPriorityTasks: filteredHighPriorityTasks,
                unassignedTasks: filteredUnassignedTasks,
                overdueTasks: filteredOverdueTasks,
                totalEstimatedHours: filteredTotalEstimatedHours,
                totalLoggedHours: filteredTotalLoggedHours,
                priorityDistribution,
                statusDistribution
            },
            memberStats: filteredMemberStatsRaw
        };

        // 2. Gọi AI để phân tích
        const diffTime = Math.abs(toDate.getTime() - fromDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const timeFrameText = `${diffDays} ngày qua`;

        const insights = await generateAdvancedInsightsService(aggregatedLogs, contextData, modelId, timeFrameText);

        return res.status(HTTP_STATUS.OK).json({
            success: true,
            message: "Phân tích dữ liệu chuyên sâu thành công",
            data: {
                insights,
                reportStats,
                filteredReportStats
            }
        });
    }
);
