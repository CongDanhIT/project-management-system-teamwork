import mongoose from "mongoose";
import ProjectModel from "../models/project.model";
import TaskModel from "../models/task.model";
import { TaskStatusEnum } from "../enums/task.enum";
import { ProjectStatusEnumType } from "../enums/projectStatus.enum";

export const createProjectService = async (workspaceId: string, body: {
    name: string;
    description?: string | null;
    emoji?: string | null;
    status?: ProjectStatusEnumType;
    startDate?: Date | null;
    endDate?: Date | null;
    coverUrl?: string | null;
    coverPosition?: number;
}, userId: string) => {
    const project = new ProjectModel({
        ...body,
        workspaceId,
        createdBy: userId
    })
    await project.save();

    // Trả về kèm các trường placeholder cho UI cache
    return {
        ...project.toObject(),
        totalTasks: 0,
        completedTasks: 0
    };
};


export const getProjectsInWorkspaceService = async (workspaceId: string, pageSize: number, pageNumber: number) => {
    const skip = (pageNumber - 1) * pageSize;
    const workspaceIdObj = new mongoose.Types.ObjectId(workspaceId);

    const query = { workspaceId: workspaceIdObj, deletedAt: null };

    // 1. Tính tổng số dự án để phân trang
    const totalCount = await ProjectModel.countDocuments(query);

    // 2. Aggregation để lấy dự án kèm số lượng task
    const projects = await ProjectModel.aggregate([
        { $match: query },
        { $sort: { lastAccessedAt: -1, viewCount: -1 } },
        { $skip: skip },
        { $limit: pageSize },
        // Lookup tasks để đếm (chỉ lấy task chưa xóa)
        {
            $lookup: {
                from: "tasks",
                let: { projectId: "$_id" },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ["$projectId", "$$projectId"] },
                                    { $eq: ["$deletedAt", null] }
                                ]
                            }
                        }
                    }
                ],
                as: "tasks"
            }
        },
        // Chèn thông tin người tạo (Populate tương đương)
        {
            $lookup: {
                from: "users",
                localField: "createdBy",
                foreignField: "_id",
                as: "createdBy"
            }
        },
        { $unwind: { path: "$createdBy", preserveNullAndEmptyArrays: true } },
        // Tính toán totalTasks và completedTasks
        {
            $project: {
                _id: 1,
                name: 1,
                description: 1,
                emoji: 1,
                workspaceId: 1,
                status: 1,
                startDate: 1,
                endDate: 1,
                createdAt: 1,
                updatedAt: 1,
                lastAccessedAt: 1,
                viewCount: 1,
                coverUrl: 1,
                coverPositionX: 1,
                coverPositionY: 1,
                "createdBy._id": 1,
                "createdBy.name": 1,
                "createdBy.profilePicture": 1,
                favoritedBy: 1,
                totalTasks: { $size: "$tasks" },
                completedTasks: {
                    $size: {
                        $filter: {
                            input: "$tasks",
                            as: "task",
                            cond: { 
                                $or: [
                                    { $eq: ["$$task.status", TaskStatusEnum.DONE] },
                                    { $eq: ["$$task.status", TaskStatusEnum.COMPLETED] }
                                ]
                            }
                        }
                    }
                }
            }
        }
    ]);

    const totalPages = Math.ceil(totalCount / pageSize);
    return { projects, totalCount, totalPages, skip };
};

export const getProjectByIdService = async (projectId: string, workspaceId: string) => {
    const project = await ProjectModel.findOneAndUpdate(
        { _id: projectId, workspaceId, deletedAt: null },
        {
            $inc: { viewCount: 1 },
            $set: { lastAccessedAt: new Date() }
        },
        { new: true }
    ).populate("createdBy", "_id name profilePicture");

    if (!project) {
        throw new Error("Không tìm thấy dự án hoặc dự án đã bị xóa");
    }
    return project;
};

export const getProjectAnalyticsService = async (projectId: string, workspaceId: string) => {
    const project = await ProjectModel.findOne({ _id: projectId, workspaceId, deletedAt: null });
    if (!project) {
        throw new Error("Không tìm thấy dự án");
    }
    const currentDate = new Date();

    const taskAnalytics = await TaskModel.aggregate([
        {
            $match: {
                projectId: new mongoose.Types.ObjectId(projectId),
            },
        },
        {
            $facet: {
                totalTasks: [{ $count: "count" }],
                overdueTasks: [
                    {
                        $match: {
                            dueDate: { $lt: currentDate },
                            status: { $ne: TaskStatusEnum.DONE }
                        }
                    },
                    { $count: "count" }
                ],
                completedTasks: [
                    {
                        $match: { status: TaskStatusEnum.DONE }
                    },
                    { $count: "count" }
                ],
            },
        },
    ]);
    const result = taskAnalytics[0] || {};
    const totalTasks = result.totalTasks?.[0]?.count || 0;
    const overdueTasks = result.overdueTasks?.[0]?.count || 0;
    const completedTasks = result.completedTasks?.[0]?.count || 0;
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    return {
        totalTasks,
        overdueTasks,
        completedTasks,
        completionRate
    };
};

export const updateProjectService = async (projectId: string, workspaceId: string,
    body: {
        name?: string,
        description?: string | null,
        emoji?: string | null,
        status?: ProjectStatusEnumType,
        startDate?: Date | null,
        endDate?: Date | null,
        coverUrl?: string | null;
        coverPosition?: number;
    }) => {
    const project = await ProjectModel.findOneAndUpdate(
        { _id: projectId, workspaceId, deletedAt: null },
        body,
        { new: true, runValidators: true }
    );
    if (!project) {
        throw new Error("Không tìm thấy dự án hoặc dự án đã bị đóng băng/xóa");
    }
    return project;
};

export const deleteProjectService = async (projectId: string, workspaceId: string) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        // 1. Soft Delete Project
        const project = await ProjectModel.findOneAndUpdate(
            { _id: projectId, workspaceId, deletedAt: null },
            { deletedAt: new Date() },
            { new: true, session }
        );

        if (!project) {
            throw new Error("Không tìm thấy dự án hoặc dự án đã bị xóa/đóng băng");
        }

        // 2. Cascade Soft Delete cho toàn bộ Task thuộc Project này
        await TaskModel.updateMany(
            { projectId, workspaceId, deletedAt: null },
            { deletedAt: new Date() },
            { session }
        );

        await session.commitTransaction();
        return project;
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
};

// [AI-ADDED] Khôi phục dự án từ thùng rác
export const restoreProjectService = async (projectId: string, workspaceId: string) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        // 1. Restore Project
        const project = await ProjectModel.findOneAndUpdate(
            { _id: projectId, workspaceId, deletedAt: { $ne: null } },
            { deletedAt: null },
            { new: true, session }
        );

        if (!project) {
            throw new Error("Không tìm thấy dự án trong thùng rác");
        }

        // 2. Cascade Restore cho toàn bộ Task thuộc Project này
        await TaskModel.updateMany(
            { projectId, workspaceId, deletedAt: { $ne: null } },
            { deletedAt: null },
            { session }
        );

        await session.commitTransaction();
        return project;
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
};

// [AI-ADDED] Lấy danh sách dự án trong thùng rác
export const getDeletedProjectsInWorkspaceService = async (workspaceId: string) => {
    const projects = await ProjectModel.find({
        workspaceId,
        deletedAt: { $ne: null }
    })
        .populate("createdBy", "_id name profilePicture")
        .sort({ deletedAt: -1 });

    return projects;
};

// [AI-ADDED] Toggle trạng thái yêu thích dự án
export const toggleFavoriteProjectService = async (projectId: string, workspaceId: string, userId: string) => {
    const project = await ProjectModel.findOne({ _id: projectId, workspaceId, deletedAt: null });
    if (!project) {
        throw new Error("Không tìm thấy dự án");
    }

    const userIdObj = new mongoose.Types.ObjectId(userId);
    const isFavorited = project.favoritedBy.some(id => id.equals(userIdObj));

    if (isFavorited) {
        // Bỏ yêu thích
        project.favoritedBy = project.favoritedBy.filter(id => !id.equals(userIdObj));
    } else {
        // Thêm vào yêu thích
        project.favoritedBy.push(userIdObj);
    }

    await project.save();
    return { project, isFavorited: !isFavorited };
};

// [AI-ADDED] Lấy danh sách dự án yêu thích của người dùng trong Workspace
export const getFavoriteProjectsInWorkspaceService = async (workspaceId: string, userId: string) => {
    const userIdObj = new mongoose.Types.ObjectId(userId);
    const projects = await ProjectModel.find({
        workspaceId,
        deletedAt: null,
        favoritedBy: userIdObj
    })
    .select("_id name emoji favoritedBy")
    .sort({ name: 1 }); // Sắp xếp A-Z theo tên

    return projects;
};
