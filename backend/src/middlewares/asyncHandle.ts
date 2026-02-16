import { Request, Response, NextFunction } from 'express';

/**
 * Kiểu hàm handle cho các controller (chấp nhận cả đồng bộ và bất đồng bộ).
 */
type AsyncControllerType = (
    req: Request,
    res: Response,
    next: NextFunction
) => Promise<any> | any;

/**
 * Higher-Order Function (HOF) dùng để bao bọc các Controller async.
 * Giúp tự động bắt lỗi và chuyển tiếp đến Middleware xử lý lỗi tập trung mang tên errorHandler.
 * Điều này giúp loại bỏ việc phải lặp lại cấu trúc try-catch trong mỗi controller.
 * 
 * @param controller - Hàm controller bất đồng bộ cần được bảo vệ
 * @returns {AsyncControllerType} - Middleware đã được bao bọc logic xử lý lỗi
 */
export const asyncHandler = (controller: AsyncControllerType): AsyncControllerType => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            await controller(req, res, next);
        } catch (error) {
            next(error);
        }
    };
}