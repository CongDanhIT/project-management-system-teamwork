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

const uploadService = {
    uploadImage,
};

export default uploadService;
