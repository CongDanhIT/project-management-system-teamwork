# 📑 Tài liệu Kỹ thuật: Nguyên tắc "Early Return" trong Express.js Controllers

## 1. Khái niệm cốt lõi (Core Concept)
Trong Express.js, bộ công cụ xử lý request bao gồm `req` (Request) và `res` (Response). Nguyên tắc vàng tuyệt đối là:
**"Một HTTP Request chỉ được phép có đúng MỘT HTTP Response."**

Các hàm như `res.json()`, `res.send()`, `res.redirect()`, hay `res.end()` có nhiệm vụ:
- Gắn Header cho HTTP Response.
- Gửi dữ liệu về cho Client (Trình duyệt/App).

**Tuy nhiên:** Gọi `res.xxx()` **KHÔNG** làm kết thúc việc thực thi của hàm JavaScript hiện tại. Nếu bạn không sử dụng từ khóa `return` để thoát hàm, các dòng code bên dưới sẽ tiếp tục chạy, dẫn đến việc gọi lại hàm `res...` lần thứ hai và gây lỗi sập Server.

---

## 2. Thông báo lỗi thảm họa (The Nightmare Error)
Nếu bạn vi phạm nguyên tắc trên, console của Server sẽ xuất hiện dòng lỗi đỏ "huyền thoại" này:
> `Error [ERR_HTTP_HEADERS_SENT]: Cannot set headers after they are sent to the client`

Lỗi này làm crash luồng xử lý luồng, làm chậm ứng dụng và tiềm ẩn nguy cơ bảo mật rò rỉ dữ liệu (vì code thừa vẫn chạy).

---

## 3. Cách triển khai chuẩn (Best Practice)
Hãy luôn kết hợp từ khóa `return` với lệnh gọi `res...` khi đoạn code đó kiểm tra một rẽ nhánh (if/else) không phải là đích đến cuối cùng của hàm. Kỹ thuật này được gọi là **Early Return (Thoát sớm)**.

### ❌ Mã xấu (Bad Code)
```typescript
export const loginController = async (req: Request, res: Response) => {
    const { email, password } = req.body;

    // Phân luồng 1: Thiếu dữ liệu (QUÊN RETURN)
    if (!email || !password) {
        res.status(400).json({ message: "Vui lòng nhập đủ email và mật khẩu" });
    }

    // Luồng tiếp tục chạy xuống đây dù đã gửi lỗi 400!
    const user = await UserModel.findOne({ email });
    
    // Phân luồng 2: Sai mật khẩu (QUÊN RETURN)
    if (!user) {
        res.status(401).json({ message: "Tài khoản không tồn tại" });
    }

    // Luồng cuối: Thành công (Server sẽ crash nếu rơi vào luồng 1 hoặc 2)
    res.status(200).json({ message: "Đăng nhập thành công", user });
};
```

### ✅ Mã chuẩn (Clean & Safe Code)
```typescript
export const loginController = async (req: Request, res: Response) => {
    const { email, password } = req.body;

    // THOÁT SỚM: Có `return` cắt ngang hàm ngay lập tức
    if (!email || !password) {
        return res.status(400).json({ message: "Vui lòng nhập đủ email và mật khẩu" });
    }

    const user = await UserModel.findOne({ email });
    
    // THOÁT SỚM lần 2
    if (!user) {
        return res.status(401).json({ message: "Tài khoản không tồn tại" });
    }

    // KẾT THÚC HÀM: Không bắt buộc có return, nhưng nên có để đồng nhất code
    return res.status(200).json({ message: "Đăng nhập thành công", user });
};
```

---

## 4. Lợi ích khi dùng "Early Return"
1. **Tránh lỗi Headers Sent:** 100% không bao giờ gặp lỗi Crash liên quan đến Response nhầm lẫn.
2. **Loại bỏ "Mê cung If/Else" (Arrow Code):** Code thẳng hàng, thay vì phải lồng `if... else...` nhiều tầng khiến code bị đẩy lùi vào trong rất khó đọc.
3. **Tiết kiệm tài nguyên:** Thoát sớm ngăn việc truy vấn Database (`UserModel.findOne`) dư thừa nếu chỉ vì thiếu tham số `email`.
4. **Bảo mật logic:** Không cho phép code "vô ý" lách xuống luồng xử lý thành công.
