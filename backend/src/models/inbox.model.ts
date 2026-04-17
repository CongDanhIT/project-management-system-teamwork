import mongoose, { Schema, Document } from "mongoose";
import { InboxSourceTypeEnum, InboxStatusEnum, InboxSourceTypeEnumType, InboxStatusEnumType } from "../enums/inbox.enum";

export interface IPersonalInbox extends Document {
    ownerId: mongoose.Types.ObjectId;
    title: string;
    description?: string;
    sourceType: InboxSourceTypeEnumType;
    sourceMetadata?: Record<string, any>;
    status: InboxStatusEnumType;
    metadata?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}

const PersonalInboxSchema = new Schema<IPersonalInbox>(
    {
        ownerId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        title: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            default: "",
        },
        sourceType: {
            type: String,
            enum: Object.values(InboxSourceTypeEnum),
            default: InboxSourceTypeEnum.MANUAL,
        },
        sourceMetadata: {
            type: Schema.Types.Mixed,
            default: {},
        },
        status: {
            type: String,
            enum: Object.values(InboxStatusEnum),
            default: InboxStatusEnum.DRAFT,
            index: true,
        },
        metadata: {
            type: Schema.Types.Mixed,
            default: {},
        },
    },
    {
        timestamps: true,
    }
);

const PersonalInboxModel = mongoose.model<IPersonalInbox>("PersonalInbox", PersonalInboxSchema);

export default PersonalInboxModel;
