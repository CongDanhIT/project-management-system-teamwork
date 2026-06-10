import mongoose, { Schema, Document } from "mongoose";

export interface WhiteboardDocument extends Document {
  projectId: mongoose.Types.ObjectId;
  elements: any[]; 
  appState: any; 
  files: any; 
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

const whiteboardSchema = new Schema<WhiteboardDocument>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true, unique: true },
    elements: { type: Schema.Types.Mixed, default: [] },
    appState: { type: Schema.Types.Mixed, default: {} },
    files: { type: Schema.Types.Mixed, default: {} },
    version: { type: Number, default: 1 },
  },
  { timestamps: true }
);

const WhiteboardModel = mongoose.model<WhiteboardDocument>("Whiteboard", whiteboardSchema);
export default WhiteboardModel;
