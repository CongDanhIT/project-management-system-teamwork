/**
 * Script Migration: Chuyển assignedTo từ ObjectId đơn sang Mảng ObjectId
 * 
 * Mô tả: Cập nhật tất cả task cũ có assignedTo là string/ObjectId đơn sang dạng mảng.
 * - Nếu assignedTo là null -> giữ mảng rỗng []
 * - Nếu assignedTo là ObjectId -> chuyển thành [ObjectId]
 * - Nếu assignedTo đã là mảng -> bỏ qua
 */

import mongoose from "mongoose";
import { config } from "dotenv";
import path from "path";

config({ path: path.resolve(__dirname, "../../.env") });

const MONGO_URI = process.env.MONGO_URI || "";

async function migrateAssignees() {
    console.log("🔄 Bắt đầu migration assignedTo -> multi-assignee...");
    console.log(`📡 Kết nối tới: ${MONGO_URI.replace(/:([^@]+)@/, ":****@")}`);

    await mongoose.connect(MONGO_URI);
    console.log("✅ Đã kết nối Database!\n");

    const db = mongoose.connection.db!;
    const tasksCollection = db.collection("tasks");

    // Đếm tổng task
    const totalTasks = await tasksCollection.countDocuments();
    console.log(`📊 Tổng số task trong Database: ${totalTasks}`);

    // Tìm các task có assignedTo là ObjectId đơn (KHÔNG PHẢI mảng)
    const tasksToMigrate = await tasksCollection.find({
        assignedTo: { $exists: true, $not: { $type: "array" } }
    }).toArray();

    console.log(`🔍 Số task cần migration: ${tasksToMigrate.length}\n`);

    if (tasksToMigrate.length === 0) {
        console.log("🎉 Không có task nào cần migration. Dữ liệu đã đúng định dạng!");
        await mongoose.disconnect();
        return;
    }

    let migrated = 0;
    let nullConverted = 0;

    for (const task of tasksToMigrate) {
        const oldValue = task.assignedTo;
        let newValue: any[];

        if (oldValue === null || oldValue === undefined) {
            newValue = [];
            nullConverted++;
        } else {
            // Bọc ObjectId đơn vào mảng
            newValue = [oldValue];
        }

        await tasksCollection.updateOne(
            { _id: task._id },
            { $set: { assignedTo: newValue } }
        );

        migrated++;
        console.log(`  ✅ [${migrated}/${tasksToMigrate.length}] Task ${task.taskCode}: ${oldValue || 'null'} -> [${newValue.join(', ')}]`);
    }

    console.log(`\n====================================`);
    console.log(`🎉 Migration hoàn tất!`);
    console.log(`   - Tổng đã chuyển: ${migrated}`);
    console.log(`   - Null -> []: ${nullConverted}`);
    console.log(`   - ID đơn -> [ID]: ${migrated - nullConverted}`);
    console.log(`====================================\n`);

    await mongoose.disconnect();
    console.log("📡 Đã ngắt kết nối Database.");
}

migrateAssignees().catch((err) => {
    console.error("❌ Lỗi migration:", err);
    process.exit(1);
});
