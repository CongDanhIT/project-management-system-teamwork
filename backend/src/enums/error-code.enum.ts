/**
 * 🏷️ BẢNG MÃ LỖI NGHIỆP VỤ (BUSINESS ERROR CODES)
 * Sử dụng để định danh chính xác lỗi xảy ra giúp Frontend xử lý logic hoặc đa ngôn ngữ.
 */
export const ErrorCodeEnum = {
    // --- Authentication Errors (Lỗi xác thực) ---
    AUTH_EMAIL_ALREADY_EXISTS: "AUTH_EMAIL_ALREADY_EXISTS",
    AUTH_INVALID_TOKEN: "AUTH_INVALID_TOKEN",
    AUTH_USER_NOT_FOUND: "AUTH_USER_NOT_FOUND",
    AUTH_NOT_FOUND: "AUTH_NOT_FOUND",
    AUTH_TOO_MANY_ATTEMPTS: "AUTH_TOO_MANY_ATTEMPTS",
    AUTH_UNAUTHORIZED_ACCESS: "AUTH_UNAUTHORIZED_ACCESS",
    AUTH_TOKEN_NOT_FOUND: "AUTH_TOKEN_NOT_FOUND",

    // --- Access Control Errors (Lỗi quyền truy cập) ---
    ACCESS_UNAUTHORIZED: "ACCESS_UNAUTHORIZED",

    // --- Validation and Resource Errors (Lỗi dữ liệu & tài nguyên) ---
    VALIDATION_ERROR: "VALIDATION_ERROR",
    RESOURCE_NOT_FOUND: "RESOURCE_NOT_FOUND",

    // --- System Errors (Lỗi hệ thống) ---
    INTERNAL_SERVER_ERROR: "INTERNAL_SERVER_ERROR",
} as const;

/**
 * Kiểu dữ liệu dựa trên các khóa của ErrorCodeEnum.
 */
export type ErrorCodeEnumType = keyof typeof ErrorCodeEnum;