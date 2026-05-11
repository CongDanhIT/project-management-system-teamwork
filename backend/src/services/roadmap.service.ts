import mongoose from "mongoose";
import ProjectModel from "../models/project.model";
import TaskModel from "../models/task.model";
import PhaseModel from "../models/phase.model";

export const getWorkspaceRoadmapService = async (workspaceId: string) => {
    const workspaceIdObj = new mongoose.Types.ObjectId(workspaceId);

    // 1. Lấy tất cả dự án trong workspace (không bao gồm dự án đã xóa)
    const projects = await ProjectModel.find({
        workspaceId: workspaceIdObj,
        deletedAt: null
    }).select("_id name emoji status startDate endDate").lean();

    const projectIds = projects.map(p => p._id);

    // 2. Lấy tất cả task của các dự án này có startDate hoặc dueDate (Scheduled)
    const tasks = await TaskModel.find({
        projectId: { $in: projectIds },
        deletedAt: null,
        $or: [
            { startDate: { $ne: null } },
            { dueDate: { $ne: null } }
        ]
    })
    .populate("assignedTo", "_id name profilePicture")
    .populate("projectId", "_id name emoji")
    .populate("phaseId", "_id name")
    .select("_id title status priority startDate dueDate projectId assignedTo taskCode phaseId workspaceId")
    .lean();

    // 3. Lấy các task không có ngày tháng (Unscheduled - cho vào Drawer)
    const unscheduledTasks = await TaskModel.find({
        projectId: { $in: projectIds },
        deletedAt: null,
        startDate: null,
        dueDate: null
    })
    .populate("assignedTo", "_id name profilePicture")
    .populate("projectId", "_id name emoji")
    .populate("phaseId", "_id name")
    .select("_id title status priority projectId assignedTo taskCode phaseId")
    .lean();

    // 4. Lấy tất cả Phase của các dự án này
    const phases = await PhaseModel.find({
        projectId: { $in: projectIds },
        deletedAt: null
    }).select("_id name startDate endDate projectId").lean();

    return {
        projects,
        tasks,
        unscheduledTasks,
        phases
    };
};
