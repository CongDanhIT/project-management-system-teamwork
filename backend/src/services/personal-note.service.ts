import mongoose from "mongoose";
import PersonalNoteModel from "../models/personal-note.model";

/**
 * Lấy danh sách ghi chú của người dùng trong workspace
 */
export const getNotesByWorkspaceService = async (ownerId: string, workspaceId: string) => {
    return await PersonalNoteModel.find({
        ownerId: new mongoose.Types.ObjectId(ownerId),
        workspaceId: new mongoose.Types.ObjectId(workspaceId),
    }).sort({ isPinned: -1, createdAt: -1 });
};

/**
 * Tạo một ghi chú mới
 */
export const createNoteService = async (
    ownerId: string,
    data: {
        workspaceId: string;
        title: string;
        description?: string;
        color?: string;
        isPinned?: boolean;
    }
) => {
    const note = new PersonalNoteModel({
        ownerId: new mongoose.Types.ObjectId(ownerId),
        workspaceId: new mongoose.Types.ObjectId(data.workspaceId),
        title: data.title,
        description: data.description || "",
        color: data.color || "#fef08a",
        isPinned: data.isPinned || false,
    });
    return await note.save();
};

/**
 * Cập nhật một ghi chú
 */
export const updateNoteService = async (
    ownerId: string,
    noteId: string,
    data: {
        title?: string;
        description?: string;
        color?: string;
        isPinned?: boolean;
    }
) => {
    const note = await PersonalNoteModel.findOneAndUpdate(
        {
            _id: new mongoose.Types.ObjectId(noteId),
            ownerId: new mongoose.Types.ObjectId(ownerId),
        },
        {
            $set: data
        },
        { new: true }
    );

    if (!note) {
        throw new Error("Không tìm thấy ghi chú để cập nhật.");
    }

    return note;
};

/**
 * Xóa một ghi chú
 */
export const deleteNoteService = async (ownerId: string, noteId: string) => {
    const note = await PersonalNoteModel.findOneAndDelete({
        _id: new mongoose.Types.ObjectId(noteId),
        ownerId: new mongoose.Types.ObjectId(ownerId),
    });

    if (!note) {
        throw new Error("Không tìm thấy ghi chú để xóa.");
    }

    return note;
};
