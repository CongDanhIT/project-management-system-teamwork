# YÊU CẦU PHI CHỨC NĂNG (NON-FUNCTIONAL REQUIREMENTS)
*Tài liệu đặc tả các tiêu chuẩn kỹ thuật, bảo mật và chất lượng phần mềm, phục vụ cho báo cáo Khóa luận/Đồ án tốt nghiệp.*

---

## 1. Yêu cầu về Bảo mật (Security)
| STT | Thuộc tính | Mô tả tiêu chuẩn kỹ thuật |
| :---: | :--- | :--- |
| 1 | **Bảo mật phiên đăng nhập** | Loại bỏ hoàn toàn việc lưu trữ token ở Local Storage. Ứng dụng kiến trúc **Stateless Cookie Session** kết hợp cờ `HttpOnly` và `Secure` để ngăn chặn triệt để tấn công XSS (Cross-Site Scripting). |
| 2 | **Cô lập dữ liệu (Multi-tenancy)** | Đảm bảo an toàn dữ liệu mức cao nhất giữa các tổ chức (Workspace). Tất cả các truy vấn CSDL đều phải đi kèm `workspaceId`. |
| 3 | **Mã hóa dữ liệu** | Mật khẩu người dùng phải được băm (hash) bằng thuật toán **Bcrypt** với Salt Rounds >= 10 trước khi lưu vào cơ sở dữ liệu. |
| 4 | **Kiểm soát truy cập (RBAC)** | Mọi API endpoint thay đổi dữ liệu (POST/PUT/DELETE) phải đi qua Middleware xác thực quyền hạn (Owner/Admin/Member) nghiêm ngặt để ngăn ngừa leo thang đặc quyền. |

## 2. Yêu cầu về Hiệu năng (Performance)
| STT | Thuộc tính | Mô tả tiêu chuẩn kỹ thuật |
| :---: | :--- | :--- |
| 1 | **Tốc độ phản hồi (Response Time)** | Thời gian phản hồi của các API RESTful thông thường (CRUD) kỳ vọng nhỏ hơn `500ms`. Giao diện (Frontend) phải được render và sẵn sàng tương tác (TTI) dưới `2.0s`. |
| 2 | **Quản lý Băng thông & Lưu trữ** | Tuyệt đối không lưu trữ tập tin trực tiếp trên Server nội bộ. Hệ thống phải sử dụng cơ chế Serverless thông qua `Cloudflare R2` (Presigned URL) để nạp file, giúp App Server không bị thắt nút cổ chai (bottleneck) khi xử lý tập tin lớn. |
| 3 | **Tối ưu hóa Truy vấn (DB Optimization)** | Bắt buộc sử dụng `Mongoose Aggregation Pipeline` cho các tác vụ thống kê phức tạp (Dashboard), giảm thiểu việc xử lý mảng (Array) tại tầng Application. Áp dụng phân trang (Pagination) ở các danh sách dữ liệu dài. |

## 3. Yêu cầu về Tính Khả dụng & Bảo toàn dữ liệu (Availability & Data Integrity)
| STT | Thuộc tính | Mô tả tiêu chuẩn kỹ thuật |
| :---: | :--- | :--- |
| 1 | **Cơ chế Xóa mềm (Soft Delete)** | Xóa dữ liệu không được phép xóa vật lý (Hard delete) ngay lập tức. Hệ thống phải gắn cờ `deletedAt` và lưu trữ trong Thùng rác ít nhất 30 ngày để đề phòng thao tác nhầm lẫn, đảm bảo khả năng khôi phục. |
| 2 | **Xử lý nền (Background Processing)** | Các tác vụ nặng (Xóa file rác, chốt sổ dữ liệu thống kê) phải được đẩy xuống hệ thống chạy ngầm (Cron Jobs) để không làm gián đoạn trải nghiệm của người dùng đang thao tác. |
| 3 | **Toàn vẹn luồng thông tin** | Tích hợp giao thức `Socket.io` để đảm bảo khi có nhiều người cùng xem một Task, mọi bình luận hay thay đổi trạng thái đều được đồng bộ hóa theo thời gian thực (Real-time) để tránh xung đột dữ liệu. |

## 4. Yêu cầu về Tính Mở rộng & Bảo trì (Scalability & Maintainability)
| STT | Thuộc tính | Mô tả tiêu chuẩn kỹ thuật |
| :---: | :--- | :--- |
| 1 | **An toàn kiểu dữ liệu (Type-safety)** | Áp dụng 100% `TypeScript` cho cả Frontend và Backend. Các payload (dữ liệu đầu vào) từ Client gửi lên phải được Validate chặt chẽ bằng `Zod Schema` trước khi đưa vào xử lý logic. |
| 2 | **Quản lý State Frontend** | Sử dụng thư viện `TanStack Query (React Query)` để quản lý Server State (Cache, Invalidation, Refetch), giúp giảm tải đáng kể lượng API Call thừa thãi lên máy chủ. |
| 3 | **Kiến trúc Cloud-ready** | Hệ thống Backend phải được thiết kế theo hướng phi trạng thái (Stateless), sẵn sàng cho việc nhân bản (Horizontal Scaling) và triển khai trên các nền tảng Container hoặc dịch vụ PaaS (Vercel/Render). |

## 5. Yêu cầu về Giao diện & Trải nghiệm Người dùng (UI/UX)
| STT | Thuộc tính | Mô tả tiêu chuẩn kỹ thuật |
| :---: | :--- | :--- |
| 1 | **Thiết kế Responsive** | Hệ thống áp dụng `Tailwind CSS`, đảm bảo giao diện hiển thị tốt, linh hoạt, không bị vỡ bố cục trên mọi kích thước màn hình (Đặc biệt tối ưu cho Desktop và Tablet). |
| 2 | **Ngôn ngữ Thiết kế (UX)** | Áp dụng nguyên lý thiết kế chuyên nghiệp cho nền tảng B2B. Các vùng không có dữ liệu (Empty States) phải có minh họa trực quan và nút kêu gọi hành động (Call to action) để dẫn dắt người dùng. |
