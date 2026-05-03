import { Router } from "express";
import { handleEmailInbound, handleSlackWebhook } from "../controllers/webhook.controller";
import multer from "multer";

const upload = multer();

const webhookRoutes = Router();

/**
 * Các route Webhook công khai (Public)
 * Lưu ý: Trong môi trường production, cần bổ sung middleware xác thực chữ ký (Signature Verification)
 * để đảm bảo request thực sự đến từ SendGrid hoặc Slack.
 */

// POST /api/v1/webhooks/email
webhookRoutes.post("/email", upload.none(), handleEmailInbound);

// POST /api/v1/webhooks/slack
webhookRoutes.post("/slack", handleSlackWebhook);

export default webhookRoutes;
