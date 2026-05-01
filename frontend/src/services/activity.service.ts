import API from "./api";

export const activityService = {
  /**
   * Lấy nhật ký hoạt động của Workspace
   */
  getWorkspaceActivity: async (workspaceId: string, page: number = 1, limit: number = 20, filters: any = {}) => {
    const response = await API.get(`/activity/workspace/${workspaceId}`, {
      params: { page, limit, ...filters }
    });
    return response.data;
  },

  /**
   * Lấy thống kê hoạt động (Heatmap)
   */
  getWorkspaceActivityStatistics: async (workspaceId: string) => {
    const response = await API.get(`/activity/statistics/${workspaceId}`);
    return response.data;
  }
};

