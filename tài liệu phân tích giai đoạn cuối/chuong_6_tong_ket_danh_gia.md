# CHƯƠNG 6: TỔNG KẾT VÀ ĐÁNH GIÁ

## 6.1 ĐÁNH GIÁ HIỆU SUẤT, TỐC ĐỘ VÀ ĐỘ CHÍNH XÁC CỦA HỆ THỐNG AI
**Mô tả môi trường và kịch bản thực nghiệm (Experimental Setup):**
Để các chỉ số đánh giá mang tính khách quan và minh bạch, đề tài đã thiết lập một kịch bản kiểm thử (Test Case) cụ thể thay vì chỉ phỏng đoán lý thuyết:
- **Tập dữ liệu (Dataset):** Đề tài đã tổng hợp một tệp dữ liệu gồm hơn 33.600 dòng log hoạt động (định dạng JSON) lưu trữ thực tế tại cơ sở dữ liệu của hệ thống. Tập dữ liệu này được gán nhãn phân mảng thành dữ liệu nhiễu thường ngày (Normal Noise - chiếm ~82%) và dữ liệu biến động cấu trúc (Anomalies - chiếm ~18%).
- **Môi trường (Environment):** Các bài kiểm tra thực nghiệm được chạy độc lập trên môi trường Node.js kết nối với cơ sở dữ liệu MongoDB Atlas, gọi API thông qua Vercel AI SDK đến mô hình ngôn ngữ lớn (Groq Llama-3/OpenAI).
- **Phương pháp đo lường:** Hệ thống tiến hành chạy các kịch bản kiểm thử tự động (Automated Testing) so sánh giữa cách tiếp cận truy vấn LLM nguyên bản (Brute-force) và cách tiếp cận do đề tài đề xuất (Z-Score + Dual-Agent). Mọi kết quả phản hồi từ AI đều được hệ thống ghi nhận thời gian thực thi (để tính Latency) và dùng script kiểm tra cú pháp (để tính tỷ lệ Parsing Success Rate).

Dưới đây là bảng tổng hợp các kết quả số liệu thực tiễn thu thập được sau quá trình chạy thử nghiệm hệ thống:

**Bảng 6.1: So sánh hiệu năng giữa phương pháp LLM truyền thống và Giải pháp đề xuất**

| Cấu hình thử nghiệm | Phương pháp Tiền xử lý | Cơ chế AI (LLM) | Tỷ lệ nén dữ liệu (CR) | Tỷ lệ báo cáo đúng (PSR) | Độ trễ trung bình |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Cách tiếp cận gốc (Brute-force)** | Không có | AI đơn lẻ (Zero-shot) | 1.0x | 68.4% | 4,200 ms |
| **Giải pháp của Đề tài** | Thuật toán Two-Pass Z-Score | Kiến trúc Đa tác tử (Dual-Agent) | **10.8x** | **94.0%** | **3,100 ms** |

Dựa trên số liệu từ Bảng 6.1, ta có thể phân tích chi tiết hiệu quả của 2 chức năng lõi như sau:

**1. Đánh giá độ chính xác của báo cáo (Dựa trên chỉ số PSR):**
- Thách thức lớn nhất khi sử dụng AI là hiện tượng "ảo giác" (Hallucination) khiến báo cáo sinh ra bị sai cấu trúc JSON. Bảng 6.1 cho thấy nếu chỉ dùng 1 AI nguyên bản, tỷ lệ làm đúng (PSR) khá thấp, chỉ đạt 68.4%.
- Nhờ áp dụng kiến trúc **Đa tác tử (Dual-Agent Framework)** cho phép Analyzer Agent (viết báo cáo) và Critic Agent (kiểm duyệt) tự soi chiếu và bắt lỗi nhau, tỷ lệ sinh báo cáo hoàn hảo của hệ thống đề tài đã tăng vọt lên mức **94.0%**.

**2. Đánh giá tốc độ xử lý (Dựa trên chỉ số Compression Ratio & Latency):**
- Nhờ ứng dụng thuật toán **Two-Pass Z-Score** để lọc bỏ log rác, lượng dữ liệu mồi cho AI được nén gọn gấp **10.8 lần** so với thông thường.
- Việc rút gọn khối lượng ngữ cảnh giúp giảm tải cho AI, kéo giảm độ trễ xử lý (Latency) từ 4.2 giây xuống chỉ còn **3,100 milliseconds** (~3.1 giây), đảm bảo hệ thống phản hồi cực nhanh trong môi trường thời gian thực.

**3. Đánh giá Trợ lý ảo (AI Chatbot) và chức năng Lập kế hoạch tự động (AI Planner):**
- **Về tốc độ trải nghiệm:** Nhờ ứng dụng kỹ thuật truyền dữ liệu luồng (Streaming Response) từ Vercel AI SDK, người dùng có thể thấy kết quả sinh ra theo thời gian thực từng chữ một (tương tự trải nghiệm ChatGPT). Điều này triệt tiêu hoàn toàn cảm giác giật lag hay phải chờ đợi lâu (Zero-wait UI) dù máy chủ LLM thực tế cần vài giây để xử lý toàn bộ đoạn văn bản.
- **Về độ chính xác logic:** Tính năng phân rã dự án (AI Planner) hoạt động ổn định ở mức độ nền tảng. AI có khả năng chia nhỏ một yêu cầu thô (ví dụ: "Làm app thương mại điện tử") thành các Giai đoạn (Phases) và Công việc (Tasks) hợp lý dựa trên tri thức Zero-shot của mô hình. Dù vậy, mức độ chuyên sâu của bản kế hoạch sinh ra phụ thuộc trực tiếp vào năng lực của mô hình LLM nền tảng đang được sử dụng (điều này đã được đề cập tại Mục Hạn chế 6.3).

## 6.2 MỨC ĐỘ HOÀN THÀNH MỤC TIÊU VÀ ƯU ĐIỂM
Trải qua quá trình khảo sát, phân tích, thiết kế và tiến hành lập trình, đề tài đã cơ bản giải quyết trọn vẹn những vấn đề bất cập ban đầu được đặt ra. Hệ thống bộc lộ những ưu điểm về trải nghiệm người dùng và kiến trúc như sau:

1. **Trải nghiệm người dùng (UX/UI) hiện đại:** Giao diện trực quan, linh hoạt (Dark/Light Mode). Tối giản hóa biểu mẫu (forms) bằng Slide-over panel và Modal. Quản lý tác vụ linh hoạt qua Kanban Board, kết hợp kéo thả (Drag & Drop) giúp giảm thiểu thời gian điều phối.
2. **Khả năng tự động hóa và Mở rộng hệ sinh thái:** Tích hợp nền tảng Slack để xuất bản báo cáo (Daily Digest) và cập nhật trạng thái từ xa. Tiến trình chạy nền (Cron Jobs) hỗ trợ tự dọn dẹp rác đám mây (Cloudinary) và gửi thông báo nhắc việc không cần sự can thiệp của con người.
3. **Nền tảng kỹ thuật và Bảo mật vững chắc:** Ứng dụng WebSockets đồng bộ dữ liệu theo thời gian thực (Real-time). Xây dựng RESTful API chuẩn mực kết hợp phân trang và cơ chế xác thực, phân quyền bảo mật nhiều lớp chặt chẽ.

## 6.3 MẶT HẠN CHẾ VÀ KHUYẾT ĐIỂM CỦA HỆ THỐNG
1. **Rào cản về năng lực xử lý tự nhiên của mô hình AI miễn phí:** Hệ thống hiện đang phụ thuộc vào giao diện API của các mô hình LLM ở cấu hình tiêu chuẩn. Điều này dẫn đến giới hạn khắt khe về giới hạn ngữ cảnh (Context Window). Khả năng suy luận của AI ở các bài toán đặc thù ngành nghề quá sâu đôi khi vẫn chưa đạt độ sắc bén kỳ vọng.
2. **Chiều sâu phân tích dữ liệu:** Biểu đồ thống kê tuy trực quan nhưng chưa tích hợp các thuật toán học máy phân tích dự báo (Predictive Machine Learning) hoặc Data Mining phức tạp để đối chiếu chéo nhiều biến số dài hạn.
3. **Bố cục báo cáo (Document Exporting) còn đơn điệu:** Tính năng kết xuất tài liệu Word, PDF hiện mới giải quyết bài toán trích xuất dữ liệu. Hệ thống template chưa cho phép tùy biến linh hoạt Layout theo chuẩn quy trình khắt khe (ISO) của từng doanh nghiệp thực tế.

## 6.4 HƯỚNG PHÁT TRIỂN CỦA ĐỀ TÀI	
1. **Tích hợp tính năng đối sánh AI (AI Benchmarking) và Tinh chỉnh mô hình (Fine-Tuning):** Đưa thêm các mô hình thương mại lớn (GPT-4o, Claude 3.5) chạy song song (A/B Testing) để tự động chọn ra AI cho kết quả tốt nhất. Thu thập dữ liệu sử dụng thực tế để tiến hành Fine-Tuning nhằm tạo ra một mô hình LLM chuyên biệt chỉ dành riêng cho nghiệp vụ quản lý dự án.
2. **Phát triển Động cơ tự động hóa luồng công việc (Visual Automation Builder):** Chuyển đổi từ luồng nghiệp vụ "hard-code" sang kiến trúc Node-Edge. Xây dựng giao diện kéo-thả (tương tự Zapier/n8n) cho phép người dùng tự thiết kế các chuỗi hành động, kích hoạt tự động hóa linh hoạt dựa trên ngữ cảnh dự án (Trigger-Action).
3. **Nâng cấp Hệ sinh thái và thiết kế Báo cáo:** Mở rộng phiên bản Mobile App (React Native) phục vụ làm việc từ xa. Xây dựng một Engine sinh báo cáo (Report Generator) mạnh mẽ, cho phép người dùng tải lên template mẫu chuẩn của doanh nghiệp và AI sẽ tự động điền dữ liệu đúng theo bố cục đó thay vì dùng form mặc định.
