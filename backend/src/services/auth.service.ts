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

    // 1. Khởi tạo session từ mongoose để dùng Transaction
    const dbSession = await mongoose.startSession();
    dbSession.startTransaction();

    try {
        logger.info("Bắt đầu transaction loginOrCreateAccount");

        // 2. Tìm kiếm User theo email (findOne trả về object hoặc null)
        let user = await UserModel.findOne({ email }).session(dbSession);

        if (!user) {
            logger.info("Người dùng mới, tiến hành tạo tài khoản và không gian làm việc...");

            // Bước A: Tạo User mới
            user = new UserModel({
                email,
                name: displayName,
                profilePicture: picture || null,
            });
            await user.save({ session: dbSession });

            // Bước B: Tạo Account liên kết
            const account = new AccountModel({
                userId: user._id,
                provider: provider as ProviderEnumType,
                providerId,
            });
            await account.save({ session: dbSession });

            // Bước C: Tìm Role OWNER (Role này phải được tạo trước qua seeder)
            const ownerRole = await RoleModel.findOne({ name: RoleEnum.OWNER }).session(dbSession);
            if (!ownerRole) {
                throw new Error("Không tìm thấy dữ liệu Role OWNER trong Database. Vui lòng chạy seeder trước!");
            }

            // Bước D: Tạo Workspace mặc định cho User
            const workspace = new WorkspaceModel({
                name: "My Workspace",
                description: `Workspace được tạo cho ${user.name}`,
                owner: user._id, // Tên field trong schema là 'owner'
            });
            await workspace.save({ session: dbSession });

            // Bước E: Thêm User vào Workspace với vai trò OWNER
            const member = new MemberModel({
                userId: user._id,
                workspaceId: workspace._id, // Tên field trong schema là 'workspaceId'
                role: ownerRole._id, // Vai trò là ObjectId của Role OWNER
            });
            await member.save({ session: dbSession });

            user.currentWorkspace = workspace._id as mongoose.Types.ObjectId;
            await user.save({ session: dbSession })
            // 3. Commit toàn bộ thay đổi
            await dbSession.commitTransaction();

            logger.info("Hoàn tất tạo tài khoản và không gian làm việc cho người dùng mới.", { userId: user._id });
            return { user, isNew: true };
        }

        // Nếu đã có User, hoàn tất transaction và trả về dữ liệu
        await dbSession.commitTransaction();
        logger.info("Đăng nhập thành công với người dùng hiện tại.", { userId: user._id });
        return { user, isNew: false };

    } catch (error: any) {
        // Hủy bỏ toàn bộ các bước nếu có lỗi xảy ra
        await dbSession.abortTransaction();
        logger.error("Lỗi trong quá trình loginOrCreateAccount, đã rollback dữ liệu!", {
            message: error.message,
            stack: error.stack
        });
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
