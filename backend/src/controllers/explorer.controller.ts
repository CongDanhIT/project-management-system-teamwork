import { asyncHandler } from "../middlewares/asyncHandle";
import { getMemberRoleInWorkspace } from "../services/member.service";
import { roleGuard } from "../utils/roleGuard";
import { Permissions } from "../enums/role.enum";
import HTTP_STATUS from "../config/http.config";
import { WorkSpaceIdSchema } from "../validation/workspace.validation";
import { getWorkspaceExplorerService } from "../services/explorer.service";

export const getWorkspaceExplorerController = asyncHandler(
    async (req, res, next) => {
        const workspaceId = WorkSpaceIdSchema.parse(req.params.workspaceId);
        const userId = (req.user?._id as any).toString();

        // Kiểm tra quyền
        const role = await getMemberRoleInWorkspace(workspaceId, userId);
        roleGuard(role.name, [Permissions.VIEW_ONLY]);

        const data = await getWorkspaceExplorerService(workspaceId);

        return res.status(HTTP_STATUS.OK).json({
            success: true,
            message: "Lấy dữ liệu tài liệu workspace thành công",
            ...data
        });
    }
);
