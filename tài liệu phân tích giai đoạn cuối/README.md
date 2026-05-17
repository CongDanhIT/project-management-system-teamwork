# Tài Liệu Phân Tích Giai Đoạn Cuối - TeamFlow

## 1. Project Title & Description
**TeamFlow** là một hệ thống Quản trị Dự án và Cộng tác Doanh nghiệp (Enterprise Collaboration & Project Management) thế hệ mới. Dự án được xây dựng với mục tiêu giải quyết triệt để sự rời rạc trong quản lý, biến dữ liệu dự án tĩnh thành một dòng chảy thông tin (flow) có khả năng tương tác và tự tối ưu hóa.

### Các trụ cột cốt lõi của hệ thống:

*   **Trí tuệ nhân tạo (AI-First Strategy):** Tích hợp sâu các mô hình ngôn ngữ lớn (LLM) để tự động hóa việc lập kế hoạch dự án (AI Planner), hỗ trợ giải đáp nghiệp vụ thông qua Agent thông minh (AI Agent) và phân tích rủi ro dựa trên dữ liệu lịch sử.
*   **Quản trị đa tầng (Multi-level Governance):** Cấu trúc phân cấp linh hoạt từ **Workspace** (Không gian làm việc cho tổ chức), **Project** (Dự án cụ thể), **Phase** (Giai đoạn chiến lược) đến **Task/Subtask** (Công việc chi tiết).
*   **Cộng tác thời gian thực & Đa kênh:** Hệ thống thông báo thông minh kết hợp giữa **Socket.io** (Real-time), **Slack Integration** (Webhook), **SendGrid** (Email) và **Twilio** (SMS) giúp đội ngũ luôn duy trì sự kết nối liên tục.
*   **Phân tích dữ liệu & Báo cáo chuyên sâu (Advanced Analytics):** Công cụ phân tích mạnh mẽ với khả năng chụp ảnh dữ liệu hàng ngày (Daily Snapshots), tính toán hiệu suất thành viên và xuất báo cáo đa định dạng (Excel/PDF) đạt chuẩn chuyên nghiệp.
*   **Hạ tầng tài nguyên tối ưu:** Quản lý tập tin tập trung thông qua **Cloudflare R2** và xử lý hình ảnh qua **Cloudinary**, đảm bảo tốc độ truy cập và khả năng lưu trữ không giới hạn.

TeamFlow không chỉ là một công cụ, mà là một **Hệ điều hành cho công việc**, giúp các doanh nghiệp chuyển đổi số quy trình quản lý một cách toàn diện và thông minh hơn.

Hệ thống TeamFlow được xây dựng trên nền tảng các công nghệ hiện đại, kết hợp chặt chẽ giữa hiệu năng cao, trải nghiệm người dùng mượt mà và sức mạnh của AI. Dưới đây là kiến trúc công nghệ từ tổng thể đến chi tiết:

### 2.1. Frontend (Giao diện Người dùng)
Được thiết kế theo tiêu chuẩn Single Page Application (SPA) kết hợp Server-Side Rendering để tối ưu SEO và tốc độ tải trang ban đầu.
*   **Core Framework:** `Next.js 16` & `React 19` - Đảm nhiệm routing, render giao diện và tối ưu hóa hiệu suất hiển thị.
*   **Language:** `TypeScript` - Đảm bảo an toàn kiểu dữ liệu (Type-safety) toàn dự án.
*   **Styling & UI Components:**
    *   `Tailwind CSS v4`: Viết CSS theo chuẩn utility-first, giúp phát triển giao diện nhanh và nhất quán.
    *   `Base UI` & `Radix UI`: Cung cấp nền tảng component không định dạng (headless) đạt chuẩn Accessibility (a11y).
    *   `Framer Motion`: Thư viện xử lý các hiệu ứng chuyển động (animations) phức tạp và mượt mà cho UI.
*   **State & Data Management:**
    *   `Zustand`: Quản lý trạng thái toàn cục (Global State) nhẹ nhàng, tránh Prop Drilling.
    *   `TanStack Query (React Query)`: Quản lý, cache và đồng bộ dữ liệu bất đồng bộ (API calls) cực kỳ hiệu quả.
*   **Utilities & Data Visualization:**
    *   `React Hook Form` + `Zod`: Quản lý state của Form và validate dữ liệu chặt chẽ từ phía Client.
    *   `Recharts`: Vẽ các biểu đồ (Dashboard) để trực quan hóa dữ liệu Analytics.
    *   `ExcelJS` & `jsPDF`: Thư viện xử lý xuất báo cáo dữ liệu dạng bảng tính và file PDF.

### 2.2. Backend (Máy chủ & API)
Được thiết kế theo kiến trúc Controller-Service-Model, tập trung vào khả năng xử lý bất đồng bộ, tính toàn vẹn dữ liệu và mở rộng linh hoạt.
*   **Core Framework:** `Node.js` & `Express 5` - Khung máy chủ API RESTful mạnh mẽ, xử lý routing và middleware.
*   **Database & ORM:**
    *   `MongoDB`: Cơ sở dữ liệu NoSQL linh hoạt, phù hợp cho dữ liệu dự án dạng document.
    *   `Mongoose`: Thư viện ODM (Object Data Modeling) giúp định nghĩa Schema, tạo Aggregation pipelines và quản lý Transactions.
*   **Authentication & Security:**
    *   `Passport.js`: Xử lý xác thực người dùng đa luồng (Local Login & Google OAuth).
    *   `Cookie-session`: Quản lý phiên đăng nhập an toàn qua HTTP-only cookies.
*   **Real-time & Communication:**
    *   `Socket.io`: Thiết lập kênh giao tiếp hai chiều, đẩy thông báo (Notification) real-time đến client.
    *   `SendGrid`: Dịch vụ gửi email tự động (Welcome email, Password reset).
    *   `Slack Webhooks`: Gắn kết (Integration) để đẩy log và thông báo dự án vào các kênh Slack của đội nhóm.
*   **Infrastructure & Storage:**
    *   `Cloudflare R2`: Lưu trữ tệp tin (File Storage) chuẩn S3, chi phí tối ưu và truy xuất nhanh.
    *   `Cloudinary`: CDN chuyên biệt quản lý và tối ưu hóa hình ảnh (Avatar, Cover).
*   **Background Jobs:** `node-cron` - Chạy các tiến trình ngầm định kỳ (như Daily Analytics Snapshots hay dọn dẹp dữ liệu rác).

### 2.3. Trí tuệ nhân tạo (AI Ecosystem)
Trái tim tạo nên sự khác biệt của TeamFlow, biến ứng dụng tĩnh thành một trợ lý thông minh.
*   **AI Integration Hub:** `Vercel AI SDK` - Giao diện chuẩn hóa để kết nối hệ thống với nhiều mô hình LLM khác nhau một cách mượt mà và hỗ trợ Streaming data.
*   **LLM Providers (Mô hình Ngôn ngữ):**
    *   `Groq (Llama 3.3 70B)`: Xử lý các tác vụ suy luận nhanh và giao tiếp tự nhiên trong AI Agent.
    *   `NVIDIA (DeepSeek V4)`: Phân tích dữ liệu phức tạp, bóc tách cấu trúc dự án.
*   **AI Tooling:**
    *   `Zod Structured Outputs`: Ép mô hình AI trả về dữ liệu chuẩn định dạng JSON để hệ thống có thể tạo Task/Phase tự động.
    *   `Tool Calling`: Cấp quyền cho AI thực thi các hàm trong hệ thống (như đọc Database, tạo công việc) dựa trên ngữ cảnh hội thoại.

## 3. Hệ Sinh Thái Tính Năng (Feature Ecosystem)
Dưới đây là sơ đồ chi tiết toàn bộ các chức năng của hệ thống. Các chức năng mang tính đột phá và là thế mạnh cốt lõi (Key Features) của TeamFlow được đánh dấu bằng biểu tượng 🌟.

### 3.1. 🌟 Trợ lý Trí tuệ Nhân tạo (AI-Powered Workflow) - *Key Feature*
Biến hệ thống từ một công cụ lưu trữ tĩnh thành một "Trợ lý Quản trị" chủ động.
*   **AI Project Planner (Người lập kế hoạch AI):** Tự động phân tích yêu cầu bằng ngôn ngữ tự nhiên, từ đó sinh ra toàn bộ cấu trúc Project (gồm Phases, Tasks, Subtasks) chỉ trong vài giây.
*   **TeamFlow Smart Agent (Chatbot Tương tác):** Agentic Chatbot có khả năng trò chuyện và hiểu ngữ cảnh công việc hiện tại. Thông qua cơ chế **Tool Calling**, Agent có thể trực tiếp thực thi các lệnh như: Tạo Task mới, tra cứu thông tin thành viên, hay tóm tắt tiến độ dự án ngay trong khung chat.
*   **Smart Insights & Risk Detection:** AI tự động quét lịch sử hoạt động (Activity logs) và các cột mốc deadline để phát hiện các "nút thắt cổ chai" (Bottlenecks) và đưa ra cảnh báo rủi ro sớm cho Quản lý.

### 3.2. 🌟 Analytics & Reporting (Phân tích & Báo cáo Chuyên sâu) - *Key Feature*
Không chỉ quản lý, hệ thống cung cấp góc nhìn vĩ mô cho cấp quản lý (Executive Level).
*   **Executive Dashboard (Bảng điều khiển Tổng quan):** Trực quan hóa dữ liệu bằng biểu đồ động về khối lượng công việc, tỷ lệ hoàn thành, và phân bổ nguồn lực. Lọc dữ liệu linh hoạt theo mốc thời gian (This Week, This Month, All-time).
*   **Daily Analytics Snapshots:** Chạy ngầm (Cron Job) để tự động "chụp ảnh" dữ liệu dự án mỗi ngày. Điều này giúp hệ thống lưu trữ được lịch sử để vẽ biểu đồ xu hướng (Trendlines) mà không tốn chi phí query Database nặng nề.
*   **Member Performance (Đo lường Hiệu suất):** Phân tích chi tiết khối lượng công việc, công việc tồn đọng và độ trễ deadline của từng cá nhân.
*   **Export Báo cáo Chuyên nghiệp:** Xuất toàn bộ dữ liệu dự án ra file Excel với định dạng chuẩn (Có AutoFilter, chia sheet thông minh) hoặc bản in PDF.

### 3.3. Quản lý Đa tầng (Multi-level Management)
Số hóa quy trình làm việc từ cấp độ công ty xuống đến từng cá nhân.
*   🌟 **Tổ chức Workspace (Không gian làm việc chung):** Quản lý không gian riêng biệt cho từng tổ chức/phòng ban. Tích hợp phân quyền (RBAC) cực kỳ chặt chẽ (OWNER, ADMIN, MEMBER). Mời thành viên mới tham gia bằng mã (Invite Code) tiện lợi.
*   **Quản lý Dự án (Project Lifecycle):** Quản lý vòng đời dự án từ lúc khởi tạo đến khi kết thúc. Phân rã dự án thành các Giai đoạn (Phases) để dễ kiểm soát tiến độ vĩ mô.
*   **Quản lý Công việc (Task & Subtask):** Đơn vị làm việc nhỏ nhất với đầy đủ thông tin: Người chịu trách nhiệm (Assignee), Trạng thái Kanban (Todo, In Progress, Review, Done), Mức độ ưu tiên và Deadline.
*   **Trực quan hóa Tiến độ (Gantt Chart & Kanban):** Cung cấp đa góc nhìn, nổi bật là **Sơ đồ Gantt (Gantt Chart)** giúp Quản lý dễ dàng theo dõi dòng thời gian (timeline) dự án và sự phụ thuộc giữa các công việc.
*   **Quản lý Tài liệu Tập trung (File Storage Structure):** Cơ chế lưu trữ khoa học. Người dùng có thể đính kèm file (lưu trữ tại Cloudflare R2) vào từng Task nhỏ, đồng thời hệ thống cung cấp riêng một **Tab "Tài liệu"** tổng hợp trong mỗi Dự án để quản lý tập trung và tìm kiếm nhanh toàn bộ file đã tải lên.

### 3.4. Giao tiếp & Cộng tác (Communication & Collaboration)
Đảm bảo thông tin luôn thông suốt và đồng bộ cho mọi người.
*   🌟 **Hệ thống Thông báo Thời gian thực (Real-time Hub):** Đẩy thông báo ngay lập tức qua Socket.io khi có sự kiện (như @mention, giao việc, đổi trạng thái) mà không cần tải lại trang.
*   **Bản tin Công việc qua Email (Daily Email Digest):** Tích hợp SendGrid để tự động gửi email tổng hợp hàng ngày. Cung cấp cho từng cá nhân bức tranh toàn cảnh về các công việc cần làm trong ngày, các task sắp đến hạn và những cập nhật quan trọng liên quan đến họ.
*   **Bảng tin Dự án (Announcements):** Tính năng "Bảng thông báo" nội bộ giúp Quản lý truyền đạt thông tin khẩn/quan trọng đến toàn bộ người tham gia dự án.
*   **Thảo luận Nội bộ (Task Comments):** Kênh giao tiếp, bình luận và phản hồi trực tiếp bên trong từng Task, giúp lưu vết quyết định rõ ràng.

### 3.5. 🌟 Hệ sinh thái Tích hợp Slack (Slack Integration Ecosystem) - *Key Feature*
Biến Slack thành một trạm quan sát phụ, giúp đội nhóm nắm bắt thông tin mà không cần rời khỏi môi trường giao tiếp quen thuộc.
*   **Cấu hình Webhook Đa cấp (Dynamic Webhook Discovery):** Cho phép thiết lập Webhook ở mức Workspace (áp dụng cho toàn công ty) hoặc thiết lập riêng ở mức Project (áp dụng cho dự án cụ thể) để định tuyến thông báo chính xác vào từng kênh Slack.
*   **Theo dõi Sự kiện Tự động (Event Dispatching):** Hệ thống `external.listener` tự động lắng nghe các sự kiện quan trọng như: Hoàn thành Task, Tạo Giai đoạn mới (Phase), Đăng Bảng tin (Announcements) và tự động "bắn" thông báo sang Slack với định dạng trực quan.
*   **Đồng bộ Hóa Thông tin (Team Alignment):** Giúp toàn bộ thành viên trong dự án liên tục cập nhật được dòng chảy công việc (flow) ngay cả khi họ không trực tiếp mở ứng dụng TeamFlow.

### 3.6. Hệ thống Cốt lõi & Cá nhân hóa (Core & Personalization)
Trải nghiệm người dùng mượt mà và bảo mật.
*   **Xác thực Đa kênh:** Đăng nhập an toàn qua hệ thống Local (Mã hóa Bcrypt) hoặc Đăng nhập nhanh một chạm qua Google (OAuth 2.0).
*   **Thiết kế Cao cấp (Obsidian Meridian):** Giao diện tập trung, sang trọng, hỗ trợ chuyển đổi linh hoạt giữa chế độ Sáng/Tối (Light/Dark mode) mượt mà.
*   **Global Search (Command K):** Công cụ tìm kiếm toàn cục, cho phép tra cứu nhanh mọi Task, Project, hay thông tin Member ở bất cứ đâu trên hệ thống.

### 3.7. 🌟 Bảo mật & Toàn vẹn Dữ liệu (Data Integrity & Background Services) - *Key Feature*
Hệ thống ngầm (Under the hood) đảm bảo an toàn dữ liệu và tối ưu hóa hiệu suất lâu dài.
*   **Cơ chế Xóa mềm (Soft Delete):** Áp dụng cho các thực thể quan trọng (Workspace, Project, Task). Dữ liệu không bị xóa vĩnh viễn khỏi Database ngay lập tức mà chỉ bị ẩn đi, giúp bảo vệ hệ thống khỏi các thao tác xóa nhầm (Human errors) và hỗ trợ khôi phục khi cần thiết.
*   **Lịch sử Hành vi (Audit Trail / Activity Logs):** Ghi log cực kỳ chi tiết mọi thao tác của người dùng (Ai đã tạo/sửa/xóa nội dung gì, thay đổi trạng thái nào, vào lúc nào). Dữ liệu này vô cùng quan trọng cho việc truy vết trách nhiệm (Traceability) và cung cấp nguyên liệu cho AI phân tích rủi ro.
*   **Nhóm Module Cron Jobs (Tiến trình ngầm):** Đảm nhiệm việc tự động hóa các tác vụ bảo trì hệ thống. Chịu trách nhiệm dọn dẹp dữ liệu mồ côi (Orphan cleanup sau khi Hard Delete), tổng hợp dữ liệu Snapshot vào cuối ngày và kích hoạt các kịch bản báo cáo định kỳ.

## 4. Installation/Getting Started
*(Cách khởi chạy và sử dụng dự án - Sẽ bổ sung nội dung phân tích tại đây)*

## 5. Project Structure

Dự án áp dụng kiến trúc tách biệt Frontend và Backend rõ ràng, tối ưu cho việc bảo trì và mở rộng ở quy mô Enterprise.

### 5.1. Backend (Kiến trúc MVC Mở rộng & Event-Driven)
Được viết bằng Node.js + Express, quản lý luồng dữ liệu chặt chẽ từ khi tiếp nhận Request cho đến khi lưu vào Database.

```text
backend/src/
├── controllers/    # Tiếp nhận HTTP Request, xử lý Response và điều phối luồng dữ liệu.
├── services/       # "Trái tim" logic. Chứa Business Logic cốt lõi, xử lý Transaction, tương tác với AI SDK.
├── models/         # Định nghĩa Mongoose Schemas, cấu trúc DB và các ràng buộc dữ liệu (Schema validation).
├── routes/         # Khai báo các API Endpoints và liên kết chúng với Controller tương ứng.
├── middlewares/    # Lớp khiên bảo vệ: Xác thực (Auth JWT), phân quyền (RBAC), và xử lý lỗi (Error Handler).
├── events/         # Định nghĩa các sự kiện (Events) phát sinh trong hệ thống.
├── listeners/      # Xử lý Event-driven (vd: Lắng nghe sự kiện để bắn Webhook sang Slack hoặc thông báo Real-time).
├── jobs/           # Khai báo các tiến trình chạy ngầm (Cron Jobs) như Analytics Snapshots, Orphan Cleanup.
├── validation/     # Schema kiểm tra tính hợp lệ của dữ liệu đầu vào (Input Validation) bằng thư viện Zod/Joi.
├── config/         # Cấu hình môi trường, khởi tạo kết nối Database (MongoDB) và các dịch vụ bên thứ 3.
├── utils/          # Các hàm tiện ích dùng chung (Logger, Error Classes, Helper functions).
└── mytest/         # Không gian Sandbox để chạy các file test thủ công (ts-node) cho các logic riêng lẻ.
```

### 5.2. Frontend (Next.js App Router & Atomic Design)
Xây dựng trên nền tảng Next.js (App Router), kết hợp hoàn hảo giữa Server Components (SEO, tốc độ) và Client Components (Tương tác UI).

```text
frontend/src/
├── app/            # Cấu trúc Routing cốt lõi của Next.js (Chứa các Pages, Layouts của Dashboard, Workspace...).
├── components/     # Tập hợp các UI Components dùng chung, tuân thủ nghiêm ngặt Design System (Obsidian Meridian).
├── stores/         # Quản lý Global State của ứng dụng (sử dụng Zustand) cho User Session, Theme...
├── hooks/          # Custom React Hooks, nơi tập trung các logic gọi API kết hợp TanStack Query (useQuery, useMutation).
├── services/       # Định nghĩa các hàm gọi API (Axios), giao tiếp trực tiếp với Backend.
├── providers/      # Các Context Providers bao bọc ứng dụng (AuthProvider, SocketProvider, ThemeProvider).
├── lib/            # Chứa code khởi tạo hoặc bọc (wrapper) các thư viện bên thứ 3 (vd: utils.ts của shadcn/ui).
├── types/          # Định nghĩa toàn bộ TypeScript Interfaces và Types giúp Frontend type-safe 100%.
├── utils/          # Các hàm tính toán, format định dạng hiển thị (Date, Currency) không dính líu tới React.
└── middleware.ts   # Middleware ở môi trường Edge của Next.js, xử lý chặn/bảo vệ Route trước khi Render.
```

## 6. API Documentation

Hệ thống cung cấp một tập hợp các RESTful APIs phong phú, phân quyền chặt chẽ. Dưới đây là danh sách toàn bộ các Endpoint được phân chia theo từng Module. Các API cốt lõi mang tính chất "linh hồn" của hệ thống sẽ được đánh dấu 🌟 và đặc tả chi tiết.

*Lưu ý: Hầu hết các API (trừ Auth) đều yêu cầu Header `Authorization: Bearer <Token>`.*

### 6.1. Module Xác thực & Người dùng (Auth & User)
Quản lý định danh và hồ sơ người dùng.
*   `POST /api/auth/register` - Đăng ký tài khoản mới bằng Email/Password.
*   `POST /api/auth/login` - Đăng nhập, trả về Access Token.
*   `POST /api/auth/logout` - Đăng xuất và xóa Session/Cookie.
*   `GET /api/auth/google` - Khởi tạo luồng đăng nhập một chạm qua Google OAuth 2.0.
*   `GET /api/auth/google/callback` - Endpoint nhận Callback từ Google sau khi User xác thực thành công.
*   `GET /api/user/current` - Lấy thông tin Profile của User đang đăng nhập.
*   `PUT /api/user/profile` - Cập nhật thông tin cá nhân.
*   `POST /api/user/upload-avatar` - Upload ảnh đại diện.
*   `PUT /api/user/change-password` - Thay đổi mật khẩu người dùng.
*   `POST /api/user/inbox-token/reset` - Tạo lại Token hòm thư (Dùng cho tính năng gửi Email vào Inbox dự án).

### 6.2. Module Không gian làm việc (Workspace)
Quản lý mức vĩ mô cao nhất của tổ chức và phân quyền.
*   🌟 **`POST /api/workspace/create/new` - Tạo Workspace mới.**
    *   *Mô tả:* Khởi tạo không gian làm việc cho một team.
    *   *Client gửi:* `{ name: string, description?: string }`
    *   *Server trả về:* `Workspace Object` chứa ID và mặc định gán User tạo làm `OWNER`.
*   `GET /api/workspace/all` - Lấy danh sách các Workspace mà User là thành viên.
*   `GET /api/workspace/:id` - Lấy chi tiết thông tin một Workspace cụ thể.
*   `GET /api/workspace/member/:id` - Lấy danh sách thành viên trong Workspace.
*   🌟 **`PUT /api/workspace/change/member/role/:id` - Đổi quyền thành viên.**
    *   *Mô tả:* Chủ không gian làm việc cấp hoặc hạ quyền (Admin/Member/Viewer) cho người khác.
    *   *Client gửi:* `{ memberId: string, roleId: string }`
    *   *Server trả về:* Thông báo thành công và cập nhật quyền (RBAC) ngay lập tức.
*   `DELETE /api/workspace/delete/:id` - Xóa mềm (Soft delete) Workspace.

### 6.3. Module Quản lý Dự án & Giai đoạn (Project & Phase)
Tổ chức các dự án con bên trong Workspace.
*   🌟 **`POST /api/project/workspace/:workspaceId/create` - Khởi tạo dự án mới.**
    *   *Mô tả:* Tạo một dự án mới và cấp quyền mặc định.
    *   *Client gửi:* `{ name: string, description: string, emoji: string }`
    *   *Server trả về:* `Project Object` đã được liên kết chuẩn xác với Workspace.
*   `GET /api/project/workspace/:workspaceId/all` - Lấy danh sách tất cả dự án.
*   `GET /api/project/workspace/:workspaceId/:projectId` - Lấy chi tiết dự án.
*   `DELETE /api/project/workspace/:workspaceId/delete/:projectId` - Xóa mềm dự án.
*   `POST /api/phase/workspace/:workspaceId/project/:projectId/create` - Tạo Phase (Giai đoạn/Cột Kanban) mới.
*   `GET /api/phase/workspace/:workspaceId/project/:projectId/all` - Lấy danh sách Phase để dựng bảng Kanban.

### 6.4. Module Quản lý Công việc (Task)
"Trái tim" của các hoạt động hàng ngày.
*   🌟 **`POST /api/task/workspace/:workspaceId/project/:projectId/create` - Tạo Task mới.**
    *   *Mô tả:* Tạo công việc. API này đồng thời kích hoạt luồng bắn sự kiện Socket (Thông báo) và ghi log Activity.
    *   *Client gửi:* `{ title: string, priority: string, status: string, assignedTo?: string, dueDate?: Date, phaseId?: string, ... }`
    *   *Server trả về:* `Task Object` hoàn chỉnh (gồm cả ID người tạo).
*   🌟 **`PUT /api/task/workspace/:workspaceId/project/:projectId/update/:taskId` - Cập nhật Task.**
    *   *Mô tả:* Dùng cho mọi thao tác: Kéo thả Kanban (đổi Phase), Đổi trạng thái, Giao việc.
    *   *Client gửi:* Chứa các trường cần update (Partial Update).
    *   *Server trả về:* `Task Object` sau update, kèm tín hiệu Socket báo Real-time cho người liên quan.
*   `GET /api/task/workspace/:workspaceId/project/:projectId/all` - Lấy tất cả Task của Dự án (Phục vụ vẽ Gantt/Kanban).
*   `GET /api/task/workspace/:workspaceId/subtasks/:parentId` - Lấy danh sách Subtask của một Task cha.
*   `DELETE /api/task/workspace/:workspaceId/delete/:taskId` - Xóa mềm Task.

### 6.5. Module Ý tưởng & Hộp thư đến (Inbox/Drafts)
Nơi chứa các ý tưởng vụn vặt trước khi chuyển thành Task chính thức.
*   `POST /api/inbox` - Tạo một Draft (Bản nháp) mới.
*   `GET /api/inbox` - Lấy danh sách Drafts cá nhân.
*   🌟 **`POST /api/inbox/:inboxId/promote` - Chuyển Nháp thành Task.**
    *   *Mô tả:* "Nâng cấp" (Promote) một ý tưởng thành một Task chính thức và đưa vào Dự án cụ thể.

### 6.6. Module Bảng tin & Tương tác (Announcements & Interactions)
Hệ thống giao tiếp nội bộ và bình luận.
*   🌟 **`POST /api/announcement` - Đăng bảng tin dự án.**
    *   *Mô tả:* Quản lý đăng thông báo quan trọng đến toàn bộ thành viên dự án, trigger gửi email và Slack.
*   `GET /api/announcement` - Lấy danh sách bảng tin.
*   `POST /api/interaction` - Thêm bình luận (Comment) hoặc thả cảm xúc (Reaction) vào Task/Announcement.
*   `DELETE /api/interaction/:id` - Xóa bình luận.

### 6.7. Module Phân loại (Tags Management)
*   `POST /api/tag` - Tạo nhãn dán (Tag) màu sắc dùng chung.
*   `GET /api/tag` - Lấy danh sách Tags.

### 6.8. Module Trí tuệ Nhân tạo (AI Core)
Giao tiếp với Vercel AI SDK và LLMs.
*   🌟 **`POST /api/ai-v2/workspace/:workspaceId/chat` - Gọi Smart Agent Chatbot.**
    *   *Mô tả:* Gửi câu hỏi của User cho Bot. Bot có thể gọi Tool (ví dụ: Tạo Task, Tìm người) trực tiếp.
    *   *Client gửi:* `{ messages: Array, projectId?: string }`
    *   *Server trả về:* Data stream (Dùng cơ chế Server-Sent Events - SSE để chữ hiện ra từ từ như ChatGPT).
*   🌟 **`POST /api/ai/workspace/:workspaceId/project/:projectId/generate-planner` - AI Lập kế hoạch.**
    *   *Mô tả:* AI tự động sinh ra cấu trúc Phases và Tasks dựa trên 1 câu prompt.
    *   *Client gửi:* `{ prompt: string }`
    *   *Server trả về:* Cấu trúc JSON chứa mảng `phases` và `tasks` đã được validate qua thư viện Zod.

### 6.9. Module Analytics & Activity (Thống kê & Lịch sử)
Phục vụ báo cáo và giám sát.
*   🌟 **`GET /api/analytics/workspace/:workspaceId/overview` - Dashboard vĩ mô.**
    *   *Mô tả:* Lấy dữ liệu cho bảng điều khiển trung tâm (Executive Dashboard).
    *   *Params:* `?startDate=...&endDate=...&userId=...`
    *   *Server trả về:* Khối lượng công việc, biểu đồ Pulse Chart, KPI của Member.
*   `GET /api/analytics/workspace/:workspaceId/history` - Lấy dữ liệu Snapshot (Cron Job đã thu thập).
*   `GET /api/activity/workspace/:workspaceId/all` - Lấy nhật ký hệ thống (Audit Trail) để xem ai vừa làm gì.


### 6.10. Module Tích hợp & Tài nguyên (Slack & Uploads)
*   🌟 **`POST /api/upload/document/presign` - Khởi tạo Pre-signed URL.**
    *   *Mô tả:* Giúp Client upload file trực tiếp lên Cloudflare R2 (Bypass Server để giảm tải).
    *   *Client gửi:* `{ fileName: string, fileType: string, fileSize: number }`
    *   *Server trả về:* Một URL tạm thời (Presigned URL) cho phép Client PUT file trực tiếp lên R2.
*   `POST /api/webhook/slack` - Endpoint nhận tín hiệu để Event Listener bắn thông báo ra kênh Slack của khách hàng.
*   `GET /api/asset/workspace/:workspaceId/all` - Lấy danh sách toàn bộ file đính kèm trong Tab "Tài liệu".

---
*Tài liệu này đang trong quá trình phân tích và hoàn thiện.*
