# 4.3. PHÂN TÍCH & THIẾT KẾ CƠ SỞ DỮ LIỆU (CSDL)

Hệ thống sử dụng **MongoDB** (hệ quản trị cơ sở dữ liệu NoSQL) thay vì các hệ CSDL Quan hệ (RDBMS) truyền thống để đáp ứng tính linh hoạt, khả năng mở rộng (scalability) và tốc độ truy xuất (read performance) cho các ứng dụng phân tán. 
*Lưu ý:* Các thuật ngữ như Bảng (Table), Cột (Column), Khóa chính (PK), Khóa ngoại (FK) sẽ được ánh xạ tương ứng sang Collection, Field, `_id` (ObjectId) và các trường tham chiếu (References) trong MongoDB.

## 4.3.1. Phân tích yêu cầu dữ liệu
Dữ liệu của hệ thống phục vụ trực tiếp cho quá trình vận hành luồng công việc nhóm, được phân chia thành 4 nhóm dữ liệu cốt lõi tương ứng với 18 thực thể nghiệp vụ thực tế của hệ thống:

1. **Nhóm Định danh & Phân quyền (Identity & Access):**
   * Lưu trữ thông tin cá nhân của người dùng, mật khẩu đăng nhập, phân quyền hệ thống và lịch sử hoạt động.
   * *Thực thể:* Người dùng (User), Tài khoản liên kết (Account), Vai trò (Role), Nhật ký hoạt động (ActivityLog).

2. **Nhóm Không gian làm việc & Tổ chức (Workspace & Collaboration):**
   * Đại diện cho cấu trúc tổ chức, nơi tập hợp các dự án, thành viên và các thông báo nội bộ.
   * *Thực thể:* Không gian làm việc (Workspace), Thành viên Workspace (Member), Thông báo chung (Announcement), Thông báo đẩy (Notification).

3. **Nhóm Quản lý Công việc & Dự án (Task & Project Management):**
   * Chứa các dữ liệu trọng tâm để vận hành nghiệp vụ: các chiến dịch, giai đoạn và công việc cụ thể.
   * *Thực thể:* Dự án (Project), Giai đoạn dự án (Phase), Công việc (Task), Nhãn dán (Tag), Bình luận công việc (TaskComment), Hòm thư cá nhân (Inbox).

4. **Nhóm Quản lý Tài nguyên & Thống kê (Assets & Analytics):**
   * Quản lý các tệp tải lên, cấu trúc thư mục lưu trữ và dữ liệu thống kê hiệu suất dự án.
   * *Thực thể:* Thư mục tài nguyên (AssetFolder), Tài nguyên tệp tin (ProjectAsset), Thống kê Workspace (WorkspaceAnalyticsSnapshot), Thống kê Dự án (ProjectAnalyticsSnapshot).

**Bên cạnh đó, toàn bộ các thực thể nghiệp vụ trên có những mối quan hệ dữ liệu (Data Relationships) chặt chẽ để vận hành hệ thống:**
* **Nhóm Quan hệ Định danh & Truy cập:** 
  * Mỗi **User** sở hữu tối đa một **Account** (1-1) để phục vụ cho hình thức đăng nhập liên kết mạng xã hội (Google OAuth2).
  * Mọi thao tác của **User** đều được hệ thống ghi nhận thành các **ActivityLog** (1-N).
* **Nhóm Quan hệ Tổ chức & Người dùng:** 
  * **User** tham gia vào **Workspace** thông qua bảng trung gian **Member** lưu trữ vai trò và quyền hạn (Quan hệ N-N). Mối quan hệ được liên kết động tới **Role** để kiểm soát phân quyền (RBAC).
  * Các sự kiện trong Workspace sẽ tạo ra nhiều **Notification** để gửi đến các **User** liên quan (1-N).
* **Nhóm Quan hệ Quản lý Dự án (Cấu trúc phân cấp):**
  * Mỗi **Workspace** lưu trữ nhiều **Project** độc lập (1-N).
  * Mỗi **Project** được tổ chức thành các giai đoạn **Phase** để chia nhỏ luồng công việc (1-N).
  * **Project** và **Phase** lại bao hàm nhiều **Task** (1-N).
* **Nhóm Quan hệ Chi tiết Công việc & Tương tác:**
  * **Task** được giao cho các **User** (assignedTo) thực hiện (Quan hệ N-N, multi-assignee).
  * Một **Task** có thể được chia nhỏ thành nhiều công việc con (Subtask) bằng cách tự tham chiếu qua trường `parentId` (1-N).
  * Nhiều **User** có thể thảo luận bằng cách tạo ra nhiều **TaskComment** bên trong một **Task** (1-N).
  * **Task** được gán nhãn tùy chỉnh thông qua liên kết với thực thể **Tag** (N-N).

---

## 4.3.2. Thiết kế Mô hình Dữ liệu Khái niệm (CDM)

Mô hình dữ liệu khái niệm (CDM - Conceptual Data Model) biểu diễn cấu trúc dữ liệu ở mức trừu tượng cao nhất, tập trung vào việc định hình các thực thể nghiệp vụ và mối quan hệ giữa chúng mà không bị phụ thuộc vào công nghệ lưu trữ hay hệ quản trị CSDL vật lý.

Trong hệ thống TeamFlow, các thực thể chính được xác định bao gồm:
*   **Thực thể cốt lõi (Core Entities):** `User` (Người dùng), `Workspace` (Không gian làm việc), `Project` (Dự án), `Task` (Công việc). Đây là những thực thể mang tính chất xương sống để vận hành luồng nghiệp vụ.
*   **Thực thể bổ trợ & tương tác (Supporting Entities):** `Member` (Thành viên liên kết giữa User và Workspace), `Role` (Quyền hạn cấu hình), `Phase` (Giai đoạn dự án), `Tag` (Nhãn phân loại), `TaskComment` (Bình luận trao đổi), `Inbox` (Hòm thư cá nhân), `AssetFolder` và `ProjectAsset` (Hệ thống lưu trữ tệp tài nguyên).
*   **Thực thể hệ thống & thống kê (System & Analytics Entities):** `Notification` (Thông báo đẩy), `ActivityLog` (Nhật ký kiểm toán hệ thống), `WorkspaceAnalyticsSnapshot` và `ProjectAnalyticsSnapshot` (Dữ liệu phục vụ vẽ biểu đồ thống kê hiệu suất).

Dưới đây là sơ đồ CDM (biểu diễn dưới dạng ERD mức khái niệm, chỉ bao gồm thực thể, quan hệ và bản số chỉ định, không bao gồm kiểu dữ liệu):

*(Vui lòng chèn Sơ đồ "Sơ đồ Dữ liệu Khái niệm - ERD Conceptual" được xuất từ file `ERD_Conceptual.puml` vào đây)*

---

## 4.3.3. Chuẩn hóa 1NF-3NF & Nguyên tắc Thiết kế NoSQL

Trong thiết kế CSDL Quan hệ, chuẩn hóa (Normalization) từ 1NF đến 3NF là bắt buộc để tránh dư thừa dữ liệu (Data Redundancy) và dị thường cập nhật (Update Anomaly).
* **1NF:** Mỗi ô chỉ chứa một giá trị nguyên tố.
* **2NF:** Đạt 1NF và không có thuộc tính không khóa phụ thuộc một phần vào khóa chính.
* **3NF:** Đạt 2NF và không có thuộc tính không khóa phụ thuộc bắc cầu vào khóa chính.

**Ví dụ Chuẩn hóa (Normalization) trong TeamFlow:**
Hệ thống **tách biệt** thực thể `User` (lưu profile: họ tên, email, avatar) và `Account` (lưu thông tin đăng nhập: password hash, provider, providerId). 
*Lý do:* Nếu gộp chung, thông tin nhạy cảm của Account có thể bị lộ khi ứng dụng chỉ cần lấy thông tin Profile cơ bản để hiển thị. Việc tách ra đảm bảo đạt chuẩn 3NF và tối ưu bảo mật.

**Tuy nhiên, do sử dụng MongoDB**, nguyên tắc thiết kế ưu tiên tốc độ đọc (Read Performance) hơn là tối ưu không gian lưu trữ cứng nhắc. Do đó, TeamFlow áp dụng **Nguyên tắc Cân bằng: Tham chiếu (Referencing) & Nhúng (Embedding)**:
* **Tham chiếu (Tương đương FK - Dùng để chuẩn hóa):** Dùng đối với các đối tượng có quan hệ 1-N lớn (One-to-Many, Unbounded) hoặc N-N. Ví dụ: `Task` lưu `projectId` để tham chiếu đến `Project` thay vì nhúng trực tiếp danh sách Task vào Project (vì số lượng Task có thể tăng lên hàng nghìn, vượt quá giới hạn 16MB một document của MongoDB).
* **Nhúng (Embedding - Phi chuẩn hóa / Denormalization):** Dùng để truy vấn siêu nhanh dữ liệu nhỏ, ít thay đổi. Ví dụ: Đối tượng `preferences` (Cài đặt hiển thị: `receiveDailyDigest`) được nhúng trực tiếp dạng Object lồng bên trong `User` thay vì tạo thành một bảng cấu hình riêng biệt, giúp giảm thiểu số lần Join (Lookup) tốn kém.

---

## 4.3.4. Thiết kế Mô hình Dữ liệu Logic (LDM)

Mô hình LDM liệt kê cấu trúc logic của các thực thể. Khóa chính (PK) được biểu diễn bằng chữ gạch chân `_id`, các khóa ngoại (FK) thể hiện mối quan hệ tham chiếu (Reference).

**1. Module Identity & Auth:**
* User(<u>_id</u>, name, email, password, profilePicture, isActive, lastLogin, currentWorkspace(FK), preferences, inboxToken, slackUserId)
* Account(<u>_id</u>, userId(FK), provider, providerId, refreshToken, tokenExpiry)
* Role(<u>_id</u>, name, permission)

**2. Module Workspace & Collaboration:**
* Workspace(<u>_id</u>, name, description, inviteCode, slackWebhookUrl, dailyDigestEnabled)
* Member(<u>_id</u>, userId(FK), workspaceId(FK), role(FK), joinedAt)
* Announcement(<u>_id</u>, workspaceId(FK), authorId(FK), title, content)
* ActivityLog(<u>_id</u>, actorId(FK), action, entityType, entityId, details)

**3. Module Project & Task Management:**
* Project(<u>_id</u>, name, description, status, workspaceId(FK), isDeleted)
* Phase(<u>_id</u>, name, description, projectId(FK))
* Task(<u>_id</u>, taskCode, title, description, projectId(FK), workspaceId(FK), parentId(FK), status, priority, assignedTo(FK), createdBy(FK), startDate, dueDate, completedAt, estimatedHours, loggedHours, tags(FK), phaseId(FK), requiresApproval, deletedAt)
* Tag(<u>_id</u>, name, color, workspaceId(FK))
* TaskComment(<u>_id</u>, content, authorId(FK), taskId(FK))
* Inbox(<u>_id</u>, userId(FK), title, description, status)

**4. Module Assets & Analytics:**
* AssetFolder(<u>_id</u>, name, parentId(FK), workspaceId(FK))
* ProjectAsset(<u>_id</u>, fileName, fileKey, fileSize, fileType, uploadedBy(FK), folderId(FK), projectId(FK))
* Notification(<u>_id</u>, recipientId(FK), senderId(FK), type, title, content, isRead)
* WorkspaceAnalyticsSnapshot(<u>_id</u>, workspaceId(FK), activeMembers, totalTasks, completedTasks, snapshotDate)
* ProjectAnalyticsSnapshot(<u>_id</u>, projectId(FK), burndownData, velocity, snapshotDate)

---

## 4.3.5. Thiết kế Mô hình Dữ liệu Vật lý (PDM)

Trong MongoDB, mô hình dữ liệu vật lý (PDM) được định nghĩa qua cấu trúc của các Collections và các quy tắc đặc tả thuộc tính của Schema (Mongoose). Dưới đây là đặc tả chi tiết cấu trúc vật lý của toàn bộ 18 Collections thực tế cấu thành nên hệ thống TeamFlow, đảm bảo tính đồng bộ tuyệt đối với mã nguồn.

### 1. Bảng (Collection): `users`
**Mô tả:** Lưu trữ thông tin định danh và thông tin cá nhân của người dùng.
| Tên trường (Field) | Kiểu dữ liệu (BSON Type) | Khóa (Key) | Ràng buộc (Constraint) | Mô tả |
| :--- | :--- | :---: | :--- | :--- |
| `_id` | ObjectId | PK | Mặc định | Khóa chính tự động sinh |
| `email` | String | | Required, Unique, lowercase, trim | Email dùng để đăng nhập hệ thống |
| `name` | String | | Trim | Họ tên đầy đủ hiển thị trên giao diện |
| `password` | String | | Select: false | Mật khẩu (được băm bằng bcrypt) |
| `profilePicture` | String | | Default: null | URL ảnh đại diện lưu trên R2 Cloud |
| `isActive` | Boolean | | Default: true | Trạng thái tài khoản đang hoạt động |
| `lastLogin` | Date | | Default: null | Thời điểm đăng nhập cuối cùng |
| `currentWorkspace` | ObjectId | FK | Ref: `Workspace`, Default: null | Workspace người dùng đang làm việc hiện tại |
| `preferences.receiveDailyDigest` | Boolean | | Default: true | Cấu hình bật/tắt nhận email tổng hợp hàng ngày |
| `inboxToken` | String | | Unique, index, auto-generated | Token định danh hòm thư cá nhân |
| `slackUserId` | String | | Default: null | ID liên kết tài khoản Slack cá nhân |
| `createdAt` | Date | | Mặc định | Thời điểm tạo tài khoản |
| `updatedAt` | Date | | Mặc định | Thời điểm cập nhật tài khoản gần nhất |

### 2. Bảng (Collection): `accounts`
**Mô tả:** Quản lý thông tin tài khoản liên kết đăng nhập (OAuth2 Google, Github...).
| Tên trường (Field) | Kiểu dữ liệu (BSON Type) | Khóa (Key) | Ràng buộc (Constraint) | Mô tả |
| :--- | :--- | :---: | :--- | :--- |
| `_id` | ObjectId | PK | Mặc định | Khóa chính tự động sinh |
| `provider` | String | | Required, Enum: `['GOOGLE', 'GITHUB', 'EMAIL']` | Nhà cung cấp dịch vụ định danh liên kết |
| `providerId` | String | | Required | ID của người dùng trên hệ thống provider |
| `userId` | ObjectId | FK | Required, Ref: `User` | ID của người dùng tương ứng trong database |
| `refreshToken` | String | | Default: null | Token dùng để cấp lại Access Token mới |
| `tokenExpiry` | Date | | Default: null | Thời hạn hết hạn của Refresh Token |
| `createdAt` | Date | | Mặc định | Thời điểm tạo bản ghi |
| `updatedAt` | Date | | Mặc định | Thời điểm cập nhật bản ghi gần nhất |

### 3. Bảng (Collection): `roles`
**Mô tả:** Lưu trữ các vai trò và cấu hình quyền hạn hệ thống (RBAC).
| Tên trường (Field) | Kiểu dữ liệu (BSON Type) | Khóa (Key) | Ràng buộc (Constraint) | Mô tả |
| :--- | :--- | :---: | :--- | :--- |
| `_id` | ObjectId | PK | Mặc định | Khóa chính tự động sinh |
| `name` | String | | Required, Unique, Enum: `['OWNER', 'ADMIN', 'MEMBER']` | Tên vai trò |
| `permission` | Array of String | | Required | Danh sách các quyền hạn được gán cho vai trò này |
| `createdAt` | Date | | Mặc định | Thời điểm tạo bản ghi |
| `updatedAt` | Date | | Mặc định | Thời điểm cập nhật bản ghi gần nhất |

### 4. Bảng (Collection): `workspaces`
**Mô tả:** Không gian làm việc chung chứa các dự án và các thành viên cộng tác.
| Tên trường (Field) | Kiểu dữ liệu (BSON Type) | Khóa (Key) | Ràng buộc (Constraint) | Mô tả |
| :--- | :--- | :---: | :--- | :--- |
| `_id` | ObjectId | PK | Mặc định | Khóa chính tự động sinh |
| `name` | String | | Required, Trim | Tên của Workspace |
| `description` | String | | Trim | Mô tả ngắn gọn về Workspace |
| `owner` | ObjectId | FK | Required, Ref: `User` | ID của người sở hữu Workspace |
| `inviteCode` | String | | Required, Unique | Mã mời tham gia Workspace |
| `slackWebhookUrl` | String | | Default: null, Trim | Cấu hình tích hợp Webhook thông báo Slack |
| `dailyDigestEnabled` | Boolean | | Default: true | Trạng thái bật/tắt gửi mail tổng hợp hàng ngày |
| `createdAt` | Date | | Mặc định | Thời điểm tạo Workspace |
| `updatedAt` | Date | | Mặc định | Thời điểm cập nhật Workspace gần nhất |

### 5. Bảng (Collection): `members`
**Mô tả:** Bảng liên kết trung gian xác định vai trò của người dùng trong một Workspace.
| Tên trường (Field) | Kiểu dữ liệu (BSON Type) | Khóa (Key) | Ràng buộc (Constraint) | Mô tả |
| :--- | :--- | :---: | :--- | :--- |
| `_id` | ObjectId | PK | Mặc định | Khóa chính tự động sinh |
| `userId` | ObjectId | FK | Required, Ref: `User` | ID của người dùng tham gia |
| `workspaceId` | ObjectId | FK | Required, Ref: `Workspace` | ID của Workspace tham gia |
| `role` | ObjectId | FK | Required, Ref: `Role` | ID vai trò của thành viên trong Workspace này |
| `joinedAt` | Date | | Default: Date.now | Thời điểm tham gia Workspace |
| `createdAt` | Date | | Mặc định | Thời điểm tạo bản ghi thành viên |
| `updatedAt` | Date | | Mặc định | Thời điểm cập nhật bản ghi gần nhất |

### 6. Bảng (Collection): `announcements`
**Mô tả:** Bản tin nội bộ của Workspace hoặc Dự án để chia sẻ thông báo chung.
| Tên trường (Field) | Kiểu dữ liệu (BSON Type) | Khóa (Key) | Ràng buộc (Constraint) | Mô tả |
| :--- | :--- | :---: | :--- | :--- |
| `_id` | ObjectId | PK | Mặc định | Khóa chính tự động sinh |
| `workspaceId` | ObjectId | FK | Required, Ref: `Workspace` | ID Workspace đăng tải bản tin |
| `projectId` | ObjectId | FK | Ref: `Project`, Default: null | ID Dự án liên quan nếu đăng trong dự án |
| `type` | String | | Enum: `['GENERAL', 'MILESTONE', 'ALERT']` | Phân loại bản tin |
| `title` | String | | Required | Tiêu đề của bản tin |
| `content` | String | | Validate logic | Nội dung chi tiết bản tin (Bắt buộc nếu không kèm file) |
| `isPinned` | Boolean | | Default: false | Trạng thái ghim bản tin lên đầu trang |
| `attachments` | Array of Object | | Nhúng (Embedded) | Danh sách file đính kèm (`fileUrl`, `fileName`, `fileType`) |
| `reactions` | Array of Object | | Nhúng (Embedded) | Danh sách cảm xúc (`emoji`, `userIds` (array FK -> User)) |
| `comments` | Array of Object | | Nhúng (Embedded) | Mảng bình luận (`_id`, `authorId`(FK), `content`, `reactions`, `mentions`, `replyTo`, `createdAt`) |
| `createdBy` | ObjectId | FK | Required, Ref: `User` | ID người dùng đăng tải bản tin |
| `deletedAt` | Date | | Default: null | Thời điểm xóa tạm bản tin |
| `createdAt` | Date | | Mặc định | Thời điểm tạo bản tin |
| `updatedAt` | Date | | Mặc định | Thời điểm cập nhật bản tin gần nhất |

### 7. Bảng (Collection): `activitylogs`
**Mô tả:** Nhật ký lưu vết (Audit Trail) toàn bộ thao tác thay đổi dữ liệu của người dùng.
| Tên trường (Field) | Kiểu dữ liệu (BSON Type) | Khóa (Key) | Ràng buộc (Constraint) | Mô tả |
| :--- | :--- | :---: | :--- | :--- |
| `_id` | ObjectId | PK | Mặc định | Khóa chính tự động sinh |
| `workspaceId` | ObjectId | FK | Required, Ref: `Workspace` | ID Workspace diễn ra thao tác |
| `projectId` | ObjectId | FK | Ref: `Project`, Default: null | ID Dự án liên quan đến thao tác (nếu có) |
| `userId` | ObjectId | FK | Required, Ref: `User` | ID người dùng thực hiện thao tác |
| `action` | String | | Required | Hành động (Ví dụ: `CREATE_TASK`, `DELETE_PROJECT`) |
| `entityType` | String | | Required | Loại đối tượng bị tác động (`TASK`, `PROJECT`...) |
| `entityId` | ObjectId | | Required | ID cụ thể của đối tượng bị tác động |
| `details.oldValue` | Mixed | | | Giá trị dữ liệu cũ trước khi sửa |
| `details.newValue` | Mixed | | | Giá trị dữ liệu mới sau khi sửa |
| `details.summary` | String | | | Đoạn văn tóm tắt hành động hiển thị trên UI |
| `createdAt` | Date | | Mặc định | Thời điểm phát sinh hành động |

### 8. Bảng (Collection): `projects`
**Mô tả:** Quản lý thông tin chi tiết của dự án trong không gian làm việc.
| Tên trường (Field) | Kiểu dữ liệu (BSON Type) | Khóa (Key) | Ràng buộc (Constraint) | Mô tả |
| :--- | :--- | :---: | :--- | :--- |
| `_id` | ObjectId | PK | Mặc định | Khóa chính tự động sinh |
| `name` | String | | Required, Trim | Tên dự án |
| `description` | String | | Trim | Mô tả chi tiết dự án |
| `emoji` | String | | Default: "🎯", Trim | Biểu tượng đại diện dự án |
| `workspaceId` | ObjectId | FK | Required, Ref: `Workspace` | ID Workspace chứa dự án này |
| `createdBy` | ObjectId | FK | Required, Ref: `User` | ID người dùng khởi tạo dự án |
| `status` | String | | Enum: `['active', 'completed', 'archived']` | Trạng thái hiện tại của dự án |
| `startDate` | Date | | Default: null | Ngày bắt đầu dự án |
| `endDate` | Date | | Default: null | Ngày kết thúc dự kiến của dự án |
| `deletedAt` | Date | | Default: null | Thời điểm xóa tạm dự án (cho Thùng rác) |
| `viewCount` | Number | | Default: 0 | Tổng số lượng truy cập xem dự án |
| `lastAccessedAt` | Date | | Default: Date.now | Thời điểm truy cập gần nhất |
| `coverUrl` | String | | Default: null | URL ảnh nền (Cover) của dự án |
| `coverPositionX` | Number | | Default: 50 | Tọa độ X căn chỉnh ảnh nền |
| `coverPositionY` | Number | | Default: 50 | Tọa độ Y căn chỉnh ảnh nền |
| `favoritedBy` | Array of ObjectId | FK | Ref: `User`, Default: `[]` | Mảng chứa các ID User đã thích dự án này |
| `slackWebhookUrl` | String | | Default: null, Trim | Webhook gửi thông báo hoạt động dự án lên Slack |
| `createdAt` | Date | | Mặc định | Thời điểm tạo dự án |
| `updatedAt` | Date | | Mặc định | Thời điểm cập nhật dự án gần nhất |

### 9. Bảng (Collection): `phases`
**Mô tả:** Các giai đoạn chính (Milestones) cấu thành nên lộ trình dự án.
| Tên trường (Field) | Kiểu dữ liệu (BSON Type) | Khóa (Key) | Ràng buộc (Constraint) | Mô tả |
| :--- | :--- | :---: | :--- | :--- |
| `_id` | ObjectId | PK | Mặc định | Khóa chính tự động sinh |
| `workspaceId` | ObjectId | FK | Required, Ref: `Workspace` | ID Workspace chứa giai đoạn |
| `projectId` | ObjectId | FK | Required, Ref: `Project` | ID Dự án chứa giai đoạn này |
| `name` | String | | Required, Trim | Tên giai đoạn công việc |
| `description` | String | | Trim | Mô tả nội dung giai đoạn |
| `startDate` | Date | | Default: null | Ngày bắt đầu giai đoạn |
| `endDate` | Date | | Default: null | Ngày kết thúc dự kiến của giai đoạn |
| `isLocked` | Boolean | | Default: false | Trạng thái khóa giai đoạn (không cho sửa đổi) |
| `createdBy` | ObjectId | FK | Required, Ref: `User` | ID người dùng tạo giai đoạn |
| `deletedAt` | Date | | Default: null | Thời điểm xóa tạm giai đoạn |
| `createdAt` | Date | | Mặc định | Thời điểm tạo giai đoạn |
| `updatedAt` | Date | | Mặc định | Thời điểm cập nhật giai đoạn gần nhất |

### 10. Bảng (Collection): `tasks`
**Mô tả:** Lưu trữ thông tin chi tiết của công việc, subtasks, phân quyền thực hiện và nhãn dán.
| Tên trường (Field) | Kiểu dữ liệu (BSON Type) | Khóa (Key) | Ràng buộc (Constraint) | Mô tả |
| :--- | :--- | :---: | :--- | :--- |
| `_id` | ObjectId | PK | Mặc định | Khóa chính tự động sinh |
| `taskCode` | String | | Required | Mã rút gọn hiển thị (Ví dụ: CODE-22) |
| `title` | String | | Required | Tiêu đề công việc |
| `description` | String | | | Mô tả chi tiết yêu cầu công việc |
| `projectId` | ObjectId | FK | Required, Ref: `Project` | ID dự án chứa công việc này |
| `workspaceId` | ObjectId | FK | Required, Ref: `Workspace` | ID Workspace chứa công việc này |
| `parentId` | ObjectId | FK | Ref: `Task`, Default: null | ID công việc cha (nếu đây là subtask) |
| `status` | String | | Enum: `['todo', 'in_progress', 'done']` | Trạng thái của công việc trên Kanban |
| `priority` | String | | Enum: `['low', 'medium', 'high', 'urgent']` | Độ ưu tiên của công việc |
| `assignedTo` | Array of ObjectId | FK | Ref: `User`, Default: `[]` | Mảng chứa các ID User thực hiện |
| `createdBy` | ObjectId | FK | Required, Ref: `User` | ID người dùng tạo công việc |
| `startDate` | Date | | Default: null | Ngày bắt đầu thực hiện công việc |
| `dueDate` | Date | | Default: null | Hạn chót hoàn thành công việc |
| `completedAt` | Date | | Default: null | Thời điểm thực tế công việc hoàn thành |
| `estimatedHours` | Number | | Default: 0 | Số giờ dự kiến thực hiện |
| `loggedHours` | Number | | Default: 0 | Số giờ thực tế đã log làm việc |
| `phaseId` | ObjectId | FK | Ref: `Phase`, Default: null | ID giai đoạn dự án chứa công việc |
| `tags` | Array of ObjectId | FK | Ref: `Tag`, Default: `[]` | Các nhãn dán gán cho công việc này |
| `requiresApproval` | Boolean | | Default: false | Công việc cần quản lý phê duyệt để hoàn thành |
| `overdueNotificationSent` | Boolean | | Default: false | Trạng thái đã gửi mail báo trễ hạn hay chưa |
| `deletedAt` | Date | | Default: null | Thời điểm xóa tạm công việc |
| `createdAt` | Date | | Mặc định | Thời điểm tạo công việc |
| `updatedAt` | Date | | Mặc định | Thời điểm cập nhật công việc gần nhất |

### 11. Bảng (Collection): `tags`
**Mô tả:** Nhãn dán phân loại công việc được cấu hình riêng theo từng Workspace.
| Tên trường (Field) | Kiểu dữ liệu (BSON Type) | Khóa (Key) | Ràng buộc (Constraint) | Mô tả |
| :--- | :--- | :---: | :--- | :--- |
| `_id` | ObjectId | PK | Mặc định | Khóa chính tự động sinh |
| `workspaceId` | ObjectId | FK | Required, Ref: `Workspace` | ID Workspace quản lý nhãn |
| `name` | String | | Required, Trim | Tên hiển thị của nhãn |
| `color` | String | | Required | Mã màu HEX hiển thị nhãn (Ví dụ: `#FF0000`) |
| `createdBy` | ObjectId | FK | Required, Ref: `User` | ID người dùng tạo nhãn |
| `createdAt` | Date | | Mặc định | Thời điểm tạo nhãn |
| `updatedAt` | Date | | Mặc định | Thời điểm cập nhật nhãn gần nhất |

### 12. Bảng (Collection): `taskcomments`
**Mô tả:** Các thảo luận, tương tác, bình luận bên trong thẻ công việc (Task).
| Tên trường (Field) | Kiểu dữ liệu (BSON Type) | Khóa (Key) | Ràng buộc (Constraint) | Mô tả |
| :--- | :--- | :---: | :--- | :--- |
| `_id` | ObjectId | PK | Mặc định | Khóa chính tự động sinh |
| `taskId` | ObjectId | FK | Required, Ref: `Task` | ID công việc được bình luận |
| `authorId` | ObjectId | FK | Ref: `User`, Default: null | ID người bình luận (null nếu là bot hệ thống) |
| `workspaceId` | ObjectId | FK | Required, Ref: `Workspace` | ID Workspace chứa bình luận |
| `content` | String | | Required | Nội dung văn bản thảo luận |
| `type` | String | | Enum: `['USER', 'SYSTEM']` | Loại bình luận (do User nhập hoặc System tự sinh) |
| `reactions` | Array of Object | | Nhúng (Embedded) | Cảm xúc (`emoji`, `userIds` (array FK -> User)) |
| `replyTo` | ObjectId | FK | Ref: `TaskComment`, Default: null | ID bình luận cha (hỗ trợ phân luồng thảo luận) |
| `mentions` | Array of ObjectId | FK | Ref: `User`, Default: `[]` | Mảng chứa ID các User được tag tên |
| `isEdited` | Boolean | | Default: false | Trạng thái bình luận đã bị chỉnh sửa |
| `createdAt` | Date | | Mặc định | Thời điểm viết bình luận |
| `updatedAt` | Date | | Mặc định | Thời điểm cập nhật bình luận gần nhất |

### 13. Bảng (Collection): `personalinboxes`
**Mô tả:** Hòm thư gom công việc cá nhân từ nhiều nguồn tích hợp (Email, Slack, Thủ công).
| Tên trường (Field) | Kiểu dữ liệu (BSON Type) | Khóa (Key) | Ràng buộc (Constraint) | Mô tả |
| :--- | :--- | :---: | :--- | :--- |
| `_id` | ObjectId | PK | Mặc định | Khóa chính tự động sinh |
| `ownerId` | ObjectId | FK | Required, Ref: `User` | ID User chủ sở hữu hòm thư này |
| `title` | String | | Required, Trim | Tiêu đề email/tin nhắn được đưa vào Inbox |
| `description` | String | | Default: "" | Mô tả ngắn gọn tin nhắn/email |
| `sourceType` | String | | Enum: `['MANUAL', 'EMAIL', 'SLACK']` | Nguồn gốc tin nhắn |
| `sourceMetadata` | Mixed | | Default: `{}` | Dữ liệu gốc đi kèm từ nguồn (VD: link tin nhắn Slack) |
| `status` | String | | Enum: `['DRAFT', 'OPEN', 'CONVERTED', 'ARCHIVED']` | Trạng thái xử lý của thư |
| `metadata` | Mixed | | Default: `{}` | Siêu dữ liệu mở rộng phục vụ hệ thống |
| `createdAt` | Date | | Mặc định | Thời điểm thư đi vào Inbox |
| `updatedAt` | Date | | Mặc định | Thời điểm cập nhật trạng thái thư |

### 14. Bảng (Collection): `assetfolders`
**Mô tả:** Cây thư mục quản lý tệp tài nguyên đính kèm của dự án.
| Tên trường (Field) | Kiểu dữ liệu (BSON Type) | Khóa (Key) | Ràng buộc (Constraint) | Mô tả |
| :--- | :--- | :---: | :--- | :--- |
| `_id` | ObjectId | PK | Mặc định | Khóa chính tự động sinh |
| `workspaceId` | ObjectId | FK | Required, Ref: `Workspace` | ID Workspace chứa thư mục |
| `projectId` | ObjectId | FK | Required, Ref: `Project` | ID Dự án chứa thư mục |
| `phaseId` | ObjectId | FK | Ref: `Phase`, Default: null | ID Giai đoạn liên kết với thư mục |
| `parentFolderId` | ObjectId | FK | Ref: `AssetFolder`, Default: null | ID thư mục cha (xây dựng cấu trúc cây thư mục) |
| `name` | String | | Required, Trim | Tên của thư mục tài nguyên |
| `visibility` | String | | Enum: `['PUBLIC', 'PRIVATE']` | Quyền truy cập thư mục |
| `createdBy` | ObjectId | FK | Required, Ref: `User` | ID người dùng tạo thư mục |
| `deletedAt` | Date | | Default: null | Thời điểm xóa tạm thư mục |
| `createdAt` | Date | | Mặc định | Thời điểm tạo thư mục |
| `updatedAt` | Date | | Mặc định | Thời điểm cập nhật thư mục gần nhất |

### 15. Bảng (Collection): `projectassets`
**Mô tả:** Các tệp tin tài nguyên được tải lên hệ thống đính kèm trong các Folder/Dự án/Task.
| Tên trường (Field) | Kiểu dữ liệu (BSON Type) | Khóa (Key) | Ràng buộc (Constraint) | Mô tả |
| :--- | :--- | :---: | :--- | :--- |
| `_id` | ObjectId | PK | Mặc định | Khóa chính tự động sinh |
| `workspaceId` | ObjectId | FK | Required, Ref: `Workspace` | ID Workspace chứa file |
| `projectId` | ObjectId | FK | Required, Ref: `Project` | ID Dự án chứa file |
| `folderId` | ObjectId | FK | Ref: `AssetFolder`, Default: null | ID Thư mục chứa file này |
| `phaseId` | ObjectId | FK | Ref: `Phase`, Default: null | ID Giai đoạn liên kết (nếu có) |
| `taskId` | ObjectId | FK | Ref: `Task`, Default: null | ID Công việc liên kết (nếu upload từ comment/task) |
| `name` | String | | Required, Trim | Tên tệp tin hiển thị |
| `storageProvider` | String | | Enum: `['R2', 'DRIVE', 'CLOUDINARY']` | Nơi lưu trữ tệp vật lý |
| `storageKey` | String | | Required | Key định danh tệp tin trên hệ thống lưu trữ đám mây |
| `fileUrl` | String | | Required | Đường dẫn URL tải file trực tiếp |
| `fileSize` | Number | | Required | Dung lượng file (tính theo Bytes) |
| `fileType` | String | | Required | Định dạng file (MIME-Type) |
| `category` | String | | Enum: `['GENERAL', 'STRATEGY', 'DELIVERABLE']` | Phân loại tài nguyên dự án |
| `status` | String | | Enum: `['PENDING', 'APPROVED', 'REJECTED']` | Trạng thái kiểm duyệt file |
| `createdBy` | ObjectId | FK | Required, Ref: `User` | ID người dùng tải file lên |
| `deletedAt` | Date | | Default: null | Thời điểm xóa tạm file |
| `createdAt` | Date | | Mặc định | Thời điểm tải file lên |
| `updatedAt` | Date | | Mặc định | Thời điểm cập nhật file gần nhất |

### 16. Bảng (Collection): `notifications`
**Mô tả:** Thông báo đẩy gửi đến người dùng khi có sự thay đổi nghiệp vụ.
| Tên trường (Field) | Kiểu dữ liệu (BSON Type) | Khóa (Key) | Ràng buộc (Constraint) | Mô tả |
| :--- | :--- | :---: | :--- | :--- |
| `_id` | ObjectId | PK | Mặc định | Khóa chính tự động sinh |
| `recipientId` | ObjectId | FK | Required, Ref: `User` | ID người dùng nhận thông báo |
| `senderId` | ObjectId | FK | Required, Ref: `User` | ID người dùng kích hoạt hành động thông báo |
| `workspaceId` | ObjectId | FK | Required, Ref: `Workspace` | ID Workspace diễn ra sự kiện |
| `type` | String | | Required | Loại sự kiện thông báo (Ví dụ: `TASK_ASSIGNED`) |
| `title` | String | | Required | Tiêu đề thông báo hiển thị |
| `message` | String | | Required | Nội dung văn bản thông báo |
| `isRead` | Boolean | | Default: false | Trạng thái đã đọc/chưa đọc |
| `refId` | ObjectId | | Required | ID của đối tượng liên quan (ID Task, ID Project...) |
| `refType` | String | | Required, Enum: `['Task', 'Project', 'Announcement']` | Phân loại đối tượng liên quan để xử lý điều hướng |
| `metadata` | Mixed | | | Dữ liệu bổ sung đi kèm thông báo |
| `createdAt` | Date | | Mặc định, TTL: 15 ngày | Thời điểm tạo thông báo (Tự động xóa sau 15 ngày) |

### 17. Bảng (Collection): `workspaceanalyticssnapshots`
**Mô tả:** Dữ liệu thống kê hiệu suất chụp nhanh theo ngày của Workspace.
| Tên trường (Field) | Kiểu dữ liệu (BSON Type) | Khóa (Key) | Ràng buộc (Constraint) | Mô tả |
| :--- | :--- | :---: | :--- | :--- |
| `_id` | ObjectId | PK | Mặc định | Khóa chính tự động sinh |
| `workspaceId` | ObjectId | FK | Required, Ref: `Workspace` | ID Workspace cần thống kê |
| `date` | Date | | Required | Ngày tạo thống kê snapshot |
| `totalTasks` | Number | | Default: 0 | Tổng số lượng công việc tại thời điểm thống kê |
| `completedTasks` | Number | | Default: 0 | Số lượng công việc đã hoàn thành |
| `inProgressTasks` | Number | | Default: 0 | Số lượng công việc đang thực hiện |
| `overdueTasks` | Number | | Default: 0 | Số lượng công việc bị trễ hạn |
| `totalProjects` | Number | | Default: 0 | Tổng số lượng dự án trong Workspace |
| `createdAt` | Date | | Mặc định | Thời điểm tạo thống kê (chỉ ghi nhận tạo) |

### 18. Bảng (Collection): `projectanalyticssnapshots`
**Mô tả:** Dữ liệu thống kê hiệu suất chụp nhanh theo ngày của từng Dự án (để vẽ Burndown/Chỉ số).
| Tên trường (Field) | Kiểu dữ liệu (BSON Type) | Khóa (Key) | Ràng buộc (Constraint) | Mô tả |
| :--- | :--- | :---: | :--- | :--- |
| `_id` | ObjectId | PK | Mặc định | Khóa chính tự động sinh |
| `projectId` | ObjectId | FK | Required, Ref: `Project` | ID Dự án thống kê |
| `workspaceId` | ObjectId | FK | Required, Ref: `Workspace` | ID Workspace quản lý dự án |
| `date` | Date | | Required | Ngày ghi nhận thống kê snapshot |
| `totalTasks` | Number | | Default: 0 | Tổng số lượng công việc trong dự án |
| `completedTasks` | Number | | Default: 0 | Số lượng công việc đã hoàn thành |
| `inProgressTasks` | Number | | Default: 0 | Số lượng công việc đang thực hiện |
| `overdueTasks` | Number | | Default: 0 | Số lượng công việc bị trễ hạn |
| `unassignedTasks` | Number | | Default: 0 | Số lượng công việc chưa gán người thực hiện |
| `dailyCompletedTasks` | Number | | Default: 0 | Số lượng công việc hoàn thành trong ngày chụp snapshot |
| `performanceIndex` | Number | | Default: 0 | Chỉ số hiệu suất tiến độ dự án (tính theo %) |
| `createdAt` | Date | | Mặc định | Thời điểm tạo thống kê |

---

## 4.3.6. Ràng buộc & Tối ưu hóa (Index)

Thay vì thiết lập ràng buộc ở tầng Database Engine bằng các thủ tục cứng nhắc như SQL Server, TeamFlow sử dụng **Mongoose Schema Validation** ở tầng Application kết hợp với các chỉ mục (Indexes) cấp DB.

**1. Ràng buộc Dữ liệu Toàn vẹn (Integrity Constraints):**
* **Ràng buộc Miền (Domain Constraint):** Sử dụng `enum` để giới hạn các giá trị cho phép (Ví dụ: `status` của Task chỉ được phép là `todo`, `in_progress`, `done`).
* **Ràng buộc Duy nhất (Unique Constraint):** Sử dụng thuộc tính `unique: true` để đảm bảo tính duy nhất, ví dụ trường `email` của `User`, `inviteCode` của `Workspace`.
* **Tính toán và Mặc định:** Sử dụng tham số `default` để cấp giá trị ban đầu, và các hàm setter để chuẩn hóa chuỗi (như `lowercase: true`, `trim: true`).

**2. Chiến lược Đánh chỉ mục (Indexing Strategy):**
Hệ thống sử dụng các *Compound Indexes* (Chỉ mục phức hợp) trên MongoDB để tăng tốc các câu lệnh Query thường xuyên sử dụng:
* `Member`: Tạo index `{ workspaceId: 1, userId: 1 }` dạng `unique: true` (Bảo đảm 1 User chỉ thuộc 1 Workspace với 1 vai trò duy nhất tại một thời điểm, tránh trùng lặp dữ liệu thành viên).
* `Task`: Tạo index trên `{ projectId: 1, status: 1 }` và `{ workspaceId: 1, status: 1 }` hỗ trợ truy vấn lọc các công việc theo dự án trên màn hình Kanban Board với hiệu năng O(logN).
* `Task`: Tạo index `{ projectId: 1, taskCode: 1 }` dạng `unique: true` đảm bảo mã công việc hiển thị không bao giờ bị trùng lặp trong phạm vi một dự án.
* `Project`: Tạo index `{ workspaceId: 1, status: 1 }` hỗ trợ load danh sách dự án cực nhanh khi truy cập Sidebar hoặc Dashboard.

---

## 4.3.7. Database Diagram (Biểu đồ CSDL Vật lý)
*(Vui lòng xem Hình "Sơ đồ CSDL Vật lý - ERD Physical" đính kèm bên dưới)*.
*(Đối với báo cáo luận văn, sinh viên nên sử dụng công cụ **MongoDB Compass** > Chọn thẻ **Schema** > **Analyze Data** để chụp màn hình giao diện cấu trúc thực tế của từng Collection và đưa vào phụ lục nhằm tăng tính khách quan).*

---

## 4.3.8. Trích đoạn Script Khởi tạo CSDL (Mongoose Schemas)

Vì hệ thống TeamFlow sử dụng cơ sở dữ liệu phi quan hệ MongoDB làm nền tảng lưu trữ, quá trình khởi tạo cấu trúc dữ liệu không sử dụng các lệnh SQL `CREATE TABLE` tĩnh mà được định nghĩa thông qua các **Mongoose Schemas** viết bằng TypeScript/JavaScript tại tầng Application. Dưới đây là trích đoạn mã nguồn định nghĩa cấu trúc vật lý của 02 Collection cốt lõi và quan trọng nhất trong hệ thống: `users` và `tasks`.

### 1. Trích đoạn Schema Người dùng (`users` Collection)
Định nghĩa trong file `backend/src/models/user.model.ts`:
```typescript
import mongoose, { Schema, model } from "mongoose";
import crypto from "crypto";

export interface UserDocument extends mongoose.Document {
    name: string;
    email: string;
    password?: string;
    profilePicture: string | null;
    isActive: boolean;
    lastLogin: Date | null;
    currentWorkspace: mongoose.Types.ObjectId | null;
    preferences: {
        receiveDailyDigest: boolean;
    };
    inboxToken: string;
    slackUserId: string | null;
}

const userSchema = new Schema<UserDocument>(
    {
        name: { type: String, required: false, trim: true },
        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
        },
        password: { type: String, required: false, select: false },
        profilePicture: { type: String, default: null },
        isActive: { type: Boolean, default: true },
        lastLogin: { type: Date, default: null },
        currentWorkspace: { type: Schema.Types.ObjectId, ref: "Workspace", default: null },
        preferences: {
            receiveDailyDigest: { type: Boolean, default: true },
        },
        inboxToken: { 
            type: String, 
            unique: true, 
            index: true,
            default: () => crypto.randomBytes(8).toString("hex") 
        },
        slackUserId: { type: String, default: null },
    },
    {
        timestamps: true, // Tự động tạo và quản lý createdAt, updatedAt
    }
);

const UserModel = model<UserDocument>("User", userSchema);
export default UserModel;
```

### 2. Trích đoạn Schema Công việc (`tasks` Collection)
Định nghĩa trong file `backend/src/models/task.model.ts`:
```typescript
import mongoose, { Schema, model } from "mongoose";
import { TaskPriorityEnum, TaskPriorityEnumType, TaskStatusEnum, TaskStatusEnumType } from "../enums/task.enum";

export interface TaskDocument extends mongoose.Document {
    taskCode: string;
    title: string;
    description: string | null;
    projectId: mongoose.Types.ObjectId;
    workspaceId: mongoose.Types.ObjectId;
    parentId: mongoose.Types.ObjectId | null;
    status: TaskStatusEnumType;
    priority: TaskPriorityEnumType;
    assignedTo: mongoose.Types.ObjectId[];
    createdBy: mongoose.Types.ObjectId;
    startDate: Date | null;
    dueDate: Date | null;
    completedAt: Date | null;
    estimatedHours: number;
    loggedHours: number;
    phaseId: mongoose.Types.ObjectId | null;
    tags: mongoose.Types.ObjectId[];
    deletedAt: Date | null;
    requiresApproval: boolean;
}

const taskSchema = new Schema<TaskDocument>({
    taskCode: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String },
    projectId: { type: mongoose.Types.ObjectId, ref: "Project", required: true },
    workspaceId: { type: mongoose.Types.ObjectId, ref: "Workspace", required: true },
    parentId: { type: Schema.Types.ObjectId, ref: "Task", default: null },
    status: { type: String, enum: Object.values(TaskStatusEnum), default: TaskStatusEnum.TODO },
    priority: { type: String, enum: Object.values(TaskPriorityEnum), default: TaskPriorityEnum.MEDIUM },
    assignedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    createdBy: { type: mongoose.Types.ObjectId, ref: "User", required: true },
    startDate: { type: Date, default: null },
    dueDate: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    estimatedHours: { type: Number, default: 0 },
    loggedHours: { type: Number, default: 0 },
    tags: [{ type: mongoose.Schema.Types.ObjectId, ref: "Tag" }],
    phaseId: { type: Schema.Types.ObjectId, ref: "Phase", default: null },
    requiresApproval: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
}, {
    timestamps: true
});

// Định nghĩa các chỉ mục (Indexes) để tối ưu hiệu năng truy vấn
taskSchema.index({ workspaceId: 1, status: 1 });
taskSchema.index({ projectId: 1, status: 1 });
taskSchema.index({ completedAt: 1 });
taskSchema.index({ parentId: 1 });
taskSchema.index({ deletedAt: 1 });
taskSchema.index({ assignedTo: 1 });
taskSchema.index({ projectId: 1, taskCode: 1 }, { unique: true });

const TaskModel = model<TaskDocument>("Task", taskSchema);
export default TaskModel;
```

*(Toàn bộ 16 Schema còn lại của hệ thống được trích dẫn chi tiết tại phần Phụ lục).*

---

# KẾT LUẬN CHƯƠNG 4

Chương 4 "Phân tích và Thiết kế hệ thống" đóng vai trò là nền tảng lý thuyết và kỹ thuật cốt lõi giúp hiện thực hóa ý tưởng của đề tài TeamFlow thành các thành phần cụ thể. Thông qua quá trình phân tích và thiết kế, các kết quả chính đã đạt được bao gồm:
1.  **Phân tích nghiệp vụ hệ thống:** Làm rõ bài toán quản lý quy trình cộng tác làm việc nhóm, phân tích các tác nhân (User, Member, Workspace Owner), vẽ sơ đồ Use Case và biểu diễn chi tiết luồng xử lý của các tính năng quan trọng bằng sơ đồ Activity.
2.  **Thiết kế kiến trúc và xử lý:** Lựa chọn và mô tả cấu trúc kiến trúc 3-Tier kết hợp mô hình Client-Server. Xây dựng Class Diagram cho toàn bộ hệ thống và chi tiết hóa các kịch bản tương tác quan trọng thông qua Sequence Diagram.
3.  **Thiết kế cơ sở dữ liệu:** Ánh xạ thành công thế giới thực thể nghiệp vụ vào mô hình cơ sở dữ liệu phi quan hệ MongoDB. Thiết kế mô hình ERD mức Khái niệm (CDM), chuyển đổi sang cấu trúc Logic (LDM), mô tả chi tiết thuộc tính vật lý (PDM) của các Collection trọng tâm, đồng thời thiết lập các chiến lược đánh chỉ mục (Index) và ràng buộc dữ liệu toàn vẹn trên tầng ứng dụng.

Tất cả các tài liệu và thiết kế chi tiết trên đã sẵn sàng để chuyển giao sang **Chương 5: Cài đặt và Thử nghiệm hệ thống**, nơi chúng tôi sẽ mô tả chi tiết môi trường phát triển, hiện thực hóa mã nguồn (Implementation) và thực hiện các quy trình kiểm thử (Testing) để đánh giá chất lượng sản phẩm.

