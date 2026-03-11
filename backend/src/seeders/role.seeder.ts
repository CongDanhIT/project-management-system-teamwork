import mongoose from "mongoose";
import connectDatabase from "../config/database.config";
import RoleModel from "../models/role-permission.model";
import { RolePermissions } from "../utils/role-permission";
import logger from "../utils/logger";

/**
 * Script Seeder cho Roles
 * Sử dụng winston logger và transactions
 */
const seedRoles = async () => {
    logger.info("🌱 Bắt đầu seeding roles...");

    try {
        await connectDatabase();
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            logger.info(" Đang dọn dẹp dữ liệu cũ (RolePermission)...");
            await RoleModel.deleteMany({}, { session });

            for (const roleName in RolePermissions) {
                const role = roleName as keyof typeof RolePermissions;
                const permissions = RolePermissions[role];

                // Tạo role mới
                const newRole = new RoleModel({
                    name: role,
                    permission: permissions
                });

                await newRole.save({ session });
                logger.info(` Đã tạo role: ${role}`);
            }

            await session.commitTransaction();
            logger.info(" Seeding roles hoàn tất thành công!");
        } catch (error) {
            logger.error(" Lỗi trong quá trình transaction seeding:", { error });
            throw error;
        } finally {
            session.endSession();
        }

    } catch (error) {
        logger.error(" Lỗi nghiêm trọng khi chạy Seeder:", { error });
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        logger.info(" Đã ngắt kết nối database.");
        process.exit(0);
    }
}

// Thực thi
seedRoles().catch((error) => {
    logger.error(" Lỗi nghiêm trọng khi chạy Seeder:", { error });

});