export interface Phase {
    _id: string;
    workspaceId: string;
    projectId: string;
    name: string;
    description?: string;
    startDate?: string;
    endDate?: string;
    isLocked: boolean;
    createdBy: string | { name: string; profilePicture?: string };
    createdAt: string;
    updatedAt: string;
}

export interface AssetFolder {
    _id: string;
    workspaceId: string;
    projectId: string;
    phaseId: string | null;
    parentFolderId: string | null;
    name: string;
    visibility: "PUBLIC" | "PRIVATE";
    isPinned?: boolean;
    createdBy: string | { name: string; profilePicture?: string };
    createdAt: string;
    updatedAt: string;
}

export interface ProjectAsset {
    _id: string;
    workspaceId: string;
    projectId: string;
    folderId: string | null;
    phaseId: string | null;
    taskId: string | null;
    name: string;
    storageProvider: "R2" | "DRIVE" | "CLOUDINARY";
    storageKey: string;
    fileUrl: string;
    fileSize: number;
    fileType: string;
    category: "GENERAL" | "STRATEGY" | "DELIVERABLE";
    status: "PENDING" | "APPROVED" | "REJECTED";
    isPinned?: boolean;
    createdBy: string | { name: string; profilePicture?: string };
    createdAt: string;
    updatedAt: string;
}
