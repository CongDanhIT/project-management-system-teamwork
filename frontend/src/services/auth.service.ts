import api from './api';

export interface LoginResponse {
  success: boolean;
  message: string;
  user: {
    _id: string;
    name: string;
    email: string;
    profilePicture?: string;
    currentWorkspace?: string;
  };
}

export interface RegisterResponse {
  message: string;
  data: {
    id: string;
    name: string;
    email: string;
  };
}

export const authService = {
  login: async (credentials: any): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/auth/login', credentials);
    return response.data;
  },

  register: async (userData: any): Promise<RegisterResponse> => {
    const response = await api.post<RegisterResponse>('/auth/register', userData);
    return response.data;
  },

  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
  },

  getCurrentUser: async (): Promise<any> => {
    const response = await api.get('/user/current');
    return response.data;
  },
};
