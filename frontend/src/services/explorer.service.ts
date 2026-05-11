import api from "./api";

export const getWorkspaceExplorer = async (workspaceId: string) => {
    const response = await api.get(`/workspace/${workspaceId}/explorer`);
    return response.data;
};
