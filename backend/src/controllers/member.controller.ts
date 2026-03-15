import { asyncHandler } from "../middlewares/asyncHandle";
import { z } from "zod";
import { joinWorkspaceService } from "../services/member.service";
import HTTP_STATUS from "../config/http.config";

export const joinWorkspaceController = asyncHandler(async (req, res) => {
    const inviteCode = z.string().parse(req.params.inviteCode);
    const userId = req.user?._id;
    const { workspaceId, role } = await joinWorkspaceService(inviteCode, userId);
    return res.status(HTTP_STATUS.OK).json({
        status: "success",
        message: "Join workspace successfully",
        workspaceId,
        role
    });
})