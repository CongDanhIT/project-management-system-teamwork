import { Router } from "express";
import {
    changeWorkSpaceMemberRoleController,
    createWorkspaceController,
    deleteWorkspaceByIdController,
    getAllWorkspaceIsMemberController,
    getWorkspaceAnalyticsController,
    getWorkspaceAnalyticsHistoryController,
    getWorkspaceByIdController,

    getWorkspaceMemberController,
    updateWorkspaceByIdController,
    resetInviteCodeController,
    removeWorkspaceMemberController,
    triggerSlackTestController,
    triggerEmailTestController,
    leaveWorkspaceController,
    startVideoCallController,
    endVideoCallController,
} from "../controllers/workspace.controller";
import { getWorkspaceRoadmapController } from "../controllers/roadmap.controller";
import { getWorkspaceExplorerController } from "../controllers/explorer.controller";

const workspaceRoutes = Router();

workspaceRoutes.get("/:workspaceId/roadmap", getWorkspaceRoadmapController);
workspaceRoutes.get("/:workspaceId/explorer", getWorkspaceExplorerController);

// tạo workspace
workspaceRoutes.post("/create/new", createWorkspaceController);
// lấy tất cả workspace của user
workspaceRoutes.get("/all", getAllWorkspaceIsMemberController);
// lấy thông tin workspace theo id
workspaceRoutes.get("/:id", getWorkspaceByIdController);
// lấy thành viên trong workspace
workspaceRoutes.get("/member/:id", getWorkspaceMemberController);
// lấy thông tin analytics trong workspace
workspaceRoutes.get("/analytics/:id", getWorkspaceAnalyticsController);
// lấy lịch sử analytics (15 ngày gần nhất)
workspaceRoutes.get("/analytics/history/:id", getWorkspaceAnalyticsHistoryController);

// thay đổi vai trò của thành viên trong workspace
workspaceRoutes.put("/change/member/role/:id", changeWorkSpaceMemberRoleController);
// update workspace
workspaceRoutes.put("/update/:id", updateWorkspaceByIdController);
// delete workspace
workspaceRoutes.delete("/delete/:id", deleteWorkspaceByIdController);

// [AI-ADDED] Tạo lại inviteCode mới (vô hiệu hóa code cũ)
workspaceRoutes.put("/:id/invite-code", resetInviteCodeController);

// [AI-ADDED] Xóa thành viên khỏi workspace
workspaceRoutes.delete("/:id/member/:memberId", removeWorkspaceMemberController);

// [AI-ADDED] Tự rời khỏi workspace
workspaceRoutes.post("/:id/leave", leaveWorkspaceController);

// [AI-ADDED] Trigger gửi thông báo test thủ công
workspaceRoutes.post("/:id/trigger-slack-test", triggerSlackTestController);
workspaceRoutes.post("/trigger-email-test", triggerEmailTestController);

// [AI-ADDED] Tính năng Video Call
workspaceRoutes.post("/:id/call/start", startVideoCallController);
workspaceRoutes.post("/:id/call/end", endVideoCallController);

export default workspaceRoutes;
