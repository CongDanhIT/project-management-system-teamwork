# HƯỚNG DẪN CHẠY DỰ ÁN TEAMSYNC (DÀNH CHO GIẢNG VIÊN)

## 1. Môi trường yêu cầu
- Node.js (phiên bản 18 trở lên)
- MongoDB (để chạy CSDL local)

## 2. Cách chạy Source Code
1. Mở terminal tại thư mục `backend`, chạy lệnh: `npm install` sau đó `npm run dev`
2. Mở terminal tại thư mục `frontend`, chạy lệnh: `npm install` sau đó `npm run dev`

## 3. Hướng dẫn Import CSDL (Dữ liệu Demo)
Em có đính kèm file `Database_Demo_TeamSync.zip` chứa dữ liệu mẫu để Thầy dễ dàng chấm bài.
Cách import bằng MongoDB Compass:
1. Mở MongoDB Compass, kết nối vào localhost:27017.
2. Tạo một Database mới tên là: `teamsync_db`.
3. Tạo các Collection tương ứng.
4. Bấm vào nút **Add Data -> Import JSON/CSV file** và chọn các file JSON em đã nén trong file Zip.

*(Lưu ý: Nếu Thầy không muốn import, Thầy có thể sử dụng chuỗi kết nối Cloud của em đã cấu hình sẵn trong file backend/.env để chấm trực tiếp).*

## 4. Tài khoản Demo có sẵn
Để tiện cho việc test phân quyền, em đã tạo sẵn các tài khoản sau:
- **Tài khoản Admin / Quản lý:**
  - Email: [ĐIỀN EMAIL ADMIN VÀO ĐÂY]
  - Mật khẩu: [ĐIỀN MẬT KHẨU VÀO ĐÂY]
  
- **Tài khoản Nhân viên 1:**
  - Email: [ĐIỀN EMAIL NHÂN VIÊN VÀO ĐÂY]
  - Mật khẩu: [ĐIỀN MẬT KHẨU VÀO ĐÂY]
