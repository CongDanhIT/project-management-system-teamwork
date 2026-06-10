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

export const getAdvancedInsightsController = asyncHandler(
    async (req, res, next) => {
        const workspaceId = WorkSpaceIdSchema.parse(req.params.workspaceId);
        const projectId = projectIdSchema.parse(req.params.projectId);
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
        
        const now = new Date();
        const overdueTasks = await TaskModel.countDocuments({ projectId, dueDate: { $lt: now }, status: { $ne: "DONE" }, deletedAt: null });
        const memberCount = await MemberModel.countDocuments({ workspaceId });

        const contextData = {
            projectName: project?.name || "Không rõ",
            deadline: project?.endDate ? new Date(project.endDate).toLocaleDateString("vi-VN") : "Chưa thiết lập",
            status: project?.status || "ACTIVE",
            taskProgress: `${completedTasks}/${totalTasks} task đã xong (${totalTasks ? Math.round((completedTasks/totalTasks)*100) : 0}%)`,
            unassignedTasks: `${unassignedTasks} task chưa được phân công cho ai`,
            overdueTasks: `${overdueTasks} task đang bị trễ hạn (overdue)`,
            totalActiveMembers: memberCount
        };

        // 2. Gọi AI để phân tích
        const insights = await generateAdvancedInsightsService(aggregatedLogs, contextData);

        return res.status(HTTP_STATUS.OK).json({
            success: true,
            message: "Phân tích dữ liệu chuyên sâu thành công",
            data: insights
        });
    }
);
