import api from "./api";

export const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post("/upload/image", formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });

    return response.data.url;
};

export const uploadFile = async (file: File): Promise<{ url: string, fileName: string, fileType: string }> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post("/upload/file", formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });

    return {
        url: response.data.url,
        fileName: response.data.fileName,
        fileType: response.data.fileType
    };
};

const uploadService = {
    uploadImage,
    uploadFile
};

export default uploadService;
