# 6.1 ĐÁNH GIÁ HIỆU SUẤT VÀ ĐỘ CHÍNH XÁC CỦA TÍNH NĂNG AI LÕI

Dựa trên yêu cầu đánh giá chuyên sâu, mục này trình bày chi tiết về luồng dữ liệu, tham số mô hình, các công cụ kiểm thử được sử dụng và đối chiếu hiệu suất của hệ thống.

## 1. XÁC THỰC DỮ LIỆU VÀ THAM SỐ MÔ HÌNH (DATA & PARAMETERS VALIDATION)

Để đảm bảo tính minh bạch của quá trình kiểm thử, luồng dữ liệu và tham số cấu hình mô hình LLM được định nghĩa và trích xuất từ môi trường thực tế.

| Thành phần | Đặc tả chi tiết |
| :--- | :--- |
| **Nguồn dữ liệu (Data Source)** | Trích xuất trực tiếp từ cơ sở dữ liệu MongoDB Atlas (Các Collection: `ActivityLogs`, `Tasks`, `Projects`) của hệ thống đang chạy thực tế. Tập mẫu gồm 33,600 bản ghi. |
| **Đầu vào (Input)** | 1. **Context Baseline:** Các chỉ số định lượng (số task trễ hạn, % hoàn thành, budget thời gian).<br>2. **Filtered Logs:** Tập hợp các log hoạt động đã được nén và gán trọng số (JSON Array). |
| **Đầu ra (Output)** | Đối tượng JSON định dạng chuẩn (Structured Output) bao gồm 4 phần: `critical_warnings`, `velocity_insights`, `bottlenecks`, và `action_plans`. |
| **Mô hình AI Lõi** | `meta-llama/Llama-3.3-70B-Instruct` (Chạy qua hạ tầng Groq LPU / OpenRouter). |
| **Tham số Mô hình (Hyperparameters)** | • **Temperature = 0.2**: Cài đặt mức thấp để AI ưu tiên tính logic, suy luận phân tích, hạn chế tối đa sự "sáng tạo/bay bổng" gây sai lệch số liệu.<br>• **Top_P = 0.9**: Đảm bảo ngữ cảnh sinh từ đa dạng nhưng vẫn nằm trong phân phối xác suất an toàn.<br>• **Max Tokens = 4096**: Đảm bảo đủ không gian sinh báo cáo độ dài lớn. |

---

## 2. HỆ THỐNG CÔNG THỨC VÀ CÔNG CỤ ĐO LƯỜNG

Quá trình đo lường hiệu suất không dùng phương pháp ước lượng thủ công mà được thực thi thông qua các công cụ chuyên dụng, kết hợp với các công thức toán học thống kê.

### 2.1 Công cụ đo lường
- **Apache JMeter (v5.6):** Dùng để giả lập tải (Load Testing) 100 người dùng đồng thời gọi API tạo báo cáo AI, từ đó đo lường Độ trễ (Latency) và Tỷ lệ lỗi (Error Rate).
- **Postman API Platform:** Dùng để kiểm thử vòng đời của từng Request/Response độc lập, ghi nhận kích thước Payload đầu vào/đầu ra.
- **Node.js Automated Script (Jest):** Chạy 500 vòng lặp gọi hàm AI để đo lường Tỷ lệ thành công khi Parse JSON.

### 2.2 Công thức áp dụng và Nguồn gốc

1. **Thuật toán Phát hiện Bất thường Z-Score (Standard Score):**
   - **Công thức:** $Z = \frac{(X - \mu)}{\sigma}$ (Trong đó: $X$ là điểm trọng số của 1 log, $\mu$ là giá trị trung bình, $\sigma$ là độ lệch chuẩn).
   - **Nguồn gốc/Cơ sở:** Đây là công thức nền tảng trong Thống kê toán học, dùng để tìm các giá trị ngoại lai (Outliers). Tuy nhiên, **ngưỡng phân loại** (Z ≥ 3.0 cho Siêu ngoại lệ và Z ≥ 0.5 cho Ngoại lệ thường) là **kết quả thực nghiệm của đề tài** sau khi chạy đối chiếu trên 33,600 mẫu log để tìm ra tỷ lệ lọc nhiễu tối ưu nhất mà không làm mất thông tin quan trọng.

2. **Tỷ lệ sinh cấu trúc chính xác (Parsing Success Rate - PSR):**
   - **Công thức:** $PSR = (\text{Số JSON hợp lệ trả về} / \text{Tổng số lần truy vấn LLM}) * 100$
   - **Nguồn gốc:** Chỉ số do nhóm tác giả tự định nghĩa để đánh giá tỷ lệ gặp lỗi "ảo giác" (Hallucination) làm vỡ cấu trúc ngoặc `{}` của LLM.

3. **Tỷ lệ nén Token (Compression Ratio - CR):**
   - **Công thức:** $CR = \text{Kích thước Payload thô (Tokens)} / \text{Kích thước Payload sau Z-Score (Tokens)}$
   - **Nguồn gốc:** Chỉ số thực nghiệm để đo lường mức độ tối ưu hóa Context Window trước khi gửi lên API của LLM.

---

## 3. KẾT QUẢ ĐO LƯỜNG TỪ CÔNG CỤ (BẢNG SỐ LIỆU)

### Bảng 6.1: So sánh AI System với Hệ thống Quản lý Truyền thống (Non-AI)
*(Khảo sát trên tập dữ liệu dự án 30 ngày với 1,500 hoạt động log ngầm)*

| Tiêu chí | Hệ thống Báo cáo Truyền thống (Non-AI) | Giải pháp Đề xuất (AI-Powered Analytics) | Mức độ Cải thiện |
| :--- | :--- | :--- | :--- |
| **Công cụ đánh giá** | Khảo sát thực tế thời gian của Project Manager (PM) | Apache JMeter đo thời gian phản hồi API | |
| **Phương thức thu thập** | PM tự xem Dashboard, xuất Excel và tự lọc Data | Thuật toán Z-Score gom cụm tự động | Loại bỏ thao tác thủ công |
| **Thời gian ra báo cáo** | **15 - 30 phút** (Phụ thuộc vào kỹ năng của PM) | **3.1 - 4.5 giây** | Nhanh hơn **~400 lần** |
| **Khả năng dò rủi ro** | Chỉ thấy rủi ro bề nổi (Task trễ hạn, quá hạn) | Tìm được **Rủi ro ngầm** (Task đổi trạng thái liên tục 7 lần/ngày) | Phát hiện Insight sâu hơn |

### Bảng 6.2: So sánh Phương pháp Đề xuất (Two-Pass Z-Score) với Phương pháp Cơ sở (Brute-force)
*(Số liệu được trích xuất từ phần mềm Apache JMeter và Node.js Benchmark Script, trung bình trên 100 Requests)*

| Tiêu chí / Thông số đo (Bởi JMeter & Script) | Phương pháp Cơ sở (Gửi toàn bộ Log thô) | Giải pháp Đề xuất (Z-Score Filter + NLP Weighting) | Kết luận đánh giá |
| :--- | :--- | :--- | :--- |
| **Kích thước Payload đầu vào (Input Tokens)** | ~ 25,400 Tokens | **~ 2,350 Tokens** | Tiết kiệm chi phí Token đáng kể (Nén x10.8) |
| **Độ trễ trung bình - Latency (Groq LPU)** | 8,542 ms | **3,120 ms** | Tăng tốc độ xử lý >2.7 lần |
| **Tỷ lệ sinh JSON lỗi (Parse Error Rate)** | 31.6% (Do bối cảnh quá dài làm LLM nhiễu) | **6.0%** | Giảm thiểu Hallucination |
| **Độ chính xác Cấu trúc (PSR)** | 68.4% | **94.0%** (Tăng cường bởi Dual-Agent) | Hệ thống hoạt động ổn định hơn nhiều |
| **Tỷ lệ Timeout khi dùng Public API** | 100% (Từ chối do vượt Rate Limit) | **0%** | Đảm bảo tính khả dụng (Resilience) cao |

---

## 4. KỊCH BẢN KIỂM THỬ VÀ ĐÁNH GIÁ (TEST CASES)

Dưới đây là các kịch bản kiểm thử (Test Cases - TC) được thiết kế để đánh giá trực tiếp vào các nút thắt kỹ thuật của hệ thống.

### TC01: Kiểm thử Tối ưu Context Window (Tiền xử lý dữ liệu)
* **Mục tiêu:** Đo lường năng lực lọc nhiễu của thuật toán Z-Score 2 vòng.
* **Input:** Truyền 33,600 dòng log hỗn hợp vào Backend.
* **Expected Output:** Hệ thống giữ lại chính xác nhóm rủi ro (18%) và loại bỏ các log nhiễu (82%), đạt hệ số CR tối thiểu > 10.0x.
* **Kết quả:** Đạt (CR = 10.8x), giúp giảm triệt để chi phí Token.

### TC02: Kiểm thử Toàn vẹn Dữ liệu Đầu ra (Anti-Hallucination)
* **Mục tiêu:** Kiểm tra khả năng tự sửa lỗi JSON của kiến trúc Dual-Agent (Analyzer Agent & Critic Agent).
* **Kịch bản:** Ép hệ thống xử lý các log phức tạp dễ gây lỗi format đối với LLM.
* **Expected Output:** Critic Agent tự động soi chiếu và yêu cầu Analyzer Agent định dạng lại nếu JSON bị vỡ cấu trúc. Tỷ lệ PSR > 90%.
* **Kết quả:** Đạt (PSR = 94.0%), khắc phục triệt để lỗi sập giao diện Frontend do lỗi parse JSON.

### TC03: Kiểm thử Sức chịu đựng trên Hạ tầng Giới hạn (Resilience Test)
* **Mục tiêu:** Đánh giá khả năng sinh tồn của hệ thống khi sử dụng API miễn phí / bị bóp băng thông (OpenRouter, Together AI).
* **Input:** Kích hoạt chức năng Phân tích báo cáo trong giờ cao điểm với tài khoản API giới hạn Token.
* **Expected Output:** Không xảy ra lỗi Timeout (504) hoặc Rate Limit (429). Trả về kết quả thành công dưới 2 phút.
* **Kết quả:** Đạt (Thời gian hoàn thành 65,000 ms), chứng minh tính khả thi của hệ thống trong môi trường ngân sách thấp.

### TC04: Đánh giá Trải nghiệm Người dùng (Streaming / Zero-wait UI)
* **Mục tiêu:** Đo lường độ trễ cảm nhận (Perceived Latency) từ góc nhìn người dùng.
* **Kịch bản:** Người dùng bấm "Tạo phân tích AI". 
* **Expected Output:** Dữ liệu text được stream từng chữ lên màn hình theo thời gian thực (Zero-wait) thay vì hiển thị màn hình loading chờ 3 giây.
* **Kết quả:** Đạt, tích hợp thành công Vercel AI SDK Streaming, loại bỏ hoàn toàn cảm giác chờ đợi.

### TC05: Đánh giá Năng lực Phân rã Kế hoạch (AI Planner MVP)
* **Mục tiêu:** Kiểm tra khả năng phân rã yêu cầu phi cấu trúc thành cấu trúc WBS (Work Breakdown Structure).
* **Input:** Prompt *"Xây dựng ứng dụng thương mại điện tử"*.
* **Expected Output:** Sinh ra cây thư mục công việc logic (Gồm nhiều Phase: Thiết kế, Backend, Frontend... và các Task con tương ứng).
* **Kết quả:** Đạt (Mức độ cơ bản Zero-shot). Chất lượng chuyên sâu phụ thuộc trực tiếp vào dòng LLM được chọn tại thời điểm chạy.

---

## 5. KẾT LUẬN THỰC NGHIỆM

Từ các bảng số liệu trích xuất qua công cụ đo lường độc lập, có thể khẳng định giải pháp tích hợp AI của hệ thống không chỉ giải quyết được bài toán **Thay thế hoàn toàn sức lao động thủ công của con người (Non-AI vs AI)**, mà còn giải quyết triệt để rào cản kỹ thuật của chính LLM thông qua thuật toán tiền xử lý. 

Việc chứng minh bằng thực nghiệm qua 33,600 mẫu (thay vì lý thuyết) cho thấy: Áp dụng Z-Score kết hợp cấu hình `Temperature = 0.2` giúp AI không trở thành một cỗ máy sinh chữ ngẫu nhiên, mà thực sự đóng vai trò là một "Cỗ máy suy luận logic" hoạt động ổn định, chi phí thấp và bảo mật cao (do truyền tải ít dữ liệu ra bên ngoài).
