# Dàn ý Bài Báo Khoa Học (Dựa trên Source Code thực tế)

**ĐỀ TÀI:** Khắc phục Giới hạn Ngữ cảnh (Context Window) trong Mô hình Ngôn ngữ Lớn: Phương pháp Nén Dữ liệu Động cho Hệ thống Sinh Báo cáo Dự án Tự động.
*(Tên đề tài này nghe cực kỳ khoa học, đánh thẳng vào "nỗi đau" lớn nhất của AI hiện tại là bị giới hạn độ dài đầu vào).*

---

## 1. Mở đầu (Introduction)
*   **Thực trạng:** Các dự án phần mềm tạo ra hàng nghìn log hoạt động (Activity Logs) mỗi ngày. Việc Quản lý dự án (PM) đọc log thủ công để viết báo cáo là bất khả thi.
*   **Vấn đề của AI hiện tại:** Không thể "đổ" toàn bộ 10,000 dòng log từ Database trực tiếp vào ChatGPT hay Llama 3 vì sẽ gây ra hiện tượng **Tràn bộ nhớ ngữ cảnh (Context Window Overflow)** và tốn kém chi phí API (Token limits).
*   **Đề xuất của bài báo:** Xây dựng một luồng kiến trúc 2 tầng: (1) Thuật toán Gom nhóm dữ liệu (Data Aggregation) tại Backend và (2) Bộ máy Suy luận dựa trên Llama-3-70B (Groq) để tự động sinh báo cáo.

## 2. Các nghiên cứu liên quan (Related Work)
*   *Lưu ý cho bạn:* Phần này bạn tìm 2-3 bài báo trên Google Scholar nói về việc dùng LLM để tóm tắt văn bản. Sau đó bạn chê họ là: Các hệ thống đó chỉ tóm tắt *văn bản*, còn hệ thống của bạn tóm tắt *Dữ liệu Cơ sở dữ liệu (Database Records)*.

## 3. Kiến trúc Đề xuất (Proposed Architecture) - CHỌN LỌC TỪ CODE CỦA BẠN
Đây là "trái tim" của bài báo. Chúng ta sẽ phân tích thẳng vào file `analytics.service.ts` của bạn:

### 3.1. Thuật toán Tiền xử lý và Nén Dữ liệu (Data Pre-processing & Aggregation)
*   **Logic thực tế trong code của bạn:** Bạn đã dùng hàm `ActivityLogModel.find(...)` để lấy 1000 logs gần nhất trong 30 ngày. 
*   **Giải thích khoa học:** Thay vì truyền mảng 1000 object (rất tốn Token), thuật toán đề xuất sử dụng Hash Map (`groupedLogsMap`) để tạo khóa gộp (Group Key) theo công thức: `Khóa = Thời_gian + Người_dùng + Loại_hành_động + Đối_tượng`. 
*   **Kết quả:** Biến 1000 hành động rời rạc (Ví dụ: "A sửa task 1", "A sửa task 2") thành một bản ghi nén (Vector): `[A, UPDATE_TASK, count: 2]`. 

### 3.2. Cấu trúc Prompt và Tích hợp Mô hình (LLM Integration)
*   **Logic thực tế:** Mảng `compactLogs` (đã được nén) sẽ được gửi tới LLM.
*   **Giải thích khoa học:** Trình bày cấu trúc System Prompt. LLM (Llama 3 70B qua Groq API) không hoạt động như một chatbot, mà hoạt động như một **Tác tử Đánh giá (Evaluation Agent)**. Nó đọc mảng `compactLogs`, phát hiện sự bất thường (Ví dụ: Tại sao hôm nay User A lại xóa quá nhiều Task?), và sinh ra kết quả đầu ra theo định dạng Markdown.

## 4. Thực nghiệm và Đánh giá (Experiments & Evaluation)
*Bạn cần làm 2 thí nghiệm sau để lấy số liệu vẽ biểu đồ vào bài:*

*   **Thí nghiệm 1: Đánh giá tỷ lệ nén dữ liệu (Compression Ratio)**
    *   *Cách làm:* Bạn test thử tạo 500 logs trong MongoDB. Sau đó so sánh kích thước (số lượng chữ/token) của mảng gốc so với mảng `compactLogs` sau khi chạy hàm `aggregateProjectActivityLogsService`.
    *   *Dự kiến:* Thuật toán của bạn giúp giảm 70-80% số token cần gửi cho AI. (Đây là điểm ăn tiền tuyệt đối).

*   **Thí nghiệm 2: Thời gian phản hồi (Latency Benchmark)**
    *   *Cách làm:* Đo thời gian từ lúc bấm nút "Sinh báo cáo" đến lúc nhận kết quả.
    *   *Dự kiến:* Nhấn mạnh việc sử dụng Groq (LPU) kết hợp mảng dữ liệu đã nén giúp tốc độ sinh báo cáo đạt mức dưới 3 giây (Real-time reporting).

## 5. Kết luận (Conclusion)
*   Khẳng định thuật toán nén dữ liệu kết hợp LLM Agentic mang lại giải pháp sinh báo cáo tối ưu cho hệ thống quản lý dự án. Hướng phát triển tương lai là dùng dữ liệu này để vẽ biểu đồ trực quan (Dashboard).

---

### 💡 LỜI KHUYÊN DÀNH CHO NGƯỜI MỚI (Từ Mentor)
1. **Sự cần thiết của hàm `analytics.service.ts`:** Ban đầu bạn có thể nghĩ "gom nhóm cho gọn". Nhưng trong Khoa học AI, hành động đó gọi là **"Tối ưu hóa Context Window"**. Mô hình AI nào cũng có giới hạn trí nhớ (8k token, 128k token). Nếu bạn không có hàm gom nhóm này, khi dự án lớn lên, AI sẽ bị "mù" (quên dữ liệu cũ) hoặc Server sập vì tốn tiền API.
2. **Hãy tự tin vẽ biểu đồ:** Ở phần Thực nghiệm (Mục 4), đừng chỉ viết chữ. Hội đồng rất lười đọc chữ. Hãy vẽ 1 cái biểu đồ cột: Cột 1 là số Token trước khi nén (cao chót vót), Cột 2 là số Token sau khi nén (thấp tịt). Hội đồng nhìn biểu đồ này sẽ cho điểm A ngay lập tức vì thấy rõ tư duy tối ưu hệ thống của bạn!
