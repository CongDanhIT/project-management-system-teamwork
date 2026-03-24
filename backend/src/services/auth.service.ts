import mongoose from "mongoose";
import logger from "../utils/logger";
import UserModel from "../models/user.model";
import AccountModel from "../models/account.model";
import WorkspaceModel from "../models/workspace.model";
import MemberModel from "../models/member.model";
import RoleModel from "../models/role-permission.model";
import { RoleEnum } from "../enums/role.enum";
import { ProviderEnum, ProviderEnumType } from "../enums/count-provider.enum";
import { BadRequestException, NotFoundException } from "../utils/appError";

/**
 * Service xử lý đăng nhập hoặc tạo tài khoản mới qua OAuth (Google)
 * Không dùng 'session' từ passport, mà dùng 'session' từ Mongoose để quản lý Transaction.
 */
//dùng cho google auth
export const loginOrCreateAccountService = async (data: {
    provider: string;
    displayName: string;
    providerId: string;
    email: string;
    picture?: string;
}) => {
    const { provider, displayName, providerId, email, picture } = data;

    const dbSession = await mongoose.startSession();
    dbSession.startTransaction();

    try {
        logger.info("Bắt đầu transaction loginOrCreateAccount", { provider, providerId, email });

        // 1. Tìm bản ghi Account của provider này trước (Định danh chính xác nhất)
        let account = await AccountModel.findOne({ 
            provider: provider as ProviderEnumType, 
            providerId 
        }).session(dbSession);

        if (account) {
            // Đã có Account, lấy User
            const user = await UserModel.findById(account.userId).session(dbSession);
            if (user) {
                // Cập nhật thông tin profile nếu cần
                if (!user.name || !user.profilePicture) {
                    user.name = user.name || displayName;
                    user.profilePicture = user.profilePicture || picture || null;
                    await user.save({ session: dbSession });
                }

                await dbSession.commitTransaction();
                logger.info("Đăng nhập thành công qua Account hiện có.", { userId: user._id });
                return { user, isNew: false };
            }
            // Trường hợp hy hữu: Có Account nhưng User bị xóa, ta sẽ xử lý như User mới
        }

        // 2. Nếu chưa có Account, tìm User theo email để liên kết (Link Account)
        let user = await UserModel.findOne({ email }).session(dbSession);

        if (user) {
            logger.info("Tìm thấy User theo email, tiến hành liên kết Account mới...", { email });
            
            // Tạo Account liên kết cho User hiện tại
            account = new AccountModel({
                userId: user._id,
                provider: provider as ProviderEnumType,
                providerId,
            });
            await account.save({ session: dbSession });

            // Cập nhật profile nếu chưa có
            user.name = user.name || displayName;
            user.profilePicture = user.profilePicture || picture || null;
            await user.save({ session: dbSession });

            await dbSession.commitTransaction();
            return { user, isNew: false };
        }

        // 3. Nếu không thấy cả User lẫn Account, tạo mới hoàn toàn
        logger.info("Người dùng mới hoàn toàn, tiến hành khởi tạo hệ thống...");

        user = new UserModel({
            email,
            name: displayName,
            profilePicture: picture || null,
        });
        await user.save({ session: dbSession });

        account = new AccountModel({
            userId: user._id,
            provider: provider as ProviderEnumType,
            providerId,
        });
        await account.save({ session: dbSession });

        const ownerRole = await RoleModel.findOne({ name: RoleEnum.OWNER }).session(dbSession);
        if (!ownerRole) {
            throw new Error("Dữ liệu Role OWNER chưa được khởi tạo!");
        }

        const workspace = new WorkspaceModel({
            name: "My Workspace",
            description: `Workspace của ${user.name}`,
            owner: user._id,
        });
        await workspace.save({ session: dbSession });

        const member = new MemberModel({
            userId: user._id,
            workspaceId: workspace._id,
            role: ownerRole._id,
        });
        await member.save({ session: dbSession });

        user.currentWorkspace = workspace._id as mongoose.Types.ObjectId;
        await user.save({ session: dbSession });

        await dbSession.commitTransaction();
        logger.info("Hoàn tất tạo tài khoản mới.", { userId: user._id });
        return { user, isNew: true };

    } catch (error: any) {
        await dbSession.abortTransaction();
        logger.error("Lỗi loginOrCreateAccount, rollback data!", { message: error.message });
        throw error;
    } finally {
        dbSession.endSession();
    }
};
//dùng cho đăng ký email auth
export const registerService = async (body: {
    name: string,
    email: string,
    password: string
}) => {
    const { name, email, password } = body;
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const existingUser = await UserModel.findOne({ email }).session(session);
        if (existingUser) {
            throw new BadRequestException("Email đã tồn tại");
        }
        const user = new UserModel({
            name,
            email,
            password,
        });
        await user.save({ session });
        const account = new AccountModel({
            provider: ProviderEnum.EMAIL,
            providerId: email,
            userId: user._id,
        })
        await account.save({ session });
        const ownerRole = await RoleModel.findOne({ name: RoleEnum.OWNER }).session(session);
        if (!ownerRole) {
            throw new Error("Không tìm thấy dữ liệu Role OWNER trong Database. Vui lòng chạy seeder trước!");
        }

        // Bước D: Tạo Workspace mặc định cho User
        const workspace = new WorkspaceModel({
            name: "My Workspace",
            description: `Workspace được tạo cho ${user.name}`,
            owner: user._id, // Tên field trong schema là 'owner'
        });
        await workspace.save({ session });

        const member = new MemberModel({
            userId: user._id,
            workspaceId: workspace._id, // Tên field trong schema là 'workspaceId'
            role: ownerRole._id, // Vai trò là ObjectId của Role OWNER
        });
        await member.save({ session });

        user.currentWorkspace = workspace._id as mongoose.Types.ObjectId;
        await user.save({ session });

        await session.commitTransaction();
        logger.info("Đăng ký thành công", { userId: user._id });
        return { userId: user._id, workspaceId: workspace._id };
    } catch (error: any) {
        await session.abortTransaction();
        logger.error("Lỗi trong quá trình registerService, đã rollback dữ liệu!", {
            message: error.message,
            stack: error.stack
        });
        throw error;
    } finally {
        session.endSession();
    }

}
//dùng cho đăng nhập email auth
export const verifyUserService = async ({
    email,
    password,
    provider = ProviderEnum.EMAIL,
}: {
    email: string,
    password: string,
    provider?: ProviderEnumType
}) => {
    const account = await AccountModel.findOne({ provider, providerId: email })
    if (!account) {
        throw new NotFoundException("không tìm thấy tài khoản")
    }
    const user = await UserModel.findById(account.userId).select("+password")
    if (!user) {
        throw new NotFoundException("không tìm thấy tài khoản")
    }
    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
        throw new BadRequestException("sai mật khẩu")
    }
    return user.omitPassword()
}

/**
 * Service lấy thông tin người dùng hiện tại từ database dựa trên ID.
 * Đảm bảo dữ liệu luôn mới nhất (Fresh Data).
 */
