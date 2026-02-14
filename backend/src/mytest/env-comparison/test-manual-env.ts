import dotenv from 'dotenv';
dotenv.config();

import { getEnv } from '../../utils/get-env';

console.log("--- BẮT ĐẦU TEST THỦ CÔNG (get-env) ---");

try {
    // 1. Lấy biến tồn tại (giả lập)
    process.env.PORT = "3000";
    const port = getEnv("PORT");
    console.log(`✅ Lấy PORT thành công: ${port} (Kiểu: ${typeof port})`);

    // 2. Lấy biến có giá trị mặc định
    const db = getEnv("MONGO_URI", "mongodb://localhost:27017");
    console.log(`✅ Lấy MONGO_URI mặc định: ${db}`);

    // 3. Vấn đề: Không kiểm tra định dạng (Validation)
    process.env.AGE = "hai mươi"; // Sai kiểu số
    const age = getEnv("AGE");
    console.log(`⚠️  Cảnh báo: AGE là '${age}' nhưng logic code cần số. getEnv không phát hiện được.`);

    // 4. Lấy biến không tồn tại -> Sẽ lỗi
    console.log("👉 Đang thử lấy biến SECRET_KEY (không tồn tại)...");
    const secret = getEnv("SECRET_KEY");
    console.log(secret); // Dòng này sẽ không chạy tới

} catch (error: any) {
    console.error("❌ BẮT ĐƯỢC LỖI:", error.message);
}

console.log("--- KẾT THÚC TEST THỦ CÔNG ---\n");
