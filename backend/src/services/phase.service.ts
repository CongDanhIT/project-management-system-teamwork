import mongoose from "mongoose";
import PhaseModel, { PhaseDocument } from "../models/phase.model";
import TaskModel from "../models/task.model";
import ProjectModel from "../models/project.model";
import { logActivity } from "./activity.service";
import { ActivityActionEnum, ActivityEntityTypeEnum } from "../models/activity-log.model";

class PhaseService {
    async createPhase(data: Partial<PhaseDocument>) {
        const phase = new PhaseModel(data);
        const savedPhase = await phase.save();

        if (savedPhase) {
            await logActivity({
                workspaceId: savedPhase.workspaceId.toString(),
                projectId: savedPhase.projectId.toString(),
                userId: savedPhase.createdBy.toString(),
                action: ActivityActionEnum.CREATE_PHASE,
                entityType: ActivityEntityTypeEnum.PHASE,
                entityId: savedPhase._id.toString(),
                details: {
                    summary: `đã tạo giai đoạn mới: ${savedPhase.name}`
                }
            });
        }

        return savedPhase;
    }

    async getPhasesByProject(projectId: string) {
        return await PhaseModel.find({
            projectId: new mongoose.Types.ObjectId(projectId),
            deletedAt: null,
        }).sort({ startDate: 1, createdAt: 1 });
    }

    async getPhaseById(phaseId: string) {
        return await PhaseModel.findOne({
            _id: new mongoose.Types.ObjectId(phaseId),
            deletedAt: null,
        });
    }

    async updatePhase(phaseId: string, data: Partial<PhaseDocument>) {
        const oldPhase = await PhaseModel.findById(phaseId);
        const phase = await PhaseModel.findOneAndUpdate(
            { _id: new mongoose.Types.ObjectId(phaseId), deletedAt: null },
            { $set: data },
            { new: true }
        );

        if (phase && oldPhase) {
            const changedFields = Object.keys(data);
            const oldValues: any = {};
            changedFields.forEach(key => {
                oldValues[key] = (oldPhase as any)[key];
            });

            let detailedSummary = `đã cập nhật giai đoạn: **${phase.name}**`;
            if (changedFields.includes('name') && oldPhase.name !== phase.name) {
                detailedSummary = `đã đổi tên giai đoạn từ **${oldPhase.name}** thành **${phase.name}**`;
            } else if (changedFields.includes('isLocked')) {
                detailedSummary = phase.isLocked ? `đã khóa giai đoạn **${phase.name}**` : `đã mở khóa giai đoạn **${phase.name}**`;
            }

            await logActivity({
                workspaceId: phase.workspaceId.toString(),
                projectId: phase.projectId.toString(),
                userId: (data as any).updatedBy || phase.createdBy.toString(),
                action: ActivityActionEnum.UPDATE_PHASE,
                entityType: ActivityEntityTypeEnum.PHASE,
                entityId: phase._id.toString(),
                details: {
                    oldValue: oldValues,
                    newValue: data,
                    summary: detailedSummary
                }
            });
        }

        return phase;
    }

    async deletePhase(phaseId: string, userId?: string) {
        const now = new Date();
        // Soft delete phase
        const phase = await PhaseModel.findOneAndUpdate(
            { _id: new mongoose.Types.ObjectId(phaseId) },
            { $set: { deletedAt: now } },
            { new: true }
        );

        if (phase) {
            // Soft delete all tasks inside this phase as well
            await TaskModel.updateMany(
                { phaseId: phase._id, deletedAt: null },
                { $set: { deletedAt: now } }
            );

            await logActivity({
                workspaceId: phase.workspaceId.toString(),
                projectId: phase.projectId.toString(),
                userId: userId || phase.createdBy.toString(),
                action: ActivityActionEnum.DELETE_PHASE,
                entityType: ActivityEntityTypeEnum.PHASE,
                entityId: phase._id.toString(),
                details: {
                    summary: `đã xóa giai đoạn: ${phase.name}`
                }
            });
        }

        return phase;
    }

    async restorePhase(phaseId: string, userId?: string) {
        // 0. Check if the phase exists
        const phaseToRestore = await PhaseModel.findById(phaseId);
        if (!phaseToRestore) {
            throw new Error("Giai đoạn không tồn tại.");
        }

        // 1. Check if the project is deleted
        const project = await ProjectModel.findById(phaseToRestore.projectId);
        if (!project || project.deletedAt !== null) {
            throw new Error("Khôi phục thất bại vì dự án của giai đoạn này vẫn đang ở trong thùng rác. Vui lòng khôi phục dự án trước để tiếp tục.");
        }

        // Restore phase
        const phase = await PhaseModel.findOneAndUpdate(
            { _id: new mongoose.Types.ObjectId(phaseId) },
            { $set: { deletedAt: null } },
            { new: true }
        );

        if (phase) {
            await TaskModel.updateMany(
                { phaseId: phase._id },
                { $set: { deletedAt: null } }
            );

            await logActivity({
                workspaceId: phase.workspaceId.toString(),
                projectId: phase.projectId.toString(),
                userId: userId || phase.createdBy.toString(),
                action: ActivityActionEnum.RESTORE_PHASE,
                entityType: ActivityEntityTypeEnum.PHASE,
                entityId: phase._id.toString(),
                details: {
                    summary: `đã khôi phục giai đoạn: ${phase.name}`
                }
            });
        }

        return phase;
    }

    async getDeletedPhases(workspaceId: string) {
        return await PhaseModel.find({
            workspaceId: new mongoose.Types.ObjectId(workspaceId),
            deletedAt: { $ne: null }
        }).sort({ deletedAt: -1 }).populate("projectId", "name emoji");
    }

    async hardDeletePhase(phaseId: string) {
        // 1. Delete all tasks belonging to this phase permanently
        await TaskModel.deleteMany({ phaseId: new mongoose.Types.ObjectId(phaseId) });
        
        // 2. Delete the phase itself
        return await PhaseModel.findByIdAndDelete(phaseId);
    }

    async getPhasesByWorkspace(workspaceId: string) {
        return await PhaseModel.find({
            workspaceId: new mongoose.Types.ObjectId(workspaceId),
            deletedAt: null,
        }).sort({ projectId: 1, startDate: 1, createdAt: 1 });
    }
}

export default new PhaseService();
