import multer from "multer";

// Sử dụng memory storage vì chúng ta sẽ upload thẳng lên Cloudinary
const storage = multer.memoryStorage();

const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // Giới hạn 5MB
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith("image/")) {
            cb(null, true);
        } else {
            cb(new Error("Chỉ hỗ trợ file hình ảnh!"));
        }
    },
});

export default upload;
