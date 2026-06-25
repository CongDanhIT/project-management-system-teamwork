# CHƯƠNG 6: TỔNG KẾT VÀ ĐÁNH GIÁ

## 6.1 ĐÁNH GIÁ HIỆU SUẤT, TỐC ĐỘ VÀ ĐỘ CHÍNH XÁC CỦA HỆ THỐNG AI
**Mô tả môi trường và kịch bản thực nghiệm (Experimental Setup):**
Để các chỉ số đánh giá mang tính khách quan và minh bạch, đề tài đã thiết lập một kịch bản kiểm thử (Test Case) cụ thể thay vì chỉ phỏng đoán lý thuyết:
- **Tập dữ liệu (Dataset):** Đề tài đã tổng hợp một tệp dữ liệu gồm hơn 33.600 dòng log hoạt động (định dạng JSON) lưu trữ thực tế tại cơ sở dữ liệu của hệ thống. Tập dữ liệu này được gán nhãn phân mảng thành dữ liệu nhiễu thường ngày (Normal Noise - chiếm ~82%) và dữ liệu biến động cấu trúc (Anomalies - chiếm ~18%).
- **Môi trường (Environment):** Các bài kiểm tra thực nghiệm được chạy độc lập trên môi trường Node.js kết nối với cơ sở dữ liệu MongoDB Atlas, gọi API thông qua Vercel AI SDK đến mô hình ngôn ngữ lớn (Groq Llama-3/OpenAI).
- **Phương pháp đo lường:** Hệ thống tiến hành chạy các kịch bản kiểm thử tự động (Automated Testing) so sánh giữa cách tiếp cận truy vấn LLM nguyên bản (Brute-force) và cách tiếp cận do đề tài đề xuất (Z-Score + Dual-Agent). Mọi kết quả phản hồi từ AI đều được hệ thống ghi nhận thời gian thực thi (để tính Latency) và dùng script kiểm tra cú pháp (để tính tỷ lệ Parsing Success Rate).

Dưới đây là bảng tổng hợp các kết quả số liệu thực tiễn thu thập được sau quá trình chạy thử nghiệm hệ thống:

**Bảng 6.1: So sánh hiệu năng giữa phương pháp LLM truyền thống và Giải pháp đề xuất**

| Cấu hình thử nghiệm | Phương pháp Xử lý | Khung tác tử (Agent Framework) | Input Tokens (Trung bình) | Tỷ lệ sinh JSON đúng (PSR) | Độ trễ (Groq LPU / Trả phí) | Độ trễ (API Dùng chung / Miễn phí) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Cách tiếp cận gốc (Brute-force)** | Không có | Zero-shot (Đơn tác tử) | ~ 33,600 | 68.4% | 8,500 ms | **Thất bại (Timeout/Quá tải Context)** |
| **Giải pháp của Đề tài** | Thuật toán Two-Pass Z-Score | Dual-Agent (Đa tác tử) | **~ 3,100** (Nén 10.8x) | **94.0%** | **3,100 ms** | **~ 65,000 ms (1-2 phút)** |

Dựa trên số liệu từ Bảng 6.1, ta có thể phân tích chi tiết hiệu quả của 2 chức năng lõi như sau:

**1. Đánh giá độ chính xác của báo cáo (Dựa trên chỉ số PSR):**
- Thách thức lớn nhất khi sử dụng AI là hiện tượng "ảo giác" (Hallucination) khiến báo cáo sinh ra bị sai cấu trúc JSON. Bảng 6.1 cho thấy nếu chỉ dùng 1 AI nguyên bản, tỷ lệ làm đúng (PSR) khá thấp, chỉ đạt 68.4%.
- Nhờ áp dụng kiến trúc **Đa tác tử (Dual-Agent Framework)** cho phép Analyzer Agent (viết báo cáo) và Critic Agent (kiểm duyệt) tự soi chiếu và bắt lỗi nhau, tỷ lệ sinh báo cáo hoàn hảo của hệ thống đề tài đã tăng vọt lên mức **94.0%**.

**2. Đánh giá tốc độ xử lý (Dựa trên chỉ số Compression Ratio & Latency):**
- Nhờ ứng dụng thuật toán **Two-Pass Z-Score** để lọc bỏ log rác, lượng dữ liệu mồi cho AI được nén gọn gấp **10.8 lần** so với thông thường.
- Việc rút gọn khối lượng ngữ cảnh giúp giảm tải cho AI. Trên hạ tầng máy chủ chuyên dụng (Groq LPU), độ trễ giảm từ 8.5 giây xuống chỉ còn **3,100 milliseconds** (~3.1 giây).
- **Thực tiễn đáng giá:** Ở môi trường API dùng chung/miễn phí (Together AI, OpenRouter) với băng thông thấp, nếu không dùng thuật toán Z-Score nén dữ liệu (Brute-force), hệ thống sẽ bị treo hoàn toàn (Timeout) do quá tải Token. Nhờ giải pháp của đề tài, hệ thống vẫn có thể sống sót và trả về kết quả thành công trong khoảng 1-2 phút, chứng minh tính bền bỉ (resilience) của hệ thống trước giới hạn phần cứng.

**3. Đánh giá Trợ lý ảo (AI Chatbot) và chức năng Lập kế hoạch tự động (AI Planner):**
- **Về tốc độ trải nghiệm:** Nhờ ứng dụng kỹ thuật truyền dữ liệu luồng (Streaming Response) từ Vercel AI SDK, người dùng có thể thấy kết quả sinh ra theo thời gian thực từng chữ một (tương tự trải nghiệm ChatGPT). Điều này triệt tiêu hoàn toàn cảm giác giật lag hay phải chờ đợi lâu (Zero-wait UI) dù máy chủ LLM thực tế cần vài giây để xử lý toàn bộ đoạn văn bản.
- **Về độ chính xác logic:** Tính năng phân rã dự án (AI Planner) hoạt động ổn định ở mức độ nền tảng. AI có khả năng chia nhỏ một yêu cầu thô (ví dụ: "Làm app thương mại điện tử") thành các Giai đoạn (Phases) và Công việc (Tasks) hợp lý dựa trên tri thức Zero-shot của mô hình. Dù vậy, mức độ chuyên sâu của bản kế hoạch sinh ra phụ thuộc trực tiếp vào năng lực của mô hình LLM nền tảng đang được sử dụng (điều này đã được đề cập tại Mục Hạn chế 6.3).

## 6.2 MỨC ĐỘ HOÀN THÀNH MỤC TIÊU VÀ ƯU ĐIỂM
Trải qua quá trình khảo sát, phân tích, thiết kế và tiến hành lập trình, đề tài đã cơ bản giải quyết trọn vẹn những vấn đề bất cập ban đầu được đặt ra. Hệ thống đã đáp ứng tốt các mục tiêu về việc xây dựng một không gian cộng tác số tập trung, giải phóng con người khỏi các quy trình điều phối thủ công và áp dụng thành công các công nghệ mới vào quy trình quản trị.

Cụ thể, hệ thống bộc lộ những ưu điểm vượt trội về mặt trải nghiệm người dùng lẫn kiến trúc kỹ thuật như sau:

1. **Trải nghiệm người dùng (UX/UI) hiện đại và tối ưu luồng thao tác:**
   - Giao diện được thiết kế theo xu hướng hiện đại, trực quan, hỗ trợ chế độ xem linh hoạt (Dark/Light Mode) với các hiệu ứng chuyển động mượt mà.
   - Tối giản hóa thao tác: Không lạm dụng quá nhiều trang chuyển tiếp hay biểu mẫu (forms) phức tạp. Các thao tác tạo, sửa, xóa được thực hiện nhanh chóng ngay trên các bảng điều khiển trượt (Slide-over panel) và hộp thoại (Modal), giúp người dùng dễ dàng làm quen.
   - Hỗ trợ quản lý tác vụ linh hoạt qua nhiều góc nhìn (Kanban Board, List) kết hợp cơ chế kéo thả (Drag & Drop) trực quan, giúp giảm thiểu tối đa thời gian điều phối.

2. **Ứng dụng Trí tuệ Nhân tạo (AI) tạo ra sự đột phá:**
   - Khác với các hệ thống quản lý truyền thống, sản phẩm tích hợp sâu Trợ lý ảo AI vào cốt lõi điều phối dự án.
   - **Trợ lý ảo giao tiếp (AI Chatbot):** Tích hợp giao diện Chatbot thông minh ứng dụng kỹ thuật truyền luồng (Streaming Response), cho phép người dùng tương tác, hỏi đáp và truy xuất thông tin dự án theo thời gian thực với trải nghiệm mượt mà không độ trễ (Zero-wait UI).
   - **Lập kế hoạch tự động (AI Planner):** Khả năng tự động phân rã một yêu cầu dự án phức tạp thành các giai đoạn (Phases) và đầu việc (Tasks) chi tiết chỉ bằng ngôn ngữ tự nhiên.
   - **Phân tích chuyên sâu (Kiến trúc Đa tác tử):** Hệ thống kết hợp 2 Agent tự soi chiếu chéo, giúp loại bỏ hiện tượng "ảo giác" (đạt chuẩn JSON 94.0%). AI có khả năng tự động chẩn đoán điểm nghẽn dự án, đánh giá tải trọng nhân sự và đề xuất giải pháp chiến thuật mang tính thực tiễn cao thay cho nhà quản lý.
   - **Tối ưu hóa dữ liệu:** Ứng dụng thuật toán nén dữ liệu Z-Score, giúp loại bỏ nhiễu và nén dữ liệu ngữ cảnh gấp 10 lần, tăng tốc độ phản hồi và tiết kiệm tối đa tài nguyên xử lý.

3. **Khả năng giám sát và thống kê đa chiều (Advanced Analytics):**
   - Hệ thống cung cấp bảng điều khiển (Dashboard) mạnh mẽ, thống kê dữ liệu trực quan bằng các dạng biểu đồ phức tạp để tính toán nhịp độ và vận tốc hoàn thành dự án.
   - Tính năng "Trung tâm điều phối chiến lược" giúp gom nhóm và cảnh báo tức thời các tác vụ quá hạn.
   - Hỗ trợ kết xuất dữ liệu và báo cáo linh hoạt ra nhiều định dạng chuyên nghiệp (Excel, PDF, Word).
   - Báo cáo phân tích chuyên sâu của AI được tự động định dạng bằng Markdown sắc nét, hiển thị trực quan các điểm nghẽn và đề xuất chiến thuật phân bổ trên cùng một giao diện.

4. **Khả năng tự động hóa và Mở rộng hệ sinh thái:**
   - **Tích hợp nền tảng Slack:** Cho phép xuất bản các báo cáo tổng hợp hằng ngày (Daily Digest), đồng thời biến Slack thành một bàn làm việc thu nhỏ để cập nhật trạng thái từ xa.
   - **Tiến trình chạy nền (Cron Jobs):** Cơ chế tự động dọn dẹp dữ liệu rác, tối ưu dung lượng đám mây (Cloudinary) và tự động gửi thông báo nhắc việc không cần sự can thiệp của con người.

5. **Nền tảng kỹ thuật và Bảo mật vững chắc:**
   - Ứng dụng WebSockets đồng bộ trạng thái dữ liệu theo thời gian thực (Real-time), đảm bảo tính nhất quán giữa các thành viên.
   - Xây dựng RESTful API chuẩn mực, hiển thị dữ liệu phân trang kết hợp cơ chế tìm kiếm linh hoạt để tối ưu tốc độ tải.
   - Đảm bảo an toàn thông tin mức cao nhờ cơ chế xác thực, mã hóa mật khẩu nhiều lớp và thuật toán phân quyền truy cập chặt chẽ trên từng End-point API.

## 6.3 MẶT HẠN CHẾ VÀ KHUYẾT ĐIỂM CỦA HỆ THỐNG
1. **Rào cản về năng lực xử lý và độ trễ của mô hình AI miễn phí:** Do hệ thống hiện đang phụ thuộc vào giao diện API của các nhà cung cấp LLM ở gói miễn phí (OpenRouter) hoặc gói dùng chung (Together AI On-Demand), tốc độ xử lý Token/giây bị hạn chế khá nhiều do phải xếp hàng. Thực tế ghi nhận thời gian chờ để hệ thống sinh ra bản báo cáo phân tích chuyên sâu (kiến trúc Multi-Agent) thường kéo dài hơn 1 phút.
2. **Giới hạn về chiều sâu của nội dung phân tích:** Để khắc phục tình trạng độ trễ kéo dài và tránh lỗi hệ thống, đề tài buộc phải thiết lập giới hạn số lượng từ đầu ra ở mức 1200 Tokens (`maxTokens: 1200`). Sự đánh đổi này giúp đảm bảo thời gian chờ ở mức chấp nhận được, nhưng bù lại, chất lượng nội dung phân tích đôi khi chỉ mang tính chất tương đối, khái quát và chưa thể hiện được sự đầy đủ, cặn kẽ đối với các dự án có quy mô dữ liệu lớn.
3. **Giới hạn về thuật toán phân tích dự báo:** Biểu đồ thống kê tại Dashboard tuy trực quan nhưng hệ thống hiện chưa tích hợp các thuật toán học máy phân tích dự báo (Predictive Machine Learning) hoặc Data Mining phức tạp để đối chiếu chéo nhiều biến số dài hạn.
4. **Bố cục báo cáo (Document Exporting) còn đơn điệu:** Tính năng kết xuất tài liệu Word, PDF hiện mới giải quyết bài toán trích xuất dữ liệu thuần túy. Hệ thống template chưa cho phép tùy biến linh hoạt Layout theo chuẩn quy trình khắt khe (ISO) của từng doanh nghiệp thực tế.

## 6.4 HƯỚNG PHÁT TRIỂN CỦA ĐỀ TÀI	
1. **Phát triển Động cơ tự động hóa luồng công việc (Visual Automation Builder):**
   - Đây là mục tiêu nâng cấp chiến lược mang tính sống còn của hệ thống. Thay vì đóng gói các quy trình nghiệp vụ một cách cứng nhắc (hard-code) tại máy chủ, hệ thống sẽ chuyển đổi thành một nền tảng tùy biến toàn diện.
   - Không chỉ dừng lại ở việc cho phép người dùng tự định nghĩa các trạng thái công việc (Custom Statuses), hệ thống hướng tới việc tích hợp một giao diện lập trình trực quan (Visual Builder) áp dụng kiến trúc Node-Edge tương tự như các nền tảng n8n hay Zapier.
   - Người dùng có thể tự thiết kế các chuỗi hành động bằng cách kéo thả các khối điều kiện/tác vụ (Nodes) và nối chúng lại với nhau (Edges) để tạo ra các kịch bản Automation linh hoạt theo ngữ cảnh dự án. Ví dụ: `[Node: Trigger khi Task Xong] -> [Edge: Kiểm tra Ưu tiên CAO] -> [Node Action: Tự động gửi thông báo khẩn qua Slack]`.

2. **Hệ thống Cảnh báo tải trọng và Phân bổ tài nguyên (Capacity Planning):**
   - Xây dựng giao diện "Lưới bảo vệ an toàn" trên Kanban Board với các thanh màu (Xanh/Vàng/Đỏ) hiển thị trực quan tổng khối lượng công việc của từng nhân sự.
   - Khi Quản lý dự án phân công tác vụ dẫn đến việc một nhân sự bị quá tải (Burnout), hệ thống sẽ ngay lập tức bật Popup cảnh báo, đồng thời AI sẽ can thiệp để đề xuất chuyển giao (Transfer) tác vụ đó sang nhân sự khác đang có mức tải trọng thấp hơn.

3. **Nâng cấp Hệ sinh thái Trí tuệ nhân tạo (AI):**
   - Khắc phục giới hạn của các API miễn phí bằng việc đầu tư tích hợp các Mô hình ngôn ngữ thương mại cao cấp (như GPT-4o, Claude 3.5 Sonnet) để tăng cường năng lực tư duy logic và mở rộng giới hạn xử lý ngữ cảnh (Context Window).
   - Nghiên cứu phương án triển khai các mô hình AI mã nguồn mở chạy trực tiếp trên máy chủ nội bộ (Local/On-premise LLM) nhằm đảm bảo bảo mật tuyệt đối cho các dữ liệu dự án nhạy cảm của doanh nghiệp.

4. **Mở rộng hệ sinh thái đa nền tảng:**
   - Nghiên cứu và phát triển phiên bản ứng dụng di động (Mobile App trên nền tảng React Native/Flutter) để tối ưu hóa khả năng tương tác, theo dõi tiến độ và nhận cảnh báo (Push Notifications) cho các nhân sự thường xuyên phải di chuyển và làm việc từ xa.
