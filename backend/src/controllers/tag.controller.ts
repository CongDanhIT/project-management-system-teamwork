import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/asyncHandle";
import HTTP_STATUS from "../config/http.config";
import TagModel from "../models/tag.model";

// [GET] /api/v1/workspace/:workspaceId/tags
export const getTags = asyncHandler(async (req: Request, res: Response) => {
  const { workspaceId } = req.params;
  const tags = await TagModel.find({ workspaceId }).sort({ createdAt: -1 });

  res.status(HTTP_STATUS.OK).json({
    message: "Tags fetched successfully",
    tags
  });
});

// [POST] /api/v1/workspace/:workspaceId/tags
export const createTag = asyncHandler(async (req: Request, res: Response) => {
  const { workspaceId } = req.params;
  const { name, color } = req.body;
  const userId = req.user?._id;

  try {
    const tag = await TagModel.create({
      workspaceId,
      name,
      color,
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
  const { name, color } = req.body;

  const tag = await TagModel.findOneAndUpdate(
    { _id: tagId, workspaceId },
    { name, color },
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

  res.status(HTTP_STATUS.OK).json({
    message: "Tag deleted successfully"
  });
});
