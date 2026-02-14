import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';
import { env } from '../config/env';

/**
 * 🌪 CÁI PHỄU XỬ LÝ LỖI TẬP TRUNG
 * Middleware này phải đặt ở CUỐI CÙNG của file index.ts (sau tất cả các route)
 */
export const errorHandler = (
    err: any,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    // 1. Ghi log "Tỉ mỉ" vào hệ thống
    logger.error(`[${req.method}] ${req.url} - ${err.message}`, {
        stack: err.stack,
        body: req.body,
        params: req.params,
        query: req.query,
    });

    // 2. Xác định mã lỗi (mặc định là 500 nếu không có)
    const statusCode = err.statusCode || 500;

    // 3. Trả về thông báo cho người dùng
    res.status(statusCode).json({
        success: false,
        message: err.message || "Lỗi máy chủ nội bộ",
        // Chú ý: Chỉ hiện Stack Trace khi đang ở môi trường Dev để bảo mật
        stack: env.isDev ? err.stack : undefined,
    });
};
