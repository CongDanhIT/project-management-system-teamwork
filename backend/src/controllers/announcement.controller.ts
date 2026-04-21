import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/asyncHandle";
import * as AnnouncementService from "../services/announcement.service";
import HTTP_STATUS from "../config/http.config";

export const getAnnouncements = asyncHandler(async (req: Request, res: Response) => {
  const workspaceId = req.params.workspaceId as string;
  const { projectId, page, limit } = req.query;

  const result = await AnnouncementService.getAnnouncementsService(
    workspaceId,
    projectId as string,
    page ? parseInt(page as string, 10) : 1,
    limit ? parseInt(limit as string, 10) : 10
  );

  return res.status(HTTP_STATUS.OK).json({
    message: "Lấy danh sách bản tin thành công",
    ...result
  });
});

export const createAnnouncement = asyncHandler(async (req: Request, res: Response) => {
  const workspaceId = req.params.workspaceId as string;
  const userId = (req.user as any)?._id?.toString() || (req.user as any)?.id;
  const { type, title, content, projectId, attachments } = req.body;

  if (!userId) throw new Error("Không tìm thấy User");

  const announcement = await AnnouncementService.createAnnouncementService(
    workspaceId,
    projectId,
    userId,
    { type, title, content, attachments }
  );

  return res.status(HTTP_STATUS.CREATED).json({
    message: "Tạo bản tin thành công",
    announcement
  });
});

export const updateAnnouncement = asyncHandler(async (req: Request, res: Response) => {
  const workspaceId = req.params.workspaceId as string;
  const announcementId = req.params.announcementId as string;
  const userId = (req.user as any)?._id?.toString() || (req.user as any)?.id;
  const { title, content, attachments } = req.body;

  if (!userId) throw new Error("Không tìm thấy User");

  const announcement = await AnnouncementService.updateAnnouncementService(
    workspaceId,
    announcementId,
    userId,
    { title, content, attachments }
  );

  return res.status(HTTP_STATUS.OK).json({
    message: "Cập nhật bản tin thành công",
    announcement
  });
});

export const togglePinAnnouncement = asyncHandler(async (req: Request, res: Response) => {
  const workspaceId = req.params.workspaceId as string;
  const announcementId = req.params.announcementId as string;
  const userId = (req.user as any)?._id?.toString() || (req.user as any)?.id;
  if (!userId) throw new Error("Không tìm thấy User");

  const announcement = await AnnouncementService.togglePinAnnouncementService(
    workspaceId,
    announcementId,
    userId
  );

  return res.status(HTTP_STATUS.OK).json({
    message: "Đổi trạng thái ghim thành công",
    announcement
  });
});

export const toggleReaction = asyncHandler(async (req: Request, res: Response) => {
  const workspaceId = req.params.workspaceId as string;
  const announcementId = req.params.announcementId as string;
  const { emoji } = req.body;
  const userId = (req.user as any)?._id?.toString() || (req.user as any)?.id;

  if (!userId) throw new Error("Không tìm thấy User");

  const announcement = await AnnouncementService.toggleReactionService(
    workspaceId,
    announcementId,
    userId,
    emoji
  );

  return res.status(HTTP_STATUS.OK).json({
    message: "Cập nhật reaction thành công",
    announcement
  });
});

export const deleteAnnouncement = asyncHandler(async (req: Request, res: Response) => {
  const workspaceId = req.params.workspaceId as string;
  const announcementId = req.params.announcementId as string;
  const userId = (req.user as any)?._id?.toString() || (req.user as any)?.id;

  if (!userId) throw new Error("Không tìm thấy User");

  await AnnouncementService.deleteAnnouncementService(workspaceId, announcementId, userId);

  return res.status(HTTP_STATUS.OK).json({
    message: "Xóa bản tin thành công",
  });
});
