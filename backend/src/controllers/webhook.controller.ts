import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/asyncHandle";
import { createDraftService } from "../services/inbox.service";
import UserModel from "../models/user.model";
import TaskModel from "../models/task.model";
import { InboxSourceTypeEnum } from "../enums/inbox.enum";
import { SlackService } from "../services/slack.service";
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

        // 2. Xử lý Tương tác nút bấm (Slack Interactivity)
        if (req.body.payload) {
            const payload = JSON.parse(req.body.payload);
            const { type, user, actions } = payload;

            if (type === "block_actions" && actions && actions.length > 0) {
                const action = actions[0];
                const slackUserId = user.id;

                // Tìm user liên kết
                const dbUser = await UserModel.findOne({ slackUserId });
                if (!dbUser) {
                    console.warn(`[Slack-Interactive] User với Slack ID ${slackUserId} chưa liên kết tài khoản.`);
                    return res.status(HTTP_STATUS.OK).send();
                }

                const taskId = action.value;

                if (action.action_id === "complete_task" && taskId) {
                    const task = await TaskModel.findById(taskId);
                    if (task) {
                        if (task.requiresApproval) {
                            task.status = "INREVIEW";
                            task.completedAt = null;
                        } else {
                            task.status = "DONE";
                            task.completedAt = new Date();
                        }
                        await task.save();
                        console.log(`[Slack-Interactive] User ${dbUser.email} hoàn thành Task ${task.taskCode}`);
                    }
                } else if (action.action_id === "assign_task" && taskId) {
                    await TaskModel.findByIdAndUpdate(taskId, {
                        $addToSet: { assignedTo: dbUser._id }
                    });
                    console.log(`[Slack-Interactive] User ${dbUser.email} nhận Task ID: ${taskId}`);
                } else if (action.action_id === "refresh_dashboard") {
                    console.log(`[Slack-Interactive] User ${dbUser.email} yêu cầu làm mới Dashboard`);
                }

                // Đẩy lại giao diện App Home mới nhất
                await SlackService.publishAppHome(slackUserId);
            }

            return res.status(HTTP_STATUS.OK).send();
        }

        // 3. Xử lý Slack Events (ví dụ: message, app_home_opened)
        if (req.body.event) {
            const { user, text, type, bot_id } = req.body.event;

            // Xử lý khi user mở tab Home của App
            if (type === "app_home_opened") {
                await SlackService.publishAppHome(user);
                return res.status(HTTP_STATUS.OK).send();
            }

            // Chỉ xử lý tin nhắn từ người dùng, không phải từ bot
            if (bot_id) return res.status(HTTP_STATUS.OK).send();

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

        // 4. Xử lý Slack Slash Command (Payload dạng x-www-form-urlencoded)
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
