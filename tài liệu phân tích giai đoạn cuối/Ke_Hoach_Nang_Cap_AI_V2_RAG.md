# Nâng cấp Kiến trúc AI Chat V2: Tích hợp Vector Search & RAG

Bản thiết kế này mô tả chi tiết lộ trình và cấu trúc kỹ thuật để nâng cấp hệ thống AI Agent V2 (TeamFlow), chuyển đổi từ cơ chế tìm kiếm từ khóa/regex sang tìm kiếm theo ngữ nghĩa (Semantic Search) và bổ sung Hệ thống Hỏi đáp Tri thức (RAG - Retrieval-Augmented Generation).

Tài liệu này được lưu trữ để làm tài liệu tham khảo cho quá trình thực thi sau này.

## User Review Required

> [!IMPORTANT]
> **Hạ tầng cơ sở dữ liệu:**
> Giải pháp này sử dụng **MongoDB Atlas Vector Search** vì dự án hiện đang dùng Mongoose. Chúng ta sẽ cần tạo các **Vector Search Index** trực tiếp trên giao diện của MongoDB Atlas (hoặc qua Atlas CLI) trước khi code hoạt động được.

> [!WARNING]
> **Chi phí API Embedding:**
> Để tạo vector (Embedding), chúng ta cần dùng một model chuyên biệt (ví dụ: `text-embedding-3-small` của OpenAI hoặc mô hình của Google/Groq). Việc gọi API này liên tục khi tạo Task/Project sẽ tốn một lượng nhỏ chi phí.

## Open Questions

1. **Provider cho Mô hình Nhúng (Embedding Model):** Dự án hiện đã cài đặt `@ai-sdk/openai`, `@ai-sdk/google`, và `@ai-sdk/groq`. Ta nên sử dụng mô hình Embedding của ai để cân bằng giữa chi phí và độ chính xác (Khuyên dùng `text-embedding-3-small` của OpenAI)?
2. **Chiến lược đồng bộ dữ liệu cũ (Data Migration):** Với các Task và Project đã tồn tại, ta có muốn viết một script riêng (cron job/script) để chạy 1 lần nhằm tạo vector cho toàn bộ dữ liệu cũ không?

---

## Proposed Changes

Chúng ta sẽ chia đợt nâng cấp này thành các component/layer kỹ thuật rõ ràng.

### Database Schema Layer

Cập nhật các schema hiện tại để lưu trữ mảng vector.

#### [MODIFY] backend/src/models/task.model.ts
- Thêm trường `embedding: { type: [Number], index: true }` để lưu vector của tiêu đề, mô tả và comment trong task.
- Thêm index nếu cần thiết, nhưng cấu hình chính sẽ nằm trên MongoDB Atlas.

#### [MODIFY] backend/src/models/project.model.ts
- Thêm trường `embedding: { type: [Number] }` cho Project.



---

### AI Service Layer (Core AI Logic)

Tích hợp AI SDK để sinh vector và cập nhật logic Agent.

#### [MODIFY] backend/src/services/ai.service.ts
- **Cập nhật Tool tìm kiếm:** Sửa lại logic của `searchTasksByName`, `searchProjectsByName`, `searchPhasesByName` và `getTasksList`. Thay vì dùng `$regex`, ta sẽ nhúng chuỗi tìm kiếm của người dùng thành vector, sau đó gọi query pipeline `$vectorSearch` của MongoDB.
- **Thêm Tool mới (RAG):**
  - Khai báo tool `askProjectKnowledge`: Tool này sẽ nhận một câu hỏi, chuyển thành vector, search các task, ghi chú, document liên quan có điểm Cosine Similarity cao nhất (Top-K) và nhồi vào prompt cho Agent.

#### [NEW] backend/src/services/embedding.service.ts
- Viết service chuyên trách gọi API Embedding (ví dụ `openai.embedding()`).
- Chứa các hàm: `generateEmbedding(text: string): Promise<number[]>`.
- Hàm `embedTask(task): Promise<number[]>` để gom (concat) title, description, status thành chuỗi text trước khi embed.

---

### Business Logic Layer (Controllers/Services)

Đảm bảo khi dữ liệu thay đổi, vector cũng được cập nhật.

#### [MODIFY] backend/src/services/task.service.ts
- **Hook tạo/sửa Task:** Bất cứ khi nào tạo Task mới hoặc cập nhật nội dung Task, gọi `embedding.service.ts` sinh vector và lưu vào db.
- Tương tự với Project Service.



## Verification Plan

### Automated Tests
- **Sinh Vector:** Viết script test thủ công trong `backend/src/mytest/` để test xem API Embedding có trả về đúng mảng float (ví dụ 1536 chiều của OpenAI) hay không.
- **Kiểm tra Index MongoDB:** Chạy câu lệnh Aggregate `$vectorSearch` trực tiếp từ script để đo khoảng cách Cosine Similarity giữa 2 task xem có chính xác không.

### Manual Verification
- **Thử nghiệm tìm kiếm không dùng từ khóa:** Hỏi AI Agent "Tìm các task liên quan đến làm đẹp giao diện". Cần phải trả về được các task có chữ "UI/UX, CSS, Tailwind" dù không có từ khóa "làm đẹp giao diện" trong DB.
