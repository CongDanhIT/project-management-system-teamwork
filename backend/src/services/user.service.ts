import UserModel from "../models/user.model";
import { NotFoundException } from "../utils/appError";

export const getCurrentUserService = async (userId: string) => {
    const user = await UserModel.findById(userId)
        .populate("currentWorkspace")
        .select("-password");

    if (!user) {
        throw new NotFoundException("AUTH_USER_NOT_FOUND");
    }

    return {
        user
    };
};