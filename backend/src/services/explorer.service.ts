import mongoose from "mongoose";
import ProjectModel from "../models/project.model";
import AssetFolderModel from "../models/asset-folder.model";
import ProjectAssetModel from "../models/project-asset.model";
import AssetService from "./asset.service";

export const getWorkspaceExplorerService = async (workspaceId: string) => {
    const workspaceIdObj = new mongoose.Types.ObjectId(workspaceId);

    // 1. Lấy tất cả dự án trong workspace
    const projects = await ProjectModel.find({
        workspaceId: workspaceIdObj,
        deletedAt: null
    }).select("_id name emoji").lean();

    // 2. Lấy tất cả folder trong workspace
    const folders = await AssetFolderModel.find({
        workspaceId: workspaceIdObj,
        deletedAt: null
    }).select("_id name projectId parentFolderId visibility isPinned").lean();

    // 3. Lấy tất cả asset trong workspace
    const assets = await ProjectAssetModel.find({
        workspaceId: workspaceIdObj,
        deletedAt: null
    }).select("_id name fileUrl fileSize fileType projectId folderId category status storageKey createdAt createdBy isPinned").lean();

    // Thêm Signed URL cho mỗi file
    const assetsWithSignedUrls = await Promise.all(assets.map(async (asset) => {
        try {
            const signedUrl = await AssetService.getObjectSignedUrl(asset.storageKey);
            return { ...asset, fileUrl: signedUrl };
        } catch (error) {
            console.error(`Error signing URL for asset ${asset._id}:`, error);
            return asset;
        }
    }));

    return {
        projects,
        folders,
        assets: assetsWithSignedUrls
    };
};
