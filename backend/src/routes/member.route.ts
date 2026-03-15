import { Router } from "express";
import { joinWorkspaceController } from "../controllers/member.controller";
const memberRoutes = Router();
// gia nhập workspace bằng code
memberRoutes.post("/workspace/:inviteCode/join", joinWorkspaceController);

export default memberRoutes;