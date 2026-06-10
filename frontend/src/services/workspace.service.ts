import api from './api';

export interface WorkspaceAnalyticsTrend {
  value: number;
  percent: number;
}

export interface WorkspaceAnalytics {
  totalTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
  completedTasks: number;
  nearDueDateTasks: any[];
  summary: {
    completionRate: number;
  };
  trends: {
    totalTasksTrend: WorkspaceAnalyticsTrend;
    completedTasksTrend: WorkspaceAnalyticsTrend;
    inProgressTasksTrend: WorkspaceAnalyticsTrend;
    overdueTasksTrend: WorkspaceAnalyticsTrend;
  };
}

export interface WorkspaceAnalyticsSnapshot {
  _id: string;
  workspaceId: string;
  date: string;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
  totalProjects: number;
}



export interface Workspace {
  _id: string;
  name: string;
  description?: string;
  inviteCode: string;
  owner: string;
  members: any[];
  slackWebhookUrl?: string | null;
  dailyDigestEnabled: boolean;
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

  getWorkspaceAnalytics: async (id: string, projectIds?: string[], timeFilters?: { year?: number, month?: number, quarter?: number }) => {
    const response = await api.get(`/workspace/analytics/${id}`, {
      params: { 
        projectIds: projectIds?.join(','),
        year: timeFilters?.year,
        month: timeFilters?.month,
        quarter: timeFilters?.quarter
      }
    });
    return response.data.analytics as WorkspaceAnalytics;
  },

  getWorkspaceAnalyticsHistory: async (id: string, projectIds?: string[], timeFilters?: { year?: number, month?: number, quarter?: number }) => {
    const response = await api.get(`/workspace/analytics/history/${id}`, {
      params: { 
        projectIds: projectIds?.join(','),
        year: timeFilters?.year,
        month: timeFilters?.month,
        quarter: timeFilters?.quarter
      }
    });
    return response.data.history as WorkspaceAnalyticsSnapshot[];
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

  updateWorkspace: async (id: string, data: { name?: string; description?: string; slackWebhookUrl?: string | null; dailyDigestEnabled?: boolean }) => {
    const response = await api.put(`/workspace/update/${id}`, data);
    return response.data.workspace as Workspace;
  },

  deleteWorkspace: async (id: string) => {
    const response = await api.delete(`/workspace/delete/${id}`);
    return response.data;
  },

  getMembers: async (workspaceId: string, projectIds?: string[], timeFilters?: { year?: number, month?: number, quarter?: number }) => {
    const response = await api.get(`/workspace/member/${workspaceId}`, {
      params: { 
        projectIds: projectIds?.join(','),
        year: timeFilters?.year,
        month: timeFilters?.month,
        quarter: timeFilters?.quarter
      }
    });
    return response.data;
  },

  changeMemberRole: async (workspaceId: string, memberId: string, roleId: string) => {
    const response = await api.put(`/workspace/change/member/role/${workspaceId}`, { memberId, roleId });
    return response.data;
  },

  removeMember: async (workspaceId: string, memberId: string) => {
    const response = await api.delete(`/workspace/${workspaceId}/member/${memberId}`);
    return response.data;
  },

  updateMemberSkills: async (workspaceId: string, memberId: string, skillTags: string[]) => {
    const response = await api.put(`/workspace/${workspaceId}/member/${memberId}/skills`, { skillTags });
    return response.data;
  },

  leaveWorkspace: async (workspaceId: string) => {
    const response = await api.post(`/workspace/${workspaceId}/leave`);
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

  triggerSlackTest: async (workspaceId: string) => {
    const response = await api.post(`/workspace/${workspaceId}/trigger-slack-test`);
    return response.data;
  },

  startVideoCall: async (workspaceId: string) => {
    const response = await api.post(`/workspace/${workspaceId}/call/start`);
    return response.data;
  },

  endVideoCall: async (workspaceId: string) => {
    const response = await api.post(`/workspace/${workspaceId}/call/end`);
    return response.data;
  },

  triggerEmailTest: async () => {
    const response = await api.post(`/workspace/trigger-email-test`);
    return response.data;
  },
};
