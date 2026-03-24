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
}, userId: string) => {
    const project = new ProjectModel({
        ...body,
        workspaceId,
        createdBy: userId
    })
    await project.save();
    return project;
};

export const getProjectsInWorkspaceService = async (workspaceId: string, pageSize: number, pageNumber: number) => {
    const query = { workspaceId, deletedAt: null };
    const totalCount = await ProjectModel.countDocuments(query);
    const skip = (pageNumber - 1) * pageSize;
    const projects = await ProjectModel.find(query)
        .skip(skip)
        .limit(pageSize)
        .populate("createdBy", "_id name profilePicture")
        .sort({ lastAccessedAt: -1, viewCount: -1 });
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
        endDate?: Date | null
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

