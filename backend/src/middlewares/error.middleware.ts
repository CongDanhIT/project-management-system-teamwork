import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';
import { env } from '../config/env';
import HTTP_STATUS from '../config/http.config';


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
    // 1. Ghi log lỗi vào hệ thống (Winston sẽ bắt lấy stack trace từ AppError)
    logger.error(`[${req.method}] ${req.url} - ${err.message}`, {
        statusCode: err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR,
        errorCode: err.errorCode,
        body: req.body,
        params: req.params,
        query: req.query,
        stack: err.stack,
    });

    // 2. Xác định mã trạng thái và mã lỗi nghiệp vụ
    // Nếu là lỗi chúng ta định nghĩa (AppError), lấy đúng mã đó. 
    // Nếu là lỗi lạ (ví dụ lỗi code), trả về 500.
    const statusCode = err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
    const message = err.message || "Lỗi máy chủ nội bộ";
    const errorCode = err.errorCode || "INTERNAL_SERVER_ERROR";

    // 3. Trả về thông báo cho người dùng
    res.status(statusCode).json({
        success: false,
        status: statusCode, // Bổ sung mã trạng thái vào body để tiện debug
        message: message,
        errorCode: errorCode, // Mã lỗi để Frontend xử lý
        errors: err.errors || undefined, // Chi tiết lỗi (nếu có, ví dụ từ Zod)
        // Chú ý: Chỉ hiện Stack Trace khi đang ở môi trường Dev để bảo mật
        stack: env.isDev ? err.stack : undefined,
    });
};
