import mongoose, { Schema, model } from "mongoose";
import { TaskPriorityEnum, TaskPriorityEnumType, TaskStatusEnum, TaskStatusEnumType } from "../enums/task.enum";

export interface TaskDocument extends mongoose.Document {
    taskCode: string;
    title: string;
    description: string | null;
    projectId: mongoose.Types.ObjectId;
    workspaceId: mongoose.Types.ObjectId;
    parentId: mongoose.Types.ObjectId | null; // [AI-ADDED] ID của Task cha (nếu là Subtask)
    status: TaskStatusEnumType;
    priority: TaskPriorityEnumType;
    assignedTo: mongoose.Types.ObjectId | null;
    createdBy: mongoose.Types.ObjectId;
    startDate: Date | null; // [AI-ADDED] Ngày bắt đầu (Cho Calendar/Gantt)
    dueDate: Date | null;
    estimatedHours: number; // [AI-ADDED] Thời gian dự tính (Giờ)
    loggedHours: number;    // [AI-ADDED] Thời gian thực tế đã dùng (Giờ)
    deletedAt: Date | null; // [AI-ADDED] Ngày xóa (Cho Soft Delete dự án cha)
    createdAt: Date;
    updatedAt: Date;
}
const taskSchema = new Schema<TaskDocument>({
    taskCode: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String },
    projectId: { type: mongoose.Types.ObjectId, ref: "Project", required: true },
    workspaceId: { type: mongoose.Types.ObjectId, ref: "Workspace", required: true },
    parentId: { type: Schema.Types.ObjectId, ref: "Task", default: null },
    status: { type: String, enum: Object.values(TaskStatusEnum), default: TaskStatusEnum.TODO },
    priority: { type: String, enum: Object.values(TaskPriorityEnum), default: TaskPriorityEnum.MEDIUM },
    assignedTo: { type: mongoose.Types.ObjectId, ref: "User", default: null },
    createdBy: { type: mongoose.Types.ObjectId, ref: "User", required: true },
    startDate: { type: Date, default: null },
    dueDate: { type: Date, default: null },
    estimatedHours: { type: Number, default: 0 },
    loggedHours: { type: Number, default: 0 },
    deletedAt: { type: Date, default: null },

}, {
    timestamps: true
});

// Tối ưu hoá truy vấn Database với Index
taskSchema.index({ workspaceId: 1, status: 1 });
taskSchema.index({ projectId: 1, status: 1 });
taskSchema.index({ parentId: 1 }); // Quan trọng: Lấy Subtasks của 1 Task
taskSchema.index({ deletedAt: 1 }); // Lọc các Task bị ẩn theo Dự án
taskSchema.index({ assignedTo: 1 });
taskSchema.index({ projectId: 1, taskCode: 1 }, { unique: true });

const TaskModel = model<TaskDocument>("Task", taskSchema);

export default TaskModel;