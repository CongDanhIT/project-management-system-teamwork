import mongoose, { Schema, model, Document } from "mongoose";

export interface AssetFolderDocument extends Document {
    workspaceId: mongoose.Types.ObjectId;
    projectId: mongoose.Types.ObjectId;
    phaseId: mongoose.Types.ObjectId | null;
    parentFolderId: mongoose.Types.ObjectId | null;
    name: string;
    visibility: "PUBLIC" | "PRIVATE";
    createdBy: mongoose.Types.ObjectId;
    deletedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

const assetFolderSchema = new Schema<AssetFolderDocument>(
    {
        workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true },
        projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true },
        phaseId: { type: Schema.Types.ObjectId, ref: "Phase", default: null },
        parentFolderId: { type: Schema.Types.ObjectId, ref: "AssetFolder", default: null },
        name: { type: String, required: true, trim: true },
        visibility: {
            type: String,
            enum: ["PUBLIC", "PRIVATE"],
            default: "PUBLIC",
        },
        createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
        deletedAt: { type: Date, default: null },
    },
    {
        timestamps: true,
    }
);

// Index để tìm kiếm nhanh cây thư mục
assetFolderSchema.index({ projectId: 1, parentFolderId: 1, deletedAt: 1 });
assetFolderSchema.index({ phaseId: 1 });

const AssetFolderModel = model<AssetFolderDocument>("AssetFolder", assetFolderSchema);

export default AssetFolderModel;
