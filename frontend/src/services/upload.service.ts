import api from "./api";
import { Attachment } from "./announcement.service";

export const uploadImage = async (file: File): Promise<Attachment> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post("/upload/image", formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });

    return {
        fileUrl: response.data.url,
        fileName: file.name,
        fileType: "IMAGE"
    };
};

export const uploadFile = async (file: File): Promise<Attachment> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post("/upload/file", formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });

    return {
        fileUrl: response.data.url,
        fileName: response.data.fileName,
        fileType: response.data.fileType
    };
};

/**
 * Upload tài liệu trực tiếp lên Cloudflare R2 (Presigned URL)
 * Ưu điểm: Bypass backend, hỗ trợ file lớn (30MB+), tiết kiệm tài nguyên server.
 */
export const uploadDocToR2 = async (file: File): Promise<Attachment> => {
    // 1. Xin Presigned URL từ Backend
    const presignResponse = await api.post("/upload/document/presign", {
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
    });

    const { uploadUrl, fileKey } = presignResponse.data;

    // 2. Upload trực tiếp từ trình duyệt lên R2
    const r2Response = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        mode: "cors",
        headers: {
            "Content-Type": file.type,
        },
    });

    if (!r2Response.ok) {
        throw new Error(`Upload lên R2 thất bại: ${r2Response.status} ${r2Response.statusText}`);
    }

    // 3. Xác nhận upload thành công với Backend
    const confirmResponse = await api.post("/upload/document/confirm", {
        fileKey,
        fileName: file.name,
        fileType: file.type,
    });

    return {
        fileUrl: confirmResponse.data.fileUrl,
        fileName: confirmResponse.data.fileName,
        fileType: "FILE"
    };
};

const uploadService = {
    uploadImage,
    uploadFile,
    uploadDocToR2
};

export default uploadService;
