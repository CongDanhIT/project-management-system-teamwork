import { Request, Response } from 'express';
import * as InteractionService from '../services/interaction.service';
import logger from '../utils/logger';

/**
 * Đăng bình luận cho Task
 */
export const createTaskComment = async (req: Request, res: Response) => {
  try {
    const { workspaceId, taskId } = req.params;
    const { content, replyTo, mentions } = req.body;
    // [FIX] Lấy ID an toàn từ Passport User
    const userId = (req as any).user?._id || (req as any).user?.id;
    
    if (!userId) {
      throw new Error('Không tìm thấy ID người dùng trong phiên đăng nhập');
    }

    const comment = await InteractionService.createTaskCommentService(
      workspaceId as string,
      taskId as string,
      userId,
      content,
      replyTo,
      mentions
    );

    res.status(201).json({
      success: true,
      message: 'Đã đăng bình luận',
      data: comment,
    });
  } catch (error: any) {
    logger.error('[InteractionController] Error creating comment:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Lấy danh sách bình luận của Task
 */
export const getTaskComments = async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const comments = await InteractionService.getTaskCommentsService(taskId as string);

    res.status(200).json({
      success: true,
      data: comments,
    });
  } catch (error: any) {
    logger.error('[InteractionController] Error fetching comments:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Xóa bình luận
 */
export const deleteTaskComment = async (req: Request, res: Response) => {
  try {
    const { commentId } = req.params;
    const userId = (req as any).user?._id || (req as any).user?.id;

    await InteractionService.deleteTaskCommentService(commentId as string, userId);

    res.status(200).json({
      success: true,
      message: 'Đã xóa bình luận',
    });
  } catch (error: any) {
    logger.error('[InteractionController] Error deleting comment:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Thả cảm xúc cho bình luận
 */
export const toggleCommentReaction = async (req: Request, res: Response) => {
  try {
    const { commentId } = req.params;
    const { emoji } = req.body;
    const userId = (req as any).user?._id || (req as any).user?.id;

    if (!emoji) throw new Error('Vui lòng chọn emoji');

    const reactions = await InteractionService.toggleCommentReactionService(commentId as string, userId, emoji);

    res.status(200).json({
      success: true,
      data: reactions,
    });
  } catch (error: any) {
    logger.error('[InteractionController] Error toggling reaction:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Lấy danh sách thông báo của User
 */
export const getUserNotifications = async (req: Request, res: Response) => {
  try {
    const { workspaceId } = req.params;
    const userId = (req as any).user?._id || (req as any).user?.id;

    if (!userId) throw new Error('Không tìm thấy ID người dùng');

    const notifications = await InteractionService.getUserNotificationsService(userId, workspaceId as string);

    res.status(200).json({
      success: true,
      data: notifications,
    });
  } catch (error: any) {
    logger.error('[InteractionController] Error fetching notifications:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Đánh dấu thông báo đã đọc
 */
export const markNotificationRead = async (req: Request, res: Response) => {
  try {
    const { notificationId } = req.params;
    const userId = (req as any).user?._id || (req as any).user?.id;

    if (!userId) throw new Error('Không tìm thấy ID người dùng');

    const notification = await InteractionService.markNotificationAsReadService(notificationId as string, userId);

    res.status(200).json({
      success: true,
      message: 'Đã đánh dấu là đã đọc',
      data: notification,
    });
  } catch (error: any) {
    logger.error('[InteractionController] Error marking notification read:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Đánh dấu tất cả thông báo là đã đọc
 */
export const markAllNotificationsRead = async (req: Request, res: Response) => {
  try {
    const { workspaceId } = req.body; // Hoặc từ params tùy cách thiết kế route
    const userId = (req as any).user?._id || (req as any).user?.id;

    if (!userId) throw new Error('Không tìm thấy ID người dùng');
    if (!workspaceId) throw new Error('Vui lòng cung cấp workspaceId');

    await InteractionService.markAllNotificationsAsReadService(userId, workspaceId);

    res.status(200).json({
      success: true,
      message: 'Đã đánh dấu tất cả là đã đọc',
    });
  } catch (error: any) {
    logger.error('[InteractionController] Error marking all notifications read:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Lấy thông báo phân trang (phục vụ trang Notifications)
 */
export const getPaginatedNotifications = async (req: Request, res: Response) => {
  try {
    const { workspaceId } = req.params;
    const { page, limit, type } = req.query;
    const userId = (req as any).user?._id || (req as any).user?.id;

    if (!userId) throw new Error('Không tìm thấy ID người dùng');

    const result = await InteractionService.getPaginatedNotificationsService(
      userId as string,
      workspaceId as string,
      Number(page) || 1,
      Number(limit) || 20,
      type as string
    );

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    logger.error('[InteractionController] Error fetching paginated notifications:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};
