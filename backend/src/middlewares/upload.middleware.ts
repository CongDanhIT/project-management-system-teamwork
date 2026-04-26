import multer from "multer";

// Sử dụng memory storage vì chúng ta sẽ upload thẳng lên Cloudinary
const storage = multer.memoryStorage();

// Whitelist định dạng tài liệu hỗ trợ
const ALLOWED_DOC_MIMES = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "text/plain",
    "text/csv",
    "application/zip",
    "application/x-rar-compressed",
    "application/octet-stream", // Đôi khi .rar hoặc .zip dùng mime này
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/svg+xml"
];

export const uploadImage = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB cho ảnh
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith("image/")) {
            cb(null, true);
        } else {
            cb(new Error("Chỉ hỗ trợ file hình ảnh!") as any);
        }
    },
});

export const uploadDocument = multer({
    storage,
    limits: { fileSize: 30 * 1024 * 1024 }, // 30MB cho tài liệu theo yêu cầu
    fileFilter: (req, file, cb) => {
        if (ALLOWED_DOC_MIMES.includes(file.mimetype) || 
            file.originalname.match(/\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt|csv|zip|rar)$/i)) {
            cb(null, true);
        } else {
            cb(new Error("Định dạng file không được hỗ trợ!") as any);
        }
    },
});

// Giữ default export là uploadImage để không làm vỡ code cũ
export default uploadImage;
