import mongoose, { Schema, model } from "mongoose";
import { TaskPriorityEnum, TaskPriorityEnumType, TaskStatusEnum, TaskStatusEnumType } from "../enums/task.enum";

export interface TaskDocument extends mongoose.Document {
    taskCode: string;
    title: string;
    description: string | null;
    projectId: mongoose.Types.ObjectId;
    workspaceId: mongoose.Types.ObjectId;
    parentId: mongoose.Types.ObjectId | null; //  ID của Task cha (nếu là Subtask)
    status: TaskStatusEnumType;
    priority: TaskPriorityEnumType;
    assignedTo: mongoose.Types.ObjectId[]; // [MULTI-ASSIGNEE] Mảng người thực hiện, rỗng = chưa gán
    createdBy: mongoose.Types.ObjectId;
    startDate: Date | null; //  Ngày bắt đầu (Cho Calendar/Gantt)
    dueDate: Date | null;
    completedAt: Date | null; //  Ngày thực tế hoàn thành để tính chỉ số Performance
    estimatedHours: number; //  Thời gian dự tính (Giờ)
    loggedHours: number;    //  Thời gian thực tế đã dùng (Giờ)
    phaseId: mongoose.Types.ObjectId | null; // ID của Giai đoạn dự án
    tags: mongoose.Types.ObjectId[]; // Danh sách nhãn cho Task
    deletedAt: Date | null; //  Ngày xóa (Cho Soft Delete dự án cha)
    requiresApproval: boolean; //  Cần chờ duyệt trước khi hoàn thành
    overdueNotificationSent: boolean; //  Đã gửi thông báo quá hạn chưa
    embedding?: number[]; // Lưu trữ vector cho Semantic Search (1024 dimensions)
    embeddingUpdatedAt?: Date | null; // Theo dõi thời gian cập nhật vector
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
    assignedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    createdBy: { type: mongoose.Types.ObjectId, ref: "User", required: true },
    startDate: { type: Date, default: null },
    dueDate: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    estimatedHours: { type: Number, default: 0 },
    loggedHours: { type: Number, default: 0 },
    tags: [{ type: mongoose.Schema.Types.ObjectId, ref: "Tag" }],
    phaseId: { type: Schema.Types.ObjectId, ref: "Phase", default: null },
    requiresApproval: { type: Boolean, default: false },
    overdueNotificationSent: { type: Boolean, default: false },
    embedding: { type: [Number], default: [] },
    embeddingUpdatedAt: { type: Date, default: null },
    deletedAt: { type: Date, default: null },

}, {
    timestamps: true
});

// Tối ưu hoá truy vấn Database với Index
taskSchema.index({ workspaceId: 1, status: 1 });
taskSchema.index({ projectId: 1, status: 1 });
taskSchema.index({ completedAt: 1 }); // Quan trọng cho Analytics Performance
taskSchema.index({ parentId: 1 }); // Quan trọng: Lấy Subtasks của 1 Task
taskSchema.index({ deletedAt: 1 }); // Lọc các Task bị ẩn theo Dự án
taskSchema.index({ assignedTo: 1 });
taskSchema.index({ projectId: 1, taskCode: 1 }, { unique: true });

const TaskModel = model<TaskDocument>("Task", taskSchema);

export default TaskModel;