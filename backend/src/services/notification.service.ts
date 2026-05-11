import NotificationModel, { NotificationType } from '../models/notification.model';
import eventDispatcher, { EVENTS } from '../utils/eventDispatcher';
import mongoose from 'mongoose';
import logger from '../utils/logger';

export class NotificationService {
  /**
   * Tạo và gửi thông báo chung
   */
  static async createNotification(data: {
    recipientId: string | mongoose.Types.ObjectId;
    senderId: string | mongoose.Types.ObjectId;
    workspaceId: string | mongoose.Types.ObjectId;
    type: NotificationType;
    title: string;
    message: string;
    refId: string | mongoose.Types.ObjectId;
    refType: 'Task' | 'Project' | 'Announcement';
    metadata?: any;
  }) {
    try {
      const notification = new NotificationModel({
        ...data,
        isRead: false,
      });

      await notification.save();

      // Phát sự kiện real-time qua Socket.io
      eventDispatcher.emit(EVENTS.NOTIFICATION.RECEIVED, notification);

      return notification;
    } catch (error) {
      logger.error('[NotificationService] Lỗi khi tạo thông báo:', error);
      throw error;
    }
  }

  /**
   * Thông báo khi được giao việc
   */
  static async sendTaskAssignedNotification(
    workspaceId: string,
    taskId: string,
    senderId: string,
    recipientId: string,
    taskTitle: string,
    projectId: string
  ) {
    if (senderId === recipientId) return;

    return this.createNotification({
      recipientId,
      senderId,
      workspaceId,
      type: NotificationType.TASK_ASSIGNED,
      title: 'Nhiệm vụ mới được giao',
      message: `vừa gán bạn vào một công việc mới: "${taskTitle}"`,
      refId: taskId,
      refType: 'Task',
      metadata: { projectId }
    });
  }

  /**
   * Thông báo khi công việc quá hạn
   */
  static async sendTaskOverdueNotification(
    workspaceId: string,
    taskId: string,
    systemUserId: string,
    recipientId: string,
    taskTitle: string,
    taskCode: string,
    dueDate: Date,
    projectId: string
  ) {
    const formattedDate = new Date(dueDate).toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    return this.createNotification({
      recipientId,
      senderId: systemUserId,
      workspaceId,
      type: NotificationType.TASK_OVERDUE,
      title: 'Cảnh báo: Công việc quá hạn',
      message: `Công việc [${taskCode}] "${taskTitle}" của bạn đã quá hạn từ ngày ${formattedDate}. Vui lòng kiểm tra và hoàn thành sớm.`,
      refId: taskId,
      refType: 'Task',
      metadata: { 
        projectId, 
        taskCode, 
        dueDate,
        isSystem: true,
        priority: 'high'
      }
    });
  }
}
