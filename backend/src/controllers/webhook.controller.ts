import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/asyncHandle";
import { createDraftService } from "../services/inbox.service";
import UserModel from "../models/user.model";
import { InboxSourceTypeEnum } from "../enums/inbox.enum";
import HTTP_STATUS from "../config/http.config";

/**
 * Xử lý Email gửi đến (Inbound Parse)
 * Endpoint: POST /api/v1/webhooks/email
 */
export const handleEmailInbound = asyncHandler(
    async (req: Request, res: Response) => {
        // Payload phổ biến từ các dịch vụ (SendGrid, Mailgun)
        const { to, from, subject, text, html } = req.body;

        if (!to) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: "Missing recipient (to)" });
        }

        // Trích xuất token từ địa chỉ email (ví dụ: task+abc123xyz@domain.com)
        // Hỗ trợ cả định dạng: "TeamFlow <task+abc123xyz@domain.com>"
        const emailTo = typeof to === 'string' ? to : (to[0]?.address || "");
        const match = emailTo.match(/\+(.*?)@/);
        const token = match ? match[1] : null;

        if (!token) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: "Invalid or missing inbox token in recipient address" });
        }

        // Tìm user sở hữu token này
        const user = await UserModel.findOne({ inboxToken: token });
        if (!user) {
            console.warn(`[Webhook-Email] Token không hợp lệ: ${token}`);
            return res.status(HTTP_STATUS.NOT_FOUND).json({ message: "Inbox token not found" });
        }

        // Tạo Draft Task trong Inbox
        const draft = await createDraftService(user._id.toString(), {
            title: subject || "Công việc từ Email",
            description: text || html || "Nội dung email trống",
            sourceType: InboxSourceTypeEnum.EMAIL,
            sourceMetadata: {
                from,
                to: emailTo,
                receivedAt: new Date()
            }
        });

        console.log(`[Webhook-Email] Đã tạo Draft từ Email cho User: ${user.email}`);

        return res.status(HTTP_STATUS.OK).json({ 
            success: true, 
            message: "Draft created from email",
            id: draft._id 
        });
    }
);

/**
 * Xử lý dữ liệu từ Slack (Slash Command hoặc Message Shortcut)
 * Endpoint: POST /api/v1/webhooks/slack
 */
export const handleSlackWebhook = asyncHandler(
    async (req: Request, res: Response) => {
        // 1. Xử lý xác thực URL (Challenge) từ Slack
        if (req.body.type === "url_verification") {
            return res.status(HTTP_STATUS.OK).json({ challenge: req.body.challenge });
        }

        // 2. Xử lý Slack Events (ví dụ: message, app_mention)
        if (req.body.event) {
            const { user, text, type } = req.body.event;
            // Chỉ xử lý tin nhắn từ người dùng, không phải từ bot
            if (req.body.event.bot_id) return res.status(HTTP_STATUS.OK).send();

            const dbUser = await UserModel.findOne({ slackUserId: user });
            if (dbUser) {
                await createDraftService(dbUser._id.toString(), {
                    title: text ? (text.length > 50 ? text.substring(0, 50) + "..." : text) : "Tin nhắn Slack",
                    description: text || "Nội dung từ Slack Event",
                    sourceType: InboxSourceTypeEnum.SLACK,
                    sourceMetadata: { slackUserId: user, eventType: type }
                });
            }
            return res.status(HTTP_STATUS.OK).send();
        }

        // 3. Xử lý Slack Slash Command (Payload dạng x-www-form-urlencoded)
        const { user_id, text, command, team_domain } = req.body;

        if (!user_id) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: "Missing Slack User ID" });
        }

        // Tìm user liên kết với Slack ID này
        const user = await UserModel.findOne({ slackUserId: user_id });
        if (!user) {
            return res.status(HTTP_STATUS.OK).json({ 
                response_type: "ephemeral",
                text: "❌ Tài khoản Slack của bạn chưa được liên kết với TeamFlow. Vui lòng vào phần Cài đặt Hồ sơ trong ứng dụng để cập nhật mã Slack ID của bạn." 
            });
        }

        // Tạo Draft Task
        await createDraftService(user._id.toString(), {
            title: text ? (text.length > 100 ? text.substring(0, 100) + "..." : text) : "Công việc từ Slash Command",
            description: text || `Được gửi từ Slack command: ${command}`,
            sourceType: InboxSourceTypeEnum.SLACK,
            sourceMetadata: {
                slackUserId: user_id,
                teamDomain: team_domain,
                command
            }
        });

        return res.status(HTTP_STATUS.OK).json({ 
            response_type: "ephemeral",
            text: `✅ Đã lưu: "${text || 'nội dung'}" vào Hòm thư cá nhân của bạn.` 
        });
    }
);
