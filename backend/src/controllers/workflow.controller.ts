import { Request, Response } from "express";
import WorkflowModel from "../models/workflow.model";
import ProjectModel from "../models/project.model";
import logger from "../utils/logger";
import { WorkflowExecutor } from "../services/workflowEngine/Executor";
import { WorkflowContext } from "../services/workflowEngine/NodeHandlers";
import { asyncHandler } from "../middlewares/asyncHandle";
import { getMemberRoleInWorkspace } from "../services/member.service";
import { roleGuard } from "../utils/roleGuard";
import { Permissions } from "../enums/role.enum";

export const getWorkflows = asyncHandler(async (req: Request, res: Response) => {
    const projectId = req.params.projectId;
    const userId = (req.user?._id as any).toString();
    
    const project = await ProjectModel.findById(projectId);
    if (!project) {
        return res.status(404).json({ message: "Project not found" });
    }
    
    const role = await getMemberRoleInWorkspace(project.workspaceId.toString(), userId);
    roleGuard(role.name, [Permissions.VIEW_ONLY]);

    const workflows = await WorkflowModel.find({ projectId });
    return res.status(200).json(workflows);
});

export const getWorkflowById = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id;
    const userId = (req.user?._id as any).toString();

    const workflow = await WorkflowModel.findById(id);
    if (!workflow) {
        return res.status(404).json({ message: "Workflow not found" });
    }

    const role = await getMemberRoleInWorkspace(workflow.workspaceId.toString(), userId);
    roleGuard(role.name, [Permissions.VIEW_ONLY]);

    return res.status(200).json(workflow);
});

export const createWorkflow = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req.user?._id as any).toString();
    const { workspaceId } = req.body;
    
    if (!workspaceId) {
        return res.status(400).json({ message: "Workspace ID is required" });
    }

    const role = await getMemberRoleInWorkspace(workspaceId, userId);
    roleGuard(role.name, [Permissions.MANAGE_AUTOMATION]);

    const workflow = new WorkflowModel(req.body);
    await workflow.save();
    return res.status(201).json(workflow);
});

export const updateWorkflow = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id;
    const userId = (req.user?._id as any).toString();

    const workflow = await WorkflowModel.findById(id);
    if (!workflow) {
        return res.status(404).json({ message: "Workflow not found" });
    }

    const role = await getMemberRoleInWorkspace(workflow.workspaceId.toString(), userId);
    roleGuard(role.name, [Permissions.MANAGE_AUTOMATION]);

    const updatedWorkflow = await WorkflowModel.findByIdAndUpdate(id, req.body, { new: true });
    return res.status(200).json(updatedWorkflow);
});

export const deleteWorkflow = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id;
    const userId = (req.user?._id as any).toString();

    const workflow = await WorkflowModel.findById(id);
    if (!workflow) {
        return res.status(404).json({ message: "Workflow not found" });
    }

    const role = await getMemberRoleInWorkspace(workflow.workspaceId.toString(), userId);
    roleGuard(role.name, [Permissions.MANAGE_AUTOMATION]);

    await WorkflowModel.findByIdAndDelete(id);
    return res.status(200).json({ message: "Workflow deleted" });
});

export const testWorkflowTrigger = asyncHandler(async (req: Request, res: Response) => {
    const { workflowId, taskId } = req.body;
    const userId = (req.user?._id as any).toString();

    const workflow = await WorkflowModel.findById(workflowId);
    if (!workflow) {
        return res.status(404).json({ message: "Workflow not found" });
    }

    const role = await getMemberRoleInWorkspace(workflow.workspaceId.toString(), userId);
    roleGuard(role.name, [Permissions.MANAGE_AUTOMATION]);

    if (!workflow.isActive) {
        return res.status(400).json({ message: "Workflow is not active" });
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

    return res.status(200).json({ message: "Workflow executed" });
});
