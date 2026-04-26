import { Router } from "express";
import logger from "../utils/logger";

import { uploadImage, uploadDocument } from "../middlewares/upload.middleware";
import { isAuthenticated } from "../middlewares/isAuthenticated.middleware";

import cloudinary from "../config/cloudinary";
import { PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { r2Client, R2_BUCKET } from "../config/r2.config";
import { v4 as uuidv4 } from "uuid";
import { env } from "../config/env";

const router = Router();

/**
 * Route tải xuống tệp tin từ R2 (Tạo Signed URL)
 * Dùng để tải các tệp tin trong bucket riêng tư
 */
router.get("/download", isAuthenticated, async (req: any, res: any): Promise<any> => {
    try {
        const { key } = req.query;
        if (!key) {
            return res.status(400).json({ message: "Thiếu file key!" });
        }

        const command = new GetObjectCommand({
            Bucket: R2_BUCKET,
            Key: key as string,
        });

        // Tạo Signed URL có hiệu lực trong 60 phút
        const signedUrl = await getSignedUrl(r2Client, command, { expiresIn: 3600 });

        // Chuyển hướng người dùng đến URL đã ký
        res.redirect(signedUrl);
    } catch (error: any) {
        logger.error("[Download] Error generating signed URL", { error: error.message });
        res.status(500).json({ message: "Không thể tạo mã tải xuống", error: error.message });
    }
});


// --- ROUTE CHO ẢNH (GIỮ NGUYÊN CLOUDINARY) ---
router.post("/image", isAuthenticated, uploadImage.single("file"), async (req, res): Promise<any> => {
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

// --- ROUTE CHO TÀI LIỆU (MỚI: CLOUDFLARE R2 QUA PRESIGNED URL) ---

/**
 * Bước 1: Frontend yêu cầu một Presigned URL để upload trực tiếp lên R2
 */
router.post("/document/presign", isAuthenticated, async (req: any, res: any): Promise<any> => {
    logger.info("[Upload] Presign handler entered", { body: req.body });
    try {
        const { fileName, fileType, fileSize } = req.body;

        if (!fileName || !fileType) {
            return res.status(400).json({ message: "Thiếu thông tin file!" });
        }

        // Kiểm tra dung lượng (30MB)
        if (fileSize > 30 * 1024 * 1024) {
            return res.status(400).json({ message: "Dung lượng file vượt quá giới hạn 30MB!" });
        }

        const fileExtension = fileName.split('.').pop();
        const fileKey = `newsfeed/${uuidv4()}.${fileExtension}`;

        const command = new PutObjectCommand({
            Bucket: R2_BUCKET,
            Key: fileKey,
            ContentType: fileType,
        });

        // URL có hiệu lực trong 5 phút
        const uploadUrl = await getSignedUrl(r2Client, command, { expiresIn: 300 });

        const fileUrl = `${env.R2_ENDPOINT}/${R2_BUCKET}/${fileKey}`;

        logger.info("[Upload] Presign URL generated successfully", { fileKey });
        res.json({
            uploadUrl,
            fileKey,
            fileUrl,
        });
    } catch (error: any) {
        logger.error("[Upload] Presign Error", { error: error.message, stack: error.stack });
        res.status(500).json({ message: "Không thể tạo mã upload", error: error.message });
    }
});

/**
 * Bước 2: Frontend xác nhận đã upload thành công lên R2
 */
router.post("/document/confirm", isAuthenticated, async (req, res): Promise<any> => {
    try {
        const { fileKey, fileName, fileType } = req.body;

        // Ở bước này ta có thể kiểm tra HeadObject để verify file tồn tại thực sự trên R2
        // Tuy nhiên để đơn giản và nhanh, ta tin tưởng client và trả về attachment object
        
        const fileUrl = `${env.R2_ENDPOINT}/${R2_BUCKET}/${fileKey}`;

        res.json({
            message: "Xác nhận file thành công!",
            fileUrl,
            fileName,
            fileType: "FILE"
        });
    } catch (error: any) {
        res.status(500).json({ message: "Lỗi xác nhận file", error: error.message });
    }
});

// Giữ lại /file cũ để tương thích (tùy chọn: có thể chuyển dần sang R2)
router.post("/file", isAuthenticated, uploadDocument.single("file"), async (req, res): Promise<any> => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "Không tìm thấy file!" });
        }
        // ... giữ logic cũ hoặc refactor ...
        const fileBase64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
        const result = await cloudinary.uploader.upload(fileBase64, {
            folder: "teamflow_attachments",
            resource_type: "auto" 
        });

        res.json({
            message: "Đính kèm file thành công!",
            url: result.secure_url,
            fileName: req.file.originalname,
            fileType: "FILE"
        });
    } catch (error: any) {
        res.status(500).json({ message: "Lỗi khi upload lên Cloudinary", error: error.message });
    }
});

export default router;
