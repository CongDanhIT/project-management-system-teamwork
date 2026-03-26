import api from './api';

export interface Project {
  _id: string;
  name: string;
  description?: string;
  emoji?: string;
  workspaceId: string;
  createdBy: {
    _id: string;
    name: string;
    profilePicture?: string;
  };
  createdAt: string;
  updatedAt: string;
  startDate?: string | null;
  endDate?: string | null;
  status?: 'PLANNING' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'FROZEN';
  deletedAt?: string | null;
}

export const projectService = {
  getProjectsByWorkspace: async (workspaceId: string, page = 1, limit = 10) => {
    const response = await api.get(`/project/workspace/${workspaceId}/all`, {
      params: { pageNumber: page, pageSize: limit },
    });
    return response.data;
  },

  getProjectById: async (workspaceId: string, projectId: string) => {
    const response = await api.get(`/project/workspace/${workspaceId}/${projectId}`);
    return response.data.project as Project;
  },

  getProjectAnalytics: async (workspaceId: string, projectId: string) => {
    const response = await api.get(`/project/workspace/${workspaceId}/analytics/${projectId}`);
    return response.data.analytics;
  },

  createProject: async (workspaceId: string, data: { name: string; description?: string; emoji?: string; startDate?: Date; endDate?: Date; status?: string }) => {
    const response = await api.post(`/project/workspace/${workspaceId}/create`, data);
    return response.data.project;
  },

  updateProject: async (workspaceId: string, projectId: string, data: Partial<Project>) => {
    const response = await api.put(`/project/workspace/${workspaceId}/update/${projectId}`, data);
    return response.data.project;
  },

  deleteProject: async (workspaceId: string, projectId: string) => {
    const response = await api.delete(`/project/workspace/${workspaceId}/delete/${projectId}`);
    return response.data;
  },

  getDeletedProjects: async (workspaceId: string) => {
    const response = await api.get(`/project/workspace/${workspaceId}/deleted`);
    return response.data.projects as Project[];
  },

  restoreProject: async (workspaceId: string, projectId: string) => {
    const response = await api.patch(`/project/workspace/${workspaceId}/restore/${projectId}`);
    return response.data.project as Project;
  },
};
