# TÀI LIỆU HƯỚNG DẪN: QUY TẮC VẼ BIỂU ĐỒ USE CASE (USE CASE DIAGRAM)

Biểu đồ Use Case (Ca sử dụng) là một trong những biểu đồ quan trọng nhất của UML (Unified Modeling Language). Trong luận văn/báo cáo, biểu đồ này giúp người đọc hiểu được **Hệ thống làm được những gì?** và **Ai là người tương tác với hệ thống?** mà không cần đi sâu vào chi tiết kỹ thuật.

Dưới đây là các quy tắc chuẩn quốc tế (UML Standard) bắt buộc phải tuân thủ khi vẽ biểu đồ Use Case:

---

## 1. TÁC NHÂN (ACTOR)
Tác nhân là bất kỳ ai hoặc bất kỳ thứ gì tương tác với hệ thống từ bên ngoài.
*   **Ký hiệu:** Hình người que (Stick figure) đối với con người, hoặc hình chữ nhật có nhãn `<<actor>>` đối với hệ thống bên ngoài (External System).
Tác nhân là hệ thống (External System): Sử dụng khối hình chữ nhật có chứa nhãn định dạng (stereotype) <<system>> hoặc <<actor>> đặt ngay phía trên tên của tác nhân.
*   **Vị trí:** **LUÔN LUÔN** nằm bên ngoài Ranh giới hệ thống (System Boundary).
*   **Quy tắc đặt tên:** Phải là danh từ chỉ người dùng hoặc hệ thống (VD: `Admin`, `Member`, `Hệ thống Thanh toán`, `Google API`). Không được là một hành động.
*   **Lưu ý:** Tác nhân không phải là một phần của hệ thống mà ta đang xây dựng.

## 2. CA SỬ DỤNG (USE CASE)
Đại diện cho một chức năng, một dịch vụ hoặc một quy trình mà hệ thống cung cấp để mang lại giá trị cho Tác nhân.
*   **Ký hiệu:** Hình oval (bầu dục).
*   **Vị trí:** **LUÔN LUÔN** nằm bên trong Ranh giới hệ thống.
*   **Quy tắc đặt tên:** Phải bắt đầu bằng một **Động từ** thể hiện hành động, theo sau là danh từ (VD: `Đăng nhập`, `Tạo dự án`, `Quản lý công việc`, `Xuất báo cáo Excel`). Không dùng tên quá chung chung hoặc tên của một màn hình UI.

## 3. RANH GIỚI HỆ THỐNG (SYSTEM BOUNDARY)
Xác định phạm vi của hệ thống đang được xây dựng. Những gì nằm trong hộp là thuộc hệ thống của bạn, những gì nằm ngoài hộp là môi trường bên ngoài.
*   **Ký hiệu:** Một hình chữ nhật lớn bao quanh tất cả các Use Case.
*   **Quy tắc:** Tên của hệ thống (Ví dụ: `Hệ thống Quản lý Dự án`) phải được đặt ở góc trên cùng bên trong hoặc ngay phía trên hình chữ nhật.

## 4. CÁC MỐI QUAN HỆ (RELATIONSHIPS)
Đây là phần sinh viên hay vẽ sai nhất trong luận văn. Có 4 loại mối quan hệ chính:

### 4.1. Association (Giao tiếp / Liên kết)
*   **Ý nghĩa:** Thể hiện việc Tác nhân có tương tác với Use Case (kích hoạt chức năng hoặc nhận kết quả).
*   **Ký hiệu:** Đường thẳng liền nét (không có mũi tên, hoặc mũi tên chỉ chiều luồng dữ liệu).
*   **Quy tắc:** Chỉ nối giữa **Actor** và **Use Case**. Không bao giờ nối 2 Actor với nhau, và cũng không dùng Association để nối 2 Use Case với nhau.

### 4.2. Kế thừa (Generalization)
*   **Ý nghĩa:** Thể hiện mối quan hệ "Cha - Con". Con sẽ kế thừa tất cả các đặc tính (hoặc quyền) của Cha.
*   **Ký hiệu:** Đường thẳng liền nét với mũi tên hình tam giác rỗng chỉ về phía "Cha".
*   **Quy tắc:** 
    *   Giữa Actor với Actor (VD: `Admin` kế thừa `User` -> Admin có thể làm mọi thứ User làm).
    *   Giữa Use Case với Use Case (VD: `Thanh toán MoMo` và `Thanh toán ZaloPay` kế thừa `Thanh toán Online`).

### 4.3. Quan hệ Bao gồm (<<include>>)
*   **Ý nghĩa:** Bắt buộc. Một Use Case A **chắc chắn phải** gọi/sử dụng Use Case B để hoàn thành nhiệm vụ của nó. Use Case B là hành động tái sử dụng.
*   **Ký hiệu:** Đường nét đứt, mũi tên chỉ **TỪ** Use Case gốc (A) **ĐẾN** Use Case được gọi (B). Trên đường gạch đứt ghi chữ `<<include>>`.
*   **Ví dụ chuẩn:** Use Case `Rút tiền` --<<include>>--> Use Case `Xác thực mã PIN`. (Rút tiền thì *bắt buộc* phải xác thực PIN).

### 4.4. Quan hệ Mở rộng (<<extend>>)
*   **Ý nghĩa:** Tùy chọn. Một Use Case B có thể **tùy chọn** bổ sung thêm luồng xử lý cho Use Case A trong những điều kiện nhất định.
*   **Ký hiệu:** Đường nét đứt, mũi tên chỉ **TỪ** Use Case mở rộng (B) **NGƯỢC VỀ** Use Case gốc (A). Trên đường gạch đứt ghi chữ `<<extend>>`. *(Lưu ý: Mũi tên ngược hướng so với include).*
*   **Ví dụ chuẩn:** Use Case `Thanh toán thất bại` --<<extend>>--> Use Case `Thanh toán hóa đơn`. (Chỉ khi thanh toán lỗi mới xảy ra luồng thất bại).

---

## 5. CÁC LỖI "TỬ THẦN" THƯỜNG GẶP TRONG LUẬN VĂN
1. **Dùng nhầm hướng mũi tên của `<<extend>>` và `<<include>>`**: Đây là lỗi bị hội đồng trừ điểm nặng nhất vì sai bản chất UML.
2. **Actor nằm bên trong khung chữ nhật**: Hệ thống không chứa con người. Actor phải đứng ngoài biên.
3. **Nối 2 Use Case bằng Association (Đường liền nét)**: 2 Use Case chỉ có thể nối với nhau bằng `<<include>>`, `<<extend>>` hoặc `Generalization`.
4. **Use Case quá nhỏ bé (CRUD lắt nhắt)**: Không nên vẽ 4 Use Case `Thêm`, `Sửa`, `Xóa`, `Xem` cho cùng 1 đối tượng. Hãy gộp chung thành một Use Case là `Quản lý [Đối tượng]`. Trừ khi việc "Xóa" cần quyền cực kỳ đặc biệt.
5. **Vẽ biểu đồ hình mạng nhện (Quá nhiều đường chéo nhau)**: Hãy sắp xếp các Actor bên trái (Primary Actor) và bên phải (Secondary Actor - System) để biểu đồ thoáng mắt.

## 6. QUY TẮC ĐẶC TẢ USE CASE (USE CASE SPECIFICATION)
Biểu đồ Use Case chỉ cho thấy "ai" làm "cái gì". Để giải thích chi tiết, ta cần Đặc tả Use Case. Một bản đặc tả chuẩn học thuật (ví dụ theo template của RUP - Rational Unified Process) phải bao gồm các thành phần sau:

1. **Tên Use Case:** Bắt đầu bằng động từ, đồng nhất 100% với tên trên biểu đồ.
2. **Tác nhân (Actor):** Tác nhân chính (khởi tạo luồng) và tác nhân phụ (hỗ trợ).
3. **Mô tả ngắn gọn (Brief Description):** Tóm tắt mục tiêu của Use Case.
4. **Điều kiện tiên quyết (Pre-conditions):** Trạng thái bắt buộc của hệ thống TRƯỚC KHI Use Case có thể bắt đầu (VD: Người dùng đã đăng nhập).
5. **Điều kiện hậu quyết (Post-conditions):** Trạng thái của hệ thống SAU KHI Use Case kết thúc thành công (VD: Bản ghi được lưu).
6. **Luồng sự kiện chính (Basic Flow / Happy Path):** Kịch bản tương tác tuần tự giữa Actor và System khi mọi việc suôn sẻ. Phải đánh số (1, 2, 3...). Lời văn viết theo kiểu đối thoại: "Actor làm A -> Hệ thống làm B".
7. **Luồng rẽ nhánh/Ngoại lệ (Alternative/Exception Flows):** Kịch bản khi có lỗi hoặc người dùng rẽ nhánh. Phải tham chiếu đến bước ở luồng chính (VD: *Nếu ở bước 3, người dùng nhập sai mật khẩu...*).

---
*Tài liệu này được soạn thảo dựa trên chuẩn UML 2.5.*
