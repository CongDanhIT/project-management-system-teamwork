import axios from "axios";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(__dirname, "../../.env") });

const testWebhook = async () => {
    try {
        console.log("🧪 Đang kiểm thử Webhook Email Inbound...");
        
        // Giả sử token của user buicongdanhcm2004@gmail.com (vừa migration)
        // Trong thực tế, bạn cần lấy token từ DB hoặc xem log migration ở bước trước
        // Tôi sẽ lấy token của user đầu tiên trong DB để test cho chắc
        
        const API_URL = "http://localhost:8000/api/webhooks/email";
        
        const payload = {
            to: "task+61138de3220f8293@teamflow.com", 
            from: "partner@external.com",
            subject: "Yêu cầu báo giá dự án mới",
            text: "Chào TeamFlow, vui lòng gửi báo giá cho gói dịch vụ Premium. Trân trọng!",
            html: "<p>Chào TeamFlow, vui lòng gửi báo giá cho gói dịch vụ <b>Premium</b>. Trân trọng!</p>"
        };

        const response = await axios.post(API_URL, payload);
        
        console.log("✅ Kết quả Webhook:", response.data);
        console.log("🚀 Vui lòng kiểm tra mục Inbox trên giao diện để thấy Task mới!");
        
    } catch (error: any) {
        console.error("❌ Lỗi khi gọi Webhook:", error.response?.data || error.message);
    }
};

testWebhook();
