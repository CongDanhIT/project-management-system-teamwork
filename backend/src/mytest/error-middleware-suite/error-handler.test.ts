import { Request, Response, NextFunction } from 'express';
import { errorHandler } from '../../middlewares/error.middleware';
import logger from '../../utils/logger';

/**
 * 🧪 UNIT TEST: ERROR MIDDLEWARE
 * Vị trí: backend/src/mytest/error-middleware-suite/error-handler.test.ts
 * Cách chạy: npx ts-node src/mytest/error-middleware-suite/error-handler.test.ts
 */

const runTestSuite = () => {
    console.log("--------------------------------------------------");
    console.log("🔍 ĐANG KIỂM THỬ: Error Middleware (Phễu lọc lỗi)");
    console.log("--------------------------------------------------\n");

    // --- CÔNG CỤ GIẢ LẬP (MOCK UTILS) ---
    const getMocks = () => {
        const req = {
            method: 'GET',
            url: '/test-route',
            body: { key: "value" },
            params: {},
            query: {}
        } as Partial<Request>;

        let result: any = {};
        const res = {
            status: (code: number) => {
                result.status = code;
                return res;
            },
            json: (data: any) => {
                result.json = data;
                return res;
            }
        } as Partial<Response>;

        const next = (() => { }) as NextFunction;

        return { req: req as Request, res: res as Response, next, result };
    };

    // --- TEST CASE 1: LỖI CÓ MÃ TRẠNG THÁI (404) ---
    (() => {
        console.log("Test Case 1: Lỗi 404 Custom Error");
        const { req, res, next, result } = getMocks();
        const err: any = new Error("Trang này không tồn tại");
        err.statusCode = 404;

        errorHandler(err, req, res, next);

        if (result.status === 404 && result.json.success === false) {
            console.log("✅ ĐẠT: Trả về đúng mã 404 và object success=false.");
        } else {
            console.log("❌ THẤT BẠI: Kết quả trả về sai mong đợi.");
        }
    })();

    // --- TEST CASE 2: LỖI KHÔNG XÁC ĐỊNH (DEFAULT 500) ---
    (() => {
        console.log("\nTest Case 2: Lỗi 500 mặc định");
        const { req, res, next, result } = getMocks();
        const err = new Error("Lỗi nổ Database bất ngờ");

        errorHandler(err, req, res, next);

        if (result.status === 500 && result.json.message === "Lỗi nổ Database bất ngờ") {
            console.log("✅ ĐẠT: Tự động chuyển về mã 500 và giữ đúng message.");
        } else {
            console.log("❌ THẤT BẠI: Không xử lý được mã lỗi mặc định.");
        }
    })();

    console.log("\n--------------------------------------------------");
    console.log("🏁 KẾT THÚC KIỂM THỬ");
    console.log("--------------------------------------------------");
};

// Thực thi test
try {
    runTestSuite();
} catch (error) {
    console.error("Lỗi khi thực thi script test:", error);
}
