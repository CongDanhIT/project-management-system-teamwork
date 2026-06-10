import { Request, Response } from "express";
import { WhiteboardService } from "../services/whiteboard.service";
import logger from "../utils/logger";

export class WhiteboardController {
  static async getWhiteboard(req: Request, res: Response) {
    try {
      const { projectId } = req.params;
      const whiteboard = await WhiteboardService.getWhiteboardByProjectId(projectId as string);
      
      if (!whiteboard) {
        return res.status(200).json({ success: true, data: null });
      }

      res.status(200).json({ success: true, data: whiteboard });
    } catch (error: any) {
      logger.error("Error getting whiteboard", { error, projectId: req.params.projectId });
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async saveWhiteboard(req: Request, res: Response) {
    try {
      const { projectId } = req.params;
      const { elements, appState, files } = req.body;

      const whiteboard = await WhiteboardService.saveWhiteboard(projectId as string, elements, appState, files);
      res.status(200).json({ success: true, data: whiteboard });
    } catch (error: any) {
      logger.error("Error saving whiteboard", { error, projectId: req.params.projectId });
      res.status(500).json({ success: false, message: error.message });
    }
  }
}
