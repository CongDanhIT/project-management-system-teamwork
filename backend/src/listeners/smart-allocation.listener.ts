import eventDispatcher, { EVENTS } from "../utils/eventDispatcher";
import logger from "../utils/logger";
import ProjectModel from "../models/project.model";
import TagModel from "../models/tag.model";
import TaskModel from "../models/task.model";
import { autoTagTaskService } from "../services/ai.service";
import { createSystemCommentService } from "../services/interaction.service";

export const initSmartAllocationListeners = () => {
    logger.info("[LISTENER] Khởi tạo Smart Allocation Listeners (AI Auto-Tagging)...");

    eventDispatcher.on(EVENTS.TASK.CREATED, async (data) => {
        try {
            const { projectId, workspaceId, taskId, task, userId } = data;

            // 1. Kiểm tra xem dự án có bật Auto-Tagging không (Mặc định là bật nếu chưa cài đặt)
            const project = await ProjectModel.findById(projectId);
            if (!project || project.isAutoTaggingEnabled === false) {
                return; // Bỏ qua nếu tính năng bị tắt rõ ràng
            }

            // 2. Nếu task đã có sẵn tags thủ công thì bỏ qua (Chiến lược 2: Fallback)
            if (task.tags && task.tags.length > 0) {
                logger.info(`[AI-AutoTag] Bỏ qua task ${taskId} vì người dùng đã nhập tag thủ công.`);
                return;
            }

            // 3. Lấy danh sách TASK tags trong workspace
            const availableTags = await TagModel.find({ workspaceId, type: "TASK" });
            if (!availableTags || availableTags.length === 0) {
                return;
            }

            // Chuẩn bị payload cho AI
            const tagsPayload = availableTags.map(t => ({
                _id: t._id.toString(),
                name: t.name
            }));

            // 4. Gọi AI
            const selectedTagIds = await autoTagTaskService(task.title, task.description || "", tagsPayload);

            if (selectedTagIds.length > 0) {
                // 5. Cập nhật task
                const updatedTask = await TaskModel.findByIdAndUpdate(taskId, {
                    $set: { tags: selectedTagIds }
                }, { new: true }).populate("tags");

                // Phát sự kiện để cập nhật UI
                eventDispatcher.emit(EVENTS.TASK.UPDATED, {
                    projectId,
                    workspaceId,
                    taskId,
                    task: updatedTask,
                    userName: "AI Auto-Tagging",
                    taskTitle: task.title,
                    projectName: project.name
                });

                // Cập nhật lại event data hoặc bắn event khác nếu cần thiết
                logger.info(`[AI-AutoTag] Đã tự động gắn ${selectedTagIds.length} tags cho task ${taskId}`);
                
                // Ghi log bằng system comment
                const tagNames = availableTags.filter(t => selectedTagIds.includes(t._id.toString())).map(t => t.name);
                if (tagNames.length > 0) {
                     await createSystemCommentService(workspaceId, taskId, userId || null, `AI đã tự động phân loại công việc này với các nhãn: **${tagNames.join(", ")}**`);
                }
            }

        } catch (error: any) {
            logger.error(`[AI-AutoTag] Lỗi trong tiến trình ngầm`, { error: error.message });
        }
    });
};
