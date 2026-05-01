import { asyncHandler } from "../middlewares/asyncHandle";
import { WorkSpaceIdSchema } from "../validation/workspace.validation";
import { getWorkspaceActivityService, getWorkspaceActivityStatisticsService } from "../services/activity.service";

import { getMemberRoleInWorkspace } from "../services/member.service";
import { roleGuard } from "../utils/roleGuard";
import { Permissions } from "../enums/role.enum";
import HTTP_STATUS from "../config/http.config";

export const getWorkspaceActivityController = asyncHandler(
    async (req, res) => {
        const workspaceId = WorkSpaceIdSchema.parse(req.params.workspaceId);
        const userId = req.user?._id;

        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;

        // Lấy bộ lọc từ query params
        const filters = {
            action: req.query.action as string,
            entityType: req.query.entityType as string,
            userId: req.query.userId as string,
            startDate: req.query.startDate as string,
            endDate: req.query.endDate as string,
        };

        // Kiểm tra quyền: Chỉ thành viên Workspace mới được xem nhật ký
        const role = await getMemberRoleInWorkspace(workspaceId, userId);
        roleGuard(role.name, [Permissions.VIEW_ONLY]);

        const result = await getWorkspaceActivityService(workspaceId, limit, page, filters);

        return res.status(HTTP_STATUS.OK).json({
            success: true,
            message: "Lấy nhật ký hoạt động thành công",
            ...result
        });
    }
);

export const getWorkspaceActivityStatisticsController = asyncHandler(
    async (req, res) => {
        const workspaceId = WorkSpaceIdSchema.parse(req.params.workspaceId);
        const userId = req.user?._id;

        // Kiểm tra quyền
        const role = await getMemberRoleInWorkspace(workspaceId, userId);
        roleGuard(role.name, [Permissions.VIEW_ONLY]);

        const stats = await getWorkspaceActivityStatisticsService(workspaceId);

        return res.status(HTTP_STATUS.OK).json({
            success: true,
            message: "Lấy thống kê hoạt động thành công",
            stats
        });
    }
);

