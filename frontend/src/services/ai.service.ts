import api from "./api";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ProjectAiContext {
  workspaceName?: string;
  projectName?: string;
  totalTasks?: number;
  doneTasks?: number;
  inProgressTasks?: number;
  overdueTasks?: number;
  memberCount?: number;
}

export interface AiAgentContext {
  workspaceId?: string;
  projectId?: string;
  phaseId?: string;
}

export interface AiTask {
  title: string;
  description: string;
  priority: "LOW" | "MEDIUM" | "HIGH";
  estimatedHours: number;
}

export interface AiPhase {
  name: string;
  description: string;
  color: string;
  tasks: AiTask[];
}

export interface AiProjectStructure {
  phases: AiPhase[];
}

/**
 * [AI Feature 1] Gợi ý mô tả task từ tiêu đề
 */
export const suggestTaskDescription = async (title: string): Promise<string> => {
  const response = await api.post("/ai/suggest-description", { title });
  return response.data.description as string;
};

/**
 * [AI Feature 2] Gợi ý danh sách subtask từ tiêu đề task cha
 */
export const suggestSubtasks = async (parentTitle: string): Promise<string[]> => {
  const response = await api.post("/ai/suggest-subtasks", { parentTitle });
  return response.data.subtasks as string[];
};

/**
 * [AI Feature 3] Gửi tin nhắn đến AI Chat với context project
 */
export const sendAiChatMessage = async (
  message: string,
  history: ChatMessage[],
  context: ProjectAiContext = {},
  modelId?: string
): Promise<string> => {
  const response = await api.post("/ai/chat", { message, history, context, modelId });
  return response.data.reply as string;
};

/**
 * [AI Feature - Sprint 6] Phân rã dự án thông minh
 */
export const generateAiProjectPlan = async (
  workspaceId: string, 
  projectId: string, 
  prompt: string
): Promise<AiProjectStructure> => {
  const response = await api.post("/ai/generate-plan", { workspaceId, projectId, prompt });
  return response.data.structure;
};

/**
 * [AI Feature - Sprint 6] Áp dụng kế hoạch AI vào database
 */
export const applyAiProjectPlan = async (
  workspaceId: string, 
  projectId: string, 
  structure: AiProjectStructure
) => {
  const response = await api.post("/ai/apply-plan", { workspaceId, projectId, structure });
  return response.data;
};
