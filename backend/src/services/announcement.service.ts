import mongoose from "mongoose";
import AnnouncementModel from "../models/announcement.model";
import { eventDispatcher } from "../events/dispatcher";
import { EventTypes } from "../events/event-types";
import MemberModel from "../models/member.model";
import RoleModel from "../models/role-permission.model";

// Helper check quyền
const checkAdminOwner = async (workspaceId: string, userId: string) => {
  const userObjId = new mongoose.Types.ObjectId(userId);
  const wpObjId = new mongoose.Types.ObjectId(workspaceId);
  const member = await MemberModel.findOne({ workspaceId: wpObjId, userId: userObjId }).populate("role");
  
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
  eventDispatcher.emit(EventTypes.NEW_ANNOUNCEMENT, populatedAnnouncement);

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
  return announcement.populate("createdBy", "name email profilePicture");
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
  
  eventDispatcher.emit(EventTypes.PIN_ANNOUNCEMENT, announcement);

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
    return removed.populate([
      { path: "createdBy", select: "name email profilePicture" },
      { path: "reactions.userIds", select: "name profilePicture" }
    ]);
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
    return added.populate([
      { path: "createdBy", select: "name email profilePicture" },
      { path: "reactions.userIds", select: "name profilePicture" }
    ]);
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

    return created.populate([
      { path: "createdBy", select: "name email profilePicture" },
      { path: "reactions.userIds", select: "name profilePicture" }
    ]);
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

  eventDispatcher.emit(EventTypes.DELETE_ANNOUNCEMENT, { id: announcementId, workspaceId });

  return announcement;
};
