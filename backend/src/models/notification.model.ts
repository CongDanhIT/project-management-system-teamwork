import mongoose, { Schema, Document } from 'mongoose';

export enum NotificationType {
  TASK_ASSIGNED = 'TASK_ASSIGNED',
  TASK_UPDATED = 'TASK_UPDATED',
  COMMENT_ADDED = 'COMMENT_ADDED',
  MENTIONED = 'MENTIONED',
  PROJECT_INVITATION = 'PROJECT_INVITATION',
  TASK_REVIEW_REQUESTED = 'TASK_REVIEW_REQUESTED',
  TASK_OVERDUE = 'TASK_OVERDUE',
}

export interface INotification extends Document {
  recipientId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  workspaceId: mongoose.Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  refId: mongoose.Types.ObjectId; // Task ID, Project ID, etc.
  metadata?: {
    commentId?: string;
    projectId?: string;
    [key: string]: any;
  };
  createdAt: Date;
}

const NotificationSchema: Schema = new Schema(
  {
    recipientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true },
    type: { 
      type: String, 
      enum: Object.values(NotificationType), 
      required: true 
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    refId: { type: Schema.Types.ObjectId, required: true },
    refType: { 
      type: String, 
      enum: ['Task', 'Project', 'Announcement'], 
      required: true 
    },
    metadata: { type: Schema.Types.Mixed },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Indexes for performance and automatic cleanup
NotificationSchema.index({ recipientId: 1, createdAt: -1 });
// TTL Index: Tự động xóa thông báo sau 15 ngày (15 * 24 * 60 * 60 giây)
NotificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 1296000 });

export default mongoose.model<INotification>('Notification', NotificationSchema);
