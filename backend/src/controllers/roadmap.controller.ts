import { asyncHandler } from "../middlewares/asyncHandle";
import { getMemberRoleInWorkspace } from "../services/member.service";
import { roleGuard } from "../utils/roleGuard";
import { Permissions } from "../enums/role.enum";
import HTTP_STATUS from "../config/http.config";
import { WorkSpaceIdSchema } from "../validation/workspace.validation";
import { getWorkspaceRoadmapService } from "../services/roadmap.service";

export const getWorkspaceRoadmapController = asyncHandler(
    async (req, res, next) => {
        const workspaceId = WorkSpaceIdSchema.parse(req.params.workspaceId);
        const userId = (req.user?._id as any).toString();

        // Kiểm tra quyền (Ít nhất phải là member của workspace)
        const role = await getMemberRoleInWorkspace(workspaceId, userId);
        roleGuard(role.name, [Permissions.VIEW_ONLY]);

        const data = await getWorkspaceRoadmapService(workspaceId);

        return res.status(HTTP_STATUS.OK).json({
            success: true,
            message: "Lấy dữ liệu lộ trình workspace thành công",
            ...data
        });
    }
);
