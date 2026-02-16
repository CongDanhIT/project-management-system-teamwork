import HTTP_STATUS, { HttpStatusCodeType } from "../config/http.config";
import { ErrorCodeEnum, ErrorCodeEnumType } from "../enums/error-code.enum";

/**
 * 🛠 LỚP LỖI CƠ SỞ (BASE ERROR CLASS)
 * Tất cả các lỗi trong ứng dụng nên kế thừa từ lớp này để đảm bảo có đầy đủ
 * Status Code và Error Code phục vụ cho việc Logging và phản hồi API.
 */
export class AppError extends Error {
    public readonly statusCode: HttpStatusCodeType;
    public readonly errorCode?: ErrorCodeEnumType;

    constructor(message: string, statusCode: HttpStatusCodeType, errorCode?: ErrorCodeEnumType) {
        super(message);
        this.statusCode = statusCode;
        this.errorCode = errorCode;

        // Lưu lại vết lỗi (Stack Trace) để dễ debug bằng Winston
        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * 🌐 LỖI HTTP TỔNG QUÁT (GENERIC HTTP EXCEPTION)
 * Sử dụng khi bạn muốn trả về một mã lỗi HTTP tùy chỉnh mà chưa có class chuyên biệt.
 */
export class HttpException extends AppError {
    constructor(message: string, statusCode: HttpStatusCodeType, errorCode?: ErrorCodeEnumType) {
        super(message, statusCode, errorCode);
    }
}

/**
 * 🌪 LỖI HỆ THỐNG (500)
 */
export class InternalServerException extends AppError {
    constructor(message: string, errorCode?: ErrorCodeEnumType) {
        super(message,
            HTTP_STATUS.INTERNAL_SERVER_ERROR,
            errorCode || ErrorCodeEnum.INTERNAL_SERVER_ERROR);
    }
}

/**
 * 🔍 LỖI KHÔNG TÌM THẤY TÀI NGUYÊN (404)
 */
export class NotFoundException extends AppError {
    constructor(message = "Không tìm thấy tài nguyên", errorCode?: ErrorCodeEnumType) {
        super(message, HTTP_STATUS.NOT_FOUND, errorCode || ErrorCodeEnum.RESOURCE_NOT_FOUND);
    }
}

/**
 * ❌ LỖI YÊU CẦU KHÔNG HỢP LỆ (400)
 */
export class BadRequestException extends AppError {
    constructor(message = "Yêu cầu không hợp lệ", errorCode?: ErrorCodeEnumType) {
        super(message, HTTP_STATUS.BAD_REQUEST, errorCode || ErrorCodeEnum.VALIDATION_ERROR);
    }
}

/**
 * 🔐 LỖI CHƯA XÁC THỰC / KHÔNG CÓ QUYỀN (401)
 */
export class UnauthorizedException extends AppError {
    constructor(message = "Không có quyền truy cập", errorCode?: ErrorCodeEnumType) {
        super(message, HTTP_STATUS.UNAUTHORIZED, errorCode || ErrorCodeEnum.ACCESS_UNAUTHORIZED);
    }
}

export default AppError;
