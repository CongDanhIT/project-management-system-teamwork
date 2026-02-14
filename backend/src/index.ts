import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import session from 'cookie-session';
import cors from 'cors';
import { config } from './config/app.config';
import { errorHandler } from './middlewares/error.middleware';
import logger from './utils/logger';
import { env } from './config/env'

dotenv.config();

const app = express();
const BASE_PATH = env.BASE_URL;
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

app.get('/', (req: Request, res: Response, next: NextFunction) => {

    res.status(200).json({
        success: true,
        message: "Server is running!",
    })
});

app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`⚡️[server]: Server is running at http://localhost:${PORT} in ${env.NODE_ENV} mode`);
});
