import mongoose from "mongoose";
import ProjectModel from "../models/project.model";
import TaskModel from "../models/task.model";
import { TaskStatusEnum } from "../enums/task.enum";

export const createProjectService = async (workspaceId: string, body: {
    name: string;
    description?: string | null;
    emoji?: string | null;
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
    const totalCount = await ProjectModel.countDocuments({ workspaceId });
    const skip = (pageNumber - 1) * pageSize;
    const projects = await ProjectModel.find({ workspaceId })
        .skip(skip)
        .limit(pageSize)
        .populate("createdBy", "_id name  profilePicture")
        .sort({ createdAt: -1 });
    const totalPages = Math.ceil(totalCount / pageSize);
    return { projects, totalCount, totalPages, skip };
};

export const getProjectByIdService = async (projectId: string, workspaceId: string) => {
    const project = await ProjectModel.findOne({ _id: projectId, workspaceId }).populate("createdBy", "_id name  profilePicture");
    if (!project) {
        throw new Error("Không tìm thấy dự án");
    }
    return project;
};

export const getProjectAnalyticsService = async (projectId: string, workspaceId: string) => {
    const project = await ProjectModel.findOne({ _id: projectId, workspaceId });
    if (!project || project.workspaceId.toString() !== workspaceId) {
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
    body: { name: string, description?: string | null, emoji?: string | null }) => {
    const project = await ProjectModel.findOneAndUpdate({ _id: projectId, workspaceId }, body, { new: true, runValidators: true });
    if (!project) {
        throw new Error("Không tìm thấy dự án");
    }
    return project;
};

export const deleteProjectService = async (projectId: string, workspaceId: string) => {
    const session = await mongoose.startSession(); // Bắt đầu phiên làm việc
    session.startTransaction(); // Bắt đầu giao dịch

    try {
        const project = await ProjectModel.findOneAndDelete(
            { _id: projectId, workspaceId },
            { session } // Gắn session vào lệnh xóa
        );

        if (!project) {
            throw new Error("Không tìm thấy dự án");
        }

        // Xóa tất cả tasks của project này
        await TaskModel.deleteMany({ projectId }, { session });

        await session.commitTransaction(); // Lưu mọi thay đổi nếu mọi thứ ổn
        return project;
    } catch (error) {
        await session.abortTransaction(); // Hủy bỏ mọi thay đổi nếu có lỗi
        throw error;
    } finally {
        session.endSession(); // Đóng phiên
    }
};

