import api from './api';

export interface Reaction {
  emoji: string;
  userIds: any[];
}

export interface Comment {
  _id: string;
  authorId: any;
  content: string;
  reactions: Reaction[];
  createdAt: string;
}

export interface Attachment {
  fileUrl: string;
  fileName: string;
  fileType: string;
}

export interface Announcement {
  _id: string;
  workspaceId: string;
  projectId?: string;
  type: "GENERAL" | "MILESTONE" | "ALERT";
  title: string;
  content: string;
  isPinned: boolean;
  attachments?: Attachment[];
  reactions: Reaction[];
  comments: Comment[];
  createdBy: any;
  createdAt: string;
  updatedAt: string;
}

export const announcementService = {
  getAnnouncements: async (workspaceId: string, projectId?: string, page = 1, limit = 20) => {
    const params = new URLSearchParams();
    if (projectId) params.append('projectId', projectId);
    params.append('page', page.toString());
    params.append('limit', limit.toString());

    const { data } = await api.get(`/workspace/${workspaceId}/announcements?${params.toString()}`);
    return data;
  },

  createAnnouncement: async (workspaceId: string, data: { type: string; title: string; content: string; projectId?: string; attachments?: Attachment[] }) => {
    const res = await api.post(`/workspace/${workspaceId}/announcements`, data);
    return res.data;
  },

  updateAnnouncement: async (workspaceId: string, announcementId: string, data: { title?: string; content?: string; attachments?: Attachment[] }) => {
    const res = await api.put(`/workspace/${workspaceId}/announcements/${announcementId}`, data);
    return res.data;
  },

  deleteAnnouncement: async (workspaceId: string, announcementId: string) => {
    const res = await api.delete(`/workspace/${workspaceId}/announcements/${announcementId}`);
    return res.data;
  },

  togglePin: async (workspaceId: string, announcementId: string) => {
    const res = await api.patch(`/workspace/${workspaceId}/announcements/${announcementId}/pin`);
    return res.data;
  },

  toggleReaction: async (workspaceId: string, announcementId: string, emoji: string) => {
    const res = await api.patch(`/workspace/${workspaceId}/announcements/${announcementId}/react`, { emoji });
    return res.data;
  },

  addComment: async (workspaceId: string, announcementId: string, content: string, replyTo?: string, mentions?: string[]) => {
    const res = await api.post(`/workspace/${workspaceId}/announcements/${announcementId}/comments`, { content, replyTo, mentions });
    return res.data;
  },

  deleteComment: async (workspaceId: string, announcementId: string, commentId: string) => {
    const res = await api.delete(`/workspace/${workspaceId}/announcements/${announcementId}/comments/${commentId}`);
    return res.data;
  },

  toggleCommentReaction: async (workspaceId: string, announcementId: string, commentId: string, emoji: string) => {
    const res = await api.patch(`/workspace/${workspaceId}/announcements/${announcementId}/comments/${commentId}/react`, { emoji });
    return res.data;
  }
};
