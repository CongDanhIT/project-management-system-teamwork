import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import session from 'cookie-session';
import cors from 'cors';
import { config } from './config/app.config';
import { errorHandler } from './middlewares/error.middleware';
import logger from './utils/logger';
import { env } from './config/env'
import { connectDatabase } from './config/database.config';
import HTTP_STATUS from './config/http.config';
import { asyncHandler } from './middlewares/asyncHandle';

dotenv.config();

const app = express();

const startServer = async () => {
    try {
        // Kết nối Database trước
        await connectDatabase();

        const PORT = env.PORT;

        app.use(session({
            name: "session",
            keys: [env.SESSION_SECRET],
            maxAge: 24 * 60 * 60 * 1000,
            httpOnly: true,
            secure: env.isProd,
            sameSite: "lax",
        }))

        app.use(cors({
            origin: env.FRONTEND_ORIGIN,
            credentials: true,
        }));

        app.use(express.json());

        app.get('/', asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: "Server is running!",
            })
        }));

        app.use(errorHandler);

        app.listen(PORT, () => {
            logger.info(`⚡️[server]: Server is running at http://localhost:${PORT} in ${env.NODE_ENV} mode`);
        });
    } catch (error) {
        logger.error("Không thể khởi động Server do lỗi hệ thống", { error });
        process.exit(1);
    }
}

startServer();
