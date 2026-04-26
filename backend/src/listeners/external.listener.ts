import eventDispatcher, { EVENTS } from "../utils/eventDispatcher";
import { SlackService } from "../services/slack.service";
import ProjectModel from "../models/project.model";
import WorkspaceModel from "../models/workspace.model";
import { env } from "../config/env";
import logger from "../utils/logger";

/**
 * Lắng nghe các sự kiện hệ thống và đẩy thông báo sang các nền tảng bên ngoài (Slack, v.v.)
 */
export const initExternalListeners = () => {
    logger.info("[LISTENER] Khởi tạo External Integration Listeners...");

    // 1. Thông báo khi có bài viết mới trên Newsfeed
    eventDispatcher.on(EVENTS.ANNOUNCEMENT.CREATED, async (data) => {
        try {
            const { announcement, projectId, workspaceId } = data;
            
            let webhookUrl = env.SLACK_WEBHOOK_URL;
            let projectName = "Chung";

            if (projectId) {
                // Nếu có projectId -> Ưu tiên lấy URL từ Project hoặc Workspace của Project đó
                const fullProject = await ProjectModel.findById(projectId).populate("workspaceId");
                if (fullProject) {
                    projectName = fullProject.name;
                    const workspace = fullProject.workspaceId as any;
                    webhookUrl = fullProject.slackWebhookUrl || workspace?.slackWebhookUrl || webhookUrl;
                }
            } else if (workspaceId) {
                // Nếu không có ProjectId -> Lấy URL từ Workspace
                const workspace = await WorkspaceModel.findById(workspaceId);
                if (workspace) {
                    webhookUrl = workspace.slackWebhookUrl || webhookUrl;
                }
            }

            if (!webhookUrl) {
                logger.warn("No Slack Webhook URL found for announcement notification", { announcementId: announcement._id });
                return;
            }

            const link = `${env.FRONTEND_ORIGIN}/workspace/${workspaceId}/newsfeed`;

            await SlackService.sendAnnouncementNotification(
                webhookUrl,
                projectName,
                announcement.author?.name || "Một thành viên",
                announcement.title,
                announcement.content,
                link
            );
        } catch (error: any) {
            logger.error("Error in Slack Announcement listener", { error: error.message });
        }
    });

    // 2. Thông báo khi dự án bị đóng băng (Frozen)
    eventDispatcher.on(EVENTS.PROJECT.FROZEN, async (data) => {
        try {
            const { project, reason } = data;
            
            // Tìm URL: Project > Workspace > Env
            const fullProject = await ProjectModel.findById(project._id).populate("workspaceId");
            const workspace = fullProject?.workspaceId as any;
            const webhookUrl = fullProject?.slackWebhookUrl || workspace?.slackWebhookUrl || env.SLACK_WEBHOOK_URL;

            if (!webhookUrl) return;

            await SlackService.sendMessage(
                webhookUrl,
                `❄️ *DỰ ÁN ĐÃ BỊ ĐÓNG BĂNG:* ${project.name}\nLý do: ${reason || "Không có lý do cụ thể"}`
            );
        } catch (error: any) {
            logger.error("Error in Slack Project Frozen listener", { error: error.message });
        }
    });
};
