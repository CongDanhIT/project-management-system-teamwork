import mongoose, { Schema, model } from "mongoose";
import { compareValue, hashValue } from "../utils/bcrypt";

/**
 * Interface định nghĩa cấu trúc dữ liệu của User trong database.
 * Kế thừa từ mongoose.Document để có đầy đủ các method của Mongoose.
 */
export interface UserDocument extends mongoose.Document {
    name: string;
    email: string;
    password?: string;
    profilePicture: string | null;
    isActive: boolean;
    lastLogin: Date | null;
    createdAt: Date;
    updatedAt: Date;
    currentWorkspace: mongoose.Types.ObjectId | null;

    /** So sánh mật khẩu thuần túy với mật khẩu đã hash của User */
    comparePassword(value: string): Promise<boolean>;
    /** Loại bỏ trường password khỏi Object trả về cho client */
    omitPassword(): Omit<UserDocument, "password">;
}

const userSchema = new Schema<UserDocument>(
    {
        name: { type: String, required: false, trim: true },
        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
        },
        // select: false đảm bảo password không bị lấy ra mặc định khi query
        // required: false để hỗ trợ người dùng đăng nhập qua Google OAuth
        password: { type: String, required: false, select: false },
        profilePicture: { type: String, default: null },
        isActive: { type: Boolean, default: true },
        lastLogin: { type: Date, default: null },
        currentWorkspace: { type: Schema.Types.ObjectId, ref: "Workspace", default: null },
    },
    {
        timestamps: true, // Tự động tạo createdAt và updatedAt
    }
);

/**
 * Middleware tự động mã hóa mật khẩu trước khi lưu vào database.
 */
userSchema.pre<UserDocument>("save", async function () {
    if (this.isModified("password") && this.password) {
        this.password = await hashValue(this.password);
    }
});

/**
 * Kiểm tra mật khẩu đầu vào có khớp với mật khẩu trong DB hay không.
 */
userSchema.methods.comparePassword = async function (value: string): Promise<boolean> {
    if (!this.password) return false;
    return await compareValue(value, this.password);
};

/**
 * Trả về một object User sạch sẽ, đã loại bỏ mật khẩu.
 */
userSchema.methods.omitPassword = function (): any {
    const userObject = this.toObject();
    delete userObject.password;
    return userObject;
};

const UserModel = model<UserDocument>("User", userSchema);

export default UserModel;