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
            yesterdayActivity?: {
                createdTasks: number;
                completedTasks: number;
                topContributor: {
                    name: string;
                    completedCount: number;
                    profilePicture?: string | null;
                } | null;
            };
        },
        trends: any,
        urgentTasks: any[] = [],
        link: string = ""
    ) {
        // Helper để tạo text xu hướng
        const renderTrend = (trend: any) => {
            if (!trend || trend.value === 0) return "";
            const direction = trend.value > 0 ? "↗️ +" : "↘️ -";
            return ` (${direction}${Math.abs(trend.value)} / ${Math.abs(Math.round(trend.percent))}%)`;
        };

        const blocks: any[] = [
            {
                type: "header",
                text: {
                    type: "plain_text",
                    text: "🎯 TEAMFLOW DAILY DIGEST",
                    emoji: true
                }
            },
            {
                type: "context",
                elements: [
                    {
                        type: "mrkdwn",
                        text: `📅 *Báo cáo Lịch trình & Công việc hàng ngày* | Không gian: *${workspaceName}*`
                    }
                ]
            },
            { type: "divider" },
            {
                type: "section",
                text: {
                    type: "mrkdwn",
                    text: "📈 *TÌNH HÌNH CÔNG VIỆC CHUNG (WORKSPACE OVERVIEW)*"
                }
            },
            {
                type: "section",
                fields: [
                    {
                        type: "mrkdwn",
                        text: `• *Tổng công việc:* \`${stats.totalTasks}\`${renderTrend(trends.totalTasksTrend)}`
                    },
                    {
                        type: "mrkdwn",
                        text: `• *Đã hoàn thành:* \`${stats.completedTasks}\` ✅${renderTrend(trends.completedTasksTrend)}`
                    },
                    {
                        type: "mrkdwn",
                        text: `• *Đang thực hiện:* \`${stats.inProgressTasks}\` 🚀${renderTrend(trends.inProgressTasksTrend)}`
                    },
                    {
                        type: "mrkdwn",
                        text: `• *Quá hạn:* \`${stats.overdueTasks}\` ⚠️${renderTrend(trends.overdueTasksTrend)}`
                    }
                ]
            },
            { type: "divider" }
        ];

        // Thêm thông tin hoạt động ngày hôm qua nếu có
        if (stats.yesterdayActivity) {
            const yesterday = stats.yesterdayActivity;
            blocks.push({
                type: "section",
                text: {
                    type: "mrkdwn",
                    text: "✨ *HOẠT ĐỘNG NGÀY HÔM QUA (YESTERDAY'S PULSE)*"
                }
            });

            blocks.push({
                type: "section",
                fields: [
                    {
                        type: "mrkdwn",
                        text: `• *Công việc tạo mới:* \`${yesterday.createdTasks}\` nhiệm vụ`
                    },
                    {
                        type: "mrkdwn",
                        text: `• *Nhiệm vụ hoàn thành:* \`${yesterday.completedTasks}\` nhiệm vụ`
                    }
                ]
            });

            if (yesterday.topContributor) {
                blocks.push({
                    type: "context",
                    elements: [
                        {
                            type: "mrkdwn",
                            text: `🏆 *Thành viên nổi bật:* *${yesterday.topContributor.name}* đã xuất sắc hoàn thành *${yesterday.topContributor.completedCount}* công việc! 🎉`
                        }
                    ]
                });
            }
            blocks.push({ type: "divider" });
        }

        // Thêm phần nhiệm vụ khẩn cấp sắp tới hạn nếu có
        if (urgentTasks && urgentTasks.length > 0) {
            blocks.push({
                type: "section",
                text: {
                    type: "mrkdwn",
                    text: "🚨 *CÔNG VIỆC SẮP ĐẾN HẠN CẦN ƯU TIÊN (UPCOMING DUE TASKS)*"
                }
            });

            const taskList = urgentTasks.slice(0, 5).map(task => {
                const priorityIcon = task.priority === "HIGH" ? "🔥" : "📅";
                const projectName = task.projectId?.name || "Dự án chung";
                return `• ${priorityIcon} *[${projectName}]* ${task.title} (Hạn: ${new Date(task.dueDate).toLocaleDateString("vi-VN")})`;
            }).join("\n");

            blocks.push({
                type: "section",
                text: {
                    type: "mrkdwn",
                    text: taskList
                }
            });
            blocks.push({ type: "divider" });
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
                            text: "Truy cập TeamFlow Board 🚀",
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
                    text: "💡 *Chúc team một ngày làm việc hiệu quả và bùng nổ!*"
                }
            ]
        });

        await this.sendMessage(webhookUrl, `Báo cáo hàng ngày cho ${workspaceName}`, blocks);
    }
}
