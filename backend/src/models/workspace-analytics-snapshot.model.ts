import mongoose, { Schema, Document } from "mongoose";

export interface IWorkspaceAnalyticsSnapshot extends Document {
    workspaceId: mongoose.Types.ObjectId;
    date: Date;
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    overdueTasks: number;
    totalProjects: number;
    createdAt: Date;
}

const WorkspaceAnalyticsSnapshotSchema = new Schema<IWorkspaceAnalyticsSnapshot>(
    {
        workspaceId: {
            type: Schema.Types.ObjectId,
            ref: "Workspace",
            required: true,
        },
        date: {
            type: Date,
            required: true,
        },
        totalTasks: {
            type: Number,
            default: 0,
        },
        completedTasks: {
            type: Number,
            default: 0,
        },
        inProgressTasks: {
            type: Number,
            default: 0,
        },
        overdueTasks: {
            type: Number,
            default: 0,
        },
        totalProjects: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: { createdAt: true, updatedAt: false },
    }
);

// Tạo index để tìm kiếm snapshot theo workspace và ngày nhanh hơn
WorkspaceAnalyticsSnapshotSchema.index({ workspaceId: 1, date: -1 });
// Đảm bảo mỗi workspace chỉ có 1 snapshot mỗi ngày
WorkspaceAnalyticsSnapshotSchema.index({ workspaceId: 1, date: 1 }, { unique: true });

const WorkspaceAnalyticsSnapshotModel = mongoose.model<IWorkspaceAnalyticsSnapshot>(
    "WorkspaceAnalyticsSnapshot",
    WorkspaceAnalyticsSnapshotSchema
);

export default WorkspaceAnalyticsSnapshotModel;
