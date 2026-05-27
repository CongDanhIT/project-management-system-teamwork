import mongoose from "mongoose";
import AnnouncementModel from "../models/announcement.model";
import NotificationModel, { NotificationType } from "../models/notification.model";
import eventDispatcher, { EVENTS } from "../utils/eventDispatcher";
import MemberModel from "../models/member.model";
import RoleModel from "../models/role-permission.model";

// Helper check quyền
const checkAdminOwner = async (workspaceId: string, userId: string) => {
  const userObjId = new mongoose.Types.ObjectId(userId);
  const wpObjId = new mongoose.Types.ObjectId(workspaceId);
  const member = await MemberModel.findOne({ workspaceId: wpObjId, userId: userObjId, joined: { $ne: false } }).populate("role");
  
  if (!member) throw new Error("Thành viên không có trong workspace");
  
  const roleName = (member.role as any)?.name;
  if (roleName !== "OWNER" && roleName !== "ADMIN") {
    throw new Error("Không có quyền! Chỉ OWNER hoặc ADMIN mới có thể thực hiện.");
  }
};

// Lấy danh sách Announcement
export const getAnnouncementsService = async (
  workspaceId: string,
  projectId?: string,
  page: number = 1,
  limit: number = 10
) => {
  const query: any = { workspaceId: new mongoose.Types.ObjectId(workspaceId), deletedAt: null };
  if (projectId) {
    query.projectId = new mongoose.Types.ObjectId(projectId);
  }

  const skip = (page - 1) * limit;

  const [announcements, totalCount] = await Promise.all([
    AnnouncementModel.find(query)
      .sort({ isPinned: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("createdBy", "name email profilePicture")
      .populate("comments.authorId", "name email profilePicture")
      .populate("comments.reactions.userIds", "name profilePicture")
      .populate("reactions.userIds", "name profilePicture"),
    AnnouncementModel.countDocuments(query),
  ]);

  return {
    announcements,
    totalCount,
    totalPages: Math.ceil(totalCount / limit),
    currentPage: page,
  };
};

// Tạo Announcement
export const createAnnouncementService = async (
  workspaceId: string,
  projectId: string | null,
  userId: string,
  data: { type: string; title: string; content: string; attachments?: any[] }
) => {
  await checkAdminOwner(workspaceId, userId);

  const announcement = new AnnouncementModel({
    workspaceId: new mongoose.Types.ObjectId(workspaceId),
    projectId: projectId ? new mongoose.Types.ObjectId(projectId) : undefined,
    type: data.type,
    title: data.title,
    content: data.content,
    attachments: data.attachments || [],
    createdBy: new mongoose.Types.ObjectId(userId),
  });

  await announcement.save();
  const populatedAnnouncement = await announcement.populate("createdBy", "name email profilePicture");

  // Phát sự kiện mới
  eventDispatcher.emit(EVENTS.ANNOUNCEMENT.CREATED, populatedAnnouncement);

  return populatedAnnouncement;
};

// Cập nhật Announcement
export const updateAnnouncementService = async (
  workspaceId: string,
  announcementId: string,
  userId: string,
  data: { title?: string; content?: string; attachments?: any[] }
) => {
  const announcement = await AnnouncementModel.findOne({
    _id: announcementId,
    workspaceId: new mongoose.Types.ObjectId(workspaceId),
    deletedAt: null,
  });

  if (!announcement) throw new Error("Không tìm thấy bản tin");
  await checkAdminOwner(workspaceId, userId);

  if (data.title) announcement.title = data.title;
  if (data.content) announcement.content = data.content;
  if (data.attachments) announcement.attachments = data.attachments as any;

  await announcement.save();
  const populated = await announcement.populate("createdBy", "name email profilePicture");
  
  eventDispatcher.emit(EVENTS.ANNOUNCEMENT.UPDATED, populated);
  
  return populated;
};

// Gim/Bỏ ghim
export const togglePinAnnouncementService = async (
  workspaceId: string,
  announcementId: string,
  userId: string
) => {
  const announcement = await AnnouncementModel.findOne({ 
    _id: announcementId, 
    workspaceId: new mongoose.Types.ObjectId(workspaceId), 
    deletedAt: null 
  });
  if (!announcement) throw new Error("Không tìm thấy bản tin");
  await checkAdminOwner(workspaceId, userId);

  announcement.isPinned = !announcement.isPinned;
  await announcement.save();
  
  eventDispatcher.emit(EVENTS.ANNOUNCEMENT.PINNED, announcement);

  return announcement.populate("createdBy", "name email profilePicture");
};

// React
export const toggleReactionService = async (
  workspaceId: string,
  announcementId: string,
  userId: string,
  emoji: string
) => {
  const userObjId = new mongoose.Types.ObjectId(userId);
  const annObjId = new mongoose.Types.ObjectId(announcementId);
  const wsObjId = new mongoose.Types.ObjectId(workspaceId);

  // 1. Thử bỏ react nếu user đã react trước đó
  const removed = await AnnouncementModel.findOneAndUpdate(
    { 
      _id: annObjId, 
      workspaceId: wsObjId,
      "reactions.emoji": emoji,
      "reactions.userIds": userObjId 
    },
    { $pull: { "reactions.$.userIds": userObjId } },
    { new: true }
  );

  if (removed) {
    // Kiểm tra nếu mảng userIds trống thì xóa luôn object reaction đó cho sạch DB
    await AnnouncementModel.updateOne(
      { _id: annObjId, "reactions.emoji": emoji, "reactions.userIds": { $size: 0 } },
      { $pull: { reactions: { emoji: emoji } } }
    );
    const populated = await removed.populate([
      { path: "createdBy", select: "name email profilePicture" },
      { path: "reactions.userIds", select: "name profilePicture" }
    ]);

    eventDispatcher.emit(EVENTS.ANNOUNCEMENT.INTERACTION, { 
      workspaceId, 
      announcementId, 
      type: 'REACTION_REMOVED',
      emoji 
    });

    return populated;
  }

  // 2. Nếu chưa react, thử thêm vào emoji đã tồn tại
  const added = await AnnouncementModel.findOneAndUpdate(
    { 
      _id: annObjId, 
      workspaceId: wsObjId,
      "reactions.emoji": emoji,
      "reactions.userIds": { $ne: userObjId } 
    },
    { $addToSet: { "reactions.$.userIds": userObjId } },
    { new: true }
  );

  if (added) {
    const populated = await added.populate([
      { path: "createdBy", select: "name email profilePicture" },
      { path: "reactions.userIds", select: "name profilePicture" }
    ]);

    eventDispatcher.emit(EVENTS.ANNOUNCEMENT.INTERACTION, { 
      workspaceId, 
      announcementId, 
      type: 'REACTION_ADDED',
      emoji 
    });

    return populated;
  }

  // 3. Nếu emoji chưa tồn tại, tạo mới object reaction
  const created = await AnnouncementModel.findOneAndUpdate(
    { 
      _id: annObjId, 
      workspaceId: wsObjId,
      "reactions.emoji": { $ne: emoji } 
    },
    { $push: { reactions: { emoji, userIds: [userObjId] } } },
    { new: true }
  );

  if (!created) {
     throw new Error("Không tìm thấy bản tin hoặc có lỗi xảy ra");
  }

    const populated = await created.populate([
      { path: "createdBy", select: "name email profilePicture" },
      { path: "reactions.userIds", select: "name profilePicture" }
    ]);

    eventDispatcher.emit(EVENTS.ANNOUNCEMENT.INTERACTION, { 
      workspaceId, 
      announcementId, 
      type: 'REACTION_CREATED',
      emoji 
    });

    return populated;
};


// Xóa (Soft Delete)
export const deleteAnnouncementService = async (
  workspaceId: string,
  announcementId: string,
  userId: string
) => {
  const announcement = await AnnouncementModel.findOne({ 
    _id: announcementId, 
    workspaceId: new mongoose.Types.ObjectId(workspaceId), 
    deletedAt: null 
  });
  if (!announcement) throw new Error("Không tìm thấy bản tin");
  await checkAdminOwner(workspaceId, userId);

  announcement.deletedAt = new Date();
  await announcement.save();

  eventDispatcher.emit(EVENTS.ANNOUNCEMENT.DELETED, { id: announcementId, workspaceId });

  return announcement;
};

// Thêm bình luận
export const addCommentService = async (
  workspaceId: string,
  announcementId: string,
  userId: string,
  content: string,
  replyTo?: string,
  mentions: string[] = []
) => {
  const annObjId = new mongoose.Types.ObjectId(announcementId);
  const userObjId = new mongoose.Types.ObjectId(userId);
  const wsObjId = new mongoose.Types.ObjectId(workspaceId);

  // 1. Tạo comment mới
  const newComment = { 
    _id: new mongoose.Types.ObjectId(),
    authorId: userObjId, 
    content, 
    mentions: mentions.map(id => new mongoose.Types.ObjectId(id)),
    replyTo: replyTo ? new mongoose.Types.ObjectId(replyTo) : null,
    createdAt: new Date() 
  };

  const announcement = await AnnouncementModel.findOneAndUpdate(
    { _id: annObjId, workspaceId: wsObjId, deletedAt: null },
    { $push: { comments: newComment } },
    { new: true }
  ).populate([
    { path: "createdBy", select: "name email profilePicture" },
    { path: "comments.authorId", select: "name profilePicture" },
    { path: "reactions.userIds", select: "name profilePicture" }
  ]);

  if (!announcement) throw new Error("Không tìm thấy bản tin");

  // 2. Gửi thông báo nhắc tên (Mentions)
  if (mentions.length > 0) {
    const notificationPromises = mentions.map(mentionId => {
      if (mentionId === userId) return null; // Không gửi cho chính mình

      return new NotificationModel({
        recipientId: mentionId,
        senderId: userId,
        workspaceId,
        type: NotificationType.MENTIONED,
        title: 'Bạn được nhắc tên',
        message: `vừa nhắc tên bạn trong một bình luận tại bản tin: "${announcement.title}"`,
        refId: announcementId,
        refType: 'Announcement',
        metadata: {
          commentId: newComment._id
        }
      }).save();
    });

    const notifications = await Promise.all(notificationPromises.filter(p => p !== null));
    notifications.forEach(notif => {
      if (notif) eventDispatcher.emit(EVENTS.NOTIFICATION.RECEIVED, notif);
    });
  }

  // 3. Gửi thông báo phản hồi (Reply)
  if (replyTo && !mentions.includes(replyTo) && replyTo !== userId) {
    const replyNotification = new NotificationModel({
      recipientId: replyTo,
      senderId: userId,
      workspaceId,
      type: NotificationType.COMMENT_ADDED,
      title: 'Có phản hồi mới',
      message: `vừa phản hồi bình luận của bạn tại bản tin: "${announcement.title}"`,
      refId: announcementId,
      refType: 'Announcement',
      metadata: {
        commentId: newComment._id
      }
    });

    await replyNotification.save();
    eventDispatcher.emit(EVENTS.NOTIFICATION.RECEIVED, replyNotification);
  }

  // 4. Phát sự kiện realtime cho Newsfeed
  eventDispatcher.emit(EVENTS.ANNOUNCEMENT.INTERACTION, { 
    workspaceId, 
    announcementId, 
    type: 'COMMENT_ADDED' 
  });

  return announcement;
};

// Xóa bình luận
export const deleteCommentService = async (
  workspaceId: string,
  announcementId: string,
  commentId: string,
  userId: string
) => {
  const annObjId = new mongoose.Types.ObjectId(announcementId);
  const commObjId = new mongoose.Types.ObjectId(commentId);
  const wsObjId = new mongoose.Types.ObjectId(workspaceId);

  const announcement = await AnnouncementModel.findOne({ _id: annObjId, workspaceId: wsObjId, deletedAt: null });
  if (!announcement) throw new Error("Không tìm thấy bản tin");

  const comment = announcement.comments.find(c => c._id.toString() === commentId);
  if (!comment) throw new Error("Không tìm thấy bình luận");

  // Kiểm tra quyền: Người tạo bình luận hoặc Admin/Owner
  const isAuthor = comment.authorId.toString() === userId;
  if (!isAuthor) {
    try {
      await checkAdminOwner(workspaceId, userId);
    } catch (e) {
      throw new Error("Bạn không có quyền xóa bình luận này");
    }
  }

  const updatedAnnouncement = await AnnouncementModel.findOneAndUpdate(
    { _id: annObjId },
    { $pull: { comments: { _id: commObjId } } },
    { new: true }
  ).populate([
    { path: "createdBy", select: "name email profilePicture" },
    { path: "comments.authorId", select: "name profilePicture" },
    { path: "reactions.userIds", select: "name profilePicture" }
  ]);

  eventDispatcher.emit(EVENTS.ANNOUNCEMENT.INTERACTION, { 
    workspaceId, 
    announcementId, 
    type: 'COMMENT_DELETED' 
  });

  return updatedAnnouncement;
};

// React bình luận
export const toggleCommentReactionService = async (
  workspaceId: string,
  announcementId: string,
  commentId: string,
  userId: string,
  emoji: string
) => {
  const userObjId = new mongoose.Types.ObjectId(userId);
  const annObjId = new mongoose.Types.ObjectId(announcementId);
  const commObjId = new mongoose.Types.ObjectId(commentId);
  const wsObjId = new mongoose.Types.ObjectId(workspaceId);

  // Tìm announcement
  const announcement = await AnnouncementModel.findOne({ _id: annObjId, workspaceId: wsObjId, deletedAt: null });
  if (!announcement) throw new Error("Không tìm thấy bản tin");

  // Tìm bình luận trong mảng comments
  const comment = announcement.comments.find(c => c._id.toString() === commentId);
  if (!comment) throw new Error("Không tìm thấy bình luận");

  // Logic tương tự như toggleReaction cho announcement nhưng áp dụng cho mảng lồng nhau
  // 1. Kiểm tra xem user đã react emoji này chưa
  const existingReaction = comment.reactions.find(r => r.emoji === emoji);
  
  if (existingReaction) {
    const userIndex = existingReaction.userIds.findIndex(id => id.toString() === userId);
    if (userIndex !== -1) {
      // Bỏ react
      existingReaction.userIds.splice(userIndex, 1);
      // Nếu mảng trống thì xóa luôn object reaction
      if (existingReaction.userIds.length === 0) {
        comment.reactions = comment.reactions.filter(r => r.emoji !== emoji);
      }
    } else {
      // Thêm react vào emoji đã có
      existingReaction.userIds.push(userObjId);
    }
  } else {
    // Tạo reaction mới
    comment.reactions.push({
      emoji,
      userIds: [userObjId]
    });
  }

  await announcement.save();
  
  // [NEW] Bắn thông báo cho tác giả bình luận nếu người thả tim không phải là chính họ
  if (comment.authorId.toString() !== userId) {
    const reactionNotification = new NotificationModel({
      recipientId: comment.authorId,
      senderId: userId,
      workspaceId,
      type: NotificationType.COMMENT_ADDED,
      title: 'Cảm xúc mới',
      message: `vừa thả cảm xúc "${emoji}" vào bình luận của bạn tại bản tin: "${announcement.title}"`,
      refId: announcementId,
      refType: 'Announcement',
      metadata: {
        commentId: comment._id
      }
    });

    await reactionNotification.save();
    eventDispatcher.emit(EVENTS.NOTIFICATION.RECEIVED, reactionNotification);
  }

  const populated = await AnnouncementModel.populate(announcement, [
    { path: "createdBy", select: "name email profilePicture" },
    { path: "comments.authorId", select: "name profilePicture" },
    { path: "comments.reactions.userIds", select: "name profilePicture" },
    { path: "reactions.userIds", select: "name profilePicture" }
  ]);

  eventDispatcher.emit(EVENTS.ANNOUNCEMENT.INTERACTION, { 
    workspaceId, 
    announcementId, 
    type: 'COMMENT_REACTION_UPDATED' 
  });

  return populated;
};
