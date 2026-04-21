import mongoose, { Schema, model } from "mongoose";

export interface TagDocument extends mongoose.Document {
    workspaceId: mongoose.Types.ObjectId;
    name: string;
    color: string;
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const tagSchema = new Schema<TagDocument>({
    workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace", required: true },
    name: { type: String, required: true, trim: true },
    color: { type: String, required: true }, // Mã HEX color (#FFFFFF)
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
}, {
    timestamps: true
});

// Index tối ưu truy vấn
tagSchema.index({ workspaceId: 1 });
// Đảm bảo không trùng tên tag trong cùng 1 Workspace
tagSchema.index({ workspaceId: 1, name: 1 }, { unique: true });

const TagModel = model<TagDocument>("Tag", tagSchema);

export default TagModel;
