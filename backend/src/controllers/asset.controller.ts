import { Request, Response } from "express";
import AssetService from "../services/asset.service";
import logger from "../utils/logger";
import ProjectAssetModel from "../models/project-asset.model";
import MemberModel from "../models/member.model";
import AssetFolderModel from "../models/asset-folder.model";

export const getUploadUrl = async (req: Request, res: Response) => {
    try {
        const { fileName, contentType } = req.body;
        if (!fileName || !contentType) {
            return res.status(400).json({ message: "FileName and ContentType are required" });
        }

        const data = await AssetService.getPresignedUrl(fileName, contentType);
        res.status(200).json(data);
    } catch (error: any) {
        logger.error("Error getting presigned URL", { error: error.message });
        res.status(500).json({ message: error.message });
    }
};

export const confirmUpload = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?._id;
        const asset = await AssetService.confirmUpload({
            ...req.body,
            createdBy: userId,
        });
        res.status(201).json({ message: "Asset confirmed and saved", data: asset });
    } catch (error: any) {
        logger.error("Error confirming upload", { error: error.message });
        res.status(500).json({ message: error.message });
    }
};

export const createFolder = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?._id;
        const folder = await AssetService.createFolder({
            ...req.body,
            createdBy: userId,
        });
        res.status(201).json({ message: "Folder created", data: folder });
    } catch (error: any) {
        logger.error("Error creating folder", { error: error.message });
        res.status(500).json({ message: error.message });
    }
};

export const listAssets = async (req: Request, res: Response) => {
    try {
        const { projectId } = req.params;
        const { folderId, phaseId } = req.query;
        
        const assets = await AssetService.listAssets(
            projectId as string, 
            folderId as string || null, 
            phaseId as string || null
        );
        res.status(200).json({ data: assets });
    } catch (error: any) {
        logger.error("Error listing assets", { error: error.message });
        res.status(500).json({ message: error.message });
    }
};

export const deleteAsset = async (req: Request, res: Response) => {
    try {
        const { assetId } = req.params;
        const userId = (req as any).user?._id;

        // 1. Get asset to check creator
        const asset = await ProjectAssetModel.findById(assetId);
        if (!asset) {
            return res.status(404).json({ message: "Không tìm thấy tài liệu" });
        }

        // 2. Check permissions
        const isCreator = asset.createdBy.toString() === userId.toString();
        
        const member = await MemberModel.findOne({ 
            workspaceId: asset.workspaceId, 
            userId: userId 
        }).populate('role');
        
        const isAdmin = member && (member.role as any).name === 'ADMIN';

        if (!isCreator && !isAdmin) {
            return res.status(403).json({ message: "Bạn không có quyền xóa tài liệu này" });
        }

        await AssetService.deleteAsset(assetId as string, userId.toString());
        res.status(200).json({ message: "Đã chuyển tài liệu vào thùng rác" });
    } catch (error: any) {
        logger.error("Error deleting asset", { error: error.message });
        res.status(500).json({ message: error.message });
    }
};

export const deleteFolder = async (req: Request, res: Response) => {
    try {
        const { folderId } = req.params;
        const userId = (req as any).user?._id;

        // 1. Get folder to check creator
        const folder = await AssetFolderModel.findById(folderId);
        if (!folder) {
            return res.status(404).json({ message: "Không tìm thấy thư mục" });
        }

        // 2. Check permissions
        const isCreator = folder.createdBy.toString() === userId.toString();
        const member = await MemberModel.findOne({ 
            workspaceId: folder.workspaceId, 
            userId: userId 
        }).populate('role');
        const isAdmin = member && (member.role as any).name === 'ADMIN';

        if (!isCreator && !isAdmin) {
            return res.status(403).json({ message: "Bạn không có quyền xóa thư mục này" });
        }

        // 3. Soft delete folder
        await AssetService.deleteFolder(folderId as string, userId.toString());

        // 4. Soft delete all assets inside this folder
        await ProjectAssetModel.updateMany(
            { folderId: folderId },
            { deletedAt: new Date() }
        );

        res.status(200).json({ message: "Đã chuyển thư mục và các tài liệu bên trong vào thùng rác" });
    } catch (error: any) {
        logger.error("Error deleting folder", { error: error.message });
        res.status(500).json({ message: error.message });
    }
};

export const updateFolder = async (req: Request, res: Response) => {
    try {
        const { folderId } = req.params;
        const userId = (req as any).user?._id;
        
        const folder = await AssetService.updateFolder(folderId as string, req.body, userId.toString());
        res.status(200).json({ message: "Cập nhật thư mục thành công", data: folder });
    } catch (error: any) {
        logger.error("Error updating folder", { error: error.message });
        res.status(500).json({ message: error.message });
    }
};

export const updateAsset = async (req: Request, res: Response) => {
    try {
        const { assetId } = req.params;
        const userId = (req as any).user?._id;
        
        const asset = await AssetService.updateAsset(assetId as string, req.body, userId.toString());
        res.status(200).json({ message: "Cập nhật tài liệu thành công", data: asset });
    } catch (error: any) {
        logger.error("Error updating asset", { error: error.message });
        res.status(500).json({ message: error.message });
    }
};
