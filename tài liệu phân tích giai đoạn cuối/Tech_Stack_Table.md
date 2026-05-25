# BẢNG CÔNG NGHỆ SỬ DỤNG (TECH STACK) - DỰ ÁN TEAMFLOW

Dưới đây là danh sách chi tiết các công nghệ, framework và thư viện được sử dụng trong dự án **TeamFlow**, phân chia theo hai thành phần chính: Backend (Express) và Frontend (Next.js).

---

## 1. Backend Technology Stack (Express App)

Backend được xây dựng bằng **Node.js** và **Express 5** với ngôn ngữ **TypeScript**, quản lý dữ liệu qua **MongoDB Atlas (Mongoose)** và sử dụng kiến trúc stateless session.

| Tên công nghệ / Thư viện | Phiên bản | Vai trò / Mục đích sử dụng trong hệ thống |
| :--- | :--- | :--- |
| **Node.js** | LTS | Môi trường chạy mã nguồn Javascript ngoài trình duyệt (Runtime environment). |
| **Express** | `^5.2.1` | Web Framework chính để xây dựng hệ thống RESTful API và quản lý middleware. |
| **TypeScript** | `^5.9.3` | Ngôn ngữ lập trình chính, cung cấp kiểu dữ liệu tĩnh (static typing) giúp tăng độ an toàn của code. |
| **Mongoose** | `^9.2.0` | Thư viện ODM (Object Data Modeling) kết nối và thao tác với MongoDB Atlas. |
| **cookie-session** | `^2.1.1` | Quản lý phiên đăng nhập stateless bằng cách mã hóa dữ liệu user và lưu trực tiếp vào Cookie ở Client. |
| **passport** | `^0.7.0` | Middleware hỗ trợ xác thực tài khoản (Authentication) linh hoạt. |
| **passport-local** | `^1.0.0` | Chiến lược (Strategy) xác thực bằng email và mật khẩu truyền thống. |
| **passport-google-oauth20** | `^2.0.0` | Chiến lược xác thực thông qua tài khoản Google OAuth 2.0. |
| **bcrypt** | `^6.0.0` | Mã hóa một chiều (hashing) mật khẩu người dùng bằng thuật toán bcrypt an toàn. |
| **socket.io** | `^4.8.3` | Hỗ trợ truyền thông hai chiều thời gian thực (Real-time WebSockets), dùng cho Notification và Chat. |
| **ai** | `^4.1.0` | Vercel AI SDK Core, tích hợp và tương tác trực tiếp với các mô hình ngôn ngữ lớn (LLM). |
| **@ai-sdk/google** | `^3.0.67` | AI SDK Provider cho Google Gemini (sử dụng model Gemini 1.5 Pro / Flash cho AI Project Planner). |
| **@ai-sdk/groq** | `^1.1.0` | AI SDK Provider cho Groq (sử dụng cho các tác vụ AI cần phản hồi tức thời). |
| **@ai-sdk/openai** | `^3.0.58` | AI SDK Provider cho OpenAI (dùng làm phương án dự phòng hoặc phân tích chuyên sâu). |
| **@aws-sdk/client-s3** | `^3.1034.0` | Bộ công cụ AWS SDK kết nối với Cloudflare R2 thông qua giao thức tương thích S3. |
| **@aws-sdk/s3-request-presigner** | `^3.1034.0` | Tạo Presigned URL (PUT / GET) để Client tải file trực tiếp lên/xuống từ Cloudflare R2. |
| **@sendgrid/mail** | `^8.1.6` | Dịch vụ gửi email tự động (Daily Digest, mời thành viên, cảnh báo). |
| **node-cron** | `^4.2.1` | Lập lịch chạy các tác vụ định kỳ (Cron Jobs) như gửi email 07:00, dọn file rác, gửi báo cáo Slack. |
| **zod** | `^4.4.2` | Định nghĩa schema và validate dữ liệu đầu vào (Request validation) ở tầng API. |
| **winston** | `^3.19.0` | Thư viện quản lý logs chuyên nghiệp (Error, Warn, Info, Debug) thay cho console.log. |
| **exceljs** | `^4.4.0` | Tạo và định dạng các file báo cáo Excel tự động xuất từ dữ liệu dự án. |
| **uuid** | `^13.0.0` | Tạo mã định danh duy nhất (UUID v4) cho tệp tin và token giao dịch. |

---

## 2. Frontend Technology Stack (Next.js Client)

Frontend được phát triển bằng **Next.js 16 (App Router)** và **React 19**, mang lại trải nghiệm tối ưu về SEO, Server-side Rendering (SSR) và giao diện người dùng tương tác cao.

| Tên công nghệ / Thư viện | Phiên bản | Vai trò / Mục đích sử dụng trong hệ thống |
| :--- | :--- | :--- |
| **Next.js** | `16.1.6` | React Framework hỗ trợ Routing (App Router), SSR, Optimization và API Routes. |
| **React** | `19.2.3` | Thư viện cốt lõi để xây dựng giao diện người dùng dựa trên Component. |
| **TailwindCSS** | `^4` | Utility-first CSS framework thiết kế giao diện nhanh, responsive và nhất quán. |
| **zustand** | `^5.0.12` | Thư viện quản lý Global State cực kỳ gọn nhẹ và hiệu năng cao. |
| **@tanstack/react-query** | `^5.90.21` | Quản lý state bất đồng bộ, caching, đồng bộ và fetch dữ liệu từ Backend API. |
| **socket.io-client** | `^4.8.3` | Client-side Socket kết nối liên tục với Express server để nhận sự kiện thời gian thực. |
| **framer-motion** | `^12.38.0` | Thư viện tạo các animation mượt mà, micro-interactions cho các nút, modal và card. |
| **@dnd-kit/core** & **@dnd-kit/sortable** | `^6.3.1` / `^10.0.0` | Xử lý kéo thả (Drag and Drop) linh hoạt cho bảng công việc Kanban. |
| **recharts** | `^3.8.0` | Thư viện vẽ biểu đồ trực quan hóa dữ liệu hiệu suất, tiến độ dự án. |
| **shadcn** / **@radix-ui/*** | `^4.1.0` | Bộ thư viện UI component chất lượng cao, dễ tùy biến và tuân thủ các chuẩn Accessibility. |
| **react-hook-form** | `^7.71.2` | Quản lý trạng thái form, xử lý submit và validation dữ liệu phía Client. |
| **zod** | `^4.3.6` | Đồng bộ validation schema với Backend, kiểm tra tính hợp lệ của dữ liệu trước khi gửi đi. |
| **lucide-react** & **@tabler/icons-react** | `^0.577.0` / `^3.40.0` | Bộ icon SVG hiện đại dùng cho giao diện. |
| **jspdf** & **html2canvas** | `^4.2.1` / `^1.4.1` | Hỗ trợ chụp màn hình component và xuất báo cáo trực tiếp ra định dạng PDF. |
| **xlsx** & **exceljs** | `^0.18.5` / `^4.4.0` | Đọc và ghi dữ liệu trực tiếp ra tệp tin bảng tính Excel ở phía client. |
| **lenis** | `^1.3.23` | Tạo hiệu ứng mượt mà khi cuộn trang (Smooth scrolling). |
| **sonner** | `^2.0.7` | Hiển thị các thông báo popup (Toast notifications) bắt mắt và tiện lợi. |
