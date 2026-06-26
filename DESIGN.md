# Hệ thống Thiết kế TeamFlow (Editorial Tech)

Tài liệu này là "nguồn sự thật" (Source of Truth) cho tất cả các quy chuẩn thiết kế và UI/UX của dự án TeamFlow.

## 1. Thành phần Nhận diện (Brand Elements)

### 1.1. User Avatar (Đồng nhất)
Tất cả các ảnh đại diện người dùng phải sử dụng component `UserAvatar` để đảm bảo tính nhất quán.
- **Quy chuẩn Fallback:** Khi không có ảnh đại diện, sử dụng **Teal Gradient**.
- **Màu sắc:** `bg-gradient-to-br from-brand-primary/10 to-slate-50`
- **Typography:** Font black, chữ in hoa, màu `text-brand-primary`.
- **Hình dáng:** Bo góc `rounded-2xl` (mặc định) hoặc `rounded-3xl` (cho profile).
- **Border:** `border border-brand-primary/5`.

## 2. Elevation & Depth (Độ sâu & Bóng đổ)

### 2.1. Bóng tách rời (Detached Shadow - V6)
Đây là hiệu ứng đặc trưng tạo cảm giác vật thể đang bay lơ lửng bằng cách tách bóng đổ khỏi chân vật thể.

- **Cấu trúc:** Gồm vật thể chính (bay) và một phần tử bóng đổ độc lập bên dưới.
- **Vật thể chính:** Sử dụng `transition-all duration-500 hover:-translate-y-2`.
- **Phần tử bóng đổ:** 
  - Vị trí: `absolute bottom-2` (hoặc vị trí phù hợp tùy kích thước).
  - Hình dáng: `rounded-[50%]`.
  - Màu sắc: `bg-black/30` (Light mode) hoặc `bg-black/60` (Dark mode).
  - Blur: `blur-[4px]`.
  - Hiệu ứng Hover: `group-hover:scale-90 group-hover:opacity-60`.

### 2.2. Bóng Neumorphic (Soft UI - Dashboard Stats)
Áp dụng cho các thẻ thống kê chính tại Dashboard để tạo hiệu ứng vật liệu đúc (extrusion).
- **Nguyên tắc:** Sử dụng hệ bóng đặc (Enhanced Shadows) kết hợp với Gradient hướng tâm (145deg) để mô phỏng nguồn sáng thực tế. Điều này tạo độ nổi (Elevation) mà vẫn giữ được sự tinh khiết của màu sắc.
- **Shadow:** `6px 6px 18px rgba(0, 0, 0, 0.05), 15px 15px 35px rgba(3, 93, 91, 0.1), -12px -12px 30px rgba(255, 255, 255, 1)`
- **Vật liệu:** `bg-gradient-to-br from-white to-[#F8FAFC]` để tạo chiều sâu cho bề mặt thẻ.

### 2.3. Triết lý Tinted Glass (Ánh sáng môi trường & Kính mờ)
Đây là kỹ thuật chủ đạo để đưa màu sắc thương hiệu (Brand Colors) vào UI một cách tinh tế mà không làm UI bị gắt (Clinical to Premium transition).
- **Lớp đáy (Ambient Background):** Tuyệt đối không dùng nền trắng phẳng hay xám đặc. Sử dụng các **Quầng sáng môi trường (Glow Orbs)** khổng lồ, mờ ảo (opacity 5-10%) đặt chìm dưới đáy màn hình (ví dụ: Teal ở góc trên, Lime ở góc dưới).
- **Lớp giữa (Glassmorphism):** Các cấu trúc chứa nội dung lớn (Sidebar, Bảng Kanban, Dashboard Cards) phải sử dụng vật liệu kính mờ (`bg-white/70` hoặc `bg-white/80` kết hợp `backdrop-blur-xl`). Điều này cho phép ánh sáng môi trường từ lớp đáy "thấm" (bleed) xuyên qua, tạo ra một không gian đa tầng (Multi-layered UI).
- **Lớp trên cùng (Vibrant Accents):** Các nút bấm chính (Primary Action) và trạng thái Active phải dùng màu đặc (Solid) kết hợp đổ bóng phát sáng cùng màu (Glow/Colored Shadow) thay vì đổ bóng đen thông thường.

## 3. Typography & Spacing

### 3.1. Dashboard Layout
- **Hệ lưới (Grid):** Sử dụng hệ lưới linh hoạt với các thẻ (Cards) bo góc lớn (`rounded-[42px]`).
- **Khoảng cách:** Giãn cách dòng phần Đội ngũ là `gap-y-8` để đảm bảo bố cục chặt chẽ nhưng vẫn thoáng đãng.
- **Glassmorphism:** Sử dụng `backdrop-blur-xl` kết hợp với border mờ `border-white/10`.

## 4. Component Standards

### 4.1. Project Card
- **Tiêu đề (Card Title):** Sử dụng màu `#a2ff00` (Neon Lime), font black, in hoa, và `tracking-tighter` để tạo cảm giác công nghệ mạnh mẽ.
- **Hover Glow:** Hiệu ứng quầng sáng đa lớp màu Lime (`#a2ff00`) phối hợp với border cùng màu (giảm opacity).

## 5. Modal & Form Architecture (Editorial Tech)

### 5.1. Tonal Layering
- **Left Column (Editing Zone):** Sử dụng màu nền Editorial Ghost Solid (`bg-[#F8FAFC]`) để đảm bảo hiệu suất cuộn (Scroll Performance) và tránh hiện tượng rung lắc (Jitter). Tránh dùng độ trong suốt (opacity) trên các vùng cuộn lớn.
- **Section Headers:** Phải có một thanh dọc Neon Lime (`#a2ff00`) rộng 2px ở bên trái tiêu đề để dẫn dắt thị giác.
- **Input Containers:** Sử dụng Level 2 Elevation (`shadow-depth-2`) trên nền trắng tinh (`bg-white`) để tạo hiệu ứng "floating" cao cấp.

### 5.3. Performance & Stability (Hạ tầng Hiệu năng)
- **Vùng cuộn (Scrollable Areas):**
  - Sử dụng Solid Background (#F8FAFC, #FFFFFF) thay vì độ trong suốt cho các vùng cuộn lớn để tránh lag GPU.
  - Sử dụng `contain: paint` và `isolation: isolate` trên các container cột chính để cô lập quá trình vẽ lại (repaint).
  - **TUYỆT ĐỐI KHÔNG** đặt `transition` lên `Viewport` của ScrollArea hoặc các container trực tiếp chứa nội dung cuộn.
- **Tương tác Nổi (Floating UI):**
  - Khi cuộn vùng nội dung chính, phải đóng ngay lập tức các Menu, Select, Popover đang mở để tránh hiện tượng trễ vị trí (Jitter desync).
- **GPU Acceleration:**
  - Hạn chế lạm dụng `transform-gpu` trên toàn bộ modal. Chỉ sử dụng cho các phần tử animation đơn lẻ. Ưu tiên `will-change: scroll-position` cho vùng cuộn.

## 6. Kinetic Loaders (Chuyển động Động lực học)
Dự án sử dụng chuyển động Kinetic để tạo cảm giác sống động và hiệu quả.
- **Brand Loader:** Một khối lập phương nhảy (`loader-jump`) kết hợp với bóng đổ co giãn. 
  - **Ý nghĩa:** Tượng trưng cho sự bền bỉ và nhịp độ công việc ổn định.
  - **Màu sắc:** Primary Teal (#035D5B) trong Light Mode và Neon Lime (#C7F964) trong Dark Mode.
  - **Kỹ thuật:** Sử dụng CSS Animation thuần túy để tối ưu hiệu năng.

## 7. Hệ thống Báo cáo Thông minh (Reporting Design System)
Để đảm bảo tính nhất quán giữa ứng dụng và tài liệu xuất bản, hệ thống báo cáo (Word/PDF) tuân thủ các quy tắc sau:

### 7.1. Nhận diện Thương hiệu (Branding)
- **Logo Text:** Sử dụng "TEAMFLOW" in hoa, font Inter/Calibri Bold, khoảng cách ký tự (character spacing) là 40-50 để tạo cảm giác sang trọng.
- **Watermark:** Mọi báo cáo AI phải có dòng xác nhận "TeamFlow Intelligence Report" ở Footer kèm timestamp.

### 7.2. Bảng màu & Phân cấp (Color & Hierarchy)
- **Accent:** Primary Teal (#0D9488) dùng cho Số thứ tự mục (ví dụ: 01, 02) và các đường kẻ phân cách (Borders).
- **Typography:** 
  - Tiêu đề mục: Size 14pt, Bold, màu Deep Slate (#0F172A).
  - Nội dung chính: Size 11pt, màu Deep Slate, Line spacing 1.5.
  - Thông tin bổ trợ: Size 9pt, màu Slate Gray (#64748B), Italics.

### 7.3. Cấu trúc Tài liệu (Structure Patterns)
- **Metadata Box:** Thông tin dự án/người xuất được trình bày trong bảng có shading nhẹ (#F8FAFC) và Border trái 3pt màu Teal.
- **Action Cards:** Các khuyến nghị từ AI được bọc trong vùng shading #F1F5F9 để phân biệt với phần phân tích dữ liệu thô.
- **Phân trang:** Tiêu đề lớn luôn bắt đầu ở trang mới nếu không đủ 30% diện tích trang hiện tại.

---
*Tài liệu này được cập nhật tự động bởi Antigravity dựa trên các quyết định thiết kế mới nhất.*
