import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
// Đăng ký tất cả các schema trước khi bất kỳ model nào được sử dụng
import UserModel from "../models/user.model";
import WorkspaceModel from "../models/workspace.model";
import RoleModel from "../models/role-permission.model";
import MemberModel from "../models/member.model";

dotenv.config();

// ============================================================
// Tiện ích test đơn giản
// ============================================================
let passed = 0;
let failed = 0;

function expect(testName: string, condition: boolean): void {
    if (condition) {
        console.log(`  ✅ PASS: ${testName}`);
        passed++;
    } else {
        console.error(`  ❌ FAIL: ${testName}`);
        failed++;
    }
}

function describe(suiteName: string, fn: () => void): void {
    console.log(`\n📦 ${suiteName}`);
    console.log("─".repeat(50));
    fn();
}

async function runTests() {
    try {
        // Kết nối DB (lấy từ env)
        const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/teamsync_db";
        await mongoose.connect(mongoUri);
        console.log("🚀 Đã kết nối MongoDB để test");

        describe("MEMBER MODEL VALIDATION", () => {
            expect("MemberModel nên được định nghĩa", !!MemberModel);
        });

        // Tìm một thành viên mẫu để kiểm tra cấu trúc
        const sampleMember = await MemberModel.findOne().populate("userId").lean();
        
        describe("MEMBER DATA STRUCTURE", () => {
            if (sampleMember) {
                console.log("  🔍 Đã tìm thấy thành viên:", (sampleMember as any)._id);
                expect("Thành viên nên có userId", !!sampleMember.userId);
                expect("Thành viên nên có workspaceId", !!sampleMember.workspaceId);
            } else {
                console.warn("  ⚠️ Không tìm thấy thành viên nào trong DB để kiểm tra cấu trúc");
            }
        });

        console.log("\n" + "═".repeat(50));
        console.log(`📊 KẾT QUẢ: ${passed} passed | ${failed} failed`);
        console.log("═".repeat(50));

        await mongoose.disconnect();
        process.exit(failed > 0 ? 1 : 0);
    } catch (error) {
        console.error("💥 Lỗi khi chạy test:", error);
        process.exit(1);
    }
}

runTests();
