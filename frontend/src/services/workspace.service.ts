import api from './api';

export interface WorkspaceAnalytics {
  totalTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
  completedTasks: number;
  nearDueDateTasks: any[];
  summary: {
    completionRate: number;
  };
}

export interface Workspace {
  _id: string;
  name: string;
  description?: string;
  inviteCode: string;
  owner: string;
  members: any[];
  createdAt: string;
  updatedAt: string;
}

export const workspaceService = {
  getWorkspaces: async () => {
    const response = await api.get('/workspace/all');
    return response.data.workspaces as Workspace[];
  },

  getWorkspaceById: async (id: string) => {
    const response = await api.get(`/workspace/${id}`);
    return response.data.workspace as Workspace;
  },

  getWorkspaceAnalytics: async (id: string) => {
    const response = await api.get(`/workspace/analytics/${id}`);
    return response.data.analytics as WorkspaceAnalytics;
  },

  createWorkspace: async (data: { name: string; description?: string }) => {
    console.log('Creating workspace with data:', data);
    try {
      const response = await api.post('/workspace/create/new', data);
      console.log('Create workspace response:', response.data);
      return response.data.workspace as Workspace;
    } catch (error: any) {
      console.error('Create workspace API error:', error.response?.data || error);
      throw error;
    }
  },

  updateWorkspace: async (id: string, data: { name?: string; description?: string }) => {
    const response = await api.put(`/workspace/update/${id}`, data);
    return response.data.workspace as Workspace;
  },

  deleteWorkspace: async (id: string) => {
    const response = await api.delete(`/workspace/delete/${id}`);
    return response.data;
  },

  getMembers: async (workspaceId: string) => {
    const response = await api.get(`/workspace/member/${workspaceId}`);
    return response.data as { members: any[]; roles: any[] };
  },

  changeMemberRole: async (workspaceId: string, memberId: string, roleId: string) => {
    const response = await api.put(`/workspace/change/member/role/${workspaceId}`, { memberId, roleId });
    return response.data;
  },

  removeMember: async (workspaceId: string, memberId: string) => {
    const response = await api.delete(`/workspace/${workspaceId}/member/${memberId}`);
    return response.data;
  },

  resetInviteCode: async (workspaceId: string) => {
    const response = await api.put(`/workspace/${workspaceId}/invite-code`);
    return response.data as { inviteCode: string };
  },

  joinWorkspace: async (inviteCode: string) => {
    const response = await api.post(`/member/workspace/${inviteCode}/join`);
    return response.data;
  },
};
