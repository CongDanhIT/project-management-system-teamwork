// 1. Giả lập đầy đủ và đúng định dạng các biến môi trường
process.env.PORT = "9000";
process.env.NODE_ENV = "development";
process.env.BASE_URL = "/api/v1";
process.env.MONGO_URI = "mongodb://localhost:27017/my-db";
process.env.SESSION_SECRET = "secret-phai-dai-hon-10-ky-tu-nhe";
process.env.GOOGLE_CLIENT_ID = "google-id-123";
process.env.GOOGLE_CLIENT_SECRET = "google-secret-123";
process.env.GOOGLE_CALLBACK_URL = "http://localhost:8000/auth/google/callback";
process.env.FRONTEND_ORIGIN = "http://localhost:5173";
process.env.FRONTEND_GOOGLE_CALLBACK_URL = "http://localhost:5173/login?success=true";

console.log("--- BẮT ĐẦU TEST ZOD THÀNH CÔNG (test-zod-env2) ---");

try {
    const { env } = require('../../config/env');

    console.log("✅ Validation THÀNH CÔNG!");
    console.log("------------------------------------------");

    // 1. Minh họa Transformation (ép kiểu)
    console.log("🛠️  ỨNG DỤNG 1: ÉP KIỂU TỰ ĐỘNG (Coercion)");
    console.log(`- env.PORT: ${env.PORT} (Kiểu thật: ${typeof env.PORT})`);
    if (typeof env.PORT === "number") {
        console.log(`   => Bạn có thể tính toán luôn: PORT + 1 = ${env.PORT + 1}`);
    }

    // 2. Minh họa Derived Properties (thuộc tính tính toán thêm)
    console.log("\n�️  ỨNG DỤNG 2: CÁC BIẾN TIỆN ÍCH (Helpers)");
    console.log(`- Đang ở môi trường DEV? ${env.isDev}`);
    console.log(`- Đang ở môi trường PROD? ${env.isProd}`);

    if (env.isDev) {
        console.log("   => Gợi ý: Bật chế độ Logging chi tiết cho developer.");
    }

    // 3. Minh họa Destructuring (bóc tách dữ liệu sạch)
    console.log("\n🛠️  ỨNG DỤNG 3: BÓC TÁCH DỮ LIỆU GỌN GÀNG");
    const { MONGO_URI, SESSION_SECRET } = env;
    console.log(`- Kết nối Database tới: ${MONGO_URI}`);
    console.log(`- Secret key đã sẵn sàng, độ dài: ${SESSION_SECRET.length}`);

    // 4. Minh họa Immutability (Sạch sẽ, không thừa thãi)
    console.log("\n🛠️  ỨNG DỤNG 4: CHỈ LẤY NHỮNG GÌ CẦN");
    console.log(`- Số lượng biến trong env: ${Object.keys(env).length}`);
    console.log("- Các biến linh tinh khác trong process.env đã bị loại bỏ khỏi object env này.");

} catch (error) {
    console.error("❌ Test thất bại ngoài ý muốn:", error);
}


console.log("------------------------------------------");
console.log("--- KẾT THÚC TEST THÀNH CÔNG ---");
