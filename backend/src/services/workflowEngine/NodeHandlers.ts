import TaskModel from "../../models/task.model";
import ProjectModel from "../../models/project.model";
import MemberModel from "../../models/member.model";
import logger from "../../utils/logger";
import eventDispatcher, { EVENTS } from "../../utils/eventDispatcher";
import { NotificationService } from "../../services/notification.service";
import { NotificationType } from "../../models/notification.model";

// Types for Context
export interface WorkflowContext {
    workflowId: string;
    workspaceId: string;
    projectId: string;
    triggerPayload: any; // e.g. { taskId: string, oldStatus: string, newStatus: string }
    currentPayload: any; // the payload passing through the edges
}

export class NodeHandlers {
    
    static async handleCondition(nodeData: any, context: WorkflowContext): Promise<{ nextHandle: string, payload: any }> {
        const field = nodeData.field || "priority";
        const operator = nodeData.operator || "equals";
        // Bổ sung default value giống UI (tránh trường hợp user chưa từng edit node nên data bị undefined)
        const value = nodeData.value || (field === "status" ? "TODO" : "LOW");
        
        const task = await TaskModel.findById(context.triggerPayload.taskId);
        if (!task) {
            logger.warn("Task not found for condition node", { taskId: context.triggerPayload.taskId });
            return { nextHandle: "false", payload: context.currentPayload };
        }

        let isMatch = false;
        const taskValue = (task as any)[field];

        switch(operator) {
            case "equals":
                isMatch = String(taskValue) === String(value);
                break;
            case "not_equals":
                isMatch = String(taskValue) !== String(value);
                break;
            // Add more operators as needed
            default:
                isMatch = false;
        }

        return {
            nextHandle: isMatch ? "true" : "false",
            payload: context.currentPayload
        };
    }

    // ACTION NODES
    static async handleUpdateTaskAction(nodeData: any, context: WorkflowContext): Promise<{ payload: any }> {
        const field = nodeData.field || "priority";
        const value = nodeData.value || (field === "status" ? "TODO" : "LOW");
        
        const task = await TaskModel.findById(context.triggerPayload.taskId);
        if (task) {
            (task as any)[field] = value;
            await task.save();
            logger.info("Workflow Action Executed: Task updated", { workflowId: context.workflowId, taskId: task._id, field, value });
            
            const project = await ProjectModel.findById(context.projectId);
            
            // Emit event để Frontend tự động refresh (Realtime)
            eventDispatcher.emit(EVENTS.TASK.UPDATED, {
                projectId: context.projectId,
                workspaceId: context.workspaceId,
                taskId: task._id,
                task,
                userName: "Hệ thống",
                taskTitle: task.title,
                projectName: project ? project.name : "Dự án"
            });
        }
        return { payload: context.currentPayload };
    }

    static async handleSendNotificationAction(nodeData: any, context: WorkflowContext): Promise<{ payload: any }> {
        const message = nodeData.message;
        const to = nodeData.to || "assignee";
        try {
            const task = await TaskModel.findById(context.triggerPayload.taskId);
            if (!task) return { payload: context.currentPayload };

            const processedMessage = message ? message.replace("{task_title}", task.title) : `Công việc "${task.title}" có cập nhật tự động từ hệ thống.`;
            
            let recipientIds: string[] = [];
            
            if (to === "assignee") {
                recipientIds = task.assignedTo.map(id => id.toString());
            } else if (to === "creator") {
                recipientIds = [task.createdBy.toString()];
            } else if (to === "all_members") {
                // Lấy toàn bộ thành viên trong Workspace
                const members = await MemberModel.find({ workspaceId: context.workspaceId }).select("userId");
                recipientIds = members.map(m => m.userId.toString());
            }
            
            // Loại bỏ trùng lặp ID
            recipientIds = [...new Set(recipientIds)];
            
            for (const recipientId of recipientIds) {
                if (!recipientId) continue;
                await NotificationService.createNotification({
                    recipientId,
                    senderId: task.createdBy.toString(), // Dùng người tạo task làm người gửi tạm thời
                    workspaceId: context.workspaceId,
                    type: NotificationType.TASK_UPDATED,
                    title: 'Thông báo tự động (Workflow)',
                    message: processedMessage,
                    refId: task._id.toString(),
                    refType: 'Task',
                    metadata: { projectId: context.projectId, isSystem: true }
                });
            }
            
            logger.info("Workflow Action Executed: Notification sent", { workflowId: context.workflowId, to, message: processedMessage });
        } catch (error: any) {
            logger.error("Error sending workflow notification", { error: error.message });
        }
        
        return { payload: context.currentPayload };
    }
}
