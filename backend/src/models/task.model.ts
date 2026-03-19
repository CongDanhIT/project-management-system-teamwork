import mongoose, { Schema, model } from "mongoose";
import { TaskPriorityEnum, TaskPriorityEnumType, TaskStatusEnum, TaskStatusEnumType } from "../enums/task.enum";

export interface TaskDocument extends mongoose.Document {
    taskCode: string;
    title: string;
    description: string | null;
    projectId: mongoose.Types.ObjectId;
    workspaceId: mongoose.Types.ObjectId;
    status: TaskStatusEnumType;
    priority: TaskPriorityEnumType;
    assignedTo: mongoose.Types.ObjectId | null;
    createdBy: mongoose.Types.ObjectId;
    dueDate: Date | null;
    createdAt: Date;
    updatedAt: Date;
}
const taskSchema = new Schema<TaskDocument>({
    taskCode: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    description: { type: String },
    projectId: { type: mongoose.Types.ObjectId, ref: "Project", required: true },
    workspaceId: { type: mongoose.Types.ObjectId, ref: "Workspace", required: true },
    status: { type: String, enum: Object.values(TaskStatusEnum), default: TaskStatusEnum.TODO },
    priority: { type: String, enum: Object.values(TaskPriorityEnum), default: TaskPriorityEnum.MEDIUM },
    assignedTo: { type: mongoose.Types.ObjectId, ref: "User", default: null },
    createdBy: { type: mongoose.Types.ObjectId, ref: "User", required: true },
    dueDate: { type: Date, default: null },

}, {
    timestamps: true
});

// Tối ưu hoá truy vấn Database với Index
taskSchema.index({ workspaceId: 1, status: 1 });
taskSchema.index({ projectId: 1, status: 1 });
taskSchema.index({ assignedTo: 1 });
taskSchema.index({ taskCode: 1 }, { unique: true });

const TaskModel = model<TaskDocument>("Task", taskSchema);

export default TaskModel;