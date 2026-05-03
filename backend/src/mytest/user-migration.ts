import mongoose from "mongoose";
import crypto from "crypto";
import dotenv from "dotenv";
import path from "path";
import UserModel from "../models/user.model";

// Load env từ root của backend
dotenv.config({ path: path.join(__dirname, "../../.env") });

const migrateUsers = async () => {
    try {
        console.log("🚀 Bắt đầu quá trình migration User Inbox Tokens...");
        
        const mongoUri = process.env.MONGO_URI;
        if (!mongoUri) {
            throw new Error("MONGO_URI không được tìm thấy trong .env");
        }

        await mongoose.connect(mongoUri);
        console.log("✅ Đã kết nối Database thành công.");

        const usersWithoutToken = await UserModel.find({
            $or: [
                { inboxToken: { $exists: false } },
                { inboxToken: null },
                { inboxToken: "" }
            ]
        });

        console.log(`🔍 Tìm thấy ${usersWithoutToken.length} người dùng cần cập nhật.`);

        for (const user of usersWithoutToken) {
            const token = crypto.randomBytes(8).toString("hex");
            user.inboxToken = token;
            await user.save();
            console.log(`   - Đã cập nhật Token cho: ${user.email}`);
        }

        console.log("✨ Quá trình migration hoàn tất.");
        process.exit(0);
    } catch (error) {
        console.error("❌ Lỗi trong quá trình migration:", error);
        process.exit(1);
    }
};

migrateUsers();
