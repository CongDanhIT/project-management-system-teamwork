import { Request, Response } from "express";
import PhaseService from "../services/phase.service";
import logger from "../utils/logger";
import { asyncHandler } from "../middlewares/asyncHandle";

export const createPhase = async (req: Request, res: Response) => {
    try {
        const { workspaceId, projectId, name, description, startDate, endDate, isLocked } = req.body;
        const userId = (req as any).user?._id;

        const phase = await PhaseService.createPhase({
            workspaceId,
            projectId,
            name,
            description,
            startDate,
            endDate,
            isLocked,
            createdBy: userId,
        });

        res.status(201).json({
            message: "Phase created successfully",
            data: phase,
        });
    } catch (error: any) {
        logger.error("Error creating phase", { error: error.message });
        res.status(500).json({ message: error.message });
    }
};

export const getPhases = async (req: Request, res: Response) => {
    try {
        const { projectId } = req.params;
        const phases = await PhaseService.getPhasesByProject(projectId as string);
        res.status(200).json({ data: phases });
    } catch (error: any) {
        logger.error("Error fetching phases", { error: error.message });
        res.status(500).json({ message: error.message });
    }
};

export const updatePhase = asyncHandler(async (req: Request, res: Response) => {
    const { phaseId } = req.params;
    logger.info(">>> ENTERING updatePhase Controller <<<");
    logger.info(`[DEBUG] Phase ID from params: ${phaseId}`);
    logger.info(`[DEBUG] Body content: ${JSON.stringify(req.body, null, 2)}`);
    
    const phase = await PhaseService.updatePhase(phaseId as string, req.body);
    
    if (!phase) {
        logger.info(`[DEBUG] Update FAILED: Phase not found in DB`);
        logger.warn(`Phase ${phaseId} not found or update failed`);
        return res.status(404).json({ message: "Không tìm thấy giai đoạn hoặc cập nhật thất bại" });
    }
    
    logger.info(`[DEBUG] Update SUCCESS! New isLocked state: ${phase.isLocked}`);
    logger.info(`Phase ${phaseId} updated successfully`, { data: phase });
    res.status(200).json({ 
        success: true,
        message: "Cập nhật giai đoạn thành công", 
        data: phase 
    });
});

export const deletePhase = async (req: Request, res: Response) => {
    try {
        const { phaseId } = req.params;
        const userId = (req as any).user?._id;
        await PhaseService.deletePhase(phaseId as string, userId);
        res.status(200).json({ message: "Xóa giai đoạn thành công (Soft Delete)" });
    } catch (error: any) {
        logger.error("Error deleting phase", { error: error.message });
        res.status(500).json({ message: error.message });
    }
};

export const restorePhase = async (req: Request, res: Response) => {
    try {
        const { phaseId } = req.params;
        const userId = (req as any).user?._id;
        const phase = await PhaseService.restorePhase(phaseId as string, userId);
        res.status(200).json({ 
            message: "Khôi phục giai đoạn thành công",
            data: phase 
        });
    } catch (error: any) {
        logger.error("Error restoring phase", { error: error.message });
        res.status(500).json({ message: error.message });
    }
};export const getDeletedPhases = async (req: Request, res: Response) => {
    try {
        const { workspaceId } = req.params;
        const phases = await PhaseService.getDeletedPhases(workspaceId as string);
        res.status(200).json(phases);
    } catch (error: any) {
        logger.error("Error getting deleted phases", { error: error.message });
        res.status(500).json({ message: error.message });
    }
};

export const hardDeletePhase = async (req: Request, res: Response) => {
    try {
        const { phaseId } = req.params;
        await PhaseService.hardDeletePhase(phaseId as string);
        res.status(200).json({ message: "Đã xóa vĩnh viễn giai đoạn thành công" });
    } catch (error: any) {
        logger.error("Error hard deleting phase", { error: error.message });
        res.status(500).json({ message: error.message });
    }
};
export const getPhasesByWorkspace = async (req: Request, res: Response) => {
    try {
        const { workspaceId } = req.params;
        const phases = await PhaseService.getPhasesByWorkspace(workspaceId as string);
        res.status(200).json({ data: phases });
    } catch (error: any) {
        logger.error("Error fetching workspace phases", { error: error.message });
        res.status(500).json({ message: error.message });
    }
};
