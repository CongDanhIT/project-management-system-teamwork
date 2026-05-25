# PHỤ LỤC: BẢNG ĐẶC TẢ YÊU CẦU CHỨC NĂNG HỆ THỐNG
*Tài liệu được định dạng theo quy chuẩn bảng biểu dùng trong báo cáo Khóa luận/Đồ án tốt nghiệp.*

---

## Bảng 1. Phân hệ Hệ thống Lõi & Xác thực (Core & Auth)
| STT | Mã chức năng | Tên chức năng | Tác nhân | Mô tả chi tiết nghiệp vụ |
| :---: | :--- | :--- | :--- | :--- |
| 1 | `F-AUTH-01` | Đăng nhập/Đăng ký | Guest | Xác thực tài khoản qua Local (Mật khẩu mã hóa Bcrypt) hoặc Google OAuth 2.0. Quản lý phiên truy cập bằng kiến trúc Cookie Session (Stateless) kết hợp Passport.js chống tấn công XSS. |
| 2 | `F-AUTH-02` | Quản lý Hồ sơ | User | Cho phép người dùng cập nhật thông tin cá nhân, thay đổi Avatar và đổi mật khẩu an toàn qua API. |
| 3 | `F-CORE-01` | Multi-tenancy | System | Cơ chế lõi tự động cô lập dữ liệu. Đảm bảo mọi truy vấn (Task, Project) đều được gắn và kiểm tra qua `workspaceId` để tránh rò rỉ dữ liệu chéo. |

## Bảng 2. Phân hệ Quản lý Workspace & Phân quyền (RBAC)
| STT | Mã chức năng | Tên chức năng | Tác nhân | Mô tả chi tiết nghiệp vụ |
| :---: | :--- | :--- | :--- | :--- |
| 4 | `F-WS-01` | Quản lý Workspace | Owner | Khởi tạo, chỉnh sửa thông tin hoặc xóa Không gian làm việc. Chỉ tài khoản khởi tạo (Owner) mới có quyền Xóa. |
| 5 | `F-WS-02` | Mời thành viên | Owner, Admin | Tạo liên kết mời (Invite Link) chứa mã định danh duy nhất để gửi cho nhân sự gia nhập Workspace. |
| 6 | `F-WS-03` | Kiểm soát RBAC | System | Middleware hệ thống tự động kiểm duyệt luồng truy cập dựa trên 3 vai trò: Chủ sở hữu (Owner), Quản trị viên (Admin), và Thành viên (Member) cho từng thao tác cụ thể. |

## Bảng 3. Phân hệ Quản lý Dự án & Công việc (Project & Task)
| STT | Mã chức năng | Tên chức năng | Tác nhân | Mô tả chi tiết nghiệp vụ |
| :---: | :--- | :--- | :--- | :--- |
| 7 | `F-PRJ-01` | Quản lý vòng đời Dự án | Owner, Admin | Tạo mới, thiết lập mô tả và quản lý trạng thái dự án. Hỗ trợ chức năng Đóng băng (Freeze/Completed) để lưu trữ hồ sơ, chặn mọi hành động chỉnh sửa. |
| 8 | `F-PRJ-02` | Quản lý Giai đoạn (Phases)| Owner, Admin | Phân rã dự án thành các Giai đoạn (Phases) để kiểm soát tiến độ theo mốc thời gian. Thiết lập ngày bắt đầu/kết thúc cho từng Phase. |
| 9 | `F-TSK-01` | Quản lý Công việc | All Roles | Tạo mới Task và Subtasks (cấp 1). Phân công người thực hiện, thiết lập ngày đến hạn (Deadline) và độ ưu tiên (Priority). |
| 10 | `F-TSK-02` | Bộ lọc dữ liệu (Filter) | All Roles | Tra cứu công việc đa điều kiện: Lọc theo Trạng thái, Độ ưu tiên, Người được giao và Thời hạn hoàn thành. |
| 11 | `F-TSK-03` | Thùng rác (Soft Delete) | All Roles | Chuyển dữ liệu bị xóa vào trạng thái Soft Delete (lưu `deletedAt`). Cho phép người dùng khôi phục lại dữ liệu trước khi bị hệ thống xóa vĩnh viễn. |

## Bảng 4. Phân hệ Trải nghiệm Giao diện (UI/UX)
| STT | Mã chức năng | Tên chức năng | Tác nhân | Mô tả chi tiết nghiệp vụ |
| :---: | :--- | :--- | :--- | :--- |
| 12 | `F-UI-01` | Kanban Board | All Roles | Hiển thị công việc trực quan theo các cột trạng thái (Todo, In Progress, Review, Done). Tối ưu hóa render để đảm bảo hiệu năng. |
| 13 | `F-UI-02` | Sơ đồ Gantt Chart | All Roles | Biểu diễn tiến độ dự án, Phase và Task trên trục thời gian. Cho phép người dùng theo dõi cấu trúc lập kế hoạch một cách trực quan nhất. |
| 14 | `F-UI-03` | Command K (Global Search)| All Roles | Tổ hợp phím nóng `Cmd/Ctrl + K` kích hoạt menu tìm kiếm đa năng. Truy xuất siêu tốc các Dự án, Task, thành viên mà không cần chuyển trang. |
| 15 | `F-UI-04` | Empty States | User | Cung cấp màn hình hướng dẫn (Onboarding) minh họa và Call-to-action khi hệ thống/workspace chưa có dữ liệu. |

## Bảng 5. Phân hệ Tương tác & Real-time
| STT | Mã chức năng | Tên chức năng | Tác nhân | Mô tả chi tiết nghiệp vụ |
| :---: | :--- | :--- | :--- | :--- |
| 16 | `F-RT-01` | Thông báo thời gian thực | User | Bắn luồng thông báo (Socket.io) ngay lập tức khi user được gán Task mới hoặc có nhắc nhở Deadline. |
| 17 | `F-RT-02` | Thảo luận (Task Comments) | All Roles | Khung chat nội bộ gắn liền với từng Task. Cho phép các thành viên trao đổi công việc, tag tên (@mention) đồng bộ theo thời gian thực. |
| 18 | `F-RT-03` | Bảng tin (Announcements) | Owner, Admin | Đăng tải các thông báo quan trọng, sự kiện của tổ chức lên Bảng tin chung, hỗ trợ ghim (Pin) bài viết. |

## Bảng 6. Phân hệ Trí tuệ nhân tạo (AI Smart Agent)
| STT | Mã chức năng | Tên chức năng | Tác nhân | Mô tả chi tiết nghiệp vụ |
| :---: | :--- | :--- | :--- | :--- |
| 19 | `F-AI-01` | AI Project Planner | Owner, Admin | Ứng dụng Vercel AI SDK và Zod Schema để phân tích yêu cầu tự nhiên, tự động sinh ra cấu trúc Dự án chi tiết (Giai đoạn và Công việc). |
| 20 | `F-AI-02` | Smart Agent Tool Calling | All Roles | Khung chat Trợ lý ảo tự trị. AI tự động gọi hàm (Tool Calling) để tương tác DB: Tra cứu dự án, tìm kiếm thành viên hoặc tạo Task thay người dùng. |
| 21 | `F-AI-03` | Phân tích Rủi ro | System, AI | AI quét Lịch sử hoạt động (Activity Logs) và hạn chót để nhận diện nút thắt cổ chai, sinh cảnh báo rủi ro tự động. |

## Bảng 7. Phân hệ Giám sát & Báo cáo (Analytics)
| STT | Mã chức năng | Tên chức năng | Tác nhân | Mô tả chi tiết nghiệp vụ |
| :---: | :--- | :--- | :--- | :--- |
| 22 | `F-ANA-01` | Dashboard Thống kê | All Roles | Trực quan hóa số liệu dự án qua biểu đồ (Pie/Bar chart). Thống kê chi tiết tỷ lệ Task hoàn thành, Task quá hạn và hiệu suất nhân sự. |
| 23 | `F-ANA-02` | Lịch sử Hành vi (Audit Log)| System | Ghi vết mọi thao tác thay đổi dữ liệu ("Ai đã làm gì, vào lúc nào"). Đảm bảo tính minh bạch và cung cấp nguồn Data cho AI phân tích. |
| 24 | `F-ANA-03` | Trích xuất Excel | All Roles | Động cơ xuất dữ liệu dạng bảng tính Excel chuyên nghiệp, phục vụ báo cáo lưu trữ ngoại tuyến cho ban giám đốc. |

## Bảng 8. Phân hệ Quản trị Tài nguyên Cloud (Assets)
| STT | Mã chức năng | Tên chức năng | Tác nhân | Mô tả chi tiết nghiệp vụ |
| :---: | :--- | :--- | :--- | :--- |
| 25 | `F-CLD-01` | Tải lên Serverless (R2) | All Roles | Backend sinh Presigned URL, cho phép Client tải trực tiếp tệp đính kèm lên bucket Cloudflare R2 để giảm tải băng thông cho máy chủ chính. |
| 26 | `F-CLD-02` | Quản lý Tài liệu (Tab Files)| All Roles | Không gian lưu trữ tập trung. Hiển thị danh sách toàn bộ các file đính kèm của một Dự án, cho phép xem trước, tải xuống hoặc xóa file. |

## Bảng 9. Phân hệ Tự động hóa & Xử lý nền (Background Services)
| STT | Mã chức năng | Tên chức năng | Tác nhân | Mô tả chi tiết nghiệp vụ |
| :---: | :--- | :--- | :--- | :--- |
| 27 | `F-BG-01` | Garbage Collector (Dọn rác) | System | Cron Job chạy nền định kỳ quét Database. Tự động xóa vĩnh viễn (Hard Delete) các bản ghi và tệp tin trên Cloud đã nằm trong trạng thái Soft Delete quá 30 ngày. |
| 28 | `F-BG-02` | Daily Analytics Snapshot | System | Cron Job chạy lúc 00:00 mỗi ngày để tính toán và chốt sổ dữ liệu thống kê (hoàn thành/trễ hạn) của ngày hôm đó, phục vụ biểu đồ hiệu suất. |
| 29 | `F-BG-03` | Daily Email Digest | System | Trích xuất báo cáo nhanh (các task trễ hạn, hoạt động mới) gửi qua Email (SendGrid/Gmail) tự động vào mỗi buổi sáng. |
| 30 | `F-BG-04` | Cảnh báo Slack Webhooks | System | Quét hệ thống tự động phát sinh tín hiệu qua kênh Slack khi có Task sắp/đã trễ hạn hoặc khởi tạo Phase mới. |
