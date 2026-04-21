import { Router } from "express";
import upload from "../middlewares/upload.middleware";
import cloudinary from "../config/cloudinary";

const router = Router();

router.post("/image", upload.single("file"), async (req, res): Promise<any> => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "Không tìm thấy file!" });
        }

        const fileBase64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;

        const result = await cloudinary.uploader.upload(fileBase64, {
            folder: "teamflow_newsfeed",
        });

        res.json({
            message: "Upload thành công!",
            url: result.secure_url,
        });
    } catch (error: any) {
        console.error("Upload Error:", error);
        res.status(500).json({ message: "Lỗi khi upload lên Cloudinary", error: error.message });
    }
});

router.post("/file", upload.single("file"), async (req, res): Promise<any> => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "Không tìm thấy file!" });
        }

        const fileBase64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;

        // Sử dụng resource_type: "auto" để Cloudinary tự nhận diện PDF, Doc, Video...
        const result = await cloudinary.uploader.upload(fileBase64, {
            folder: "teamflow_attachments",
            resource_type: "auto" 
        });

        res.json({
            message: "Đính kèm file thành công!",
            url: result.secure_url,
            fileName: req.file.originalname,
            fileType: req.file.mimetype.startsWith("image/") ? "IMAGE" : "FILE"
        });
    } catch (error: any) {
        console.error("File Upload Error:", error);
        res.status(500).json({ message: "Lỗi hệ thống khi đính kèm file", error: error.message });
    }
});

export default router;
