import mongoose, { Document, Schema } from "mongoose";

export interface IAttachment {
  fileUrl: string;
  fileName: string;
  fileType: string;
}

export interface IReaction {
  emoji: string;
  userIds: mongoose.Types.ObjectId[];
}

export interface IComment {
  _id: mongoose.Types.ObjectId;
  authorId: mongoose.Types.ObjectId;
  content: string;
  reactions: IReaction[];
  mentions: mongoose.Types.ObjectId[];
  replyTo: mongoose.Types.ObjectId | null;
  createdAt: Date;
}

export interface IAnnouncement extends Document {
  workspaceId: mongoose.Types.ObjectId;
  projectId?: mongoose.Types.ObjectId;
  type: "GENERAL" | "MILESTONE" | "ALERT";
  title: string;
  content: string;
  isPinned: boolean;
  attachments: IAttachment[];
  reactions: IReaction[];
  comments: IComment[];
  createdBy: mongoose.Types.ObjectId;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const AttachmentSchema = new Schema<IAttachment>(
  {
    fileUrl: { type: String, required: true },
    fileName: { type: String, required: true },
    fileType: { type: String, required: true },
  },
  { _id: false }
);

const ReactionSchema = new Schema<IReaction>(
  {
    emoji: { type: String, required: true },
    userIds: [{ type: Schema.Types.ObjectId, ref: "User" }],
  },
  { _id: false }
);

const CommentSchema = new Schema<IComment>(
  {
    authorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true },
    reactions: [ReactionSchema],
    mentions: [{ type: Schema.Types.ObjectId, ref: "User" }],
    replyTo: { type: Schema.Types.ObjectId, ref: "User", default: null },
    createdAt: { type: Date, default: Date.now },
  }
);

const AnnouncementSchema = new Schema<IAnnouncement>(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true },
    projectId: { type: Schema.Types.ObjectId, ref: "Project" },
    type: { type: String, enum: ["GENERAL", "MILESTONE", "ALERT"], default: "GENERAL" },
    title: { type: String, required: true },
    content: { 
      type: String, 
      default: '',
      validate: {
        validator: function(this: any, value: string) {
          // Nếu có attachments thì content có thể rỗng, nếu không có attachments thì content phải có giá trị
          const hasAttachments = this.attachments && this.attachments.length > 0;
          const hasContent = value && value.trim().length > 0;
          return hasContent || hasAttachments;
        },
        message: 'Nội dung bản tin không được để trống khi không có file đính kèm.'
      }
    },
    isPinned: { type: Boolean, default: false },
    attachments: [AttachmentSchema],
    reactions: [ReactionSchema],
    comments: [CommentSchema],
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

const AnnouncementModel = mongoose.model<IAnnouncement>("Announcement", AnnouncementSchema);
export default AnnouncementModel;
