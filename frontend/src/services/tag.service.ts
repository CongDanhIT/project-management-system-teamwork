import api from './api';

export interface Tag {
  _id: string;
  workspaceId: string;
  name: string;
  color: string;
  createdAt: string;
  updatedAt: string;
}

export const tagService = {
  getTags: async (workspaceId: string): Promise<Tag[]> => {
    const { data } = await api.get(`/workspace/${workspaceId}/tags`);
    return data.tags;
  },

  createTag: async (workspaceId: string, data: { name: string; color: string }): Promise<Tag> => {
    const res = await api.post(`/workspace/${workspaceId}/tags`, data);
    return res.data.tag;
  },

  updateTag: async (workspaceId: string, tagId: string, data: { name: string; color: string }): Promise<Tag> => {
    const res = await api.put(`/workspace/${workspaceId}/tags/${tagId}`, data);
    return res.data.tag;
  },

  deleteTag: async (workspaceId: string, tagId: string): Promise<void> => {
    const res = await api.delete(`/workspace/${workspaceId}/tags/${tagId}`);
    return res.data;
  }
};
