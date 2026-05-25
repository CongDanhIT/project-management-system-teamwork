# ĐẶC TẢ CHI TIẾT CÁC BIỂU ĐỒ USE CASE (USE CASE SPECIFICATIONS)
*Tài liệu đặc tả các luồng nghiệp vụ dựa trên các Biểu đồ Use Case (UML) của Hệ thống Quản lý Dự án.*

---

## 1. Biểu đồ Use Case Tổng Quát (System-wide Use Case)
Biểu đồ tổng quát cung cấp cái nhìn toàn cảnh về ranh giới hệ thống (System Boundary) và các đối tượng (Actor) tương tác.

### 1.1. Hệ thống tác nhân (Actors) & Kế thừa (Generalization)
- **Guest (Khách vãng lai):** Người dùng chưa đăng nhập, chỉ có thể tương tác với hệ thống xác thực.
- **Thành viên (Member):** Tác nhân cơ bản của Workspace. Kế thừa quyền hạn của Guest.
- **Quản trị viên (Admin):** Tác nhân quản lý dự án và nhân sự. Kế thừa toàn bộ quyền hạn của Thành viên.
- **Chủ sở hữu (Owner):** Tác nhân quyền lực nhất (Super Admin). Kế thừa toàn bộ quyền hạn của Quản trị viên và có thêm đặc quyền quản lý vòng đời Workspace.

### 1.2. Các nghiệp vụ cấp cao
- **Xác thực và Quản lý Tài khoản:** Cấp quyền truy cập và định danh người dùng.
- **Quản lý Công việc & Cộng tác:** Các thao tác tạo, sửa, tương tác trên Task/Dự án.
- **Quản trị Nhân sự & Báo cáo:** Quản lý vòng đời người dùng trong Workspace và giám sát hệ thống.
- **Cấu hình & Quản trị Hệ thống:** Quản lý vòng đời của Workspace và các tích hợp bảo mật, API bên ngoài.

---

## 2. Phân hệ Thành viên (Member Use Cases)
Đặc tả các chức năng cốt lõi dành cho đối tượng người dùng cuối tham gia trực tiếp vào việc thực thi công việc.

| Tên Use Case | Loại | Mô tả kịch bản (Scenario) | Các quan hệ (Include/Extend) |
| :--- | :---: | :--- | :--- |
| **Xác thực tài khoản** | Base | Người dùng đăng nhập vào hệ thống để nhận phiên (Session). | Khách hàng có thể tùy chọn **Đăng nhập bằng Google OAuth** (`<<extend>>`). |
| **Quản lý Hồ sơ cá nhân** | Base | Người dùng cập nhật hình đại diện, mật khẩu và thông tin định danh. | N/A |
| **Quản lý Công việc cá nhân** | Base | Tạo, chỉnh sửa trạng thái, thời hạn của Task/Subtask được giao. | Có thể tùy chọn gọi menu **Tìm kiếm toàn cục (Command K)** (`<<extend>>`) để thao tác nhanh. |
| **Tương tác và Thảo luận** | Base | Bình luận, trao đổi thông tin trực tiếp trên giao diện của Task. | Tùy chọn **Gắn thẻ thành viên (@Mention)** (`<<extend>>`) để đẩy thông báo thời gian thực. |
| **Sử dụng Trợ lý ảo AI** | Base | Trò chuyện với Agent để truy vấn thông tin dự án. | AI có khả năng **Tự động tạo Task (Tool Calling)** (`<<extend>>`) nếu phát hiện ngữ lệnh phù hợp. |
| **Tải lên Tài liệu dự án** | Base | Đính kèm file (PDF, hình ảnh) vào công việc. | **Bắt buộc** hệ thống phải **Xin quyền tải tệp (Presigned URL)** (`<<include>>`) từ Cloudflare R2 trước khi upload. |
| **Theo dõi Tiến độ** | Base | Xem tổng quan các Dashboard thống kê. | Tùy chọn mở rộng **Xem Sơ đồ Gantt Chart** (`<<extend>>`). |

---

## 3. Phân hệ Quản trị viên (Admin Use Cases)
Đặc tả các chức năng điều phối và quản lý vi mô (Dự án, Nhân sự), thừa kế toàn bộ quyền của Thành viên.

| Tên Use Case | Loại | Mô tả kịch bản (Scenario) | Các quan hệ (Include/Extend) |
| :--- | :---: | :--- | :--- |
| **Quản lý vòng đời Dự án** | Base | Khởi tạo, cập nhật thông tin và điều phối vòng đời một Dự án. | Có thể tùy chọn **Đóng băng Dự án (Freeze)** (`<<extend>>`) để lưu trữ, hoặc dùng **AI Project Planner** (`<<extend>>`) để sinh cấu trúc tự động. |
| **Quản lý Giai đoạn (Phases)** | Base | Thiết lập timeline tổng thể và phân rã dự án thành các mốc (Milestones). | N/A |
| **Quản lý Nhân sự Workspace** | Base | Kiểm soát số lượng và chất lượng nhân sự trong không gian làm việc. | Tùy chọn **Mời thành viên mới** (`<<extend>>`) và **Thay đổi vai trò RBAC** (`<<extend>>`). |
| **Giám sát hoạt động & Báo cáo**| Base | Giám sát toàn bộ luồng công việc, trích xuất báo cáo cho lãnh đạo. | **Bắt buộc** truy vấn **Lịch sử hành vi (Audit Log)** (`<<include>>`). Tùy chọn sinh **Cảnh báo rủi ro AI** (`<<extend>>`) và **Trích xuất Excel** (`<<extend>>`). |
| **Thiết lập Bảng tin nội bộ** | Base | Đăng thông cáo báo chí, quy định chung của công ty lên Newsfeed. | Cho phép **Ghim thông báo quan trọng** (`<<extend>>`) lên đầu trang. |

---

## 4. Phân hệ Chủ sở hữu (Owner Use Cases)
Đặc tả các đặc quyền cấp cao nhất (Super Admin), thao tác trực tiếp lên sự tồn vong của Không gian làm việc.

| Tên Use Case | Loại | Mô tả kịch bản (Scenario) | Các quan hệ (Include/Extend) |
| :--- | :---: | :--- | :--- |
| **Khởi tạo Không gian làm việc** | Base | Khởi tạo một thực thể Workspace mới (Cấp phát dữ liệu Multi-tenancy). | N/A |
| **Xóa vĩnh viễn Workspace** | Base | Xóa toàn bộ dữ liệu (Hard Delete) của không gian làm việc. Thao tác nguy hiểm chỉ dành cho Owner. | N/A |
| **Cập nhật Thông tin Workspace** | Base | Đổi tên, thay đổi Logo thương hiệu (Brand Identity) của tổ chức. | Có thể mở rộng chức năng **Đặt lại Mã mời (Reset Invite Code)** (`<<extend>>`) khi mã cũ bị lộ. |
| **Thiết lập Tích hợp & Bảo mật** | Base | Cấu hình các cơ chế tích hợp bên thứ 3 (Slack Webhooks, Gửi Mail hằng ngày) và các rào cản bảo mật cấp hệ thống. | N/A |

## 5. Mẫu Đặc tả Use Case Chi tiết (Detailed Use Case Specification)
*Theo quy tắc đặc tả Use Case chuẩn UML/RUP, dưới đây là chi tiết luồng sự kiện cho 2 Use Case quan trọng nhất của hệ thống.*

### 5.1. Đặc tả Use Case: Quản lý Công việc cá nhân
- **Use Case ID:** UC-TSK-01
- **Tên Use Case:** Quản lý Công việc cá nhân
- **Tác nhân chính (Primary Actor):** Thành viên (Member)
- **Tác nhân phụ (Secondary Actor):** Quản trị viên (Admin)
- **Mô tả ngắn gọn:** Cho phép người dùng tạo mới, chỉnh sửa thông tin, cập nhật trạng thái (Kanban) và xóa (Soft delete) các công việc được giao.
- **Điều kiện tiên quyết (Pre-conditions):**
  - Người dùng đã đăng nhập thành công vào hệ thống.
  - Người dùng đã tham gia vào ít nhất một Workspace và Dự án.
- **Điều kiện hậu quyết (Post-conditions):**
  - Trạng thái công việc được cập nhật vào cơ sở dữ liệu.
  - Hệ thống Real-time phát thông báo (Socket.io) đến các thành viên liên quan.

**Luồng sự kiện chính (Basic Flow):**
1. Tác nhân chọn một Dự án từ thanh điều hướng (Sidebar).
2. Hệ thống hiển thị giao diện Kanban Board với danh sách các công việc hiện tại.
3. Tác nhân bấm nút "Tạo công việc mới" hoặc kéo thả một công việc hiện có sang cột trạng thái khác.
4. Hệ thống kiểm tra quyền hạn (RBAC) của tác nhân đối với công việc này.
5. Nếu hợp lệ, Hệ thống ghi nhận thay đổi vào Cơ sở dữ liệu và kích hoạt Event Cập nhật.
6. Hệ thống đồng bộ giao diện cho toàn bộ người dùng đang online (Real-time Sync).

**Luồng rẽ nhánh / Ngoại lệ (Alternative Flows):**
- **4a. Tác nhân không có quyền chỉnh sửa:** 
  - Tại bước 4, hệ thống phát hiện tác nhân không phải người được giao (Assignee) hoặc Quản trị viên. 
  - Hệ thống từ chối thao tác, hiển thị thông báo lỗi "Bạn không có quyền thao tác trên công việc này". Luồng kết thúc.
- **3a. Sử dụng Tìm kiếm nhanh (Command K):**
  - Tại bước 3, tác nhân bấm tổ hợp phím `Cmd/Ctrl + K`.
  - Kích hoạt Use Case mở rộng: **Tìm kiếm toàn cục (Command K)**.

---

### 5.2. Đặc tả Use Case: Khởi tạo Không gian làm việc
- **Tên Use Case:** Khởi tạo Không gian làm việc (Workspace)
- **Tác nhân chính (Primary Actor):** Chủ sở hữu (Owner)
- **Mô tả ngắn gọn:** Cho phép người dùng cấp cao nhất tạo mới một không gian làm việc cô lập (Multi-tenancy) cho tổ chức của mình.
- **Điều kiện tiên quyết:** Người dùng đã có tài khoản trên hệ thống.
- **Điều kiện hậu quyết:** 
  - Một Workspace mới được tạo trong Cơ sở dữ liệu.
  - Người dùng thực hiện thao tác tự động được gán vai trò `OWNER` của Workspace đó.

**Luồng sự kiện chính (Basic Flow):**
1. Tác nhân nhấn nút "Create Workspace" trên màn hình Dashboard tổng.
2. Hệ thống hiển thị biểu mẫu (Form) yêu cầu nhập Tên Workspace và chọn Logo/Màu sắc thương hiệu.
3. Tác nhân điền thông tin hợp lệ và nhấn "Xác nhận".
4. Hệ thống khởi tạo bản ghi Workspace mới, đồng thời sinh ra một **Mã mời (Invite Code)** duy nhất.
5. Hệ thống gán quyền `OWNER` cho tác nhân đối với Workspace vừa tạo.
6. Hệ thống tự động chuyển hướng tác nhân vào màn hình chính của Workspace mới.

**Luồng rẽ nhánh / Ngoại lệ :** - nếu có
- **3a. Thông tin không hợp lệ:**
  - Tại bước 3, tác nhân nhập tên Workspace để trống hoặc chứa ký tự đặc biệt cấm.
  - Hệ thống hiển thị cảnh báo Validation (Zod Schema) ngay tại biểu mẫu. Tác nhân phải nhập lại.

---
*Ghi chú: Tài liệu tuân thủ quy tắc mô hình hóa UML 2.5. Các đường `<<include>>` thể hiện sự phụ thuộc cứng (Mandatory), trong khi `<<extend>>` thể hiện các luồng sự kiện tùy chọn (Optional) sinh ra từ điểm mở rộng (Extension points).*

## 6. Đặc tả Use Case Chính của Hệ thống

### 6.1. Đặc tả Use Case: Xác thực và Bảo mật
- **Use Case ID:** UC-AU-01
- **Tên Use Case:** Xác thực và Bảo mật
- **Tác nhân chính:** Khách (Guest), Thành viên (Member), Quản trị viên (Admin), Chủ sở hữu (Owner)
- **Tác nhân phụ:** Google OAuth (External)
- **Mô tả ngắn gọn:** Cung cấp cơ chế đăng ký/đăng nhập, xác thực bằng Google, quản lý phiên truy cập cookie, kiểm soát RBAC và bảo vệ dữ liệu bằng soft delete.
- **Điều kiện tiên quyết:** Người dùng có kết nối Internet; với Google OAuth, người dùng có tài khoản Google hợp lệ.
- **Điều kiện hậu quyết:** Người dùng được xác thực; phiên đăng nhập được tạo; quyền truy cập được áp dụng đúng roles; tài khoản trả về trạng thái bảo mật.

**Luồng sự kiện chính:**
1. Tác nhân mở trang đăng nhập.
2. Tác nhân chọn đăng nhập bằng email/mật khẩu hoặc Google OAuth.
3. Hệ thống xác thực thông tin và tạo session cookie nếu hợp lệ.
4. Hệ thống kiểm tra RBAC và phân quyền truy cập tương ứng.
5. Hệ thống trả về thông tin người dùng và trạng thái đăng nhập.

**Luồng rẽ nhánh / Ngoại lệ:**
- **3a. Thông tin đăng nhập sai:** Hệ thống hiển thị lỗi và yêu cầu nhập lại.
- **3b. Google OAuth không thành công:** Hệ thống xử lý lỗi callback và hiển thị thông báo.
- **4a. RBAC không đủ:** Hệ thống từ chối truy cập vào tài nguyên bị bảo vệ.

### 6.2. Đặc tả Use Case: Quản lý Workspace và Thành viên
- **Tên Use Case:** Quản lý Workspace và Thành viên
- **Tác nhân chính:** Chủ sở hữu (Owner), Quản trị viên (Admin)
- **Mô tả ngắn gọn:** Tạo/sửa/xóa workspace, mời thành viên, gán quyền RBAC và quản lý vòng đời không gian làm việc.
- **Điều kiện tiên quyết:** Tác nhân đã đăng nhập và có quyền Owner/Admin.
- **Điều kiện hậu quyết:** Workspace được cập nhật; thành viên mới được thêm; phân quyền được lưu và áp dụng.

**Luồng sự kiện chính:**
1. Tác nhân truy cập trang quản lý workspace.
2. Tác nhân tạo mới hoặc chỉnh sửa workspace, hoặc mời thành viên vào workspace.
3. Hệ thống kiểm tra quyền Owner/Admin và xác nhận dữ liệu.
4. Hệ thống lưu thay đổi và gửi thông báo mời nếu cần.
5. Hệ thống cập nhật danh sách thành viên và quyền RBAC.

**Luồng rẽ nhánh / Ngoại lệ:**
- **3a. Dữ liệu workspace không hợp lệ:** Hệ thống chặn lưu và hiển thị lỗi.
- **3b. Thành viên đã tồn tại:** Hệ thống thông báo và không lặp lại lời mời.

### 6.3. Đặc tả Use Case: Quản lý Project, Phase và Task
- **Tên Use Case:** Quản lý Project, Phase và Task
- **Tác nhân chính:** Quản trị viên (Admin), Chủ sở hữu (Owner), Thành viên (Member)
- **Mô tả ngắn gọn:** Tạo và quản lý dự án, giai đoạn và công việc, phân công người thực hiện, theo dõi tiến độ và trạng thái task.
- **Điều kiện tiên quyết:** Tác nhân thuộc workspace và có quyền truy cập vào dự án.
- **Điều kiện hậu quyết:** Dự án/giai đoạn/task được lưu; tiến độ được cập nhật; người được giao nhận thông báo.

**Luồng sự kiện chính:**
1. Tác nhân mở dự án và chọn tạo hoặc chỉnh sửa phase/task.
2. Hệ thống xác nhận quyền truy cập và hiển thị form tương ứng.
3. Tác nhân nhập thông tin project/phase/task và lưu.
4. Hệ thống cập nhật dữ liệu trong cơ sở dữ liệu và phát sự kiện real-time.
5. Hệ thống đồng bộ trạng thái với người dùng tương tác và lưu lại lịch sử hoạt động.

**Luồng rẽ nhánh / Ngoại lệ:**
- **3a. Task thiếu thông tin bắt buộc:** Hệ thống báo lỗi validation.
- **4a. Không có quyền chỉnh sửa phase/task:** Hệ thống từ chối thao tác.

### 6.4. Đặc tả Use Case: Cộng tác và Giao tiếp thời gian thực
- **Tên Use Case:** Cộng tác và Giao tiếp thời gian thực
- **Tác nhân chính:** Thành viên (Member), Quản trị viên (Admin), Chủ sở hữu (Owner)
- **Mô tả ngắn gọn:** Cho phép bình luận task, mention, nhận thông báo và đồng bộ trạng thái trong thời gian thực.
- **Điều kiện tiên quyết:** Người dùng đã đăng nhập, có kết nối realtime và đang tham gia workspace/dự án.
- **Điều kiện hậu quyết:** Bình luận hoặc cập nhật được gửi; người liên quan nhận thông báo; giao diện đồng bộ.

**Luồng sự kiện chính:**
1. Tác nhân mở task và nhập bình luận hoặc cập nhật trạng thái.
2. Hệ thống kiểm tra quyền truy cập và lưu nội dung.
3. Hệ thống phát event realtime đến các thành viên liên quan.
4. Hệ thống cập nhật giao diện của các client đang kết nối.

**Luồng rẽ nhánh / Ngoại lệ:**
- **2a. Quyền bị từ chối:** Hệ thống không cho phép thao tác.
- **3a. Kết nối realtime mất:** Hệ thống lưu bản nháp và thông báo lỗi nếu không thể đồng bộ.

### 6.5. Đặc tả Use Case: Quản lý Tài nguyên và File dự án
- **Tên Use Case:** Quản lý Tài nguyên và File dự án
- **Tác nhân chính:** Thành viên (Member), Quản trị viên (Admin)
- **Mô tả ngắn gọn:** Upload, xem, tải xuống và quản lý file dự án trên cloud, đồng thời đảm bảo quyền truy cập và lưu trữ an toàn.
- **Điều kiện tiên quyết:** Người dùng đã đăng nhập; workspace/project hợp lệ.
- **Điều kiện hậu quyết:** File được upload lên Cloudflare R2/Cloudinary; metadata lưu vào database; user có thể truy cập file theo quyền.

**Luồng sự kiện chính:**
1. Tác nhân chọn upload file hoặc truy cập tài nguyên dự án.
2. Hệ thống tạo presigned URL và trả về client.
3. Client tải lên file trực tiếp lên cloud.
4. Hệ thống ghi nhận metadata file và liên kết với project/task.
5. Người dùng khác có quyền xem/tải file.

**Luồng rẽ nhánh / Ngoại lệ:**
- **2a. Presigned URL không hợp lệ:** Hệ thống yêu cầu cấp lại.
- **3a. Upload thất bại:** Hệ thống trả về lỗi và yêu cầu tải lại.

### 6.6. Đặc tả Use Case: Vận hành AI và Tự động hóa
- **Tên Use Case:** Vận hành AI và Tự động hóa
- **Tác nhân chính:** Chủ sở hữu (Owner), Quản trị viên (Admin), Thành viên (Member)
- **Tác nhân phụ:** AI Agent / AI Planner
- **Mô tả ngắn gọn:** Tích hợp AI để tạo plan, hỗ trợ chat, tự động đề xuất task và phân tích rủi ro.
- **Điều kiện tiên quyết:** Tác nhân đã đăng nhập; hệ thống AI đã được cấu hình.
- **Điều kiện hậu quyết:** AI sinh ra kết quả hợp lệ; task hoặc gợi ý được tạo; thông tin được trả về user.

**Luồng sự kiện chính:**
1. Tác nhân gọi AI Planner hoặc AI Agent.
2. Hệ thống gửi ngữ cảnh dự án đến AI và chờ phản hồi.
3. AI trả về kết quả theo định dạng chuẩn.
4. Hệ thống xử lý kết quả và hiển thị cho tác nhân.
5. Nếu cần, hệ thống tạo task/giai đoạn tự động.

**Luồng rẽ nhánh / Ngoại lệ:**
- **2a. AI timeout hoặc lỗi:** Hệ thống hiển thị thông báo và yêu cầu thử lại.
- **4a. Dữ liệu trả về không hợp lệ:** Hệ thống xác thực schema và từ chối nếu sai định dạng.

### 6.7. Đặc tả Use Case: Phân tích và Báo cáo
- **Tên Use Case:** Phân tích và Báo cáo
- **Tác nhân chính:** Quản trị viên (Admin), Chủ sở hữu (Owner)
- **Mô tả ngắn gọn:** Cung cấp dashboard analytics, snapshot hàng ngày, audit log và xuất báo cáo Excel/PDF.
- **Điều kiện tiên quyết:** Tác nhân đã đăng nhập; có quyền xem báo cáo.
- **Điều kiện hậu quyết:** Báo cáo được sinh ra; số liệu hiển thị; lịch sử hoạt động được lưu.

**Luồng sự kiện chính:**
1. Tác nhân mở dashboard hoặc chọn xuất báo cáo.
2. Hệ thống thu thập dữ liệu từ project/task/activity.
3. Hệ thống tính toán và hiển thị biểu đồ, số liệu.
4. Nếu có yêu cầu xuất, hệ thống tạo file Excel/PDF.
5. Tác nhân tải về hoặc xem báo cáo.

**Luồng rẽ nhánh / Ngoại lệ:**
- **2a. Dữ liệu không đầy đủ:** Hệ thống thông báo tình trạng thiếu dữ liệu.
- **4a. Xuất báo cáo lỗi:** Hệ thống hiển thị cảnh báo và đề nghị thử lại.

### 6.8. Đặc tả Use Case: Tích hợp và Thông báo
- **Tên Use Case:** Tích hợp và Thông báo
- **Tác nhân chính:** Quản trị viên (Admin), Chủ sở hữu (Owner)
- **Tác nhân phụ:** Slack Webhook, SendGrid
- **Mô tả ngắn gọn:** Tích hợp hệ thống với Slack và Email để tự động gửi thông báo, bản tin và báo cáo.
- **Điều kiện tiên quyết:** Tác nhân đã đăng nhập; tích hợp đã được cấu hình.
- **Điều kiện hậu quyết:** Dữ liệu thông báo được chuyển tiếp thành công đến Slack hoặc Email của người nhận.

**Luồng sự kiện chính:**
1. Tác nhân cấu hình Slack Webhook hoặc dịch vụ Email.
2. Hệ thống lưu cấu hình và kiểm tra kết nối dịch vụ.
3. Khi có sự kiện, hệ thống tự động tạo payload bản tin/thông báo tương ứng và gửi đi.
4. Dịch vụ bên ngoài (Slack/SendGrid) phản hồi trạng thái nhận.
5. Hệ thống ghi nhật ký truyền thông và hiển thị trạng thái gửi thành công/thất bại.

**Luồng rẽ nhánh / Ngoại lệ:**
- **2a. Cấu hình không hợp lệ:** Hệ thống thông báo và yêu cầu sửa.
- **3a. Gửi thất bại:** Hệ thống ghi log lỗi và thử lại khi cần.
