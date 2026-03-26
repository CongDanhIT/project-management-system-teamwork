import mongoose from "mongoose";
import TaskModel from "../models/task.model";
import { TaskPriorityEnum, TaskStatusEnum, TaskPriorityEnumType, TaskStatusEnumType } from "../enums/task.enum";
import MemberModel from "../models/member.model";
import ProjectModel from "../models/project.model";

const updateParentHours = async (parentId: string | mongoose.Types.ObjectId) => {
    const subtasks = await TaskModel.find({ parentId, deletedAt: null });
    const totalEstimated = subtasks.reduce((sum, st) => sum + (st.estimatedHours || 0), 0);
    const totalLogged = subtasks.reduce((sum, st) => sum + (st.loggedHours || 0), 0);

    await TaskModel.findByIdAndUpdate(parentId, {
        estimatedHours: totalEstimated,
        loggedHours: totalLogged
    });
};


export const createTaskService = async (
    workspaceId: string,
    projectId: string,
    body: {
        title: string;
        description?: string | null;
        priority?: string;
        status?: string;
        startDate?: Date | null;
        dueDate?: Date | null;
        assignedTo?: string | null;
        parentId?: string | null;
        estimatedHours?: number;
        loggedHours?: number;
        subtasks?: string[];
    },
    userId: string
) => {
    const { title, description, priority, status, startDate, dueDate, assignedTo, parentId, estimatedHours, loggedHours, subtasks } = body;
    
    // 1. Kiểm tra Workspace Member
    if (assignedTo) {
        const isAssignedUserMember = await MemberModel.exists({
            workspaceId,
            userId: assignedTo
        });
        if (!isAssignedUserMember) {
            throw new Error("Người được giao việc phải là thành viên của workspace này");
        }
    }

    // 2. Kiểm tra Dự án để lấy Prefix
    const project = await ProjectModel.findById(projectId);
    if (!project) throw new Error("Dự án không tồn tại");
    
    // Tạo mác Prefix (ví dụ: My Project -> MP)
    let prefix = project.name.split(' ').filter(word => word.length > 0)
        .map(word => word[0].toUpperCase())
        .join('').substring(0, 3);
    if (!prefix || !/^[A-Z]+$/.test(prefix)) prefix = 'TSK';

    let taskCode = '';

    // 3. Kiểm tra Parent Task (nếu có) và khởi tạo Task Code
    if (parentId) {
        const parentTask = await TaskModel.findOne({ _id: parentId, workspaceId, projectId, deletedAt: null });
        if (!parentTask) {
            throw new Error("Không tìm thấy công việc cha hoặc công việc cha đã bị xóa");
        }
        
        const subTaskCount = await TaskModel.countDocuments({ parentId });
        taskCode = `${parentTask.taskCode}.${subTaskCount + 1}`;
    } else {
        const topLevelCount = await TaskModel.countDocuments({ projectId, parentId: null });
        taskCode = `${prefix}-${topLevelCount + 1}`;
        
        // Tránh trùng mã khi xóa và bị lệch index
        let isExists = await TaskModel.exists({ taskCode, projectId });
        let jump = 1;
        while(isExists) {
           taskCode = `${prefix}-${topLevelCount + 1 + jump}`;
           isExists = await TaskModel.exists({ taskCode, projectId });
           jump++;
        }
    }

    const task = new TaskModel({
        title,
        description: description ?? null,
        priority: (priority as TaskPriorityEnumType) || TaskPriorityEnum.MEDIUM,
        status: (status as TaskStatusEnumType) || TaskStatusEnum.TODO,
        startDate: startDate || null,
        dueDate: dueDate || null,
        assignedTo: assignedTo ? new mongoose.Types.ObjectId(assignedTo) : null,
        parentId: parentId ? new mongoose.Types.ObjectId(parentId) : null,
        estimatedHours: estimatedHours || 0,
        loggedHours: loggedHours || 0,
        taskCode,
        workspaceId,
        projectId,
        createdBy: userId,
    });

    await task.save();

    // 4. Tạo nhiệm vụ con (nếu có - gọi tuần tự để tránh trùng taskCode)
    if (subtasks && subtasks.length > 0) {
        for (const subtaskTitle of subtasks) {
            await createTaskService(workspaceId, projectId, {
                title: subtaskTitle,
                parentId: (task._id as mongoose.Types.ObjectId).toString(),
                status: (task.status as string),
                priority: (task.priority as string)
            }, userId);
        }
    }

    // Nếu là task con, cập nhật giờ cho task cha
    if (parentId) {
        await updateParentHours(parentId);
    }

    return task.populate([
        { path: "assignedTo", select: "_id name email profilePicture" },
        { path: "projectId", select: "_id name emoji" },
        { path: "parentId", select: "_id title taskCode" }
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
        startDate?: Date | null;
        dueDate?: Date | null;
        assignedTo?: string | null;
        parentId?: string | null;
        estimatedHours?: number;
        loggedHours?: number;
    },
    userId: string,
    taskId: string
) => {
    // 1. Tìm task và đảm bảo nó thuộc đúng Workspace/Project và chưa bị xóa
    const task = await TaskModel.findOne({
        _id: taskId,
        workspaceId,
        projectId,
        deletedAt: null
    });

    if (!task) {
        throw new Error("Không tìm thấy công việc hoặc bạn không có quyền sửa");
    }

    // 2. Kiểm tra Assignee (nếu có thay đổi)
    if (body.assignedTo !== undefined && body.assignedTo !== null && body.assignedTo.toString() !== task.assignedTo?.toString()) {
        const isAssignedUserMember = await MemberModel.exists({ workspaceId, userId: body.assignedTo });
        if (!isAssignedUserMember) {
            throw new Error("Người được giao việc phải là thành viên của workspace này");
        }
    }

    // 3. Update các trường
    if (body.title !== undefined) task.title = body.title;
    if (body.description !== undefined) task.description = body.description;
    if (body.priority !== undefined) task.priority = body.priority as TaskPriorityEnumType;
    
    // Kiểm tra quy tắc hoàn thành (DONE)
    if (body.status !== undefined && body.status === TaskStatusEnum.DONE && task.status !== TaskStatusEnum.DONE) {
        const hasUnfinishedSubtasks = await TaskModel.exists({
            parentId: taskId,
            status: { $ne: TaskStatusEnum.DONE },
            deletedAt: null
        });
        if (hasUnfinishedSubtasks) {
            throw new Error("Không thể hoàn thành! Vui lòng hoàn thành tất cả công việc con trước.");
        }
    }

    if (body.status !== undefined) task.status = body.status as TaskStatusEnumType;
    if (body.startDate !== undefined) task.startDate = body.startDate;
    if (body.dueDate !== undefined) task.dueDate = body.dueDate;
    if (body.assignedTo !== undefined) task.assignedTo = body.assignedTo ? new mongoose.Types.ObjectId(body.assignedTo) : null;
    
    if (body.estimatedHours !== undefined) task.estimatedHours = body.estimatedHours;
    if (body.loggedHours !== undefined) task.loggedHours = body.loggedHours;

    await task.save();

    // Cập nhật giờ cho task cha hiện tại (nếu có)
    if (task.parentId) {
        await updateParentHours(task.parentId);
    }

    return task.populate([
        { path: "assignedTo", select: "_id name email profilePicture" },
        { path: "projectId", select: "_id name emoji" },
        { path: "parentId", select: "_id title taskCode" }
    ]);
}

export const getAllTasksService = async (
    workspaceId: string,
    filters: {
        projectId?: string;
        parentId?: string | null;
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
    // Luôn lọc các task chưa bị xóa mềm (theo dự án cha)
    const query: any = { workspaceId: new mongoose.Types.ObjectId(workspaceId), deletedAt: null };

    if (filters.projectId) {
        query.projectId = new mongoose.Types.ObjectId(filters.projectId);
    }

    // Lọc theo parentId (Null = lấy task cha, String = lấy subtasks)
    if (filters.parentId !== undefined) {
        query.parentId = filters.parentId ? new mongoose.Types.ObjectId(filters.parentId) : null;
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

    const skip = (pagination.page - 1) * pagination.pageSize;

    const [tasks, totalCount] = await Promise.all([
        TaskModel.find(query)
            .populate("assignedTo", "_id name email profilePicture")
            .populate("projectId", "_id name")
            .populate("parentId", "_id title taskCode")
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
        projectId,
        deletedAt: null
    })
        .populate("assignedTo", "_id name email profilePicture")
        .populate("projectId", "_id name")
        .populate("parentId", "_id title taskCode")
        .populate("createdBy", "_id name email profilePicture");
    if (!task) {
        throw new Error("Không tìm thấy công việc");
    }
    return task;
};

// [AI-ADDED] Lấy danh sách subtasks của một task cha (Hỗ trợ phân trang)
export const getSubtasksService = async (
    workspaceId: string, 
    parentId: string,
    pagination: { page: number; pageSize: number } = { page: 1, pageSize: 4 }
) => {
    const query = {
        workspaceId,
        parentId: new mongoose.Types.ObjectId(parentId),
        deletedAt: null
    };

    const skip = (pagination.page - 1) * pagination.pageSize;

    const [tasks, totalCount] = await Promise.all([
        TaskModel.find(query)
            .populate("assignedTo", "_id name email profilePicture")
            .populate("projectId", "_id name")
            .sort({ createdAt: 1 })
            .skip(skip)
            .limit(pagination.pageSize),
        TaskModel.countDocuments(query)
    ]);

    return {
        tasks,
        totalCount,
        totalPages: Math.ceil(totalCount / pagination.pageSize),
        currentPage: pagination.page,
        pageSize: pagination.pageSize
    };
};

export const deleteTaskService = async (
    workspaceId: string,
    taskId: string
) => {
    // Soft Delete: Chỉ đánh dấu deletedAt thay vì xóa vĩnh viễn
    const task = await TaskModel.findOneAndUpdate(
        {
            _id: taskId,
            workspaceId,
            deletedAt: null // Chỉ xóa những task chưa bị xóa
        },
        {
            deletedAt: new Date()
        },
        { new: true }
    );

    if (!task) {
        throw new Error("Không tìm thấy công việc để xóa hoặc đã bị xóa trước đó");
    }
    
    // Nếu đây là task cha, soft delete luôn các subtasks của nó
    await TaskModel.updateMany(
        { parentId: taskId, deletedAt: null },
        { deletedAt: new Date() }
    );

    // Nếu task bị xóa là task con, cập nhật lại số giờ của task cha
    if (task.parentId) {
        await updateParentHours(task.parentId);
    }

    return task;
};

// [AI-ADDED] Lấy danh sách task đã xóa mềm trong Workspace
export const getDeletedTasksService = async (workspaceId: string) => {
    const tasks = await TaskModel.find({
        workspaceId,
        deletedAt: { $ne: null }
    }).sort({ deletedAt: -1 })
    .populate("projectId", "name emoji")
    .populate("assignedTo", "name email profilePicture");

    return tasks;
};

// [AI-ADDED] Khôi phục Task đã bị xóa mềm
export const restoreTaskService = async (
    workspaceId: string,
    taskId: string
) => {
    const task = await TaskModel.findOne({ _id: taskId, workspaceId, deletedAt: { $ne: null } });

    if (!task) {
        throw new Error("Không tìm thấy công việc để khôi phục");
    }

    // 1. Kiểm tra dự án của task này có bị xóa không?
    const project = await ProjectModel.findById(task.projectId);
    if (!project || project.deletedAt !== null) {
        throw new Error("Khôi phục thất bại vì dự án của công việc này vẫn đang ở trong thùng rác. Vui lòng khôi phục dự án trước để tiếp tục.");
    }

    task.deletedAt = null;
    await task.save();

    // Khôi phục luôn subtasks nếu task này có subtasks (không bắt buộc nhưng thường là mong muốn của User)
    await TaskModel.updateMany(
        { parentId: taskId, deletedAt: { $ne: null } },
        { deletedAt: null }
    );

    // Cập nhật lại số giờ của task cha nếu đây là subtasks
    if (task.parentId) {
        await updateParentHours(task.parentId);
    }

    return task;
};
