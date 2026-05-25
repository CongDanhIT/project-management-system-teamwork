import { Request, Response, NextFunction } from "express";
import { asyncHandler } from "./asyncHandle";
import { UnauthorizedException } from "../utils/appError";

import logger from "../utils/logger";

export const isAuthenticated = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const isPassportAuth = typeof req.isAuthenticated === 'function' && req.isAuthenticated();
    
    // Hỗ trợ bypass auth cho việc chạy các script test thủ công ở môi trường development
    const isBypass = process.env.NODE_ENV === "development" && req.headers["x-bypass-auth"] === "true";
    
    // Debug Auth cho AI và các route khác
    logger.info(`[Auth-Check] User: ${!!req.user}, Passport: ${isPassportAuth}, Bypass: ${isBypass}, URL: ${req.originalUrl}`);

    if (!req.user && !isPassportAuth && !isBypass) {
        logger.warn("Xác thực thất bại", { 
            hasUser: !!req.user, 
            hasAuthFunc: typeof req.isAuthenticated === 'function',
            hasSession: !!req.session,
            cookies: req.headers.cookie 
        });
        throw new UnauthorizedException("AUTH_USER_NOT_AUTHENTICATED");
    }
    next();
});
