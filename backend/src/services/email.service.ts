import sgMail from "@sendgrid/mail";
import { env } from "../config/env";
import logger from "../utils/logger";
import TaskModel from "../models/task.model";
import AnnouncementModel from "../models/announcement.model";
import UserModel from "../models/user.model";
import ProjectModel from "../models/project.model";
import dayjs from "dayjs";

if (env.SENDGRID_API_KEY) {
    sgMail.setApiKey(env.SENDGRID_API_KEY);
}

export class EmailService {
    /**
     * Gửi email cơ bản
     */
    static async sendEmail(to: string, subject: string, html: string) {
        if (!env.SENDGRID_API_KEY) {
            logger.warn("SendGrid API Key is not configured. Skipping email send.");
            return;
        }

        const msg = {
            to,
            from: env.SENDGRID_FROM_EMAIL || "no-reply@teamflow.com",
            subject,
            html,
        };

        try {
            await sgMail.send(msg);
            logger.info("Email sent successfully", { to, subject });
        } catch (error: any) {
            logger.error("Failed to send email", { error: error.message });
            if (error.response) {
                logger.error("SendGrid error details", { body: error.response.body });
            }
        }
    }

    /**
     * Gửi Daily Digest cho một người dùng
     * @param forceSend Nếu true, gửi email kể cả khi không có task mới
     */
    static async sendDailyDigest(userId: string, forceSend: boolean = false) {
        try {
            const user = await UserModel.findById(userId);
            if (!user || !user.email) return;

            const today = dayjs().startOf("day");
            const endOfToday = dayjs().endOf("day");

            // 1. Lấy task đến hạn hôm nay
            const dueTodayTasks = await TaskModel.find({
                assignedTo: userId,
                dueDate: { $gte: today.toDate(), $lte: endOfToday.toDate() },
                status: { $ne: "DONE" }
            }).populate("projectId", "name");

            // 2. Lấy task quá hạn
            const overdueTasks = await TaskModel.find({
                assignedTo: userId,
                dueDate: { $lt: today.toDate() },
                status: { $ne: "DONE" }
            }).populate("projectId", "name");

            // 3. Lấy 5 nhiệm vụ sắp tới (gần ngày hiện tại nhất, sau ngày hôm nay)
            const upcomingTasks = await TaskModel.find({
                assignedTo: userId,
                dueDate: { $gt: endOfToday.toDate() },
                status: { $ne: "DONE" }
            })
            .sort({ dueDate: 1 })
            .limit(5)
            .populate("projectId", "name");

            // 4. Lấy thông báo mới trong 24h qua
            const recentAnnouncements = await AnnouncementModel.find({
                createdAt: { $gte: dayjs().subtract(1, "day").toDate() }
            }).populate("createdBy", "name").populate("projectId", "name");

            // Nếu không có gì mới và không phải yêu cầu gửi thủ công thì bỏ qua
            if (!forceSend && dueTodayTasks.length === 0 && overdueTasks.length === 0 && upcomingTasks.length === 0 && recentAnnouncements.length === 0) {
                logger.info(`No updates for daily digest for user ${user.email}. Skipping.`);
                return;
            }

            const html = this.generateDigestTemplate(user.name, dueTodayTasks, overdueTasks, upcomingTasks, recentAnnouncements);
            
            logger.info(`[EmailService] Attempting to send email to ${user.email} (forceSend: ${forceSend})`);
            
            await this.sendEmail(
                user.email,
                `TeamFlow Daily Digest - ${dayjs().format("DD/MM/YYYY")}`,
                html
            );
            logger.info(`[EmailService] Email process completed for ${user.email}`);
        } catch (error: any) {
            logger.error("Error in sendDailyDigest", { error: error.message, userId });
        }
    }

    private static generateDigestTemplate(userName: string, dueToday: any[], overdue: any[], upcoming: any[], announcements: any[]) {
        const primaryColor = "#6366f1";
        
        const renderTask = (task: any, color: string = primaryColor) => `
            <div style="margin-bottom: 12px; padding: 12px; border-radius: 8px; background: #f8fafc; border-left: 4px solid ${color}">
                <div style="font-weight: bold; color: #1e293b;">${task.title}</div>
                <div style="font-size: 12px; color: #64748b;">
                    Dự án: ${task.projectId?.name || "N/A"} 
                    ${task.dueDate ? `| Hạn: ${dayjs(task.dueDate).format("DD/MM/YYYY")}` : ""}
                </div>
            </div>
        `;

        const renderAnnouncement = (ann: any) => `
            <div style="margin-bottom: 12px; padding: 12px; border-radius: 8px; background: #f0f9ff; border-left: 4px solid #0ea5e9">
                <div style="font-weight: bold; color: #0369a1;">${ann.title}</div>
                <div style="font-size: 12px; color: #0c4a6e;">Bởi: ${ann.createdBy?.name || "Hệ thống"} | Dự án: ${ann.projectId?.name || "Chung"}</div>
            </div>
        `;

        return `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; color: #334155;">
                <div style="background: ${primaryColor}; padding: 24px; text-align: center; border-radius: 12px 12px 0 0;">
                    <h1 style="color: white; margin: 0; font-size: 24px;">Daily Digest</h1>
                    <p style="color: #e0e7ff; margin: 8px 0 0;">${dayjs().format("dddd, DD MMMM YYYY")}</p>
                </div>
                
                <div style="padding: 24px; background: white; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
                    <p>Chào <strong>${userName}</strong>,</p>
                    <p>Dưới đây là tóm tắt công việc của bạn trong ngày hôm nay:</p>

                    ${overdue.length === 0 && dueToday.length === 0 && upcoming.length === 0 && announcements.length === 0 ? `
                        <div style="text-align: center; padding: 32px 0;">
                            <div style="font-size: 48px; margin-bottom: 16px;">🎉</div>
                            <h3 style="color: #1e293b; margin: 0;">Tuyệt vời!</h3>
                            <p style="color: #64748b; margin: 8px 0 0;">Bạn không có công việc nào cần lo lắng trong hôm nay.</p>
                        </div>
                    ` : ""}

                    ${overdue.length > 0 ? `
                        <h3 style="color: #ef4444; margin-top: 24px;">⚠️ Công việc quá hạn</h3>
                        ${overdue.map(t => renderTask(t, "#ef4444")).join("")}
                    ` : ""}

                    ${dueToday.length > 0 ? `
                        <h3 style="color: ${primaryColor}; margin-top: 24px;">📅 Đến hạn hôm nay</h3>
                        ${dueToday.map(t => renderTask(t, primaryColor)).join("")}
                    ` : ""}

                    ${upcoming.length > 0 ? `
                        <h3 style="color: #8b5cf6; margin-top: 24px;">💡 Nhiệm vụ sắp tới (Top 5)</h3>
                        ${upcoming.map(t => renderTask(t, "#8b5cf6")).join("")}
                    ` : ""}

                    ${announcements.length > 0 ? `
                        <h3 style="color: #0ea5e9; margin-top: 24px;">📢 Thông báo mới</h3>
                        ${announcements.map(renderAnnouncement).join("")}
                    ` : ""}

                    <div style="margin-top: 40px; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 24px;">
                        <a href="${env.FRONTEND_ORIGIN}" style="background: ${primaryColor}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Mở TeamFlow</a>
                    </div>
                </div>
                
                <div style="text-align: center; padding: 24px; font-size: 12px; color: #94a3b8;">
                    © 2026 TeamFlow Project Management. Tất cả quyền được bảo lưu.
                </div>
            </div>
        `;
    }
}
