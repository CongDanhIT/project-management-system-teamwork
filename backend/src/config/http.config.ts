/**
 * 🌐 BẢNG MÃ TRẠNG THÁI HTTP (HTTP STATUS CODES)
 * Tập hợp các mã trạng thái HTTP chuẩn để sử dụng thống nhất trong toàn bộ ứng dụng.
 * Giúp code dễ đọc hơn bằng cách thay thế các con số ma thuật (magic numbers).
 */
const HTTP_STATUS = {
    // --- Success (Thành công - 2xx) ---
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,

    // --- Client Errors (Lỗi phía Client - 4xx) ---
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    TOO_MANY_REQUESTS: 429,

    // --- Server Errors (Lỗi phía Server - 5xx) ---
    INTERNAL_SERVER_ERROR: 500,
    NOT_IMPLEMENTED: 501,
    BAD_GATEWAY: 502,
    SERVICE_UNAVAILABLE: 503,
    GATEWAY_TIMEOUT: 504,
} as const;

export default HTTP_STATUS;

/**
 * Kiểu dữ liệu dựa trên các giá trị số của bảng mã HTTP_STATUS.
 */
export type HttpStatusCodeType = typeof HTTP_STATUS[keyof typeof HTTP_STATUS];