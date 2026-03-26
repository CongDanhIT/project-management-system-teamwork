import api from './api';
import { Task, TaskStatus } from '../types/task';

export const taskService = {
  getTasksByWorkspace: async (workspaceId: string, filters = {}) => {
    const response = await api.get(`/task/workspace/${workspaceId}/all`, {
      params: filters,
    });
    return response.data;
  },

  getProjectTasks: async (workspaceId: string, projectId: string) => {
    const response = await api.get(`/task/workspace/${workspaceId}/project/${projectId}/all`);
    return response.data.tasks as Task[];
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

  updateTask: async (workspaceId: string, projectId: string, taskId: string, data: Partial<Task>) => {
    const response = await api.put(`/task/workspace/${workspaceId}/project/${projectId}/update/${taskId}`, data);
    return response.data.task;
  },

  getTaskById: async (workspaceId: string, projectId: string, taskId: string) => {
    const response = await api.get(`/task/workspace/${workspaceId}/project/${projectId}/${taskId}`);
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
    return response.data.tasks as Task[];
  },

  restoreTask: async (workspaceId: string, taskId: string) => {
    const response = await api.patch(`/task/workspace/${workspaceId}/restore/${taskId}`);
    return response.data;
  },
};
