import api from "./api"; // Assuming there's a base api instance

const BASE_URL = "/workflow";

export const workflowApi = {
  getWorkflowsByProject: async (projectId: string) => {
    const response = await api.get(`${BASE_URL}/project/${projectId}`);
    return response.data;
  },

  getWorkflowById: async (id: string) => {
    const response = await api.get(`${BASE_URL}/${id}`);
    return response.data;
  },

  createWorkflow: async (data: any) => {
    const response = await api.post(BASE_URL, data);
    return response.data;
  },

  updateWorkflow: async (id: string, data: any) => {
    const response = await api.put(`${BASE_URL}/${id}`, data);
    return response.data;
  },

  deleteWorkflow: async (id: string) => {
    const response = await api.delete(`${BASE_URL}/${id}`);
    return response.data;
  },

  testWorkflowTrigger: async (workflowId: string, taskId: string) => {
    const response = await api.post(`${BASE_URL}/test`, { workflowId, taskId });
    return response.data;
  }
};
