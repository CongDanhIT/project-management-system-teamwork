import mongoose, { Schema, Document } from 'mongoose';

export enum CommentType {
  USER = 'USER',
  SYSTEM = 'SYSTEM',
}

export interface ITaskComment extends Document {
  taskId: mongoose.Types.ObjectId;
  authorId: mongoose.Types.ObjectId; // null if SYSTEM
  workspaceId: mongoose.Types.ObjectId;
  content: string;
  type: CommentType;
  reactions: {
    emoji: string;
    userIds: mongoose.Types.ObjectId[];
  }[];
  replyTo?: mongoose.Types.ObjectId; // Reference to another comment for threads
  mentions: mongoose.Types.ObjectId[]; // List of mentioned user IDs
  isEdited: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TaskCommentSchema: Schema = new Schema(
  {
    taskId: { type: Schema.Types.ObjectId, ref: 'Task', required: true },
    authorId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true },
    content: { type: String, required: true },
    type: { 
      type: String, 
      enum: Object.values(CommentType), 
      default: CommentType.USER 
    },
    reactions: [
      {
        emoji: { type: String },
        userIds: [{ type: Schema.Types.ObjectId, ref: 'User' }],
      },
    ],
    replyTo: { type: Schema.Types.ObjectId, ref: 'TaskComment', default: null },
    mentions: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    isEdited: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
TaskCommentSchema.index({ taskId: 1, createdAt: 1 });
TaskCommentSchema.index({ workspaceId: 1 });

export default mongoose.model<ITaskComment>('TaskComment', TaskCommentSchema);
