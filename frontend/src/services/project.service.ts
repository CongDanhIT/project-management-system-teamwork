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
  lastAccessedAt?: string;
  status?: 'PLANNING' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'FROZEN';
  deletedAt?: string | null;
  totalTasks?: number;
  completedTasks?: number;
  members?: {
    userId: {
      _id: string;
      name: string;
      profilePicture?: string;
    };
    role: string;
  }[];
  coverUrl?: string;
  coverPositionX: number;
  coverPositionY: number;
  favoritedBy?: string[];
  isAutoTaggingEnabled?: boolean;
}

export const projectService = {
  getProjectsByWorkspace: async (workspaceId: string, page = 1, limit = 10, timeFilters?: { year?: number, month?: number, quarter?: number }) => {
    const response = await api.get(`/project/workspace/${workspaceId}/all`, {
      params: { 
        pageNumber: page, 
        pageSize: limit,
        year: timeFilters?.year,
        month: timeFilters?.month,
        quarter: timeFilters?.quarter
      },
    });
    return response.data;
  },

  getProjectById: async (workspaceId: string, projectId: string) => {
    const response = await api.get(`/project/workspace/${workspaceId}/${projectId}`);
    return response.data.project as Project;
  },

  getProjectAnalytics: async (workspaceId: string, projectId: string, phaseId?: string) => {
    const response = await api.get(`/project/workspace/${workspaceId}/analytics/${projectId}`, {
      params: { phaseId }
    });
    return response.data.analytics;
  },

  getProjectAnalyticsHistory: async (workspaceId: string, projectId: string) => {
    const response = await api.get(`/project/workspace/${workspaceId}/analytics/history/${projectId}`);
    return response.data.history;
  },

  createProject: async (workspaceId: string, data: { name: string; description?: string; emoji?: string; startDate?: Date; endDate?: Date; status?: string; coverUrl?: string; coverPositionX?: number; coverPositionY?: number; isAutoTaggingEnabled?: boolean }) => {
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

  permanentDeleteProject: async (workspaceId: string, projectId: string) => {
    const response = await api.delete(`/project/workspace/${workspaceId}/hard-delete/${projectId}`);
    return response.data;
  },
  
  toggleFavorite: async (workspaceId: string, projectId: string) => {
    const response = await api.patch(`/project/workspace/${workspaceId}/favorite/${projectId}`);
    return response.data;
  },

  getFavoriteProjects: async (workspaceId: string) => {
    const response = await api.get(`/project/workspace/${workspaceId}/favorites/all`);
    return response.data.projects as Project[];
  },

  getProjectWhiteboard: async (workspaceId: string, projectId: string) => {
    const response = await api.get(`/project/workspace/${workspaceId}/whiteboard/${projectId}`);
    return response.data.data;
  },

  saveProjectWhiteboard: async (workspaceId: string, projectId: string, elements: any[], appState: any, files: any) => {
    const response = await api.put(`/project/workspace/${workspaceId}/whiteboard/${projectId}`, { elements, appState, files });
    return response.data.data;
  },
};
