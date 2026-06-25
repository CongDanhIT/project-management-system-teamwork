import api from "./api";
import axios from "axios";

export const AssetService = {
    listAssets: async (projectId: string, folderId?: string | null, phaseId?: string | null) => {
        const params: any = {};
        if (folderId) params.folderId = folderId;
        if (phaseId) params.phaseId = phaseId;
        
        const response = await api.get(`/asset/project/${projectId}`, { params });
        return response.data;
    },

    getUploadUrl: async (fileName: string, contentType: string) => {
        const response = await api.post("/asset/presigned-url", { fileName, contentType });
        return response.data;
    },

    uploadToR2: async (uploadUrl: string, file: File) => {
        // Upload trực tiếp lên R2 mà không dùng Auth header của hệ thống
        return await axios.put(uploadUrl, file, {
            headers: {
                "Content-Type": file.type,
            },
        });
    },

    confirmUpload: async (data: {
        workspaceId: string;
        projectId: string;
        folderId?: string | null;
        phaseId?: string | null;
        name: string;
        storageKey: string;
        fileUrl: string;
        fileSize: number;
        fileType: string;
    }) => {
        const response = await api.post("/asset/confirm", data);
        return response.data;
    },

    createFolder: async (data: {
        workspaceId: string;
        projectId: string;
        phaseId?: string | null;
        parentFolderId?: string | null;
        name: string;
    }) => {
        const response = await api.post("/asset/folder", data);
        return response.data;
    },

    deleteAsset: async (assetId: string) => {
        const response = await api.delete(`/asset/${assetId}`);
        return response.data;
    },

    deleteFolder: async (folderId: string) => {
        const response = await api.delete(`/asset/folder/${folderId}`);
        return response.data;
    },

    updateFolder: async (folderId: string, data: { name?: string; isPinned?: boolean }) => {
        const response = await api.patch(`/asset/folder/${folderId}`, data);
        return response.data;
    },

    updateAsset: async (assetId: string, data: { name?: string; isPinned?: boolean }) => {
        const response = await api.patch(`/asset/${assetId}`, data);
        return response.data;
    }
};
