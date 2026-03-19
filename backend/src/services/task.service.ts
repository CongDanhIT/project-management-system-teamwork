import mongoose from "mongoose";
import TaskModel from "../models/task.model";
import { TaskPriorityEnum, TaskStatusEnum, TaskPriorityEnumType, TaskStatusEnumType } from "../enums/task.enum";
import MemberModel from "../models/member.model";

export const createTaskService = async (
    workspaceId: string,
    projectId: string,
    body: {
        title: string;
        description?: string | null;
        priority?: string;
        status?: string;
        dueDate?: string | null;
        assignedTo?: string | null;
    },
    userId: string
) => {
    const { title, description, priority, status, dueDate, assignedTo } = body;
    // Tạo taskCode ngẫu nhiên (hoặc theo logic riêng của bạn)
    const taskCode = `T-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    if (body.assignedTo) {
        const isAssignedUserMember = await MemberModel.exists({
            workspaceId,
            userId: body.assignedTo
        });
        if (!isAssignedUserMember) {
            throw new Error("User is not a member of this workspace");
        }
    }
    const task = new TaskModel({
        title,
        description: description ?? null,
        priority: (priority as TaskPriorityEnumType) || TaskPriorityEnum.MEDIUM,
        status: (status as TaskStatusEnumType) || TaskStatusEnum.TODO,
        dueDate: dueDate ? new Date(dueDate) : null,
        assignedTo: assignedTo ? new mongoose.Types.ObjectId(assignedTo) : null,
        taskCode,
        workspaceId,
        projectId,
        createdBy: userId,
    });

    await task.save();
    return task.populate([
        { path: "assignedTo", select: "_id name email profilePicture" },
        { path: "projectId", select: "_id name emoji" }
    ]);
};

export const updateTaskService = async (
    workspaceId: string,
    projectId: string,
    body: {
        title?: string;
        description?: string | null;
        priority?: string;
        status?: string;
        dueDate?: string | null;
        assignedTo?: string | null;
    },
    userId: string,
    taskId: string
) => {
    const { title, description, priority, status, dueDate, assignedTo } = body;

    // 1. Bảo mật: Tìm task và đảm bảo nó thuộc đúng Workspace & Project
    const task = await TaskModel.findOne({
        _id: taskId,
        workspaceId,
        projectId
    });

    if (!task) {
        throw new Error("Không tìm thấy task hoặc bạn không có quyền sửa task này");
    }

    // 2. Kiểm tra Assignee (nếu có thay đổi người phụ trách)
    if (assignedTo !== undefined && assignedTo !== null && assignedTo.toString() !== task.assignedTo?.toString()) {
        const isAssignedUserMember = await MemberModel.exists({
            workspaceId,
            userId: assignedTo
        });
        if (!isAssignedUserMember) {
            throw new Error("Người được giao việc phải là thành viên của workspace này");
        }
    }

    // 3. Cập nhật dữ liệu (Chỉ cập nhật nếu field đó được gửi lên - khác undefined)
    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (priority !== undefined) task.priority = priority as TaskPriorityEnumType;
    if (status !== undefined) task.status = status as TaskStatusEnumType;
    if (dueDate !== undefined) task.dueDate = dueDate ? new Date(dueDate) : null;
    if (assignedTo !== undefined) task.assignedTo = assignedTo ? new mongoose.Types.ObjectId(assignedTo) : null;

    await task.save();
    return task.populate([
        { path: "assignedTo", select: "_id name email profilePicture" },
        { path: "projectId", select: "_id name emoji" }
    ]);
}

export const getAllTasksService = async (
    workspaceId: string,
    filters: {
        projectId?: string;
        status?: string[];
        priority?: string[];
        assignedTo?: string[];
        keyword?: string;
        dueDate?: string;
    },
    pagination: {
        page: number;
        pageSize: number;
    }
) => {
    const query: any = { workspaceId: new mongoose.Types.ObjectId(workspaceId) };

    if (filters.projectId) {
        query.projectId = new mongoose.Types.ObjectId(filters.projectId);
    }

    if (filters.status && filters.status.length > 0) {
        query.status = { $in: filters.status };
    }

    if (filters.priority && filters.priority.length > 0) {
        query.priority = { $in: filters.priority };
    }

    if (filters.assignedTo && filters.assignedTo.length > 0) {
        query.assignedTo = { $in: filters.assignedTo.map(id => new mongoose.Types.ObjectId(id)) };
    }

    if (filters.keyword) {
        query.title = { $regex: filters.keyword, $options: "i" };
    }

    if (filters.dueDate) {
        const startOfDay = new Date(filters.dueDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(filters.dueDate);
        endOfDay.setHours(23, 59, 59, 999);
        query.dueDate = { $gte: startOfDay, $lte: endOfDay };
    }

    // Tính toán phân trang
    const skip = (pagination.page - 1) * pagination.pageSize;

    // Thực hiện truy vấn đồng thời để tối ưu hiệu năng
    const [tasks, totalCount] = await Promise.all([
        TaskModel.find(query)
            .populate("assignedTo", "_id name email profilePicture")
            .populate("projectId", "_id name")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(pagination.pageSize),
        TaskModel.countDocuments(query)
    ]);

    const totalPages = Math.ceil(totalCount / pagination.pageSize);

    return {
        tasks,
        pagination: {
            totalCount,
            totalPages,
            currentPage: pagination.page,
            pageSize: pagination.pageSize,
            skip
        }
    };
};

export const getTaskByIdService = async (
    workspaceId: string,
    projectId: string,
    taskId: string
) => {
    const task = await TaskModel.findOne({
        _id: taskId,
        workspaceId,
        projectId
    })
        .populate("assignedTo", "_id name email profilePicture")
        .populate("projectId", "_id name")
        .populate("createdBy", "_id name email profilePicture");
    if (!task) {
        throw new Error("Không tìm thấy task");
    }
    return task;
};

export const deleteTaskService = async (
    workspaceId: string,
    taskId: string
) => {
    const task = await TaskModel.findOneAndDelete({
        _id: taskId,
        workspaceId
    });
    if (!task) {
        throw new Error("Không tìm thấy task");
    }
    return task;
};  
