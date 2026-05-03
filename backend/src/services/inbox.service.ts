import mongoose from "mongoose";
import PersonalInboxModel from "../models/inbox.model";
import { InboxStatusEnum, InboxSourceTypeEnum } from "../enums/inbox.enum";
import { createTaskService } from "./task.service";

/**
 * Lấy danh sách drafts của người dùng
 */
export const getMyDraftsService = async (ownerId: string) => {
    return await PersonalInboxModel.find({
        ownerId: new mongoose.Types.ObjectId(ownerId),
        status: InboxStatusEnum.DRAFT,
    }).sort({ createdAt: -1 });
};

/**
 * Tạo một bản ghi nháp mới
 */
export const createDraftService = async (
    ownerId: string, 
    data: { 
        title: string; 
        description?: string; 
        sourceType?: string; 
        sourceMetadata?: any 
    }
) => {
    const draft = new PersonalInboxModel({
        ownerId: new mongoose.Types.ObjectId(ownerId),
        title: data.title,
        description: data.description || "",
        sourceType: data.sourceType || InboxSourceTypeEnum.MANUAL,
        sourceMetadata: data.sourceMetadata || {},
    });
    return await draft.save();
};

/**
 * Chuyển đổi Draft thành Task chính thức
 */
export const promoteDraftToTaskService = async (
    ownerId: string,
    inboxId: string,
    workspaceId: string,
    projectId: string,
    phaseId: string | undefined,
    status: string
) => {
    // 1. Tìm bản ghi draft
    const draft = await PersonalInboxModel.findOne({
        _id: new mongoose.Types.ObjectId(inboxId),
        ownerId: new mongoose.Types.ObjectId(ownerId),
        status: InboxStatusEnum.DRAFT,
    });

    if (!draft) {
        throw new Error("Không tìm thấy bản ghi nháp hoặc bản ghi đã được chuyển đổi.");
    }

    // 2. Chuyển đổi thành Task
    // Lưu ý: createTaskService yêu cầu workspaceId, projectId, body (title, description...), userId
    const task = await createTaskService(
        workspaceId,
        projectId,
        {
            title: draft.title,
            description: draft.description,
            status: status, // Trạng thái dựa trên cột được thả vào
            phaseId: phaseId, // Giai đoạn dựa trên board hiện tại
        },
        ownerId
    );

    // 3. Cập nhật trạng thái Inbox Item
    draft.status = InboxStatusEnum.PROMOTED;
    await draft.save();

    return {
        task,
        inboxItem: draft,
    };
};

/**
 * Xóa một bản ghi nháp
 */
export const deleteDraftService = async (ownerId: string, inboxId: string) => {
    const draft = await PersonalInboxModel.findOneAndDelete({
        _id: new mongoose.Types.ObjectId(inboxId),
        ownerId: new mongoose.Types.ObjectId(ownerId),
    });

    if (!draft) {
        throw new Error("Không tìm thấy bản ghi nháp để xóa.");
    }

    return draft;
};

/**
 * Cập nhật một bản ghi nháp
 */
export const updateDraftService = async (
    ownerId: string, 
    inboxId: string, 
    data: { title?: string; description?: string }
) => {
    const draft = await PersonalInboxModel.findOneAndUpdate(
        {
            _id: new mongoose.Types.ObjectId(inboxId),
            ownerId: new mongoose.Types.ObjectId(ownerId),
            status: InboxStatusEnum.DRAFT
        },
        {
            $set: data
        },
        { new: true }
    );

    if (!draft) {
        throw new Error("Không tìm thấy bản ghi nháp để cập nhật.");
    }

    return draft;
};
