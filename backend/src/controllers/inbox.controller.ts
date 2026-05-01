import { asyncHandler } from "../middlewares/asyncHandle";
import { createDraftSchema, inboxIdSchema, promoteDraftSchema, updateDraftSchema } from "../validation/inbox.validation";
import { 
    createDraftService, 
    deleteDraftService, 
    getMyDraftsService, 
    promoteDraftToTaskService,
    updateDraftService 
} from "../services/inbox.service";
import HTTP_STATUS from "../config/http.config";

export const getMyDraftsController = asyncHandler(
    async (req, res) => {
        const userId = req.user?._id;
        const drafts = await getMyDraftsService(userId);

        return res.status(HTTP_STATUS.OK).json({
            success: true,
            message: "Lấy danh sách bản ghi nháp thành công",
            drafts
        });
    }
);

export const createDraftController = asyncHandler(
    async (req, res) => {
        const userId = req.user?._id;
        const body = createDraftSchema.parse(req.body);

        const draft = await createDraftService(userId, body);

        return res.status(HTTP_STATUS.CREATED).json({
            success: true,
            message: "Tạo bản ghi nháp thành công",
            draft
        });
    }
);

export const promoteToTaskController = asyncHandler(
    async (req, res) => {
        const userId = req.user?._id;
        const inboxId = inboxIdSchema.parse(req.params.inboxId);
        const { workspaceId, projectId, phaseId, status } = promoteDraftSchema.parse(req.body);

        const result = await promoteDraftToTaskService(
            userId,
            inboxId,
            workspaceId,
            projectId,
            phaseId,
            status
        );

        return res.status(HTTP_STATUS.OK).json({
            success: true,
            message: "Chuyển đổi thành công. Nhiệm vụ mới đã được tạo trên bảng.",
            ...result
        });
    }
);

export const deleteDraftController = asyncHandler(
    async (req, res) => {
        const userId = req.user?._id;
        const inboxId = inboxIdSchema.parse(req.params.inboxId);

        await deleteDraftService(userId, inboxId);

        return res.status(HTTP_STATUS.OK).json({
            success: true,
            message: "Xóa bản ghi nháp thành công"
        });
    }
);

export const updateDraftController = asyncHandler(
    async (req, res) => {
        const userId = req.user?._id;
        const inboxId = inboxIdSchema.parse(req.params.inboxId);
        const body = updateDraftSchema.parse(req.body);

        const draft = await updateDraftService(userId, inboxId, body);

        return res.status(HTTP_STATUS.OK).json({
            success: true,
            message: "Cập nhật bản ghi nháp thành công",
            draft
        });
    }
);
