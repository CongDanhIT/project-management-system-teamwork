import api from "./api";

export interface IPersonalNote {
    _id: string;
    workspaceId: string;
    ownerId: string;
    title: string;
    description?: string;
    color: string;
    isPinned: boolean;
    createdAt: string;
    updatedAt: string;
}

const getNotesByWorkspace = async (workspaceId: string): Promise<IPersonalNote[]> => {
    const response = await api.get(`/personal-note/workspace/${workspaceId}`);
    return response.data.notes;
};

const createNote = async (data: { workspaceId: string; title: string; description?: string; color?: string }): Promise<IPersonalNote> => {
    const response = await api.post("/personal-note", data);
    return response.data.note;
};

const updateNote = async (noteId: string, data: { title?: string; description?: string; color?: string; isPinned?: boolean }): Promise<IPersonalNote> => {
    const response = await api.patch(`/personal-note/${noteId}`, data);
    return response.data.note;
};

const deleteNote = async (noteId: string): Promise<any> => {
    const response = await api.delete(`/personal-note/${noteId}`);
    return response.data;
};

export const personalNoteService = {
    getNotesByWorkspace,
    createNote,
    updateNote,
    deleteNote
};
