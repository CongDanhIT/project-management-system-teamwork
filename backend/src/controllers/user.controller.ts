import HTTP_STATUS from "../config/http.config";
import { asyncHandler } from "../middlewares/asyncHandle";
import { NotFoundException } from "../utils/appError";
import { getCurrentUserService } from "../services/user.service";

export const getCurrentUser = asyncHandler(async (req, res, next) => {
    const userId = req.user?._id;



    const { user } = await getCurrentUserService(userId);

    return res.status(HTTP_STATUS.OK).json({
        success: true,
        message: "Lấy dữ liệu người dùng mới nhất thành công",
        user
    });
});