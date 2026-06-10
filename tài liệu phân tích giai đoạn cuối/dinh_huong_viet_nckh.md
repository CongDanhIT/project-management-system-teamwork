# Hướng dẫn viết Nghiên cứu Khoa học (NCKH) cho hệ thống Agentic AI (TeamFlow)

Thật ra bạn không cần phải lo lắng! Trong lĩnh vực Công nghệ thông tin (Software Engineering), có 2 trường phái viết Bài báo Nghiên cứu Khoa học (NCKH):
1. **Trường phái Thuật toán (AI/Data Science cốt lõi):** Mấy bạn này tự build model AI từ đầu, tối ưu hàm Loss, Backpropagation... thì *bắt buộc* phải có cả đống công thức Toán học, Đạo hàm, Ma trận.
2. **Trường phái Hệ thống & Ứng dụng (System Architecture & Applied AI):** Trường phái của bạn nằm ở đây! Bạn ứng dụng LLM (qua API) để giải quyết một bài toán nghiệp vụ (Quản lý dự án). Ở trường phái này, tính khoa học nằm ở **Kiến trúc hệ thống, Biểu đồ luồng dữ liệu (Data flow), và Đánh giá hiệu năng (Evaluation/Benchmark)**. 

Tuy nhiên, nếu bạn muốn bài NCKH của mình trông "Nguy hiểm", "Hàn lâm" và có những công thức "siêu siêu" để lấy le với Hội đồng, dưới đây là cách **"Hàn lâm hóa" (Toán học hóa)** chính cái code Function Calling hiện tại của bạn:

## 1. Cách đưa "Công thức Toán học" vào hệ thống của bạn

Thay vì nói *"Hệ thống gọi API để chia nhỏ task"*, hãy dùng **Lý thuyết Đồ thị (Graph Theory)** và **Xác suất (Probability)** để mô hình hóa nó.

### A. Công thức Phân rã Công việc (Task Decomposition - Lý thuyết đồ thị)
Khi AI của bạn phân rã 1 Kế hoạch lớn thành nhiều Task nhỏ, thực chất nó đang tạo ra một đồ thị có hướng (Directed Acyclic Graph - DAG).
*   Định nghĩa: Một dự án $P$ được phân rã thành một tập hợp các công việc $T = \{t_1, t_2, ..., t_n\}$.
*   Công thức biểu diễn Sự phụ thuộc (Dependencies): Nếu $t_2$ chỉ được bắt đầu khi $t_1$ xong, ta có cạnh có hướng $(t_1, t_2) \in E$. 
*   **Viết vào báo cáo:** *"Hệ thống sử dụng LLM để tự động trích xuất Đồ thị phụ thuộc công việc $G = (T, E)$, trong đó hàm mục tiêu là tối thiểu hóa thời gian hoàn thành dự án (Makespan)..."* -> Nghe rất hàn lâm đúng không?

### B. Công thức của Luồng Agentic (ReAct Framework)
Hệ thống Function Calling của bạn bản chất là mô hình **Reason and Act (ReAct)**. LLM sẽ tính toán xác suất để chọn gọi hàm nào.
*   Bạn có thể đưa công thức này vào báo cáo:
    > Quá trình ra quyết định của AI Tác tử (Agent) được mô hình hóa theo chuỗi Markov (Markov Decision Process). Tại bước $t$, Agent nhận trạng thái (ngữ cảnh) $s_t$, và xuất ra một Hành động (Function Call) $a_t$ dựa trên chính sách phân phối xác suất từ LLM: 
    > $\pi(a_t | s_t) = P_{LLM}(a_t | Prompt, Context, Schema)$
    > Sau khi gọi hàm, hệ thống trả về kết quả quan sát (Observation) $o_t$, cập nhật trạng thái $s_{t+1}$.

### C. Công thức Đánh giá Hiệu năng (Latency & Performance)
*   Thay vì nói *"App chạy nhanh"*, hãy viết công thức tổng thời gian phản hồi của hệ thống:
    > $T_{total} = T_{parse} + T_{LLM\_inference} + T_{function\_execution} + T_{network}$
    > (Trong đó $T_{function\_execution}$ chính là thời gian Query MongoDB của bạn).

---

## 2. Dàn ý Báo cáo NCKH "Ăn điểm" cho Sản phẩm của bạn

Để bài báo có tính khoa học cao, bạn nên cấu trúc theo dạng **Đề xuất Kiến trúc mới và Đánh giá (Propose & Evaluate)**:

*   **1. Đặt vấn đề (Abstract/Introduction):** Các công cụ quản lý dự án hiện tại (Trello, Jira) đòi hỏi con người thao tác thủ công quá nhiều. Việc phân rã công việc mất nhiều thời gian.
*   **2. Nghiên cứu liên quan (Related Work):** So sánh phương pháp **RAG (Retrieval-Augmented Generation)** và **Function Calling / Tool Use**. (Chèn lập luận: RAG bị ảo giác số liệu, Function Call thì không).
*   **3. Đề xuất Kiến trúc (Proposed System Architecture):** 
    *   Vẽ sơ đồ luồng dữ liệu (Mermaid chart).
    *   Giới thiệu **Kiến trúc LLM-Agent kết hợp Function Calling**. 
    *   Đưa các công thức Toán học ở phần 1 vào đây để giải thích mô hình logic.
*   **4. Thực nghiệm và Đánh giá (Experiments & Results):** (ĐÂY LÀ PHẦN QUAN TRỌNG NHẤT)
    *   **Thí nghiệm 1:** Thời gian tạo 10 task (Human vs AI). Lập bảng so sánh (Con người mất 5 phút, Hệ thống AI qua Function Call mất 15 giây).
    *   **Thí nghiệm 2:** Độ chính xác (Accuracy). So sánh AI tự nghĩ ra dữ liệu (Không dùng Function Call) vs AI có Function Call (100% khớp với DB).
    *   Vẽ biểu đồ hình cột/đường (Bar/Line charts) so sánh. Nghiên cứu khoa học thì **Biểu đồ số liệu (Data visualization)** có sức nặng ngang ngửa công thức Toán!

**Tóm lại:** Đừng bị "ngợp" bởi các công thức Toán của hệ khác. Trong ngành của bạn (Software Engineering & Applied AI), sự khoa học nằm ở việc bạn **chứng minh được kiến trúc của bạn giải quyết được bài toán thực tế nhanh hơn, chính xác hơn bao nhiêu phần trăm (%)** thông qua các con số thống kê và sơ đồ hệ thống rõ ràng. Cứ tự tin triển khai theo hướng này nhé!
