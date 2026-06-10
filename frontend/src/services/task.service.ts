import api from './api';
import { Task, TaskStatus } from '../types/task';

// [MULTI-ASSIGNEE] DTO riêng cho update - gửi ID thay vì object đầy đủ
export interface UpdateTaskRequest extends Omit<Partial<Task>, 'assignedTo' | 'tags'> {
  assignedTo?: string[];
  tags?: string[];
}

export const taskService = {
  getTasksByWorkspace: async (workspaceId: string, filters = {}) => {
    const response = await api.get(`/task/workspace/${workspaceId}/all`, {
      params: filters,
    });
    return response.data;
  },

  getProjectTasks: async (workspaceId: string, projectId: string, filters: any = { page: 1, pageSize: 10 }) => {
    const response = await api.get(`/task/workspace/${workspaceId}/project/${projectId}/all`, {
      params: filters
    });
    return response.data as { tasks: Task[], pagination?: { totalPages: number, totalCount: number, currentPage: number } };
  },

  updateTaskStatus: async (workspaceId: string, projectId: string, taskId: string, status: TaskStatus) => {
    const response = await api.put(`/task/workspace/${workspaceId}/project/${projectId}/update/${taskId}`, {
      status,
    });
    return response.data.task;
  },

  createTask: async (workspaceId: string, projectId: string, data: Partial<Task>) => {
    const response = await api.post(`/task/workspace/${workspaceId}/project/${projectId}/create`, data);
    return response.data.task;
  },

  getSmartAssign: async (workspaceId: string, projectId: string, taskId: string) => {
    const response = await api.get(`/task/workspace/${workspaceId}/project/${projectId}/task/${taskId}/smart-assign`);
    return response.data;
  },

  updateTask: async (workspaceId: string, projectId: string, taskId: string, data: UpdateTaskRequest) => {
    const response = await api.put(`/task/workspace/${workspaceId}/project/${projectId}/update/${taskId}`, data);
    return response.data.task;
  },

  getTaskById: async (workspaceId: string, projectId: string, taskId: string) => {
    // Nếu projectId là 'any' hoặc không có, sử dụng route generic
    const url = (projectId && projectId !== 'any') 
      ? `/task/workspace/${workspaceId}/project/${projectId}/${taskId}`
      : `/task/workspace/${workspaceId}/task/${taskId}`;
    const response = await api.get(url);
    return response.data.task as Task;
  },

  deleteTask: async (workspaceId: string, projectId: string, taskId: string) => {
    const response = await api.delete(`/task/workspace/${workspaceId}/delete/${taskId}`);
    return response.data;
  },

  getSubtasks: async (workspaceId: string, parentId: string, page = 1, limit = 4) => {
    const response = await api.get(`/task/workspace/${workspaceId}/subtasks/${parentId}`, {
      params: { page, limit }
    });
    return response.data;
  },

  getDeletedTasks: async (workspaceId: string) => {
    const response = await api.get(`/task/workspace/${workspaceId}/deleted/all`);
    // Backend trả về mảng trực tiếp hoặc { tasks: [] }
    return (response.data.tasks || response.data) as Task[];
  },

  restoreTask: async (workspaceId: string, taskId: string) => {
    const response = await api.patch(`/task/workspace/${workspaceId}/restore/${taskId}`);
    return response.data;
  },

  hardDeleteTask: async (workspaceId: string, taskId: string) => {
    const response = await api.delete(`/task/workspace/${workspaceId}/hard-delete/${taskId}`);
    return response.data;
  },
};
