import { Router } from "express";
import upload from "../middlewares/upload.middleware";
import cloudinary from "../config/cloudinary";

const router = Router();

router.post("/image", upload.single("file"), async (req, res): Promise<any> => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "Không tìm thấy file!" });
        }

        // Chuyển buffer sang base64 để upload lên Cloudinary
        const fileBase64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;

        const result = await cloudinary.uploader.upload(fileBase64, {
            folder: "teamflow_covers",
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

export default router;
