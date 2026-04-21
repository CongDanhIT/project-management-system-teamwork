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
    createdAt: { type: Date, default: Date.now },
  }
);

const AnnouncementSchema = new Schema<IAnnouncement>(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true },
    projectId: { type: Schema.Types.ObjectId, ref: "Project" },
    type: { type: String, enum: ["GENERAL", "MILESTONE", "ALERT"], default: "GENERAL" },
    title: { type: String, required: true },
    content: { type: String, required: true },
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
