import api from "./api";

export const PhaseService = {
    getPhases: async (projectId: string) => {
        const response = await api.get(`/phase/project/${projectId}`);
        return response.data;
    },

    createPhase: async (data: any) => {
        const response = await api.post("/phase", data);
        return response.data;
    },

    updatePhase: async (phaseId: string, data: any) => {
        const response = await api.put(`/phase/${phaseId}`, data);
        return response.data;
    },

    deletePhase: async (phaseId: string) => {
        const response = await api.delete(`/phase/${phaseId}`);
        return response.data;
    },

    restorePhase: async (phaseId: string) => {
        const response = await api.post(`/phase/${phaseId}/restore`);
        return response.data;
    },

    getDeletedPhases: async (workspaceId: string) => {
        const response = await api.get(`/phase/workspace/${workspaceId}/deleted`);
        return response.data;
    },
    
    permanentDeletePhase: async (phaseId: string) => {
        const response = await api.delete(`/phase/${phaseId}/permanent`);
        return response.data;
    }
};
