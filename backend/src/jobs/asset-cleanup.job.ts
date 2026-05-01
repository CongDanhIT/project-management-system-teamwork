import cron from 'node-cron';
import AssetService from '../services/asset.service';
import ProjectAssetModel from '../models/project-asset.model';
import logger from '../utils/logger';
import dayjs from 'dayjs';

/**
 * Job dọn dẹp tài nguyên (Project Assets)
 * Chạy vào lúc 2:00 sáng mỗi ngày
 */
export const initAssetCleanupJob = () => {
    // Cron schedule: "0 2 * * *" (Phút Giờ Ngày Tháng Thứ)
    cron.schedule('0 2 * * *', async () => {
        logger.info('--- Bắt đầu Cron Job: Dọn dẹp tài nguyên mồ côi và rác ---');
        
        try {
            // 1. Dọn dẹp file đã xóa mềm (Soft Delete) quá 30 ngày
            const thirtyDaysAgo = dayjs().subtract(30, 'days').toDate();
            
            const assetsToDelete = await ProjectAssetModel.find({
                deletedAt: { $ne: null, $lt: thirtyDaysAgo }
            });

            logger.info(`Tìm thấy ${assetsToDelete.length} tài liệu cần xóa vĩnh viễn.`);

            for (const asset of assetsToDelete) {
                try {
                    // Xóa file vật lý trên R2
                    if (asset.storageProvider === 'R2' && asset.storageKey) {
                        await AssetService.hardDeleteFromR2(asset.storageKey);
                        logger.info(`Đã xóa file trên R2: ${asset.storageKey}`);
                    }

                    // Xóa record trong DB
                    await ProjectAssetModel.findByIdAndDelete(asset._id);
                    logger.info(`Đã xóa record DB cho asset: ${asset._id}`);
                } catch (err: any) {
                    logger.error(`Lỗi khi dọn dẹp asset ${asset._id}: ${err.message}`);
                }
            }

            logger.info('--- Kết thúc Cron Job: Dọn dẹp tài nguyên thành công ---');
        } catch (error: any) {
            logger.error('Lỗi nghiêm trọng trong Cron Job dọn dẹp:', { error: error.message });
        }
    });
    
    logger.info('Asset Cleanup Job đã được đăng ký (Hằng ngày lúc 02:00)');
};
