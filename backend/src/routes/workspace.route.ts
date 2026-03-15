import { Router } from "express";
import { changeWorkSpaceMemberRoleController, createWorkspaceController, deleteWorkspaceByIdController, getAllWorkspaceIsMemberController, getWorkspaceAnalyticsController, getWorkspaceByIdController, getWorkspaceMemberController, updateWorkspaceByIdController } from "../controllers/workspace.controller";
const workspaceRoutes = Router();
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
// thay đổi vai trò của thành viên trong workspace
workspaceRoutes.put("/change/member/role/:id", changeWorkSpaceMemberRoleController);
// update workspace
workspaceRoutes.put("/update/:id", updateWorkspaceByIdController);
// delete workspace
workspaceRoutes.delete("/delete/:id", deleteWorkspaceByIdController);


export default workspaceRoutes;
