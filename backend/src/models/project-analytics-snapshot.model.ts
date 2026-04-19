import mongoose, { Schema, Document } from "mongoose";

export interface IProjectAnalyticsSnapshot extends Document {
    projectId: mongoose.Types.ObjectId;
    workspaceId: mongoose.Types.ObjectId;
    date: Date;
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    overdueTasks: number;
    unassignedTasks: number;
    dailyCompletedTasks: number;
    performanceIndex: number;
    createdAt: Date;
}

const ProjectAnalyticsSnapshotSchema = new Schema<IProjectAnalyticsSnapshot>(
    {
        projectId: {
            type: Schema.Types.ObjectId,
            ref: "Project",
            required: true,
        },
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
        unassignedTasks: {
            type: Number,
            default: 0,
        },
        dailyCompletedTasks: {
            type: Number,
            default: 0,
        },
        performanceIndex: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: { createdAt: true, updatedAt: false },
    }
);

/**
 * Tối ưu hóa truy vấn:
 * 1. Lấy lịch sử của 1 dự án cụ thể (Tab Tiêu điểm)
 * 2. Lấy báo cáo cho toàn bộ dự án trong Workspace
 * 3. Ràng buộc toàn vẹn: Mỗi dự án chỉ có duy nhất 1 bản ghi mỗi ngày
 */
ProjectAnalyticsSnapshotSchema.index({ projectId: 1, date: -1 });
ProjectAnalyticsSnapshotSchema.index({ workspaceId: 1, date: -1 });
ProjectAnalyticsSnapshotSchema.index({ projectId: 1, date: 1 }, { unique: true });

const ProjectAnalyticsSnapshotModel = mongoose.model<IProjectAnalyticsSnapshot>(
    "ProjectAnalyticsSnapshot",
    ProjectAnalyticsSnapshotSchema
);

export default ProjectAnalyticsSnapshotModel;
