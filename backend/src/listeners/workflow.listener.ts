import eventDispatcher, { EVENTS } from "../utils/eventDispatcher";
import logger from "../utils/logger";
import WorkflowModel from "../models/workflow.model";
import { WorkflowExecutor } from "../services/workflowEngine/Executor";
import { WorkflowContext } from "../services/workflowEngine/NodeHandlers";

export const initWorkflowListeners = () => {
    logger.info("[LISTENER] Khởi tạo Workflow Automation Listeners...");

    // Helper chung để thực thi workflow
    const runWorkflow = async (projectId: any, workspaceId: any, taskId: any, triggerType: 'task_created' | 'task_status_changed', task: any) => {
        try {
            // Tìm tất cả workflow đang active trong project này
            const activeWorkflows = await WorkflowModel.find({
                projectId,
                isActive: true
            });

            if (!activeWorkflows || activeWorkflows.length === 0) return;

            for (const workflow of activeWorkflows) {
                // Kiểm tra xem workflow này có node Trigger loại "trigger_task_status" không
                const triggerNodes = workflow.nodes.filter(
                    (n: any) => n.type === "trigger_task_status"
                );

                for (const triggerNode of triggerNodes) {
                    const nodeTriggerType = triggerNode.data?.triggerType || 'task_status_changed';
                    
                    // Nếu kiểu sự kiện không khớp (tạo task vs đổi trạng thái) -> Bỏ qua
                    if (nodeTriggerType !== triggerType) {
                        continue;
                    }

                    // Nếu là đổi trạng thái, kiểm tra xem có khớp targetStatus không (nếu cấu hình)
                    if (triggerType === 'task_status_changed') {
                        const targetStatus = triggerNode.data?.targetStatus;
                        if (targetStatus && targetStatus !== task.status) {
                            continue; // Trạng thái không khớp với trigger -> Bỏ qua
                        }
                    }

                    // Khởi tạo Context và chạy
                    const context: WorkflowContext = {
                        workflowId: workflow.id,
                        workspaceId: workspaceId.toString(),
                        projectId: projectId.toString(),
                        triggerPayload: { taskId: taskId.toString(), newStatus: task.status },
                        currentPayload: { taskId: taskId.toString() }
                    };

                    const executor = new WorkflowExecutor(workflow.nodes, workflow.edges, context);
                    logger.info(`Triggering Workflow ${workflow.name} (${triggerType}) for Task ${taskId}`);
                    
                    // Chạy ngầm không await để không block luồng chính
                    executor.execute(triggerNode.id).catch(err => {
                        logger.error(`Error executing workflow ${workflow.id}`, { error: err.message });
                    });
                }
            }
        } catch (error: any) {
            logger.error(`Error in runWorkflow for event ${triggerType}`, { error: error.message });
        }
    };

    // Lắng nghe sự kiện Task mới được tạo
    eventDispatcher.on(EVENTS.TASK.CREATED, async (data) => {
        const { projectId, workspaceId, taskId, task } = data;
        await runWorkflow(projectId, workspaceId, taskId, 'task_created', task);
    });

    // Lắng nghe sự kiện Task thay đổi trạng thái
    eventDispatcher.on(EVENTS.TASK.UPDATED, async (data) => {
        const { projectId, workspaceId, taskId, task } = data;
        await runWorkflow(projectId, workspaceId, taskId, 'task_status_changed', task);
    });
};
