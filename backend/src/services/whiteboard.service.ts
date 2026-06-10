import WhiteboardModel, { WhiteboardDocument } from "../models/whiteboard.model";
import mongoose from "mongoose";

export class WhiteboardService {
  static async getWhiteboardByProjectId(projectId: string): Promise<WhiteboardDocument | null> {
    return await WhiteboardModel.findOne({ projectId });
  }

  static async saveWhiteboard(
    projectId: string,
    elements: any[],
    appState: any,
    files: any
  ): Promise<WhiteboardDocument> {
    const existing = await WhiteboardModel.findOne({ projectId });
    if (existing) {
      existing.elements = elements;
      existing.appState = appState;
      existing.files = files;
      existing.version += 1;
      return await existing.save();
    } else {
      return await WhiteboardModel.create({
        projectId: new mongoose.Types.ObjectId(projectId),
        elements,
        appState,
        files,
        version: 1,
      });
    }
  }
}
