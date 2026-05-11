import api from "./api";

export const getWorkspaceRoadmap = async (workspaceId: string) => {
    const response = await api.get(`/workspace/${workspaceId}/roadmap`);
    return response.data;
};
