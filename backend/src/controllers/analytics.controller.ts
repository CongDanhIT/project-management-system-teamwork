import { asyncHandler } from "../middlewares/asyncHandle";
import { WorkSpaceIdSchema } from "../validation/workspace.validation";
import { projectIdSchema } from "../validation/project.validation";
import { getMemberRoleInWorkspace } from "../services/member.service";
import { roleGuard } from "../utils/roleGuard";
import { Permissions } from "../enums/role.enum";
import { aggregateProjectActivityLogsService } from "../services/analytics.service";
import { generateAdvancedInsightsService } from "../services/ai.service";
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

        // 2. Gọi AI để phân tích
        const insights = await generateAdvancedInsightsService(aggregatedLogs);

        return res.status(HTTP_STATUS.OK).json({
            success: true,
            message: "Phân tích dữ liệu chuyên sâu thành công",
            data: insights
        });
    }
);
