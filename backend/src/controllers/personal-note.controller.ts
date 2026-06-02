import { asyncHandler } from "../middlewares/asyncHandle";
import { noteIdSchema, createNoteSchema, updateNoteSchema } from "../validation/personal-note.validation";
import {
    getNotesByWorkspaceService,
    createNoteService,
    updateNoteService,
    deleteNoteService
} from "../services/personal-note.service";
import HTTP_STATUS from "../config/http.config";
import { WorkSpaceIdSchema } from "../validation/workspace.validation";

export const getNotesByWorkspaceController = asyncHandler(
    async (req, res) => {
        const userId = (req.user?._id as any).toString();
        const workspaceId = WorkSpaceIdSchema.parse(req.params.workspaceId);
        
        const notes = await getNotesByWorkspaceService(userId, workspaceId);

        return res.status(HTTP_STATUS.OK).json({
            success: true,
            message: "Lấy danh sách ghi chú thành công",
            notes
        });
    }
);

export const createNoteController = asyncHandler(
    async (req, res) => {
        const userId = (req.user?._id as any).toString();
        const body = createNoteSchema.parse(req.body);

        const note = await createNoteService(userId, body);

        return res.status(HTTP_STATUS.CREATED).json({
            success: true,
            message: "Tạo ghi chú thành công",
            note
        });
    }
);

export const updateNoteController = asyncHandler(
    async (req, res) => {
        const userId = (req.user?._id as any).toString();
        const noteId = noteIdSchema.parse(req.params.id);
        const body = updateNoteSchema.parse(req.body);

        const note = await updateNoteService(userId, noteId, body);

        return res.status(HTTP_STATUS.OK).json({
            success: true,
            message: "Cập nhật ghi chú thành công",
            note
        });
    }
);

export const deleteNoteController = asyncHandler(
    async (req, res) => {
        const userId = (req.user?._id as any).toString();
        const noteId = noteIdSchema.parse(req.params.id);

        await deleteNoteService(userId, noteId);

        return res.status(HTTP_STATUS.OK).json({
            success: true,
            message: "Xóa ghi chú thành công"
        });
    }
);
