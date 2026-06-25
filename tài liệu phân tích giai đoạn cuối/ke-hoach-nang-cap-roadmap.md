# Kế Hoạch Nâng Cấp Roadmap - TeamFlow

Tài liệu này phân tích và lên kế hoạch triển khai 3 tính năng nâng cao cho trang Lộ trình (Roadmap/Timeline) nhằm biến nó thành công cụ tương tác mạnh mẽ.

---

## 1. Tương tác trực tiếp (Interactive Timeline - Kéo Thả)
**Mục tiêu:** Cho phép người dùng kéo thả (Drag & Drop) để dời ngày bắt đầu, kéo dãn để thay đổi thời lượng (duration) và kéo công việc từ danh sách "Chưa xếp lịch" thả thẳng vào Timeline.

**Phân tích kỹ thuật:**
- **Kéo dãn & Dời ngày trên Timeline (Rescheduling):** 
  - Dự án hiện đã cài đặt thư viện `react-rnd` (Resize and Drag). Đây là thư viện hoàn hảo nhất cho việc này.
  - Ta sẽ thay thế thẻ `<motion.div>` của mỗi Task Bar bằng component `<Rnd>`.
  - Cấu hình `dragAxis="x"` (chỉ cho phép trượt ngang) và `enableResizing={{ left: true, right: true }}` (chỉ cho kéo dãn 2 đầu).
  - Khi bắt sự kiện `onDragStop` hoặc `onResizeStop`, dựa vào tọa độ `x` và độ lệch (so với `COLUMN_WIDTH = 40`), tính toán số ngày thay đổi và gọi API `taskService.updateTask` để cập nhật `startDate` / `dueDate`.
- **Kéo từ Drawer "Chưa xếp lịch" vào Timeline:**
  - Sử dụng thư viện `@dnd-kit/core` (có sẵn trong dự án).
  - Bọc các thẻ trong cột Chưa xếp lịch bằng `useDraggable`.
  - Biến các ô ngày (hoặc từng hàng Project) trên Timeline thành các vùng `useDroppable`. Khi Drop, hệ thống lấy ID của cột ngày làm `startDate` và tính toán gán tự động.

---

## 2. Chế độ xem linh hoạt (Zoom Levels)
**Mục tiêu:** Cung cấp góc nhìn vĩ mô và vi mô: Theo Tuần (Weekly), Theo Tháng (Monthly - hiện tại) và Theo Quý (Quarterly).

**Phân tích kỹ thuật:**
- **State quản lý:** Thêm state `const [zoomLevel, setZoomLevel] = useState<'week' | 'month' | 'quarter'>('month')`.
- **Xử lý thuật toán Grid:**
  - **Chế độ Tuần (Week):** Chỉ render 7 cột (từ T2 -> CN). `COLUMN_WIDTH` được phóng to (ví dụ `150px`) để thanh Task đủ rộng chứa toàn bộ text mô tả bên trong (thay vì dùng Tooltip).
  - **Chế độ Tháng (Month):** Giữ nguyên logic hiện tại (`COLUMN_WIDTH = 40`).
  - **Chế độ Quý (Quarter):** Render 3 tháng (khoảng 12 tuần). Mỗi cột grid sẽ đại diện cho **1 Tuần** (thay vì 1 ngày). Toán tử tính toán `startOffset` và `displayDuration` phải chia cho 7.
- **UI Navigation:** Cụm Header hiện tại ("< tháng 06 >") sẽ linh hoạt thay đổi text theo `zoomLevel`.

---

## 3. Chế độ xem theo Nguồn lực (Resource Workload View)
**Mục tiêu:** Xem được lịch trình phân bổ cho từng Thành viên thay vì từng Dự án, giúp quản lý nhìn ra ai đang quá tải.

**Phân tích kỹ thuật:**
- **Chuyển đổi góc nhìn (Toggle):** Thêm Segmented Control để chọn `Group By: Dự án | Thành viên`. Lưu qua state `groupBy`.
- **Tái cấu trúc dữ liệu (Data Transformation):** 
  - Ở chế độ `project`, render dựa trên vòng lặp `filteredProjects`.
  - Ở chế độ `resource`, ta cần xử lý mảng `tasks` gốc: Gom nhóm `tasks` theo `task.assignedTo[0]._id`.
  - Cột Sidebar (trái) sẽ hiển thị Avatar + Tên User.
- **Heatmap quá tải (Overload Detection):**
  - Bổ sung logic tính toán: Tại một ngày cụ thể (Column), nếu User A có nhiều hơn 3 tasks song song hoặc tổng số giờ estimate vượt mức cho phép.
  - Đổ màu nền đỏ nhạt (`bg-rose-500/10`) vào background cột ngày đó trên dòng (row) của User A.

---

## Lộ trình triển khai (Implementation Phases)

- **Phase 1 (Data & View Modes):** Implement Toggle `Group By` (Resource/Project) và `Zoom Levels` (Thuật toán vẽ grid). Ở bước này chỉ hiển thị, chưa có tương tác.
- **Phase 2 (Interactive Rnd):** Thay thế thanh UI của Task bằng `react-rnd`, áp dụng toán tử chia `COLUMN_WIDTH` để tính ngày thay đổi khi Drag/Resize. Optimistic UI update.
- **Phase 3 (Dnd-kit):** Tích hợp kéo thả thẻ chưa xếp lịch từ Sheet (Drawer) vào Timeline. Đây là tác vụ tốn công nhất do liên đới giữa 2 thư viện và Portal DOM.
