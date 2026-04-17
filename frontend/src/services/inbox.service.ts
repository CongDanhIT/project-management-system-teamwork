import api from "./api";

export interface IInboxDraft {
    _id: string;
    title: string;
    description?: string;
    sourceType: string;
    status: string;
    createdAt: string;
    updatedAt: string;
}

const getMyDrafts = async (): Promise<IInboxDraft[]> => {
    const response = await api.get("/inbox");
    return response.data.drafts;
};

const createDraft = async (data: { title: string; description?: string }): Promise<IInboxDraft> => {
    const response = await api.post("/inbox", data);
    return response.data.draft;
};

const promoteToTask = async (
    inboxId: string,
    workspaceId: string,
    projectId: string,
    status: string
) => {
    const response = await api.post(`/inbox/${inboxId}/promote`, {
        workspaceId,
        projectId,
        status
    });
    return response.data;
};

const deleteDraft = async (inboxId: string) => {
    const response = await api.delete(`/inbox/${inboxId}`);
    return response.data;
};

export const inboxService = {
    getMyDrafts,
    createDraft,
    promoteToTask,
    deleteDraft
};
