import mongoose, { Schema, model } from "mongoose";
import { ProviderEnum, ProviderEnumType } from "../enums/count-provider.enum";

export interface AccountDocument extends mongoose.Document {
    provider: ProviderEnumType;
    providerId: string;// lưu trữ id của user trên provider: google, github, facebook
    userId: mongoose.Types.ObjectId;// id của user trong database
    refreshToken?: string | null;
    tokenExpiry?: Date | null;
    createdAt: Date;
    updatedAt: Date;
}
const accountSchema = new Schema<AccountDocument>(
    {
        provider: { type: String, required: true, enum: Object.values(ProviderEnum) },
        providerId: { type: String, required: true },
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        refreshToken: { type: String, default: null },
        tokenExpiry: { type: Date, default: null },
    },
    {
        timestamps: true,
        toJSON: {
            transform: function (doc, ret) {
                delete ret.refreshToken;
                return ret; // Quan trọng: Phải return object sau khi transform
            },

        },

    }
);

const AccountModel = model<AccountDocument>("Account", accountSchema);

export default AccountModel;