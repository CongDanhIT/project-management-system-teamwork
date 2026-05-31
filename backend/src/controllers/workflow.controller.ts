import { Request, Response } from "express";
import WorkflowModel from "../models/workflow.model";
import logger from "../utils/logger";
import { WorkflowExecutor } from "../services/workflowEngine/Executor";
import { WorkflowContext } from "../services/workflowEngine/NodeHandlers";

export const getWorkflows = async (req: Request, res: Response) => {
    try {
        const projectId = req.params.projectId;
        const workflows = await WorkflowModel.find({ projectId });
        res.status(200).json(workflows);
    } catch (error: any) {
        logger.error("Failed to get workflows", { error: error.message });
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getWorkflowById = async (req: Request, res: Response) => {
    try {
        const workflow = await WorkflowModel.findById(req.params.id);
        if (!workflow) {
            return res.status(404).json({ message: "Workflow not found" });
        }
        res.status(200).json(workflow);
    } catch (error: any) {
        logger.error("Failed to get workflow", { error: error.message });
        res.status(500).json({ message: "Internal server error" });
    }
};

export const createWorkflow = async (req: Request, res: Response) => {
    try {
        const workflow = new WorkflowModel(req.body);
        await workflow.save();
        res.status(201).json(workflow);
    } catch (error: any) {
        logger.error("Failed to create workflow", { error: error.message });
        res.status(400).json({ message: error.message });
    }
};

export const updateWorkflow = async (req: Request, res: Response) => {
    try {
        const workflow = await WorkflowModel.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!workflow) {
            return res.status(404).json({ message: "Workflow not found" });
        }
        res.status(200).json(workflow);
    } catch (error: any) {
        logger.error("Failed to update workflow", { error: error.message });
        res.status(400).json({ message: error.message });
    }
};

export const deleteWorkflow = async (req: Request, res: Response) => {
    try {
        const workflow = await WorkflowModel.findByIdAndDelete(req.params.id);
        if (!workflow) {
            return res.status(404).json({ message: "Workflow not found" });
        }
        res.status(200).json({ message: "Workflow deleted" });
    } catch (error: any) {
        logger.error("Failed to delete workflow", { error: error.message });
        res.status(500).json({ message: "Internal server error" });
    }
};

export const testWorkflowTrigger = async (req: Request, res: Response) => {
    try {
        const { workflowId, taskId } = req.body;
        const workflow = await WorkflowModel.findById(workflowId);
        if (!workflow || !workflow.isActive) {
            return res.status(400).json({ message: "Workflow is not active or not found" });
        }

        // Find the trigger node
        const triggerNode = workflow.nodes.find((n: any) => n.type.startsWith("trigger_"));
        if (!triggerNode) {
            return res.status(400).json({ message: "Workflow has no trigger node" });
        }

        const context: WorkflowContext = {
            workflowId: workflow.id,
            workspaceId: workflow.workspaceId.toString(),
            projectId: workflow.projectId.toString(),
            triggerPayload: { taskId },
            currentPayload: { taskId }
        };

        const executor = new WorkflowExecutor(workflow.nodes, workflow.edges, context);
        await executor.execute(triggerNode.id);

        res.status(200).json({ message: "Workflow executed" });
    } catch (error: any) {
        logger.error("Failed to test workflow", { error: error.message });
        res.status(500).json({ message: "Internal server error" });
    }
};
