import mongoose, { Schema, model, Document } from "mongoose";

export interface ProjectAssetDocument extends Document {
    workspaceId: mongoose.Types.ObjectId;
    projectId: mongoose.Types.ObjectId;
    folderId: mongoose.Types.ObjectId | null;
    phaseId: mongoose.Types.ObjectId | null;
    taskId: mongoose.Types.ObjectId | null;
    name: string;
    storageProvider: "R2" | "DRIVE" | "CLOUDINARY";
    storageKey: string; // ID hoặc Path vật lý trên Cloud để xóa
    fileUrl: string;
    fileSize: number;
    fileType: string;
    category: "GENERAL" | "STRATEGY" | "DELIVERABLE";
    status: "PENDING" | "APPROVED" | "REJECTED";
    createdBy: mongoose.Types.ObjectId;
    deletedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

const projectAssetSchema = new Schema<ProjectAssetDocument>(
    {
        workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true },
        projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true },
        folderId: { type: Schema.Types.ObjectId, ref: "AssetFolder", default: null },
        phaseId: { type: Schema.Types.ObjectId, ref: "Phase", default: null },
        taskId: { type: Schema.Types.ObjectId, ref: "Task", default: null },
        name: { type: String, required: true, trim: true },
        storageProvider: {
            type: String,
            enum: ["R2", "DRIVE", "CLOUDINARY"],
            default: "R2",
        },
        storageKey: { type: String, required: true },
        fileUrl: { type: String, required: true },
        fileSize: { type: Number, required: true },
        fileType: { type: String, required: true },
        category: {
            type: String,
            enum: ["GENERAL", "STRATEGY", "DELIVERABLE"],
            default: "GENERAL",
        },
        status: {
            type: String,
            enum: ["PENDING", "APPROVED", "REJECTED"],
            default: "APPROVED",
        },
        createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
        deletedAt: { type: Date, default: null },
    },
    {
        timestamps: true,
    }
);

// Tối ưu tìm kiếm file trong folder hoặc dự án
projectAssetSchema.index({ folderId: 1, deletedAt: 1 });
projectAssetSchema.index({ projectId: 1, deletedAt: 1 });
projectAssetSchema.index({ taskId: 1 });

const ProjectAssetModel = model<ProjectAssetDocument>("ProjectAsset", projectAssetSchema);

export default ProjectAssetModel;
