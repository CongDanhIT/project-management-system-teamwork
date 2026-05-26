import axios from "axios";
import logger from "../utils/logger";
import UserModel from "../models/user.model";
import TaskModel from "../models/task.model";
import MemberModel from "../models/member.model";
import mongoose from "mongoose";

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

    /**
     * Đẩy giao diện App Home (Dashboard cá nhân) lên Slack
     */
    static async publishAppHome(slackUserId: string) {
        try {
            const token = process.env.SLACK_BOT_TOKEN;
            if (!token) {
                logger.warn("SLACK_BOT_TOKEN is not configured in .env. Skipping App Home publish.");
                return;
            }

            // 1. Tìm user liên kết
            const user = await UserModel.findOne({ slackUserId });
            
            let blocks: any[] = [];

            if (!user) {
                // Màn hình hướng dẫn liên kết tài khoản
                blocks = [
                    {
                        type: "header",
                        text: {
                            type: "plain_text",
                            text: "TeamFlow - Dashboard cá nhân 🎯",
                            emoji: true
                        }
                    },
                    {
                        type: "section",
                        text: {
                            type: "mrkdwn",
                            text: "👋 *Chào mừng bạn đến với TeamFlow!*"
                        }
                    },
                    {
                        type: "section",
                        text: {
                            type: "mrkdwn",
                            text: "Tài khoản Slack của bạn hiện *chưa liên kết* với tài khoản TeamFlow.\n\n*Để liên kết tài khoản:*\n1. Truy cập ứng dụng TeamFlow tại trình duyệt.\n2. Vào *Cài đặt Hồ sơ* (Profile Settings).\n3. Copy mã Slack ID của bạn bên dưới và dán vào phần thiết lập:\n"
                        }
                    },
                    {
                        type: "section",
                        text: {
                            type: "mrkdwn",
                            text: `🔑 *Mã Slack ID của bạn:* \`${slackUserId}\``
                        }
                    },
                    {
                        type: "actions",
                        elements: [
                            {
                                type: "button",
                                text: {
                                    type: "plain_text",
                                    text: "Truy cập TeamFlow 🌐",
                                    emoji: true
                                },
                                url: process.env.FRONTEND_ORIGIN || "http://localhost:3000",
                                style: "primary"
                            }
                        ]
                    }
                ];
            } else {
                // User đã liên kết, lấy danh sách task
                const members = await MemberModel.find({ userId: user._id });
                const workspaceIds = members.map(m => m.workspaceId);

                // Lấy các task được gán cho user
                const tasks = await TaskModel.find({
                    workspaceId: { $in: workspaceIds },
                    assignedTo: user._id,
                    status: { $in: ["TODO", "IN_PROGRESS", "INREVIEW", "BACKLOG"] },
                    deletedAt: null
                }).populate("projectId").populate("workspaceId").populate("phaseId");

                const now = new Date();
                const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

                // Phân loại task
                const overdueTasks = tasks.filter(t => t.dueDate && t.dueDate < startOfToday);
                const todayTasks = tasks.filter(t => t.dueDate && t.dueDate >= startOfToday && t.dueDate <= endOfToday);
                const upcomingTasks = tasks.filter(t => !t.dueDate || t.dueDate > endOfToday);

                // Lấy các task chưa gán trong các workspace của user để họ tự nhận việc
                const unassignedTasks = await TaskModel.find({
                    workspaceId: { $in: workspaceIds },
                    assignedTo: { $size: 0 },
                    status: { $in: ["TODO", "IN_PROGRESS"] },
                    deletedAt: null
                }).populate("projectId").populate("workspaceId").populate("phaseId").limit(5);

                // Build blocks
                blocks = [
                    {
                        type: "header",
                        text: {
                            type: "plain_text",
                            text: `🏠 TeamFlow Dashboard của ${user.name}`,
                            emoji: true
                        }
                    },
                    {
                        type: "section",
                        text: {
                            type: "mrkdwn",
                            text: `👋 Chào *${user.name}*, chúc bạn một ngày làm việc hiệu quả!`
                        }
                    },
                    {
                        type: "section",
                        text: {
                            type: "mrkdwn",
                            text: `📊 *Tổng quan công việc của bạn:*`
                        }
                    },
                    {
                        type: "section",
                        fields: [
                            {
                                type: "mrkdwn",
                                text: `• *Quá hạn:* \`${overdueTasks.length}\` 🔴`
                            },
                            {
                                type: "mrkdwn",
                                text: `• *Hôm nay:* \`${todayTasks.length}\` 🟡`
                            },
                            {
                                type: "mrkdwn",
                                text: `• *Sắp tới:* \`${upcomingTasks.length}\` 🟢`
                            },
                            {
                                type: "mrkdwn",
                                text: `• *Chưa gán:* \`${unassignedTasks.length}\` 🙋‍♂️`
                            }
                        ]
                    },
                    {
                        type: "actions",
                        elements: [
                            {
                                type: "button",
                                text: {
                                    type: "plain_text",
                                    text: "Làm mới 🔄",
                                    emoji: true
                                },
                                action_id: "refresh_dashboard",
                                value: "refresh"
                            },
                            {
                                type: "button",
                                text: {
                                    type: "plain_text",
                                    text: "Mở TeamFlow Board 🚀",
                                    emoji: true
                                },
                                url: process.env.FRONTEND_ORIGIN || "http://localhost:3000",
                                style: "primary"
                            }
                        ]
                    },
                    { type: "divider" }
                ];

                // Helper render task list
                const appendTaskList = (title: string, list: any[], isOverdue = false) => {
                    blocks.push({
                        type: "section",
                        text: {
                            type: "mrkdwn",
                            text: title
                        }
                    });

                    if (list.length === 0) {
                        blocks.push({
                            type: "context",
                            elements: [
                                {
                                    type: "mrkdwn",
                                    text: "✅ Không có công việc nào trong danh mục này."
                                }
                            ]
                        });
                        return;
                    }

                    list.forEach(task => {
                        const projectIdAny = task.projectId as any;
                        const projectName = projectIdAny?.name || "Dự án chung";
                        const workspaceIdAny = task.workspaceId as any;
                        const workspaceName = workspaceIdAny?.name || "Chung";
                        const phaseIdAny = task.phaseId as any;
                        const phaseName = phaseIdAny?.name;
                        const formattedDate = task.dueDate ? new Date(task.dueDate).toLocaleDateString("vi-VN") : "Không giới hạn";
                        const priorityEmoji = task.priority === "HIGH" ? "🔥" : task.priority === "MEDIUM" ? "⚡" : "💤";
                        const priorityText = task.priority === "HIGH" ? "Cao" : task.priority === "MEDIUM" ? "Trung bình" : "Thấp";

                        const locationText = `🏢 _${workspaceName}_ ➔ 📁 _${projectName}_${phaseName ? ` ➔ 📍 _${phaseName}_` : ""}`;

                        blocks.push({
                            type: "section",
                            text: {
                                type: "mrkdwn",
                                text: `*${task.taskCode}*: ${task.title}\n${locationText} | 📅 Hạn: ${isOverdue ? `*${formattedDate}* ⚠️` : `_${formattedDate}_`} | ${priorityEmoji} *${priorityText}*`
                            },
                            accessory: {
                                type: "button",
                                text: {
                                    type: "plain_text",
                                    text: "Hoàn thành ✅",
                                    emoji: true
                                },
                                value: task._id.toString(),
                                action_id: "complete_task",
                                style: "primary"
                            }
                        });
                    });
                };

                // Render Overdue Tasks
                appendTaskList("🚨 *CÔNG VIỆC QUÁ HẠN*", overdueTasks, true);
                blocks.push({ type: "divider" });

                // Render Today Tasks
                appendTaskList("📅 *CÔNG VIỆC HÔM NAY*", todayTasks);
                blocks.push({ type: "divider" });

                // Render Upcoming Tasks
                appendTaskList("⏳ *CÔNG VIỆC SẮP TỚI & KHÔNG HẠN CHÓT*", upcomingTasks);
                blocks.push({ type: "divider" });

                // Render Unassigned Tasks (Nhận việc)
                blocks.push({
                    type: "section",
                    text: {
                        type: "mrkdwn",
                        text: "🙋‍♂️ *CÔNG VIỆC CHƯA PHÂN CÔNG (BẤM ĐỂ NHẬN VIỆC)*"
                    }
                });

                if (unassignedTasks.length === 0) {
                    blocks.push({
                        type: "context",
                        elements: [
                            {
                                type: "mrkdwn",
                                text: "Không có công việc chưa gán trong các dự án của bạn."
                            }
                        ]
                    });
                } else {
                    unassignedTasks.forEach(task => {
                        const projectIdAny = task.projectId as any;
                        const projectName = projectIdAny?.name || "Dự án chung";
                        const workspaceIdAny = task.workspaceId as any;
                        const workspaceName = workspaceIdAny?.name || "Chung";
                        const phaseIdAny = task.phaseId as any;
                        const phaseName = phaseIdAny?.name;
                        const formattedDate = task.dueDate ? new Date(task.dueDate).toLocaleDateString("vi-VN") : "Không giới hạn";
                        const priorityEmoji = task.priority === "HIGH" ? "🔥" : task.priority === "MEDIUM" ? "⚡" : "💤";

                        const locationText = `🏢 _${workspaceName}_ ➔ 📁 _${projectName}_${phaseName ? ` ➔ 📍 _${phaseName}_` : ""}`;

                        blocks.push({
                            type: "section",
                            text: {
                                type: "mrkdwn",
                                text: `*${task.taskCode}*: ${task.title}\n${locationText} | 📅 Hạn: _${formattedDate}_ | ${priorityEmoji} Mức ưu tiên: *${task.priority}*`
                            },
                            accessory: {
                                type: "button",
                                text: {
                                    type: "plain_text",
                                    text: "Nhận việc 🤝",
                                    emoji: true
                                },
                                value: task._id.toString(),
                                action_id: "assign_task"
                            }
                        });
                    });
                }
            }

            // Gọi API Slack views.publish
            const payload = {
                user_id: slackUserId,
                view: {
                    type: "home",
                    blocks
                }
            };

            await axios.post("https://slack.com/api/views.publish", payload, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json; charset=utf-8"
                }
            });

            logger.info("Slack App Home published successfully", { slackUserId });
        } catch (error: any) {
            logger.error("Error publishing Slack App Home", {
                slackUserId,
                error: error.message,
                status: error.response?.status,
                data: error.response?.data
            });
        }
    }
}
