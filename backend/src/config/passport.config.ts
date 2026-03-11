import passport from "passport";
import { Request } from "express";
import { Strategy as GoogleStrategy, VerifyCallback, Profile } from "passport-google-oauth20";
import { env } from "./env"
import { NotFoundException } from "../utils/appError";
import logger from "../utils/logger";
import { ProviderEnum } from "../enums/count-provider.enum";
import { loginOrCreateAccountService } from "../services/auth.service";
import { UserDocument } from "../models/user.model";

/**
 * Cấu hình Passport Google OAuth 2.0.
 * Passport.use nhận vào Strategy và hàm callback để xử lý kết quả xác thực.
 */
passport.use(new GoogleStrategy({
    clientID: env.GOOGLE_CLIENT_ID,
    clientSecret: env.GOOGLE_CLIENT_SECRET,
    callbackURL: env.GOOGLE_CALLBACK_URL,
    scope: ["profile", "email"],
    passReqToCallback: true,
}, async (req: Request, accessToken: string, refreshToken: string, profile: Profile, done: VerifyCallback) => {
    try {
        const { email, sub: googleId, picture } = (profile as any)._json;
        logger.info("Xác thực thành công với Google", { googleId, email });
        logger.info("Profile", profile);

        if (!googleId) {
            throw new NotFoundException("Thiếu ID Google từ phản hồi của OAuth!");
        }

        // Gọi AuthService để đăng nhập hoặc tạo mới người dùng
        const { user } = await loginOrCreateAccountService({
            provider: ProviderEnum.GOOGLE,
            displayName: profile.displayName,
            providerId: googleId,
            email: email,
            picture: picture,
        });

        // Truyền user qua callback cho Passport xử lý tiếp tầng serialize
        done(null, user as UserDocument);

    } catch (error) {
        logger.error("Lỗi xác thực Google!", { error });
        done(error as Error, undefined);
    }
}));

/**
 * serializeUser: Xác định dữ liệu nào của user sẽ được lưu vào session (trong trường hợp dùng cookie-session).
 * Chúng ta lưu toàn bộ UserDocument vì cookie-session mã hóa nó vào cookie.
 */
passport.serializeUser((user: any, done) => {
    done(null, user);
});

/**
 * deserializeUser: Lấy dữ liệu từ session ra và phục hồi thành req.user cho các request tiếp theo.
 */
passport.deserializeUser((user: any, done) => {
    done(null, user as UserDocument);
});
