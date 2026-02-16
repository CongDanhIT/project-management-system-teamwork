
import winston from 'winston';
import { env } from '../config/env';

const isDev = process.env.NODE_ENV !== 'production';
const isProd = process.env.NODE_ENV === 'production';

// 1. Định nghĩa định dạng chung "Dễ hiểu cho người Việt"
const humanReadableFormat = winston.format.combine(
    winston.format.errors({ stack: true }), // Tự động trích xuất stack trace từ đối tượng Error
    winston.format.timestamp({ format: 'DD/MM/YYYY HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message, stack, ...metadata }) => {
        let metaStr = "";
        let stackStr = "";

        // Nếu có stack trace, trình bày riêng cho dễ đọc
        if (stack) {
            stackStr = `\n[STACK TRACE]:\n${stack}`;
        }

        if (Object.keys(metadata).length > 0) {
            const cleanMeta = { ...metadata };
            // Xóa các ký hiệu kỹ thuật và các trường đã xử lý
            delete cleanMeta[Symbol.for('level') as any];
            delete cleanMeta[Symbol.for('message') as any];
            delete cleanMeta[Symbol.for('splat') as any];

            if (Object.keys(cleanMeta).length > 0) {
                metaStr = `\n Dữ liệu phụ: ${JSON.stringify(cleanMeta, null, 2)}`;
            }
        }

        // Trình bày: [Thời gian] CẤP ĐỘ: Tin nhắn
        return `[${timestamp}] ${level.toUpperCase()}: ${message}${metaStr}${stackStr}\n${'-'.repeat(40)}`;
    })
);

// 2. Khởi tạo Logger
const logger = winston.createLogger({
    level: env.isDev ? 'debug' : 'info',
    transports: [
        // Lưu lỗi vào file (Giới hạn 5MB, giữ tối đa 5 file cũ)
        new winston.transports.File({
            filename: 'logs/error.log',
            level: 'error',
            format: humanReadableFormat,
            maxsize: 5242880, // 5MB
            maxFiles: 5,      // Lưu lại 5 file cũ nhất: error.log.1, error.log.2...
        }),
        // Lưu tất cả vào file (Giới hạn 5MB, giữ tối đa 5 file cũ)
        new winston.transports.File({
            filename: 'logs/combined.log',
            format: humanReadableFormat,
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        }),
    ],
});

// 3. Nếu đang phát triển, in ra màn hình Console (Có thêm màu sắc)
if (!env.isProd) {
    logger.add(new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            humanReadableFormat
        )
    }));
}

export default logger;
