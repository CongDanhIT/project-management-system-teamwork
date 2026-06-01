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
import projectRoutes from './routes/project.route';
import taskRoutes from './routes/task.route';
import aiRoutes from './routes/ai.route';
import aiV2Routes from './routes/ai-v2.route';
import uploadRoutes from './routes/upload.route';
import inboxRoutes from './routes/inbox.route';
import announcementRoutes from './routes/announcement.route';
import tagRoutes from './routes/tag.route';
import interactionRoutes from './routes/interaction.route';
import activityRoutes from './routes/activity.route';
import phaseRoutes from './routes/phase.route';
import assetRoutes from './routes/asset.route';
import analyticsRoutes from './routes/analytics.route';
import { startCronService } from './services/cron.service';
import webhookRoutes from './routes/webhook.route';
import { createServer } from 'http';
import { initSocket } from './config/socket';
import { initExternalListeners } from './listeners/external.listener';
import { initWorkflowListeners } from './listeners/workflow.listener';
import workflowRoutes from './routes/workflow.routes';

dotenv.config();

// Trigger restart
const app = express();
const BASE_PATH = env.BASE_PATH;

const startServer = async () => {
    try {
        await connectDatabase();

        const PORT = env.PORT;
        const httpServer = createServer(app);

        // Khởi tạo Socket.io
        initSocket(httpServer);

        console.log(">>> SERVER INDEX IS LOADING ROUTES <<<");
        // 1. Logger (Debug mọi request)
        app.use((req: Request, res: Response, next: NextFunction) => {
            logger.info(`🔍 Request: [${req.method}] ${req.originalUrl}`);
            next();
        });

        // 2. CORS & Parser (BẮT BUỘC đặt trước route)
        app.use(cors({
            origin: env.FRONTEND_ORIGIN,
            credentials: true,
        }));
        app.use(express.json());
        app.use(express.urlencoded({ extended: true }));


        // Quay lại dùng cookie-session (Kiến trúc cũ)
        app.use(session({
            name: "session",
            keys: [env.SESSION_SECRET],
            maxAge: 24 * 60 * 60 * 1000, // 24 hours
            httpOnly: true,
            secure: env.isProd,
            sameSite: "lax",
        }))

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

        app.get('/', asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: ">>> BACKEND IS RUNNING NEW CODE (v1.0.1) <<<",
                version: "1.0.1"
            })
        }));

        app.use(`${BASE_PATH}/auth`, authRoutes);
        app.use(`${BASE_PATH}/webhooks`, webhookRoutes);
        app.use(`${BASE_PATH}/upload`, uploadRoutes); // 🚀 Di chuyển lên đầu để tránh bị intercept
        app.use(`${BASE_PATH}/user`, isAuthenticated, userRoutes);

        app.use(`${BASE_PATH}/workspace`, isAuthenticated, workspaceRoutes);
        app.use(`${BASE_PATH}/member`, isAuthenticated, memberRoutes);
        app.use(`${BASE_PATH}/project`, isAuthenticated, projectRoutes); // 🔒 BẢO MẬT: bắt buộc auth
        app.use(`${BASE_PATH}/ai`, isAuthenticated, aiRoutes);           // 🚀 AI Planner & Chatbot (V1)
        app.use(`${BASE_PATH}/ai/v2`, isAuthenticated, aiV2Routes);      // 🤖 AI Agent Chatbot (V2)
        app.use(`${BASE_PATH}/task`, isAuthenticated, taskRoutes);       // 🔒 BẢO MẬT: bắt buộc auth
        app.use(`${BASE_PATH}/inbox`, isAuthenticated, inboxRoutes);     // 🚀 MỚI: Inbox cá nhân
        app.use(`${BASE_PATH}/workspace/:workspaceId/announcements`, isAuthenticated, announcementRoutes); // 🚀 Bản tin dự án
        app.use(`${BASE_PATH}/workspace/:workspaceId/tags`, isAuthenticated, tagRoutes); // 🚀 Tags cho task
        app.use(`${BASE_PATH}/interaction`, isAuthenticated, interactionRoutes); // 🚀 Bình luận & Thông báo
        app.use(`${BASE_PATH}/activity`, activityRoutes); // 🚀 Nhật ký hệ thống
        app.use(`${BASE_PATH}/phase`, phaseRoutes); // 🚀 Quản lý giai đoạn dự án
        app.use(`${BASE_PATH}/asset`, isAuthenticated, assetRoutes); // 🚀 Quản lý tài nguyên & R2
        app.use(`${BASE_PATH}/analytics`, isAuthenticated, analyticsRoutes); // 🚀 Báo cáo chuyên sâu
        app.use(`${BASE_PATH}/workflow`, isAuthenticated, workflowRoutes); // 🚀 Automation Workflow
        logger.info(">>> INTERACTION ROUTES LOADED <<<");

        // Catch-all 404: Bắt các request không khớp bất kỳ route nào
        app.use((req: Request, res: Response) => {
            logger.warn(`🚫 404: [${req.method}] ${req.originalUrl}`);
            res.status(404).json({
                success: false,
                message: `Route ${req.originalUrl} không tồn tại.`
            });
        });

        app.use(errorHandler);

        httpServer.listen(PORT, () => {
            logger.info(`⚡️[server]: Server is running at http://localhost:${PORT} in ${env.NODE_ENV} mode`);
            logger.info(`📝[session]: Socket.io initialized.`);

            // Kích hoạt External Listeners (Slack, v.v.)
            initExternalListeners();
            initWorkflowListeners();

            // Kích hoạt Cron dọn dẹp thùng rác sau 30 ngày
            startCronService();
        });
    } catch (error) {
        logger.error("Không thể khởi động Server do lỗi hệ thống", { error });
        process.exit(1);
    }
}

startServer();

// Lá chắn bảo vệ ứng dụng khỏi bị crash do lỗi unhandled
process.on('uncaughtException', (error) => {
    logger.error('💥 CRITICAL: Uncaught Exception', {
        message: error.message,
        stack: error.stack
    });
});

process.on('unhandledRejection', (reason: any) => {
    logger.error('💥 CRITICAL: Unhandled Rejection', {
        message: reason?.message || String(reason),
        stack: reason?.stack
    });
});

