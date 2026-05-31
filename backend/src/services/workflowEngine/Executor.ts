import logger from "../../utils/logger";
import { NodeHandlers, WorkflowContext } from "./NodeHandlers";

export class WorkflowExecutor {
    private nodes: any[];
    private edges: any[];
    private context: WorkflowContext;

    constructor(nodes: any[], edges: any[], context: WorkflowContext) {
        this.nodes = nodes;
        this.edges = edges;
        this.context = context;
    }

    // Traversal starts from a specific trigger node
    public async execute(startNodeId: string) {
        logger.info(`Starting workflow execution`, { workflowId: this.context.workflowId, startNodeId });
        await this.traverse(startNodeId);
    }

    private async traverse(currentNodeId: string) {
        const currentNode = this.nodes.find(n => n.id === currentNodeId);
        if (!currentNode) {
            logger.warn(`Node ${currentNodeId} not found in workflow`, { workflowId: this.context.workflowId });
            return;
        }

        let nextHandle: string | null = null;

        try {
            // 1. Execute current node logic based on its type
            if (currentNode.type === "logic_condition") {
                const result = await NodeHandlers.handleCondition(currentNode.data, this.context);
                nextHandle = result.nextHandle;
                this.context.currentPayload = result.payload;
            } else if (currentNode.type === "action_update_task") {
                const actionType = currentNode.data.actionType || "action_update_task";
                if (actionType === "action_send_notification") {
                    const result = await NodeHandlers.handleSendNotificationAction(currentNode.data, this.context);
                    this.context.currentPayload = result.payload;
                } else {
                    const result = await NodeHandlers.handleUpdateTaskAction(currentNode.data, this.context);
                    this.context.currentPayload = result.payload;
                }
            } else if (currentNode.type === "trigger_task_status") {
                // Triggers typically just pass through their payload when executed as part of traversal
                // (though they are usually the starting point)
                logger.info(`Passing through trigger node ${currentNodeId}`, { workflowId: this.context.workflowId });
            } else {
                logger.warn(`Unknown node type: ${currentNode.type}`, { workflowId: this.context.workflowId });
            }

            // 2. Find next edges
            // We look for edges where source is currentNodeId
            // If nextHandle is defined (e.g. 'true' or 'false' from a condition), we only follow edges with that sourceHandle
            const nextEdges = this.edges.filter(edge => {
                if (edge.source !== currentNodeId) return false;
                if (nextHandle && edge.sourceHandle !== nextHandle) return false;
                return true;
            });

            // 3. Traverse recursively
            for (const edge of nextEdges) {
                await this.traverse(edge.target);
            }

        } catch (error: any) {
            logger.error(`Error executing node ${currentNodeId}`, { workflowId: this.context.workflowId, error: error.message });
            // Should potentially halt execution or handle failure
        }
    }
}
