import { Request, Response, NextFunction } from "express";
import { asyncHandler } from "./asyncHandle";
import { UnauthorizedException } from "../utils/appError";

export const isAuthenticated = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !req.isAuthenticated()) {
        throw new UnauthorizedException("AUTH_USER_NOT_AUTHENTICATED");
    }
    next();
});
