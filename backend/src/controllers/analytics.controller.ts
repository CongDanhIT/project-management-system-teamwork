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
        const userId = req.user?._id;

        // Chỉ cho phép những người có quyền xem dự án (VIEW_ONLY hoặc cao hơn)

        const role = await getMemberRoleInWorkspace(workspaceId, userId);
        roleGuard(role.name, [Permissions.VIEW_ONLY]);

        // 1. Tổng hợp dữ liệu log
        const aggregatedLogs = await aggregateProjectActivityLogsService(projectId);

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

        // 2. Gọi AI để phân tích
        const insights = await generateAdvancedInsightsService(aggregatedLogs, contextData, modelId);

        return res.status(HTTP_STATUS.OK).json({
            success: true,
            message: "Phân tích dữ liệu chuyên sâu thành công",
            data: insights
        });
    }
);
