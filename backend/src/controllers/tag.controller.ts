import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/asyncHandle";
import HTTP_STATUS from "../config/http.config";
import TagModel from "../models/tag.model";

// [GET] /api/v1/workspace/:workspaceId/tags
export const getTags = asyncHandler(async (req: Request, res: Response) => {
  const { workspaceId } = req.params;
  const { type } = req.query;
  
  const query: any = { workspaceId };
  if (type) {
    query.type = type;
  }
  
  const tags = await TagModel.find(query).populate('taskTags', 'name color type').sort({ createdAt: -1 });

  res.status(HTTP_STATUS.OK).json({
    message: "Tags fetched successfully",
    tags
  });
});

// [POST] /api/v1/workspace/:workspaceId/tags
export const createTag = asyncHandler(async (req: Request, res: Response) => {
  const { workspaceId } = req.params;
  const { name, color, type, taskTags } = req.body;
  const userId = req.user?._id;

  try {
    const tag = await TagModel.create({
      workspaceId,
      name,
      color,
      type: type || 'TASK',
      taskTags: type === 'MEMBER' ? taskTags : [],
      createdBy: userId,
    });

    res.status(HTTP_STATUS.OK).json({
      message: "Tag created successfully",
      tag
    });
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: "Tên nhãn này đã tồn tại trong dự án" });
    }
    throw error;
  }
});

// [PUT] /api/v1/workspace/:workspaceId/tags/:tagId
export const updateTag = asyncHandler(async (req: Request, res: Response) => {
  const { workspaceId, tagId } = req.params;
  const { name, color, type, taskTags } = req.body;

  const tag = await TagModel.findOneAndUpdate(
    { _id: tagId, workspaceId },
    { name, color, type, taskTags: type === 'MEMBER' ? taskTags : [] },
    { new: true, runValidators: true }
  );

  if (!tag) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({ message: "Tag not found" });
  }

  res.status(HTTP_STATUS.OK).json({
    message: "Tag updated successfully",
    tag
  });
});

// [DELETE] /api/v1/workspace/:workspaceId/tags/:tagId
export const deleteTag = asyncHandler(async (req: Request, res: Response) => {
  const { workspaceId, tagId } = req.params;

  const tag = await TagModel.findOneAndDelete({ _id: tagId, workspaceId });
  if (!tag) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({ message: "Tag not found" });
  }

  // Dọn dẹp dữ liệu mồ côi (Data Integrity)
  const TaskModel = (await import("../models/task.model")).default;
  const MemberModel = (await import("../models/member.model")).default;
  
  await TaskModel.updateMany({ tags: tagId }, { $pull: { tags: tagId } });
  await MemberModel.updateMany({ skillTags: tagId }, { $pull: { skillTags: tagId } });

  res.status(HTTP_STATUS.OK).json({
    message: "Tag deleted successfully"
  });
});
