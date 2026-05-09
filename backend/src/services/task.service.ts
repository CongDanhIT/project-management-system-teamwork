import mongoose from "mongoose";
import TaskModel from "../models/task.model";
import TaskCommentModel from "../models/task-comment.model";
import { TaskPriorityEnum, TaskStatusEnum, TaskPriorityEnumType, TaskStatusEnumType } from "../enums/task.enum";
import MemberModel from "../models/member.model";
import ProjectModel from "../models/project.model";
import { ProjectStatusEnum } from "../enums/projectStatus.enum";
import { createSystemCommentService } from "./interaction.service";
import { logActivityService } from "./activity.service";
import { ActivityActionEnum, ActivityEntityTypeEnum } from "../models/activity-log.model";
import PhaseModel from "../models/phase.model";
import { RoleEnum } from "../enums/role.enum";
import { getMemberRoleInWorkspace } from "./member.service";

const updateParentHours = async (parentId: string | mongoose.Types.ObjectId) => {
    const subtasks = await TaskModel.find({ parentId, deletedAt: null });
    const totalEstimated = subtasks.reduce((sum, st) => sum + (st.estimatedHours || 0), 0);
    const totalLogged = subtasks.reduce((sum, st) => sum + (st.loggedHours || 0), 0);

    await TaskModel.findByIdAndUpdate(parentId, {
        estimatedHours: totalEstimated,
        loggedHours: totalLogged
    });
};

const validatePhaseLock = async (workspaceId: string, userId: string, phaseId?: string | mongoose.Types.ObjectId | null) => {
    if (!phaseId) return;
    const phase = await PhaseModel.findById(phaseId);
    if (phase?.isLocked) {
        const role = await getMemberRoleInWorkspace(workspaceId, userId);
        if (role.name === RoleEnum.MEMBER) {
            throw new Error("Giai đoạn này đã bị khóa. Chỉ Quản trị viên hoặc Chủ sở hữu mới có quyền chỉnh sửa.");
        }
    }
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
        assignedTo?: string[]; // [MULTI-ASSIGNEE] Mảng ID người thực hiện
        parentId?: string | null;
        estimatedHours?: number;
        loggedHours?: number;
        subtasks?: string[];
        tags?: string[]; // Mảng ID nhãn
        phaseId?: string | null;
    },
    userId: string
) => {
    const { title, description, priority, status, startDate, dueDate, assignedTo, parentId, estimatedHours, loggedHours, subtasks, tags, phaseId } = body;
    
    // 0. Kiểm tra phase bị khóa (nếu có phaseId)
    await validatePhaseLock(workspaceId, userId, phaseId);

    // 1. [MULTI-ASSIGNEE] Kiểm tra tất cả Workspace Members
    if (assignedTo && assignedTo.length > 0) {
        for (const userId of assignedTo) {
            const isMember = await MemberModel.exists({
                workspaceId,
                userId,
            });
            if (!isMember) {
                throw new Error(`Người dùng ${userId} không phải thành viên của workspace này`);
            }
        }
    }

    // 2. Kiểm tra Dự án để lấy Prefix
    const project = await ProjectModel.findById(projectId);
    if (!project) throw new Error("Dự án không tồn tại");
    if (project && (project.status === ProjectStatusEnum.FROZEN || project.status === ProjectStatusEnum.ON_HOLD || project.status === ProjectStatusEnum.COMPLETED)) {
        throw new Error(`Dự án đang ở trạng thái ${project.status}. Bạn không thể thay đổi thông tin công việc.`);
    }
    
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
        completedAt: ((status === TaskStatusEnum.DONE || status === TaskStatusEnum.COMPLETED) ? new Date() : null),
        startDate: startDate || null,
        dueDate: dueDate || null,
        assignedTo: (assignedTo && assignedTo.length > 0) ? assignedTo.map(id => new mongoose.Types.ObjectId(id)) : [],
        parentId: parentId ? new mongoose.Types.ObjectId(parentId) : null,
        estimatedHours: estimatedHours || 0,
        loggedHours: loggedHours || 0,
        taskCode,
        workspaceId,
        projectId,
        phaseId: phaseId ? new mongoose.Types.ObjectId(phaseId) : null,
        createdBy: userId,
        tags: (tags && tags.length > 0) ? tags.map(id => new mongoose.Types.ObjectId(id)) : [],
    });

    await task.save();

    // 4. Tạo nhiệm vụ con (nếu có - gọi tuần tự để tránh trùng taskCode)
    if (subtasks && subtasks.length > 0) {
        for (const subtaskTitle of subtasks) {
            await createTaskService(workspaceId, projectId, {
                title: subtaskTitle,
                parentId: (task._id as mongoose.Types.ObjectId).toString(),
                status: (task.status as string),
                priority: (task.priority as string),
                phaseId: phaseId ? phaseId.toString() : undefined
            }, userId);
        }
    }

    // Nếu là task con, cập nhật giờ cho task cha
    if (parentId) {
        await updateParentHours(parentId);
    }

    // [ACTIVITY-LOG] Ghi nhật ký tạo Task
    await logActivityService({
        workspaceId,
        projectId,
        userId,
        action: ActivityActionEnum.CREATE_TASK,
        entityType: ActivityEntityTypeEnum.TASK,
        entityId: (task._id as mongoose.Types.ObjectId).toString(),
        details: {
            summary: `đã tạo công việc **${task.title}**`
        }
    });

    return task.populate([
        { path: "assignedTo", select: "_id name email profilePicture" },
        { path: "projectId", select: "_id name emoji" },
        { path: "parentId", select: "_id title taskCode" },
        { path: "tags" }
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
        assignedTo?: string[]; // [MULTI-ASSIGNEE] Mảng ID người thực hiện
        parentId?: string | null;
        estimatedHours?: number;
        loggedHours?: number;
        tags?: string[]; // Thêm tags vào đây
        phaseId?: string | null;
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

    // 1.1 Kiểm tra phase hiện tại có bị khóa không
    await validatePhaseLock(workspaceId, userId, task.phaseId);

    // 1.2 Nếu đang thay đổi phase, kiểm tra phase mới có bị khóa không
    if (body.phaseId !== undefined && body.phaseId !== task.phaseId?.toString()) {
        await validatePhaseLock(workspaceId, userId, body.phaseId);
    }

    const project = await ProjectModel.findById(projectId);
    if (project && (project.status === ProjectStatusEnum.FROZEN || project.status === ProjectStatusEnum.ON_HOLD || project.status === ProjectStatusEnum.COMPLETED)) {
        throw new Error(`Dự án đang ở trạng thái ${project.status}. Bạn không thể thay đổi thông tin công việc.`);
    }

    // 2. [MULTI-ASSIGNEE] Kiểm tra tất cả Assignees mới
    if (body.assignedTo !== undefined && body.assignedTo.length > 0) {
        for (const userId of body.assignedTo) {
            const isMember = await MemberModel.exists({ workspaceId, userId });
            if (!isMember) {
                throw new Error(`Người dùng ${userId} không phải thành viên của workspace này`);
            }
        }
    }

    // 2.1 Capture old values for logging
    const oldValues: any = {};
    Object.keys(body).forEach((key) => {
        if ((body as any)[key] !== undefined) {
            oldValues[key] = (task as any)[key];
        }
    });

    // 3. Update các trường
    if (body.title !== undefined) task.title = body.title;
    if (body.description !== undefined) task.description = body.description;
    
    if (body.priority !== undefined && task.priority !== body.priority) {
        const oldPriority = task.priority;
        task.priority = body.priority as TaskPriorityEnumType;
        await createSystemCommentService(workspaceId, taskId, userId, `đã thay đổi mức ưu tiên từ **${oldPriority}** sang **${body.priority}**`);
    }
    
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

    if (body.status !== undefined) {
        const isDone = body.status === TaskStatusEnum.DONE || body.status === TaskStatusEnum.COMPLETED;
        const wasDone = task.status === TaskStatusEnum.DONE || task.status === TaskStatusEnum.COMPLETED;

        if (isDone && !wasDone) {
            task.completedAt = new Date();
        } else if (!isDone) {
            task.completedAt = null;
        }

        const oldStatus = task.status;
        task.status = body.status as TaskStatusEnumType;
        if (oldStatus !== body.status) {
            await createSystemCommentService(workspaceId, taskId, userId, `đã chuyển trạng thái từ **${oldStatus}** sang **${body.status}**`);
        }
    }
    // Update dates - Only update if explicitly provided and not null to prevent accidental data loss
    if (body.startDate !== undefined && body.startDate !== null) {
      task.startDate = body.startDate;
    }
    
    if (body.dueDate !== undefined && body.dueDate !== null && task.dueDate?.toString() !== new Date(body.dueDate).toString()) {
      task.dueDate = body.dueDate;
      await createSystemCommentService(workspaceId, taskId, userId, `đã cập nhật hạn chót mới là **${new Date(body.dueDate).toLocaleDateString('vi-VN')}**`);
    }
    if (body.assignedTo !== undefined) {
        task.assignedTo = body.assignedTo.length > 0
            ? body.assignedTo.map(id => new mongoose.Types.ObjectId(id)) as any
            : [];
    }
    
    if (body.estimatedHours !== undefined) task.estimatedHours = body.estimatedHours;
    if (body.loggedHours !== undefined) task.loggedHours = body.loggedHours;
    if (body.tags !== undefined) {
        task.tags = body.tags.map(id => new mongoose.Types.ObjectId(id)) as any;
    }
    if (body.phaseId !== undefined) {
        task.phaseId = body.phaseId ? new mongoose.Types.ObjectId(body.phaseId) : null;
    }

    await task.save();

    // Cập nhật giờ cho task cha hiện tại (nếu có)
    if (task.parentId) {
        await updateParentHours(task.parentId);
    }

    // [ACTIVITY-LOG] Ghi nhật ký cập nhật Task
    const changedFields = Object.keys(oldValues).filter(key => {
        const oldV = oldValues[key];
        const newV = (body as any)[key];
        
        // So sánh Date hoặc String/Number
        if (oldV instanceof Date || (typeof oldV === 'string' && !isNaN(Date.parse(oldV)))) {
           return new Date(oldV).getTime() !== new Date(newV).getTime();
        }
        return JSON.stringify(oldV) !== JSON.stringify(newV);
    });

    let detailedSummary = `đã cập nhật thông tin công việc **${task.title}**`;
    
    if (changedFields.includes('status')) {
        detailedSummary = `đã chuyển trạng thái công việc **${task.title}** từ **${oldValues.status}** sang **${task.status}**`;
    } else if (changedFields.includes('priority')) {
        detailedSummary = `đã đổi mức ưu tiên công việc **${task.title}** từ **${oldValues.priority}** sang **${task.priority}**`;
    } else if (changedFields.includes('startDate') || changedFields.includes('dueDate')) {
        detailedSummary = `đã cập nhật lại lịch trình thời gian cho công việc **${task.title}**`;
    }

    await logActivityService({
        workspaceId,
        projectId,
        userId,
        action: ActivityActionEnum.UPDATE_TASK,
        entityType: ActivityEntityTypeEnum.TASK,
        entityId: task._id.toString(),
        details: {
            oldValue: oldValues,
            newValue: body,
            summary: detailedSummary
        }
    });

    return task.populate([
        { path: "assignedTo", select: "_id name email profilePicture" },
        { path: "projectId", select: "_id name emoji" },
        { path: "parentId", select: "_id title taskCode" },
        { path: "tags" }
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
        isOverdue?: string;
        tags?: string[];
        phaseId?: string;
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

    if (filters.phaseId) {
        query.phaseId = new mongoose.Types.ObjectId(filters.phaseId);
    }

    // Lọc theo parentId (Null = lấy task cha, String = lấy subtasks)
    if (filters.parentId !== undefined) {
        if (filters.parentId === 'null') {
            query.parentId = null;
        } else if (filters.parentId === 'not-null') {
            query.parentId = { $ne: null };
        } else if (filters.parentId && mongoose.Types.ObjectId.isValid(filters.parentId)) {
            query.parentId = new mongoose.Types.ObjectId(filters.parentId);
        }
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

    if (filters.tags && filters.tags.length > 0) {
        query.tags = { $in: filters.tags.map(id => new mongoose.Types.ObjectId(id)) };
    }

    if (filters.dueDate) {
        const startOfDay = new Date(filters.dueDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(filters.dueDate);
        endOfDay.setHours(23, 59, 59, 999);
        query.dueDate = { $gte: startOfDay, $lte: endOfDay };
    }

    if (filters.isOverdue === 'true') {
        query.dueDate = { $lt: new Date() };
        query.status = { $ne: TaskStatusEnum.DONE };
    }

    const skip = (pagination.page - 1) * pagination.pageSize;

    // Sắp xếp mặc định hoặc sắp xếp cho task quá hạn
    const sortOptions: any = filters.isOverdue === 'true' 
        ? { dueDate: 1 } // Trễ nhất lên đầu
        : { createdAt: -1 };

    const [tasks, totalCount] = await Promise.all([
        TaskModel.find(query)
            .populate("assignedTo", "_id name email profilePicture")
            .populate("projectId", "_id name")
            .populate("parentId", "_id title taskCode")
            .populate("phaseId", "_id name")
            .populate("tags")
            .sort(sortOptions)
            .skip(skip)
            .limit(pagination.pageSize),
        TaskModel.countDocuments(query)
    ]);

    // Batch đếm số comment do USER chủ động gửi (không tính SYSTEM)
    const taskIds = tasks.map(t => t._id);
    const commentCounts = await TaskCommentModel.aggregate([
        { $match: { taskId: { $in: taskIds }, type: "USER" } },
        { $group: { _id: "$taskId", count: { $sum: 1 } } }
    ]);

    const commentCountMap = new Map<string, number>();
    for (const item of commentCounts) {
        commentCountMap.set(item._id.toString(), item.count);
    }

    // Gắn userCommentCount vào từng task
    const tasksWithComments = tasks.map(t => {
        const taskObj = t.toObject() as any;
        taskObj.userCommentCount = commentCountMap.get(t._id.toString()) || 0;
        return taskObj;
    });

    const totalPages = Math.ceil(totalCount / pagination.pageSize);

    return {
        tasks: tasksWithComments,
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
    const query: any = {
        _id: taskId,
        workspaceId,
        deletedAt: null
    };

    if (projectId) {
        query.projectId = projectId;
    }

    const task = await TaskModel.findOne(query)
        .populate("assignedTo", "_id name email profilePicture")
        .populate("projectId", "_id name")
        .populate("parentId", "_id title taskCode")
        .populate("createdBy", "_id name email profilePicture")
        .populate("tags");
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
    // Đảm bảo ID hợp lệ trước khi truy vấn
    if (!mongoose.Types.ObjectId.isValid(workspaceId) || !mongoose.Types.ObjectId.isValid(parentId)) {
        return { tasks: [], totalCount: 0, totalPages: 0, currentPage: pagination.page, pageSize: pagination.pageSize };
    }

    const query: any = {
        workspaceId: new mongoose.Types.ObjectId(workspaceId),
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
    taskId: string,
    userId: string
) => {
    const existingTask = await TaskModel.findOne({ _id: taskId, workspaceId, deletedAt: null });
    if (!existingTask) throw new Error("Không tìm thấy công việc để xóa hoặc đã bị xóa trước đó");
    
    const project = await ProjectModel.findById(existingTask.projectId);
    if (project && (project.status === ProjectStatusEnum.FROZEN || project.status === ProjectStatusEnum.ON_HOLD || project.status === ProjectStatusEnum.COMPLETED)) {
        throw new Error(`Dự án đang ở trạng thái ${project.status}. Bạn không thể thay đổi thông tin công việc.`);
    }

    // Kiểm tra phase bị khóa
    await validatePhaseLock(workspaceId, userId, existingTask.phaseId);

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

    // [ACTIVITY-LOG] Ghi nhật ký xóa Task
    await logActivityService({
        workspaceId,
        projectId: task.projectId.toString(),
        userId,
        action: ActivityActionEnum.DELETE_TASK,
        entityType: ActivityEntityTypeEnum.TASK,
        entityId: taskId,
        details: {
            summary: `đã xóa công việc **${task.title}**`
        }
    });

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
    taskId: string,
    userId: string
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

    // 1.1 Kiểm tra giai đoạn (phase) của task này có bị xóa không?
    if (task.phaseId) {
        const phase = await PhaseModel.findById(task.phaseId);
        if (phase && phase.deletedAt !== null) {
            throw new Error("Khôi phục thất bại vì giai đoạn của công việc này vẫn đang ở trong thùng rác. Vui lòng khôi phục giai đoạn trước để tiếp tục.");
        }
    }

    if (project.status === ProjectStatusEnum.FROZEN || project.status === ProjectStatusEnum.ON_HOLD || project.status === ProjectStatusEnum.COMPLETED) {
        throw new Error(`Dự án đang ở trạng thái ${project.status}. Bạn không thể thay đổi thông tin công việc.`);
    }

    // Kiểm tra phase bị khóa
    await validatePhaseLock(workspaceId, userId, task.phaseId);

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

    // [ACTIVITY-LOG] Ghi nhật ký khôi phục Task
    await logActivityService({
        workspaceId,
        projectId: task.projectId.toString(),
        userId,
        action: ActivityActionEnum.RESTORE_TASK,
        entityType: ActivityEntityTypeEnum.TASK,
        entityId: taskId,
        details: {
            summary: `đã khôi phục công việc **${task.title}**`
        }
    });

    return task;
};

// [AI-ADDED] Xóa vĩnh viễn công việc (Hard Delete) và dữ liệu liên quan
export const permanentDeleteTaskService = async (workspaceId: string, taskId: string, userId: string) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        // 1. Kiểm tra task có trong thùng rác không?
        const task = await TaskModel.findOne({ 
            _id: taskId, 
            workspaceId, 
            deletedAt: { $ne: null } 
        }).session(session);

        if (!task) {
            throw new Error("Không tìm thấy công việc trong thùng rác để xóa vĩnh viễn");
        }

        // Kiểm tra phase bị khóa
        await validatePhaseLock(workspaceId, userId, task.phaseId);

        // 2. Cascade Hard Delete:
        // - Xóa toàn bộ Subtasks
        await TaskModel.deleteMany({ parentId: taskId }).session(session);

        // - Xóa Task Comments
        const TaskCommentModel = mongoose.model("TaskComment");
        await TaskCommentModel.deleteMany({ taskId }).session(session);

        // - Xóa Activity Logs
        const ActivityLogModel = mongoose.model("ActivityLog");
        await ActivityLogModel.deleteMany({ entityId: taskId, entityType: ActivityEntityTypeEnum.TASK }).session(session);

        // 3. Xóa vĩnh viễn Task chính
        await TaskModel.deleteOne({ _id: taskId }).session(session);

        await session.commitTransaction();
        return { success: true, message: "Công việc đã được xóa vĩnh viễn" };

    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
};
