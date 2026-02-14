// Giả lập môi trường trước khi import env
//process.env.PORT = "abc"; // Cố tình sai kiểu số (nhưng schema đang để string nên vẫn qua, hãy sửa schema thành number để test kỹ hơn nếu muốn)
//process.env.NODE_ENV = "staging"; // Sai enum (chỉ cho phép dev/prod/test)
//process.env.MONGO_URI = ""; // Chuỗi rỗng -> Vi phạm min(1)

console.log("--- BẮT ĐẦU TEST ZOD (env.ts) ---");
console.log("👉 Đang import config/env.ts...");

try {
    // Việc import này sẽ kích hoạt validation ngay lập tức
    const { env } = require('../../config/env');
    console.log("✅ Cấu hình hợp lệ:", env);
} catch (error) {
    console.log("ℹ️  (Lưu ý: Nếu bạn thấy log lỗi chi tiết phía trên, đó là do Zod đã bắt được lỗi và in ra console.error)");
}

console.log("--- KẾT THÚC TEST ZOD ---\n");
