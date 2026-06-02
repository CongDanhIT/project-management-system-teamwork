import mongoose, { Schema, Document } from "mongoose";

export interface IPersonalNote extends Document {
    ownerId: mongoose.Types.ObjectId;
    workspaceId: mongoose.Types.ObjectId;
    title: string;
    description?: string;
    color: string;
    isPinned: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const PersonalNoteSchema = new Schema<IPersonalNote>(
    {
        ownerId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        workspaceId: {
            type: Schema.Types.ObjectId,
            ref: "Workspace",
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
        color: {
            type: String,
            default: "#fef08a", // mặc định màu vàng nhạt (yellow-200)
        },
        isPinned: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

const PersonalNoteModel = mongoose.model<IPersonalNote>("PersonalNote", PersonalNoteSchema);

export default PersonalNoteModel;
