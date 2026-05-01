import { S3Client, PutObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "../config/env";
import AssetFolderModel from "../models/asset-folder.model";
import ProjectAssetModel from "../models/project-asset.model";
import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";
import { logActivity } from "./activity.service";
import { ActivityActionEnum, ActivityEntityTypeEnum } from "../models/activity-log.model";

class AssetService {
    private s3Client: S3Client;

    constructor() {
        this.s3Client = new S3Client({
            region: "auto",
            endpoint: process.env.R2_ENDPOINT || "",
            credentials: {
                accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
                secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
            },
        });
    }

    // 1. Tạo thư mục ảo
    async createFolder(data: any) {
        const folder = new AssetFolderModel(data);
        const savedFolder = await folder.save();
        
        if (savedFolder) {
            await logActivity({
                workspaceId: savedFolder.workspaceId.toString(),
                projectId: savedFolder.projectId.toString(),
                userId: savedFolder.createdBy.toString(),
                action: ActivityActionEnum.CREATE_FOLDER,
                entityType: ActivityEntityTypeEnum.ASSET_FOLDER,
                entityId: savedFolder._id.toString(),
                details: {
                    summary: `đã tạo thư mục mới: ${savedFolder.name}`
                }
            });
        }
        
        return savedFolder;
    }

    // 1.1. Cập nhật thư mục (Đổi tên)
    async updateFolder(folderId: string, data: any, userId: string) {
        const oldFolder = await AssetFolderModel.findById(folderId);
        const folder = await AssetFolderModel.findByIdAndUpdate(folderId, { $set: data }, { new: true });
        
        if (folder && oldFolder) {
            const oldValues: any = { name: oldFolder.name };
            let detailedSummary = `đã cập nhật thư mục: **${folder.name}**`;
            
            if (oldFolder.name !== folder.name) {
                detailedSummary = `đã đổi tên thư mục từ **"${oldFolder.name}"** thành **"${folder.name}"**`;
            }

            await logActivity({
                workspaceId: folder.workspaceId.toString(),
                projectId: folder.projectId.toString(),
                userId: userId,
                action: ActivityActionEnum.UPDATE_FOLDER,
                entityType: ActivityEntityTypeEnum.ASSET_FOLDER,
                entityId: folder._id.toString(),
                details: {
                    oldValue: oldValues,
                    newValue: data,
                    summary: detailedSummary
                }
            });
        }
        
        return folder;
    }

    // 2. Lấy danh sách Folder và File trong một folder (hoặc root)
    async listAssets(projectId: string, folderId: string | null = null, phaseId: string | null = null) {
        const query: any = {
            projectId: new mongoose.Types.ObjectId(projectId),
            deletedAt: null,
        };

        if (folderId) {
            query.parentFolderId = new mongoose.Types.ObjectId(folderId);
        } else {
            query.parentFolderId = null;
        }

        if (phaseId) {
            query.phaseId = new mongoose.Types.ObjectId(phaseId);
        }

        const folders = await AssetFolderModel.find(query)
            .populate("createdBy", "name profilePicture")
            .sort({ name: 1 });
        
        const filesQuery: any = {
            projectId: new mongoose.Types.ObjectId(projectId),
            deletedAt: null,
        };
        if (folderId) {
            filesQuery.folderId = new mongoose.Types.ObjectId(folderId);
        } else {
            filesQuery.folderId = null;
        }
        if (phaseId) {
            filesQuery.phaseId = new mongoose.Types.ObjectId(phaseId);
        }

        const files = await ProjectAssetModel.find(filesQuery)
            .populate("createdBy", "name profilePicture")
            .sort({ createdAt: -1 });

        return { folders, files };
    }

    // 3. Sinh Presigned URL để upload trực tiếp từ Frontend
    async getPresignedUrl(fileName: string, contentType: string) {
        const key = `projects/${uuidv4()}-${fileName}`;
        const command = new PutObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            Key: key,
            ContentType: contentType,
        });

        const uploadUrl = await getSignedUrl(this.s3Client, command, { expiresIn: 300 }); // 5 phút

        return {
            uploadUrl,
            storageKey: key,
            fileUrl: `${process.env.R2_ENDPOINT}/${process.env.R2_BUCKET_NAME}/${key}`, // Lưu ý: R2 có thể cần config public domain
        };
    }

    // 4. Xác nhận upload thành công (Lưu vào DB)
    async confirmUpload(data: any) {
        const asset = new ProjectAssetModel(data);
        const savedAsset = await asset.save();
        
        if (savedAsset) {
            await logActivity({
                workspaceId: savedAsset.workspaceId.toString(),
                projectId: savedAsset.projectId.toString(),
                userId: savedAsset.createdBy.toString(),
                action: ActivityActionEnum.UPLOAD_FILE,
                entityType: ActivityEntityTypeEnum.ASSET,
                entityId: savedAsset._id.toString(),
                details: {
                    summary: `đã tải lên tài liệu: ${savedAsset.name}`
                }
            });
        }
        
        return savedAsset;
    }

    // 4.1. Cập nhật tài liệu (Đổi tên)
    async updateAsset(assetId: string, data: any, userId: string) {
        const oldAsset = await ProjectAssetModel.findById(assetId);
        const asset = await ProjectAssetModel.findByIdAndUpdate(assetId, { $set: data }, { new: true });
        
        if (asset && oldAsset) {
            const oldValues: any = { name: oldAsset.name };
            let detailedSummary = `đã cập nhật tài liệu: **${asset.name}**`;

            if (oldAsset.name !== asset.name) {
                detailedSummary = `đã đổi tên tài liệu từ **"${oldAsset.name}"** thành **"${asset.name}"**`;
            }

            await logActivity({
                workspaceId: asset.workspaceId.toString(),
                projectId: asset.projectId.toString(),
                userId: userId,
                action: ActivityActionEnum.RENAME_FILE,
                entityType: ActivityEntityTypeEnum.ASSET,
                entityId: asset._id.toString(),
                details: {
                    oldValue: oldValues,
                    newValue: data,
                    summary: detailedSummary
                }
            });
        }
        
        return asset;
    }

    // 5. Xóa tài nguyên (Soft delete + Schedule physical delete)
    async deleteAsset(assetId: string, userId: string) {
        const asset = await ProjectAssetModel.findByIdAndUpdate(assetId, { deletedAt: new Date() }, { new: true });
        
        if (asset) {
            await logActivity({
                workspaceId: asset.workspaceId.toString(),
                projectId: asset.projectId.toString(),
                userId: userId,
                action: ActivityActionEnum.DELETE_FILE,
                entityType: ActivityEntityTypeEnum.ASSET,
                entityId: asset._id.toString(),
                details: {
                    summary: `đã xóa tài liệu: ${asset.name}`
                }
            });
        }
        
        return asset;
    }

    // 5.1. Xóa thư mục (Soft delete)
    async deleteFolder(folderId: string, userId: string) {
        const folder = await AssetFolderModel.findByIdAndUpdate(folderId, { deletedAt: new Date() }, { new: true });
        
        if (folder) {
            await logActivity({
                workspaceId: folder.workspaceId.toString(),
                projectId: folder.projectId.toString(),
                userId: userId,
                action: ActivityActionEnum.DELETE_FOLDER,
                entityType: ActivityEntityTypeEnum.ASSET_FOLDER,
                entityId: folder._id.toString(),
                details: {
                    summary: `đã xóa thư mục: ${folder.name}`
                }
            });
        }
        
        return folder;
    }

    // 6. Xóa vật lý trên R2 (Dùng cho Cron Job)
    async hardDeleteFromR2(storageKey: string) {
        const command = new DeleteObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            Key: storageKey,
        });
        return await this.s3Client.send(command);
    }

    // 7. Liệt kê tất cả object trên R2 để tìm file mồ côi
    async listAllR2Objects() {
        const command = new ListObjectsV2Command({
            Bucket: process.env.R2_BUCKET_NAME,
            Prefix: 'projects/', // Chỉ quét trong folder projects
        });
        
        const response = await this.s3Client.send(command);
        return response.Contents || [];
    }
}

export default new AssetService();
