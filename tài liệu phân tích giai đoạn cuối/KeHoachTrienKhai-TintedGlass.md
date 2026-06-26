# Kế Hoạch Triển Khai: UI Tinted Glass (Ambient Light & Glassmorphism)

Dự án đang chuyển mình từ phong cách "Clinical / Admin truyền thống" sang một trải nghiệm "Premium / Neon Forest" tràn đầy sinh khí. Để đảm bảo tính an toàn và dễ kiểm soát, chúng ta sẽ không làm tất cả cùng lúc mà sẽ đi qua **4 Giai đoạn (Phases)** rõ ràng.

---

## Giai đoạn 1: Thiết lập Bầu khí quyển (Ambient Environment)
Mục tiêu: Đập bỏ nền xám/trắng khô khan và bơm vào hệ thống các luồng ánh sáng chủ đạo.
- **Vị trí sửa:** `frontend/src/app/(dashboard)/layout.tsx` (Hoặc Root Layout tương đương).
- **Công việc:** 
  1. Loại bỏ màu nền đặc (solid) của body/main.
  2. Cấy 2-3 phần tử `<div />` làm "Quầng sáng" (Glow Orbs):
     - Một quầng khổng lồ màu Primary Teal (`#035D5B`) ở góc trên bên phải.
     - Một quầng màu Neon Lime (`#C7F964`) ở góc dưới cùng bên trái.
  3. Áp dụng hiệu ứng blur cực mạnh (VD: `blur-[120px]`) và Opacity thấp (5-10%) để ánh sáng tản đều, không làm rối mắt.

## Giai đoạn 2: Nâng cấp Vật liệu lên Kính mờ (Glassmorphism)
Mục tiêu: Các tấm nền (Card, Panel) phải có độ trong suốt để ánh sáng từ Giai đoạn 1 có thể xuyên qua.
- **Thanh điều hướng (Sidebar):** Thay `bg-white` bằng `bg-white/70` (hoặc 80%) kết hợp `backdrop-blur-xl`.
- **Thanh tiêu đề (Header):** Tương tự Sidebar, tạo hiệu ứng kính mờ để khi cuộn trang, nội dung trôi phía dưới lớp kính.
- **Cột Kanban (Kanban Columns):** Nền của các cột (Cần làm, Đang làm) sẽ dùng màu xám/trắng cực nhạt với `backdrop-blur-md` thay vì màu đặc, tạo không gian đa tầng (Multi-layer).
- **Thẻ Dashboard (Dashboard Cards):** Đổi màu nền từ trắng đục sang trắng trong suốt (`bg-white/80`).

## Giai đoạn 3: Thổi hồn bằng Điểm nhấn & Active States (Glow Accents)
Mục tiêu: Kêu gọi hành động và chỉ hướng người dùng bằng màu sắc bão hòa cao.
- **Nút "KHỞI TẠO NHANH":** 
  - Thay vì đổ bóng đen (Drop shadow), sẽ đổi sang bóng phát sáng màu Teal (`shadow-[0_8px_24px_rgba(3,93,91,0.3)]`).
- **Trạng thái Active (Sidebar Menu):**
  - Khi một menu (VD: "Dự án") đang được chọn, thay vì chỉ đổi màu nền nhạt, ta sẽ thêm một viền dọc (indicator) phát sáng hoặc làm cho text rực rỡ hơn.

## Giai đoạn 4: Đánh giá & Tối ưu Hiệu năng (Performance Polish)
Mục tiêu: Đẹp nhưng phải mượt. Kính mờ (Backdrop-blur) là kẻ thù của GPU nếu bị lạm dụng.
- **Công việc:**
  1. Kiểm tra FPS (Frames Per Second) khi cuộn bảng Kanban.
  2. Bổ sung `will-change: transform` hoặc `contain: paint` ở những khu vực cần thiết để tối ưu render.
  3. Kiểm tra Độ tương phản (Contrast Ratio) để đảm bảo chữ vẫn đọc rõ trên nền kính.

---
**Đề xuất Bắt đầu:** Khi bạn sẵn sàng, chúng ta sẽ bắt đầu xử lý duy nhất **Giai đoạn 1** trước nhé.
