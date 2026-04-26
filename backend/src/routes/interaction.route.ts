import { Router } from 'express';
import { isAuthenticated } from '../middlewares/isAuthenticated.middleware';
import * as InteractionController from '../controllers/interaction.controller';

const interactionRoutes = Router();

interactionRoutes.use(isAuthenticated);

// 1. Comments
interactionRoutes.post(
  '/workspace/:workspaceId/task/:taskId/comments', 
  InteractionController.createTaskComment
);
interactionRoutes.get(
  '/task/:taskId/comments', 
  InteractionController.getTaskComments
);
interactionRoutes.delete(
  '/comments/:commentId',
  InteractionController.deleteTaskComment
);
interactionRoutes.post(
  '/comments/:commentId/reaction',
  InteractionController.toggleCommentReaction
);

// 2. Notifications
interactionRoutes.get(
  '/workspace/:workspaceId/notifications', 
  InteractionController.getUserNotifications
);
interactionRoutes.patch(
  '/notifications/:notificationId/read', 
  InteractionController.markNotificationRead
);
interactionRoutes.patch(
  '/notifications/mark-all-read', 
  InteractionController.markAllNotificationsRead
);
interactionRoutes.get(
  '/workspace/:workspaceId/notifications/paginated', 
  InteractionController.getPaginatedNotifications
);

export default interactionRoutes;
