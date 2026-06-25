import mongoose, { Schema, model } from "mongoose";
import { ProjectStatusEnum, ProjectStatusEnumType } from "../enums/projectStatus.enum";

export interface ProjectDocument extends mongoose.Document {
    name: string;
    description: string | null;
    emoji: string;
    workspaceId: mongoose.Types.ObjectId;
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
    status: ProjectStatusEnumType;
    startDate: Date | null;
    endDate: Date | null;
    deletedAt: Date | null;
    viewCount: number;
    lastAccessedAt: Date;
    coverUrl: string | null;
    coverPositionX: number;
    coverPositionY: number;
    favoritedBy: mongoose.Types.ObjectId[];
    slackWebhookUrl?: string | null;
    isAutoTaggingEnabled: boolean;
    embedding?: number[]; // Lưu trữ vector cho Semantic Search (1024 dimensions)
    embeddingUpdatedAt?: Date | null; // Theo dõi thời gian cập nhật vector
}
const projectSchema = new Schema<ProjectDocument>({
    name: { type: String, required: true, trim: true },
    description: { type: String, required: false, trim: true },
    emoji: { type: String, required: false, trim: true, default: "🎯" },
    workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: Object.values(ProjectStatusEnum), default: ProjectStatusEnum.ACTIVE },
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
    deletedAt: { type: Date, default: null },
    viewCount: { type: Number, default: 0 },
    lastAccessedAt: { type: Date, default: Date.now },
    coverUrl: { type: String, default: null },
    coverPositionX: { type: Number, default: 50 },
    coverPositionY: { type: Number, default: 50 },
    favoritedBy: [{ type: Schema.Types.ObjectId, ref: "User", default: [] }],
    slackWebhookUrl: { type: String, required: false, trim: true, default: null },
    isAutoTaggingEnabled: { type: Boolean, default: true },
    embedding: { type: [Number], default: [] },
    embeddingUpdatedAt: { type: Date, default: null },
}, {
    timestamps: true,
});

projectSchema.index({ createdBy: 1 });
// Thêm Index để tối ưu hóa truy vấn Dashboard/Lọc dự án
projectSchema.index({ workspaceId: 1, status: 1 });
projectSchema.index({ deletedAt: 1 }); // Quan trọng cho tính năng Thùng rác
projectSchema.index({ favoritedBy: 1 });


const ProjectModel = model<ProjectDocument>("Project", projectSchema);

export default ProjectModel;