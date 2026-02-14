/**
 * Lấy giá trị biến môi trường và kiểm tra tính hợp lệ.
 * * @description Hàm này kết nối với process.env để lấy cấu hình hệ thống. 
 * Nếu thiếu biến quan trọng, nó sẽ ném lỗi để bảo vệ ứng dụng.
 * * @param key - Tên của biến môi trường cần lấy (ví dụ: 'PORT', 'MONGO_URI').
 * @param defaultValue - (Tùy chọn) Giá trị dự phòng nếu không tìm thấy biến.
 * * @returns Trả về giá trị của biến dưới dạng chuỗi (string).
 * * @throws {Error} Ném ra lỗi nếu biến không tồn tại trong .env và không có giá trị mặc định.
 * * @link {src/config/index.ts } 
 * * @example
 * const port = getEnv("PORT", "3000");
 * 
 * // src/config/index.ts
export const config = {
  port: getEnv("PORT", "5000"),
  mongoUri: getEnv("MONGO_URI"),
  jwtSecret: getEnv("SESSION_SECRET"),
  google: {
    clientId: getEnv("GOOGLE_CLIENT_ID"),
    clientSecret: getEnv("GOOGLE_CLIENT_SECRET"),
  },
  frontendUrl: getEnv("FRONTEND_ORIGIN")
};

 */
export const getEnv = (key: string, defaultValue?: string): string => {
    const value = process.env[key];

    // 1. Kiểm tra nếu biến tồn tại và không phải chuỗi rỗng trong .env
    if (value !== undefined && value.trim() !== "") {
        return value;
    }

    // 2. Nếu không có giá trị, kiểm tra xem có cung cấp defaultValue hay không
    // (Kiểm tra !== undefined để chấp nhận cả defaultValue là chuỗi rỗng "")
    if (defaultValue !== undefined) {
        return defaultValue;
    }

    // 3. Trường hợp xấu nhất: Không có giá trị thực và không có mặc định -> Báo lỗi
    throw new Error(`CRITICAL: Environment variable [${key}] is missing or empty.`);
};