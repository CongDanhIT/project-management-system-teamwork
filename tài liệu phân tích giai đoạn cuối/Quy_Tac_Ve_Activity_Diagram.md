# QUY TẮC VÀ CHUẨN MỰC VẼ SƠ ĐỒ HOẠT ĐỘNG (UML ACTIVITY DIAGRAM)

Tài liệu này tổng hợp các quy tắc chuẩn UML và best practices từ cộng đồng kỹ sư phần mềm nhằm đảm bảo Sơ đồ hoạt động (Activity Diagram) được thiết kế rõ ràng, logic, và chuyên nghiệp.

---

## 1. Cấu trúc tổng thể (Fundamental Structure)

*   **Điểm bắt đầu rõ ràng (Initial Node):** Mọi biểu đồ bắt buộc phải có **một và chỉ một** điểm bắt đầu (vòng tròn đen đặc). Theo thói quen đọc (từ trái sang phải, từ trên xuống dưới), nên đặt Initial Node ở góc trên cùng bên trái.
*   **Điểm kết thúc (Final Node):** Mặc dù một quy trình có thể có nhiều nhánh kết thúc khác nhau (ví dụ: Thành công, Thất bại), nhưng một biểu đồ chuẩn mực nên hạn chế số lượng Final Node (vòng tròn đen có viền ngoài) để người xem dễ dàng nhận biết điểm dừng cuối cùng của toàn bộ tiến trình.
*   **Tính liên tục của luồng (Flow Consistency):** Tất cả các hoạt động cuối cùng đều phải dẫn đến một điểm kết thúc. Tuyệt đối tránh các "ngõ cụt" (dead ends) - nơi một tiến trình đột ngột dừng lại mà không có ký hiệu kết thúc.
*   **Không nhồi nhét (Avoid Monolithic Diagrams):** Nếu một luồng nghiệp vụ quá phức tạp, không cố gắng vẽ tất cả vào một biểu đồ duy nhất. Hãy chia nhỏ thành các biểu đồ con (Sub-activity diagrams) và sử dụng ký hiệu *Call Behavior Action* (Hành động gọi hành vi khác) để liên kết chúng.

## 2. Quy tắc Logic và Ký hiệu (Logic & Notation Rules)

*   **Nút Quyết định (Decision Points):** 
    *   Bắt buộc sử dụng hình thoi (Diamond) cho các điểm rẽ nhánh logic. 
    *   **QUY TẮC SỐNG CÒN:** Bất kỳ mũi tên nào đi ra từ một hình thoi quyết định **đều phải đi kèm với một Điều kiện bảo vệ (Guard Condition)** được đặt trong ngoặc vuông `[ ]` (Ví dụ: `[Hợp lệ]`, `[Không hợp lệ]`, `[else]`).
*   **Xử lý song song (Forks & Joins):**
    *   Sử dụng thanh ngang dày (Fork node) khi một luồng chính tách ra thành nhiều luồng chạy đồng thời.
    *   Nếu đã có Fork, bắt buộc phải có thanh ngang dày tương ứng (Join node) để đồng bộ hóa (chờ tất cả các luồng song song hoàn thành) trước khi đi tiếp.
*   **Chống lỗi Deadlock (Nút thắt cổ chai):** Hãy cẩn thận khi sử dụng Join node. Nếu một hành động yêu cầu nhiều luồng đi vào, hãy dùng Join. Nếu thiết kế sai khiến một luồng không bao giờ tới được Join, toàn bộ tiến trình sẽ bị kẹt (Deadlock).
*   **Tránh "Lỗ đen" và "Phép màu" (Black Hole & Miracle Checks):**
    *   *Black Hole:* Một hành động (Action) chỉ có mũi tên đi vào mà không có mũi tên đi ra.
    *   *Miracle:* Một hành động tự nhiên sinh ra mũi tên đi ra mà không có luồng nào dẫn vào nó.
    *   *Ngoại trừ Initial và Final Node, mọi Action đều phải có ít nhất 1 luồng vào và 1 luồng ra.*

## 3. Tính rõ ràng và Giao tiếp (Clarity & Communication)

*   **Phân làn (Swimlanes / Partitions):** Đối với các quy trình có sự tham gia của nhiều Actor (Hệ thống, Người dùng, Admin, API bên thứ 3), **bắt buộc** phải sử dụng Swimlanes. Đặt tên Actor ở đầu mỗi làn. Khi đã dùng Swimlane, bạn không cần phải ghi chú tên Actor vào bên trong từng khối hành động nữa.
*   **Sử dụng Động từ:** Tên của các khối hành động (Action - hình chữ nhật bo góc) phải bắt đầu bằng một **Động từ** (Ví dụ: `Kiểm tra quyền truy cập`, `Lưu dữ liệu`, `Gửi email thông báo`). Không dùng danh từ.
*   **Bám sát Use Case:** Activity Diagram là bản vẽ chi tiết hóa cho Use Case. Luồng đi trong biểu đồ phải khớp 100% với kịch bản (Scenario) đã viết trong Use Case. Không tự ý bịa thêm các bước không có trong đặc tả, cũng không bỏ sót các bước quan trọng.
*   **Tính nhất quán:** Giữ nguyên vẹn cách gọi tên (naming conventions). Nếu hành động là "Xác thực OTP", đừng gọi nó là "Kiểm tra mã bảo mật" ở một nhánh khác.

---
> **Lưu ý thực hành cho dự án:** Hãy sử dụng các công cụ vẽ UML chuyên dụng như Draw.io, PlantUML, hoặc Visual Paradigm để đảm bảo các ký hiệu (đặc biệt là mũi tên, hình thoi, fork/join) tuân thủ đúng chuẩn định dạng UML 2.0.
