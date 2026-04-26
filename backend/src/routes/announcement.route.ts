import { Router } from "express";
import * as AnnouncementController from "../controllers/announcement.controller";

const announcementRoutes = Router({ mergeParams: true });

// Sẽ được mount vào app.use('/api/v1/workspace/:workspaceId/announcements', announcementRoutes)
announcementRoutes.get("/", AnnouncementController.getAnnouncements);
announcementRoutes.post("/", AnnouncementController.createAnnouncement);
announcementRoutes.put("/:announcementId", AnnouncementController.updateAnnouncement);
announcementRoutes.delete("/:announcementId", AnnouncementController.deleteAnnouncement);
announcementRoutes.patch("/:announcementId/pin", AnnouncementController.togglePinAnnouncement);
announcementRoutes.patch("/:announcementId/react", AnnouncementController.toggleReaction);

// Bình luận bản tin
announcementRoutes.post("/:announcementId/comments", AnnouncementController.addComment);
announcementRoutes.delete("/:announcementId/comments/:commentId", AnnouncementController.deleteComment);
announcementRoutes.patch("/:announcementId/comments/:commentId/react", AnnouncementController.toggleCommentReaction);

export default announcementRoutes;
