import TaskCommentModel, { CommentType } from '../models/task-comment.model';
import NotificationModel, { NotificationType } from '../models/notification.model';
import TaskModel from '../models/task.model';
import MemberModel from '../models/member.model';
import mongoose from 'mongoose';
import eventDispatcher, { EVENTS } from '../utils/eventDispatcher';

/**
 * Tạo bình luận cho Task
 */
export const createTaskCommentService = async (
  workspaceId: string,
  taskId: string,
  userId: string,
  content: string,
  replyTo?: string,
  mentions: string[] = []
) => {
  const comment = new TaskCommentModel({
    taskId,
    authorId: userId,
    workspaceId,
    content,
    type: CommentType.USER,
    replyTo: replyTo || null,
    mentions: mentions.map(id => new mongoose.Types.ObjectId(id)),
  });

  await comment.save();

  // 1. Nếu có nhắc tên, bắn thông báo chuông báo (Notifications)
  if (mentions.length > 0) {
    const task = await TaskModel.findById(taskId).select('title projectId');
    
    const notificationPromises = mentions.map(mentionId => {
      // Không bắn thông báo cho chính mình nếu tự nhắc tên
      if (mentionId === userId) return null;

      return new NotificationModel({
        recipientId: mentionId,
        senderId: userId,
        workspaceId,
        type: NotificationType.MENTIONED,
        title: 'Bạn được nhắc tên',
        message: `vừa nhắc tên bạn trong một bình luận tại công việc: "${task?.title}"`,
        refId: taskId,
        refType: 'Task',
        metadata: {
          commentId: comment._id,
          projectId: task?.projectId
        }
      }).save();
    });

    const notifications = await Promise.all(notificationPromises.filter(p => p !== null));

    // Phát sự kiện cho mỗi thông báo để đẩy Socket Real-time
    notifications.forEach(notif => {
      if (notif) {
        eventDispatcher.emit(EVENTS.NOTIFICATION.RECEIVED, notif);
      }
    });
  }

  // 1.5 Nếu là phản hồi (Reply), bắn thông báo cho tác giả bình luận gốc
  if (replyTo) {
    const parentComment = await TaskCommentModel.findById(replyTo);
    const recipientId = parentComment?.authorId?.toString();
    
    // Chỉ gửi nếu người nhận không phải là chính mình và không trùng với danh sách mentions (tránh spam)
    if (recipientId && recipientId !== userId && !mentions.includes(recipientId)) {
      const task = await TaskModel.findById(taskId).select('title projectId');
      const replyNotification = new NotificationModel({
        recipientId,
        senderId: userId,
        workspaceId,
        type: NotificationType.COMMENT_ADDED,
        title: 'Có phản hồi mới',
        message: `vừa phản hồi bình luận của bạn tại công việc: "${task?.title}"`,
        refId: taskId,
        refType: 'Task',
        metadata: {
          commentId: comment._id,
          projectId: task?.projectId
        }
      });

      await replyNotification.save();
      eventDispatcher.emit(EVENTS.NOTIFICATION.RECEIVED, replyNotification);
    }
  }

  // 2. Phát sự kiện Socket để cập nhật UI Real-time
  const populatedComment = await comment.populate('authorId', 'name profilePicture');
  
  eventDispatcher.emit(EVENTS.COMMENT.ADDED, {
    workspaceId,
    taskId,
    commentId: comment._id,
    comment: populatedComment, // Gửi nguyên object đã populate
    type: 'TASK',
  });

  return populatedComment;
};

/**
 * Lấy danh sách bình luận của một Task
 */
export const getTaskCommentsService = async (taskId: string) => {
  return await TaskCommentModel.find({ taskId })
    .populate('authorId', 'name profilePicture')
    .sort({ createdAt: 1 });
};

/**
 * Tự động tạo bình luận hệ thống khi có thay đổi quan trọng
 */
export const createSystemCommentService = async (
  workspaceId: string,
  taskId: string,
  userId: string,
  message: string
) => {
  const comment = new TaskCommentModel({
    taskId,
    authorId: userId, 
    workspaceId,
    content: message,
    type: CommentType.SYSTEM,
  });

  await comment.save();

  const populatedComment = await comment.populate('authorId', 'name profilePicture');

  eventDispatcher.emit(EVENTS.COMMENT.ADDED, {
    workspaceId,
    taskId,
    commentId: comment._id,
    comment: populatedComment, // Gửi nguyên object đã populate
    type: 'SYSTEM',
  });

  return populatedComment;
};

/**
 * Lấy danh sách thông báo của người dùng
 */
export const getUserNotificationsService = async (userId: string, workspaceId: string) => {
  return await NotificationModel.find({ recipientId: userId, workspaceId })
    .populate('senderId', 'name profilePicture')
    .sort({ createdAt: -1 })
    .limit(50);
};

/**
 * Xóa bình luận
 */
export const deleteTaskCommentService = async (commentId: string, userId: string) => {
  const comment = await TaskCommentModel.findById(commentId);
  
  if (!comment) {
    throw new Error('Không tìm thấy bình luận');
  }

  // Kiểm tra quyền: Chỉ tác giả mới được xóa
  if (comment.authorId.toString() !== userId) {
    throw new Error('Bạn không có quyền xóa bình luận này');
  }

  await comment.deleteOne();

  // Phát sự kiện Socket để các máy khách khác xóa bình luận khỏi UI
  eventDispatcher.emit(EVENTS.COMMENT.DELETED, {
    taskId: comment.taskId,
    commentId: comment._id,
  });

  return comment;
};

/**
 * Thả hoặc hủy cảm xúc (Reaction) - Giới hạn 1 cảm xúc mỗi người
 */
export const toggleCommentReactionService = async (commentId: string, userId: string, emoji: string) => {
  const comment = await TaskCommentModel.findById(commentId);
  if (!comment) throw new Error('Không tìm thấy bình luận');

  // [NEW] Xóa bỏ bất kỳ reaction nào khác mà user này đã thả trước đó
  comment.reactions.forEach((reaction, rIdx) => {
    const uIdx = reaction.userIds.indexOf(userId as any);
    if (uIdx > -1) {
      reaction.userIds.splice(uIdx, 1);
    }
  });

  // Loại bỏ các emoji không còn ai thả
  comment.reactions = comment.reactions.filter(r => r.userIds.length > 0);

  // Kiểm tra xem user có đang thả lại đúng cái emoji vừa xóa không (hành động Toggle)
  // Lưu ý: Logic ở trên đã xóa hết, nên bây giờ ta tìm xem emoji mới có trùng với cái yêu cầu không
  const targetReactionIndex = comment.reactions.findIndex(r => r.emoji === emoji);

  // [QUAN TRỌNG] Ở phiên bản mới, ta cần biết emoji đó trước đó đã tồn tại chưa ĐỂ XỬ LÝ TOGGLE
  // Nhưng vì ta đã xóa hết ở bước trên, ta cần một cách khác để biết user muốn "Đổi" hay "Hủy".
  // Giải pháp: Ta sẽ so sánh xem emoji mới có nằm trong danh sách vừa bị xóa không? 
  // Để đơn giản và hiệu quả nhất theo ý bạn: Bấm cái khác thì đổi, bấm lại cái cũ thì hủy.
  
  // (Tôi sẽ dùng một biến tạm để lưu vết trước khi xóa nếu cần, nhưng đơn giản nhất là xử lý logic "Đổi/Hủy" trực tiếp)
  
  // Tìm lại emoji trong mảng mới (sau khi đã dọn dẹp)
  const existingReaction = comment.reactions.find(r => r.emoji === emoji);
  
  if (existingReaction) {
    // Nếu nó vẫn còn ở đây (nghĩa là có người khác cũng thả cái này), ta chỉ cần thêm mình vào
    existingReaction.userIds.push(userId as any);
  } else {
    // Nếu nó chưa có ai thả, ta tạo mới
    comment.reactions.push({
      emoji,
      userIds: [userId as any]
    });
  }

  await comment.save();

  // [NEW] Bắn thông báo cho tác giả bình luận nếu người thả tim không phải là chính họ
  if (comment.authorId.toString() !== userId) {
    const task = await TaskModel.findById(comment.taskId).select('title projectId');
    const reactionNotification = new NotificationModel({
      recipientId: comment.authorId,
      senderId: userId,
      workspaceId: comment.workspaceId,
      type: NotificationType.COMMENT_ADDED,
      title: 'Cảm xúc mới',
      message: `vừa thả cảm xúc "${emoji}" vào bình luận của bạn tại công việc: "${task?.title}"`,
      refId: comment.taskId,
      refType: 'Task',
      metadata: {
        commentId: comment._id,
        projectId: task?.projectId
      }
    });

    await reactionNotification.save();
    eventDispatcher.emit(EVENTS.NOTIFICATION.RECEIVED, reactionNotification);
  }

  // Phát sự kiện Socket real-time
  eventDispatcher.emit(EVENTS.COMMENT.REACTION_UPDATED, {
    taskId: comment.taskId,
    commentId: comment._id,
    reactions: comment.reactions
  });

  return comment.reactions;
};

/**
 * Đánh dấu thông báo là đã đọc
 */
export const markNotificationAsReadService = async (notificationId: string, userId: string) => {
  return await NotificationModel.findOneAndUpdate(
    { _id: notificationId, recipientId: userId },
    { isRead: true },
    { new: true }
  );
};

/**
 * Đánh dấu TẤT CẢ thông báo của người dùng trong workspace là đã đọc
 */
export const markAllNotificationsAsReadService = async (userId: string, workspaceId: string) => {
  return await NotificationModel.updateMany(
    { recipientId: userId, workspaceId, isRead: false },
    { isRead: true }
  );
};

/**
 * Lấy danh sách thông báo có phân trang
 */
export const getPaginatedNotificationsService = async (
  userId: string, 
  workspaceId: string, 
  page: number = 1, 
  limit: number = 20,
  type?: string
) => {
  const query: any = { recipientId: userId, workspaceId };
  if (type) query.type = type;

  const total = await NotificationModel.countDocuments(query);
  const notifications = await NotificationModel.find(query)
    .populate('senderId', 'name profilePicture')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  return {
    notifications,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: page
  };
};
