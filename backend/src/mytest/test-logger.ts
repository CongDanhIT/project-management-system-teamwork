// Giả lập môi trường trước khi import logger (vì logger import env.ts)
process.env.PORT = "8000";
process.env.NODE_ENV = "development";
process.env.MONGO_URI = "mongodb://localhost:27017";
process.env.SESSION_SECRET = "secret-dai-hon-10-ky-tu";
process.env.GOOGLE_CLIENT_ID = "id";
process.env.GOOGLE_CLIENT_SECRET = "secret";
process.env.GOOGLE_CALLBACK_URL = "http://localhost:8000/callback";
process.env.FRONTEND_ORIGIN = "http://localhost:3000";
process.env.FRONTEND_GOOGLE_CALLBACK_URL = "http://localhost:3000/callback";

import logger from '../utils/logger';

console.log("--- BẮT ĐẦU TEST LOGGING (test-logger) ---");
console.log("👉 Lưu ý: Kiểm tra cả màn hình này và thư mục 'logs/' vừa được sinh ra.\n");

// 1. Log thông tin bình thường
logger.info("Server đã khởi động thành công", { port: 8000, version: "1.0.0" });

// 2. Log cảnh báo
logger.warn("Phát hiện truy cập bất thường từ IP lạ", { ip: "192.168.1.50" });

// 3. Log lỗi (Error) - Cái này sẽ được lưu vào logs/error.log
try {
    throw new Error("Lỗi kết nối cơ sở dữ liệu!");
} catch (error) {
    logger.error("Đã xảy ra lỗi thực thi", error);
}

// 4. Log debug - Chỉ hiện nếu env.isDev = true
logger.debug("Dữ liệu trung gian của biến X là: 12345");

console.log("\n--- TEST LOGGING HOÀN TẤT ---");
console.log("👉 Hãy xem file logs/combined.log và logs/error.log để thấy kết quả.");
