import axios from "axios";
import logger from "../utils/logger";

interface SlackBlock {
    type: string;
    text?: {
        type: string;
        text: string;
    };
    fields?: {
        type: string;
        text: string;
    }[];
    accessory?: any;
}

export class SlackService {
    /**
     * Gửi tin nhắn đến Slack qua Webhook URL
     */
    static async sendMessage(webhookUrl: string, text: string, blocks?: SlackBlock[]) {
        try {
            if (!webhookUrl) return;

            const payload = {
                text, // Fallback text for notifications
                blocks: blocks || [
                    {
                        type: "section",
                        text: {
                            type: "mrkdwn",
                            text: text,
                        },
                    },
                ],
            };

            await axios.post(webhookUrl, payload);
            logger.info("Slack message sent successfully", { webhookUrl: webhookUrl.substring(0, 20) + "..." });
        } catch (error: any) {
            logger.error("Failed to send Slack message", { 
                error: error.message,
                status: error.response?.status,
                data: error.response?.data
            });
        }
    }

    /**
     * Tạo thông báo khi có bài viết mới (Announcement)
     */
    static async sendAnnouncementNotification(
        webhookUrl: string, 
        projectName: string, 
        authorName: string, 
        title: string, 
        content: string,
        link: string
    ) {
        const blocks = [
            {
                type: "header",
                text: {
                    type: "plain_text",
                    text: "📢 Bản tin mới từ dự án: " + projectName,
                    emoji: true
                }
            },
            {
                type: "section",
                text: {
                    type: "mrkdwn",
                    text: `*${authorName}* vừa đăng một thông báo mới:\n\n*${title}*`
                }
            },
            {
                type: "section",
                text: {
                    type: "mrkdwn",
                    text: content.length > 300 ? content.substring(0, 300) + "..." : content
                }
            },
            {
                type: "actions",
                elements: [
                    {
                        type: "button",
                        text: {
                            type: "plain_text",
                            text: "Xem trên TeamFlow",
                            emoji: true
                        },
                        url: link,
                        style: "primary"
                    }
                ]
            }
        ];

        await this.sendMessage(webhookUrl, `Bản tin mới từ ${authorName}: ${title}`, blocks);
    }

    /**
     * Tạo thông báo tổng kết hàng ngày (Daily Digest) với xu hướng và nhiệm vụ khẩn cấp
     */
    static async sendDailyDigest(
        webhookUrl: string,
        workspaceName: string,
        stats: {
            totalTasks: number;
            completedTasks: number;
            overdueTasks: number;
            inProgressTasks: number;
        },
        trends: any,
        urgentTasks: any[] = [],
        link: string = ""
    ) {
        // Helper để tạo text xu hướng
        const renderTrend = (trend: any) => {
            if (!trend || trend.value === 0) return "";
            const icon = trend.value > 0 ? "🔺" : "🔹";
            return ` (${icon} ${Math.abs(Math.round(trend.percent))}%)`;
        };

        const blocks: any[] = [
            {
                type: "header",
                text: {
                    type: "plain_text",
                    text: "📊 Tổng kết dự án hàng ngày: " + workspaceName,
                    emoji: true
                }
            },
            {
                type: "section",
                text: {
                    type: "mrkdwn",
                    text: "Chào buổi sáng team! Dưới đây là tình hình công việc của chúng ta hôm nay:"
                }
            },
            {
                type: "section",
                fields: [
                    {
                        type: "mrkdwn",
                        text: `*Tổng công việc:*\n${stats.totalTasks}${renderTrend(trends.totalTasksTrend)}`
                    },
                    {
                        type: "mrkdwn",
                        text: `*Đã hoàn thành:*\n${stats.completedTasks} ✅${renderTrend(trends.completedTasksTrend)}`
                    },
                    {
                        type: "mrkdwn",
                        text: `*Đang thực hiện:*\n${stats.inProgressTasks} 🚀${renderTrend(trends.inProgressTasksTrend)}`
                    },
                    {
                        type: "mrkdwn",
                        text: `*Quá hạn:*\n${stats.overdueTasks} ⚠️${renderTrend(trends.overdueTasksTrend)}`
                    }
                ]
            }
        ];

        // Thêm phần nhiệm vụ khẩn cấp nếu có
        if (urgentTasks && urgentTasks.length > 0) {
            blocks.push({ type: "divider" });
            blocks.push({
                type: "section",
                text: {
                    type: "mrkdwn",
                    text: "🚩 *Nhiệm vụ sắp hết hạn (Urgent):*"
                }
            });

            const taskList = urgentTasks.slice(0, 3).map(task => {
                const priorityIcon = task.priority === "HIGH" ? "🔴" : "🟡";
                return `${priorityIcon} *${task.title}* (Hạn: ${new Date(task.dueDate).toLocaleDateString("vi-VN")})`;
            }).join("\n");

            blocks.push({
                type: "section",
                text: {
                    type: "mrkdwn",
                    text: taskList
                }
            });
        }

        // Thêm nút bấm hành động
        if (link) {
            blocks.push({
                type: "actions",
                elements: [
                    {
                        type: "button",
                        text: {
                            type: "plain_text",
                            text: "Mở TeamFlow 🚀",
                            emoji: true
                        },
                        url: link,
                        style: "primary"
                    }
                ]
            });
        }

        blocks.push({
            type: "context",
            elements: [
                {
                    type: "mrkdwn",
                    text: "Hãy tập trung xử lý các task quan trọng trước nhé! Chúc team một ngày làm việc hiệu quả."
                }
            ]
        });

        await this.sendMessage(webhookUrl, `Báo cáo hàng ngày cho ${workspaceName}`, blocks);
    }
}
