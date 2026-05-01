import mongoose, { Document, Schema } from "mongoose";

export enum ActivityActionEnum {
    // Task Actions
    CREATE_TASK = "CREATE_TASK",
    UPDATE_TASK = "UPDATE_TASK",
    DELETE_TASK = "DELETE_TASK",
    RESTORE_TASK = "RESTORE_TASK",
    MOVE_TASK = "MOVE_TASK",
    
    // Project Actions
    CREATE_PROJECT = "CREATE_PROJECT",
    UPDATE_PROJECT = "UPDATE_PROJECT",
    DELETE_PROJECT = "DELETE_PROJECT",
    RESTORE_PROJECT = "RESTORE_PROJECT",
    
    // Phase Actions
    CREATE_PHASE = "CREATE_PHASE",
    UPDATE_PHASE = "UPDATE_PHASE",
    DELETE_PHASE = "DELETE_PHASE",
    RESTORE_PHASE = "RESTORE_PHASE",

    // Asset & Folder Actions
    CREATE_FOLDER = "CREATE_FOLDER",
    UPDATE_FOLDER = "UPDATE_FOLDER",
    DELETE_FOLDER = "DELETE_FOLDER",
    UPLOAD_FILE = "UPLOAD_FILE",
    DELETE_FILE = "DELETE_FILE",
    RENAME_FILE = "RENAME_FILE",

    // Workspace & Member Actions
    MEMBER_JOINED = "MEMBER_JOINED",
    MEMBER_LEFT = "MEMBER_LEFT",
    ROLE_CHANGED = "ROLE_CHANGED",
    WORKSPACE_UPDATED = "WORKSPACE_UPDATED",
}

export enum ActivityEntityTypeEnum {
    TASK = "TASK",
    PROJECT = "PROJECT",
    PHASE = "PHASE",
    ASSET_FOLDER = "ASSET_FOLDER",
    ASSET = "ASSET",
    WORKSPACE = "WORKSPACE",
    MEMBER = "MEMBER",
}

export interface IActivityLog extends Document {
    workspaceId: mongoose.Types.ObjectId;
    projectId?: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId; // Người thực hiện
    action: ActivityActionEnum;
    entityType: ActivityEntityTypeEnum;
    entityId: mongoose.Types.ObjectId; // ID của đối tượng bị tác động (Task ID, Project ID...)
    details?: {
        oldValue?: any;
        newValue?: any;
        summary?: string; // Tóm tắt hành động (VD: "đã đổi trạng thái task sang DONE")
    };
    createdAt: Date;
}

const activityLogSchema = new Schema<IActivityLog>(
    {
        workspaceId: {
            type: Schema.Types.ObjectId,
            ref: "Workspace",
            required: true,
            index: true
        },
        projectId: {
            type: Schema.Types.ObjectId,
            ref: "Project",
            index: true
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },
        action: {
            type: String,
            enum: Object.values(ActivityActionEnum),
            required: true
        },
        entityType: {
            type: String,
            enum: Object.values(ActivityEntityTypeEnum),
            required: true
        },
        entityId: {
            type: Schema.Types.ObjectId,
            required: true
        },
        details: {
            oldValue: Schema.Types.Mixed,
            newValue: Schema.Types.Mixed,
            summary: String
        }
    },
    {
        timestamps: { createdAt: true, updatedAt: false } // Chỉ cần ghi nhận thời điểm tạo
    }
);

// Index cho query Timeline nhanh
activityLogSchema.index({ workspaceId: 1, createdAt: -1 });
activityLogSchema.index({ projectId: 1, createdAt: -1 });

const ActivityLogModel = mongoose.model<IActivityLog>("ActivityLog", activityLogSchema);

export default ActivityLogModel;
