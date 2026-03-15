import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import session from 'cookie-session';
import cors from 'cors';
import passport from 'passport';
import './config/passport.config';

import { config } from './config/app.config';
import { errorHandler } from './middlewares/error.middleware';
import logger from './utils/logger';
import { env } from './config/env'
import { connectDatabase } from './config/database.config';
import HTTP_STATUS from './config/http.config';
import { asyncHandler } from './middlewares/asyncHandle';
import authRoutes from './routes/auth.route';
import userRoutes from './routes/user.route';
import { isAuthenticated } from './middlewares/isAuthenticated.middleware';
import workspaceRoutes from './routes/workspace.route';
import memberRoutes from './routes/member.route';
dotenv.config();

const app = express();
const BASE_PATH = env.BASE_PATH;

const startServer = async () => {
    try {
        await connectDatabase();

        const PORT = env.PORT;

        // Quay lại dùng cookie-session (Kiến trúc cũ)
        app.use(session({
            name: "session",
            keys: [env.SESSION_SECRET],
            maxAge: 24 * 60 * 60 * 1000, // 24 hours
            httpOnly: true,
            secure: env.isProd,
            sameSite: "lax",
        }))


        // Vẫn giữ khởi tạo Passport để login Google hoạt động

        // Workaround: Patch cho cookie-session để tương thích với Passport 0.6+
        app.use((req: Request, res: Response, next: NextFunction) => {
            if (req.session && !req.session.regenerate) {
                (req.session as any).regenerate = (cb: any) => {
                    cb();
                };
            }
            if (req.session && !req.session.save) {
                (req.session as any).save = (cb: any) => {
                    cb();
                };
            }
            next();
        });

        // Khởi tạo Passport và cấu hình Middleware hỗ trợ Authentication
        app.use(passport.initialize());
        // Cho phép Passport sử dụng Session (thông tin user sẽ được lưu vào req.user)
        app.use(passport.session());

        app.use(cors({
            origin: env.FRONTEND_ORIGIN,
            credentials: true,
        }));

        // Parser để đọc dữ liệu JSON từ body của request (gán vào req.body)
        app.use(express.json());
        // Parser để đọc dữ liệu từ Form (định dạng x-www-form-urlencoded)
        app.use(express.urlencoded({ extended: true }));

        app.get('/', asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: "Server is running with cookie-session!",
                user: req.user
            })
        }));

        // TODO: app.use("/api/auth", authRoutes);
        app.use(`${BASE_PATH}/auth`, authRoutes);
        // TODO: app.use("/api/user", userRoutes);
        app.use(`${BASE_PATH}/user`, isAuthenticated, userRoutes);

        app.use(`${BASE_PATH}/workspace`, isAuthenticated, workspaceRoutes);
        app.use(`${BASE_PATH}/member`, isAuthenticated, memberRoutes);
        app.use(errorHandler);

        app.listen(PORT, () => {
            logger.info(`⚡️[server]: Server is running at http://localhost:${PORT} in ${env.NODE_ENV} mode`);
            logger.info(`📝[session]: Switched back to cookie-session.`);
        });
    } catch (error) {
        logger.error("Không thể khởi động Server do lỗi hệ thống", { error });
        process.exit(1);
    }
}

startServer();
