import api from './api';

export const interactionService = {
  /**
   * Lấy danh sách bình luận của Task
   */
  getComments: async (taskId: string) => {
    const response = await api.get(`/interaction/task/${taskId}/comments`);
    return response.data.data;
  },

  /**
   * Đăng bình luận mới
   */
  createComment: async (workspaceId: string, taskId: string, data: {
    content: string;
    replyTo?: string;
    mentions?: string[];
  }) => {
    const response = await api.post(`/interaction/workspace/${workspaceId}/task/${taskId}/comments`, data);
    return response.data.data;
  },

  /**
   * Lấy danh sách thông báo
   */
  getNotifications: async (workspaceId: string) => {
    const response = await api.get(`/interaction/workspace/${workspaceId}/notifications`);
    return response.data.data;
  },

  /**
   * Đánh dấu thông báo đã đọc
   */
  markAsRead: async (notificationId: string) => {
    const response = await api.patch(`/interaction/notifications/${notificationId}/read`);
    return response.data.data;
  },
  
  /**
   * Xóa bình luận
   */
  deleteComment: async (commentId: string) => {
    const response = await api.delete(`/interaction/comments/${commentId}`);
    return response.data;
  },

  /**
   * Thả cảm xúc
   */
  toggleReaction: async (commentId: string, emoji: string) => {
    const response = await api.post(`/interaction/comments/${commentId}/reaction`, { emoji });
    return response.data;
  },

  /**
   * Đánh dấu tất cả thông báo là đã đọc
   */
  markAllAsRead: async (workspaceId: string) => {
    const response = await api.patch('/interaction/notifications/mark-all-read', { workspaceId });
    return response.data;
  },

  /**
   * Lấy thông báo phân trang
   */
  getPaginatedNotifications: async (workspaceId: string, page: number = 1, limit: number = 20, type?: string) => {
    const response = await api.get(`/interaction/workspace/${workspaceId}/notifications/paginated`, {
      params: { page, limit, type }
    });
    return response.data.data;
  },
};
