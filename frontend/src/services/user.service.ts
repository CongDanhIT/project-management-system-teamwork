import api from './api';

export interface UpdateProfileData {
  name?: string;
  profilePicture?: string;
}

export interface ChangePasswordData {
  currentPassword?: string;
  newPassword?: string;
}

export const userService = {
  updateProfile: async (data: UpdateProfileData) => {
    const response = await api.put('/user/profile', data);
    return response.data;
  },

  changePassword: async (data: ChangePasswordData) => {
    const response = await api.put('/user/change-password', data);
    return response.data;
  },

  switchWorkspace: async (workspaceId: string) => {
    const response = await api.patch(`/user/workspace/switch/${workspaceId}`);
    return response.data;
  },

  uploadAvatar: async (file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);
    const response = await api.post('/user/upload-avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data as { url: string };
  }
};
