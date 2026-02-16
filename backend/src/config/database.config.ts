import mongoose from "mongoose";
import { env } from "./env";
import logger from "../utils/logger";

/**
 * Kết nối đến MongoDB
 */
export const connectDatabase = async () => {
    try {
        await mongoose.connect(env.MONGO_URI);
        logger.info("Kết nối MongoDB thành công", { uri: env.MONGO_URI.replace(/:([^@]+)@/, ":****@") }); // Ẩn password nếu có trong log
    } catch (error) {
        logger.error("Lỗi kết nối MongoDB", error);
        throw error; // Quăng lỗi để Server chính xử lý việc dừng app
    }
}
export default connectDatabase;